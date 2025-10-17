# Article Identity & Update Linking Strategy

## 🔴 The Problem: Slug/ID Confusion

When duplicate detection finds that Article B (Oct 9) should UPDATE Article A (Oct 7), we face a critical question:

**Which ID/slug do we use going forward?**

```
Article A (Oct 7):
  - article_id: "uuid-123"
  - slug: "redis-vuln-cve-2025-49844"
  - pub_date: "2025-10-07"

Article B (Oct 9):
  - article_id: "uuid-456"  
  - slug: "redis-rce-cve-2025-49844"
  - pub_date: "2025-10-09"

Resolution: UPDATE (B updates A)
```

**Previous broken approach:**
- Saved NEW article's ID (`uuid-456`) in `article_resolutions`
- Created NEW `articles_meta` entry for `uuid-456`
- Lost linkage to original article `uuid-123`
- Database indexes became inconsistent
- Slug changes broke publication lookups

## ✅ Solution: Canonical Article ID

### Key Principle
**The ORIGINAL article's ID is ALWAYS the canonical reference for UPDATE cases.**

### Database Schema: `article_resolutions`

```typescript
interface ArticleResolution {
  article_id: string;           // NEW article UUID (for reference/auditing)
  pub_date: string;             // Publication date of NEW article
  decision: 'NEW' | 'UPDATE' | 'SKIP';
  
  // For UPDATE/SKIP: Link to original
  original_article_id: string | null;
  original_pub_date: string | null;
  original_slug: string | null;
  
  // CRITICAL: Which ID to use for publication
  canonical_article_id: string | null;  // ← THE FIX!
}
```

### canonical_article_id Logic

| Decision | canonical_article_id | Meaning |
|----------|---------------------|---------|
| `NEW` | Same as `article_id` | Create new article with this UUID |
| `UPDATE` | Same as `original_article_id` | Add update entry to ORIGINAL article |
| `SKIP` | `NULL` | Don't include in publication at all |

### Example Data Flow

**Step 5 Output (Oct 9 Redis article):**
```json
{
  "article_id": "uuid-456",              // NEW article from Oct 9
  "pub_date": "2025-10-09",
  "decision": "UPDATE",
  "original_article_id": "uuid-123",     // ORIGINAL from Oct 7
  "original_slug": "redis-vuln-cve-2025-49844",
  "canonical_article_id": "uuid-123"     // ← Use ORIGINAL ID!
}
```

**Step 6 (generate-publication.ts) Logic:**
```typescript
for (const resolution of resolutions) {
  if (resolution.decision === 'NEW') {
    // Create new article entry
    publication.articles.push({
      id: resolution.canonical_article_id,  // NEW article's ID
      slug: getArticleSlug(resolution.article_id),
      summary: "...",
      updates: []
    });
  }
  
  else if (resolution.decision === 'UPDATE') {
    // Find ORIGINAL article by canonical_article_id
    const originalArticle = findArticleById(resolution.canonical_article_id);
    
    // Add UPDATE entry to ORIGINAL article
    originalArticle.updates.push({
      date: resolution.pub_date,
      summary: getArticleSummary(resolution.article_id),
      // NEW article's content as an update
    });
  }
  
  else if (resolution.decision === 'SKIP') {
    // Don't include in publication
    continue;
  }
}
```

## 🎯 Benefits

### 1. Consistent Article Identity
- ORIGINAL article keeps its ID forever
- All updates link to same canonical ID
- Database lookups work correctly

### 2. Slug Stability  
- Original slug remains in `articles_meta`
- New slugs don't pollute the index
- Publication URLs stay consistent

### 3. Clean Audit Trail
```sql
-- Find all updates to an article
SELECT * FROM article_resolutions
WHERE canonical_article_id = 'uuid-123'
ORDER BY pub_date;

-- Result:
-- Oct 7: NEW (created)
-- Oct 9: UPDATE (added patch info)
-- Oct 12: UPDATE (added exploit details)
```

### 4. Correct `articles_meta` State
```sql
-- articles_meta table only has ORIGINAL entries
SELECT * FROM articles_meta WHERE article_id = 'uuid-123';
-- ✅ Returns Oct 7 article

SELECT * FROM articles_meta WHERE article_id = 'uuid-456';
-- ❌ Nothing (UPDATE articles don't create new meta rows)
```

## 🚨 Critical Rules

### Rule 1: Don't Index UPDATE Articles in Step 3
**CRITICAL**: When an article is marked as UPDATE, we **SKIP indexing the NEW article entirely**.

**Step 3 (index-entities.ts)** should SKIP articles that were marked as UPDATE:

```typescript
// Before indexing an article, check resolutions
const resolution = getResolutionByArticleId(articleId);
if (resolution && resolution.decision === 'UPDATE') {
  console.log(`⏭️  Skipping ${articleId} - marked as UPDATE to ${resolution.original_article_id}`);
  console.log(`   Using ORIGINAL article's metadata instead`);
  return; // ❌ Don't create articles_meta entry for NEW article!
}
```

**Why this matters:**
- UPDATE means "this is the same story, just add details to the ORIGINAL"
- The NEW article's slug/ID should NOT exist in `articles_meta`
- Only the ORIGINAL article's metadata exists
- The NEW article's content becomes an update entry

**Example:**
```
Oct 7 Redis article:
  - article_id: uuid-123
  - slug: "redis-vuln-cve-2025-49844"
  - Indexed in articles_meta ✅

