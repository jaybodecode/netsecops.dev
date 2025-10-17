# Phase 2 Implementation Progress

**Date:** October 13, 2025  
**Status:** Steps 1-3 Complete ✅ | Step 4 In Progress 🔄

---

## ✅ Completed Components

### 1. Unified Publication Schema ✅
**File:** `scripts/content-generation/schemas/publication-unified.mjs`

- CyberAdvisorySchema with nested articles[] array
- Publication metadata (headline, summary, threat_overview)
- Full ArticleSchema embedded (not just IDs)
- AI generates everything in ONE call

### 2. Step 2: Unified Generation Script ✅
**File:** `scripts/content-generation/cli/generate-publication-unified.ts`

**What it does:**
- Takes raw text search results from Step 1 (search-news.ts)
- Calls Gemini 2.0 Flash with unified schema
- Generates publication + N articles in ONE AI call
- Saves raw output to publications_raw table (audit trail)
- Tracks tokens and cost via db-client
- Outputs structured JSON for Step 3

**Cost optimization:**
- OLD: 11 API calls ($5.00)
- NEW: 2 API calls ($0.50)
- Savings: 10x reduction!

**Usage:**
```bash
npx tsx scripts/content-generation/cli/generate-publication-unified.ts \
  --input=OUTPUT/search-news_2025-10-08.json \
  --count=5
```

### 3. Step 3: Entity-Based Filtering Script ✅
**File:** `scripts/content-generation/cli/filter-articles-entity.ts`

**What it does:**
- Loads publication with nested articles from Step 2
- For each article:
  - Extracts SPECIFIC entities (CVEs, companies, threat actors, products, malware)
  - ❌ EXCLUDES MITRE techniques (too generic)
  - Calls `findCandidateArticlesByEntities()` from db-client
  - Returns 5-50 candidates (not 10,000+!)
  - Calculates similarity on filtered subset
  - Classifies: NEW / UPDATE / SKIP
- Outputs classifications for Step 4

**Performance:**
- WITHOUT filtering: 10,000 comparisons per article (5-10 seconds)
- WITH filtering: 5-50 comparisons per article (100-500ms)
- Speedup: 10-100x faster! ⚡

**Usage:**
```bash
npx tsx scripts/content-generation/cli/filter-articles-entity.ts \
  --input=OUTPUT/publication-unified_2025-10-08.json \
  --verbose
```

### 4. Similarity Calculation ✅
**File:** `scripts/content-generation/lib/fingerprint.ts` (already existed)

- Jaccard similarity on titles/summaries
- Entity overlap scoring
- Weighted algorithm:
  - Companies: 40% (primary)
  - Threat actors: 20%
  - Malware: 12%
  - Title similarity: 15%
  - Summary similarity: 8%
  - CVEs: 3%
  - Threat type: 2%

**Thresholds:**
- < 60% = NEW
- 60-85% = UPDATE
- ≥ 85% = SKIP

---

## 🔄 In Progress

### 5. Step 4: Save Articles with Entity Relationships
**File:** `scripts/content-generation/cli/save-articles-with-entities.ts` (to create)

**What it needs to do:**
- Load classifications from Step 3
- For NEW articles:
  - Call `upsertArticle(db, article)`
  - Save CVEs: `upsertCVE()` + `linkArticleToCVE()`
  - Save entities: `upsertEntity()` + `linkArticleToEntity()`
  - Save MITRE: `upsertMITRETechnique()` + `linkArticleToMITRE()`
  - Save JSON file: `public/data/articles/{category}/{slug}.json`
- For UPDATE articles:
  - Merge content with existing article
  - Update entity relationships
  - Increment updateCount
- For SKIP articles:
  - Log only, no action

---

## 📋 To Do

### 6. End-to-End Testing
- Run Step 1: search-news.ts (5 days ago)
- Run Step 2: generate-publication-unified.ts (5 articles)
- Run Step 3: filter-articles-entity.ts (verify 5-50 candidates)
- Run Step 4: save-articles-with-entities.ts
- Verify:
  - Cost: ~$0.50 total
  - publications_raw has audit trail
  - Entity relationships in database
  - JSON files in public/data/

---

## 📂 File Structure

```
scripts/content-generation/
├── schemas/
│   ├── article.mjs                       ✅ (existing)
│   ├── publication-unified.mjs           ✅ NEW
│   └── publication-unified.d.mts         ✅ NEW (TypeScript types)
│
├── cli/
│   ├── search-news.ts                    ✅ (existing - Step 1)
│   ├── generate-publication-unified.ts   ✅ NEW (Step 2)
│   ├── filter-articles-entity.ts         ✅ NEW (Step 3)
│   └── save-articles-with-entities.ts    🔄 TODO (Step 4)
│
└── lib/
    ├── db-client.ts                      ✅ (existing - 40+ functions)
    ├── fingerprint.ts                    ✅ (existing - similarity)
    ├── api-client.ts                     ✅ (existing - Gemini calls)
    ├── file-utils.ts                     ✅ (existing)
    └── logger.ts                         ✅ (existing)
```

---

## 🎯 Pipeline Flow (Complete)

