# Phase 2 Handoff - Unified Content Generation Pipeline

**Date:** October 13, 2025  
**Status:** Phase 1 Complete ✅ | Phase 2 Ready to Start 🚀  
**Schema Version:** v3

---

## 🎯 Quick Context

You're implementing **Phase 2: Unified Publication Generation** for a cybersecurity content pipeline.

**Goal:** Generate publication + 10 articles in ONE AI call (instead of 11 separate calls), then use entity-based filtering for smart duplicate detection.

**Cost savings:** $5.00/run → $0.50/run (10x reduction)  
**Performance:** 10-100x faster duplicate detection via entity filtering

---

## 📋 Copy This Prompt to New Chat

```
I'm implementing Phase 2 of a unified content generation pipeline for cybersecurity articles.

CONTEXT:
- Phase 1 (Database Setup) is COMPLETE ✅
- Database schema v3 with entity-relationship architecture
- Location: logs/content-generation.db
- Schema: /scripts/db/schema.sql
- Client: /scripts/content-generation/lib/db-client.ts

TASK:
Build unified publication generation that:
1. Takes search results (text)
2. Generates publication + nested articles in ONE AI call
3. Uses entity-based filtering for duplicate detection
4. Saves to database with entity relationships

KEY DOCUMENTS TO READ:
1. /PHASE-1-COMPLETE.md - What's already built
2. /ARCHITECTURE-DECISIONS.md - Pipeline design & entity filtering logic
3. /scripts/db/schema.sql - Database structure (14 tables, 36 indexes)
4. /scripts/content-generation/lib/db-client.ts - Database operations

IMPORTANT RULES:
- Entity filtering uses: CVEs, companies, threat actors, products, malware
- MITRE techniques stored but NOT used for filtering (too generic)
- AI outputs entities in structured format (already in schema)
- Save raw AI output to publications_raw table for audit
- Use console logging (no DB logging yet)

STATUS:
✅ Database schema complete (v3)
✅ Entity-relationship tables ready
✅ Cost tracking infrastructure ready
✅ Test suite passing
🔄 Need to build: generate-publication-unified.ts script

NEXT STEP:
Review the architecture documents and help me build the unified generation script.
```

---

## 📚 Essential Documents (Read in Order)

### 1. **Phase 1 Completion Status**
**File:** `/PHASE-1-COMPLETE.md`
- What was built in Phase 1
- Database schema overview
- Test results
- What's ready for Phase 2

### 2. **Architecture & Design**
**File:** `/ARCHITECTURE-DECISIONS.md`
- Complete pipeline flow (5 steps)
- Entity-based filtering logic (THE KEY FEATURE)
- Why MITRE techniques excluded from filtering
- Performance improvements explained
- Token tracking approach

### 3. **Database Schema**
**File:** `/scripts/db/schema.sql`
- 14 tables including:
  - `articles`, `entities`, `cves`, `mitre_techniques`
  - `article_cves`, `article_entities`, `article_mitre` (relationships)
  - `publications`, `publications_raw` (publication + audit trail)
  - `api_calls`, `pipeline_runs` (cost/execution tracking)
- 36 indexes for performance
- Schema version: 3

### 4. **Database Client**
**File:** `/scripts/content-generation/lib/db-client.ts`
- 40+ database functions
- Key functions:
  - `findCandidateArticlesByEntities()` - Entity-based filtering
  - `upsertArticle()`, `upsertEntity()`, `upsertCVE()`, `upsertMITRETechnique()`
  - `linkArticleToCVE()`, `linkArticleToEntity()`, `linkArticleToMITRE()`
  - `savePublicationRaw()` - Save raw AI output for audit
  - `logAPICall()` - Track costs
  - `startPipelineRun()`, `updatePipelineRun()` - Track execution

### 5. **Schema Update Summary**
**File:** `/SCHEMA-V3-UPDATE.md`
- Recent changes (publications_raw table added)
- Usage examples
- Fingerprinting strategy clarification
- Test results

### 6. **Documentation Alignment**
**File:** `/DOCUMENTATION-ALIGNMENT-ANALYSIS.md` (OPTIONAL - for context)
- Explains why old SQLITE-ARCHITECTURE.md is marked historical
- Current vs old architecture comparison
- Decision to use entity-relationship approach

---

## 🔑 Critical Concepts

### 1. Pipeline Flow

