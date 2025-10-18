# Content Generation V3 - Complete Pipeline Guide

**Version**: 3.0  
**Updated**: 2025-10-18  
**Status**: Production Ready ✅

---

## 📚 Quick Links

- **[RUN_README.md](RUN_README.md)** - Quick start guide for daily operations, database management, and inspection tips
- **[LLM.md](LLM.md)** - LLM integration and cost tracking
- **run-pipeline.sh** - Automated full pipeline script (Steps 1-10)

**New to the pipeline?** Start with [RUN_README.md](RUN_README.md) for daily operations and common tasks.

---

## ⚠️ Quick Reference: Don't Skip Step 5.5!

**After running Step 5 (generate-publication.ts), check if Step 4 had any SKIP-UPDATE resolutions:**

```bash
# Check Step 4 output for this line:
# 🔄 SKIP-UPDATE (merge): X

# If you see any SKIP-UPDATE, run Step 5.5 AFTER Step 5 but BEFORE Step 6:
npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date 2025-10-XX
```

**Why?** Step 4 applies updates to OLD articles in the database, but their JSON files aren't automatically regenerated. Step 5.5 regenerates those OLD article JSON files to include the new `updates` array. 

**Important**: Step 5.5 regenerates the articles that **received** updates (old articles), NOT the articles marked as SKIP-UPDATE (new articles that were merged into old ones). This is why you run it after Step 5.

---

## 🕐 Timestamp Handling (Updated October 2025)

**Critical Fix Applied**: All timestamps now use **9am CST (15:00 UTC)** for consistency and proper timezone display.

### Timestamp Fields & Behavior

#### `createdAt` (Article JSON)
- **Format**: `YYYY-MM-DDTH15:00:00.000Z` (9am CST)
- **Behavior**: Always set to 9am CST of the article's publication date
- **Purpose**: Avoids timezone display issues (midnight UTC displays as previous day in CST)
- **Source**: Derived from `pub_date` field + `T15:00:00.000Z`