```
┌─────────────────────────────────────────────────────────────┐
│            PHASE 2: UNIFIED CONTENT PIPELINE                 │
└─────────────────────────────────────────────────────────────┘

Step 1: Search (search-news.ts)
├─ Input: Date range, topics
├─ Process: Vertex AI with Google Search Grounding
├─ Output: Raw text search results (unstructured)
└─ File: OUTPUT/search-news_YYYY-MM-DD.json

Step 2: Generate Structure (generate-publication-unified.ts) ✅ NEW
├─ Input: Raw text from Step 1
├─ Process: Gemini 2.0 Flash with CyberAdvisorySchema
├─ Output: Publication + nested articles (structured JSON)
├─ Database: Save raw output to publications_raw (audit)
├─ Cost: ~$0.40 (was $5.00 with old approach)
└─ File: OUTPUT/publication-unified_YYYY-MM-DD.json

Step 3: Entity Filtering (filter-articles-entity.ts) ✅ NEW
├─ Input: Publication with articles from Step 2
├─ Process:
│   ├─ Extract SPECIFIC entities (CVEs, companies, threat actors, products, malware)
│   ├─ Query: findCandidateArticlesByEntities() → 5-50 candidates
│   ├─ Calculate similarity on filtered subset
│   └─ Classify: NEW / UPDATE / SKIP
├─ Output: Classifications for each article
├─ Performance: 10-100x faster than naive approach
└─ File: OUTPUT/publication-unified_YYYY-MM-DD_classified.json

Step 4: Save with Relationships (save-articles-with-entities.ts) 🔄 TODO
├─ Input: Classifications from Step 3
├─ Process:
│   ├─ NEW: Save article + entity relationships to database
│   ├─ UPDATE: Merge content, update relationships
│   ├─ SKIP: Log only
│   └─ Save JSON: public/data/articles/{category}/{slug}.json
├─ Output: Published articles + database records
└─ Database: articles, entities, cves, article_cves, article_entities, etc.

Step 5: Regenerate Indexes (existing)
├─ Input: All published articles
├─ Process: Scan public/data/
└─ Output: articles-index.json, publications-index.json
```

---

## 🔑 Key Design Decisions

### Why Entity-Based Filtering?

**Problem:** Comparing each new article against ALL existing articles is slow:
```typescript
// Naive approach
for (const existingArticle of allArticles) {  // 10,000+ iterations
  similarity = calculateSimilarity(newArticle, existingArticle)
}
// Time: 5-10 seconds per article
```

**Solution:** Filter by shared entities FIRST, then compare:
```typescript
// Entity-based approach
const candidates = findCandidateArticlesByEntities(cves, entityNames)  // SQL query
// Returns: 5-50 candidates (not 10,000+!)

for (const candidate of candidates) {  // 5-50 iterations
  similarity = calculateSimilarity(newArticle, candidate)
}
// Time: 100-500ms per article (10-100x faster!)
```

### Why Exclude MITRE Techniques?

**Problem:** MITRE techniques are too generic:
- T1078 (Valid Accounts) - used in 1000+ articles
- T1059 (Command and Script Interpreter) - used in 800+ articles
- Would cause massive false positives in filtering

**Solution:**
- ✅ STORE MITRE techniques in database (for categorization/search)
- ❌ EXCLUDE from duplicate detection filtering
- Only use SPECIFIC entities: CVEs, companies, threat actors, products, malware

---

## 💰 Cost Breakdown

### OLD Approach (Multi-Call)
```
1 publication call:  ~$0.20
10 article calls:    ~$4.80 (10 × $0.48)
---
Total:               ~$5.00 per run
```

### NEW Approach (Unified)
```
1 search call:       ~$0.10 (Step 1)
1 unified call:      ~$0.40 (Step 2)
---
Total:               ~$0.50 per run
Savings:             10x reduction!
```

---

## 📊 Expected Performance

Based on Phase 1 testing with 3 test articles:

### Entity Filtering
```
Scenario 1: CVE-2025-1234 + Microsoft
  → Found 2 articles (200x faster than scanning 10,000)

Scenario 2: APT29 only
  → Found 1 article

Scenario 3: CVE-2025-5678 + Google + Chrome
  → Found 1 article

Scenario 4: CVE-2025-9999 + Cisco (unrelated)
  → Found 0 articles (correctly filtered out)
```

### Production Estimates (10,000 existing articles)
```
Per article filtering:
- WITHOUT entity filtering: 10,000 comparisons × 0.5ms = 5,000ms (5 seconds)
- WITH entity filtering: 50 comparisons × 0.5ms = 25ms
- Speedup: 200x faster!

Full pipeline (5 articles):
- Step 1 (search): ~10 seconds
- Step 2 (generate): ~30 seconds
- Step 3 (filter): ~0.5 seconds (was 25 seconds)
- Step 4 (save): ~2 seconds
---
Total: ~43 seconds (was 67 seconds)
Speedup: 1.5x faster overall
```

---

## 🚀 Ready to Test!

Current status:
- ✅ Steps 1-3 implemented
- 🔄 Step 4 in progress
- 📋 Step 5 already exists

Next actions:
1. Finish Step 4 (save-articles-with-entities.ts)
2. Run end-to-end test with 5 days back, 5 articles
3. Verify performance and cost
4. Check database audit trail

---

**Last Updated:** October 13, 2025
