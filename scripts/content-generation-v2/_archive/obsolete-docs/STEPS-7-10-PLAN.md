# Steps 7-10 Implementation Plan

## Overview

Steps 7-10 generate the JSON files for the website from the normalized database created in Step 6.

**Output Directory Structure:**
```
public/data/
├── publications/
│   ├── daily_threat_publications_2025-10-09.json
│   ├── daily_threat_publications_2025-10-10.json
│   └── ...
├── articles/
│   ├── crimson-collective-claims-massive-red-hat-data-breach.json
│   ├── clop-exploits-critical-oracle-ebs-zero-day.json
│   └── ...
├── publications-index.json
├── articles-index.json
└── last-updates.json
```

---

## Step 7: Generate Publication & Article JSON Files

### 7A: Generate Publication Files

**Script:** `generate-publication-json.ts`

**Input:** Database tables (`publications`, `published_articles`, `publication_articles`)

**Output:** `public/data/publications/{slug}.json`

**Structure (from example):**
```typescript
interface PublicationJSON {
  pub_id: string;
  headline: string;
  summary: string;
  pub_date: string;              // YYYY-MM-DD
  total_articles: number;
  articles: PublicationArticleSummary[];  // Embedded article data
}

interface PublicationArticleSummary {
  id: string;
  slug: string;
  headline: string;
  title: string;
  severity: string;
  excerpt: string;               // Same as summary
  tags: string[];
  categories: string[];
  createdAt: string;             // ISO 8601
  readingTime: number;
  cves?: string[];
  cvssScore?: number;
  isUpdate: boolean;
}
```

**Query Pattern:**
```sql
SELECT 
  p.*,
  pa.id,
  pa.slug,
  pa.headline,
  pa.summary,
  pa.is_update,
  pa.original_pub_date,
  pap.position,
  pap.is_primary
FROM publications p
JOIN publication_articles pap ON p.id = pap.publication_id
JOIN published_articles pa ON pap.article_id = pa.id
WHERE p.id = 'pub-2025-10-09'
ORDER BY pap.position;
```

**Notes:**
- Articles are embedded in publication JSON
- Extract categories/tags/CVEs from full_report or articles_meta
- Calculate reading time from full_report word count
- `isUpdate` = `!is_primary` from publication_articles

---

### 7B: Generate Article Files

**Script:** `generate-article-json.ts`

**Input:** Database tables (`published_articles`, `article_updates`, `articles_meta`, `article_cves`, `article_entities`)

**Output:** `public/data/articles/{slug}.json`

**Structure (from example):**
```typescript
interface ArticleJSON {
  id: string;
  slug: string;
  headline: string;
  title: string;
  summary: string;
  full_report: string;
  twitter_post: string;
  meta_description: string;
  category: string[];
  severity: string;
  entities: Entity[];
  cves: (string | CVE)[];
  sources: Source[];
  events: Event[];
  mitre_techniques: MITRETechnique[];
  tags: string[];
  extract_datetime: string;
  article_type: string;
  impact_scope?: ImpactScope;
  keywords?: string[];
  
  // Update tracking (if updates exist)
  updates?: ArticleUpdate[];
}
```

**Query Pattern:**
```sql
-- Get article
SELECT * FROM published_articles WHERE id = ?;

-- Get metadata (if needed)
SELECT * FROM articles_meta WHERE article_id = ?;

-- Get CVEs
SELECT * FROM article_cves WHERE article_id = ?;

-- Get entities
SELECT * FROM article_entities WHERE article_id = ?;

-- Get updates
SELECT * FROM article_updates WHERE article_id = ? ORDER BY update_date;
```

**Notes:**
- Full article data with all metadata
- Include update history if exists
- Parse entities/CVEs from articles_meta tables
- Extract twitter_post, meta_description from structured_news or generate

---

## Step 8: Generate Index Files

### 8A: Generate Publications Index

**Script:** `generate-publications-index.ts`

**Output:** `public/data/publications-index.json`

**Structure (from example):**
```typescript
interface PublicationsIndex {
  publications: PublicationIndexEntry[];
}

interface PublicationIndexEntry {
  id: string;
  slug: string;
  title: string;                 // Same as headline
  type: string;                  // 'daily', 'weekly', etc.
  publishedAt: string;           // YYYY-MM-DD
  articleCount: number;
  summary: string;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  statusCounts: {
    new: number;
    updated: number;
  };
  categories: string[];          // Unique categories from all articles
}
```

