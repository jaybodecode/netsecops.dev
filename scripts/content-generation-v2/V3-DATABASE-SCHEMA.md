# V3 Database Schema Documentation

**Version**: V3 (FTS5 Full-Text Similarity)  
**Created**: 2025-10-14  
**Database**: `logs/content-generation-v2.db`

---

## 📋 Overview

This schema implements a **database-first architecture** with proper normalization. Articles are stored in a central `articles` table with resolution tracking for duplicate detection. FTS5 (Full-Text Search) is used for similarity detection instead of entity-based weighted similarity.

### Key Design Principles

1. ✅ **Articles table is source of truth** - All article data properly normalized
2. ✅ **Resolution tracking** - In-place marking (NEW/SKIP-FTS5/SKIP-LLM/SKIP-UPDATE)
3. ✅ **FTS5 for similarity** - BM25 algorithm with weighted columns
4. ✅ **No linking tables** - Publications store article_ids as JSON array
5. ✅ **Skip ≠ Delete** - Skipped articles preserved for history/updates

---

## 🗃️ Core Tables

### 1. articles (Central Storage)

**Purpose**: Single source of truth for all article data with resolution tracking.

```sql
CREATE TABLE IF NOT EXISTS articles (
  -- Primary identification
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  
  -- Content
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_report TEXT NOT NULL,
  
  -- Source metadata
  source_url TEXT NOT NULL,
  source_domain TEXT,
  published_date TEXT NOT NULL,  -- ISO date from Google News
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Classification
  category TEXT,  -- JSON array: ["ransomware", "apt"]
  threat_level INTEGER CHECK(threat_level BETWEEN 1 AND 5),
  
  -- Quality scores
  relevance_score REAL,
  confidence_score REAL,
  
  -- V3: Resolution tracking for duplicate detection
  resolution TEXT CHECK(resolution IN ('NEW', 'SKIP-FTS5', 'SKIP-LLM', 'SKIP-UPDATE')),
  similarity_score REAL,           -- FTS5 BM25 score (negative, lower = better match)
  matched_article_id TEXT,         -- Reference to original article
  skip_reasoning TEXT,             -- LLM explanation or auto-skip message
  
  -- Foreign key
  FOREIGN KEY (matched_article_id) REFERENCES articles(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(published_date);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_resolution ON articles(resolution);
CREATE INDEX IF NOT EXISTS idx_articles_matched ON articles(matched_article_id);
CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles(source_domain);
```

**Resolution Types**:

| Resolution | Meaning | Similarity Score | LLM Called? | Include in RSS? |
|------------|---------|------------------|-------------|-----------------|
| `NEW` | Unique article | ≥ -50 or NULL | No (automatic) | ✅ Yes |
| `SKIP-FTS5` | Auto-skip duplicate | < -150 | No (automatic) | ❌ No |
| `SKIP-LLM` | LLM confirmed duplicate | -150 to -50 | Yes | ❌ No |
| `SKIP-UPDATE` | Updates existing article | -150 to -50 | Yes | ❌ No (merged) |

**Field Details**:

- `id`: SHA-256 hash of headline + source_url
- `slug`: URL-safe identifier for article pages
- `category`: JSON array stored as TEXT (use `json_extract()` or `json_each()`)
- `similarity_score`: BM25 score from FTS5 (negative values, lower = more similar)
- `matched_article_id`: Points to the original article if this is a duplicate/update
- `skip_reasoning`: Stores either:
  - "FTS5 auto-skip: BM25 score -177.77 with article abc123..." (SKIP-FTS5)
  - LLM explanation (SKIP-LLM or SKIP-UPDATE)
  - NULL for NEW articles

---

### 2. articles_fts (FTS5 Search Index)

**Purpose**: Full-text search index for duplicate detection using BM25 algorithm.

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
  article_id UNINDEXED,     -- Store but don't index (for JOIN back)
  headline,                  -- 10x weight in queries
  summary,                   -- 5x weight in queries
  full_report,               -- 1x weight in queries
  tokenize='porter unicode61 remove_diacritics 1'
);
```

**Tokenizer Configuration**:
- `porter`: Porter stemming (running → run, exploited → exploit)
- `unicode61`: Full Unicode support
- `remove_diacritics 1`: Normalize accented characters (café → cafe)

**Weighted Queries**:
```sql
-- Query with column weights
SELECT 
  a.id,
  a.headline,
  bm25(articles_fts, 10.0, 5.0, 1.0) as score  -- headline: 10x, summary: 5x, full_report: 1x
