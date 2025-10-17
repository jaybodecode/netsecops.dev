# Pipeline Execution Guide - Steps 3-9 for Days 7-1

## 🎯 Objective
Process 7 days of cybersecurity news publications (Oct 7-13, 2025) through the content generation pipeline Steps 3-9, creating a complete database of articles with proper entity relationships, indexes, RSS feeds, and email notification files.

## 📋 Pre-Execution Checklist

### ✅ Cleanup Complete
- [x] Removed all `*_classified.json` and `*_llm-decided.json` files from OUTPUT/
- [x] Cleaned `public/data/articles/` and `public/data/publications/`
- [x] Deleted database: `logs/content-generation.db`
- [x] RSS directory ready (will be created by pipeline)

### ✅ Files Ready
All 7 raw publication files exist in OUTPUT/:
```
publication-unified_7daysago_2025-10-14T05-01-51-778Z.json  (Oct 7, 92KB, 10 articles)
publication-unified_6daysago_2025-10-14T05-40-04-771Z.json  (Oct 8, 73KB, 10 articles) 
publication-unified_5daysago_2025-10-14T06-13-59-457Z.json  (Oct 9, 92KB, 10 articles)
publication-unified_4daysago_2025-10-14T06-33-40-628Z.json  (Oct 10, 95KB, 10 articles)
publication-unified_3daysago_2025-10-14T06-33-38-281Z.json  (Oct 11, 76KB, 10 articles)
publication-unified_2daysago_2025-10-14T06-33-59-135Z.json  (Oct 12, 85KB, 10 articles)
publication-unified_1dayago_2025-10-14T06-51-31-662Z.json   (Oct 13, 76KB, 10 articles)
```

### 🐛 Bugs Fixed
- **Timeframe Extraction Bug**: Fixed `run-pipeline.ts` to extract timeframe from input filename instead of using default `5daysago`
- **Filename Generation Bug**: Fixed `generate-publication-unified.ts` to handle both singular (`1dayago`) and plural (`2daysago`) formats
- **No Fallback Values**: Removed dangerous fallback defaults that silently used wrong values

---

## 🚀 Execution Plan

### Process Flow
Run pipeline Steps 3-9 for each day, **oldest to newest** (Day 7 → Day 1):

1. **Step 3**: Entity fingerprinting (CVEs, companies, threat actors)
2. **Step 4**: LLM comparison for UPDATE/SKIP/NEW decisions
3. **Step 5**: Save articles to database + `public/data/articles/`
4. **Step 6**: Save publication to database + `public/data/publications/`
5. **Step 7**: Generate master indexes
6. **Step 8**: Generate RSS feeds (all publications, updates, categories)
7. **Step 9**: Generate `last-updates.json` for email notifications

### Why Oldest → Newest?
- Entity fingerprinting detects duplicates against existing database
- Newer articles can be marked as UPDATE if similar to older ones
- Creates proper chronological ordering in indexes and RSS feeds

---

## 📝 Execution Steps

### **Day 7 (October 7, 2025)** - First Run 🏁

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 \
  --end=9 \
  --input=OUTPUT/publication-unified_7daysago_2025-10-14T05-01-51-778Z.json
```

**Expected Output Log Checks:**
```
✅ Timeframe: 7daysago  (NOT 5daysago - this confirms fix works!)
✅ Step 3: Entity fingerprinting completed
✅ Step 4: LLM Comparison (likely skipped - no POTENTIAL_UPDATE on first run)
✅ Step 5: Saved X articles (NEW articles, no duplicates expected)
✅ Step 6: Publication saved
✅ Step 7: Indexes generated (1 publication, X articles)
✅ Step 8: RSS feeds generated
✅ Step 9: last-updates.json created
```

**Post-Run Verification:**
```bash
# Check OUTPUT files created
ls -lh OUTPUT/publication-unified_7daysago_*

# Should see:
# - *_classified.json (Step 3 output)
# - *_llm-decided.json (Step 4 output, if POTENTIAL_UPDATE existed)

# Check database
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM articles;"
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;"
sqlite3 logs/content-generation.db "SELECT slug, headline FROM publications;"

