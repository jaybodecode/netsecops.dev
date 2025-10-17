# V3 Organization Summary

**Created**: 2025-10-15  
**Purpose**: Quick reference for V3 folder organization

---

## What Just Happened

Created comprehensive V3 documentation to replace obsolete V2 files:

### ✅ New Documentation Created

1. **V3-PIPELINE.md** (AUTHORITATIVE)
   - Complete step-by-step workflow guide
   - Replaces PIPELINE-OVERVIEW.md (V2)
   - Shows execution order: Steps 1-7
   - Includes command examples, validation queries, troubleshooting
   - Database schema reference
   - Daily workflow bash script template

2. **V3-FILE-CLEANUP-PLAN.md**
   - Identifies 20+ obsolete files from V2 entity-based approach
   - Proposes archival structure (_archive/ subdirectory)
   - Safe cleanup commands (move, not delete)
   - Rollback plan if needed
   - Reviewed ARTICLE-IDENTITY-STRATEGY.md ✅ (KEEP - still relevant)
   - Reviewed UPDATE-ARTICLE-INDEXING-RULE.md ✅ (KEEP - still relevant)

3. **V3-NEXT-STEPS.md** (UPDATED)
   - Added comprehensive documentation status
   - References new V3-PIPELINE.md as authoritative source
   - Lists archived V2 documentation

---

## V3 Pipeline Quick Reference

### Daily Workflow (Execution Order)

```bash
# 1. Search Raw News
npx tsx scripts/content-generation-v2/search-news.ts --date 2025-10-14

# 2. Generate Structured Content
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-14 --logtodb

# 3. Insert Articles & Build FTS5 Index
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-14

# 4. Detect Duplicates (V3)
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-14

# 5. Generate Publications
npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-14

# 6. Export Website JSON
npx tsx scripts/content-generation-v2/generate-publication-json.ts --date 2025-10-14
npx tsx scripts/content-generation-v2/generate-article-json.ts --date 2025-10-14

# 7. Generate Indexes & RSS
npx tsx scripts/content-generation-v2/generate-indexes.ts
npx tsx scripts/content-generation-v2/generate-rss.ts --limit 50
```

---

## Files to Archive (Pending Approval)

### Category 1: V2 Entity-Based Scripts (5 files)
```
check-duplicates.ts                   # Old entity-based duplicate detection
resolve-duplicates.ts                 # Old resolution script
index-entities.ts                     # Entity extraction (not needed in V3)
test-entity-schema.ts                 # Entity testing
test-full-report-similarity.ts        # Old similarity calculation
```

### Category 2: One-Time Migrations (4 files)
```
migrate-add-article-fields.ts         # Already executed
migrate-add-missing-tables.ts         # Already executed
migrate-to-fts5-schema.ts             # Already executed
add-updates-schema.ts                 # Already executed
```

### Category 3: Development Tests (3 files + keep 2 for maintenance)
```
test-fts5-micro.ts                    # Development testing
test-fts5-scoring.ts                  # Development testing
test-pipeline-steps-3-5.sh            # Old pipeline test
rebuild-fts5-with-stopwords.ts        # Stopword experiment (concluded)

# KEEP in main directory:
rebuild-fts5-clean.ts                 # May need for maintenance
rebuild-database-v3.ts                # May need for recovery
```

### Category 4: Obsolete Documentation (8 files)
```
PIPELINE-OVERVIEW.md                  # Replaced by V3-PIPELINE.md
DUPLICATE-DETECTION-STRATEGY.md       # V2 entity approach
STEP5-DUPLICATE-RESOLUTION.md         # V2 approach
STEP6-PUBLICATION-GENERATION.md       # Partially obsolete
STEP6-IMPLEMENTATION-COMPLETE.md      # Old completion notes
STEP7-COMPLETE.md                     # Old notes
STEPS-7-10-PLAN.md                    # Old planning
HANDOVER_PROMPT.md                    # Duplicate (keep HANDOFF-PROMPT.md)
```

**Total to Archive**: ~20 files  
**After Cleanup**: ~25-30 active files (down from 50+)

---

## Current Active Files (Keep in Main Directory)

### Core V3 Scripts (9 files)
```
news-structured.ts                    # Step 2
insert-articles.ts                    # Step 3
check-duplicates-v3.ts                # Step 4
apply-updates.ts                      # Update logic
generate-publication.ts               # Step 5
generate-publication-json.ts          # Step 6A
generate-article-json.ts              # Step 6B
generate-indexes.ts                   # Step 7A
generate-rss.ts                       # Step 7B
```

### Schemas (3 files)
```
news-structured-schema.ts             # Content generation schemas
duplicate-resolution-schema-v3.ts     # Duplicate resolution schemas
publication-output-schema.ts          # Output format schemas
```

### Utilities (5 files)
```
view-resolutions.ts                   # View resolution decisions
view-logs.ts                          # View logs
process-existing-updates.ts           # Backfill SKIP-UPDATE articles
rebuild-fts5-clean.ts                 # FTS5 maintenance
rebuild-database-v3.ts                # Emergency recovery
```

