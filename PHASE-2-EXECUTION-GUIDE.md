# Phase 2 Pipeline - Execution Guide

**Date:** October 13, 2025  
**Status:** Implementation Complete ✅ | Ready for Testing 🚀

---

## 🎯 Complete Pipeline

All 4 steps are now implemented and ready to run!

```
Step 1: Search (search-news.ts)          ✅ Existing
Step 2: Generate (generate-publication)  ✅ NEW - Unified generation
Step 3: Filter (filter-articles-entity)  ✅ NEW - Entity-based filtering
Step 4: Save (save-articles-with-entities) ✅ NEW - Database + files
Step 5: Indexes (generate-indexes.ts)    ✅ Existing
```

---

## 📋 Execution Commands

### **Quick Test (5 days ago, 5 articles)**

```bash
# Step 1: Search for news from 5 days ago
npx tsx scripts/content-generation/cli/search-news.ts --days=5

# Step 2: Generate publication + 5 articles in ONE call
npx tsx scripts/content-generation/cli/generate-publication-unified.ts \
  --input=OUTPUT/search-news_$(date -v-5d +%Y-%m-%d).json \
  --count=5

# Step 3: Entity-based filtering & classification
npx tsx scripts/content-generation/cli/filter-articles-entity.ts \
  --input=OUTPUT/publication-unified_$(date -v-5d +%Y-%m-%d).json \
  --verbose

# Step 4: Save NEW/UPDATE articles to database + files
npx tsx scripts/content-generation/cli/save-articles-with-entities.ts \
  --input=OUTPUT/publication-unified_$(date -v-5d +%Y-%m-%d)_classified.json

# Step 5: Regenerate indexes
npx tsx scripts/content-generation/cli/generate-indexes.ts
```

### **Dry Run (Test Without Saving)**

```bash
# Step 2 with dry-run
npx tsx scripts/content-generation/cli/generate-publication-unified.ts \
  --input=OUTPUT/search-news_*.json \
  --count=5 \
  --dry-run

# Step 3 with verbose logging
npx tsx scripts/content-generation/cli/filter-articles-entity.ts \
  --input=OUTPUT/publication-unified_*.json \
  --dry-run \
  --verbose

# Step 4 with dry-run
npx tsx scripts/content-generation/cli/save-articles-with-entities.ts \
  --input=OUTPUT/publication-unified_*_classified.json \
  --dry-run
```

---

## 🔍 Verification Checklist

### After Step 1 (Search)
```bash
# Check output file exists
ls -lh OUTPUT/search-news_*.json

# Verify content
jq '.metadata' OUTPUT/search-news_*.json
jq '.rawText | length' OUTPUT/search-news_*.json
```

### After Step 2 (Generate)
```bash
# Check output file
ls -lh OUTPUT/publication-unified_*.json

# Verify structure
jq '.pub_id, .headline, (.articles | length)' OUTPUT/publication-unified_*.json

# Check database audit trail
sqlite3 logs/content-generation.db "SELECT * FROM publications_raw ORDER BY created_at DESC LIMIT 1;"

# Verify token tracking
sqlite3 logs/content-generation.db "SELECT * FROM api_calls ORDER BY called_at DESC LIMIT 1;"
```

### After Step 3 (Filter)
```bash
# Check classifications file
ls -lh OUTPUT/publication-unified_*_classified.json

# View classification summary
jq '.classifications[] | {article_id, action, similarity, candidate_count}' \
  OUTPUT/publication-unified_*_classified.json

# Count by action
jq '.classifications | group_by(.action) | map({action: .[0].action, count: length})' \
  OUTPUT/publication-unified_*_classified.json
```

### After Step 4 (Save)
```bash
# Check database stats
sqlite3 logs/content-generation.db "SELECT * FROM v_articles_with_counts;"

# Verify entity relationships
sqlite3 logs/content-generation.db "
  SELECT a.article_id, a.headline, 
         COUNT(DISTINCT ac.cve_id) as cves,
         COUNT(DISTINCT ae.entity_id) as entities,
         COUNT(DISTINCT am.technique_id) as mitre
  FROM articles a
  LEFT JOIN article_cves ac ON a.article_id = ac.article_id
  LEFT JOIN article_entities ae ON a.article_id = ae.article_id
  LEFT JOIN article_mitre am ON a.article_id = am.article_id
  GROUP BY a.article_id
  ORDER BY a.created_at DESC
  LIMIT 5;
"

# Check JSON files
ls -lh public/data/articles/*/
```

### Cost Verification
```bash
# View cost summary
sqlite3 logs/content-generation.db "SELECT * FROM v_cost_by_run ORDER BY started_at DESC LIMIT 1;"

# View detailed API calls
sqlite3 logs/content-generation.db "
  SELECT 
    api_provider,
    model_name,
    operation,
    tokens_input,
    tokens_output,
    ROUND(cost_usd, 4) as cost
  FROM api_calls
  ORDER BY called_at DESC
  LIMIT 5;
"
```

---

## 📊 Expected Results

### Performance Targets
- **Step 1 (Search):** ~10-30 seconds, ~50K tokens, ~$0.10
- **Step 2 (Generate):** ~30-60 seconds, ~150K tokens, ~$0.40
- **Step 3 (Filter):** ~0.5-2 seconds (5-50 candidates per article)
- **Step 4 (Save):** ~2-5 seconds
- **Total Runtime:** ~1-2 minutes
- **Total Cost:** ~$0.50 (was $5.00 with old approach)

