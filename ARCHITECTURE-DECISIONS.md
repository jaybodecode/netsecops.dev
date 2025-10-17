# Architecture Decisions - Entity-Based Content Pipeline

> **Purpose:** Document key architectural decisions for the new unified content generation pipeline with entity-relationship database schema.
>
> **Status:** 🔄 Design Complete - Ready for Database Implementation  
> **Date:** October 13, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Architectural Changes](#core-architectural-changes)
3. [Database Schema Design](#database-schema-design)
4. [Pipeline Flow](#pipeline-flow)
5. [Token Tracking](#token-tracking)
6. [Migration Strategy](#migration-strategy)
7. [Implementation Requirements](#implementation-requirements)

---

## 🎯 Overview

### Decision Summary

**OLD APPROACH:**
- Multi-step pipeline: Step 1 (search) → Step 2 (generate publication) → Step 3 (generate articles individually)
- Publication summary generated AFTER articles (loses context)
- Expensive: ~$5 for 10 articles (11 AI calls total)
- Naive similarity: Compare new article against ALL existing articles

**NEW APPROACH:**
- Unified generation: Step 1 (search) → Step 2 (generate publication + nested articles in ONE call)
- Publication summary has full context from AI generation
- Cheaper: ~$0.50 for 10 articles (2 AI calls total - 10x cost reduction)
- Smart similarity: Filter candidates by entity relationships FIRST, then compare titles/summaries

### Why the Change?

1. **Better AI Context:** Publication summary knows about all articles during generation
2. **Cost Efficiency:** 1 large call cheaper than N small calls (batch pricing)
3. **Performance:** Entity-based filtering 10-100x faster than naive approach
4. **Quality:** Related articles naturally linked by AI with full context
5. **Proven Pattern:** Old `cyber-news.ts` successfully used this approach

---

## 🏗️ Core Architectural Changes

### 1. Unified Publication + Article Generation

**Implementation:**
```typescript
// Step 2: Generate complete publication with nested articles
const result = await callGenkitGemini({
  prompt: searchResults,
  schema: CyberAdvisorySchema, // Publication with nested articles[]
  model: 'gemini-2.0-flash-exp'
})

// Result structure:
{
  pub_id: "daily-2025-10-13",
  headline: "Publication headline",
  summary: "Publication summary with full article context",
  articles: [
    { id, slug, headline, title, summary, full_report, ... }, // Full article
    { id, slug, headline, title, summary, full_report, ... }, // Full article
    // ... 8 more articles
  ]
}
```

**Key Points:**
- ONE AI call generates everything
- Publication summary written with knowledge of all articles
- Articles include full content (not minimal references)
- AI naturally links related articles during generation

### 2. Entity-Relationship Database Schema

**Core Insight:** Don't compare new article against ALL articles. Filter by shared entities first.

**Example Workflow:**
```sql
-- New article has: CVE-2025-1234, Microsoft, APT29

-- Step 1: Find articles sharing these entities (FAST)
SELECT DISTINCT a.article_id 
FROM articles a
JOIN article_cves ac ON a.article_id = ac.article_id
JOIN article_entities ae ON a.article_id = ae.article_id
WHERE ac.cve_id = 'CVE-2025-1234'
   OR ae.entity_name IN ('Microsoft', 'APT29')

-- Result: 5-50 candidate articles (not 10,000+)

-- Step 2: Calculate similarity on filtered subset (CHEAP)
-- Compare titles and summaries using embeddings/fuzzy matching
```

**Performance Impact:**
- Without filtering: 10,000 similarity calculations
- With entity filtering: 5-50 similarity calculations
- **Speedup: 200-2000x faster**

### 3. Dual Storage Strategy

**Save Both Raw + Processed:**

```
public/data/
├── publications-raw/
│   └── daily-2025-10-13_timestamp.json     # Raw AI output (complete)
└── publications/
    └── daily/
        └── daily-2025-10-13.json           # Minimal references only
```

**Raw File (`publications-raw/`):**
- Complete AI response with nested articles
- Audit trail for debugging
- Regeneration source if needed

**Processed File (`publications/`):**
- Minimal structure: `{ pub_id, slug, headline, articles: [article_ids] }`
- Frontend fetches articles separately
- Existing frontend code works unchanged

---

## 📊 Database Schema Design

### Core Tables

```sql
-- Articles table (fingerprint metadata)
CREATE TABLE articles (
    article_id VARCHAR(50) PRIMARY KEY,        -- article-2025-10-13-001
    slug VARCHAR(100) UNIQUE NOT NULL,         -- ransomware-memorial-hospital
    headline VARCHAR(100),
    title VARCHAR(200),
    summary TEXT,
    category VARCHAR(50),
    severity VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    fingerprint VARCHAR(64),                    -- SHA-256 of entity combo
    
    INDEX idx_fingerprint (fingerprint),
    INDEX idx_created (created_at DESC),
    INDEX idx_category (category)
);

-- CVE entities
CREATE TABLE cves (
    cve_id VARCHAR(20) PRIMARY KEY,             -- CVE-2025-1234
    cvss_score DECIMAL(3,1),
    severity VARCHAR(20),
    kev BOOLEAN,
    first_seen TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_severity (severity),
    INDEX idx_kev (kev)
);

-- Generic entities (companies, threat actors, malware, etc.)
CREATE TABLE entities (
    entity_id SERIAL PRIMARY KEY,
    entity_name VARCHAR(200) UNIQUE NOT NULL,   -- Microsoft, APT29, LockBit
    entity_type VARCHAR(50),                    -- vendor, threat_actor, malware
    stix_type VARCHAR(50),                      -- identity, threat-actor, malware
    
    INDEX idx_name (entity_name),
    INDEX idx_type (entity_type)
);

-- MITRE ATT&CK techniques
CREATE TABLE mitre_techniques (
    technique_id VARCHAR(20) PRIMARY KEY,       -- T1059.001
    technique_name VARCHAR(200),                -- PowerShell
    tactic VARCHAR(100),                        -- Execution
    
    INDEX idx_tactic (tactic)
);

-- Junction tables (many-to-many relationships)
CREATE TABLE article_cves (
    article_id VARCHAR(50) REFERENCES articles(article_id),
    cve_id VARCHAR(20) REFERENCES cves(cve_id),
    PRIMARY KEY (article_id, cve_id),
    INDEX idx_cve_lookup (cve_id)
);

CREATE TABLE article_entities (
    article_id VARCHAR(50) REFERENCES articles(article_id),
    entity_id INT REFERENCES entities(entity_id),
    PRIMARY KEY (article_id, entity_id),
    INDEX idx_entity_lookup (entity_id)
);

CREATE TABLE article_mitre (
    article_id VARCHAR(50) REFERENCES articles(article_id),
    technique_id VARCHAR(20) REFERENCES mitre_techniques(technique_id),
    PRIMARY KEY (article_id, technique_id),
    INDEX idx_technique_lookup (technique_id)
);
```

### Efficient Similarity Query

```sql
-- Find articles sharing SPECIFIC entities with new article
-- Focus on: CVEs, companies, products, threat actors, malware (NOT MITRE techniques)
WITH new_article_entities AS (
    SELECT UNNEST(ARRAY['APT29', 'Microsoft', 'Exchange Server', 'CVE-2025-1234', 'LockBit']) AS entity
),
candidate_articles AS (
    -- Articles sharing CVEs (very specific)
    SELECT DISTINCT a.article_id, a.headline, a.summary
    FROM articles a
    JOIN article_cves ac USING (article_id)
    WHERE ac.cve_id IN (SELECT entity FROM new_article_entities WHERE entity LIKE 'CVE-%')
    
    UNION
    
    -- Articles sharing specific entities (filter by type to exclude generic ones)
    SELECT DISTINCT a.article_id, a.headline, a.summary
    FROM articles a
    JOIN article_entities ae USING (article_id)
    JOIN entities e USING (entity_id)
    WHERE e.entity_name IN (SELECT entity FROM new_article_entities WHERE entity NOT LIKE 'CVE-%')
      AND e.entity_type IN ('vendor', 'company', 'product', 'threat_actor', 'malware')
)
SELECT * FROM candidate_articles;

-- Note: MITRE techniques NOT included in filtering - too generic
-- Many articles share T1059 (PowerShell), T1078 (Valid Accounts), etc.
-- Result: 5-50 articles (not 10,000+)
-- Then: Calculate similarity on these candidates only
```

---

## 🔄 Pipeline Flow

### Complete 5-Step Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│              UNIFIED CONTENT GENERATION PIPELINE             │
└─────────────────────────────────────────────────────────────┘

Step 1: Search & Aggregate (5-10 min)
├─ Tool: Vertex AI with Grounded Search
├─ Input: Date range, topics, sources
├─ Process:
│   ├─ Query cybersecurity news
│   ├─ Filter by relevance
│   └─ Extract: headlines, summaries, entities, sources
├─ Output: searchResults (raw text/JSON)
└─ Pass to Step 2 ✓

Step 2: Generate Publication + Articles (10-20 min)
├─ Tool: Gemini via Genkit (ONE CALL)
├─ Input: searchResults from Step 1
├─ Schema: CyberAdvisorySchema (publication + nested articles[])
├─ Process:
│   ├─ Generate publication metadata (headline, summary)
│   ├─ Generate 10 full articles (nested in response)
│   ├─ Extract entities, CVEs, MITRE techniques per article
│   ├─ AI links related articles naturally
│   └─ Validate against schema
├─ Output: Complete publication with nested articles
├─ Save to: public/data/publications-raw/{timestamp}.json
└─ Pass to Step 3 ✓

Step 3: Entity-Based Similarity Filtering (2-5 min)
├─ Input: Articles from Step 2
├─ Process:
│   ├─ For each article:
│   │   ├─ Extract SPECIFIC entities (CVEs, threat actors, companies, products, malware)
│   │   ├─ Query SQL: Find articles sharing these specific entities
│   │   ├─ Filter by entity_type to exclude generic ones
│   │   ├─ Calculate similarity on filtered subset only (5-50 candidates)
│   │   └─ Classify: NEW | UPDATE | SKIP
│   ├─ NEW articles: Insert into database with entity relationships
│   ├─ UPDATE articles: Merge content, update timestamp
│   └─ SKIP articles: Log only
│   ├─ Note: MITRE techniques stored but NOT used for filtering (too generic)
├─ Output: 
│   ├─ Articles to save (NEW + UPDATE)
│   └─ Entity relationship records (CVEs, entities, MITRE for categorization)
└─ Pass to Step 4 ✓

Step 4: Save Publication + Articles (1-2 min)
├─ Input: Publication + filtered articles from Step 3
├─ Process:
│   ├─ Save articles: public/data/articles/{category}/{slug}.json
│   ├─ Insert entity relationships to SQL
│   ├─ Save minimal publication: public/data/publications/daily/{id}.json
│   │   └─ Structure: { pub_id, slug, headline, articles: [ids] }
│   └─ Update SQL articles table with metadata
├─ Output: Published files + database records
└─ Pass to Step 5 ✓

Step 5: Regenerate Indexes (1-2 min)
├─ Input: All published articles + publications
├─ Process:
│   ├─ Scan public/data/articles/
│   ├─ Generate articles-index.json
│   ├─ Scan public/data/publications/
│   └─ Generate publications-index.json
├─ Output: Updated index files
└─ Complete! ✓

Total Runtime: ~20-40 minutes (down from 35-60 minutes)
Total Cost: ~$0.50 per run (down from ~$5.00)
```

### Data Flow Optimization

**Key Principles:**
1. Pass data between steps (don't re-read files)
2. Batch operations where possible
3. Validate early, save late
4. Generate everything in Step 2, filter in Step 3

---

## 📊 Token Tracking

### Unified Approach via Genkit

**Implementation:**
```typescript
// File: scripts/content-generation/lib/api-client.ts

export async function callGenkitGemini({ prompt, schema, model }) {
  const result = await ai.generate({
    model: gemini15Flash, // or gemini20FlashExp
    prompt,
    output: { schema }
  })
  
  // Centralized token logging
  const usage = result.usage
  logger.info(`📊 Token usage: ${usage.inputTokens} input + ${usage.outputTokens} output = ${usage.totalTokens} total`)
  
  // Cost calculation
  const cost = calculateCost(model, usage)
  logger.info(`💰 Cost: $${cost.toFixed(6)}`)
  
  return {
    content: result.output,
    usageMetadata: usage
  }
}
```

**Token Structure (Consistent Across APIs):**
```typescript
interface UsageMetadata {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}
```

**Benefits:**
- ✅ Single source of truth for token tracking
- ✅ Automatic logging on every API call
- ✅ Cost calculation built-in
- ✅ Works for both Vertex AI and Gemini API
- ✅ No manual logging needed in scripts

---

## 🔄 Migration Strategy

### Phase 1: Database Setup
```bash
# Create PostgreSQL database
createdb cybersec_content

# Run schema creation
psql cybersec_content < scripts/db/schema.sql

# Verify tables
psql cybersec_content -c "\dt"
```

### Phase 2: Update Step 2
```typescript
// OLD: generate-articles.ts (individual articles)
for (const topic of topics) {
  const article = await callGenkitGemini({ prompt: topic, schema: ArticleSchema })
  // ... save article
}

// NEW: generate-publication-unified.ts (publication + articles)
const publication = await callGenkitGemini({
  prompt: searchResults,
  schema: CyberAdvisorySchema, // Includes nested articles[]
  model: 'gemini-2.0-flash-exp'
})

// Save raw output
await saveRawPublication(publication)

// Extract and process
for (const article of publication.articles) {
  await processArticleWithEntities(article)
}
```

### Phase 3: Implement Entity-Based Similarity
```typescript
// NEW: check-duplicates-entity-based.ts
async function findCandidateArticles(newArticle) {
  // Extract SPECIFIC entities only (exclude MITRE - too generic)
  const cves = newArticle.cves || []
  
  const specificEntities = newArticle.entities
    .filter(e => ['vendor', 'company', 'product', 'threat_actor', 'malware'].includes(e.type))
    .map(e => e.name)
  
  // Query SQL for articles sharing these specific entities
  const candidates = await db.query(`
    SELECT DISTINCT a.article_id, a.headline, a.summary
    FROM articles a
    WHERE a.article_id IN (
      -- Articles sharing CVEs (very specific)
      SELECT article_id FROM article_cves WHERE cve_id = ANY($1)
      UNION
      -- Articles sharing specific entities only
      SELECT article_id FROM article_entities ae
        JOIN entities e USING (entity_id)
        WHERE e.entity_name = ANY($2)
          AND e.entity_type IN ('vendor', 'company', 'product', 'threat_actor', 'malware')
    )
  `, [cves, specificEntities])
  
  // Calculate similarity on filtered subset (5-50 articles instead of 10,000+)
  return candidates.map(c => ({
    ...c,
    similarity: calculateSimilarity(newArticle.headline, c.headline)
  }))
}

// Note: Still save MITRE techniques to database for categorization/analysis
// Just don't use them for duplicate detection filtering
```

### Phase 4: Update Step 4 (Save)
```typescript
// Save article + entity relationships
async function saveArticleWithEntities(article) {
  // 1. Save article file
  await fs.writeFile(`public/data/articles/${article.category}/${article.slug}.json`, JSON.stringify(article))
  
  // 2. Insert article metadata
  await db.query(`INSERT INTO articles (article_id, slug, headline, ...) VALUES (...)`)
  
  // 3. Insert entity relationships
  for (const cve of article.cves) {
    await db.query(`INSERT INTO cves (cve_id, ...) VALUES (...) ON CONFLICT DO NOTHING`)
    await db.query(`INSERT INTO article_cves (article_id, cve_id) VALUES (...)`)
  }
  
  for (const entity of article.entities) {
    const entityId = await db.query(`INSERT INTO entities (entity_name, ...) VALUES (...) RETURNING entity_id`)
    await db.query(`INSERT INTO article_entities (article_id, entity_id) VALUES (...)`)
  }
  
  // 4. Save minimal publication reference
  await savePublicationReference(article.pub_id, article.id)
}
```

---

## 🛠️ Implementation Requirements

### Dependencies

**Already Installed:**
- ✅ `genkit` (v0.9+)
- ✅ `@genkit-ai/google-genai` (Gemini plugin)
- ✅ `@genkit-ai/vertexai` (Vertex AI plugin)

**Need to Add:**
- 🔲 `pg` (PostgreSQL client)
- 🔲 `pg-promise` (Promise-based PostgreSQL)
- 🔲 `dotenv` (Environment variables)

```bash
npm install pg pg-promise dotenv
```

### Environment Variables

```bash
# .env
GEMINI_API_KEY=your_api_key
GCP_PROJECT_ID=your_project
GCP_LOCATION=us-central1
DATABASE_URL=postgresql://user:pass@localhost:5432/cybersec_content
```

### File Structure

```
scripts/
├── content-generation/
│   ├── lib/
│   │   ├── api-client.ts              # ✅ Already updated
│   │   ├── db-client.ts               # 🔲 NEW: Database operations
│   │   ├── entity-matcher.ts          # 🔲 NEW: Entity-based similarity
│   │   └── fingerprint.ts             # 🔲 NEW: Generate fingerprints
│   ├── cli/
│   │   ├── generate-publication-unified.ts  # 🔲 NEW: Step 2
│   │   ├── check-duplicates-entity.ts       # 🔲 NEW: Step 3
│   │   ├── save-with-entities.ts            # 🔲 NEW: Step 4
│   │   └── ...
│   └── db/
│       ├── schema.sql                 # 🔲 NEW: Database schema
│       ├── migrations/                # 🔲 NEW: Migration scripts
│       └── seed.sql                   # 🔲 NEW: Initial data
```

### Testing Plan

1. **Unit Tests:**
   - Entity extraction
   - Fingerprint generation
   - Similarity calculation
   - SQL queries

2. **Integration Tests:**
   - Step 2: Generate publication + articles
   - Step 3: Entity-based filtering
   - Step 4: Save with relationships

3. **End-to-End Test:**
   - Run complete pipeline
   - Verify files saved correctly
   - Check database populated
   - Confirm indexes updated

---

## 📝 Key Technical Decisions

### Why PostgreSQL?

- ✅ Relational data fits entity relationships perfectly
- ✅ Strong indexing for fast lookups
- ✅ JSON support for flexible metadata
- ✅ Mature Node.js ecosystem
- ✅ Easy to run locally and in cloud

### Why Gemini for Step 2?

- ✅ Supports structured output (schemas)
- ✅ Batch pricing more economical
- ✅ Lower latency than Vertex AI
- ✅ Simpler authentication
- ✅ Same Genkit API as Vertex

### Why Save Raw + Processed?

- ✅ Audit trail for debugging
- ✅ Can regenerate if processing fails
- ✅ Preserves AI's original output
- ✅ Enables A/B testing of processing logic

### Why Entity-Based Filtering?

- ✅ 10-100x faster than naive approach
- ✅ More accurate (semantic relationship)
- ✅ Scales to 100,000+ articles
- ✅ Enables advanced features (entity pages, graphs)

---

## 🎯 Success Metrics

### Performance Targets

- **Step 2 Runtime:** < 20 minutes for 10 articles
- **Step 3 Filtering:** < 5 minutes for 10 articles against 10,000 existing
- **Total Pipeline:** < 40 minutes (down from 60)
- **Cost per Run:** < $0.60 (down from $5.00)

### Quality Targets

- **Publication Context:** Summary references all articles
- **Related Articles:** AI-generated links accurate
- **Duplicate Detection:** < 1% false positives
- **Entity Extraction:** > 95% accuracy

---

## 📚 References

### Code Examples

- **Old Unified Approach:** `/OLD_PROJ_FILES/cyber-news.ts` (lines 1-523)
- **Current API Client:** `/scripts/content-generation/lib/api-client.ts`
- **Current Step 2:** `/scripts/content-generation/cli/generate-articles.ts`

### Documentation

- **Publication System:** `PUBLICATION-SYSTEM.md`
- **API Documentation:** Genkit SDK docs
- **Database:** PostgreSQL 16 docs

---

## ✅ Next Steps

1. **Review this document** - Confirm architectural decisions
2. **Create new chat session** - Fresh context for implementation
3. **Implement database schema** - Create tables and indexes
4. **Update Step 2** - Unified publication + article generation
5. **Implement Step 3** - Entity-based similarity filtering
6. **Update Step 4** - Save with entity relationships
7. **Test end-to-end** - Verify complete pipeline

---

**Document Version:** 1.0  
**Status:** 🔄 Ready for Database Implementation  
**Last Updated:** October 13, 2025