```
Step 1: Search (Vertex AI Grounded Search)
├─ Output: Raw text results
└─ Save to: Console logs (for now)

Step 2: Generate Publication + Articles (ONE unified call)
├─ Input: Raw search results from Step 1
├─ AI Call: Gemini with CyberAdvisorySchema
├─ Output: Publication with nested articles[]
├─ Schema includes:
│   ├─ Publication: headline, summary, pub_type
│   └─ Articles[]: headline, title, summary, full_report, entities, mitre_attack
└─ Save to: publications_raw table (audit trail)

Step 3: Entity-Based Filtering
├─ For each article:
│   ├─ Extract entities (CVEs, companies, threat actors, products, malware)
│   ├─ Query: findCandidateArticlesByEntities()
│   ├─ Returns: 5-50 candidate articles (not 10,000+)
│   ├─ Calculate similarity on filtered subset
│   └─ Classify: NEW | UPDATE | SKIP
└─ Save: NEW articles with entity relationships

Step 4: Save Publication + Articles
├─ Save articles: public/data/articles/{category}/{slug}.json
├─ Save publication: public/data/publications/daily/{id}.json
└─ Update database with metadata

Step 5: Regenerate Indexes
├─ Generate articles-index.json
└─ Generate publications-index.json
```

### 2. Entity-Based Filtering (THE KEY OPTIMIZATION)

**Without filtering (naive approach):**
```typescript
// Compare new article against ALL articles
for (const existingArticle of allArticles) {  // 10,000+ iterations
  similarity = calculateSimilarity(newArticle, existingArticle)
}
```

**With entity filtering (smart approach):**
```typescript
// Step 1: Filter by entities FIRST (SQL query)
const candidates = await findCandidateArticlesByEntities({
  cves: ["CVE-2025-1234"],
  entities: ["Microsoft", "APT29"]  // Excludes MITRE!
})
// Returns: 5-50 candidates (not 10,000+)

// Step 2: Calculate similarity ONLY on candidates
for (const candidate of candidates) {  // 5-50 iterations
  similarity = calculateSimilarity(newArticle, candidate)
}
```

**Performance:** 200-2000x faster (10,000 comparisons → 5-50 comparisons)

### 3. AI Schema Output (Already Structured!)

**AI outputs entities automatically:**
```json
{
  "pub_id": "daily-2025-10-13",
  "headline": "Daily Cybersecurity Advisory",
  "articles": [
    {
      "id": "article-2025-10-13-001",
      "headline": "Microsoft Patch Tuesday",
      "title": "Microsoft Releases Critical Security Updates",
      "summary": "...",
      "full_report": "...",
      "entities": {
        "cves": ["CVE-2025-1234", "CVE-2025-5678"],
        "threat_actors": ["APT29"],
        "malware": ["LockBit"],
        "companies": ["Microsoft"],
        "products": ["Exchange Server"]
      },
      "mitre_attack": {
        "tactics": ["Execution", "Persistence"],
        "techniques": ["T1059.001", "T1078"]
      }
    }
  ]
}
```

**You don't extract entities - AI generates them in the schema!**

### 4. Fingerprinting Strategy

**Used for filtering:**
✅ CVEs (very specific)  
✅ Companies/vendors (specific)  
✅ Threat actors (specific)  
✅ Products (specific)  
✅ Malware (specific)  
❌ MITRE techniques (too generic - excluded)

**Stored in database:**
✅ ALL entities (including MITRE) - for search later

**Why exclude MITRE?**
- Too generic (many articles share "T1078 - Valid Accounts")
- Would cause false positives in duplicate detection
- Still stored for categorization/search

### 5. Database Operations

**Save article with relationships:**
```typescript
// 1. Save article
const articleId = await upsertArticle(db, {
  article_id: article.id,
  slug: article.slug,
  headline: article.headline,
  title: article.title,
  summary: article.summary,
  category: article.category,
  severity: article.severity,
  fingerprint: calculateFingerprint(article.entities)
})

// 2. Save entities and link
for (const cve of article.entities.cves) {
  await upsertCVE(db, { cve_id: cve })
  await linkArticleToCVE(db, articleId, cve)
}

for (const company of article.entities.companies) {
  const entityId = await upsertEntity(db, {
    entity_name: company,
    entity_type: 'company'
  })
  await linkArticleToEntity(db, articleId, entityId)
}

// 3. Save MITRE (for search, not filtering)
for (const technique of article.mitre_attack.techniques) {
  await upsertMITRETechnique(db, { technique_id: technique })
  await linkArticleToMITRE(db, articleId, technique)
}
```

**Find candidates:**
```typescript
const candidates = await findCandidateArticlesByEntities(db, {
  cves: article.entities.cves,
  entityNames: [
    ...article.entities.companies,
    ...article.entities.threat_actors,
    ...article.entities.products,
    ...article.entities.malware
  ]
  // Note: MITRE techniques NOT included
})
```

---

## 🗂️ Project Structure

