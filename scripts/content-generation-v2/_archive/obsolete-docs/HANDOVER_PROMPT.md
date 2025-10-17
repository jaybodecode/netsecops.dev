# V3 Migration Handover - Phase 2 Complete ✅

**Date:** October 14, 2025  
**Status:** Phase 2 Complete, Ready for Phase 3  
**Database:** `logs/content-generation-v2.db` (Clean V3 Schema)

---

## 🎯 Current Status

### ✅ What's Complete

**Phase 1: Schema Migration** ✅
- Created clean V3 database schema with FTS5 support
- Script: `rebuild-database-v3.ts` - Clean slate rebuild from source data
- All old V2 tables removed, fresh V3 schema implemented
- Source data preserved: `raw_search` (8 days) + `structured_news` (7 complete days)
- Backups: `logs/backups/raw-search-backup.json` + `structured-news-backup.json`

**Phase 2: Insert Articles** ✅
- Script: `insert-articles.ts` - Normalizes structured_news → V3 schema
- **60 articles inserted** across 6 days (Oct 7, 9, 10, 11, 12, 13)
- All articles have `resolution = NULL` (ready for duplicate detection)
- 6 publications created with `article_ids` JSON arrays
- FTS5 virtual table populated with weighted content

### 📊 Database Overview

**Current Data:**
```
Date       Articles  Status
---------- --------- ------------------
2025-10-07    10     ✅ Inserted
2025-10-09    10     ✅ Inserted
2025-10-10    10     ✅ Inserted
2025-10-11    10     ✅ Inserted
2025-10-12    10     ✅ Inserted
2025-10-13    10     ✅ Inserted
2025-10-14    ?      ⏳ Incomplete data
---------- --------- ------------------
TOTAL:        60     Ready for Phase 3
```

**Schema Structure:**
- `articles` - Main table with resolution tracking
- `articles_fts` - FTS5 virtual table (headline 10x, summary 5x, full_report 1x)
- `article_cves` - CVE vulnerabilities
- `article_entities` - Named entities (companies, threat actors, products)
- `article_tags` - Cybersecurity tags
- `article_sources` - Source references
- `article_events` - Timeline events
- `article_mitre_techniques` - ATT&CK techniques
- `article_impact_scope` - Impact analysis
- `publications` - Publications with article_ids JSON array

---

## 🔥 Key Decisions & Context

### 1. Clean Slate Rebuild Strategy
**Problem:** Migration scripts were hitting multiple schema conflicts (missing columns, wrong FK references)

**Solution:** Export source data → Drop all tables → Create clean V3 schema → Re-import

**Why This Worked:** 
- `raw_search` and `structured_news` are just JSON blobs (no complex schema)
- Expensive LLM-generated content preserved ($1.76 in API costs)
- No need to fight with ALTER TABLE migrations

**Script:** `rebuild-database-v3.ts`

### 2. Resolution Tracking (V3 Core Feature)
All articles have these fields for duplicate detection:
- `resolution` - NULL | 'NEW' | 'SKIP-FTS5' | 'SKIP-LLM' | 'SKIP-UPDATE' | 'UPDATE'
- `similarity_score` - BM25 score from FTS5
- `matched_article_id` - ID of duplicate article
- `skip_reasoning` - LLM or threshold reasoning

### 3. FTS5 Configuration
```sql
CREATE VIRTUAL TABLE articles_fts USING fts5(
  article_id UNINDEXED,
  headline,
  summary,
  full_report,
  tokenize = 'porter unicode61 remove_diacritics 1'
)
```

**Weighted Scoring:** headline (10x), summary (5x), full_report (1x)

### 4. Cost Tracking
- Total spend so far: **$1.76 USD** across 31 API calls
- Gemini 2.5 Flash-Lite added: $0.10/1M input, $0.40/1M output
- Cost tracking in `api_calls` table

---

## 📝 Next Steps: Phase 3

### Goal: FTS5 Duplicate Detection with 3-Tier Thresholds

**Create/Update:** `check-duplicates.ts`

**Algorithm:**
1. For each NEW article (resolution = NULL):
   - Query FTS5 with: `SELECT bm25(articles_fts, 10.0, 5.0, 1.0) as score ...`
   - Find top match from existing articles (earlier created_at)
   
2. Apply 3-tier threshold:
   - **Score ≥ -50:** Mark as 'NEW' (clearly different)
   - **Score < -150:** Mark as 'SKIP-FTS5' (clearly duplicate)
   - **Score -150 to -50:** Call LLM to decide
   
3. If LLM called:
   - Response: 'NEW', 'SKIP', or 'UPDATE'
   - If 'UPDATE': Merge content into matched article
   - Store reasoning in `skip_reasoning`

4. Update publication:
   - Regenerate `article_ids` array (only 'NEW' articles)
   - Call LLM to regenerate title/summary

**Test Cases (from FTS5-SIMILARITY-STRATEGY.md):**
- LockBit alliance article: Score -177.77 → Should auto-skip
- Qantas leak variations: Score -126.48 → LLM decides

**Expected Duplicates in Current Data:**
- "Clop exploits Oracle EBS zero-day" (appears Oct 7, 9, 10, 12, 13)
- "Qantas data breach" (appears Oct 7, 9, 12, 13)
- "SonicWall credential compromise" (appears Oct 7, 10, 11, 12)
- "White Lock ransomware" (appears Oct 10, 11, 12)

