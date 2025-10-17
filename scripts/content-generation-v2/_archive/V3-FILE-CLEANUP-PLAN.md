# V3 File Cleanup Plan

**Purpose**: Organize content-generation-v2 folder by archiving obsolete V2 entity-based files  
**Status**: Pending user approval  
**Date**: 2025-10-15

---

## Overview

The folder currently contains 50+ files, mixing:
- **V3 active scripts** (FTS5-based duplicate detection)
- **V2 legacy scripts** (entity-based weighted similarity)
- **One-time migration scripts** (already executed)
- **Development test scripts** (used during V3 development)
- **Obsolete documentation** (describes old V2 approach)

This plan proposes archiving obsolete files to improve clarity and maintainability.

---

## Proposed Directory Structure

```
scripts/content-generation-v2/
├── V3-PIPELINE.md                          ✅ NEW (complete workflow guide)
├── V3-DATABASE-SCHEMA.md                   ✅ KEEP (V3 schema reference)
├── V3-MIGRATION-STRATEGY.md                ✅ KEEP (V2→V3 migration guide)
├── V3-NEXT-STEPS.md                        ✅ KEEP (current status)
├── V3-STRUCTURED-OUTPUT-MIGRATION.md       ✅ KEEP (Zod migration guide)
├── V3-FILE-CLEANUP-PLAN.md                 ✅ NEW (this document)
├── FTS5-SIMILARITY-STRATEGY.md             ✅ KEEP (FTS5 scoring details)
├── LLM.md                                  ✅ KEEP (LLM configuration)
│
├── news-structured.ts                      ✅ ACTIVE (Step 2)
├── insert-articles.ts                      ✅ ACTIVE (Step 3)
├── check-duplicates-v3.ts                  ✅ ACTIVE (Step 4)
├── apply-updates.ts                        ✅ ACTIVE (update logic)
├── generate-publication.ts                 ✅ ACTIVE (Step 5)
├── generate-publication-json.ts            ✅ ACTIVE (Step 6A)
├── generate-article-json.ts                ✅ ACTIVE (Step 6B)
├── generate-indexes.ts                     ✅ ACTIVE (Step 7A)
├── generate-rss.ts                         ✅ ACTIVE (Step 7B)
│
├── news-structured-schema.ts               ✅ KEEP (Zod schemas)
├── duplicate-resolution-schema-v3.ts       ✅ KEEP (Zod schemas)
├── publication-output-schema.ts            ✅ KEEP (output schemas)
│
├── view-resolutions.ts                     ✅ KEEP (utility)
├── view-logs.ts                            ✅ KEEP (utility)
├── process-existing-updates.ts             ✅ KEEP (utility for backfill)
│
├── database/                               ✅ KEEP (all database schema files)
├── ai/                                     ✅ KEEP (LLM integrations)
├── scripts/                                ✅ KEEP (helper scripts)
│
└── _archive/                               📦 NEW (obsolete files)
    ├── v2-entity-based/
    ├── migrations/
    ├── development-tests/
    └── obsolete-docs/
```

---

## Files to Archive

### Category 1: V2 Entity-Based Scripts (OBSOLETE)

These scripts implemented the old entity-based weighted similarity approach that V3 replaced with FTS5.

**Move to `_archive/v2-entity-based/`**:

```bash
check-duplicates.ts                   # Old entity-based duplicate detection
resolve-duplicates.ts                 # Old resolution script
index-entities.ts                     # Entity extraction (not needed in V3)
test-entity-schema.ts                 # Entity testing
test-full-report-similarity.ts        # Old similarity calculation
```

**Why Archive**:
- V3 uses FTS5 BM25 scoring instead of entity-based matching
- Entity tables (`articles_meta`, `article_cves`, `article_entities`) no longer populated in V3 workflow
- These scripts are no longer called by any active workflow
- 85% faster performance in V3 vs V2

**Can Delete?**: No, keep for historical reference. May need to review logic if future requirements change.

---

### Category 2: One-Time Migrations (COMPLETED)

These scripts were used once during V2→V3 migration and won't be run again.

**Move to `_archive/migrations/`**:

