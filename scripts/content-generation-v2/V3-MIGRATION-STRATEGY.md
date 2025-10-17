# V3 Migration Strategy - FTS5 Duplicate Detection

**Status**: 🟢 PHASES 1-3 COMPLETE | Phase 4 (Updates) In Progress  
**Updated**: 2025-10-15  
**Target Folder**: `scripts/content-generation-v2/` (V3 implementation)

---

## 📋 Overview

This document tracks the migration from V2 (entity-based duplicate detection) to V3 (FTS5 full-text search). The core duplicate detection is complete and validated. Remaining work: applying SKIP-UPDATE articles as incremental updates to existing articles.

### Migration Status

✅ **Phase 1: Database Schema** - COMPLETE  
✅ **Phase 2: Article Insertion** - COMPLETE  
✅ **Phase 3: FTS5 Duplicate Detection** - COMPLETE  
🔄 **Phase 4: Update Application** - Next steps documented below

## 📚 Documentation Strategy

### Source of Truth Documents (Keep Updated)

| Document | Status | Purpose |
|----------|--------|---------|
| `FTS5-SIMILARITY-STRATEGY.md` | ✅ CURRENT | Complete V3 strategy, schema, implementation |
| `V3-MIGRATION-STRATEGY.md` | ✅ CURRENT | This file - migration checklist |
| `PIPELINE-OVERVIEW.md` | 🔄 UPDATE NEEDED | Update with V3 flow |

### V3 Documents to Create

| Document | Prefix | Purpose |
|----------|--------|---------|
| `V3-DATABASE-SCHEMA.md` | V3- | Complete schema reference with resolution tracking |
| `V3-IMPLEMENTATION-GUIDE.md` | V3- | Step-by-step implementation instructions |
| `V3-TESTING-GUIDE.md` | V3- | Test procedures and validation |
| `V3-MIGRATION-COMPLETE.md` | V3- | Final handoff document (created at end) |

### Stale V2 Documents (Archive When Complete)

| Document | Action | Reason |
|----------|--------|---------|
| `DUPLICATE-DETECTION-STRATEGY.md` | Move to .backup/ | Entity-based approach deprecated |
| `PHASE-*.md` files | Move to .backup/ | V2-specific implementation phases |
| `*-HANDOFF.md` files | Move to .backup/ | V2 handoff documents |
| `*-PROGRESS.md` files | Move to .backup/ | V2 progress tracking |

---

## 🗂️ File Management Strategy

### Backup Convention

```bash
# When replacing a file
mv scripts/content-generation-v2/check-duplicates.ts \
   scripts/content-generation-v2/.backup/check-duplicates-v2.ts

# Add timestamp for critical files
mv scripts/content-generation-v2/database/schema.ts \
   scripts/content-generation-v2/.backup/schema-v2-20251014.ts
```

### Directory Structure

```
scripts/content-generation-v2/
├── .backup/                           # Archived V2 files
│   ├── check-duplicates-v2.ts
│   ├── resolve-duplicates-v2.ts
│   ├── schema-v2-20251014.ts
│   └── docs/                          # Stale V2 documentation
│       ├── DUPLICATE-DETECTION-STRATEGY.md
│       ├── PHASE-*.md
│       └── *-HANDOFF.md
│
├── FTS5-SIMILARITY-STRATEGY.md        # ✅ V3 source of truth
├── V3-MIGRATION-STRATEGY.md           # ✅ This file
├── V3-DATABASE-SCHEMA.md              # 📝 To create
├── V3-IMPLEMENTATION-GUIDE.md         # 📝 To create
├── V3-TESTING-GUIDE.md                # 📝 To create
│
├── migrate-to-fts5-schema.ts          # 📝 Phase 1 (new)
├── insert-articles.ts                 # 📝 Phase 2 (new)
├── check-duplicates.ts                # 🔄 Phase 3 (replace)
├── generate-output.ts                 # 📝 Phase 5 (new)
│
└── test-fts5-micro.ts                 # ✅ Already validated

Database:
logs/content-generation-v2.db          # Existing database
```