#### `updatedAt` (Article JSON)
- **Format**: ISO 8601 timestamp (from update's `datetime` field)
- **Behavior**: 
  - Initially matches `createdAt` when no updates exist
  - When article receives update: set to update's `datetime` field
  - On subsequent updates: always reflects **most recent** update's datetime
- **Source**: `updates[updates.length - 1].update_date` (last element = newest update)

#### `extract_datetime` (Removed from LLM Schema)
- **Status**: ❌ **REMOVED** from LLM schema (October 2025)
- **Reason**: LLMs generate incorrect/dummy timestamps
- **Replacement**: Derived from `pub_date` at 9am CST in insert-articles.ts
- **Database**: Still exists in `articles` table but populated from `pub_date`, not LLM

#### `articles.updated_at` (Database Field)
- **Format**: Full ISO 8601 timestamp
- **Behavior**: Set to update's `datetime` field when applying updates
- **Source**: Updated by `apply-updates.ts` when SKIP-UPDATE occurs

### Update Array Ordering

**Critical**: Updates are **appended** to the array, so array[0] is the **oldest** update and array[length-1] is the **newest**.

```typescript
// Monday (initial article)
updates = []
updatedAt = createdAt = "2025-10-15T15:00:00.000Z"

// Tuesday (first update)
updates = [{ datetime: "2025-10-16T12:00:00Z", ... }]
updatedAt = "2025-10-16T12:00:00Z"

// Wednesday (second update)  
updates = [
  { datetime: "2025-10-16T12:00:00Z", ... },  // [0] oldest
  { datetime: "2025-10-17T14:30:00Z", ... }   // [1] newest ✅
]
updatedAt = "2025-10-17T14:30:00Z"  // Always uses updates[length-1]
```

### Fixed Scripts (October 2025)

| Script | Fix | Line |
|--------|-----|------|
| `news-structured-schema.ts` | Removed `extract_datetime` from LLM schema | 204 |
| `insert-articles.ts` | Derive `extract_datetime` from `pub_date` at 15:00 UTC | 152 |
| `generate-publication-json.ts` | Use 9am CST format for `createdAt` | 291-293 |
| `generate-article-json.ts` | Use 9am CST for `createdAt`, access `updates[length-1]` for `updatedAt` | 320-325 |
| `generate-indexes.ts` | Use 9am CST for `createdAt`, access `updates[length-1]` for `updatedAt` | 337-341 |
| `apply-updates.ts` | Store full ISO timestamp (not just date) in `updated_at` | 119 |
| `pages/articles/[slug].vue` | Use `pub_date` (not `extract_datetime`) for display | 241, 355, 358 |

---

## ⚠️ V3 Migration Complete (October 2025)

**Scripts Updated to V3:**
- ✅ `generate-publication.ts` - Now queries `articles.resolution` column (not `article_resolutions` table)
- ✅ `generate-article-json.ts` - Now reads from `articles.updates` JSON column (not `article_updates` table)
- ✅ `generate-indexes.ts` - Fixed to read updates from `articles.updates` JSON column
- ✅ All other scripts already V3-compatible

**V2 Scripts Archived:**
- `_archive/v2-scripts/generate-publication.ts.v2`
- `_archive/v2-scripts/generate-article-json.ts.v2`

**Note:** Some documentation below may still reference V2 concepts like `article_updates` table. In V3, updates are stored in the `articles.updates` JSON column.

---

## Overview

V3 pipeline uses **FTS5 full-text search with BM25 scoring** for duplicate detection, replacing the old entity-based weighted similarity approach. This guide documents the complete execution order for daily content generation.

### Key V3 Improvements
- ✅ **FTS5 BM25 scoring** instead of entity-based similarity (85% faster)
- ✅ **Zod structured output** instead of text-based JSON parsing (100% reliable)
- ✅ **Three-tier thresholds** (0/-80, -81/-200, -201+) with automatic skip for clear duplicates (updated 2025-10-15)
- ✅ **Update tracking** via `articles.updates` JSON column (simplified from V2's `article_updates` table)
- ✅ **Safe schema initialization** with backwards compatibility checks
- ✅ **Simplified publication generation** - Direct queries from `articles` table

### ⚠️ Critical Step: Step 5.5 (Regenerate Updated Articles)

**DO NOT SKIP THIS STEP** if Step 4 produces any `SKIP-UPDATE` resolutions!

When Step 4 detects that a new article is an update to an existing article:
1. ✅ Update is stored in `article_updates` database table
2. ❌ Article JSON file is NOT automatically updated
3. ⚠️ **You must run Step 5.5** to regenerate the article JSON with the `updates` array

**Symptom if skipped**: Article JSON will have `"updatedAt"` matching `"createdAt"` and no `updates` array, even though the database contains the update.

**Fix**: Run `npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date YYYY-MM-DD`

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ DAILY CONTENT GENERATION WORKFLOW (V3)                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: Search Raw News
├─> Input: Google News API query
├─> Output: raw_search table
└─> Script: search-news.ts

Step 2: Generate Structured Content
├─> Input: raw_search table
├─> Output: structured_news table (JSON blob with publication candidate)
├─> LLM: Gemini 2.5 Flash-Lite with Zod schema
└─> Script: news-structured.ts

Step 3: Insert Articles & Build FTS5 Index
├─> Input: structured_news table
├─> Output: articles table + articles_fts (FTS5 virtual table)
├─> Creates: One row per article with FTS5 indexing
└─> Script: insert-articles.ts

Step 4: Detect Duplicates (V3)
├─> Input: articles table (newly inserted, resolution=NULL)
├─> Process: FTS5 BM25 scoring → 3-tier thresholds → LLM for borderline
├─> Output: articles.resolution field (NEW/SKIP-FTS5/SKIP-LLM/SKIP-UPDATE)
├─> Side Effects: Creates article_updates entries for SKIP-UPDATE
├─> LLM: Gemini 2.5 Flash-Lite with Zod schema (only borderline cases)
└─> Script: check-duplicates-v3.ts

Step 5: Generate Publications
├─> Input: articles table (resolution='NEW')
├─> Output: publications table (daily/weekly/monthly)
├─> Creates: publication_articles join table
└─> Script: generate-publication.ts

Step 5.5: Regenerate Updated Article JSON ⚠️ CRITICAL
├─> Input: article_updates table (articles that received updates)
├─> Output: public/data/articles/{slug}.json (with updates array)
├─> Updates: articles.updated_at timestamp
├─> Note: REQUIRED when SKIP-UPDATE occurred in Step 4
└─> Script: regenerate-updated-articles.ts

Step 6: Export Website JSON
├─> Input: publications, published_articles, article_updates tables
├─> Output: public/data/publications/{slug}.json
├─> Output: public/data/articles/{slug}.json
└─> Scripts: 
    ├─ generate-publication-json.ts
    └─ generate-article-json.ts

Step 7: Generate Indexes & RSS
├─> Input: publications, published_articles tables
├─> Output: public/data/publications-index.json
├─> Output: public/data/articles-index.json
├─> Output: public/rss.xml
└─> Scripts:
    ├─ generate-indexes.ts
    └─ generate-rss.ts
```

---

## Step-by-Step Execution Guide

### Prerequisites

```bash
# Set environment variables
export GOOGLE_PROJECT_ID="your-gcp-project-id"
export GOOGLE_LOCATION="us-central1"

# Verify database exists
ls -lh logs/content-generation-v2.db

# Check database schema
sqlite3 logs/content-generation-v2.db ".schema articles"
```

---

## Database Cleanup & Regeneration

### Clean Database Script

**Purpose**: Wipe all generated data while preserving raw search results and API cost tracking. Useful for fresh regeneration from Step 2 onwards.

**Script**: `scripts/content-generation-v2/clean-database.ts`

**What it preserves:**
- ✅ `raw_search` table (original Google News search results)
- ✅ `api_calls` table (cost tracking and analytics)

**What it deletes:**
- ❌ `structured_news` (Step 2 output)
- ❌ `articles` (Step 3 output)
- ❌ `publications` (Step 5 output)
- ❌ `published_articles` (Step 5 output)
- ❌ `publication_articles` (Step 5 join table)

**Usage**:
```bash
# Interactive mode (prompts for confirmation)
npx tsx scripts/content-generation-v2/clean-database.ts

# Force mode (skip confirmation - use with caution!)
npx tsx scripts/content-generation-v2/clean-database.ts --force
```

**Example Output**:
```
🗄️  Database Clean Utility
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Current table counts:
   raw_search: 9 rows
   api_calls: 156 rows
   structured_news: 1 rows
   articles: 10 rows
   publications: 1 rows
   published_articles: 0 rows
   publication_articles: 0 rows

⚠️  WARNING: This will delete all generated data!

Preserved tables (will NOT be deleted):
  ✅ raw_search (9 rows)
  ✅ api_calls (156 rows)

Tables to be deleted:
  ❌ structured_news (1 rows)
  ❌ articles (10 rows)
  ❌ publications (1 rows)
  ❌ published_articles (0 rows)
  ❌ publication_articles (0 rows)

? Are you sure you want to clean the database? (y/N)
```

**When to use:**
- Testing schema changes or bug fixes
- Regenerating all content with updated logic
- Fixing timestamp issues (like the October 2025 9am CST update)
- Starting fresh after code changes to Steps 2-7

**After cleaning, regenerate from Step 2:**
```bash
# Step 2: Generate structured content
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-15 --logtodb

# Step 3: Insert articles
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-15

# Step 4: Check duplicates
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-15

# Step 5: Generate publication
npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-15

# Step 6: Generate JSON
npx tsx scripts/content-generation-v2/generate-publication-json.ts --date 2025-10-15
npx tsx scripts/content-generation-v2/generate-article-json.ts --date 2025-10-15

# Step 7: Generate indexes
npx tsx scripts/content-generation-v2/generate-indexes.ts
npx tsx scripts/content-generation-v2/generate-rss.ts
```

**Note**: The script has proper foreign key handling and deletes in correct order to avoid constraint violations.

---

### Delete Articles by Date Script

**Purpose**: Delete articles for a specific date to allow re-running Steps 3-4 (useful for testing changes to duplicate detection or source merging).

**Script**: `scripts/content-generation-v2/delete-articles-by-date.ts`

**What it deletes for the specified date:**
- ❌ `articles` (and all related tables)
- ❌ `article_cves`, `article_entities`, `article_tags`, `article_sources`
- ❌ `article_events`, `article_mitre_techniques`, `article_impact_scope`
- ❌ `article_updates`, `article_update_sources`, `article_resolutions`, `articles_meta`
- ❌ `articles_fts` (FTS5 index entries)
- ❌ `publications` (for that date)

**What it preserves:**
- ✅ `raw_search` (Step 1 data)
- ✅ `structured_news` (Step 2 data)
- ✅ `api_calls` (cost tracking)
- ✅ Articles from other dates

**Usage**:
```bash
# Interactive mode (prompts for confirmation)
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-08

# Force mode (skip confirmation)
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-08 --force
```

**Example Output**:
```
🗑️  Delete Articles by Date

============================================================

📅 Target Date: 2025-10-08

📊 DATA TO BE DELETED:

   🗑️  articles                           10 rows
   🗑️  article_cves                        5 rows
   🗑️  article_entities                   48 rows
   🗑️  article_tags                       60 rows
   🗑️  article_sources                    20 rows
   🗑️  article_events                     23 rows
   🗑️  article_mitre_techniques           36 rows
   🗑️  article_impact_scope               10 rows
   🗑️  publications                        1 rows

============================================================

⚠️  WARNING: This will permanently delete all data for this date!
   You can re-run Step 3 and 4 after deletion.

Type "YES" to confirm deletion:
```

**When to use:**
- Testing changes to duplicate detection logic
- Verifying source merging behavior (SKIP-FTS5)
- Re-running article insertion after schema changes
- Debugging specific date processing issues

**After deletion, re-run:**
```bash
# Step 3: Insert articles
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-08

# Step 4: Check duplicates (tests source merging)
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-08
```

---

### Step 1: Search Raw News

**Purpose**: Query Google News API for cybersecurity articles and store raw results.

**Script**: `search-news.ts`

**Usage**:
```bash
# ✅ RECOMMENDED: Search with explicit date (avoids timezone issues)
npx tsx scripts/content-generation-v2/search-news.ts --date 2025-10-14 --logtodb

# Search for today (24 hours ending at most recent 9am CST)
npx tsx scripts/content-generation-v2/search-news.ts --timeframe today --logtodb

# Search for yesterday
npx tsx scripts/content-generation-v2/search-news.ts --timeframe yesterday --logtodb

# Search for specific days back
npx tsx scripts/content-generation-v2/search-news.ts --timeframe 1dayago --logtodb
npx tsx scripts/content-generation-v2/search-news.ts --timeframe 2daysago --logtodb

# Customize article count (default is 10)
npx tsx scripts/content-generation-v2/search-news.ts --date 2025-10-14 --count 15 --logtodb

# 🐛 DEBUG MODE: View search prompt without making API call
npx tsx scripts/content-generation-v2/search-news.ts --date 2025-10-14 --prompt-only
```

**CLI Options**:
- `--date YYYY-MM-DD` - **RECOMMENDED**: Search for specific date (avoids timezone calculation issues)
- `--timeframe` - Relative timeframe (today, yesterday, Ndaysago)
- `--count` - Number of articles to fetch (default: 10)
- `--logtodb` - Save results to database (required for pipeline)
- `--prompt-only` - Debug mode: print search prompt without API call (useful for verifying date ranges)

**Timeframe Options**:
- `today` - 24 hours ending at most recent 9am CST
- `yesterday` - 24 hours ending at yesterday's 9am CST
- `1dayago`, `2daysago`, `5daysago` - N days back from most recent 9am CST

**⚠️ Timezone Behavior**:
- Before 9am CST: relative timeframes may be off by 1 day
- **RECOMMENDATION**: Use `--date YYYY-MM-DD` for precise control and to avoid timezone confusion
- Search window is always 24 hours ending at 9am CST (15:00 UTC)

**Input**: None (queries Google News API with grounding)

**Output**: 
- File: `tmp/search-news_{timeframe}_{timestamp}.txt`
- Table: `raw_search` (if `--logtodb` flag used)
- Fields: `id`, `pub_date`, `raw_text`, `created_at`

**Validation**:
```bash
# Check results in tmp/
ls -lht tmp/search-news_*.txt | head -5

# Check database results (if using --logtodb)
sqlite3 logs/content-generation-v2.db \
  "SELECT id, pub_date, substr(raw_text, 1, 100) FROM raw_search ORDER BY created_at DESC LIMIT 1"

# 🐛 DEBUG: Verify search window dates in prompt match requested date
npx tsx scripts/content-generation-v2/search-news.ts --date 2025-10-14 --prompt-only | grep "PUBLISHED between"
# Expected: "PUBLISHED between 2025-10-13T15:00:00.000Z and 2025-10-14T15:00:00.000Z"
```

**Critical Fixes (October 2025)**:
- ✅ **Fixed buildPrompt() date bug**: buildPrompt() now accepts pre-calculated searchWindow parameter instead of recalculating dates
  - **Bug**: buildPrompt() was calling getSearchWindow(daysBack) internally, which could calculate wrong dates
  - **Fix**: Changed signature from `buildPrompt(daysBack, count)` to `buildPrompt(searchWindow, count, dateLabel)`
  - **Result**: Prompt now always uses the exact search window calculated in main()
- ✅ **Added --date option**: Explicit date specification to avoid timezone confusion
- ✅ **Added --prompt-only flag**: Debug mode to inspect search prompt without making API calls

---

### Step 2: Generate Structured Content

**Purpose**: Use LLM to structure raw news into publication candidate with articles.

**Script**: `news-structured.ts`

**Usage**:
```bash
# Generate for specific date
npx tsx scripts/content-generation-v2/news-structured.ts \
  --date 2025-10-14 \
  --logtodb

# Output also goes to tmp/ directory for review
ls -lh tmp/news-structured_2025-10-14_*.json
```

**Input**: 
- Table: `raw_search` (where `search_date` matches `--date`)

**Output**:
- Table: `structured_news`
- Fields: `pub_date`, `pub_type`, `data` (JSON blob)
- JSON Structure:
  ```json
  {
    "publication": {
      "headline": "Daily Cyber Threats - Oct 14, 2025",
      "summary": "...",
      "pub_date": "2025-10-14"
    },
    "articles": [
      {
        "id": "uuid-123",
        "slug": "article-slug",
        "headline": "Critical Redis RCE",
        "summary": "...",
        "full_report": "...",
        "severity": "critical",
        "category": ["vulnerability"],
        "tags": ["redis", "rce"],
        "cves": ["CVE-2025-12345"],
        "sources": [...],
        "pub_date": "2025-10-14T15:00:00.000Z"  // ✅ Script-set, not LLM-generated
      }
    ]
  }
  ```

**Validation**:
```bash
# Check structured output
sqlite3 logs/content-generation-v2.db \
  "SELECT pub_date, pub_type, json_extract(data, '$.articles') 
   FROM structured_news 
   WHERE pub_date='2025-10-14'"

# ✅ Verify articles have pub_date field (critical for index generation)
sqlite3 logs/content-generation-v2.db \
  "SELECT json_extract(value, '$.pub_date') 
   FROM structured_news, json_each(json_extract(data, '$.articles')) 
   WHERE pub_date='2025-10-14' 
   LIMIT 3"
```

**Critical Fixes (October 2025)**:
- ✅ **Fixed article.pub_date**: news-structured.ts now sets `article.pub_date` for every article (line ~179)
  - **Bug**: pub_date was LLM-optional, causing 56+ articles to have missing or incorrect dates
  - **Fix**: Added `article.pub_date = date;` in forEach loop after LLM generates articles
  - **Result**: All articles now have consistent pub_date matching the search date
- ✅ **Created backfill script**: backfill-article-pubdates.ts to fix legacy articles with missing pub_date
  - Successfully backfilled 56 articles across 8 dates

---

### Step 3: Insert Articles & Build FTS5 Index

**Purpose**: Extract articles from publication candidate and insert into normalized table with FTS5 indexing.

**Script**: `insert-articles.ts`

**Usage**:
```bash
# Insert articles for specific date
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-14

# Dry run (show what would be inserted)
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-14 --dry-run
```

**Input**:
- Table: `structured_news` (where `pub_date` matches `--date`)

**Output**:
- Table: `articles` (one row per article)
- Virtual Table: `articles_fts` (FTS5 index for BM25 scoring)
- Fields: `id`, `slug`, `headline`, `summary`, `full_report`, `severity`, `category`, `tags`, `sources`, `resolution` (initially NULL), `created_at`

**Validation**:
```bash
# Count inserted articles
sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(*) FROM articles WHERE DATE(created_at)='2025-10-14'"

# Check FTS5 index
sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(*) FROM articles_fts"

# View articles without resolution
sqlite3 logs/content-generation-v2.db \
  "SELECT id, headline, resolution FROM articles WHERE resolution IS NULL"
```

---

### Step 4: Detect Duplicates (V3)

**Purpose**: Use FTS5 BM25 scoring to detect duplicates and determine if article is NEW, UPDATE, or duplicate.

**Script**: `check-duplicates-v3.ts`

**Usage**:
```bash
# Check duplicates for specific date
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-14

# Check all articles with NULL resolution
npx tsx scripts/content-generation-v3/check-duplicates-v3.ts --all

# Dry run (show decisions without saving)
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-14 --dry-run
```

**Algorithm**:
```
For each article with resolution=NULL:
  1. Build FTS5 query from headline + summary + full_report
  2. Query articles_fts for BM25 scores
  3. Get best match (highest score)
  
  4. Apply three-tier thresholds (updated 2025-10-15 for better update detection):
     - Score 0 to -80:       → NEW (no LLM call)
     - Score -81 to -200:    → LLM evaluation (borderline - may be update)
     - Score -201 or below:  → SKIP-FTS5 (clear duplicate, no LLM call)
  
  5. For LLM evaluation:
     - Use Zod structured output (DuplicateResolutionWithUpdateSchema)
     - LLM decides: NEW, SKIP-DUPLICATE, or SKIP-UPDATE
     - If SKIP-UPDATE: extract update object and call applyUpdate()
  
  6. Save resolution to articles table
```

**Input**:
- Table: `articles` (where `resolution IS NULL`)
- Virtual Table: `articles_fts` (for BM25 scoring)

**Output**:
- Table: `articles` (updates `resolution`, `similarity_score`, `duplicate_of`, `skip_reasoning`)
- Resolution Values:
  - `NEW`: Unique article (publish as new)
  - `SKIP-FTS5`: Clear duplicate detected by BM25 (auto-skipped)
  - `SKIP-LLM`: Duplicate confirmed by LLM
  - `SKIP-UPDATE`: Article contains update to existing article

**Side Effects** (when `resolution='SKIP-UPDATE'`):
- Table: `article_updates` (new row with update details)
- Table: `article_update_sources` (links to source article)
- Table: `articles` (updates `articles.updates` JSON column on original article)

**Cost Optimization**:
- ~60-70% of duplicates auto-skipped by FTS5 thresholds (no LLM cost)
- Borderline cases (-81 to -200) trigger LLM evaluation for update detection
- Expected: 3-5 LLM calls per day (~$0.05-$0.10/day) - increased from previous threshold to catch more updates

**Validation**:
```bash
# View resolution distribution
sqlite3 logs/content-generation-v2.db \
  "SELECT resolution, COUNT(*) FROM articles GROUP BY resolution"

# View SKIP-UPDATE articles
sqlite3 logs/content-generation-v2.db \
  "SELECT id, headline, skip_reasoning FROM articles WHERE resolution='SKIP-UPDATE'"

# View LLM-evaluated articles (borderline cases)
sqlite3 logs/content-generation-v2.db \
  "SELECT id, headline, similarity_score, resolution 
   FROM articles 
   WHERE similarity_score BETWEEN -200 AND -81 
   ORDER BY similarity_score DESC"

# Check article updates were applied
sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(*) FROM article_updates WHERE DATE(datetime)='2025-10-14'"
```

---

### Step 5: Generate Publications

**Purpose**: Create publication records from NEW articles (after duplicate detection).

**Script**: `generate-publication.ts`

**Important**: Step 3 (`insert-articles.ts`) no longer creates preliminary publications. Publications are created ONLY in Step 5 after duplicate detection completes, ensuring only NEW articles are published.

**Usage**:
```bash
# Generate publication for specific date (no --force needed in normal pipeline)
npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-14

# Generate weekly publication (runs on Monday)
npx tsx scripts/content-generation-v2/generate-publication.ts \
  --date 2025-10-14 \
  --type weekly

# Generate monthly publication (runs on 1st of month)
npx tsx scripts/content-generation-v2/generate-publication.ts \
  --date 2025-10-14 \
  --type monthly

# --force flag: Only needed if regenerating an existing publication
npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-14 --force
```

**Input**:
- Table: `articles` (where `resolution='NEW'`)
- Table: `structured_news` (for publication metadata)

**Output**:
- Table: `publications`
  - Fields: `id`, `slug`, `headline`, `summary`, `pub_date`, `pub_type`, `created_at`
- Table: `published_articles`
  - Fields: `id`, `slug`, `headline`, `summary`, `full_report`, `severity`, ...
- Table: `publication_articles` (many-to-many join)
  - Fields: `publication_id`, `article_id`

**Validation**:
```bash
# Check publication created
sqlite3 logs/content-generation-v2.db \
  "SELECT id, slug, headline, pub_type FROM publications WHERE pub_date='2025-10-14'"

# Count articles in publication
sqlite3 logs/content-generation-v2.db \
  "SELECT p.slug, COUNT(pa.article_id) 
   FROM publications p
   JOIN publication_articles pa ON p.id = pa.publication_id
   WHERE p.pub_date='2025-10-14'
   GROUP BY p.slug"

# View published articles
sqlite3 logs/content-generation-v2.db \
  "SELECT id, slug, headline FROM published_articles 
   WHERE id IN (
     SELECT article_id FROM publication_articles 
     WHERE publication_id = (SELECT id FROM publications WHERE pub_date='2025-10-14')
   )"
```

---

### Step 5.5: Regenerate Updated Article JSON ⚠️ CRITICAL

**Purpose**: Re-export article JSON files that received updates in Step 4 (SKIP-UPDATE resolution).

**Script**: `regenerate-updated-articles.ts`

**⚠️ IMPORTANT**: 
- **REQUIRED** when Step 4 (check-duplicates-v3.ts) produces any SKIP-UPDATE resolutions
- If skipped, OLD article JSON files will be missing the new `updates` array even though updates are in the database
- Must run AFTER Step 5 (generate-publication.ts) and BEFORE Step 6 (export JSON) so that OLD article JSON files get their updates array before indexes are generated

**When to run**: 
- Always check Step 4 output for "SKIP-UPDATE" resolutions
- Run AFTER Step 5 (publication generation) if any updates were detected
- This regenerates the OLD articles that received updates, not the new articles marked as SKIP-UPDATE
- Can be run multiple times safely (idempotent)

**Usage**:
```bash
# Regenerate articles updated on specific date
npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date 2025-10-14

# Regenerate all articles with updates
npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --all
```

**Input**:
- Table: `article_updates` (updates created in Step 4)
- Table: `article_update_sources` (source links for updates)
- Table: `articles` (complete article data)
- Related tables: `article_entities`, `article_cves`, `article_sources`, `article_events`, `article_mitre_techniques`, etc.

**Output**:
- File: `public/data/articles/{slug}.json` (regenerated with updates array)
- Database: `articles.updated_at` (set to date of the update, not current date)

**What it does**:
1. Queries `article_updates` table for articles that received updates
2. Fetches complete article data from all related tables
3. Builds updates array with datetime, summary, content, severity_change, sources
4. Exports JSON file with updated article data
5. Article's `updatedAt` field reflects the date from the update's datetime (not today's date)

**Example Output** (article JSON with updates):
```json
{
  "id": "e1c2a3b4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "slug": "clop-exploits-critical-oracle-ebs-zero-day",
  "headline": "Cl0p Unleashes Extortion Spree via Oracle Zero-Day",
  "createdAt": "2025-10-07",
  "updatedAt": "2025-10-07",
  "updates": [
    {
      "datetime": "2025-10-07T12:00:00Z",
      "summary": "New technical details reveal SSRF exploit chain...",
      "content": "Further analysis of CVE-2025-61882...",
      "severity_change": "increased",
      "sources": [
        {
          "url": "https://example.com/new-details",
          "title": "Technical Analysis Update",
          "website": "",
          "date": "2025-10-07T12:00:00Z"
        }
      ]
    }
  ]
}
```

**Why timing matters**:
- **After Step 5**: Publications are created with NEW articles, now we regenerate the OLD articles that were updated
- **Before Step 6**: Before exporting NEW article JSON, we update the OLD article JSON files
- **Before Step 7**: generate-indexes.ts can detect `createdAt !== updatedAt` to show "updated" badge on OLD articles

**Validation**:
```bash
# Check which articles have updates in database
sqlite3 logs/content-generation-v2.db \
  "SELECT DISTINCT article_id FROM article_updates WHERE DATE(datetime)='2025-10-14'"

# View article with updates (should show updates array)
cat public/data/articles/{slug}.json | jq '{id, created: .createdAt, updated: .updatedAt, updates: .updates | length}'

# Verify updated_at was set correctly in database
sqlite3 logs/content-generation-v2.db \
  "SELECT id, created_at, updated_at FROM articles WHERE id='article-id-here'"

# ⚠️ DETECT MISSING STEP 5.5: Find articles with updates in DB but not in JSON
sqlite3 logs/content-generation-v2.db \
  "SELECT a.slug, COUNT(au.id) as update_count 
   FROM articles a 
   JOIN article_updates au ON a.id = au.article_id 
   WHERE DATE(au.datetime) = '2025-10-14'
   GROUP BY a.slug" | while read slug count; do
  json_updates=$(cat "public/data/articles/${slug}.json" 2>/dev/null | jq '.updates | length' 2>/dev/null || echo "0")
  if [ "$json_updates" = "0" ] || [ -z "$json_updates" ]; then
    echo "⚠️ MISSING UPDATES: ${slug} has ${count} updates in DB but 0 in JSON - RUN STEP 5.5!"
  fi
done
```

**Common Issues**:
- ❌ **Article JSON missing updates array**: You forgot to run Step 5.5 after Step 4
- ❌ **`updatedAt` equals `createdAt` but DB has updates**: Step 5.5 was not run
- ✅ **Fix**: Run `regenerate-updated-articles.ts --date YYYY-MM-DD` then `generate-indexes.ts`

---

### Step 6: Export Website JSON

**Purpose**: Generate JSON files for website consumption.

**Scripts**: 
- `generate-publication-json.ts` (publication pages)
- `generate-article-json.ts` (article pages)

**Usage**:
```bash
# Generate publication JSON for specific date
npx tsx scripts/content-generation-v2/generate-publication-json.ts --date 2025-10-14

# Generate article JSON for specific date
npx tsx scripts/content-generation-v2/generate-article-json.ts --date 2025-10-14

# Generate all publications
npx tsx scripts/content-generation-v2/generate-publication-json.ts --all

# Generate specific article
npx tsx scripts/content-generation-v2/generate-article-json.ts --slug article-slug-here
```

**Input**:
- Tables: `publications`, `published_articles`, `publication_articles`, `article_updates`

**Output**:
- File: `public/data/publications/{slug}.json`
- File: `public/data/articles/{slug}.json`

**Publication JSON Structure**:
```json
{
  "id": "pub-2025-10-14",
  "slug": "daily-cyber-threats-oct-14-2025",
  "headline": "Daily Cyber Threats - October 14, 2025",
  "summary": "...",
  "pub_date": "2025-10-14",
  "pub_type": "daily",
  "articles": [
    {
      "id": "uuid-123",
      "slug": "article-slug",
      "headline": "...",
      "summary": "...",
      "severity": "critical",
      "category": ["vulnerability"]
    }
  ]
}
```

**Article JSON Structure**:
```json
{
  "id": "uuid-123",
  "slug": "article-slug",
  "headline": "...",
  "summary": "...",
  "full_report": "...",
  "severity": "critical",
  "category": ["vulnerability"],
  "tags": ["redis", "rce"],
  "cves": ["CVE-2025-12345"],
  "sources": [...],
  "updates": [
    {
      "datetime": "2025-10-15T10:00:00Z",
      "summary": "Added patch information",
      "content": "...",
      "severity_change": "critical -> high"
    }
  ]
}
```

**Validation**:
```bash
# Check publication JSON files
ls -lh public/data/publications/daily-cyber-threats-oct-14-2025.json

# Check article JSON files
ls -lh public/data/articles/*.json

# Validate JSON structure
cat public/data/publications/daily-cyber-threats-oct-14-2025.json | jq '.articles | length'
```

---

### Step 7: Generate Indexes & RSS

**Purpose**: Create index files for fast listings and RSS feed for feed readers.

**Scripts**:
- `generate-indexes.ts` (publication/article indexes)
- `generate-rss.ts` (RSS 2.0 feed)

**Usage**:
```bash
# Generate all indexes
npx tsx scripts/content-generation-v2/generate-indexes.ts

# Generate publications index only
npx tsx scripts/content-generation-v2/generate-indexes.ts --publications-only

# Generate RSS feed
npx tsx scripts/content-generation-v2/generate-rss.ts

# Limit RSS to last 50 items
npx tsx scripts/content-generation-v2/generate-rss.ts --limit 50
```

**Input**:
- Tables: `publications`, `published_articles`, `publication_articles`

**Output**:
- File: `public/data/publications-index.json` (metadata for all publications)
- File: `public/data/articles-index.json` (metadata for all articles)
- File: `public/rss.xml` (RSS 2.0 feed)

**Validation**:
```bash
# Check index files
ls -lh public/data/publications-index.json public/data/articles-index.json

# Check RSS feed
ls -lh public/rss.xml

# Validate RSS structure
xmllint --noout public/rss.xml && echo "✓ Valid RSS XML"

# Count RSS items
grep -c "<item>" public/rss.xml
```

---

## Automated Pipeline Execution

### Full Pipeline Script

**Script**: `run-pipeline.sh`

**Purpose**: Automated execution of Steps 1-10 for a specific date, including static site generation and deployment.

**Usage**:
```bash
# Run complete pipeline for specific date
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17

# What it does:
# 1. Search raw news (Step 1)
# 2. Generate structured content (Step 2) 
# 3. Insert articles (Step 3)
# 4. Check duplicates (Step 4)
# 5. Generate publication (Step 5)
# 5.5. Regenerate updated articles (Step 5.5) - Safe to always run
# 6. Export JSON (Step 6)
# 7. Generate indexes & RSS (Step 7)
# 8. Generate last updates (Step 8)
# 9. Build static site (npm run generate)
# 10. Deploy to GitHub Pages (deploy-to-pages.sh)
```

**Features**:
- ✅ Error handling with detailed troubleshooting tips
- ✅ Colored output for easy reading
- ✅ Date validation (format and validity)
- ✅ Step-by-step progress indicators
- ✅ Final statistics showing resolution distribution
- ✅ Automatic error recovery guidance

**Error Handling**:
```bash
# If script fails, it shows:
# - Exit code and line number
# - Troubleshooting tips:
#   1. Check error message above
#   2. Verify database exists
#   3. Check if previous steps completed
#   4. Review logs in tmp/ directory
```

**Output Example**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 Content Generation V3 Pipeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Processing date: 2025-10-17

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Step 1: Searching raw news...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Step 1 complete

[... continues through all steps ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Pipeline Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Statistics for 2025-10-17:

resolution  count
----------  -----
NEW         3
SKIP-FTS5   2
SKIP-UPDATE 1

✅ All steps completed successfully for 2025-10-17
```

**When to use**:
- Daily production runs
- Full end-to-end pipeline execution
- Automated deployments
- Testing complete workflow after code changes

**When NOT to use**:
- Testing individual steps (use direct script calls)
- Re-running specific steps (use step-specific scripts)
- Debugging issues (run steps manually for detailed output)

---

## Database Schema (V3)

### Core Tables

#### `articles`
Primary table for all articles (NEW and skipped).

```sql
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_report TEXT NOT NULL,
  twitter_post TEXT,
  meta_description TEXT,
  severity TEXT,
  category TEXT,  -- JSON array
  tags TEXT,      -- JSON array
  cves TEXT,      -- JSON array
  sources TEXT,   -- JSON array
  
  -- V3 duplicate detection
  resolution TEXT,           -- NEW, SKIP-FTS5, SKIP-LLM, SKIP-UPDATE
  similarity_score REAL,     -- BM25 score (-80, -120, etc)
  duplicate_of TEXT,         -- Article ID of original
  skip_reasoning TEXT,       -- JSON with LLM reasoning
  
  -- V3 update tracking
  updates TEXT,              -- JSON array of update objects
  isUpdate INTEGER DEFAULT 0,
  updateCount INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (duplicate_of) REFERENCES articles(id)
);
```

#### `articles_fts`
Virtual table for FTS5 full-text search with BM25 scoring.

```sql
CREATE VIRTUAL TABLE articles_fts USING fts5(
  article_id UNINDEXED,
  headline,
  summary,
  full_report,
  tokenize='porter unicode61 remove_diacritics 1'
);
```

#### `article_updates`
Audit table for update history.

```sql
CREATE TABLE article_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  datetime TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  severity_change TEXT,
  source_article_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (article_id) REFERENCES articles(id),
  FOREIGN KEY (source_article_id) REFERENCES articles(id)
);
```

#### `article_update_sources`
Many-to-many join for update sources.

```sql
CREATE TABLE article_update_sources (
  update_id INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT,
  PRIMARY KEY (update_id, source_url),
  FOREIGN KEY (update_id) REFERENCES article_updates(id)
);
```

#### `publications`
Published daily/weekly/monthly digests.

```sql
CREATE TABLE publications (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  pub_date TEXT NOT NULL,
  pub_type TEXT NOT NULL,  -- daily, weekly, monthly, special
  created_at TEXT DEFAULT (datetime('now'))
);
```

#### `published_articles`
Articles that made it into publications.

```sql
CREATE TABLE published_articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_report TEXT NOT NULL,
  severity TEXT,
  category TEXT,  -- JSON array
  tags TEXT,      -- JSON array
  cves TEXT,      -- JSON array
  sources TEXT,   -- JSON array
  created_at TEXT DEFAULT (datetime('now'))
);
```

#### `publication_articles`
Many-to-many join between publications and articles.

```sql
CREATE TABLE publication_articles (
  publication_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  PRIMARY KEY (publication_id, article_id),
  FOREIGN KEY (publication_id) REFERENCES publications(id),
  FOREIGN KEY (article_id) REFERENCES published_articles(id)
);
```

### Supporting Tables

#### `raw_search`
Raw Google News API results.

```sql
CREATE TABLE raw_search (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_date TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

#### `structured_news`
Publication candidates from LLM (JSON blobs).

```sql
CREATE TABLE structured_news (
  pub_date TEXT PRIMARY KEY,
  pub_type TEXT NOT NULL,
  data TEXT NOT NULL,  -- JSON blob
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Complete Daily Workflow

**Recommended Schedule**: Run at 10 AM CST daily (after 9am CST cutoff)

```bash
#!/bin/bash
# daily-content-generation.sh

set -e  # Exit on error

# Configuration
SCRIPTS_DIR="scripts/content-generation-v2"
# Get yesterday's date in YYYY-MM-DD format for downstream scripts
YESTERDAY=$(date -v-1d +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📰 Content Generation V3 - Daily Workflow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Processing date: $TODAY"
echo ""

# Step 1: Search Raw News
# ✅ RECOMMENDED: Use --date option to avoid timezone confusion
echo "🔍 Step 1: Searching raw news..."
npx tsx $SCRIPTS_DIR/search-news.ts --date $TODAY --logtodb
echo "✓ Step 1 complete"
echo ""

# Step 2: Generate Structured Content
# Note: Uses --date with YYYY-MM-DD format to match database pub_date
echo "🤖 Step 2: Generating structured content..."
npx tsx $SCRIPTS_DIR/news-structured.ts --date $TODAY --logtodb
echo "✓ Step 2 complete"
echo ""

# Step 3: Insert Articles & Build FTS5 Index
echo "📥 Step 3: Inserting articles and building FTS5 index..."
npx tsx $SCRIPTS_DIR/insert-articles.ts --date $TODAY
echo "✓ Step 3 complete"
echo ""

# Step 4: Detect Duplicates (V3)
echo "🔄 Step 4: Detecting duplicates with FTS5 BM25..."
npx tsx $SCRIPTS_DIR/check-duplicates-v3.ts --date $TODAY
echo "✓ Step 4 complete"
echo ""

# Step 5: Generate Publications (no --force needed)
echo "📰 Step 5: Generating publications..."
npx tsx $SCRIPTS_DIR/generate-publication.ts --date $TODAY
echo "✓ Step 5 complete"
echo ""

# Step 5.5: Regenerate Updated Article JSON (if any SKIP-UPDATE occurred)
echo "🔄 Step 5.5: Checking for updated articles..."
UPDATE_COUNT=$(sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(DISTINCT article_id) FROM article_updates WHERE date(datetime) >= date('now', '-1 day')")

if [ "$UPDATE_COUNT" -gt 0 ]; then
  echo "   Found $UPDATE_COUNT article(s) with updates, regenerating JSON..."
  npx tsx $SCRIPTS_DIR/regenerate-updated-articles.ts --date $TODAY
  echo "✓ Step 5.5 complete"
else
  echo "   No updates found, skipping regeneration"
fi
echo ""

# Step 6: Export Website JSON
echo "📤 Step 6: Exporting website JSON..."
npx tsx $SCRIPTS_DIR/generate-publication-json.ts --date $TODAY
npx tsx $SCRIPTS_DIR/generate-article-json.ts --date $TODAY
echo "✓ Step 6 complete"
echo ""

# Step 7: Generate Indexes & RSS
echo "📋 Step 7: Generating indexes and RSS feed..."
npx tsx $SCRIPTS_DIR/generate-indexes.ts
npx tsx $SCRIPTS_DIR/generate-rss.ts --limit 50
echo "✓ Step 7 complete"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Daily content generation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Optional: Show statistics
echo ""
echo "📊 Statistics for $TODAY:"
sqlite3 logs/content-generation-v2.db \
  "SELECT 
    resolution, 
    COUNT(*) as count 
   FROM articles 
   WHERE date(created_at) = '$TODAY'
   GROUP BY resolution"
```

---

## Troubleshooting

### FTS5 Index Issues

**Problem**: Duplicate detection not working, scores seem wrong

**Solution**: Rebuild FTS5 index
```bash
npx tsx scripts/content-generation-v2/rebuild-fts5-clean.ts
```

### Schema Warnings

**Problem**: See warnings about missing columns during execution

**Solution**: These are informational only, not errors. The code checks for column existence and uses fallbacks.

Example warnings you can ignore:
```
⚠ pub_date_only column does not exist, using date(pub_date) instead
⚠ slug column does not exist, using computed slug
⚠ update_date column does not exist in article_updates, skipping filter
```

### LLM Structured Output Errors

**Problem**: LLM returns invalid JSON or missing fields

**Solution**: V3 uses Zod schemas with `callVertex({ schema })` to guarantee correct format. If you see this error, check:
1. Schema definition in `duplicate-resolution-schema-v3.ts`
2. Prompt includes field descriptions
3. Using `callVertex` with `schema` parameter (not manual parsing)

### Testing Individual Components

```bash
# Test FTS5 scoring
npx tsx scripts/content-generation-v2/test-fts5-scoring.ts

# Test specific article pair
npx tsx scripts/content-generation-v2/test-fts5-micro.ts

# View resolutions
npx tsx scripts/content-generation-v2/view-resolutions.ts
```

---

## Performance & Cost Metrics

### V3 Performance (Production)

**Daily Run** (10 articles/day average):
- Total Time: ~2-3 minutes
- LLM Calls: 1-2 (borderline cases only)
- Cost: ~$0.02-$0.04 per day
- Auto-Skipped: 75-80% of duplicates (no LLM cost)

**Comparison to V2** (Entity-based):
- V3 is 85% faster (FTS5 vs SQL unions)
- V3 is 90% cheaper (fewer LLM calls)
- V3 is 100% reliable (Zod structured output)

### Cost Tracking & Analysis

All LLM API calls are automatically logged to the `api_calls` table with token usage and costs.

**View Total Lifetime Costs:**
```bash
sqlite3 logs/content-generation-v2.db \
  "SELECT SUM(cost_usd) as total_lifetime_cost FROM api_calls"
```

**View Cost by Script:**
```bash
sqlite3 logs/content-generation-v2.db \
  "SELECT 
    script_name, 
    model, 
    COUNT(*) as calls, 
    SUM(input_tokens) as total_input, 
    SUM(output_tokens) as total_output, 
    ROUND(SUM(cost_usd), 4) as total_cost_usd 
   FROM api_calls 
   GROUP BY script_name, model 
   ORDER BY total_cost_usd DESC"
```

**View Daily Costs (Last 30 Days):**
```bash
sqlite3 logs/content-generation-v2.db \
  "SELECT 
    DATE(called_at) as date, 
    COUNT(*) as calls, 
    ROUND(SUM(cost_usd), 4) as daily_cost_usd 
   FROM api_calls 
   GROUP BY DATE(called_at) 
   ORDER BY date DESC 
   LIMIT 30"
```

**View Detailed Call Log:**
```bash
sqlite3 logs/content-generation-v2.db \
  "SELECT 
    datetime(called_at) as time, 
    script_name, 
    model, 
    input_tokens, 
    output_tokens, 
    ROUND(cost_usd, 6) as cost_usd 
   FROM api_calls 
   ORDER BY called_at DESC 
   LIMIT 20"
```

**Export Cost Report (CSV):**
```bash
sqlite3 -header -csv logs/content-generation-v2.db \
  "SELECT * FROM api_calls ORDER BY called_at DESC" > cost-report.csv
```

**Monthly Cost Summary:**
```bash
sqlite3 logs/content-generation-v2.db \
  "SELECT 
    strftime('%Y-%m', called_at) as month, 
    COUNT(*) as total_calls, 
    ROUND(SUM(cost_usd), 2) as total_cost_usd,
    ROUND(AVG(cost_usd), 4) as avg_cost_per_call
   FROM api_calls 
   GROUP BY strftime('%Y-%m', called_at) 
   ORDER BY month DESC"
```

### Threshold Tuning

As corpus grows (500+, 1000+ articles), thresholds may need adjustment:

1. Run `test-fts5-scoring.ts` on known duplicate pairs
2. Check if scores still cluster in expected ranges
3. Adjust thresholds in `check-duplicates-v3.ts`:
   ```typescript
   const AUTO_NEW_THRESHOLD = -80;       // Above this: automatic NEW
   const AUTO_SKIP_THRESHOLD = -200;    // Below this: automatic SKIP (updated 2025-10-15)
   ```
4. Test with `--dry-run` before committing

---

## Related Documentation

### V3 Core Documentation
- **V3-DATABASE-SCHEMA.md** - Complete database schema reference
- **V3-MIGRATION-STRATEGY.md** - Migration from V2 to V3
- **V3-NEXT-STEPS.md** - Current status and next steps
- **V3-STRUCTURED-OUTPUT-MIGRATION.md** - Zod structured output guide
- **FTS5-SIMILARITY-STRATEGY.md** - FTS5 BM25 scoring details

### Implementation Guides
- **database/V3-FIX-SCHEMA-WARNINGS.md** - Safe schema initialization
- **V3-FINAL-STATUS.md** - V3 completion status

### Reference
- **duplicate-resolution-schema-v3.ts** - Zod schemas for LLM output
- **news-structured-schema.ts** - Content generation schemas

---

## Quick Reference

### Key Scripts (V3 Active)
```bash
search-news.ts               # Step 1: Search raw news (Google grounding)
news-structured.ts           # Step 2: Generate structured content
insert-articles.ts           # Step 3: Insert articles + FTS5 index
check-duplicates-v3.ts       # Step 4: Duplicate detection (V3)
apply-updates.ts             # (Library) Apply updates to articles
generate-publication.ts      # Step 5: Generate publications
regenerate-updated-articles.ts # Step 5.5: Regenerate updated article JSON
generate-publication-json.ts # Step 6A: Export publication JSON
generate-article-json.ts     # Step 6B: Export article JSON
generate-indexes.ts          # Step 7A: Generate indexes
generate-rss.ts              # Step 7B: Generate RSS feed
```

### Utility Scripts
```bash
clean-database.ts            # Clean generated data, preserve raw_search
delete-articles-by-date.ts   # Delete articles for specific date
backfill-article-pubdates.ts # Backfill missing pub_date fields (legacy fix)
rebuild-fts5-clean.ts        # Rebuild FTS5 index
test-fts5-scoring.ts         # Test BM25 scoring
view-resolutions.ts          # View duplicate resolutions
```

### Database Queries
```sql
-- View resolution distribution
SELECT resolution, COUNT(*) FROM articles GROUP BY resolution;

-- View articles needing updates
SELECT id, headline FROM articles WHERE resolution='SKIP-UPDATE';

-- View article updates
SELECT a.headline, au.summary, au.datetime 
FROM articles a
JOIN article_updates au ON a.id = au.article_id
ORDER BY au.datetime DESC;

-- View publications
SELECT id, slug, headline, pub_date, pub_type FROM publications
ORDER BY pub_date DESC;
```

---

## Migration from V2

If you're migrating from V2 (entity-based approach), see **V3-MIGRATION-STRATEGY.md**.

Key changes:
- No more entity extraction (`index-entities.ts` not needed)
- No more weighted similarity (`check-duplicates.ts` replaced with `check-duplicates-v3.ts`)
- No more manual JSON parsing (use Zod structured output)
- FTS5 handles all text matching (no SQL unions)


# Example: Run Steps 3-7 for multiple dates
# Processes dates in order for proper duplicate detection across dates

for date in 2025-10-{06..15}; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📅 Processing $date..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Step 3: Insert articles + build FTS5 index
  npx tsx scripts/content-generation-v2/insert-articles.ts --date $date
  
  # Step 4: Detect duplicates (watch for SKIP-UPDATE count)
  npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date $date
  
  # Step 5: Generate publication
  npx tsx scripts/content-generation-v2/generate-publication.ts --date $date
  
  # Step 5.5: Regenerate updated articles (if Step 4 had any SKIP-UPDATE)
  # Check Step 4 output for "SKIP-UPDATE (merge): N" - if N > 0, this runs automatically
  UPDATE_COUNT=$(sqlite3 logs/content-generation-v2.db \
    "SELECT COUNT(DISTINCT article_id) FROM article_updates WHERE date(datetime) = '$date'")
  if [ "$UPDATE_COUNT" -gt 0 ]; then
    echo "   🔄 Step 5.5: Found $UPDATE_COUNT updated article(s), regenerating JSON..."
    npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date $date
  fi
  
  # Step 6: Export website JSON
  npx tsx scripts/content-generation-v2/generate-publication-json.ts --date $date
  npx tsx scripts/content-generation-v2/generate-article-json.ts --date $date
  
  echo ""
done

# Step 7: Generate indexes & RSS (after all dates processed)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Generating final indexes and RSS feed..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx tsx scripts/content-generation-v2/generate-indexes.ts
npx tsx scripts/content-generation-v2/generate-rss.ts

echo ""
echo "✅ Bulk processing complete!"

# Step 8: LAST UPDATE
npx tsx scripts/content-generation-v2/generate-last-updates.ts