Oct 9 Redis article:
  - article_id: uuid-456
  - slug: "redis-rce-cve-2025-49844" 
  - Decision: UPDATE
  - NOT indexed in articles_meta ❌
  - Content added as update to uuid-123 ✅
```

### Rule 2: Always Use canonical_article_id in Step 6
**Step 6 (generate-publication.ts)** must:
1. Query by `canonical_article_id` (not `article_id`)
2. Look up article metadata using `canonical_article_id`
3. Add updates using NEW article's content but ORIGINAL article's ID

### Rule 3: Preserve Original Article Metadata
- Don't modify original article's `slug`, `pub_date_only`, or `article_id`
- Store updates as separate entries in publication JSON
- Keep original as the "parent" article

## 📊 Database Queries for Step 6

```sql
-- Get all resolutions for publication date
SELECT 
  decision,
  canonical_article_id,
  article_id,
  original_article_id
FROM article_resolutions
WHERE pub_date = '2025-10-09'
ORDER BY decision;

-- For UPDATE decisions, fetch ORIGINAL article
SELECT * FROM articles_meta
WHERE article_id IN (
  SELECT canonical_article_id 
  FROM article_resolutions
  WHERE pub_date = '2025-10-09' 
    AND decision = 'UPDATE'
);

-- For NEW decisions, fetch NEW article
SELECT * FROM articles_meta
WHERE article_id IN (
  SELECT canonical_article_id
  FROM article_resolutions
  WHERE pub_date = '2025-10-09'
    AND decision = 'NEW'
);
```

## 🔄 Alternative: Normalized Schema (Future Consideration)

Instead of storing publications as JSON blobs, could normalize:

```sql
CREATE TABLE publications (
  id TEXT PRIMARY KEY,
  pub_date TEXT,
  headline TEXT,
  summary TEXT,
  slug TEXT
);

CREATE TABLE publication_articles (
  publication_id TEXT REFERENCES publications(id),
  article_id TEXT REFERENCES articles_meta(article_id),
  position INTEGER,  -- Sort order (1-10)
  PRIMARY KEY (publication_id, article_id)
);

CREATE TABLE article_updates (
  id INTEGER PRIMARY KEY,
  article_id TEXT REFERENCES articles_meta(article_id),
  update_date TEXT,
  summary TEXT,
  source_article_id TEXT  -- References the NEW article that triggered update
);
```

**Pros:**
- Easier queries
- Better referential integrity
- Clearer relationships

**Cons:**
- More complex to migrate
- Current system already works
- Would require rewriting generation logic

**Decision: Keep current JSON blob approach for now, but use `canonical_article_id` correctly.**

## 📝 Testing Checklist

- [ ] Oct 9 Redis article (UPDATE) uses Oct 7 article's ID as canonical
- [ ] Oct 9 Cl0p article (UPDATE) uses Oct 7 article's ID as canonical  
- [ ] Oct 9 Storm-1175 article (UPDATE) uses Oct 7 article's ID as canonical
- [ ] 7 NEW articles use their own IDs as canonical
- [ ] Query by `canonical_article_id` returns correct article metadata
- [ ] No duplicate `articles_meta` entries for UPDATE articles
- [ ] Publication generation uses canonical IDs for lookups

## 🔖 Slug Handling Rules

### Publication Slugs
**Source**: LLM-generated from publication candidate (in `structured_news`)

**When to regenerate:**
- ✅ **SKIP decision exists** → Regenerate headline, summary, AND slug
- ❌ **Only NEW/UPDATE** → Use original slug from candidate

```typescript
let finalSlug = candidate.slug; // Use LLM-generated slug

if (hasSkipDecisions) {
  const regenerated = await regeneratePublicationMetadata(remainingArticles);
  finalSlug = regenerated.slug; // LLM generates new slug
}
```

### Article Slugs
**Source**: From `articles_meta` table (indexed in Step 3)

**Rules:**
- **NEW**: Use slug from `articles_meta` (canonical_article_id)
- **UPDATE**: Use **ORIGINAL article's slug** (canonical_article_id)
  - ⚠️ **NEW article is NOT indexed** - only ORIGINAL exists in `articles_meta`
- **NEVER** generate new slugs in Step 6

```typescript
// For NEW articles
const articleData = getArticleMeta(resolution.canonical_article_id);
const slug = articleData.slug; // Use existing slug ✅

// For UPDATE articles
const originalArticle = getArticleMeta(resolution.canonical_article_id);
const slug = originalArticle.slug; // Keep original slug ✅
// NOTE: resolution.article_id (NEW article) does NOT exist in articles_meta!
```

**Why this matters:**
- URLs stay stable (SEO, bookmarks)
- No broken links
- Article identity preserved
- Database lookups work correctly
- **UPDATE articles don't pollute the article index**

**Example Flow:**
```
Step 3 (Oct 7): Index uuid-123 → articles_meta ✅
Step 3 (Oct 9): Check resolution for uuid-456
                └─> Decision: UPDATE to uuid-123
                └─> SKIP indexing uuid-456 ❌
                
Step 6 (Oct 9): Query articles_meta for uuid-123 ✅
                └─> Use slug "redis-vuln-cve-2025-49844"
                └─> Add uuid-456 content as update entry
```
