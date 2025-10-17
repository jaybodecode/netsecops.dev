# Step 6 Implementation Complete - Generate Publication

## ✅ What We Built

### 1. Core Implementation: `generate-publication.ts`
Complete Step 6 implementation that:
- Loads resolution decisions from `article_resolutions` table
- Loads publication candidate from `structured_news` table
- Handles SKIP articles by regenerating headline/summary (not slug!)
- Creates normalized database records in 4 tables
- Properly handles NEW vs UPDATE articles

### 2. TypeScript Schema: `publication-output-schema.ts`
Complete type definitions for:
- `GeneratedPublication` - Final publication JSON structure
- `PublicationArticle` - Articles with update tracking
- `ArticleUpdate` - Update history entries
- Index file structures for publications and articles
- Helper functions for type conversion

## 🔑 Key Design Decisions

### Publication Slug is Deterministic
```typescript
// NOT from LLM!
const finalSlug = `${pubType}_threat_publications_${pubDate}`;
// Examples:
// - daily_threat_publications_2025-10-09
// - weekly_threat_publications_2025-10-20
```

**Why:** Full control over URL structure, no LLM inconsistency

### Only Headline/Summary Regenerated for SKIPs
```typescript
if (skipCount > 0) {
  // LLM regenerates headline + summary (NOT slug)
  const regenerated = await regeneratePublicationMetadata(...);
  finalHeadline = regenerated.headline;
  finalSummary = regenerated.summary;
  // finalSlug stays deterministic!
}
```

**Why:** Slug must be predictable for deployment automation

### Schema Fields
LLM generates (in `structured_news`):
- `headline` - Breaking news headline
- `summary` - Overall cybersecurity situation
- `pub_id` - UUID
- `total_articles` - Count
- `articles[]` - Array of articles
- `generated_at` - Timestamp
- `date_range` - Date range covered

Step 6 adds:
- `slug` - Deterministic URL slug
- `type` - daily/weekly/monthly
- `meta` - Generation statistics

## 📊 Database Tables Created

### `publications`
```sql
CREATE TABLE publications (
  id TEXT PRIMARY KEY,              -- pub-2025-10-09
  pub_date TEXT NOT NULL UNIQUE,    -- 2025-10-09
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,        -- daily_threat_publications_2025-10-09
  article_count INTEGER DEFAULT 0
);
```

### `published_articles`
```sql
CREATE TABLE published_articles (
  id TEXT PRIMARY KEY,              -- canonical_article_id
  publication_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,        -- From articles_meta (NEVER changes)
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_report TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_update BOOLEAN DEFAULT 0,
  original_pub_date TEXT NOT NULL
);
```

### `publication_articles` (Many-to-Many)
```sql
CREATE TABLE publication_articles (
  publication_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT 1,     -- Original vs update
  PRIMARY KEY (publication_id, article_id)
);
```

### `article_updates` (Update History)
```sql
CREATE TABLE article_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,         -- ORIGINAL article ID
  update_date TEXT NOT NULL,
  update_summary TEXT NOT NULL,
  source_article_id TEXT NOT NULL,  -- NEW article UUID
  publication_id TEXT NOT NULL
);
```

## 🔄 Processing Flow

### NEW Articles
```typescript
1. Query articles_meta using canonical_article_id
2. Create published_articles entry with original data
3. Link to publication (is_primary = true)
```

### UPDATE Articles
```typescript
1. Query articles_meta for ORIGINAL article (canonical_article_id)
2. Get NEW article content from structured_news candidate
3. Check if original already published:
   - If NO: Create published_articles entry
   - If YES: Skip creation
4. Create article_updates entry with NEW content
5. Link to publication (is_primary = false)
```

## 🎯 Critical Rules Enforced