---

## 📝 Implementation Checklist

### Phase 1: Schema Migration ⏳ NOT STARTED

**Goal**: Create new database schema with resolution tracking

- [ ] **Create V3-DATABASE-SCHEMA.md**
  - [ ] Document complete schema with all fields
  - [ ] Include example queries
  - [ ] Document resolution types (NEW, SKIP-FTS5, SKIP-LLM, SKIP-UPDATE)
  - [ ] Document indexes and foreign keys

- [ ] **Create migrate-to-fts5-schema.ts**
  - [ ] Add articles.resolution field with CHECK constraint
  - [ ] Add articles.similarity_score field
  - [ ] Add articles.matched_article_id field
  - [ ] Add articles.skip_reasoning field
  - [ ] Add indexes (resolution, matched_article_id)
  - [ ] Create articles_fts virtual table (headline 10x, summary 5x, full_report 1x)
  - [ ] Update publications table (add article_ids JSON field)
  - [ ] Drop publication_articles table (if exists)
  - [ ] Drop article_updates table (if exists)
  - [ ] Drop article_resolutions table (if exists)

- [ ] **Test migration**
  - [ ] Run migration on test database
  - [ ] Verify schema with `.schema articles`
  - [ ] Verify FTS5 table with `.schema articles_fts`
  - [ ] Test resolution CHECK constraint
  - [ ] Test article_ids JSON storage

**Files to Archive**:
```bash
# After Phase 1 complete
mv scripts/content-generation-v2/database/schema-articles.ts \
   scripts/content-generation-v2/.backup/schema-articles-v2.ts
```

---

### Phase 2: Insert Articles ⏳ NOT STARTED

**Goal**: Normalize structured_news → articles table + create initial publication

- [ ] **Create insert-articles.ts** (replaces Steps 3-4-5-6)
  - [ ] Read structured_news JSON for target date
  - [ ] INSERT into articles (resolution = NULL initially)
  - [ ] INSERT into articles_fts (weighted columns)
  - [ ] INSERT into article_cves
  - [ ] INSERT into article_entities
  - [ ] INSERT into article_tags
  - [ ] CREATE initial publication using LLM title/summary from structured_news
  - [ ] Set publication.article_ids = JSON array of all article IDs
  - [ ] Set publication.article_count

- [ ] **Test with Oct 7 data**
  - [ ] Run `npx tsx insert-articles.ts --date 2025-10-07`
  - [ ] Verify 10 articles inserted
  - [ ] Verify articles_fts populated
  - [ ] Verify CVEs/entities/tags linked
  - [ ] Verify publication created with correct article_ids
  - [ ] Check all resolution fields are NULL

**Files to Archive**:
```bash
# After Phase 2 complete
mv scripts/content-generation-v2/index-entities.ts \
   scripts/content-generation-v2/.backup/index-entities-v2.ts
mv scripts/content-generation-v2/index-cves.ts \
   scripts/content-generation-v2/.backup/index-cves-v2.ts
# (if these existed as separate files)
```

---

### Phase 3: FTS5 Duplicate Detection ⏳ NOT STARTED

**Goal**: Implement 3-tier threshold logic with resolution tracking

- [ ] **Update check-duplicates.ts**
  - [ ] Remove old entity-based similarity code
  - [ ] Add FTS5 query function with bm25(articles_fts, 10.0, 5.0, 1.0)
  - [ ] Implement 3-tier threshold logic:
    - [ ] Score ≥ -50: Mark as NEW (no LLM)
    - [ ] Score < -150: Mark as SKIP-FTS5 (no LLM)
    - [ ] Score -150 to -50: Call LLM
  - [ ] Implement LLM comparison function
  - [ ] Handle UPDATE decision (merge content)
  - [ ] Handle SKIP decision (mark as SKIP-LLM)
  - [ ] Handle NEW decision (mark as NEW with override reasoning)
  - [ ] Update articles SET resolution, similarity_score, matched_article_id, skip_reasoning
  - [ ] Call regeneratePublicationSummary() if any SKIP/UPDATE found