**Query Pattern:**
```sql
-- Get all publications
SELECT * FROM publications ORDER BY pub_date DESC;

-- For each publication, get article stats
SELECT 
  severity,
  COUNT(*) as count
FROM published_articles pa
JOIN publication_articles pap ON pa.id = pap.article_id
WHERE pap.publication_id = ?
GROUP BY severity;

-- Get update counts
SELECT 
  COUNT(DISTINCT CASE WHEN pap.is_primary = 1 THEN pa.id END) as new_count,
  COUNT(DISTINCT CASE WHEN pap.is_primary = 0 THEN pa.id END) as updated_count
FROM published_articles pa
JOIN publication_articles pap ON pa.id = pap.article_id
WHERE pap.publication_id = ?;
```

**Notes:**
- Aggregate severity breakdown from articles
- Count new vs updated articles
- Extract unique categories from all articles in publication

---

### 8B: Generate Articles Index

**Script:** `generate-articles-index.ts`

**Output:** `public/data/articles-index.json`

**Structure (from example):**
```typescript
interface ArticlesIndex {
  articles: ArticleIndexEntry[];
}

interface ArticleIndexEntry {
  id: string;
  slug: string;
  headline: string;
  title: string;
  severity: string;
  excerpt: string;               // Same as summary
  tags: string[];
  categories: string[];
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601 (if updated)
  readingTime: number;
}
```

**Query Pattern:**
```sql
-- Get all articles
SELECT 
  pa.*,
  au.update_date as last_update
FROM published_articles pa
LEFT JOIN (
  SELECT article_id, MAX(update_date) as update_date
  FROM article_updates
  GROUP BY article_id
) au ON pa.id = au.article_id
ORDER BY pa.original_pub_date DESC;
```

**Notes:**
- List all published articles
- Include last update date if exists
- Sort by original publication date descending

---

## Step 9: Generate RSS Feed

**Script:** `generate-rss.ts`

**Output:** `public/rss.xml` (or `public/feed.xml`)

**Structure (RSS 2.0):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CyberNetSec - Cyber Threat Intelligence Feed</title>
    <link>https://cybernetsec.io</link>
    <description>Daily cybersecurity threat intelligence and analysis</description>
    <language>en-us</language>
    <lastBuildDate>Mon, 14 Oct 2025 12:00:00 GMT</lastBuildDate>
    <atom:link href="https://cybernetsec.io/rss.xml" rel="self" type="application/rss+xml" />
    
    <item>
      <title>Daily Threat Publications - October 9, 2025</title>
      <link>https://cybernetsec.io/publications/daily_threat_publications_2025-10-09</link>
      <guid isPermaLink="true">https://cybernetsec.io/publications/daily_threat_publications_2025-10-09</guid>
      <pubDate>Wed, 09 Oct 2025 00:00:00 GMT</pubDate>
      <description><![CDATA[
        <h2>3 Threat Intelligence Updates</h2>
        <p>Summary of today's cybersecurity threats...</p>
        <h3>Featured Articles:</h3>
        <ul>
          <li><strong>Crimson Collective Claims Massive Red Hat Data Breach</strong> (Critical)</li>
          <li><strong>Cl0p Exploits Critical Oracle EBS Zero-Day</strong> (High) - UPDATE</li>
          <li><strong>LockBit, Qilin, and DragonForce Alliance</strong> (High)</li>
        </ul>
      ]]></description>
      <category>Cyber Threat Intelligence</category>
      <category>Daily Briefing</category>
    </item>
    
    <!-- More items... -->
  </channel>
</rss>
```

**Query Pattern:**
```sql
-- Get recent publications (last 30 days)
SELECT 
  p.*,
  COUNT(pap.article_id) as article_count
FROM publications p
LEFT JOIN publication_articles pap ON p.id = pap.publication_id
WHERE p.pub_date >= DATE('now', '-30 days')
GROUP BY p.id
ORDER BY p.pub_date DESC
LIMIT 50;

-- For each publication, get articles
SELECT 
  pa.headline,
  pa.severity,
  pa.is_update
