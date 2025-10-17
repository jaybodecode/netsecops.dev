# 🚀 HANDOFF: Phase 2 Implementation - Unified Publication Generation

> **Date:** October 13, 2025  
> **From:** Phase 1 (Database Setup) - COMPLETE ✅  
> **To:** Phase 2 (Unified Publication + Article Generation)  
> **Status:** Ready to Start

---

## 📋 COPY THIS PROMPT TO NEW CHAT

```
I need to implement Phase 2 of the unified content generation pipeline.

CONTEXT:
Phase 1 (Database Setup) is complete. We have:
✅ SQLite database with entity-relationship schema
✅ Database client with all CRUD operations
✅ Entity-based filtering (10-100x faster than naive approach)
✅ Cost tracking infrastructure (pipeline_runs + api_calls tables)
✅ All tests passing

GOAL:
Implement unified publication + article generation that:
1. Generates publication + 10 articles in ONE Gemini API call (not N+1 calls)
2. Uses entity-based filtering to detect duplicates
3. Saves articles with entity relationships to database
4. Tracks costs per API call for reporting

EXPECTED RESULTS:
- Cost: $0.50 per run (down from $5.00) - 10x reduction
- Time: ~30 minutes (down from 60 minutes)
- Quality: Publication summary has full article context

REFERENCE DOCUMENTS:
- Read: ARCHITECTURE-DECISIONS.md (complete spec)
- Read: PHASE-1-COMPLETE.md (what's already done)
- Read: DATABASE-QUICK-REFERENCE.md (how to use database)
- Code example: OLD_PROJ_FILES/cyber-news.ts (lines 1-523)

IMPLEMENTATION STEPS:
1. Create CyberAdvisorySchema with nested articles[] field
2. Create generate-publication-unified.ts script
3. Call Gemini with full search results
4. Save raw output to publications-raw/
5. Use entity-based filtering for duplicate detection
6. Save articles with relationships to database
7. Track API costs in api_calls table

Please start by reading the architecture document and confirm understanding 
before implementing.
```

---

## 📊 What Phase 1 Accomplished

### Database Infrastructure ✅

**SQLite Database:** `logs/content-generation.db`
- 13 tables (including new `api_calls` table)
- 34 indexes for fast queries
- 9 views for analytics and cost reporting
- Full transaction support

**Core Tables:**
- `articles` - Article metadata + fingerprints
- `entities` - Companies, threat actors, malware, products
- `cves` - CVE identifiers with CVSS scores
- `mitre_techniques` - MITRE ATT&CK techniques
- `publications` - Publication collections
- `pipeline_runs` - Pipeline execution tracking
- `api_calls` - **NEW:** Detailed API cost tracking per call

**Junction Tables:**
- `article_cves` - Article ↔ CVE relationships
- `article_entities` - Article ↔ Entity relationships
- `article_mitre` - Article ↔ MITRE relationships
- `publication_articles` - Publication ↔ Article relationships

### Database Client ✅

**Location:** `scripts/content-generation/lib/db-client.ts`

**Core Operations:**
- Article CRUD (insert, update, query)
- Entity management (auto-dedup, returns entity_id)
- CVE tracking (with CVSS, KEV flag)
- MITRE technique storage
- Relationship linking

**Key Feature: Entity-Based Filtering**
```typescript
const candidates = findCandidateArticlesByEntities(db, cves, entityNames)
// Filters 10,000+ articles down to 5-50 candidates in milliseconds
// Returns match score for prioritization
// 10-100x faster than naive string comparison
```

**Pipeline Tracking:**
- `startPipelineRun()` - Start new run
- `updatePipelineRun()` - Update status/metrics
- `logAPICall()` - **NEW:** Track individual API call costs
- `getAPICallsForRun()` - Get all API calls for a run
- `getCostSummary()` - Get cost summary by date range

### Cost Tracking Infrastructure ✅

**Two-Level Tracking:**

1. **Pipeline Level** (`pipeline_runs` table):
   - Total tokens (input + output)
   - Total cost for entire run
   - Articles generated/updated/skipped
   - Run status and duration