```bash
migrate-add-article-fields.ts         # Added columns to articles table (DONE)
migrate-add-missing-tables.ts         # Created article_updates tables (DONE)
migrate-to-fts5-schema.ts             # Initial FTS5 setup (DONE)
add-updates-schema.ts                 # Added updates column (DONE)
```

**Why Archive**:
- Already executed successfully
- Schema changes are permanent
- Not needed for ongoing operations
- New database initialization uses `database/schema-*.ts` files

**Can Delete?**: No, keep for audit trail. May need to reference if troubleshooting schema issues.

---

### Category 3: Development Test Scripts (DEV ONLY)

These scripts were used during V3 development to test FTS5 scoring and tune thresholds.

**Move to `_archive/development-tests/`**:

```bash
test-fts5-micro.ts                    # Tests isolated article pairs
test-fts5-scoring.ts                  # Tests single article against corpus
test-pipeline-steps-3-5.sh            # Old pipeline test script
rebuild-fts5-clean.ts                 # Rebuild FTS5 index (keep for maintenance)
rebuild-fts5-with-stopwords.ts        # Stopword experiment (concluded: keep stopwords)
rebuild-database-v3.ts                # Full database rebuild (keep for maintenance)
```

**Why Archive Most**:
- Used during development for testing and tuning
- Not needed for daily operations
- Can be retrieved if threshold tuning needed in future

**EXCEPTIONS** (keep in main directory):
- `rebuild-fts5-clean.ts` - May need for FTS5 maintenance
- `rebuild-database-v3.ts` - May need for emergency recovery

**Can Delete?**: No, may need for future threshold tuning or troubleshooting.

---

### Category 4: Obsolete Documentation (V2 APPROACH)

Documentation describing the old V2 entity-based approach or outdated workflow.

**Move to `_archive/obsolete-docs/`**:

```bash
PIPELINE-OVERVIEW.md                  # Old V2 workflow (replaced by V3-PIPELINE.md)
DUPLICATE-DETECTION-STRATEGY.md       # Entity-based approach (obsolete)
STEP5-DUPLICATE-RESOLUTION.md         # Old Step 5 (V2 approach)
STEP6-PUBLICATION-GENERATION.md       # Old Step 6 (partially obsolete)
STEP6-IMPLEMENTATION-COMPLETE.md      # Old completion notes
STEP7-COMPLETE.md                     # Old Step 7 notes
STEPS-7-10-PLAN.md                    # Old planning document
HANDOFF-PROMPT.md                     # Duplicate handoff doc (keep one)
HANDOVER_PROMPT.md                    # Duplicate handoff doc (keep one)
ARTICLE-IDENTITY-STRATEGY.md          # May still be relevant (review first)
UPDATE-ARTICLE-INDEXING-RULE.md       # May still be relevant (review first)
UPDATES-SCHEMA-MIGRATION.md           # Migration notes (archive with migrations)
```

**Why Archive**:
- Describes V2 entity-based approach that V3 replaced
- V3-PIPELINE.md is the authoritative workflow documentation
- Can confuse users looking for current workflow
- Historical value for understanding design evolution

**REVIEWED - KEEP THESE FILES** (Still relevant to V3):
- ✅ `ARTICLE-IDENTITY-STRATEGY.md` - Canonical article ID logic (ACTIVE in V3)
- ✅ `UPDATE-ARTICLE-INDEXING-RULE.md` - Critical rule: UPDATE articles not indexed (ACTIVE in V3)

**Can Delete?**: No, keep for historical reference and design rationale.

---

## Archival Commands

### Step 1: Create Archive Directories

```bash
cd /Users/admin/cybernetsec-io/scripts/content-generation-v2

mkdir -p _archive/v2-entity-based
mkdir -p _archive/migrations
mkdir -p _archive/development-tests
mkdir -p _archive/obsolete-docs
```

### Step 2: Archive V2 Entity-Based Scripts