FROM articles_fts fts
JOIN articles a ON fts.article_id = a.id
WHERE fts MATCH 'lockbit qilin dragonforce'
ORDER BY score DESC;
```

**BM25 Score Interpretation**:
```
< -150    → VERY HIGH similarity (auto-skip, no LLM call)
-150 to -50 → MEDIUM similarity (call LLM to decide)
≥ -50     → LOW similarity (auto-mark as NEW)
```

---

### 3. publications

**Purpose**: Lightweight publication metadata with article references.

```sql
CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,              -- Format: pub-2025-10-14
  pub_date TEXT UNIQUE NOT NULL,    -- ISO date: 2025-10-14
  title TEXT NOT NULL,              -- Generated by LLM after filtering
  summary TEXT NOT NULL,            -- Generated by LLM after filtering
  article_ids TEXT NOT NULL,        -- JSON array: ["abc123", "def456", ...]
  article_count INTEGER NOT NULL,   -- Count of articles in publication
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_publications_date ON publications(pub_date);
```

**article_ids Format**:
```json
["article-id-1", "article-id-2", "article-id-3"]
```

**Query Pattern**:
```sql
-- Get all articles in a publication
SELECT a.*
FROM articles a
WHERE a.id IN (
  SELECT json_each.value
  FROM publications p, json_each(p.article_ids)
  WHERE p.id = 'pub-2025-10-14'
)
AND a.resolution = 'NEW'
ORDER BY a.threat_level DESC, a.relevance_score DESC;
```

---

### 4. article_cves (CVE References)

**Purpose**: Link articles to CVE identifiers with severity data.

```sql
CREATE TABLE IF NOT EXISTS article_cves (
  article_id TEXT NOT NULL,
  cve_id TEXT NOT NULL,
  cvss_score REAL,
  severity TEXT CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE')),
  PRIMARY KEY (article_id, cve_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cves_article ON article_cves(article_id);
CREATE INDEX IF NOT EXISTS idx_cves_id ON article_cves(cve_id);
CREATE INDEX IF NOT EXISTS idx_cves_severity ON article_cves(severity);
```

**Example Queries**:
```sql
-- All articles mentioning CVE-2025-61882
SELECT a.* FROM articles a
JOIN article_cves c ON a.id = c.article_id
WHERE c.cve_id = 'CVE-2025-61882'
  AND a.resolution = 'NEW'
ORDER BY a.published_date DESC;

-- CVE timeline
SELECT 
  a.published_date,
  a.headline,
  c.cve_id,
  c.cvss_score,
  c.severity
FROM articles a
JOIN article_cves c ON a.id = c.article_id
WHERE c.cve_id = 'CVE-2025-61882'
  AND a.resolution = 'NEW'
ORDER BY a.published_date;
```

---

### 5. article_entities (Named Entities)

**Purpose**: Link articles to extracted entities (threat actors, malware, products, companies).

```sql
CREATE TABLE IF NOT EXISTS article_entities (
  article_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('threat_actor', 'malware', 'product', 'company')),
  confidence REAL,
  PRIMARY KEY (article_id, entity_name, entity_type),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_entities_article ON article_entities(article_id);
CREATE INDEX IF NOT EXISTS idx_entities_name ON article_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_entities_type ON article_entities(entity_type);
```

**Example Queries**:
```sql
-- All articles about Scattered Spider
SELECT a.* FROM articles a
JOIN article_entities e ON a.id = e.article_id
WHERE e.entity_name = 'Scattered Spider'
  AND e.entity_type = 'threat_actor'
  AND a.resolution = 'NEW'
ORDER BY a.published_date DESC;

-- Threat actor profile
SELECT 
  e.entity_name,
  COUNT(DISTINCT a.id) as article_count,
  MIN(a.published_date) as first_seen,
  MAX(a.published_date) as last_seen,
  GROUP_CONCAT(DISTINCT c.cve_id) as cves_used
FROM article_entities e
JOIN articles a ON e.article_id = a.id
LEFT JOIN article_cves c ON a.id = c.article_id
WHERE e.entity_type = 'threat_actor'
  AND a.resolution = 'NEW'
GROUP BY e.entity_name
ORDER BY article_count DESC;
```

---

### 6. article_tags (Keywords)

**Purpose**: Store extracted keywords/tags for filtering and categorization.

```sql
CREATE TABLE IF NOT EXISTS article_tags (
  article_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (article_id, tag),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tags_article ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON article_tags(tag);
```

**Example Queries**:
```sql
-- All ransomware articles
SELECT a.* FROM articles a
JOIN article_tags t ON a.id = t.article_id
WHERE t.tag = 'ransomware'
  AND a.resolution = 'NEW'
ORDER BY a.published_date DESC;

-- Tag frequency
SELECT 
  tag,
  COUNT(*) as article_count
FROM article_tags
WHERE article_id IN (
  SELECT id FROM articles WHERE resolution = 'NEW'
)
GROUP BY tag
ORDER BY article_count DESC
LIMIT 20;
```

---

### 7. structured_news (Staging Table - UNCHANGED)

**Purpose**: Temporary staging for raw LLM-generated structured data.

```sql
CREATE TABLE IF NOT EXISTS structured_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pub_date_only TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_structured_news_date ON structured_news(pub_date_only);
```

**Note**: This table remains unchanged from V2. It's the initial landing zone for news-structured.ts output before normalization into the articles table.

---

## 🔍 Common Query Patterns

### 1. Get Articles for RSS Feed

```sql
-- Get all NEW articles for a publication
SELECT a.*
FROM articles a
WHERE a.id IN (
  SELECT json_each.value
  FROM publications p, json_each(p.article_ids)
  WHERE p.pub_date = '2025-10-14'
)
AND a.resolution = 'NEW'
ORDER BY a.threat_level DESC, a.relevance_score DESC;
```

### 2. Resolution Distribution (Algorithm Performance)

```sql
SELECT 
  resolution,
  COUNT(*) as count,
  ROUND(AVG(similarity_score), 2) as avg_score,
  ROUND(MIN(similarity_score), 2) as min_score,
  ROUND(MAX(similarity_score), 2) as max_score
FROM articles
WHERE resolution IS NOT NULL
GROUP BY resolution
ORDER BY count DESC;
```

### 3. LLM Decision Audit

```sql
SELECT 
  a.id,
  a.headline,
  a.resolution,
  a.similarity_score,
  a.skip_reasoning,
  matched.headline as matched_headline
FROM articles a
LEFT JOIN articles matched ON a.matched_article_id = matched.id
WHERE a.resolution IN ('SKIP-LLM', 'SKIP-UPDATE')
ORDER BY a.similarity_score DESC;
```

### 4. Articles That Received Updates

```sql
SELECT 
  original.id,
  original.headline,
  original.published_date,
  COUNT(updates.id) as update_count,
  GROUP_CONCAT(updates.id) as update_article_ids
FROM articles original
JOIN articles updates ON updates.matched_article_id = original.id
WHERE updates.resolution = 'SKIP-UPDATE'
GROUP BY original.id
ORDER BY update_count DESC;
```

### 5. Score Distribution Histogram

```sql
SELECT 
  CASE 
    WHEN similarity_score IS NULL THEN 'No comparison'
    WHEN similarity_score >= -50 THEN '-50 to 0 (NEW zone)'
    WHEN similarity_score >= -100 THEN '-100 to -50 (LLM zone)'
    WHEN similarity_score >= -150 THEN '-150 to -100 (LLM zone)'
    WHEN similarity_score >= -200 THEN '-200 to -150 (Auto-skip zone)'
    ELSE '< -200 (Very high similarity)'
  END as score_range,
  COUNT(*) as count
FROM articles
GROUP BY score_range
ORDER BY MIN(COALESCE(similarity_score, 0)) DESC;
```

### 6. Daily Resolution Summary

```sql
SELECT 
  DATE(published_date) as date,
  resolution,
  COUNT(*) as count
FROM articles
GROUP BY DATE(published_date), resolution
ORDER BY date DESC, count DESC;
```

### 7. Find Similar Articles (FTS5 Query)

```sql
-- Find articles similar to a specific article
WITH target AS (
  SELECT headline || ' ' || summary || ' ' || full_report as query_text
  FROM articles
  WHERE id = ?
)
SELECT 
  a.id,
  a.slug,
  a.headline,
  a.published_date,
  bm25(articles_fts, 10.0, 5.0, 1.0) as similarity_score
FROM articles_fts fts
JOIN articles a ON fts.article_id = a.id
CROSS JOIN target
WHERE fts MATCH target.query_text
  AND a.id != ?
  AND a.published_date >= date('now', '-30 days')
ORDER BY similarity_score DESC
LIMIT 10;
```

---

## 📊 Reporting Queries

### Algorithm Tuning Dashboard

```sql
-- 1. Overall pipeline health
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_articles,
  SUM(CASE WHEN resolution = 'NEW' THEN 1 ELSE 0 END) as new_count,
  SUM(CASE WHEN resolution LIKE 'SKIP%' THEN 1 ELSE 0 END) as skipped_count,
  ROUND(AVG(CASE WHEN resolution = 'NEW' THEN relevance_score END), 2) as avg_relevance
FROM articles
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 2. LLM call efficiency
SELECT 
  'Total Articles' as metric,
  COUNT(*) as count,
  '100%' as percentage
FROM articles
UNION ALL
SELECT 
  'LLM Called' as metric,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM articles), 1) || '%' as percentage
FROM articles
WHERE resolution IN ('SKIP-LLM', 'SKIP-UPDATE') 
  OR (resolution = 'NEW' AND similarity_score < -50)
UNION ALL
SELECT 
  'Auto-Resolved' as metric,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM articles), 1) || '%' as percentage