### Rule 1: UPDATE Articles Not in articles_meta
```typescript
// ❌ This will fail!
const article = getArticleMeta(resolution.article_id); // uuid-456 not indexed

// ✅ Correct!
const original = getArticleMeta(resolution.canonical_article_id); // uuid-123
const candidate = JSON.parse(getStructuredNewsByDate(pub_date).data);
const newContent = candidate.articles.find(a => a.id === resolution.article_id);
```

### Rule 2: Use canonical_article_id Always
```typescript
// For NEW
const article = getArticleMeta(resolution.canonical_article_id); // Same as article_id

// For UPDATE
const original = getArticleMeta(resolution.canonical_article_id); // ORIGINAL's ID
```

### Rule 3: Slugs NEVER Change
```typescript
// Publication slug: DETERMINISTIC
const pubSlug = `daily_threat_publications_${pubDate}`;

// Article slug: FROM articles_meta (indexed in Step 3)
const articleSlug = article.slug; // NEVER generate new!
```

## 📝 Usage

### Generate Publication
```bash
# Generate for specific date
npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-09

# Force re-generation
npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-09 --force
```

### View Results
```bash
# View publication
sqlite3 logs/content-generation-v2.db \
  "SELECT * FROM publications WHERE pub_date = '2025-10-09'"

# View articles
sqlite3 logs/content-generation-v2.db \
  "SELECT * FROM published_articles WHERE publication_id = 'pub-2025-10-09'"

# View updates
sqlite3 logs/content-generation-v2.db \
  "SELECT * FROM article_updates WHERE publication_id = 'pub-2025-10-09'"

# View article linkage
sqlite3 logs/content-generation-v2.db \
  "SELECT * FROM publication_articles WHERE publication_id = 'pub-2025-10-09'"
```

## 🧪 Testing

### Test Data Available
- **Dates**: Oct 7, 9, 10, 12, 14 (2025)
- **Articles**: 50+ indexed in articles_meta
- **Resolutions**: Decision data in article_resolutions
- **Candidates**: Publication candidates in structured_news

### Test Oct 9 (Known Data)
```bash
npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-09
```

Expected:
- 3 UPDATE articles (Redis, Cl0p, Storm-1175)
- 7 NEW articles
- 10 total published articles
- Update records for 3 articles

## 🚀 Next Steps (Step 7-8)

### Step 7: Generate JSON Files
- Query `publications` and `published_articles` with JOINs
- Generate `/public/data/publications/{slug}.json`
- Generate `/public/data/articles/{slug}.json`
- Use `publication-output-schema.ts` types

### Step 8: Generate Indexes
- Generate `/public/data/publications/index.json`
- Generate `/public/data/articles/index.json`
- Use index entry types from schema

## 📚 Documentation Reference

1. `ARTICLE-IDENTITY-STRATEGY.md` - Canonical article ID concept
2. `UPDATE-ARTICLE-INDEXING-RULE.md` - Why UPDATEs aren't indexed
3. `STEP6-PUBLICATION-GENERATION.md` - Complete Step 6 spec
4. `PIPELINE-OVERVIEW.md` - Full pipeline documentation

## ✅ Completion Checklist

- [x] CLI argument parsing with --date and --force
- [x] Resolution loading from database
- [x] Publication candidate loading
- [x] SKIP regeneration (headline/summary only)
- [x] Deterministic slug generation
- [x] Publications table creation
- [x] Published_articles table creation
- [x] Publication_articles linking
- [x] Article_updates tracking
- [x] NEW article processing
- [x] UPDATE article processing
- [x] Error handling and logging
- [x] TypeScript schema definition
- [x] Helper functions for type conversion
- [ ] Integration testing with Oct 9 data
- [ ] Documentation updates

## 🎉 Result

Step 6 is **COMPLETE** and ready for testing. The implementation:
- ✅ Follows all architectural rules
- ✅ Uses normalized database design
- ✅ Properly handles NEW/UPDATE/SKIP
- ✅ Maintains article identity with canonical IDs
- ✅ Generates deterministic slugs
- ✅ Compatible with website schema
- ✅ Ready for Steps 7-8 (JSON/index generation)