```bash
# V2 entity-based approach (obsolete)
mv check-duplicates.ts _archive/v2-entity-based/
mv resolve-duplicates.ts _archive/v2-entity-based/
mv index-entities.ts _archive/v2-entity-based/
mv test-entity-schema.ts _archive/v2-entity-based/
mv test-full-report-similarity.ts _archive/v2-entity-based/
```

### Step 3: Archive Migration Scripts

```bash
# One-time migrations (completed)
mv migrate-add-article-fields.ts _archive/migrations/
mv migrate-add-missing-tables.ts _archive/migrations/
mv migrate-to-fts5-schema.ts _archive/migrations/
mv add-updates-schema.ts _archive/migrations/
mv UPDATES-SCHEMA-MIGRATION.md _archive/migrations/
```

### Step 4: Archive Development Test Scripts

```bash
# Development tests (keep rebuild scripts in main dir)
mv test-fts5-micro.ts _archive/development-tests/
mv test-fts5-scoring.ts _archive/development-tests/
mv test-pipeline-steps-3-5.sh _archive/development-tests/
mv rebuild-fts5-with-stopwords.ts _archive/development-tests/

# Keep these in main directory:
# - rebuild-fts5-clean.ts (may need for maintenance)
# - rebuild-database-v3.ts (may need for recovery)
```

### Step 5: Archive Obsolete Documentation

```bash
# Old workflow documentation
mv PIPELINE-OVERVIEW.md _archive/obsolete-docs/
mv DUPLICATE-DETECTION-STRATEGY.md _archive/obsolete-docs/
mv STEP5-DUPLICATE-RESOLUTION.md _archive/obsolete-docs/
mv STEP6-PUBLICATION-GENERATION.md _archive/obsolete-docs/
mv STEP6-IMPLEMENTATION-COMPLETE.md _archive/obsolete-docs/
mv STEP7-COMPLETE.md _archive/obsolete-docs/
mv STEPS-7-10-PLAN.md _archive/obsolete-docs/

# Keep only one handoff doc (archive duplicate)
mv HANDOVER_PROMPT.md _archive/obsolete-docs/  # Keep HANDOFF-PROMPT.md

# KEEP THESE (still relevant to V3):
# - ARTICLE-IDENTITY-STRATEGY.md (canonical ID logic)
# - UPDATE-ARTICLE-INDEXING-RULE.md (UPDATE indexing rule)
```

### Step 6: Add Archive README

```bash
cat > _archive/README.md << 'EOF'
# Archived Files

This directory contains obsolete files from V2 development and migration.

## Directory Structure

- **v2-entity-based/** - Old entity-based duplicate detection scripts (replaced by FTS5 in V3)
- **migrations/** - One-time migration scripts (already executed)
- **development-tests/** - Test scripts used during V3 development
- **obsolete-docs/** - Documentation for V2 workflow (replaced by V3-PIPELINE.md)

## Why Archived?

V3 replaced the entity-based weighted similarity approach with FTS5 full-text search:
- 85% faster duplicate detection
- 90% cheaper (fewer LLM calls)
- More reliable (Zod structured output)

These files are kept for:
- Historical reference
- Understanding design evolution
- Troubleshooting schema issues
- Future threshold tuning

## Current Workflow

See **V3-PIPELINE.md** for the current V3 workflow.
EOF
```

---

## Files to KEEP in Main Directory

### Core V3 Scripts (Active Workflow)
```
news-structured.ts                    # Step 2: Generate structured content
insert-articles.ts                    # Step 3: Insert articles + FTS5 index
check-duplicates-v3.ts                # Step 4: Duplicate detection (V3)
apply-updates.ts                      # Update application logic
generate-publication.ts               # Step 5: Generate publications
generate-publication-json.ts          # Step 6A: Export publication JSON
generate-article-json.ts              # Step 6B: Export article JSON
generate-indexes.ts                   # Step 7A: Generate indexes
generate-rss.ts                       # Step 7B: Generate RSS feed
```

### Schemas (Active)
```
news-structured-schema.ts             # Content generation schemas
duplicate-resolution-schema-v3.ts     # Duplicate resolution schemas
publication-output-schema.ts          # Output format schemas
```