2. **API Call Level** (`api_calls` table) - **NEW:**
   - Provider (gemini, vertex, genkit_gemini, genkit_vertex)
   - Model name (gemini-2.0-flash-exp, etc.)
   - Operation type (search, generate_publication, generate_article)
   - Tokens and cost per call
   - Duration and status

**Cost Reporting Views:**
- `v_cost_by_run` - Cost per pipeline run with per-article breakdown
- `v_cost_by_provider` - Total cost by API provider
- `v_cost_by_model` - Cost breakdown by model
- `v_cost_by_operation` - Cost by operation type (search vs generation)
- `v_daily_costs` - Daily cost summary

### Centralized Token Tracking ✅

**Location:** `scripts/content-generation/lib/api-client.ts`

**Functions:**
- `callGenkitGemini()` - Automatic token logging + cost calculation
- `callGenkitGroundedSearch()` - Vertex AI with token tracking
- All API calls return `usageMetadata` with tokens + estimated cost

**Usage Example:**
```typescript
const result = await callGenkitGemini(prompt, { model: 'gemini-2.0-flash-exp' })

// Automatic logging:
// 📊 Token usage: 10,234 input + 5,123 output = 15,357 total
// 💰 Estimated cost: $0.0124 (input: $0.0008, output: $0.0116)

// Access metadata:
const tokens = result.usageMetadata.totalTokens
const cost = result.usageMetadata.estimatedCost

// Log to database:
logAPICall(db, {
  run_id: runId,
  api_provider: 'genkit_gemini',
  model_name: 'gemini-2.0-flash-exp',
  operation: 'generate_publication',
  tokens_input: result.usageMetadata.inputTokens,
  tokens_output: result.usageMetadata.outputTokens,
  tokens_total: result.usageMetadata.totalTokens,
  cost_usd: result.usageMetadata.estimatedCost,
  status: 'success'
})
```

### Test Results ✅

All tests passed! Entity-based filtering works perfectly:

```
✅ Scenario 1: CVE-2025-1234 + Microsoft + Exchange Server
   → Found 2 articles (both Exchange-related) with match scores

✅ Scenario 2: APT29 threat actor
   → Found 1 article (correctly identified)

✅ Scenario 3: CVE-2025-5678 + Google + Chrome
   → Found 1 article (Chrome update)

✅ Scenario 4: Unrelated topic (Cisco + CVE-2025-9999)
   → Found 0 articles (correctly filtered out)
```

### Files Created ✅

```
logs/
  └── content-generation.db              # SQLite database

scripts/
  ├── db/
  │   ├── schema.sql                     # Database schema (v2 with api_calls)
  │   ├── init-db.ts                     # Initialization script
  │   └── test-db.ts                     # Test suite
  └── content-generation/
      └── lib/
          ├── db-client.ts               # Database client (with API tracking)
          └── api-client.ts              # API client (with token tracking)

Documentation:
  ├── ARCHITECTURE-DECISIONS.md          # Complete architecture spec
  ├── PHASE-1-COMPLETE.md                # Phase 1 summary
  ├── DATABASE-QUICK-REFERENCE.md        # Database usage guide
  └── PHASE-2-HANDOFF.md                 # This document
```

---

## 🎯 Phase 2: What Needs to Be Built

### Overview

**Current Approach (OLD - EXPENSIVE):**
```
Step 1: Search for news → searchResults
Step 2: Generate publication metadata → publication
Step 3: Loop through topics and generate each article individually → 10 API calls
Total: 11 API calls, ~$5.00, 60 minutes
```

**New Approach (UNIFIED - CHEAP):**
```
Step 1: Search for news → searchResults
Step 2: Generate publication + nested articles in ONE call → publication with articles[]
Step 3: Entity-based filtering + save with relationships
Total: 2 API calls, ~$0.50, 30 minutes
```

### Key Implementation Points

#### 1. Schema Design