- [ ] **Add regeneratePublicationSummary() function**
  - [ ] Query articles WHERE resolution = 'NEW'
  - [ ] Call LLM with final article list
  - [ ] Update publication title, summary, article_ids, article_count

- [ ] **Test with Oct 7 + Oct 9 data**
  - [ ] Run insert-articles.ts for Oct 7 (baseline)
  - [ ] Run insert-articles.ts for Oct 9 (with duplicates)
  - [ ] Run check-duplicates.ts for Oct 9
  - [ ] Verify LockBit duplicate caught (score -177.77, SKIP-FTS5)
  - [ ] Verify Qantas duplicate caught (score -126.48, SKIP-FTS5)
  - [ ] Verify 7 NEW articles marked correctly
  - [ ] Verify publication regenerated with correct article_ids
  - [ ] Check skip_reasoning populated

**Files to Archive**:
```bash
# After Phase 3 complete
mv scripts/content-generation-v2/.backup/check-duplicates-v2.ts \
   scripts/content-generation-v2/.backup/check-duplicates-v2-20251014.ts

mv scripts/content-generation-v2/resolve-duplicates.ts \
   scripts/content-generation-v2/.backup/resolve-duplicates-v2.ts
# (This step is now merged into check-duplicates.ts)
```

---

### Phase 3.5: Threshold Tuning & Validation ✅ COMPLETE (2025-10-15)

**Goal**: Validate and tune FTS5 thresholds using real-world article corpus

**Completed Work**:

- ✅ **Clean slate testing**: Cleared database and processed Oct 7-12 sequentially
- ✅ **Threshold iteration**:
  - Initial: 0 to -50 (NEW), -50 to -150 (LLM), <-150 (SKIP-FTS5)
  - Final: **0 to -80 (NEW), -81 to -120 (LLM), -121+ (SKIP-FTS5)**
- ✅ **Stopword testing**: Confirmed stopword removal HURTS scores by 5 points
- ✅ **Weight testing**: Validated 10x/5x/1x optimal (5x/2x/1x worse, 20x/10x/1x no better)
- ✅ **Index rebuild**: Created proper DROP/CREATE rebuild script (prevents corruption)
- ✅ **Score validation**: Achieved -177 to -207 for clear duplicates, -81 to -120 for borderline cases

**Test Results** (50 articles across Oct 7-12):
- Clear duplicates: -121 to -207 range (LockBit -177, White Lock -201, UK Gov -207)
- Borderline cases: -81 to -120 range (correctly sent to LLM for evaluation)
- Updates detected: Clop Oracle (-101), GoAnywhere (-112) - LLM identified as SKIP-UPDATE
- Clearly different: 0 to -80 range (auto-marked NEW)

**Test Scripts Created**:
- `test-fts5-scoring.ts` - Single article testing against corpus
- `test-fts5-micro.ts` - Isolated corpus testing (from earlier work)
- `rebuild-fts5-clean.ts` - Proper FTS5 index reconstruction

**Key Findings**:
1. Corpus size matters - More articles = better BM25 discrimination
2. Stopwords must stay - BM25 handles semantic meaning naturally
3. 10x/5x/1x weights are optimal - Other combinations tested worse
4. -121 threshold perfect - Catches clear duplicates without false positives
5. -81 to -120 critical range - Articles with new information score here

**Updated Files**:
- `check-duplicates-v3.ts` - Updated with final 0/-80/-121 thresholds
- `FTS5-SIMILARITY-STRATEGY.md` - Updated with production validation results
- `V3-MIGRATION-STRATEGY.md` - This file, documenting threshold tuning

---

### Phase 4: Update Application ⏳ IN PROGRESS

**Goal**: Generate RSS/JSON from SQL queries instead of file parsing