### Utilities (Active)
```
view-resolutions.ts                   # View resolution decisions
view-logs.ts                          # View logs
process-existing-updates.ts           # Backfill existing SKIP-UPDATE articles
rebuild-fts5-clean.ts                 # Rebuild FTS5 index (maintenance)
rebuild-database-v3.ts                # Full database rebuild (recovery)
```

### Documentation (Current)
```
V3-PIPELINE.md                        # ✅ NEW - Complete workflow guide
V3-DATABASE-SCHEMA.md                 # V3 schema reference
V3-MIGRATION-STRATEGY.md              # V2→V3 migration guide
V3-NEXT-STEPS.md                      # Current status
V3-STRUCTURED-OUTPUT-MIGRATION.md     # Zod migration guide
V3-FILE-CLEANUP-PLAN.md               # ✅ NEW - This document
FTS5-SIMILARITY-STRATEGY.md           # FTS5 scoring details
LLM.md                                # LLM configuration
ARTICLE-IDENTITY-STRATEGY.md          # Canonical ID logic (KEEP - Active)
UPDATE-ARTICLE-INDEXING-RULE.md       # UPDATE indexing rule (KEEP - Active)
```

### Subdirectories (All Active)
```
database/                             # Database schema files
ai/                                   # LLM integration (vertex.ts, gemini.ts)
scripts/                              # Helper scripts
```

---

## After Archival - Directory Count

**Before Cleanup**: 50+ files in main directory  
**After Cleanup**: ~25 active files + _archive/ subdirectory

**Benefits**:
- Clear separation between V3 (active) and V2 (obsolete)
- New users see only relevant V3 files
- Historical files preserved for reference
- Easier to navigate and understand current workflow

---

## Update V3-NEXT-STEPS.md

After archival, update **V3-NEXT-STEPS.md** with:

```markdown
## 📚 Documentation Status

**Current (V3)**:
- ✅ `V3-PIPELINE.md` - Complete V3 workflow guide (AUTHORITATIVE)
- ✅ `V3-DATABASE-SCHEMA.md` - Database schema reference
- ✅ `V3-MIGRATION-STRATEGY.md` - V2→V3 migration guide
- ✅ `V3-NEXT-STEPS.md` - Current status
- ✅ `V3-STRUCTURED-OUTPUT-MIGRATION.md` - Zod structured output
- ✅ `V3-FILE-CLEANUP-PLAN.md` - File organization
- ✅ `FTS5-SIMILARITY-STRATEGY.md` - FTS5 scoring details

**Archived (V2)**:
- 📦 `_archive/obsolete-docs/PIPELINE-OVERVIEW.md` - Old V2 workflow
- 📦 `_archive/v2-entity-based/` - Entity-based scripts
- 📦 `_archive/migrations/` - One-time migrations
- 📦 `_archive/development-tests/` - Development test scripts
```

---

## Rollback Plan

If you need to restore archived files:

```bash
# Restore specific file
cp _archive/v2-entity-based/check-duplicates.ts ./

# Restore entire category
cp -r _archive/v2-entity-based/* ./

# Restore all archived files
cp -r _archive/*/* ./
```

---

## Next Steps

1. **Review this plan** - Confirm files to archive
2. **Review ARTICLE-IDENTITY-STRATEGY.md** - Check if still relevant
3. **Review UPDATE-ARTICLE-INDEXING-RULE.md** - Check if still relevant
4. **Execute archival commands** - Run Step 1-6 above
5. **Update V3-NEXT-STEPS.md** - Add archive references
6. **Test workflow** - Run daily-content-generation.sh to verify nothing broken

---

## Approval Required

**User Decision Needed**:
- [ ] Approve archival plan
- [x] Review ARTICLE-IDENTITY-STRATEGY.md - ✅ KEEP (canonical ID logic active in V3)
- [x] Review UPDATE-ARTICLE-INDEXING-RULE.md - ✅ KEEP (critical UPDATE indexing rule)
- [ ] Execute archival commands
- [ ] Update V3-NEXT-STEPS.md

**Estimated Time**: 10 minutes  
**Risk**: Low (files only moved, not deleted)  
**Benefit**: Clear V3 workflow, easier navigation
