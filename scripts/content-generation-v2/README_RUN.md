# Content Generation V3 - Quick Start Guide

**Last Updated**: October 2025  
**For**: Daily pipeline execution and database management

---

## 📑 Quick Navigation

| Section | Description |
|---------|-------------|
| [🚀 Quick Start](#-quick-start-run-the-pipeline) | Run the pipeline (automated or manual) |
| [🗄️ Database Management](#%EF%B8%8F-database-management) | Clean database, delete specific dates |
| [🔍 Database Inspection](#-database-inspection-tips) | SQL queries for costs, resolutions, coverage |
| [📊 Log Viewer Scripts](#-## 📊 Log Viewer Scripts

### Generate Last Updates (Email Notifications)

**Purpose**: Generate `public/data/last-updates.json` for email notification systems. This file lists recent publications and updated articles.

**Script**: `generate-last-updates.ts`

```bash
# Generate with default settings (looks back 1 day from today)
npx tsx scripts/content-generation-v2/generate-last-updates.ts

# Generate for specific date (looks back from that date)
npx tsx scripts/content-generation-v2/generate-last-updates.ts --date 2025-10-07

# Look back 2 days instead of 1
npx tsx scripts/content-generation-v2/generate-last-updates.ts --days 2

# Combine options
npx tsx scripts/content-generation-v2/generate-last-updates.ts --date 2025-10-07 --days 2
```

**Options**:
- `--date YYYY-MM-DD` - Reference date to look back from (default: today)
- `--days N` - Number of days to look back (default: 1)
- `--output PATH` - Output file path (default: `public/data/last-updates.json`)

**When to use**:
- ✅ Automatically called by pipeline (Step 8) with `--date $DATE`
- ✅ Run manually to regenerate email notification data
- ✅ Test email notification systems with historical data

**Important**: The `--date` parameter ensures that when running the pipeline for historical dates (e.g., Oct 7), the last-updates.json reflects publications and updates from that date's perspective, not from "today".

**Example Output** (`public/data/last-updates.json`):
```json
{
  "lastUpdated": "2025-10-18T07:47:10.386Z",
  "runDate": "2025-10-07",
  "publications": [
    {
      "slug": "daily-threat-publications-2025-10-07",
      "type": "publication-daily",
      "headline": "Daily Threat Intel - Oct 7, 2025",
      "articleCount": 8,
      "articles": [...]
    }
  ],
  "articles": {
    "updated": [
      {
        "slug": "cisa-issues-advisories-for-widespread-industrial-control-system-flaws",
        "headline": "CISA Issues Advisories for Widespread Industrial Control System Flaws",
        "updates": [...],
        "lastUpdated": "2025-10-07T12:34:56.789Z"
      }
    ]
  }
}
```

**Email Integration**:
Email notification systems can check this file to:
- Notify subscribers of new publications
- Alert users following specific articles that were updated
- Send digest emails with recent activity

---

### View API Call Logs-viewer-scripts) | View API logs, pipeline logs, resolutions |
| [🔧 Troubleshooting](#-common-troubleshooting) | Fix common issues |
| [📊 Monitoring](#-monitoring--analytics) | Daily health checks |

---

## 🚀 Quick Start: Run the Pipeline

### Option 1: Automated Full Pipeline (Recommended)

```bash
# Run complete pipeline for specific date (includes deployment)
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17

# Skip step 5.5 (regenerating updated articles)
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17 --skip-step-5.5

# Skip build and deployment (Steps 9-10) - useful for testing
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17 --no-publish

# Start from specific step (default is Step 3, which skips expensive Steps 1-2)
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17 --start-step 1

# Combine options
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17 --start-step 3 --no-publish
```

**What it does**:
- Steps 1-2: Search and structure (skipped by default, use `--start-step 1` or `--start-step 2`)
- Steps 3-7: Content generation (articles → duplicates → publication → JSON → indexes)
- Step 8: Generate last updates
- Step 9: Build static site (`npm run generate`) - skipped with `--no-publish`
- Step 10: Deploy to GitHub Pages - skipped with `--no-publish`

**Options**:
- `--start-step N` - Start from step N (default: 3, which skips expensive LLM calls in Steps 1-2)
- `--skip-step-5.5` - Skip regenerating articles that received updates. Use when you don't want to update old articles
- `--no-publish` - Skip build and deployment (Steps 9-10). Use for testing or when you only want to generate JSON files

**When to use**: 
- ✅ Daily production runs (default, starts from Step 3)
- ✅ Full end-to-end execution with deployment (default)
- ✅ Testing changes without deploying (`--no-publish`)
- ✅ Re-running expensive Steps 1-2 (`--start-step 1` or `--start-step 2`)

### Option 2: Manual Step-by-Step

```bash
# If you need more control or want to stop before deployment
DATE=2025-10-17

# Step 1-2: Search and structure
npx tsx scripts/content-generation-v2/search-news.ts --date $DATE --logtodb
npx tsx scripts/content-generation-v2/news-structured.ts --date $DATE --logtodb

# Step 3-4: Insert and check duplicates  
npx tsx scripts/content-generation-v2/insert-articles.ts --date $DATE
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date $DATE

# Step 5: Generate publication
npx tsx scripts/content-generation-v2/generate-publication.ts --date $DATE

# Step 5.5: Regenerate updated articles (safe to always run)
npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date $DATE

# Step 6: Export JSON
npx tsx scripts/content-generation-v2/generate-publication-json.ts --date $DATE
npx tsx scripts/content-generation-v2/generate-article-json.ts --date $DATE

# Step 7: Generate indexes & RSS
npx tsx scripts/content-generation-v2/generate-indexes.ts
npx tsx scripts/content-generation-v2/generate-rss.ts --limit 50
npx tsx scripts/content-generation-v2/generate-threat-level.ts

# Step 8: Generate last updates (looks back from specified date)
npx tsx scripts/content-generation-v2/generate-last-updates.ts --date $DATE
```

**When to use**:
- ✅ Testing/debugging specific steps
- ✅ Running without deployment
- ✅ Fine-grained control

---

## 🗄️ Database Management

### Clean Entire Database

**Purpose**: Wipe all generated data while preserving raw search results and API cost tracking.

```bash
# Interactive mode (prompts for confirmation)
npx tsx scripts/content-generation-v2/clean-database.ts

# Also delete Step 2 (structured_news) - keeps only raw_search & api_calls
npx tsx scripts/content-generation-v2/clean-database.ts --clear-step2

# Force mode (skip confirmation - use with caution!)
npx tsx scripts/content-generation-v2/clean-database.ts --force

# Delete EVERYTHING except api_calls (nuclear option)
npx tsx scripts/content-generation-v2/clean-database.ts --delete-all
```

**Default Mode - What it preserves**:
- ✅ `raw_search` (Step 1 - Google News search results)
- ✅ `structured_news` (Step 2 - LLM structured output)
- ✅ `api_calls` (cost tracking and analytics)

**Default Mode - What it deletes**:
- ❌ `articles` and all related tables (Step 3+ data)
- ❌ `publications` (Step 5+ data)

**`--clear-step2` Mode - What it preserves**:
- ✅ `raw_search` (Step 1 only)
- ✅ `api_calls` (cost tracking)

**`--clear-step2` Mode - What it deletes**:
- ❌ `structured_news` (Step 2 LLM output)
- ❌ `articles` and all related tables (Step 3+ data)
- ❌ `publications` (Step 5+ data)

**When to use**:
- **Default mode**: Testing Steps 3+ changes (duplicate detection, publication logic)
- **`--clear-step2`**: Regenerating Step 2 output with new prompts or logic
- **`--delete-all`**: Complete fresh start (will re-run Step 1 search)

**After cleaning (default mode), regenerate from Step 3**:
```bash
# Example: Regenerate Oct 15-17 from Step 3
for date in 2025-10-15 2025-10-16 2025-10-17; do
  npx tsx scripts/content-generation-v2/insert-articles.ts --date $date
  npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date $date
  npx tsx scripts/content-generation-v2/generate-publication.ts --date $date
  npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date $date
  npx tsx scripts/content-generation-v2/generate-publication-json.ts --date $date
  npx tsx scripts/content-generation-v2/generate-article-json.ts --date $date
done

npx tsx scripts/content-generation-v2/generate-indexes.ts
npx tsx scripts/content-generation-v2/generate-rss.ts
npx tsx scripts/content-generation-v2/generate-threat-level.ts
npx tsx scripts/content-generation-v2/generate-last-updates.ts --date $date
```

**After cleaning with `--clear-step2`, regenerate from Step 2**:
```bash
# Example: Regenerate Oct 15-17
for date in 2025-10-15 2025-10-16 2025-10-17; do
  npx tsx scripts/content-generation-v2/news-structured.ts --date $date --logtodb
  npx tsx scripts/content-generation-v2/insert-articles.ts --date $date
  npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date $date
  npx tsx scripts/content-generation-v2/generate-publication.ts --date $date
  npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date $date
  npx tsx scripts/content-generation-v2/generate-publication-json.ts --date $date
  npx tsx scripts/content-generation-v2/generate-article-json.ts --date $date
done

npx tsx scripts/content-generation-v2/generate-indexes.ts
npx tsx scripts/content-generation-v2/generate-rss.ts
npx tsx scripts/content-generation-v2/generate-threat-level.ts
npx tsx scripts/content-generation-v2/generate-last-updates.ts --date $(echo $date | tail -1)
```

---

### Delete Specific Date

**Purpose**: Delete articles for a specific date to allow re-running Steps 3-7.

```bash
# Interactive mode (prompts for confirmation)
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-08

# Force mode (skip confirmation)
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-08 --force
```

**What it preserves**:
- ✅ `raw_search` (Step 1 data)
- ✅ `structured_news` (Step 2 data)
- ✅ `api_calls` (cost tracking)
- ✅ Articles from other dates

**What it deletes for that date**:
- ❌ `articles` and all related tables
- ❌ `article_cves`, `article_entities`, `article_tags`, etc.
- ❌ `article_updates`, `article_resolutions`
- ❌ `articles_fts` (FTS5 index entries)
- ❌ `publications` (for that date)

**When to use**:
- Testing duplicate detection changes
- Verifying source merging behavior
- Re-running article insertion after schema changes
- Debugging specific date processing

**After deletion, re-run from Step 3**:
```bash
DATE=2025-10-08

# Step 3: Insert articles
npx tsx scripts/content-generation-v2/insert-articles.ts --date $DATE

# Step 4: Check duplicates
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date $DATE

# Step 5+: Continue pipeline
npx tsx scripts/content-generation-v2/generate-publication.ts --date $DATE
npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date $DATE
npx tsx scripts/content-generation-v2/generate-publication-json.ts --date $DATE
npx tsx scripts/content-generation-v2/generate-article-json.ts --date $DATE
npx tsx scripts/content-generation-v2/generate-indexes.ts
npx tsx scripts/content-generation-v2/generate-rss.ts
npx tsx scripts/content-generation-v2/generate-threat-level.ts
npx tsx scripts/content-generation-v2/generate-last-updates.ts --date $DATE
```

---

## 🔍 Database Inspection Tips

### Check API Costs

```bash
# Total cost by script
sqlite3 logs/content-generation-v2.db \
  "SELECT script_name, ROUND(SUM(cost_usd), 2) as total_cost 
   FROM api_calls 
   GROUP BY script_name 
   ORDER BY total_cost DESC;"

# Output:
# script_name                     total_cost
# ------------------------------  ----------
# news-structured.ts              45.67
# check-duplicates-v3.ts          12.34
# search-news.ts                  8.90

# Cost by date
sqlite3 logs/content-generation-v2.db \
  "SELECT date(created_at) as date, 
          ROUND(SUM(cost_usd), 2) as daily_cost 
   FROM api_calls 
   GROUP BY date(created_at) 
   ORDER BY date DESC 
   LIMIT 7;"

# Detailed breakdown for specific date
sqlite3 logs/content-generation-v2.db \
  "SELECT script_name, model, 
          input_tokens, output_tokens, 
          ROUND(cost_usd, 4) as cost 
   FROM api_calls 
   WHERE date(created_at) = '2025-10-17' 
   ORDER BY created_at;"

# Total cost (all time)
sqlite3 logs/content-generation-v2.db \
  "SELECT ROUND(SUM(cost_usd), 2) as total_cost FROM api_calls;"
```

### Check Resolution Distribution

```bash
# Resolutions for specific date
sqlite3 logs/content-generation-v2.db \
  "SELECT resolution, COUNT(*) as count 
   FROM articles 
   WHERE date(created_at) = '2025-10-17' 
   GROUP BY resolution;"

# Output:
# resolution   count
# -----------  -----
# NEW          3
# SKIP-FTS5    2
# SKIP-UPDATE  1

# Resolution trends over last 7 days
sqlite3 logs/content-generation-v2.db \
  "SELECT date(created_at) as date, resolution, COUNT(*) as count 
   FROM articles 
   WHERE date(created_at) >= date('now', '-7 days')
   GROUP BY date(created_at), resolution 
   ORDER BY date DESC, resolution;"
```

### Check Article Updates

```bash
# Articles that received updates (for specific date)
sqlite3 logs/content-generation-v2.db \
  "SELECT a.id, a.slug, a.headline,
          json_array_length(a.updates) as update_count
   FROM articles a
   WHERE json_array_length(a.updates) > 0
     AND date(a.created_at) = '2025-10-17';"

# Articles with SKIP-UPDATE resolution (merged into old articles)
sqlite3 logs/content-generation-v2.db \
  "SELECT id, headline, duplicate_of, skip_reasoning 
   FROM articles 
   WHERE resolution = 'SKIP-UPDATE' 
     AND date(created_at) = '2025-10-17';"

# Find which articles were updated by a specific date's processing
sqlite3 logs/content-generation-v2.db \
  "SELECT a.slug, a.headline,
          json_extract(value, '$.datetime') as update_time
   FROM articles a,
        json_each(a.updates) 
   WHERE date(json_extract(value, '$.datetime')) = '2025-10-17';"
```

### Check Table Sizes

```bash
# Count rows in each table
sqlite3 logs/content-generation-v2.db <<EOF
.mode column
.headers on
SELECT 'raw_search' as table_name, COUNT(*) as rows FROM raw_search
UNION ALL SELECT 'structured_news', COUNT(*) FROM structured_news
UNION ALL SELECT 'articles', COUNT(*) FROM articles
UNION ALL SELECT 'publications', COUNT(*) FROM publications
UNION ALL SELECT 'api_calls', COUNT(*) FROM api_calls;
EOF

# Database file size
ls -lh logs/content-generation-v2.db

# Check FTS5 index size
sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(*) FROM articles_fts;"
```

### Check Source Coverage

```bash
# Top sources by article count
sqlite3 logs/content-generation-v2.db \
  "SELECT json_extract(value, '$.friendly_name') as source,
          COUNT(*) as article_count
   FROM articles,
        json_each(articles.sources)
   WHERE date(articles.created_at) >= date('now', '-7 days')
   GROUP BY source
   ORDER BY article_count DESC
   LIMIT 10;"

# Articles missing friendly_name (SEO issue)
sqlite3 logs/content-generation-v2.db \
  "SELECT a.id, a.headline,
          json_extract(value, '$.url') as source_url
   FROM articles a,
        json_each(a.sources)
   WHERE json_extract(value, '$.friendly_name') IS NULL
     AND date(a.created_at) = '2025-10-17';"
```

### Check MITRE Coverage

```bash
# Articles with MITRE techniques
sqlite3 logs/content-generation-v2.db \
  "SELECT date(created_at) as date,
          COUNT(*) as total_articles,
          SUM(CASE WHEN json_array_length(mitre_techniques) > 0 THEN 1 ELSE 0 END) as with_mitre
   FROM articles
   WHERE resolution = 'NEW'
   GROUP BY date(created_at)
   ORDER BY date DESC
   LIMIT 7;"

# Most common MITRE techniques
sqlite3 logs/content-generation-v2.db \
  "SELECT json_extract(value, '$.id') as technique_id,
          json_extract(value, '$.name') as technique_name,
          COUNT(*) as frequency
   FROM articles,
        json_each(articles.mitre_techniques)
   WHERE date(articles.created_at) >= date('now', '-30 days')
     AND articles.resolution = 'NEW'
   GROUP BY technique_id
   ORDER BY frequency DESC
   LIMIT 10;"
```

### Check Severity Distribution

```bash
# Severity breakdown for recent articles
sqlite3 logs/content-generation-v2.db \
  "SELECT severity, COUNT(*) as count
   FROM articles
   WHERE resolution = 'NEW'
     AND date(created_at) >= date('now', '-7 days')
   GROUP BY severity
   ORDER BY 
     CASE severity
       WHEN 'critical' THEN 1
       WHEN 'high' THEN 2
       WHEN 'medium' THEN 3
       WHEN 'low' THEN 4
       WHEN 'informational' THEN 5
     END;"
```

---

## 🔧 Common Troubleshooting

### Issue: "No articles found for date"

**Cause**: Step 1 (search-news) or Step 2 (structured content) hasn't run yet.

**Fix**:
```bash
# Check if raw search exists
sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(*) FROM raw_search WHERE pub_date = '2025-10-17';"

# If 0, run Step 1
npx tsx scripts/content-generation-v2/search-news.ts --date 2025-10-17 --logtodb

# Check if structured content exists
sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(*) FROM structured_news WHERE pub_date = '2025-10-17';"

# If 0, run Step 2
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-17 --logtodb
```

### Issue: "Article JSON missing updates array"

**Cause**: Forgot to run Step 5.5 after Step 4 had SKIP-UPDATE resolutions.

**Fix**:
```bash
# Regenerate articles that received updates
npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date 2025-10-17

# Then regenerate indexes
npx tsx scripts/content-generation-v2/generate-indexes.ts
```

### Issue: "High API costs"

**Cause**: Running Steps 1-2 multiple times unnecessarily.

**Prevention**:
- ✅ Use `delete-articles-by-date.ts` to re-run Steps 3+ without re-running Steps 1-2
- ✅ Check database before re-running: `SELECT COUNT(*) FROM structured_news WHERE pub_date = 'YYYY-MM-DD'`
- ✅ Use `--dry-run` flag when testing Step 4 changes

**Analysis**:
```bash
# Identify expensive operations
sqlite3 logs/content-generation-v2.db \
  "SELECT script_name, date(created_at), 
          COUNT(*) as calls, 
          ROUND(SUM(cost_usd), 2) as cost 
   FROM api_calls 
   GROUP BY script_name, date(created_at) 
   ORDER BY cost DESC 
   LIMIT 10;"
```

### Issue: "Duplicate articles still being published"

**Cause**: FTS5 thresholds may need adjustment or specific case needs investigation.

**Debug**:
```bash
# Check similarity scores for potential duplicates
sqlite3 logs/content-generation-v2.db \
  "SELECT id, headline, resolution, 
          similarity_score, duplicate_of 
   FROM articles 
   WHERE date(created_at) = '2025-10-17' 
   ORDER BY similarity_score DESC;"

# If score is between -81 and -200, LLM should have been called
# Check if LLM was actually invoked (should see in api_calls)
```

---

## 📊 Monitoring & Analytics

### Daily Health Check

```bash
# Run this after daily pipeline to verify everything is correct
DATE=$(date -v-1d +%Y-%m-%d)  # Yesterday's date

echo "📊 Health Check for $DATE"
echo ""

# 1. Check if raw search ran
echo "1. Raw Search:"
sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(*) || ' articles' FROM raw_search WHERE pub_date = '$DATE';"

# 2. Check if structured content generated
echo "2. Structured Content:"
sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(*) || ' publications' FROM structured_news WHERE pub_date = '$DATE';"

# 3. Check article resolution distribution
echo "3. Resolution Distribution:"
sqlite3 logs/content-generation-v2.db \
  "SELECT resolution, COUNT(*) FROM articles 
   WHERE date(created_at) = '$DATE' 
   GROUP BY resolution;"

# 4. Check publication created
echo "4. Publications:"
sqlite3 logs/content-generation-v2.db \
  "SELECT COUNT(*) || ' publications' FROM publications WHERE pub_date = '$DATE';"

# 5. Check API costs
echo "5. API Costs:"
sqlite3 logs/content-generation-v2.db \
  "SELECT '$' || ROUND(SUM(cost_usd), 2) FROM api_calls 
   WHERE date(created_at) = '$DATE';"
```

---

## � Log Viewer Scripts

### View API Call Logs

**Purpose**: Review API call history, costs, and token usage.

**Script**: `view-logs.ts`

```bash
# View last 20 API calls (default)
npx tsx scripts/content-generation-v2/view-logs.ts

# View last 5 API calls
npx tsx scripts/content-generation-v2/view-logs.ts --limit 5

# Filter by script name
npx tsx scripts/content-generation-v2/view-logs.ts --script news-structured

# View only today's API calls
npx tsx scripts/content-generation-v2/view-logs.ts --today

# Combine filters
npx tsx scripts/content-generation-v2/view-logs.ts --script check-duplicates-v3 --today
```

**Example Output**:
```
📊 API Call Logs

Found 5 API call(s):

[465] news-structured - gemini-2.5-pro
   Time: 2025-10-18 05:36:59
   Type: generation
   Tokens: 19,480 in + 38,562 out = 58,042 total
   Cost: $0.4100

[464] news-structured - gemini-2.5-pro
   Time: 2025-10-18 05:09:59
   Type: generation
   Tokens: 19,466 in + 44,482 out = 63,948 total
   Cost: $0.4692

──────────────────────────────────────────────────
Total: 130,190 tokens, $0.8819

📈 Summary Statistics:

   Total API calls: 465
   Total tokens: 3,345,915
   Total cost: $17.0122

📊 By Script:

   news-structured: 54 calls, 1,836,867 tokens, $12.1853
   search-news: 54 calls, 450,239 tokens, $4.4293
   check-duplicates-v3: 344 calls, 1,027,693 tokens, $0.3943
```

**When to use**:
- ✅ Analyze API cost patterns
- ✅ Identify expensive scripts
- ✅ Debug token usage spikes
- ✅ Track daily/weekly costs

**Pro Tip**: This script is more useful than deprecated log viewer scripts for understanding costs and LLM usage. Pipeline execution logs are primarily tracked in the database for debugging specific runs.

---

## 🔍 V3 Resolution Tracking

**In V3**, article resolutions are stored directly in the `articles` table, not in a separate table. Use SQL queries to inspect resolution decisions:

```bash
# View resolutions for specific date
sqlite3 logs/content-generation-v2.db \
  "SELECT resolution, COUNT(*) as count 
   FROM articles 
   WHERE date(created_at) = '2025-10-17' 
   GROUP BY resolution;"

# Output:
# NEW|8
# SKIP-FTS5|2

# View detailed resolution info for specific date
sqlite3 logs/content-generation-v2.db \
  "SELECT id, headline, resolution, similarity_score, 
          duplicate_of, skip_reasoning
   FROM articles 
   WHERE date(created_at) = '2025-10-17' 
   ORDER BY resolution, similarity_score DESC;"

# Resolution trends over last 7 days
sqlite3 logs/content-generation-v2.db \
  "SELECT date(created_at) as date, resolution, COUNT(*) as count 
   FROM articles 
   WHERE date(created_at) >= date('now', '-7 days')
   GROUP BY date(created_at), resolution 
   ORDER BY date DESC, resolution;"
```

**V3 Resolution Types**:
- `NEW` - New article, published
- `SKIP-FTS5` - Duplicate detected by FTS5 BM25 search (automatic, no LLM)
- `SKIP-LLM` - Duplicate confirmed by LLM analysis
- `SKIP-UPDATE` - Article is update to existing article (LLM detected update)
- `UPDATE` - (Deprecated in V3, use `article_updates` table instead)

**Related Columns**:
- `similarity_score` - BM25 score from FTS5 (lower = more similar)
- `duplicate_of` - Article ID this is a duplicate/update of (if SKIP-*)
- `skip_reasoning` - JSON array of reasons for skip decision

**V2 Note**: The old `view-resolutions.ts` script and `article_resolutions` table were deprecated in V3. V3 uses simpler, more efficient resolution tracking directly in the articles table.

---

## 📚 See Also

---

### View Article Resolutions (V2 - Deprecated)

**Purpose**: View article resolution decisions from V2 pipeline.

**Script**: `view-resolutions.ts`

**⚠️ NOTE**: This script uses the V2 `article_resolutions` table which was replaced in V3 with `articles.resolution` column. Use the inspection queries in this README instead.

**V3 Alternative** - Check article resolutions:
```bash
# View resolutions for specific date
sqlite3 logs/content-generation-v2.db \
  "SELECT resolution, COUNT(*) as count 
   FROM articles 
   WHERE date(created_at) = '2025-10-17' 
   GROUP BY resolution;"

# View detailed resolution info for specific date
sqlite3 logs/content-generation-v2.db \
  "SELECT id, headline, resolution, similarity_score, 
          duplicate_of, skip_reasoning
   FROM articles 
   WHERE date(created_at) = '2025-10-17' 
   ORDER BY resolution, similarity_score DESC;"

# Resolution trends over last 7 days
sqlite3 logs/content-generation-v2.db \
  "SELECT date(created_at) as date, resolution, COUNT(*) as count 
   FROM articles 
   WHERE date(created_at) >= date('now', '-7 days')
   GROUP BY date(created_at), resolution 
   ORDER BY date DESC, resolution;"
```

**Migration Note**: In V3, resolution data is stored directly in the `articles` table with these columns:
- `resolution` - NEW, SKIP-FTS5, SKIP-LLM, SKIP-UPDATE
- `similarity_score` - BM25 score (lower = more similar)
- `duplicate_of` - Reference to original article if SKIP-*
- `skip_reasoning` - JSON array of reasons for skip decision

---

## �📚 See Also

- **[V3-PIPELINE.md](V3-PIPELINE.md)** - Complete pipeline documentation with detailed step explanations
- **[LLM.md](LLM.md)** - LLM integration, prompting, and cost tracking details
- **[SCHEMA.md](SCHEMA.md)** - Database schema reference
- **run-pipeline.sh** - Automated pipeline script (Steps 1-10)

---

**Questions?** Check V3-PIPELINE.md for detailed step-by-step documentation.