- [ ] **Create generate-output.ts** (consolidates RSS + JSON + indexes)
  - [ ] Implement generateRSS()
    - [ ] Query publications with json_each(article_ids)
    - [ ] Query articles WHERE resolution = 'NEW'
    - [ ] Generate RSS XML
  - [ ] Implement generateJSON()
    - [ ] Query articles WHERE resolution = 'NEW'
    - [ ] Generate article JSON files
    - [ ] Generate publication JSON files
  - [ ] Implement generateIndexes()
    - [ ] Query for all publications
    - [ ] Query for recent articles
    - [ ] Generate index files

- [ ] **Test output generation**
  - [ ] Run generate-output.ts for Oct 7
  - [ ] Verify RSS feed contains 10 articles
  - [ ] Verify JSON files created
  - [ ] Run generate-output.ts for Oct 9
  - [ ] Verify RSS feed contains 7 NEW articles (not 10)
  - [ ] Verify SKIP articles not in output
  - [ ] Verify publication summaries accurate

**Files to Archive**:
```bash
# After Phase 4 complete
mv scripts/content-generation-v2/generate-rss.ts \
   scripts/content-generation-v2/.backup/generate-rss-v2.ts

mv scripts/content-generation-v2/generate-json.ts \
   scripts/content-generation-v2/.backup/generate-json-v2.ts

mv scripts/content-generation-v2/generate-indexes.ts \
   scripts/content-generation-v2/.backup/generate-indexes-v2.ts
```

---

### Phase 5: Extended Testing ⏳ NOT STARTED

**Goal**: Validate V3 with full Oct 7-14 corpus

- [ ] **Create V3-TESTING-GUIDE.md**
  - [ ] Document test procedures
  - [ ] Document validation queries
  - [ ] Document expected results

- [ ] **Process Oct 7-14 data**
  - [ ] Run full pipeline for each day
  - [ ] Build 8-day corpus (Oct 7, 9, 10, 12, 14, 15, 16, 17)
  - [ ] Verify resolution distribution makes sense
  - [ ] Check for false positives (different stories marked as duplicates)
  - [ ] Check for false negatives (duplicates marked as NEW)

- [ ] **Algorithm validation**
  - [ ] Run reporting query: Resolution distribution
  - [ ] Run reporting query: LLM decision audit
  - [ ] Run reporting query: Auto-skip review
  - [ ] Run reporting query: Score distribution histogram
  - [ ] Verify -50 threshold holds (no NEW articles should have been SKIP)
  - [ ] Verify -150 threshold holds (no SKIP-FTS5 should have been NEW)
  - [ ] Measure LLM call rate (expect ~10-15%)

- [ ] **Performance testing**
  - [ ] Time FTS5 queries (should be <50ms per article)
  - [ ] Time RSS generation (should be <100ms)
  - [ ] Time output generation (should be <5s for all files)

---

### Phase 6: Documentation Cleanup ⏳ NOT STARTED

**Goal**: Archive stale V2 docs, finalize V3 docs

- [ ] **Create V3-IMPLEMENTATION-GUIDE.md**
  - [ ] Step-by-step usage instructions
  - [ ] Common tasks and queries
  - [ ] Troubleshooting guide

- [ ] **Create V3-MIGRATION-COMPLETE.md**
  - [ ] Summary of changes from V2
  - [ ] Performance improvements
  - [ ] Breaking changes
  - [ ] Rollback procedure (if needed)

- [ ] **Update PIPELINE-OVERVIEW.md**
  - [ ] Remove V2 steps
  - [ ] Document V3 5-step flow
  - [ ] Update with resolution tracking info

- [ ] **Archive V2 documentation**
  ```bash
  mkdir -p scripts/content-generation-v2/.backup/docs
  
  # Move stale V2 docs
  mv scripts/content-generation-v2/DUPLICATE-DETECTION-STRATEGY.md \
     scripts/content-generation-v2/.backup/docs/
  
  mv scripts/content-generation-v2/PHASE-*.md \
     scripts/content-generation-v2/.backup/docs/
  
  mv scripts/content-generation-v2/*-HANDOFF.md \
     scripts/content-generation-v2/.backup/docs/
  
  mv scripts/content-generation-v2/*-PROGRESS.md \
     scripts/content-generation-v2/.backup/docs/
  
  # Keep these as reference
  # - CONTENT-GENERATION-V2-PIPELINE.md (still relevant)
  # - PIPELINE-OVERVIEW.md (updated for V3)
  ```