FROM published_articles pa
JOIN publication_articles pap ON pa.id = pap.article_id
WHERE pap.publication_id = ?
ORDER BY pap.position;
```

**RSS Item Structure:**
- **Title**: Publication headline
- **Link**: Publication URL (https://cybernetsec.io/publications/{slug})
- **GUID**: Same as link (permanent)
- **pubDate**: Publication date in RFC 822 format
- **Description**: HTML summary with article list
- **Categories**: Publication type, main categories

**Notes:**
- Include last 30-50 publications
- Format dates as RFC 822 (required for RSS)
- Use CDATA for HTML content in description
- Include severity indicators in article list
- Mark UPDATE articles clearly
- Add atom:link for self-reference (RSS best practice)

**Additional RSS Features:**
```xml
<!-- Optional: Article-level RSS feed -->
<item>
  <title>Crimson Collective Claims Massive Red Hat Data Breach</title>
  <link>https://cybernetsec.io/articles/crimson-collective-claims-massive-red-hat-data-breach</link>
  <guid isPermaLink="true">https://cybernetsec.io/articles/crimson-collective-claims-massive-red-hat-data-breach</guid>
  <pubDate>Wed, 09 Oct 2025 08:30:00 GMT</pubDate>
  <description><![CDATA[
    <p>A sophisticated ransomware group known as Crimson Collective has claimed...</p>
  ]]></description>
  <category>Ransomware</category>
  <category>Data Breach</category>
  <category>Critical Severity</category>
</item>
```

**Implementation Options:**
1. **Publication-only feed** (recommended): One RSS item per daily publication
2. **Article-level feed**: Individual RSS items for each article
3. **Dual feeds**: Separate RSS files for publications and articles

---

## Step 10: Generate last-updates.json

**Script:** `generate-last-updates.ts`

**Output:** `public/data/last-updates.json`

**Structure (from example):**
```typescript
interface LastUpdates {
  lastUpdated: string;           // ISO 8601 timestamp (now)
  runDate: string;               // YYYY-MM-DD of this generation run
  publications: PublicationWithArticles[];
  articles: {
    updated: UpdatedArticleSummary[];
  };
  pages: {
    updated: any[];              // Empty for now
  };
}

interface PublicationWithArticles {
  slug: string;
  type: string;                  // 'publication-daily'
  headline: string;
  articleCount: number;
  articles: ArticleSummaryInUpdate[];
}

interface ArticleSummaryInUpdate {
  slug: string;
  headline: string;
  summary: string;
  categories: string[];
  tags: string[];
  severity: string;
  isUpdate: boolean;
  publishedAt: string;           // ISO 8601
  updatedAt?: string;            // ISO 8601 (if updated)
}

interface UpdatedArticleSummary {
  slug: string;
  originalHeadline: string;
  updateTitle: string;           // From article_updates
  updateSummary: string;         // From article_updates
  categories: string[];
  tags: string[];
  cves?: string[];
  malware?: string[];
  severity: string;
  publishedAt: string;           // Original date
  updatedAt: string;             // Latest update date
}
```

**Query Logic:**
```sql
-- Get latest publication (run date)
SELECT * FROM publications 
ORDER BY pub_date DESC 
LIMIT 1;

-- Get recent publications (last 7 days)
SELECT * FROM publications 
WHERE pub_date >= DATE('now', '-7 days')
ORDER BY pub_date DESC;

-- Get updated articles (last 7 days)
SELECT 
  pa.*,
  au.update_date,
  au.update_summary
FROM published_articles pa
JOIN article_updates au ON pa.id = au.article_id
WHERE au.update_date >= DATE('now', '-7 days')
ORDER BY au.update_date DESC;
```

**Notes:**
- Track recent publications and their articles
- Track articles that received updates
- Used by website to show "What's New" section
- Useful for email notifications

---

## Step 11: Deployment Script

**Script:** `deploy-publication.ts`

**Purpose:** Run Steps 7-10 in sequence for a specific date

**Usage:**
```bash
# Deploy single date
npx tsx scripts/content-generation-v2/deploy-publication.ts --date 2025-10-09

# Deploy date range
npx tsx scripts/content-generation-v2/deploy-publication.ts --start 2025-10-07 --end 2025-10-10

# Deploy and update indexes
npx tsx scripts/content-generation-v2/deploy-publication.ts --date 2025-10-09 --update-indexes
```

**Process:**
1. Run Step 7A: Generate publication JSON
2. Run Step 7B: Generate article JSON files
3. Run Step 8A: Update publications index
4. Run Step 8B: Update articles index
5. Run Step 9: Update RSS feed
6. Run Step 10: Update last-updates.json
7. Verify all files written
8. Report statistics

**Output:**
```
✅ Deployment Complete!
   
   Publication: daily_threat_publications_2025-10-09
   - Publication JSON: ✅ written
   - Article JSONs: 3 files written ✅
   - Publications index: updated ✅
   - Articles index: updated ✅
   - RSS feed: updated ✅ (50 items)
   - last-updates.json: updated ✅
   
   Files written to: public/data/ and public/rss.xml
