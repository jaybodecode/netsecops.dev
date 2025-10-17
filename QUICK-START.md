# Quick Start - Pipeline Execution

## ✅ Cleanup Complete
- Removed all Step 3+ intermediate files
- Cleaned public/data directory
- Deleted database
- Ready for fresh run

## 🎯 Execute in Order (Oldest → Newest)

### Day 7 (Oct 7)
```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 --end=9 \
  --input=OUTPUT/publication-unified_7daysago_2025-10-14T05-01-51-778Z.json
```

### Day 6 (Oct 8)
```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 --end=9 \
  --input=OUTPUT/publication-unified_6daysago_2025-10-14T05-40-04-771Z.json
```

### Day 5 (Oct 9)
```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 --end=9 \
  --input=OUTPUT/publication-unified_5daysago_2025-10-14T06-13-59-457Z.json
```

### Day 4 (Oct 10)
```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 --end=9 \
  --input=OUTPUT/publication-unified_4daysago_2025-10-14T06-33-40-628Z.json
```

### Day 3 (Oct 11)
```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 --end=9 \
  --input=OUTPUT/publication-unified_3daysago_2025-10-14T06-33-38-281Z.json
```

### Day 2 (Oct 12)
```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 --end=9 \
  --input=OUTPUT/publication-unified_2daysago_2025-10-14T06-33-59-135Z.json
```

### Day 1 (Oct 13) - FINAL
```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --start=3 --end=9 \
  --input=OUTPUT/publication-unified_1dayago_2025-10-14T06-51-31-662Z.json
```

## ✅ After Each Day - Quick Checks

```bash
# Check log shows correct timeframe
# Look for: "📝 Extracted timeframe from input: Xdaysago"

# Check database count
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;"

# Check no errors in output
# Look for: "✅ PIPELINE COMPLETE"
```

## ✅ Final Verification

```bash
# Should have 7 publications
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;"

# Should have ~50-70 articles
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM articles;"

# Check indexes
jq '.publications | length' public/data/publications-index.json
jq '.articles | length' public/data/articles-index.json

# Check RSS
cat public/rss/feed.xml | grep -c "<item>"

# Check email file
jq '.publications | length' public/data/last-updates.json
```

## 🐛 If Something Fails

1. **Check the log output** - look for actual error message
2. **Check timeframe extraction** - must show correct Xdaysago
3. **Check for UNIQUE constraint errors** - means duplicate article
4. **Backup database before retry**:
   ```bash
   cp logs/content-generation.db logs/content-generation.db.backup
   ```

## 📖 Full Documentation

See `PIPELINE-EXECUTION-GUIDE.md` for:
- Detailed troubleshooting
- Validation checklist
- Database integrity checks
- RSS feed validation
- Error handling procedures