# Check article files
ls public/data/articles/ | wc -l
ls public/data/publications/ | wc -l

# Check indexes
cat public/data/articles-index.json | jq '.articles | length'
cat public/data/publications-index.json | jq '.publications | length'

# Check RSS feeds (should create directory and files)
ls -lh public/rss/
cat public/rss/feed.xml | grep -c "<item>"

# Check last-updates
cat public/data/last-updates.json | jq '.'
```

**Expected Results:**
- ✅ Database: ~10 articles, 1 publication (daily-cybersecurity-briefing-2025-10-07)
- ✅ Files: ~10 files in public/data/articles/, 1 in publications/
- ✅ Indexes: Match database counts
- ✅ RSS: feed.xml with ~10 items, category feeds
- ✅ last-updates.json: 1 publication listed

---

### **Day 6 (October 8, 2025)**

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 \
  --end=9 \
  --input=OUTPUT/publication-unified_6daysago_2025-10-14T05-40-04-771Z.json
```

**Expected Output Log Checks:**
```
✅ Timeframe: 6daysago
✅ Step 4: May see POTENTIAL_UPDATE if articles overlap with Day 7
   - Watch for "UPDATE: X articles" vs "NEW: Y articles"
✅ Step 5: Some articles may show as UPDATE (existing articles refreshed)
```

**Post-Run Verification:**
```bash
# Database should now have ~20 articles (or slightly less if duplicates detected)
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM articles;"
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;"

# Check for duplicate detection
sqlite3 logs/content-generation.db \
  "SELECT slug, COUNT(*) as versions FROM articles GROUP BY slug HAVING COUNT(*) > 1;"

# Indexes should show 2 publications
cat public/data/publications-index.json | jq '.publications | length'

# RSS feed should have ~20 items
cat public/rss/feed.xml | grep -c "<item>"
```

**Expected Results:**
- ✅ Database: ~15-20 articles (some may be duplicates/updates), 2 publications
- ✅ Indexes: 2 publications
- ✅ RSS: Growing feed

---

### **Day 5 (October 9, 2025)**

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 \
  --end=9 \
  --input=OUTPUT/publication-unified_5daysago_2025-10-14T06-13-59-457Z.json
```

**Post-Run Verification:**
```bash
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM articles;"
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;"
cat public/data/publications-index.json | jq '.publications | length'
```

**Expected Results:**
- ✅ Database: ~20-30 articles, 3 publications
- ✅ Indexes: 3 publications

---

### **Day 4 (October 10, 2025)**

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 \
  --end=9 \
  --input=OUTPUT/publication-unified_4daysago_2025-10-14T06-33-40-628Z.json
```

**⚠️ CRITICAL CHECK**: This day had the "Ransomware Alliance" article that appeared in Day 5. Watch for:
```
✅ Step 4: Should detect POTENTIAL_UPDATE for duplicate
✅ Step 5: Should either UPDATE or SKIP the duplicate article
```

**Post-Run Verification:**
```bash
# Check if duplicate was handled
sqlite3 logs/content-generation.db \
  "SELECT slug, title, updated_at FROM articles WHERE slug LIKE '%ransomware%alliance%';"

# Should see only ONE row, possibly with updated_at timestamp
```

**Expected Results:**
- ✅ Database: ~30-40 articles (fewer if duplicates skipped), 4 publications
- ✅ No UNIQUE constraint errors
- ✅ Duplicate article handled gracefully

---

### **Day 3 (October 11, 2025)**

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 \
  --end=9 \
  --input=OUTPUT/publication-unified_3daysago_2025-10-14T06-33-38-281Z.json
```

**Post-Run Verification:**
```bash
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;"
cat public/data/last-updates.json | jq '.publications | length'
```

**Expected Results:**
- ✅ Database: ~35-50 articles, 5 publications

---

### **Day 2 (October 12, 2025)**

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 \
  --end=9 \
  --input=OUTPUT/publication-unified_2daysago_2025-10-14T06-33-59-135Z.json
```

**Expected Results:**
- ✅ Database: ~40-60 articles, 6 publications

---

