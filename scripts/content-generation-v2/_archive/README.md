# Archived Files

This directory contains obsolete files from V2 development and migration.

**Archived Date**: October 15, 2025

---

## Directory Structure

### v2-entity-based/
Old entity-based duplicate detection scripts (replaced by FTS5 in V3).

**Files**:
- `check-duplicates.ts` - Old entity-based duplicate detection with weighted similarity
- `resolve-duplicates.ts` - Old resolution script using entity matching
- `index-entities.ts` - Entity extraction (CVEs, threat actors, malware)
- `test-entity-schema.ts` - Entity testing and validation
- `test-full-report-similarity.ts` - Old similarity calculation testing

**Why Archived**: V3 replaced entity-based weighted similarity with FTS5 BM25 scoring (85% faster, 90% cheaper).

---

### migrations/
One-time migration scripts (already executed successfully).

**Files**:
- `migrate-add-article-fields.ts` - Added columns to articles table
- `migrate-add-missing-tables.ts` - Created article_updates tables
- `migrate-to-fts5-schema.ts` - Initial FTS5 setup
- `add-updates-schema.ts` - Added updates JSON column
- `UPDATES-SCHEMA-MIGRATION.md` - Migration documentation

**Why Archived**: Already executed. New database initialization uses `database/schema-*.ts` files with safe initialization.

---

### development-tests/
Test scripts used during V3 development for FTS5 tuning and validation.

**Files**:
- `test-fts5-micro.ts` - Tests isolated article pairs in temporary FTS5 table
- `test-fts5-scoring.ts` - Tests single article against full corpus
- `test-pipeline-steps-3-5.sh` - Old pipeline test script
- `rebuild-fts5-with-stopwords.ts` - Stopword experiment (concluded: keep stopwords)

**Why Archived**: Used during V3 development. Not needed for daily operations. Can be retrieved if threshold tuning needed.

**Note**: `rebuild-fts5-clean.ts` and `rebuild-database-v3.ts` kept in main directory for maintenance/recovery.

---

### obsolete-docs/
Documentation describing the old V2 entity-based approach or outdated workflow.

**Files**:
- `PIPELINE-OVERVIEW.md` - Old V2 workflow (replaced by V3-PIPELINE.md)
- `DUPLICATE-DETECTION-STRATEGY.md` - Entity-based approach documentation
- `STEP5-DUPLICATE-RESOLUTION.md` - Old Step 5 documentation
- `STEP6-PUBLICATION-GENERATION.md` - Old Step 6 documentation
- `STEP6-IMPLEMENTATION-COMPLETE.md` - Old completion notes
- `STEP7-COMPLETE.md` - Old Step 7 notes
- `STEPS-7-10-PLAN.md` - Old planning document
- `HANDOVER_PROMPT.md` - Duplicate handoff doc (kept HANDOFF-PROMPT.md)

**Why Archived**: Describes V2 entity-based approach. V3-PIPELINE.md is now the authoritative workflow documentation.

---

## Why Archived?

V3 replaced the entity-based weighted similarity approach with FTS5 full-text search:
- **85% faster** duplicate detection
- **90% cheaper** (fewer LLM calls - auto-skip 75-80% of duplicates)
- **100% reliable** (Zod structured output vs manual JSON parsing)
- **Simpler workflow** (no entity extraction step needed)

These files are kept for:
- Historical reference
- Understanding design evolution
- Troubleshooting schema issues
- Future threshold tuning (may need test scripts)

---

## Current V3 Workflow

See **V3-PIPELINE.md** in parent directory for the current V3 workflow.

### Quick Reference: V3 Active Scripts

```
news-structured.ts           # Step 2: Generate structured content
insert-articles.ts           # Step 3: Insert articles + FTS5 index
check-duplicates-v3.ts       # Step 4: Duplicate detection (V3)
apply-updates.ts             # Update application logic
generate-publication.ts      # Step 5: Generate publications
generate-publication-json.ts # Step 6A: Export publication JSON
generate-article-json.ts     # Step 6B: Export article JSON
generate-indexes.ts          # Step 7A: Generate indexes
generate-rss.ts              # Step 7B: Generate RSS feed
```

---

## Restoration

If you need to restore archived files:

```bash
# Restore specific file
cp _archive/v2-entity-based/check-duplicates.ts ./

# Restore entire category
cp -r _archive/v2-entity-based/* ./

# Restore all archived files
cp -r _archive/*/* ./
```

Files are moved, not deleted, so restoration is simple and safe.

---

## Archive Statistics

**Total Files Archived**: 22 files
- V2 entity-based scripts: 5 files
- Migration scripts: 5 files
- Development tests: 4 files
- Obsolete documentation: 8 files

**Main Directory Before**: 50+ files  
**Main Directory After**: ~25-30 active files

**Benefit**: Clear separation between V3 (active) and V2 (obsolete).