```

---

## Implementation Order

1. ✅ **Step 6**: `generate-publication.ts` (COMPLETE)
   - Creates normalized database records

2. **Step 7A**: `generate-publication-json.ts`
   - Queries database
   - Generates publication JSON files

3. **Step 7B**: `generate-article-json.ts`
   - Queries database with JOINs
   - Generates article JSON files

4. **Step 8A**: `generate-publications-index.ts`
   - Aggregates publication data
   - Generates publications-index.json

5. **Step 8B**: `generate-articles-index.ts`
   - Lists all articles
   - Generates articles-index.json

6. **Step 9**: `generate-rss.ts`
   - Queries recent publications
   - Generates RSS 2.0 XML feed
   - Outputs to public/rss.xml

7. **Step 10**: `generate-last-updates.ts`
   - Tracks recent changes
   - Generates last-updates.json

8. **Step 11**: `deploy-publication.ts`
   - Orchestrates Steps 7-10
   - Verifies output
   - Reports status

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     DATABASE (Step 6)                   │
│  publications, published_articles, publication_articles │
│            article_updates, articles_meta               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─────────────────────────────────┐
                     │                                 │
                     ▼                                 ▼
            ┌────────────────┐              ┌─────────────────┐
            │   Step 7A       │              │    Step 7B      │
            │ generate-       │              │  generate-      │
            │ publication-    │              │  article-json   │
            │ json.ts         │              │  .ts            │
            └────────┬────────┘              └────────┬────────┘
                     │                                │
                     ▼                                ▼
            public/data/publications/       public/data/articles/
            {slug}.json                     {slug}.json
                     │                                │
                     └────────────┬───────────────────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │   Step 8A      │
                          │  generate-     │
                          │  publications- │
                          │  index.ts      │
                          └───────┬────────┘
                                  │
                                  ▼
                   public/data/publications-index.json
                                  │
                          ┌───────┴────────┐
                          │   Step 8B      │
                          │  generate-     │
                          │  articles-     │
                          │  index.ts      │
                          └───────┬────────┘
                                  │
                                  ▼
                   public/data/articles-index.json
                                  │
                          ┌───────┴────────┐
                          │   Step 9       │
                          │  generate-     │
                          │  rss.ts        │
                          └───────┬────────┘
                                  │
                                  ▼
                          public/rss.xml
                                  │
                          ┌───────┴────────┐
                          │   Step 10      │
                          │  generate-     │
                          │  last-updates  │
                          │  .ts           │
                          └───────┬────────┘
                                  │
                                  ▼
                   public/data/last-updates.json
```

---

## Key Considerations

### 1. Data Sources Priority
- **Primary**: Database tables (Step 6 output)
- **Secondary**: `structured_news` candidate (for fields not in DB)
- **Tertiary**: `articles_meta` (for entity/CVE data)

### 2. Missing Fields Strategy
If fields are missing from database:
- Query `structured_news` for original LLM output
- Query `articles_meta` for indexed entity data
- Generate placeholders if truly missing

### 3. Performance
- Batch queries where possible
- Cache article metadata during index generation
- Consider parallel JSON file writes

### 4. Error Handling
- Skip failed articles but continue processing
- Log all errors to file
- Report statistics at end

### 5. Testing
- Test with Oct 9 data first (known good)
- Verify JSON structure matches examples
- Check all cross-references work

---

## Success Criteria

- [x] Step 6: Database normalized ✅
- [ ] Step 7A: Publication JSON files generated
- [ ] Step 7B: Article JSON files generated
- [ ] Step 8A: Publications index updated
- [ ] Step 8B: Articles index updated
- [ ] Step 9: RSS feed generated
- [ ] Step 10: last-updates.json updated
- [ ] Step 11: Deploy script orchestrates all steps
- [ ] All files written to `public/data/` and `public/rss.xml`
- [ ] Website can load and display publications
- [ ] RSS feed validates (https://validator.w3.org/feed/)
- [ ] Update tracking works correctly

---

## Next Steps

1. Implement Step 7A (generate-publication-json.ts)
2. Test with Oct 9 publication
3. Implement Step 7B (generate-article-json.ts)
4. Test with Oct 9 articles
5. Continue with Steps 8-10

Ready to start implementation! 🚀
