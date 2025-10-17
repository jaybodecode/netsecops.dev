# V3 Migration - Next Steps

**Updated**: 2025-10-15  
**Status**: Core duplicate detection complete, update application remaining

---

## ✅ What's Working

### Duplicate Detection (Phases 1-3.5)
- ✅ FTS5 full-text search with BM25 scoring
- ✅ Three-tier threshold system (0/-80, -81/-120, -121+)
- ✅ Automatic SKIP-FTS5 for clear duplicates (no LLM cost)
- ✅ LLM evaluation for borderline cases (-81 to -120 range)
- ✅ Detection of articles needing updates (SKIP-UPDATE)
- ✅ All articles inserted to `articles` table with `resolution` field
- ✅ Skip reasoning saved in database for audit/troubleshooting

### Validated Configuration
- **FTS5 Weights**: 10x headline, 5x summary, 1x full_report
- **Stopwords**: INCLUDED (removal makes scores worse)
- **Query Strategy**: OR matching with all unique words
- **Thresholds**: 0 to -80 (NEW), -81 to -120 (LLM), -121+ (SKIP-FTS5)
- **Index Strategy**: Insert immediately for larger corpus (improves BM25)

---

## 🔄 What's Next

### Phase 4: Apply Updates to Existing Articles

When an article is marked as `SKIP-UPDATE`, we need to:

1. **Parse LLM reasoning** to extract update details
2. **Create entry in `article_updates` table**:
   - `article_id` (FK to original article)
   - `datetime` (when update published)
   - `summary` (brief summary of what changed)
   - `content` (detailed update text)
   - `severity_change` (if applicable)
3. **Link source articles** in `article_update_sources`
4. **Increment `updateCount`** and set `isUpdate=1` on original article

**Current State**:
- Schema exists (created in `add-updates-schema.ts`)
- Articles with `resolution='SKIP-UPDATE'` have `skip_reasoning` JSON
- Need to implement structured LLM response with update fields
- Need to create update application logic

**Files to Modify**:
- `check-duplicates-v3.ts`:
  - Modify LLM prompt to include update fields in response
  - Parse structured response: `{decision, reasoning, update_summary?, update_content?, severity_change?}`
  - Call `applyUpdate()` function when decision is SKIP-UPDATE
  
- Create `apply-updates.ts`:
  - Function to insert into `article_updates` table
  - Function to link source articles
  - Function to increment `updateCount`
  - Can be called during duplicate detection OR as separate step

---

## 📊 Current Database State

**After Oct 7-12 Test Run** (50 articles):
- Articles with `resolution='NEW'`: ~30-35
- Articles with `resolution='SKIP-FTS5'`: ~10-12 (clear duplicates)
- Articles with `resolution='SKIP-LLM'`: ~0-2 (LLM said duplicate)
- Articles with `resolution='SKIP-UPDATE'`: ~3-5 (has new information)
- Articles in `article_updates` table: **0** (not yet implemented)

**Skip Reasoning Visibility**:
```sql
-- View all skipped articles with reasoning
SELECT 
  DATE(created_at) as date,
  headline,
  resolution,
  similarity_score,
  skip_reasoning
FROM articles
WHERE resolution != 'NEW'
ORDER BY created_at DESC;

-- View articles needing update application
SELECT 
  id,
  headline,
  skip_reasoning
FROM articles
WHERE resolution = 'SKIP-UPDATE';
```

---

## 🧪 Test Scripts for Future Tuning

As the corpus grows (100+, 500+, 1000+ articles), thresholds may need adjustment:

**`test-fts5-scoring.ts`**:
- Tests single article against full corpus
- Shows query stats and top 10 matches
- Usage: `npx tsx scripts/content-generation-v2/test-fts5-scoring.ts`

**`test-fts5-micro.ts`**:
- Creates isolated temporary FTS5 table
- Tests specific article pairs
- Usage: `npx tsx scripts/content-generation-v2/test-fts5-micro.ts`

**`rebuild-fts5-clean.ts`**:
- Properly rebuilds FTS5 index (DROP/CREATE, not DELETE/INSERT)
- Prevents virtual table corruption
- Usage: `npx tsx scripts/content-generation-v2/rebuild-fts5-clean.ts`