### Entity Filtering Performance
```
✅ GOOD: Avg 5-50 candidates per article
⚠️  WARNING: Avg 100-200 candidates (check entity specificity)
❌ BAD: Avg 1000+ candidates (entity filtering not working)
```

### Classification Distribution (Typical)
```
🆕 NEW: 60-80% (most articles are unique)
🔄 UPDATE: 10-20% (related to existing stories)
⏭️  SKIP: 5-10% (exact duplicates)
```

---

## 🐛 Troubleshooting

### Issue: "No candidates found" for all articles
**Cause:** Empty database (first run)  
**Solution:** Expected! All articles will be NEW on first run

### Issue: "10,000+ candidates per article"
**Cause:** Entity filtering not working  
**Fix:** Check that MITRE techniques are excluded from filtering

### Issue: "No search results file"
**Cause:** Step 1 not run or file moved  
**Fix:** Run search-news.ts first or provide correct --input path

### Issue: "Cost higher than expected"
**Cause:** Large article count or complex content  
**Check:**
```bash
# View token usage
sqlite3 logs/content-generation.db "
  SELECT operation, 
         SUM(tokens_total) as total_tokens,
         ROUND(SUM(cost_usd), 4) as total_cost
  FROM api_calls
  GROUP BY operation;
"
```

### Issue: "Database locked"
**Cause:** Another process using the database  
**Fix:** Wait or check for hung processes:
```bash
lsof logs/content-generation.db
```

---

## 📈 Performance Comparison

### OLD Pipeline (Multi-Call Approach)
```
Step 1: Search             ~10s    ~50K tokens   ~$0.10
Step 2: Gen publication    ~10s    ~20K tokens   ~$0.20
Step 3: Gen article 1      ~5s     ~40K tokens   ~$0.48
Step 3: Gen article 2      ~5s     ~40K tokens   ~$0.48
...
Step 3: Gen article 10     ~5s     ~40K tokens   ~$0.48
Step 4: Naive filtering    ~50s    (CPU-bound)   $0.00
Step 5: Save              ~5s     (I/O-bound)   $0.00
---
Total:                    ~140s   ~470K tokens  ~$5.00
```

### NEW Pipeline (Unified + Entity Filtering)
```
Step 1: Search             ~10s    ~50K tokens   ~$0.10
Step 2: Unified gen        ~40s    ~150K tokens  ~$0.40
Step 3: Entity filter      ~1s     (SQL-based)   $0.00
Step 4: Save              ~3s     (I/O-bound)   $0.00
---
Total:                    ~54s    ~200K tokens  ~$0.50
Improvement:              2.6x    2.4x          10x
```

---

## 🔐 Database Schema Verification

After running the pipeline, verify the schema is populated:

```bash
# Check all tables
sqlite3 logs/content-generation.db ".tables"

# Count records in each table
sqlite3 logs/content-generation.db "
  SELECT 'articles' as table_name, COUNT(*) as count FROM articles
  UNION ALL
  SELECT 'entities', COUNT(*) FROM entities
  UNION ALL
  SELECT 'cves', COUNT(*) FROM cves
  UNION ALL
  SELECT 'mitre_techniques', COUNT(*) FROM mitre_techniques
  UNION ALL
  SELECT 'article_cves', COUNT(*) FROM article_cves
  UNION ALL
  SELECT 'article_entities', COUNT(*) FROM article_entities
  UNION ALL
  SELECT 'article_mitre', COUNT(*) FROM article_mitre
  UNION ALL
  SELECT 'publications_raw', COUNT(*) FROM publications_raw
  UNION ALL
  SELECT 'api_calls', COUNT(*) FROM api_calls
  UNION ALL
  SELECT 'pipeline_runs', COUNT(*) FROM pipeline_runs;
"

# Verify entity filtering test
sqlite3 logs/content-generation.db "
  -- Should return 5-50 candidates, not 10,000+
  SELECT 
    'Test: Find articles sharing CVE-2025-1234 + Microsoft' as test,
    COUNT(*) as candidate_count
  FROM articles a
  WHERE a.article_id IN (
    SELECT article_id FROM article_cves WHERE cve_id = 'CVE-2025-1234'
    UNION
    SELECT ae.article_id FROM article_entities ae
    JOIN entities e ON ae.entity_id = e.entity_id
    WHERE e.entity_name = 'Microsoft'
  );
"
```

---

## 📝 Success Criteria

Phase 2 is successful if:

- ✅ Step 2 generates publication + 5 articles in ONE AI call
- ✅ Total cost ~$0.50 (not $5.00)
- ✅ Step 3 returns 5-50 candidates per article (not 10,000+)
- ✅ Entity relationships saved correctly in database
- ✅ publications_raw table has audit trail
- ✅ JSON files created in public/data/articles/
- ✅ Total runtime ~1-2 minutes (not 5-10 minutes)

---

## 🎉 Next Steps After Testing

1. **Verify all success criteria met**
2. **Run with different date ranges** (1 day, 7 days, 30 days)
3. **Test with different article counts** (3, 5, 10 articles)
4. **Monitor entity filtering performance** over time
5. **Tune similarity thresholds** if needed (currently 60/85)
6. **Deploy to production** pipeline
7. **Set up automated daily runs**

---

**Ready to test! 🚀**

Run the Quick Test commands above and verify the results match the expected performance targets.
