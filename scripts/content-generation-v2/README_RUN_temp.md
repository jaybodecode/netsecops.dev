# Content Generation V3 - Quick Start Guide

**Last Updated**: October 2025  
**For**: Daily pipeline execution and database management

---

## 📑 Quick Navigation

| Section | Description |
|---------|-------------|
| [🚀 Quick Start](#-quick-start-run-the-pipeline) | Run the pipeline (automated or manual) |
| [🗄️ Database Management](#%EF%B8%8F-database-management) | Clean database, delete specific dates |
| [🔍 Database Inspection](#-database-inspection) | Query database with view-logs tool |
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

## 🔍 Database Inspection

Use the `view-logs.ts` script to query the database:

```bash
# View database table statistics
npx tsx scripts/content-generation-v2/view-logs.ts tables

# Check API costs (total and by script)
npx tsx scripts/content-generation-v2/view-logs.ts costs --days 7

# Check API costs for specific date
npx tsx scripts/content-generation-v2/view-logs.ts costs --date 2025-10-17

# View API call logs
npx tsx scripts/content-generation-v2/view-logs.ts api --limit 20
npx tsx scripts/content-generation-v2/view-logs.ts api --script search-news --today

# Check article resolutions (NEW, SKIP-FTS5, SKIP-UPDATE, etc.)
npx tsx scripts/content-generation-v2/view-logs.ts resolutions --date 2025-10-17

# Check articles that received updates
npx tsx scripts/content-generation-v2/view-logs.ts updates --date 2025-10-17

# Check severity distribution
npx tsx scripts/content-generation-v2/view-logs.ts severity --days 7

# Top sources (when sources column is added)
npx tsx scripts/content-generation-v2/view-logs.ts sources --days 7 --limit 10

# MITRE ATT&CK coverage (when mitre_techniques column is added)
npx tsx scripts/content-generation-v2/view-logs.ts mitre --days 7 --limit 15
```

**Available Commands**:
- `api` - View API call logs with filters
- `costs` - API cost analysis by script and date
- `tables` - Database table row counts
- `resolutions` - Article resolution distribution
- `updates` - Articles that received updates
- `severity` - Severity distribution (critical/high/medium/low)
- `sources` - Top sources (requires sources column)
- `mitre` - MITRE ATT&CK coverage (requires mitre_techniques column)

---

## 🔧 Common Troubleshooting

### Issue: "No articles found for date"

**Cause**: Step 1 (search-news) or Step 2 (structured content) hasn't run yet.

**Fix**:
```bash
# Check database tables
npx tsx scripts/content-generation-v2/view-logs.ts tables

# If raw_search or structured_news is 0, run the appropriate step
npx tsx scripts/content-generation-v2/search-news.ts --date 2025-10-17 --logtodb
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