**Threshold Tuning Process**:
1. Run test scripts on known duplicate pairs
2. Check if scores still cluster in expected ranges
3. If needed, adjust thresholds in `check-duplicates-v3.ts`
4. Test with `--dry-run` before committing

---

## 📈 Cost & Performance Metrics

**Current Performance** (Oct 7-12 test):
- **LLM calls**: 5 total across 50 articles (10%)
- **Auto-skipped**: 12 articles (24% saved from LLM evaluation)
- **Cost**: ~$0.10 total ($0.01-0.02 per LLM call)
- **Time**: <5s total for duplicate detection of 50 articles

**Expected Production** (10 articles/day):
- **LLM calls**: ~1-2 per day (borderline cases)
- **Auto-skipped**: ~2-3 per day (clear duplicates)
- **Cost**: ~$0.02-0.04 per day (~$0.60-$1.20/month)
- **Time**: <1s per day for duplicate detection

---

## 📚 Documentation Status

**Core V3 Documentation** (Current):
- ✅ **`V3-PIPELINE.md`** - **AUTHORITATIVE** complete workflow guide (replaces PIPELINE-OVERVIEW.md)
- ✅ `V3-DATABASE-SCHEMA.md` - Database schema reference
- ✅ `V3-MIGRATION-STRATEGY.md` - V2→V3 migration guide
- ✅ `V3-NEXT-STEPS.md` - This file (current status)
- ✅ `V3-STRUCTURED-OUTPUT-MIGRATION.md` - Zod structured output guide
- ✅ `V3-STRUCTURED-OUTPUT-TEST-RESULTS.md` - Test results from migration
- ✅ `V3-STRUCTURED-OUTPUT-SUMMARY.md` - Migration summary
- ✅ `V3-FINAL-STATUS.md` - V3 completion status
- ✅ `V3-FILE-CLEANUP-PLAN.md` - File organization plan
- ✅ `database/V3-FIX-SCHEMA-WARNINGS.md` - Safe schema initialization
- ✅ `FTS5-SIMILARITY-STRATEGY.md` - FTS5 BM25 scoring details
- ✅ `ARTICLE-IDENTITY-STRATEGY.md` - Canonical ID logic (active in V3)
- ✅ `UPDATE-ARTICLE-INDEXING-RULE.md` - Critical UPDATE indexing rule

**V2 Documentation** (Archived):
- � `_archive/obsolete-docs/PIPELINE-OVERVIEW.md` - Old V2 workflow
- 📦 `_archive/obsolete-docs/DUPLICATE-DETECTION-STRATEGY.md` - Entity-based approach
- 📦 `_archive/obsolete-docs/STEP5-*.md` - Old step documentation
- 📦 `_archive/obsolete-docs/STEP6-*.md` - Old step documentation
- 📦 `_archive/v2-entity-based/` - Entity-based duplicate detection scripts
- 📦 `_archive/migrations/` - One-time migration scripts
- 📦 `_archive/development-tests/` - V3 development test scripts

---

## 🎯 Success Criteria for Phase 4

- [ ] SKIP-UPDATE articles create entries in `article_updates` table
- [ ] `updateCount` incremented on original articles
- [ ] `isUpdate` flag set correctly
- [ ] `article_update_sources` links maintained
- [ ] Website displays update timeline correctly
- [ ] No duplicate insertions (idempotent update application)

---

## 🔧 Quick Commands

```bash
# View resolution distribution
sqlite3 logs/content-generation-v2.db \
  "SELECT resolution, COUNT(*) FROM articles GROUP BY resolution"

# View SKIP-UPDATE articles
sqlite3 logs/content-generation-v2.db \
  "SELECT headline, skip_reasoning FROM articles WHERE resolution='SKIP-UPDATE'"

# Test FTS5 scoring
npx tsx scripts/content-generation-v2/test-fts5-scoring.ts

# Rebuild FTS5 index (if needed)
npx tsx scripts/content-generation-v2/rebuild-fts5-clean.ts

# Run duplicate detection (dry run)
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --all --dry-run
```