**Create `CyberAdvisorySchema`** with nested articles:

```typescript
const CyberAdvisorySchema = {
  type: 'object',
  properties: {
    pub_id: { type: 'string' },
    slug: { type: 'string' },
    headline: { type: 'string' },
    summary: { type: 'string' },
    pub_type: { type: 'string' },
    articles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          article_id: { type: 'string' },
          slug: { type: 'string' },
          headline: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' },
          full_report: { type: 'string' },
          category: { type: 'string' },
          severity: { type: 'string' },
          cves: { type: 'array', items: { type: 'object' } },
          entities: { type: 'array', items: { type: 'object' } },
          mitre_techniques: { type: 'array', items: { type: 'object' } },
          // ... other fields
        }
      },
      minItems: 10,
      maxItems: 10
    }
  },
  required: ['pub_id', 'headline', 'articles']
}
```

#### 2. Generation Script

**File:** `scripts/content-generation/cli/generate-publication-unified.ts`

**Flow:**
```typescript
// Start pipeline run
const runId = startPipelineRun(db, 'daily')
const startTime = Date.now()

// Step 1: Get search results (from previous step)
const searchResults = await getSearchResults()

// Step 2: Generate publication + articles in ONE call
const result = await callGenkitGemini(searchResults, {
  model: 'gemini-2.0-flash-exp',
  schema: CyberAdvisorySchema
})

// Log API call
logAPICall(db, {
  run_id: runId,
  api_provider: 'genkit_gemini',
  model_name: 'gemini-2.0-flash-exp',
  operation: 'generate_publication',
  prompt_length: searchResults.length,
  tokens_input: result.usageMetadata.inputTokens,
  tokens_output: result.usageMetadata.outputTokens,
  tokens_total: result.usageMetadata.totalTokens,
  cost_usd: result.usageMetadata.estimatedCost,
  duration_ms: Date.now() - startTime,
  status: 'success'
})

// Step 3: Save raw output
await saveRawPublication(result.content)

// Step 4: Process each article
let newCount = 0, updateCount = 0, skipCount = 0

for (const article of result.content.articles) {
  // Extract entities
  const cves = article.cves.map(c => c.cve_id)
  const entities = article.entities.map(e => e.entity_name)
  
  // Find candidates using entity-based filtering
  const candidates = findCandidateArticlesByEntities(db, cves, entities)
  
  // Calculate similarity on filtered subset
  const isDuplicate = candidates.some(c => 
    calculateSimilarity(article.headline, c.headline) > 0.85
  )
  
  if (isDuplicate) {
    skipCount++
    continue
  }
  
  // Save article with relationships
  transaction(db, () => {
    upsertArticle(db, article)
    
    // Save CVEs
    article.cves.forEach(cve => {
      upsertCVE(db, cve)
      linkArticleToCVE(db, article.article_id, cve.cve_id)
    })
    
    // Save entities
    article.entities.forEach(entity => {
      const entityId = upsertEntity(db, entity)
      linkArticleToEntity(db, article.article_id, entityId)
    })
    
    // Save MITRE techniques
    article.mitre_techniques.forEach(mitre => {
      upsertMITRETechnique(db, mitre)
      linkArticleToMITRE(db, article.article_id, mitre.technique_id)
    })
  })
  
  newCount++
}

// Update pipeline run
updatePipelineRun(db, runId, {
  status: 'completed',
  articles_generated: result.content.articles.length,
  articles_new: newCount,
  articles_updated: updateCount,
  articles_skipped: skipCount,
  tokens_input: result.usageMetadata.inputTokens,
  tokens_output: result.usageMetadata.outputTokens,
  cost_usd: result.usageMetadata.estimatedCost
})
```

#### 3. Dual Storage

**Raw Output:** `public/data/publications-raw/{pub_id}_{timestamp}.json`
- Complete AI response with all articles
- Full content for audit trail
- Can regenerate if processing fails

**Processed Output:** `public/data/publications/daily/{pub_id}.json`
- Minimal structure: `{ pub_id, slug, headline, articles: [article_ids] }`
- Frontend fetches articles separately
- Existing code works unchanged