### **Day 1 (October 13, 2025)** - Final Run 🏁

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 \
  --end=9 \
  --input=OUTPUT/publication-unified_1dayago_2025-10-14T06-51-31-662Z.json
```

**⚠️ NOTE**: This file was regenerated with the filename bug fix, so timeframe extraction must work correctly.

**Expected Output Log Checks:**
```
✅ Timeframe: 1dayago (NOT 5daysago!)
✅ 📝 Extracted timeframe from input: 1dayago
```

**Final Verification:**
```bash
# Complete database check
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM articles;"
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;"
sqlite3 logs/content-generation.db "SELECT slug, headline FROM publications ORDER BY slug;"

# Should see all 7 publications:
# daily-cybersecurity-briefing-2025-10-07
# daily-cybersecurity-briefing-2025-10-08
# daily-cybersecurity-briefing-2025-10-09
# daily-cybersecurity-briefing-2025-10-10
# daily-cybersecurity-briefing-2025-10-11
# daily-cybersecurity-briefing-2025-10-12
# daily-cybersecurity-briefing-2025-10-13

# Check indexes
cat public/data/publications-index.json | jq '.publications | length'
# Should be: 7

cat public/data/articles-index.json | jq '.articles | length'
# Should be: ~50-70 (depending on duplicates)

# Check RSS feeds
cat public/rss/feed.xml | grep -c "<item>"
cat public/rss/updates.xml | grep -c "<item>"
ls public/rss/category-*.xml | wc -l

# Check last-updates for email
cat public/data/last-updates.json | jq '.'
# Should have:
# - 7 publications listed
# - lastRunDate, latestPublicationDate, etc.
```

**Expected Final Results:**
- ✅ Database: ~50-70 unique articles, 7 publications (Oct 7-13)
- ✅ Files: ~50-70 article JSON files, 7 publication JSON files
- ✅ Indexes: publications-index.json (7 pubs), articles-index.json (~50-70 articles)
- ✅ RSS Feeds: feed.xml (all), updates.xml (recent), ~10 category feeds
- ✅ Email: last-updates.json with complete 7-day summary

---

## 🔍 Validation Checklist

### Database Integrity
```bash
# Check for orphaned articles (articles without publications)
sqlite3 logs/content-generation.db \
  "SELECT a.slug FROM articles a 
   LEFT JOIN publication_articles pa ON a.id = pa.article_id 
   WHERE pa.article_id IS NULL;"
# Should return: (empty)

# Check publication article counts
sqlite3 logs/content-generation.db \
  "SELECT p.slug, COUNT(pa.article_id) as article_count 
   FROM publications p 
   LEFT JOIN publication_articles pa ON p.id = pa.publication_id 
   GROUP BY p.id 
   ORDER BY p.slug;"
# Should show ~5-10 articles per publication

# Check for duplicate slugs
sqlite3 logs/content-generation.db \
  "SELECT slug, COUNT(*) as count FROM articles GROUP BY slug HAVING count > 1;"
# Should return: (empty - no duplicates)