```
/Users/admin/cybernetsec-io/
├── scripts/
│   ├── db/
│   │   ├── schema.sql                    # Database schema v3
│   │   ├── init-db.ts                    # Initialize database
│   │   ├── test-db.ts                    # Test entity filtering
│   │   ├── test-publications-raw.ts      # Test audit trail
│   │   └── report-costs.ts               # Cost reporting
│   │
│   └── content-generation/
│       ├── lib/
│       │   ├── db-client.ts              # Database operations (40+ functions)
│       │   ├── api-client.ts             # Genkit API calls (token tracking)
│       │   ├── file-utils.ts             # File I/O
│       │   ├── fingerprint.ts            # Similarity scoring
│       │   ├── logger.ts                 # Console logging
│       │   └── slug-generator.ts         # SEO slugs
│       │
│       ├── config/
│       │   ├── defaults.ts               # Model selection by task
│       │   └── sources.ts                # Search topics
│       │
│       ├── schemas/
│       │   ├── article.ts                # Article schema (LLM)
│       │   └── publication.ts            # Publication schema (LLM)
│       │
│       └── cli/
│           ├── search-news.mjs           # Step 1 (existing)
│           ├── generate-articles.mjs     # Step 2 (old approach)
│           └── generate-publication-unified.ts  # Step 2 (NEW - to build)
│
├── logs/
│   └── content-generation.db             # SQLite database
│
├── public/data/
│   ├── articles/                         # Published articles (JSON)
│   └── publications/                     # Published publications (JSON)
│
├── PHASE-1-COMPLETE.md                   # Phase 1 summary
├── PHASE-2-HANDOFF-UPDATED.md            # This file
├── ARCHITECTURE-DECISIONS.md             # Design decisions
├── SCHEMA-V3-UPDATE.md                   # Recent changes
└── DOCUMENTATION-ALIGNMENT-ANALYSIS.md   # Architecture comparison

scripts/content-generation/docs/          # Historical TypeScript migration docs
├── 00-INDEX.md                           # Documentation index
├── LLM-HANDOFF.md                        # TypeScript migration context
├── SQLITE-ARCHITECTURE.md                # Historical (old design)
└── ...                                   # Other reference docs
```

---

## 🛠️ What's Already Built (Phase 1)

### Database
✅ Schema v3 with 14 tables, 36 indexes  
✅ Entity-relationship architecture  
✅ Publications_raw for audit trail  
✅ Cost tracking (api_calls table)  
✅ Initialized and tested

### Database Client Functions
✅ `initDatabase()` - Open connection  
✅ `upsertArticle()` - Save article  
✅ `upsertEntity()`, `upsertCVE()`, `upsertMITRETechnique()` - Save entities  
✅ `linkArticleToCVE()`, `linkArticleToEntity()`, `linkArticleToMITRE()` - Relationships  
✅ `findCandidateArticlesByEntities()` - Smart filtering (KEY FUNCTION)  
✅ `savePublicationRaw()` - Audit trail  
✅ `logAPICall()` - Cost tracking  
✅ `startPipelineRun()`, `updatePipelineRun()` - Execution tracking  
✅ `getDatabaseStats()` - Statistics

### Tests
✅ Entity-based filtering tested (4 scenarios)  
✅ Publications_raw tested  
✅ All database operations validated

---

## 🚀 What Needs to Be Built (Phase 2)

### 1. CyberAdvisorySchema
**File:** `scripts/content-generation/schemas/publication-unified.ts` (or similar)

**Structure:**
```typescript
{
  pub_id: string,              // daily-2025-10-13
  slug: string,                // daily-2025-10-13
  headline: string,            // Publication headline
  summary: string,             // Publication summary
  pub_type: 'daily' | 'weekly' | 'monthly',
  articles: [                  // Nested articles (NOT references)
    {
      id: string,
      slug: string,
      headline: string,
      title: string,
      summary: string,
      full_report: string,
      category: string,
      severity: string,
      entities: {
        cves: string[],
        threat_actors: string[],
        malware: string[],
        companies: string[],
        products: string[]
      },
      mitre_attack: {
        tactics: string[],
        techniques: string[]
      },
      // ... other fields (twitter_post, linkedin_post, etc.)
    }
  ]
}
```

### 2. Unified Generation Script
**File:** `scripts/content-generation/cli/generate-publication-unified.ts`

