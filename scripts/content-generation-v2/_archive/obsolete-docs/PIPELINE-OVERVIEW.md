# Content Generation V2 - Complete Pipeline Overview

> **⚠️ PARTIAL DEPRECATION NOTICE - 2025-10-14**  
> **Step 4 (check-duplicates.ts) using entity-based weighted similarity is being replaced with SQLite FTS5 full-text search.**  
> **See: `FTS5-SIMILARITY-STRATEGY.md` for the new duplicate detection approach.**  
> **All other steps remain valid.**

## Pipeline Steps

### ✅ Step 1: Search Raw News (search-news.ts)
- Query Google News API for cybersecurity articles
- Store raw results in `raw_search` table
- **Status**: Complete ✅

### ✅ Step 2: Generate Publication Candidate (news-structured.ts)
- Use Gemini 1.5 Pro to structure raw articles
- Generate publication metadata (headline, summary, slug)
- Store in `structured_news` as JSON blob (publication candidate)
- **Status**: Complete ✅

### ✅ Step 3: Index Entities (index-entities.ts)
- Extract CVEs, threat actors, malware, products, companies
- Store in `articles_meta`, `article_cves`, `article_entities`
- **IMPORTANT**: Skip articles marked as UPDATE/SKIP in resolutions
- **Status**: Complete ✅

### 🔄 Step 4: Check Duplicates (check-duplicates.ts) - **BEING REPLACED**
> **⚠️ DEPRECATED**: Entity-based weighted similarity (6-dimensional Jaccard) is being replaced with SQLite FTS5 full-text search.  
> **Reason**: Weighted union matching with arbitrary thresholds does not scale reliably. False negatives on obvious duplicates (e.g., LockBit alliance articles scored 0.194 when should be >0.7).  
> **Replacement**: See `FTS5-SIMILARITY-STRATEGY.md`

- ~~Calculate 6-dimensional weighted Jaccard similarity~~
- ~~Classify: NEW (<0.35), BORDERLINE (0.35-0.70), UPDATE (≥0.70)~~
- **Status**: ⚠️ Deprecated - Do not use for new implementations

### ✅ Step 5: Resolve Duplicates (resolve-duplicates.ts)
- Use Gemini 2.5 Flash for BORDERLINE cases
- LLM decides: NEW, UPDATE, or SKIP
- Save decisions to `article_resolutions` with `canonical_article_id`
- **Status**: Complete ✅

### 🚧 Step 6: Generate Publication (generate-publication.ts)
- Load resolutions and publication candidate
- Check for SKIPs → regenerate headline/summary/slug if needed
- Create normalized database records:
  - `publications` table
  - `published_articles` table
  - `publication_articles` (many-to-many join)
  - `article_updates` (update history)
- **Status**: In Progress 🚧
- **Deliverable**: Normalized database with proper foreign keys

### 📋 Step 7: Generate RSS Feed (generate-rss.ts)
- Query `publications` and `published_articles` tables with SQL JOINs
- Generate RSS 2.0 XML feed for feed readers
- Include publication metadata and article summaries
- Support for article updates (show latest update date)

**Implementation Notes:**
- Reuse existing RSS generation code from current system
- Query pattern:
  ```sql
  SELECT p.*, pa.* 
  FROM publications p
  JOIN publication_articles pap ON p.id = pap.publication_id
  JOIN published_articles pa ON pap.article_id = pa.id
  ORDER BY p.pub_date DESC
  LIMIT 50
  ```
- RSS structure:
  ```xml
  <rss version="2.0">
    <channel>
      <item>
        <title>{publication.headline}</title>
        <link>https://netsecops.dev/publications/{slug}</link>
        <pubDate>{publication.pub_date}</pubDate>
        <description>{publication.summary}</description>
      </item>
    </channel>
  </rss>
  ```

**Benefits:**
- Easy with normalized database (no JSON parsing!)
- Fast queries with proper indexes
- Real-time updates when publications created
- Standard RSS 2.0 format for compatibility

**Status**: Not Started ⏸️

### 📋 Step 8: Generate Update Snapshot (generate-update-snapshot.ts)
- Daily snapshot for email subscription management
- Track what changed each day:
  - New publications created
  - New articles published
  - Existing articles updated (via canonical_article_id)
- Store in `update_snapshots` table