---

## 📚 Key Documentation

**Source of Truth:**
- `FTS5-SIMILARITY-STRATEGY.md` (1520 lines) - Complete V3 strategy & validation
- `V3-MIGRATION-STRATEGY.md` (443 lines) - Migration checklist & phases
- `V3-DATABASE-SCHEMA.md` - Complete schema reference
- `news-structured-schema.ts` - Authoritative Zod schema

**Implementation Files:**
- `rebuild-database-v3.ts` - Clean database rebuild ✅
- `insert-articles.ts` - Article insertion ✅
- `check-duplicates.ts` - **NEXT: Phase 3 implementation**
- `ai/vertex.ts` - LLM client with cost tracking

---

## 🔧 Commands Reference

### Insert Articles
```bash
# Single date
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-07

# Dry run
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-07 --dry-run
```

### Database Queries
```bash
# Check article counts
sqlite3 logs/content-generation-v2.db "
SELECT DATE(created_at) as date, COUNT(*) as articles 
FROM articles 
GROUP BY DATE(created_at) ORDER BY date"

# Check resolutions
sqlite3 logs/content-generation-v2.db "
SELECT resolution, COUNT(*) 
FROM articles 
GROUP BY resolution"

# Test FTS5 query
sqlite3 logs/content-generation-v2.db "
SELECT 
  article_id,
  bm25(articles_fts, 10.0, 5.0, 1.0) as score,
  headline
FROM articles_fts
WHERE articles_fts MATCH 'clop oracle ebs'
ORDER BY score
LIMIT 10"
```

### Rebuild Database (if needed)
```bash
# Full rebuild
npx tsx scripts/content-generation-v2/rebuild-database-v3.ts

# Backup only
npx tsx scripts/content-generation-v2/rebuild-database-v3.ts --backup-only
```

---

## 🎯 Phase 3 Implementation Plan

### Step 1: Create FTS5 Query Function
```typescript
function findSimilarArticles(articleId: string, content: string): Array<{
  matchedArticleId: string;
  score: number;
  headline: string;
}> {
  // Query FTS5 with weighted BM25 scoring
  // Exclude articles from same day (created_at)
  // Return top match only
}
```

### Step 2: Implement 3-Tier Logic
```typescript
if (score >= -50) {
  // Auto-mark as NEW
  resolution = 'NEW';
} else if (score < -150) {
  // Auto-skip (clear duplicate)
  resolution = 'SKIP-FTS5';
} else {
  // Call LLM to decide
  const llmDecision = await compareDuplicates(article, matchedArticle);
  resolution = llmDecision.decision; // 'NEW', 'SKIP', or 'UPDATE'
}
```

### Step 3: LLM Comparison Function
```typescript
async function compareDuplicates(
  newArticle: Article,
  existingArticle: Article
): Promise<{
  decision: 'NEW' | 'SKIP' | 'UPDATE';
  reasoning: string;
  mergedContent?: string; // if UPDATE
}> {
  // Use gemini-2.5-flash-lite for cost efficiency
  // Structured output with Zod schema
}
```

### Step 4: Update Publication
```typescript
function regeneratePublication(publicationId: string) {
  // Get all NEW articles
  // Call LLM to generate new title/summary
  // Update publication table
}
```

---

## ⚠️ Important Notes

1. **Foreign Keys Disabled:** `pragma('foreign_keys = OFF')` in insert-articles.ts due to old V2 FK references

2. **Oct 14 Data:** Has incomplete structured_news (2 bytes), skip until regenerated

3. **Model Selection:**
   - News generation: `gemini-2.5-pro` ($1.25 in, $10 out)
   - Duplicate detection: Use `gemini-2.5-flash-lite` ($0.10 in, $0.40 out)
   - Search: `gemini-2.5-pro` with grounding ($35/1k requests)

4. **Token Limits:** Max 1,048,576 input, 65,536 output (Gemini 2.5)

5. **BM25 Scores:** Negative scores (better match = more negative). Test cases validated at -50 and -150 thresholds.

---

## 📞 Handover Checklist

- [x] Database rebuilt with clean V3 schema
- [x] 60 articles inserted across 6 days
- [x] All articles ready for duplicate detection (resolution = NULL)
- [x] FTS5 virtual table populated and indexed
- [x] Source data backed up (raw_search + structured_news)
- [x] Cost tracking functional ($1.76 total spend)
- [x] Gemini 2.5 Flash-Lite added for cost optimization
- [ ] **TODO:** Implement Phase 3 duplicate detection
- [ ] **TODO:** Test with known duplicate cases
- [ ] **TODO:** Phase 4: Output generation (RSS/JSON)

---

## 🚀 Ready to Start Phase 3!

**First command to run:**
```bash
# Read the complete strategy
cat scripts/content-generation-v2/FTS5-SIMILARITY-STRATEGY.md

# Check current state
sqlite3 logs/content-generation-v2.db "SELECT COUNT(*) FROM articles WHERE resolution IS NULL"

# Start implementing check-duplicates.ts
```

**Expected outcome:** Articles marked with appropriate resolutions, duplicates identified, publications updated with deduplicated article lists.

---

*Last updated: October 14, 2025*  
*Database path: `/Users/admin/cybernetsec-io/logs/content-generation-v2.db`*  
*Working directory: `/Users/admin/cybernetsec-io/scripts/content-generation-v2/`*