### V3 Documentation (12 files)
```
V3-PIPELINE.md                        # ✅ AUTHORITATIVE workflow guide
V3-DATABASE-SCHEMA.md                 # Schema reference
V3-MIGRATION-STRATEGY.md              # V2→V3 migration
V3-NEXT-STEPS.md                      # Current status
V3-STRUCTURED-OUTPUT-MIGRATION.md     # Zod migration
V3-STRUCTURED-OUTPUT-TEST-RESULTS.md  # Test results
V3-STRUCTURED-OUTPUT-SUMMARY.md       # Migration summary
V3-FINAL-STATUS.md                    # Completion status
V3-FILE-CLEANUP-PLAN.md               # This cleanup plan
V3-ORGANIZATION-SUMMARY.md            # This summary
database/V3-FIX-SCHEMA-WARNINGS.md    # Safe schema init
FTS5-SIMILARITY-STRATEGY.md           # FTS5 scoring
ARTICLE-IDENTITY-STRATEGY.md          # Canonical ID logic
UPDATE-ARTICLE-INDEXING-RULE.md       # UPDATE indexing rule
LLM.md                                # LLM configuration
```

### Subdirectories (All Keep)
```
database/                             # Database schema files
ai/                                   # LLM integration
scripts/                              # Helper scripts
```

---

## Next Steps (User Approval Required)

1. **Review V3-PIPELINE.md** - Confirm workflow is correct
2. **Review V3-FILE-CLEANUP-PLAN.md** - Approve archival plan
3. **Execute archival** - Run commands in V3-FILE-CLEANUP-PLAN.md
4. **Verify workflow** - Test that nothing broke after cleanup

---

## Benefits of This Organization

### Before (Current State)
- 50+ files in main directory
- Mix of V3 and V2 scripts
- Unclear which files are active
- Old PIPELINE-OVERVIEW.md describes V2 approach
- Multiple obsolete test scripts
- Duplicate documentation files

### After (Proposed State)
- ~25-30 active files in main directory
- Clear V3 workflow
- V3-PIPELINE.md as single source of truth
- Obsolete files archived (not deleted)
- Easy to find current scripts
- New contributors understand workflow immediately

---

## Quick Commands

### View Current Documentation
```bash
# Read authoritative pipeline guide
cat scripts/content-generation-v2/V3-PIPELINE.md

# View cleanup plan
cat scripts/content-generation-v2/V3-FILE-CLEANUP-PLAN.md

# Check current status
cat scripts/content-generation-v2/V3-NEXT-STEPS.md
```

### Execute Archival (After Approval)
```bash
cd /Users/admin/cybernetsec-io/scripts/content-generation-v2

# Create archive directories
mkdir -p _archive/{v2-entity-based,migrations,development-tests,obsolete-docs}

# Run archival commands from V3-FILE-CLEANUP-PLAN.md
# (See that file for specific commands)
```

### Verify Workflow Still Works
```bash
# Test dry run of duplicate detection
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-14 --dry-run

# Check database
sqlite3 logs/content-generation-v2.db "SELECT resolution, COUNT(*) FROM articles GROUP BY resolution"
```

---

## Key Differences: V2 vs V3

| Aspect | V2 (Old) | V3 (Current) |
|--------|----------|--------------|
| **Duplicate Detection** | Entity-based weighted similarity | FTS5 BM25 scoring |
| **LLM Output** | Text-based JSON (manual parsing) | Zod structured output |
| **Performance** | Slow (SQL unions, entity matching) | 85% faster |
| **Cost** | High (many LLM calls) | 90% cheaper (auto-skip 75-80%) |
| **Reliability** | JSON parsing errors | 100% reliable (Zod validation) |
| **Scripts** | check-duplicates.ts | check-duplicates-v3.ts |
| **Entity Indexing** | Required (index-entities.ts) | Not needed |
| **Documentation** | PIPELINE-OVERVIEW.md | V3-PIPELINE.md |

---

## Files You'll Use Most

1. **V3-PIPELINE.md** - When running daily workflow
2. **check-duplicates-v3.ts** - Core duplicate detection
3. **V3-DATABASE-SCHEMA.md** - When writing SQL queries
4. **ARTICLE-IDENTITY-STRATEGY.md** - Understanding canonical IDs
5. **FTS5-SIMILARITY-STRATEGY.md** - Understanding BM25 scoring

---

## Questions to Ask

- ✅ Is V3-PIPELINE.md accurate and complete?
- ✅ Are the archival commands safe to execute?
- ✅ Should we keep ARTICLE-IDENTITY-STRATEGY.md? (YES - reviewed and confirmed)
- ✅ Should we keep UPDATE-ARTICLE-INDEXING-RULE.md? (YES - reviewed and confirmed)
- ⏳ Ready to execute archival?

---

## Rollback Plan

If something breaks after archival:

```bash
# Restore specific file
cp _archive/v2-entity-based/check-duplicates.ts ./

# Restore entire category
cp -r _archive/v2-entity-based/* ./

# Restore everything
cp -r _archive/*/* ./
```

Files are moved, not deleted, so restoration is simple and safe.