#### 4. Entity-Based Filtering (Already Implemented)

**Use the existing function:**
```typescript
import { findCandidateArticlesByEntities } from './lib/db-client'

// Extract SPECIFIC entities (excludes generic MITRE techniques)
const cves = ['CVE-2025-1234']
const entities = ['Microsoft', 'Exchange Server', 'APT29', 'LockBit']

// Filter 10,000+ articles down to 5-50 candidates
const candidates = findCandidateArticlesByEntities(db, cves, entities)

// Only calculate similarity on filtered subset
for (const candidate of candidates) {
  const similarity = calculateSimilarity(newArticle.headline, candidate.headline)
  if (similarity > 0.85) {
    console.log('Duplicate found!')
    break
  }
}
```

**What gets filtered:**
- ✅ CVEs (very specific)
- ✅ Vendors (Microsoft, Google, Cisco)
- ✅ Products (Exchange Server, Chrome, Windows)
- ✅ Threat actors (APT29, Lazarus Group)
- ✅ Malware (LockBit, Emotet)
- ❌ MITRE techniques (too generic - stored but not used for filtering)

#### 5. Cost Tracking Integration

**Track every API call:**
```typescript
const startTime = Date.now()

try {
  const result = await callGenkitGemini(prompt, options)
  
  // Log successful call
  logAPICall(db, {
    run_id: runId,
    api_provider: 'genkit_gemini',
    model_name: options.model || 'gemini-2.0-flash-exp',
    operation: 'generate_publication',
    prompt_length: prompt.length,
    tokens_input: result.usageMetadata.inputTokens,
    tokens_output: result.usageMetadata.outputTokens,
    tokens_total: result.usageMetadata.totalTokens,
    cost_usd: result.usageMetadata.estimatedCost,
    duration_ms: Date.now() - startTime,
    status: 'success'
  })
} catch (error) {
  // Log failed call
  logAPICall(db, {
    run_id: runId,
    api_provider: 'genkit_gemini',
    model_name: options.model || 'gemini-2.0-flash-exp',
    operation: 'generate_publication',
    tokens_input: 0,
    tokens_output: 0,
    tokens_total: 0,
    cost_usd: 0,
    duration_ms: Date.now() - startTime,
    status: 'error',
    error_message: error.message
  })
  throw error
}
```

**Query costs:**
```sql
-- Cost for specific run
SELECT * FROM v_cost_by_run WHERE run_id = 1;

-- Cost by provider
SELECT * FROM v_cost_by_provider;

-- Cost by model
SELECT * FROM v_cost_by_model;

-- Daily costs
SELECT * FROM v_daily_costs WHERE date >= '2025-10-01';

-- API calls for debugging
SELECT * FROM api_calls WHERE run_id = 1 ORDER BY called_at;
```

---

## 📚 Reference Documents

### Must Read Before Starting

1. **ARCHITECTURE-DECISIONS.md**
   - Complete architectural specification
   - Database schema with SQL
   - Pipeline flow diagrams
   - All technical decisions documented

2. **PHASE-1-COMPLETE.md**
   - What was accomplished in Phase 1
   - Test results and verification
   - Performance metrics

3. **DATABASE-QUICK-REFERENCE.md**
   - How to use the database client
   - Code examples for common operations
   - SQL query patterns

### Code References

1. **OLD_PROJ_FILES/cyber-news.ts** (lines 1-523)
   - Proven unified generation pattern
   - Shows how nested articles worked successfully
   - Used same CyberAdvisorySchema approach

2. **scripts/content-generation/lib/api-client.ts**
   - Centralized token tracking
   - Cost calculation formulas
   - Retry logic and error handling

3. **scripts/content-generation/lib/db-client.ts**
   - All database operations
   - Entity-based filtering implementation
   - Cost tracking functions

---

## ✅ Verification Checklist

Before considering Phase 2 complete:

- [ ] CyberAdvisorySchema created with nested articles[]
- [ ] generate-publication-unified.ts implemented
- [ ] ONE API call generates publication + 10 articles
- [ ] Raw output saved to publications-raw/
- [ ] Entity-based filtering used for duplicate detection
- [ ] Articles saved with entity relationships
- [ ] API calls logged to api_calls table
- [ ] Pipeline run tracking updated with totals
- [ ] Cost per article calculated correctly
- [ ] Existing frontend works unchanged
- [ ] End-to-end test passes
- [ ] Cost reduced to ~$0.50 per run
- [ ] Runtime reduced to ~30 minutes

---

## 🚨 Important Reminders

### DON'T
❌ Generate articles individually in a loop (old approach)  
❌ Compare new articles against ALL existing articles  
❌ Use MITRE techniques for duplicate detection filtering  
❌ Forget to log API calls to database  
❌ Skip the entity relationship storage

### DO
✅ Generate publication + articles in ONE call  
✅ Use entity-based filtering BEFORE similarity calculation  
✅ Store MITRE techniques (just don't use for filtering)  
✅ Log every API call with tokens and cost  
✅ Save both raw and processed outputs  
✅ Use transactions for atomic operations  
✅ Track cost per run AND per API call

---

## 📊 Expected Results

### Performance Targets

- **API Calls:** 2 (search + generate) vs 11 (old approach)
- **Cost:** ~$0.50 vs ~$5.00 (10x reduction)
- **Runtime:** ~30 minutes vs 60 minutes (2x faster)
- **Filtering:** 5-50 candidates vs 10,000+ (10-100x faster)

### Quality Targets

- **Publication Context:** Summary references all 10 articles
- **Entity Extraction:** >95% accuracy
- **Duplicate Detection:** <1% false positives
- **Related Articles:** AI-generated links accurate

### Cost Tracking

- **Pipeline Level:** Total cost and tokens per run
- **API Call Level:** Individual call tracking with duration
- **Reporting:** Cost by provider, model, operation, date
- **Debugging:** Full API call history with errors

---

## 🎬 Getting Started in New Chat

### Step 1: Copy the prompt at the top of this document

### Step 2: Read the reference documents
- ARCHITECTURE-DECISIONS.md (primary reference)
- PHASE-1-COMPLETE.md (context)
- DATABASE-QUICK-REFERENCE.md (usage guide)

### Step 3: Review the code examples
- OLD_PROJ_FILES/cyber-news.ts (proven pattern)
- scripts/content-generation/lib/api-client.ts (token tracking)
- scripts/content-generation/lib/db-client.ts (database ops)

### Step 4: Implement in order
1. Create schema
2. Build generation script
3. Integrate entity-based filtering
4. Add cost tracking
5. Test end-to-end

### Step 5: Verify results
- Check cost reduced to ~$0.50
- Verify entity relationships stored
- Confirm API calls logged
- Test duplicate detection
- Run cost reports

---

## 📞 Questions to Confirm

If unclear, confirm with user:

1. **Schema fields:** Are all article fields needed in the schema?
2. **Filtering threshold:** Is 0.85 similarity threshold appropriate?
3. **Cost alerts:** Should we alert if cost exceeds expected amount?
4. **Error handling:** How to handle partial failures (some articles fail)?
5. **Regeneration:** Should we support regenerating from raw files?

---

## 🎉 Success Criteria

Phase 2 is complete when:

1. ✅ ONE API call generates publication + 10 articles
2. ✅ Cost reduced to ~$0.50 per run (measured in database)
3. ✅ Entity-based filtering working (5-50 candidates, not 10,000+)
4. ✅ All entity relationships stored in database
5. ✅ Every API call logged with tokens/cost
6. ✅ Cost reports accessible via SQL views
7. ✅ Existing frontend works unchanged
8. ✅ End-to-end test passes
9. ✅ Documentation updated with Phase 2 results

---

**Ready to hand off to Phase 2 implementation!** 🚀

Copy the prompt at the top and paste into a new chat window with fresh context.