FROM articles
WHERE resolution IN ('NEW', 'SKIP-FTS5') 
  AND (similarity_score >= -50 OR similarity_score < -150 OR similarity_score IS NULL);

-- 3. Threshold validation
SELECT 
  'Below -150 (auto-skip)' as threshold,
  COUNT(*) as count,
  GROUP_CONCAT(DISTINCT resolution) as resolutions_found
FROM articles
WHERE similarity_score < -150
UNION ALL
SELECT 
  'Between -150 and -50 (LLM)' as threshold,
  COUNT(*) as count,
  GROUP_CONCAT(DISTINCT resolution) as resolutions_found
FROM articles
WHERE similarity_score >= -150 AND similarity_score < -50
UNION ALL
SELECT 
  'Above -50 (auto-new)' as threshold,
  COUNT(*) as count,
  GROUP_CONCAT(DISTINCT resolution) as resolutions_found
FROM articles
WHERE similarity_score >= -50;
```

---

## 🔄 Migration from V2

### Key Schema Changes

| V2 Table | V3 Change | Reason |
|----------|-----------|--------|
| `published_articles` | → `articles` | Normalized with resolution tracking |
| N/A | + `articles_fts` | FTS5 full-text search index |
| `publications` | + `article_ids` JSON field | No more linking table needed |
| `publication_articles` | ❌ REMOVED | Replaced by article_ids JSON array |
| `article_updates` | ❌ REMOVED | Tracked in articles.resolution |
| `article_resolutions` | ❌ REMOVED | Tracked in articles.skip_reasoning |

### Data Migration Notes

1. **Existing articles**: Can be bulk inserted into new `articles` table with `resolution = 'NEW'`
2. **FTS5 index**: Must be populated after articles are inserted
3. **Publications**: Need to generate `article_ids` JSON from existing data
4. **No data loss**: All V2 tables can be archived, not deleted

---

## 🛠️ Database Maintenance

### Rebuild FTS5 Index

```sql
-- If FTS5 index becomes corrupted or out of sync
INSERT INTO articles_fts(articles_fts) VALUES('rebuild');
```

### Vacuum Database

```sql
-- After large deletions or schema changes
VACUUM;
```

### Analyze Query Performance

```sql
-- Update statistics for query optimizer
ANALYZE;
```

### Check Integrity

```sql
-- Verify database integrity
PRAGMA integrity_check;

-- Check foreign key consistency
PRAGMA foreign_key_check;
```

---

## 📝 Notes

### Resolution Field Logic

The `resolution` field is set during duplicate detection:

1. **Initial state**: `NULL` (when article first inserted)
2. **After duplicate check**:
   - `NEW`: Unique article, include in publication
   - `SKIP-FTS5`: Auto-skipped (score < -150)
   - `SKIP-LLM`: LLM decided it's a duplicate (score -150 to -50)
   - `SKIP-UPDATE`: Article updated existing one (score -150 to -50)

### Performance Considerations

- **FTS5 queries**: ~10-50ms per article
- **Resolution tracking**: Minimal overhead (single TEXT field)
- **JSON article_ids**: Fast with `json_each()` in SQLite 3.38+
- **Indexes**: All critical fields indexed for fast lookups

### Future Enhancements

Potential additions for V4+:
- Article versioning (track content changes over time)
- Source credibility scoring
- Automatic entity linking (Wikipedia, MITRE ATT&CK)
- Time-series analysis tables
- User feedback tracking

---

**Last Updated**: 2025-10-14  
**Schema Version**: V3.0  
**Next Review**: After Phase 5 testing complete