**Database Schema:**
```sql
CREATE TABLE update_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL UNIQUE,
  
  -- New content
  new_publication_ids TEXT,      -- JSON array of pub IDs
  new_article_ids TEXT,           -- JSON array of article IDs
  
  -- Updated content
  updated_article_ids TEXT,       -- JSON array of canonical IDs that got updates
  
  -- Summary
  new_publications_count INTEGER,
  new_articles_count INTEGER,
  updated_articles_count INTEGER,
  
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Implementation Logic:**
```typescript
async function generateUpdateSnapshot(date: string) {
  // 1. Get publications created today
  const newPublications = await db.query(`
    SELECT id FROM publications 
    WHERE DATE(created_at) = ?
  `, [date]);
  
  // 2. Get NEW articles published today
  const newArticles = await db.query(`
    SELECT id FROM published_articles
    WHERE DATE(created_at) = ?
  `, [date]);
  
  // 3. Get articles that received updates today
  const updatedArticles = await db.query(`
    SELECT DISTINCT article_id FROM article_updates
    WHERE update_date = ?
  `, [date]);
  
  // 4. Save snapshot
  await saveSnapshot({
    snapshot_date: date,
    new_publication_ids: JSON.stringify(newPublications.map(p => p.id)),
    new_article_ids: JSON.stringify(newArticles.map(a => a.id)),
    updated_article_ids: JSON.stringify(updatedArticles.map(a => a.article_id)),
    new_publications_count: newPublications.length,
    new_articles_count: newArticles.length,
    updated_articles_count: updatedArticles.length
  });
}
```

**Use Cases:**
1. **Email Subscriptions**: 
   - Users subscribe to daily/weekly digest
   - Email service queries snapshot to see what's new
   - Include links to new publications and updated articles

2. **"What's New" Page**:
   - Show recent changes across the site
   - Highlight updated articles (not just new ones)
   - Filter by date range

3. **Change Feed**:
   - API endpoint for external integrations
   - JSON feed of recent changes
   - Useful for webhooks, Slack notifications, etc.

**Output Format (JSON API):**
```json
{
  "date": "2025-10-09",
  "summary": {
    "new_publications": 1,
    "new_articles": 7,
    "updated_articles": 3
  },
  "new_publications": [
    {
      "id": "pub-2025-10-09",
      "headline": "Redis Zero-Day Exploited...",
      "slug": "redis-zero-day-oct-09"
    }
  ],
  "new_articles": [
    {
      "id": "uuid-789",
      "headline": "Crimson Collective Breach...",
      "slug": "crimson-collective-breach"
    }
  ],
  "updated_articles": [
    {
      "id": "uuid-123",
      "headline": "Critical Redis RCE...",
      "slug": "redis-vuln-cve-2025-49844",
      "original_date": "2025-10-07",
      "update_summary": "Added specific patch versions..."
    }
  ]
}
```

**Email Template Example:**
```
📰 CyberNetSec Daily Update - October 9, 2025

🆕 NEW PUBLICATIONS (1)
• Redis Zero-Day Exploited in the Wild
  https://netsecops.dev/publications/redis-zero-day-oct-09

🆕 NEW ARTICLES (7)
• Crimson Collective Claims Breach of 800+ Organizations
  https://netsecops.dev/articles/crimson-collective-breach
  
[... 6 more articles ...]

🔄 UPDATED ARTICLES (3)
• Critical Redis RCE Vulnerability (CVE-2025-49844)
  Updated: Added specific patch versions
  https://netsecops.dev/articles/redis-vuln-cve-2025-49844
  
[... 2 more updates ...]

---
Manage your subscription: https://netsecops.dev/subscribe
```

**Status**: Not Started ⏸️

---

## Pipeline Execution Order

### Daily Publication Flow
```bash
# Morning run (e.g., 6 AM)
1. npx tsx search-news.ts --date 2025-10-09
2. npx tsx news-structured.ts --date 2025-10-09 --logtodb
3. npx tsx index-entities.ts --date 2025-10-09
4. npx tsx check-duplicates.ts --date 2025-10-09
5. npx tsx resolve-duplicates.ts --date 2025-10-09
6. npx tsx generate-publication.ts --date 2025-10-09
7. npx tsx generate-rss.ts
8. npx tsx generate-update-snapshot.ts --date 2025-10-09
```

### Step Dependencies
```
Step 1 (search-news)
  └─> Step 2 (news-structured) [requires raw_search data]
       └─> Step 3 (index-entities) [requires structured_news]
            └─> Step 4 (check-duplicates) [requires articles_meta + entities]
                 └─> Step 5 (resolve-duplicates) [requires similarity scores]
                      └─> Step 6 (generate-publication) [requires resolutions]
                           ├─> Step 7 (generate-rss) [requires publications DB]
                           └─> Step 8 (update-snapshot) [requires publications DB]
```

## Database Tables Summary

### Input/Staging Tables
- `raw_search` - Raw Google News results
- `structured_news` - Publication candidates (JSON blobs)

### Indexing Tables  
- `articles_meta` - Article metadata (only NEW/ORIGINAL articles)
- `article_cves` - CVE references
- `article_entities` - Threat actors, malware, products, companies

### Resolution Tables
- `article_resolutions` - Duplicate resolution decisions with canonical IDs

### Final Publication Tables
- `publications` - Real publications (normalized)
- `published_articles` - Real articles (normalized)
- `publication_articles` - Many-to-many join
- `article_updates` - Update history

### Utility Tables
- `update_snapshots` - Daily change tracking (Step 8)
- `api_calls` - API usage logging

## Key Design Principles

1. **Publication Candidates vs Final Publications**
   - `structured_news` = candidates (JSON blobs for processing)
   - `publications` table = final published records (normalized)

2. **Article Identity**
   - UPDATE articles are NOT indexed in `articles_meta`
   - Use `canonical_article_id` for all lookups
   - Original article slug NEVER changes

3. **Slug Handling**
   - Publications: Use LLM-generated slug (regenerate if SKIP)
   - Articles: Use slug from `articles_meta` (never change)

4. **Update Tracking**
   - `article_updates` table tracks all changes
   - `source_article_id` links to NEW article that triggered update
   - Easy to query "what changed today"

## Future Enhancements

- [ ] Weekly digests (aggregate multiple days)
- [ ] Article categories/tags
- [ ] Search index generation (Algolia/ElasticSearch)
- [ ] Sitemap generation (SEO)
- [ ] Analytics tracking (page views, popular articles)
- [ ] Archive management (older articles)
- [ ] Multi-language support
- [ ] Author attribution tracking