# Check entity relationships
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM entities;"
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM article_entities;"
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM cves;"
```

### File System Integrity
```bash
# Article files match database
ARTICLE_COUNT_DB=$(sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM articles;")
ARTICLE_COUNT_FILES=$(ls public/data/articles/*.json 2>/dev/null | wc -l | tr -d ' ')
echo "DB: $ARTICLE_COUNT_DB, Files: $ARTICLE_COUNT_FILES"
# Should match

# Publication files match database
PUB_COUNT_DB=$(sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;")
PUB_COUNT_FILES=$(ls public/data/publications/*.json 2>/dev/null | wc -l | tr -d ' ')
echo "DB: $PUB_COUNT_DB, Files: $PUB_COUNT_FILES"
# Should match (7 each)

# Validate JSON files aren't corrupt
for file in public/data/articles/*.json; do 
  jq empty "$file" 2>/dev/null || echo "CORRUPT: $file"; 
done

for file in public/data/publications/*.json; do 
  jq empty "$file" 2>/dev/null || echo "CORRUPT: $file"; 
done
```

### RSS Feed Validation
```bash
# Check RSS feed structure
xmllint --noout public/rss/feed.xml && echo "✅ feed.xml valid"
xmllint --noout public/rss/updates.xml && echo "✅ updates.xml valid"

# Check item count matches expectations
FEED_ITEMS=$(xmllint --xpath "count(//item)" public/rss/feed.xml)
echo "RSS feed items: $FEED_ITEMS"
# Should be close to article count (but may differ based on publication logic)

# Check category feeds exist
ls public/rss/category-*.xml | wc -l
# Should be ~10 (one per category)
```

### Index Validation
```bash
# Validate index structure
jq empty public/data/articles-index.json && echo "✅ articles-index valid"
jq empty public/data/publications-index.json && echo "✅ publications-index valid"

# Check index counts match database
jq '.articles | length' public/data/articles-index.json
jq '.publications | length' public/data/publications-index.json

# Check slugs in index match database
sqlite3 logs/content-generation.db "SELECT slug FROM publications ORDER BY slug;" > /tmp/db_slugs.txt
jq -r '.publications[].slug' public/data/publications-index.json | sort > /tmp/index_slugs.txt
diff /tmp/db_slugs.txt /tmp/index_slugs.txt && echo "✅ Publication slugs match" || echo "❌ Mismatch!"
```

### Email Notification File
```bash
# Validate last-updates.json structure
jq empty public/data/last-updates.json && echo "✅ last-updates valid"

# Check required fields
jq -r '.lastRunDate, .latestPublicationDate, .totalArticles, .totalPublications' \
  public/data/last-updates.json

# Verify publication list
jq '.publications | length' public/data/last-updates.json
# Should be 7

jq -r '.publications[].slug' public/data/last-updates.json
# Should list all 7 publication slugs
```

---

## 🐛 Troubleshooting Guide

### Issue: "Timeframe: 5daysago" when processing non-5-day file
**Symptom:** Log shows `Timeframe: 5daysago` when you passed `--input=*_4daysago_*.json`

**Cause:** Timeframe extraction bug (should be fixed)

**Fix:** 
1. Check `run-pipeline.ts` lines 477-488 for timeframe extraction code
2. Verify it extracts from `options.input` filename
3. Should log: `📝 Extracted timeframe from input: 4daysago`

**Verification:**
```bash
grep "Extracted timeframe from input" [log output]
# Should match the actual file's timeframe
```

### Issue: UNIQUE constraint failed: articles.slug
**Symptom:** Pipeline fails during Step 5 with database constraint error

**Cause:** Duplicate article with identical slug trying to insert

**Root Cause:** Entity fingerprinting didn't catch the duplicate

**Fix:**
1. Check which article slug is duplicated in the error message
2. Query database: `sqlite3 logs/content-generation.db "SELECT * FROM articles WHERE slug='...'"`
3. **Proper Fix:** Improve entity fingerprinting in Step 3
4. **Quick Fix:** Delete the older version and re-run:
   ```bash
   sqlite3 logs/content-generation.db "DELETE FROM articles WHERE slug='duplicate-slug';"
   # Re-run the failed day's pipeline
   ```

### Issue: Step 4 always skipped
**Symptom:** `⏭️ Step 4 skipped - no POTENTIAL_UPDATE articles`

**Expected:** This is normal for:
- First publication (Day 7) - nothing to compare against
- Publications with completely new articles

**Concerning If:** ALL days show skipped
- Means entity fingerprinting isn't finding similar articles
- Check entity extraction quality in Step 3 output

**Verification:**
```bash
# Check classified file for action distribution
jq '[.classifications[].action] | group_by(.) | map({action: .[0], count: length})' \
  OUTPUT/publication-unified_*_classified.json
# Should see mix of: NEW, POTENTIAL_UPDATE, maybe SKIP
```

### Issue: Article/publication counts don't match
**Symptom:** Database says 50 articles, but only 45 files exist

**Causes:**
1. File write failure (permissions)
2. JSON corruption during save
3. Incomplete pipeline run

**Fix:**
```bash
# Find missing articles
sqlite3 logs/content-generation.db "SELECT slug FROM articles;" | sort > /tmp/db_articles.txt
ls public/data/articles/ | sed 's/.json$//' | sort > /tmp/file_articles.txt
comm -23 /tmp/db_articles.txt /tmp/file_articles.txt
# Shows articles in DB but not in files

# Option 1: Regenerate files from database
npx tsx scripts/content-generation/cli/regenerate-article-files.ts

# Option 2: Delete from DB and re-run
sqlite3 logs/content-generation.db "DELETE FROM articles WHERE slug='missing-slug';"
```

### Issue: RSS feed empty or incomplete
**Symptom:** feed.xml exists but has 0 items

**Causes:**
1. No publications in database
2. Step 8 failed silently
3. Wrong publication dates/status

**Fix:**
```bash
# Re-run Step 8 independently
npx tsx scripts/content-generation/cli/generate-rss-feeds.ts

# Check publication status in DB
sqlite3 logs/content-generation.db \
  "SELECT slug, status, published_at FROM publications;"
# All should have status='published' and valid published_at date
```

---

## 🚨 Critical Reminders

### Production Deployment
When running in production (GitHub Actions), the pipeline will execute **WITHOUT ARGUMENTS**:
```bash
# Production runs all steps from scratch
npx tsx scripts/content-generation/cli/run-pipeline.ts
```

This means:
- ✅ Step 1 runs (search-news.ts with default timeframe)
- ✅ Step 2 runs (generate-publication-unified.ts)
- ✅ Steps 3-9 run automatically
- ✅ Pipeline determines timeframe from search results

**For this manual execution**, we're using `--start=3` because Steps 1-2 already completed (expensive LLM calls).

### Order Matters
- **Must process oldest → newest** (Day 7 → Day 1)
- Duplicate detection depends on existing database state
- Indexes and RSS feeds built incrementally

### Backup Strategy
Before each day's execution, backup database:
```bash
cp logs/content-generation.db logs/content-generation.db.backup-day$(date +%s)
```

If something fails, restore and retry:
```bash
cp logs/content-generation.db.backup-TIMESTAMP logs/content-generation.db
```

---

## 📊 Success Criteria

### Database
- ✅ 7 publications (Oct 7-13, 2025)
- ✅ ~50-70 unique articles (no duplicate slugs)
- ✅ All articles linked to at least one publication
- ✅ Entity relationships populated (CVEs, companies, threat actors, MITRE techniques)

### Files
- ✅ ~50-70 JSON files in `public/data/articles/`
- ✅ 7 JSON files in `public/data/publications/`
- ✅ `public/data/articles-index.json` exists and valid
- ✅ `public/data/publications-index.json` exists and valid
- ✅ `public/data/last-updates.json` exists with 7 publications

### RSS
- ✅ `public/rss/feed.xml` with all publication items
- ✅ `public/rss/updates.xml` with recent updates
- ✅ ~10 `public/rss/category-*.xml` files

### Log Quality
- ✅ Each day's log shows correct timeframe extracted
- ✅ No UNIQUE constraint errors
- ✅ Duplicate detection working (some UPDATE/SKIP actions)
- ✅ All steps complete successfully

---

## 🎯 Next Steps After Completion

1. **Test Production Pipeline**
   - Run full pipeline with no arguments to simulate GitHub Action
   - Verify Steps 1-9 all work end-to-end

2. **Set Up GitHub Action**
   - Schedule daily runs
   - Monitor for failures
   - Set up notifications

3. **Email Integration**
   - Parse `last-updates.json` in email service
   - Generate HTML emails from publication/article data
   - Test subscription flow

---

## 📝 Notes

- **Execution Time**: Each day takes ~6-8 seconds (Steps 3-9)
- **Total Time**: ~45-60 seconds for all 7 days
- **Database Size**: ~5-10 MB after completion
- **LLM Costs**: $0 (Steps 1-2 already completed, Step 4 uses cached data)
- **Main Bottleneck**: Entity fingerprinting (Step 3) and file I/O

---

**Document Version**: 1.0
**Created**: October 14, 2025
**Last Updated**: October 14, 2025
**Status**: Ready for Execution ✅