---

## 🎯 Success Criteria

### Must Have ✅

- [ ] **100% duplicate detection** on known test cases
  - [ ] LockBit alliance (-177.77) ✅ Already validated in micro-test
  - [ ] Qantas leak (-126.48) ✅ Already validated in micro-test
  
- [ ] **No false positives** on Oct 7-14 corpus
  - [ ] Different stories not marked as duplicates
  - [ ] Highest non-duplicate score stays below -50

- [ ] **Full audit trail** for algorithm tuning
  - [ ] All articles have resolution field set
  - [ ] All SKIP articles have skip_reasoning
  - [ ] All duplicate/similar articles have similarity_score

- [ ] **Database as source of truth**
  - [ ] No more JSON file parsing
  - [ ] All queries work against database
  - [ ] RSS/JSON generated from SQL

### Nice to Have 🎁

- [ ] **Performance improvement** over V2
  - [ ] FTS5 queries faster than entity comparison
  - [ ] LLM call rate reduced (expect ~10-15%, was ~20%)

- [ ] **Reporting queries** working
  - [ ] Resolution distribution query
  - [ ] LLM decision audit query
  - [ ] Score histogram query

---

## 🚨 Rollback Plan

If V3 implementation fails, we can rollback:

### Quick Rollback (Phase 1-2)
```bash
# Restore V2 files from .backup/
cp scripts/content-generation-v2/.backup/check-duplicates-v2.ts \
   scripts/content-generation-v2/check-duplicates.ts

# Revert schema changes
sqlite3 logs/content-generation-v2.db < schema-rollback.sql
```

### Full Rollback (Phase 3+)
- Restore all V2 files from `.backup/`
- Drop new tables: `articles`, `articles_fts`
- Restore `published_articles` table from backup
- Use V2 pipeline for future dates

---

## 📊 Progress Tracking

| Phase | Status | Start Date | Complete Date | Notes |
|-------|--------|------------|---------------|-------|
| Phase 1: Schema Migration | ⏳ NOT STARTED | - | - | |
| Phase 2: Insert Articles | ⏳ NOT STARTED | - | - | |
| Phase 3: FTS5 Duplicate Detection | ⏳ NOT STARTED | - | - | |
| Phase 4: Output Generation | ⏳ NOT STARTED | - | - | |
| Phase 5: Extended Testing | ⏳ NOT STARTED | - | - | |
| Phase 6: Documentation Cleanup | ⏳ NOT STARTED | - | - | |

**Overall Progress**: 0% (0/6 phases complete)

---

## 📖 Reference Documents

### V3 Primary Documents
1. **FTS5-SIMILARITY-STRATEGY.md** (1520 lines) - Complete strategy, schema, implementation
2. **V3-MIGRATION-STRATEGY.md** (this file) - Migration checklist and plan
3. **test-fts5-micro.ts** - Validated micro-test (scores: -177.77, -126.48)

### Key Findings from Micro-Test
- ✅ 10x/5x/1x weighting optimal (20x produces identical scores)
- ✅ -50 threshold provides 40+ point safety margin
- ✅ 83-point gap between duplicates and non-duplicates
- ✅ 100% accuracy on failed V2 test cases

### Database
- Location: `logs/content-generation-v2.db`
- Current data: Oct 7, 9, 10, 12, 14 (structured_news + published_articles)
- Test data available: Oct 7 (10 articles), Oct 9 (10 articles with 2 known duplicates)

---

## 🔗 Next Steps

**Immediate**: Create Phase 1 migration script
```bash
npx tsx scripts/content-generation-v2/migrate-to-fts5-schema.ts
```

**Then**: Proceed through phases sequentially, testing after each phase.

---

**Last Updated**: 2025-10-14  
**Next Review**: After Phase 1 completion