**Pseudocode:**
```typescript
// Step 1: Get search results (from previous step or input)
const searchResults = await getSearchResults()

// Step 2: Generate publication + articles in ONE call
const result = await callGenkitGemini(searchResults, {
  schema: CyberAdvisorySchema,
  model: 'gemini-2.0-flash-exp',
  task: 'publicationGeneration'
})

// Save raw output for audit
await savePublicationRaw(db, {
  pub_id: result.pub_id,
  raw_data: JSON.stringify(result),
  model_used: 'gemini-2.0-flash-exp',
  prompt_tokens: result.usage.inputTokens,
  completion_tokens: result.usage.outputTokens
})

// Step 3: Process each article
for (const article of result.articles) {
  // Entity-based filtering
  const candidates = await findCandidateArticlesByEntities(db, {
    cves: article.entities.cves,
    entityNames: [
      ...article.entities.companies,
      ...article.entities.threat_actors,
      ...article.entities.products,
      ...article.entities.malware
    ]
  })
  
  // Calculate similarity on filtered subset
  const decision = classifyArticle(article, candidates)
  
  if (decision === 'NEW') {
    // Save article with entity relationships
    await saveArticleWithEntities(db, article)
  } else if (decision === 'UPDATE') {
    // Update existing article
    await updateArticleWithEntities(db, article, matchedId)
  }
  // SKIP: do nothing
}

// Step 4: Save publication
await savePublication(db, result)

// Step 5: Regenerate indexes
await regenerateIndexes()
```

### 3. Helper Functions

**Need to build:**
- `classifyArticle()` - NEW/UPDATE/SKIP logic with similarity scoring
- `saveArticleWithEntities()` - Save article + all entity relationships
- `updateArticleWithEntities()` - Merge content and update
- `savePublication()` - Save publication metadata

---

## 📊 Expected Performance

### Cost Reduction
- **Old:** $5.00 per run (11 API calls)
- **New:** $0.50 per run (2 API calls)
- **Savings:** 10x reduction

### Speed Improvement
- **Old filtering:** Compare against 10,000+ articles
- **New filtering:** Compare against 5-50 candidates (entity-filtered)
- **Speedup:** 200-2000x faster

### Token Costs (Estimated)
- **Search (Step 1):** ~50K tokens (~$0.10)
- **Unified generation (Step 2):** ~200K tokens (~$0.40)
- **Total:** ~$0.50 per run

---

## 🧪 Testing Strategy

### 1. Test Unified Generation
```bash
# Generate publication with nested articles
npx tsx scripts/content-generation/cli/generate-publication-unified.ts \
  --input=OUTPUT/search-news_*.json \
  --dry-run
```

### 2. Verify Entity Filtering
```bash
# Check candidates returned (should be 5-50, not 10,000+)
npx tsx scripts/db/test-entity-filtering.ts
```

### 3. Verify Cost Tracking
```bash
# Check API calls logged
npx tsx scripts/db/report-costs.ts --last-run
```

### 4. Verify Audit Trail
```bash
# Check raw output saved
npx tsx scripts/db/check-publications-raw.ts
```

---

## ⚠️ Important Notes

### Console Logging Only (For Now)
- Use `logger.info()`, `logger.warn()`, `logger.error()`
- No database logging yet (was causing confusion)
- Will add back DB logging after Phase 2 works

### MITRE Techniques
- AI generates them (part of schema)
- Store in database (for search/categorization)
- **DO NOT use for fingerprinting** (too generic)
- Still valuable for categorization and search

### Schema Versions
- Website types: `/types/cyber.ts` (NO descriptions)
- LLM schemas: `/scripts/content-generation/schemas/*.ts` (WITH descriptions)
- Keep them field-aligned but separate

### Fingerprint Calculation
- Use specific entities only (CVEs, companies, threat actors, products, malware)
- Calculate SHA-256 hash of sorted entity combination
- Store in `articles.fingerprint` for quick lookups

---

## 🎯 Success Criteria

Phase 2 is complete when:

✅ Can generate publication + 10 articles in ONE AI call  
✅ Entity-based filtering reduces candidates to 5-50  
✅ NEW/UPDATE/SKIP classification working  
✅ Articles saved with entity relationships  
✅ Publications_raw audit trail saved  
✅ Cost tracking shows ~$0.50 per run  
✅ Performance is 10-100x faster than naive approach  
✅ All entity relationships stored correctly

---

## 📞 Questions to Ask

When you start Phase 2 implementation:

1. **Should I create the schema first or the script first?**
   - Recommend: Schema first (easier to test)

2. **What similarity algorithm should I use?**
   - Recommend: Start with Jaccard similarity on titles (simple)
   - Can enhance later with embeddings if needed

3. **What thresholds for NEW/UPDATE/SKIP?**
   - Recommend: < 60% = NEW, 60-85% = UPDATE, ≥ 85% = SKIP
   - Can tune later based on results

4. **Should I implement all 5 steps or focus on Step 2-3?**
   - Recommend: Focus on Step 2-3 first (core logic)
   - Step 1 (search) already exists
   - Step 4-5 (save/index) can be added after

---

## 🚀 Ready to Start!

You have everything you need:
- ✅ Database ready
- ✅ Functions ready
- ✅ Architecture designed
- ✅ Tests passing
- ✅ Documentation complete

**Next action:** Read PHASE-1-COMPLETE.md and ARCHITECTURE-DECISIONS.md, then start building the unified generation script!

Good luck! 🎉
