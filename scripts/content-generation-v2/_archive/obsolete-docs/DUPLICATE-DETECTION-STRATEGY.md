# Duplicate Detection Strategy - Content Generation V2

> **⚠️ DEPRECATED - 2025-10-14**  
> **This entity-based weighted similarity approach has been replaced with SQLite FTS5 full-text search.**  
> **See: `FTS5-SIMILARITY-STRATEGY.md` for the new approach.**
>
> **Original Purpose**: Architecture decision document comparing storage and duplicate detection approaches before implementation.
> 
> **Date**: 2025-10-14  
> **Status**: 🔴 DEPRECATED - Entity union matching does not scale reliably

---

## Problem Statement

We're ingesting ~10-50 cybersecurity articles daily from Google Search. Many articles cover the **same underlying story** with different angles:

**Example Timeline:**
- **Day 1**: "Citibank Ransomware Attack - Initial Breach Detected"
- **Day 2**: "Citibank Data Exfiltration - 50TB of Customer Data Stolen"
- **Day 3**: "LockBit Claims Responsibility for Citibank Attack"
- **Day 4**: "Citibank Attack Linked to CVE-2025-12345 Vulnerability"

**Challenge**: Determine which articles are:
1. **NEW** - Completely different story (create new article)
2. **UPDATE** - Continuation of existing story (append to existing)
3. **SKIP** - Duplicate/no new information (ignore)

**Scale Problem**:
- 5000+ articles in database
- Can't do semantic/vector search (security terms don't embed well)
- Can't check against all 5000 articles per new article (5-10 seconds each = 7+ hours per day)
- Need to narrow from 5000 candidates → 5-50 candidates before LLM comparison

---

## Current Database: Two Separate Systems

### 1. Content Generation V2 (New, Simple)

**Database**: `logs/content-generation-v2.db`

**Tables**:
```sql
-- Raw search results (unstructured text)
CREATE TABLE raw_search (
  pub_date TEXT UNIQUE,
  raw_text TEXT,
  ...
);

-- Structured articles (complete JSON blob)
CREATE TABLE structured_news (
  pub_date TEXT UNIQUE,
  data TEXT,  -- ENTIRE CyberAdvisoryType JSON
  pub_id TEXT,
  headline TEXT,
  total_articles INTEGER,
  ...
);

-- API cost tracking
CREATE TABLE api_calls (...);
```

**Philosophy**: 
- ✅ **Simple** - Minimal schema, JSON blobs
- ✅ **Fast to query** by date
- ❌ **No entity relationships** - can't query "all articles mentioning Microsoft"
- ❌ **No duplicate detection** - yet

### 2. Content Generation V1 (Old, Complex)

**Database**: `logs/content-generation.db`

**Tables** (14 total):
```sql
-- Core article metadata (NO full content)
CREATE TABLE articles (
  article_id VARCHAR(50) PRIMARY KEY,
  headline TEXT,
  summary TEXT,
  fingerprint VARCHAR(64),  -- SHA-256 hash
  ...
);

-- Normalized entities
CREATE TABLE entities (
  entity_id INTEGER PRIMARY KEY,
  entity_name VARCHAR(200) UNIQUE,
  entity_type VARCHAR(50)
);

CREATE TABLE cves (
  cve_id VARCHAR(20) PRIMARY KEY,
  cvss_score DECIMAL(3,1),
  ...
);

CREATE TABLE mitre_techniques (...);

-- Relationships (many-to-many)
CREATE TABLE article_cves (
  article_id VARCHAR(50),
  cve_id VARCHAR(20),
  PRIMARY KEY (article_id, cve_id)
);

CREATE TABLE article_entities (
  article_id VARCHAR(50),
  entity_id INTEGER,
  PRIMARY KEY (article_id, entity_id)
);

CREATE TABLE article_mitre (...);
```

**Philosophy**:
- ✅ **Queryable** - Can find articles by entity
- ✅ **Duplicate detection** - Entity-based filtering works
- ❌ **Complex** - 14 tables, junction tables, normalization
- ❌ **Article content elsewhere** - Full text in JSON files on disk

---

## Storage Strategy Comparison

### Option A: JSON Blob Storage (Current V2)

**Structure**:
```typescript
// structured_news.data column contains:
{
  pub_id: "daily-2025-10-07",
  headline: "...",
  articles: [
    {
      id: "uuid-123",
      slug: "citibank-ransomware-attack",
      summary: "...",
      full_report: "...",  // 1000-5000 words
      entities: [
        { name: "Citibank", type: "company" },
        { name: "LockBit", type: "malware" },
        { name: "APT29", type: "threat_actor" }
      ],
      cves: [
        { id: "CVE-2025-12345", cvss_score: 9.8, ... }
      ],
      mitre_techniques: [...],
      sources: [...]
    },
    // 5-50 more articles
  ]
}
```

**Pros**:
- ✅ **Simple schema** - One table, one JSON column
- ✅ **Complete data** - Everything in one place
- ✅ **Fast writes** - No normalization overhead
- ✅ **Version control** - Easy to snapshot entire publication
- ✅ **Easy exports** - Already in JSON format for frontend

**Cons**:
- ❌ **Can't query entities** - No way to find "all articles about Microsoft"
- ❌ **Duplicate detection is HARD** - Must parse entire JSON every time
- ❌ **No indexes** - Can't index nested JSON efficiently in SQLite
- ❌ **Large storage** - Repeated entity names, CVE details in every article
- ❌ **No relationships** - Can't track entity frequency, trends

**Duplicate Detection with JSON Blobs**:
```typescript
// To check if new article is duplicate:
1. Load ALL structured_news records from DB (5000+)
2. Parse JSON for each publication
3. Extract all articles from each publication
4. For EVERY article (50,000+ total):
   - Parse entities array
   - Parse cves array
   - Compare against new article
5. Calculate similarity scores
6. LLM comparison on top matches

// Time: 30-60 seconds PER new article
// NOT SCALABLE
```

---

### Option B: Normalized Relational (V1 Style)

**Structure**:
```sql
-- Article metadata ONLY
CREATE TABLE articles (
  article_id VARCHAR(50) PRIMARY KEY,
  headline TEXT,
  summary TEXT,
  full_report TEXT,  -- Store full content here
  fingerprint VARCHAR(64)
);

-- Normalized entities
CREATE TABLE entities (
  entity_id INTEGER PRIMARY KEY,
  entity_name VARCHAR(200) UNIQUE
);

-- Relationships
CREATE TABLE article_entities (
  article_id VARCHAR(50),
  entity_id INTEGER,
  PRIMARY KEY (article_id, entity_id)
);

-- Same for CVEs, MITRE techniques
```

**Pros**:
- ✅ **Queryable** - Fast entity lookups with indexes
- ✅ **Duplicate detection scales** - Entity-based filtering gets 5-50 candidates
- ✅ **Storage efficient** - Entity names stored once
- ✅ **Analytics** - Can track entity frequency, trends
- ✅ **Relationships** - Can find related articles

**Cons**:
- ❌ **Complex schema** - 14 tables, many JOINs
- ❌ **Write overhead** - Insert article + N entities + M CVEs + O MITRE (3-50 inserts per article)
- ❌ **Harder exports** - Must JOIN to reconstruct full article
- ❌ **Migration complexity** - Schema changes require migrations

**Duplicate Detection with Normalized Schema**:
```typescript
// To check if new article is duplicate:
1. Extract entities from new article: ["Citibank", "LockBit", "CVE-2025-12345"]
2. Query DB for candidates:
   SELECT a.* FROM articles a
   WHERE a.article_id IN (
     SELECT article_id FROM article_cves WHERE cve_id = 'CVE-2025-12345'
     UNION
     SELECT ae.article_id FROM article_entities ae
     JOIN entities e ON ae.entity_id = e.entity_id
     WHERE e.entity_name IN ('Citibank', 'LockBit')
   );
3. Returns 5-50 candidates (not 5000!)
4. Calculate similarity on summary field only
5. LLM comparison on top 3-5 matches

// Time: 100-500ms per new article
// SCALES TO 100K+ articles
```

---

### Option C: Hybrid (Best of Both?)

**Structure**:
```sql
-- Full JSON blob for easy access
CREATE TABLE structured_news (
  pub_date TEXT UNIQUE,
  data TEXT,  -- Complete JSON
  ...
);

-- Extracted entity index (separate table)
CREATE TABLE article_entity_index (
  article_id TEXT,
  entity_name TEXT,
  entity_type TEXT,
  pub_date TEXT,  -- Link to structured_news
  PRIMARY KEY (article_id, entity_name)
);

CREATE INDEX idx_entity_lookup ON article_entity_index(entity_name);
CREATE INDEX idx_entity_type ON article_entity_index(entity_type);

-- CVE index
CREATE TABLE article_cve_index (
  article_id TEXT,
  cve_id TEXT,
  pub_date TEXT,
  PRIMARY KEY (article_id, cve_id)
);

CREATE INDEX idx_cve_lookup ON article_cve_index(cve_id);
```

**Process**:
1. **Storage**: Save full JSON to `structured_news.data` (simple)
2. **Indexing**: Extract entities/CVEs and populate index tables (fast queries)
3. **Queries**: Use indexes for duplicate detection
4. **Retrieval**: Load full JSON for display (no JOINs needed)

**Pros**:
- ✅ **Simple storage** - JSON blobs (no normalization)
- ✅ **Fast queries** - Indexed lookups
- ✅ **Duplicate detection scales** - Entity-based filtering
- ✅ **Easy exports** - JSON already formatted
- ✅ **Optional analytics** - Index tables for trends

**Cons**:
- ❌ **Denormalized** - Entity names repeated in both JSON and index
- ❌ **Sync complexity** - Must keep JSON and indexes in sync
- ❌ **Extra writes** - Save JSON + populate indexes
- ❌ **Storage overhead** - Data stored twice

---

## Duplicate Detection Algorithm Comparison

### Approach 1: Full Text Comparison (What You Want to Avoid)

```typescript
// For each new article:
for (const existingArticle of allArticles) {  // 5000+ iterations
  const similarity = calculateTextSimilarity(
    newArticle.summary,
    existingArticle.summary
  );
  
  if (similarity > 0.85) return 'SKIP';
  if (similarity > 0.60) return 'UPDATE';
}

// Time: 5-10 seconds per article
// NOT SCALABLE
```

**Why This Fails**:
- Text similarity (Jaccard, shingling) is slow
- Security terms don't have good semantic embeddings
- Paraphrased content has low text similarity (30-50%)
- Must compare against EVERY article

---

### Approach 2: Entity-Based Filtering (V1 Working Approach)

**Phase 1: Narrow Candidates (SQL)**
```sql
-- Extract SPECIFIC entities from new article
-- Exclude generic entities (MITRE techniques, "ransomware", "malware")
NEW_ENTITIES = ['Citibank', 'LockBit', 'CVE-2025-12345']

-- Query for candidates sharing these entities
SELECT a.article_id, a.headline, a.summary,
       COUNT(*) as match_score
FROM articles a
WHERE a.article_id IN (
  -- Articles sharing CVEs (VERY specific)
  SELECT article_id FROM article_cves 
  WHERE cve_id IN ('CVE-2025-12345')
  
  UNION
  
  -- Articles sharing specific entities
  SELECT ae.article_id FROM article_entities ae
  JOIN entities e ON ae.entity_id = e.entity_id
  WHERE e.entity_name IN ('Citibank', 'LockBit')
    AND e.entity_type IN ('company', 'threat_actor', 'malware')
)
GROUP BY a.article_id
ORDER BY match_score DESC
LIMIT 50;

-- Returns 5-50 candidates in 10-50ms
```

**Phase 2: Calculate Similarity (In-Memory)**
```typescript
// For each of the 5-50 candidates:
const similarity = calculateWeightedSimilarity({
  // PRIMARY: Story content
  summarySimilarity: 0.70,  // Jaccard on summary text
  
  // SECONDARY: Entity validation
  cveOverlap: 0.15,         // Shared CVEs
  companyOverlap: 0.10,     // Shared companies
  
  // TERTIARY: Supporting details
  threatActorOverlap: 0.03,
  malwareOverlap: 0.02
});

// Time: 50-200ms for 5-50 candidates
```

**Phase 3: LLM Decision (Only for Borderline Cases)**
```typescript
if (similarity < 0.35) {
  return 'NEW';  // Skip LLM
}

if (similarity >= 0.35 && similarity < 0.70) {
  // Call LLM to compare summaries
  const llmDecision = await callLLM({
    newSummary: newArticle.summary,
    existingSummary: bestMatch.summary,
    question: "Are these the same story? UPDATE or NEW?"
  });
  return llmDecision;
}

if (similarity >= 0.70) {
  return 'UPDATE';  // Skip LLM
}

// LLM called for only 10-30% of articles
// Cost: $0.01-0.03 per day instead of $1-5
```

**Performance**:
- Phase 1 (SQL): 10-50ms
- Phase 2 (Similarity): 50-200ms
- Phase 3 (LLM): 500-2000ms (only for ~20% of articles)
- **Total**: 100-500ms per article on average

**Accuracy**:
- ✅ Catches exact duplicates (same entities)
- ✅ Catches updates (same entities, different details)
- ✅ Avoids false positives (different entities)
- ⚠️ May miss semantic duplicates with no shared entities (rare)

---

### Approach 3: Fingerprint Hashing (Current V1)

**Fingerprint Generation**:
```typescript
// Create deterministic hash from key entities
function generateFingerprint(article) {
  const parts = [
    ...article.entities.companies,
    ...article.entities.threat_actors,
    ...article.entities.malware,
    ...article.cves.slice(0, 1),  // First CVE only
    article.threat_type
  ];
  
  const fingerprintString = parts
    .map(s => s.toLowerCase().trim())
    .join('|');
  
  return sha256(fingerprintString);
}

// Example:
// "citibank|lockbit|ransomware|cve-2025-12345"
// → "a3f2e8b..."
```

**Usage**:
```sql
-- Direct hash lookup
SELECT * FROM articles WHERE fingerprint = ?;

-- Find similar fingerprints (requires full scan)
-- NOT USEFUL - hash changes completely with 1 entity change
```

**Pros**:
- ✅ **Exact duplicate detection** - Same entities = same hash
- ✅ **Fast lookup** - Indexed hash

**Cons**:
- ❌ **No fuzzy matching** - Adding one entity changes entire hash
- ❌ **Useless for updates** - "Citibank ransomware" ≠ "Citibank data breach"
- ❌ **Still need entity-based filtering** - Hash alone doesn't help

**Verdict**: Fingerprints are **logs/audit trails**, not duplicate detection tools.

---

## Semantic Search / Vector Embeddings

**Why NOT Use Vector Databases?**

```typescript
// Theoretical approach:
const embedding = await embedText(article.summary);
const similar = await vectorDB.search(embedding, k=50);

// Problems:
1. Security terminology doesn't embed well
   - "CVE-2025-12345" → random vector
   - "APT29" → generic vector
   - "LockBit 3.0" → no good representation

2. Paraphrasing changes embeddings too much
   - "Citibank suffered a ransomware attack"
   - "Ransomware incident impacts Citibank"
   - These get DIFFERENT embeddings despite same story

3. Generic embeddings (OpenAI, Cohere) not trained on security
   - Would need custom embeddings ($$$)
   - Still wouldn't capture entity relationships

4. Cost and complexity
   - Embeddings: $0.13/1M tokens
   - Vector DB: Maintenance, sync
   - Entity filtering: FREE (SQLite indexes)
```

**When Vector Search WOULD Work**:
- General news articles (no specialized terminology)
- Long-form content (semantic meaning emerges)
- Need conceptual similarity (not entity-based)

**Why Entity Filtering is Better Here**:
- ✅ Exact entity matches (Citibank = Citibank)
- ✅ CVE matches are deterministic
- ✅ No embedding costs
- ✅ Explainable (can show why articles matched)

---

## Recommended Approach

### Phase 1: Start with Hybrid Storage (Option C)

**Rationale**:
1. **Keep JSON blobs** - Don't break existing V2 simplicity
2. **Add entity indexes** - Enable duplicate detection
3. **Gradual migration** - Can move to full normalization later

**Implementation**:
```typescript
// 1. Save structured news (existing)
saveStructuredNews({
  pubDate: '2025-10-07',
  data: { /* full JSON */ }
});

// 2. Extract and index entities (NEW)
for (const article of publication.articles) {
  indexArticleEntities({
    articleId: article.id,
    entities: article.entities,
    cves: article.cves,
    pubDate: publication.pub_date
  });
}

// 3. Duplicate detection uses indexes
const candidates = findCandidatesByEntities({
  cves: newArticle.cves,
  entities: newArticle.entities
});

// 4. Display uses JSON blob (no JOINs)
const publication = getStructuredNews('2025-10-07');
```

**Schema Addition**:
```sql
-- Add to content-generation-v2.db

CREATE TABLE article_entity_index (
  article_id TEXT NOT NULL,
  pub_date TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  PRIMARY KEY (article_id, entity_name)
);

CREATE INDEX idx_entity_lookup ON article_entity_index(entity_name);
CREATE INDEX idx_entity_type ON article_entity_index(entity_type);
CREATE INDEX idx_pub_date ON article_entity_index(pub_date);

CREATE TABLE article_cve_index (
  article_id TEXT NOT NULL,
  pub_date TEXT NOT NULL,
  cve_id TEXT NOT NULL,
  PRIMARY KEY (article_id, cve_id)
);

CREATE INDEX idx_cve_lookup ON article_cve_index(cve_id);
CREATE INDEX idx_cve_pub_date ON article_cve_index(pub_date);
```

---

### Phase 2: Duplicate Detection Workflow

**Step 1: Extract Specific Entities (Client-Side)**
```typescript
function extractFilteringEntities(article) {
  const cves = article.cves.map(c => c.id);
  
  // ONLY specific entity types
  const specificTypes = [
    'company', 'vendor', 'product',
    'threat_actor', 'malware'
  ];
  
  const entities = article.entities
    .filter(e => specificTypes.includes(e.type))
    .map(e => e.name);
  
  // EXCLUDE generic entities:
  // - MITRE techniques (T1059, T1078, etc.)
  // - Generic terms ("ransomware", "malware")
  // - Technologies ("Windows", "Linux")
  
  return { cves, entities };
}
```

**Step 2: Query for Candidates (SQL)**
```typescript
function findCandidates(db, { cves, entities }) {
  // Articles within last 30 days sharing entities
  const sql = `
    SELECT 
      sn.pub_date,
      ai.article_id,
      COUNT(*) as match_score
    FROM structured_news sn
    JOIN article_entity_index ai ON sn.pub_date = ai.pub_date
    WHERE (
      ai.entity_name IN (${entities.map(() => '?').join(',')})
      OR ai.article_id IN (
        SELECT article_id FROM article_cve_index
        WHERE cve_id IN (${cves.map(() => '?').join(',')})
      )
    )
    AND sn.pub_date >= date('now', '-30 days')
    GROUP BY ai.article_id
    HAVING match_score >= 2
    ORDER BY match_score DESC
    LIMIT 50
  `;
  
  return db.query(sql, [...entities, ...cves]);
}
```

**Step 3: Load Full Articles from JSON**
```typescript
function loadCandidateArticles(db, candidateIds) {
  // Get unique pub_dates
  const pubDates = [...new Set(candidateIds.map(c => c.pub_date))];
  
  // Load JSON blobs
  const publications = pubDates.map(date => 
    getStructuredNews(date)
  );
  
  // Extract specific articles
  const articles = publications.flatMap(pub =>
    pub.articles.filter(a =>
      candidateIds.some(c => c.article_id === a.id)
    )
  );
  
  return articles;
}
```

**Step 4: Calculate Similarity (In-Memory)**
```typescript
function calculateSimilarity(newArticle, candidateArticle) {
  // Summary text similarity (Jaccard on 4-grams)
  const textSim = jaccardSimilarity(
    newArticle.summary,
    candidateArticle.summary
  );
  
  // Entity overlap
  const cveOverlap = jaccardSet(
    newArticle.cves.map(c => c.id),
    candidateArticle.cves.map(c => c.id)
  );
  
  const entityOverlap = jaccardSet(
    newArticle.entities.map(e => e.name),
    candidateArticle.entities.map(e => e.name)
  );
  
  // Weighted score
  const score = (
    textSim * 0.70 +
    cveOverlap * 0.15 +
    entityOverlap * 0.15
  );
  
  return score;
}
```

**Step 5: LLM Decision (Borderline Cases)**
```typescript
async function determineDuplicateAction(
  newArticle,
  bestMatch,
  similarity
) {
  if (similarity < 0.35) {
    return 'NEW';  // Different story
  }
  
  if (similarity >= 0.70) {
    return 'UPDATE';  // Clearly same story
  }
  
  // Borderline: 0.35-0.70 → Ask LLM
  const prompt = `
Compare these two article summaries and determine if they cover the same story:

NEW ARTICLE:
${newArticle.summary}

EXISTING ARTICLE:
${bestMatch.summary}

Question: Are these articles about the same underlying security incident/story?
- Answer "UPDATE" if same story with new developments
- Answer "NEW" if different stories (even if related topics)
- Answer "SKIP" if exact duplicate with no new information

Answer (UPDATE/NEW/SKIP):`;

  const result = await callVertex(prompt, {
    model: 'gemini-2.0-flash',
    temperature: 0.0,
    maxTokens: 10
  });
  
  return result.content.trim();
}
```

---

## Performance Projections

### Current V2 (No Duplicate Detection)

| Metric | Value |
|--------|-------|
| Articles/day | 10-50 |
| Storage | 1MB/day (JSON) |
| Write time | 100ms/article |
| Duplicates | Unknown |

### With Hybrid Approach

| Metric | Value | Notes |
|--------|-------|-------|
| Articles/day | 10-50 | Same |
| Candidate queries | 50ms | SQL indexed lookup |
| Similarity calc | 100ms | 5-50 candidates |
| LLM calls | 1-2s | Only 20% of articles |
| **Total per article** | **200-500ms** | vs 5-10s without indexing |
| Storage overhead | +10% | Entity index tables |
| Write time | 150ms/article | +50ms for indexing |

### Scaling to 100K Articles

| Metric | With Indexing | Without Indexing |
|--------|---------------|------------------|
| Candidate query | 50-100ms | N/A (full scan) |
| Candidates found | 5-50 | 100,000 |
| Similarity time | 100ms (50 articles) | 10+ minutes (100K articles) |
| LLM calls | 10-20/day | 1000+/day |
| **Total per new article** | **500ms** | **10-30 minutes** |

---

## Migration Path

### Immediate (Week 1)

1. ✅ Keep existing V2 JSON storage
2. ✅ Add entity index tables to `content-generation-v2.db`
3. ✅ Create indexing functions (extract entities → populate indexes)
4. ✅ Test with existing data (2025-10-07)

### Short-term (Week 2-3)

1. ✅ Implement entity-based candidate filtering
2. ✅ Add similarity calculation (Jaccard on summaries)
3. ✅ Implement LLM decision for borderline cases
4. ✅ Test duplicate detection accuracy

### Medium-term (Month 2)

1. ⏳ Add analytics queries (entity trends, CVE frequency)
2. ⏳ Optimize indexes based on query patterns
3. ⏳ Consider moving to full normalization if needed

### Long-term (Month 3+)

1. ⏳ Evaluate if full normalization (V1 style) is needed
2. ⏳ Migrate historical data if required
3. ⏳ Add advanced features (entity graphs, timeline tracking)

---

## Open Questions for Discussion

### 1. Storage Strategy

**Q**: Should we keep JSON blobs or move to full normalization?

**Options**:
- **A**: Hybrid (JSON + indexes) - RECOMMENDED
- **B**: Full normalization (14 tables like V1)
- **C**: Stay with JSON blobs only

**Trade-offs**:
- JSON = Simple, fast writes, no duplicate detection
- Hybrid = Balanced, scalable duplicate detection, some complexity
- Normalized = Full analytics, complex schema, slower writes

---

### 2. Entity Indexing Scope

**Q**: Which entity types should we index for duplicate detection?

**Current V1 Approach** (proven to work):
- ✅ CVEs (very specific)
- ✅ Companies/Vendors (specific)
- ✅ Products (specific)
- ✅ Threat actors (specific)
- ✅ Malware families (specific)
- ❌ MITRE techniques (too generic - causes false positives)
- ❌ Technologies (too generic)

**Should we follow this exactly?**

---

### 3. Similarity Thresholds

**Q**: What similarity thresholds should trigger each action?

**Current V1 Thresholds**:
```typescript
if (similarity < 0.35) → NEW (skip LLM)
if (0.35 <= similarity < 0.70) → LLM decides
if (similarity >= 0.70) → UPDATE (skip LLM)
```

**Questions**:
- Are these thresholds optimal?
- Should we have different thresholds for different categories?
- How do we tune without labeled training data?

---

### 4. LLM Usage Strategy

**Q**: When should we call the LLM vs use algorithmic decision?

**Options**:
- **A**: Always call LLM (most accurate, expensive)
- **B**: Only borderline cases 0.35-0.70 (V1 approach)
- **C**: Never call LLM (fast, may miss edge cases)

**Cost Analysis**:
- 50 articles/day × $0.02/LLM call = $1/day = $365/year
- With filtering: 10 LLM calls/day × $0.02 = $0.20/day = $73/year

---

### 5. Historical Data Handling

**Q**: How do we handle articles from V2 that don't have entity indexes?

**Options**:
- **A**: Backfill indexes for existing dates
- **B**: Only index new articles going forward
- **C**: Regenerate structured output with indexing

**Trade-offs**:
- Backfill = Consistent, no regeneration cost
- Index new only = Simple, historical data less searchable
- Regenerate = Most accurate, costs ~$0.11/date

---

### 6. Window for Duplicate Checking

**Q**: How far back should we check for duplicates?

**Current V1**: 30 days

**Considerations**:
- Security stories can have long tails (vulnerabilities, breaches)
- Checking 30 days = ~1500 articles to filter
- Checking 90 days = ~4500 articles to filter
- Entity-based filtering handles both efficiently

**Recommendation**: Start with 30 days, extend to 90 if needed.

---

## Next Steps

### Before Writing Code

1. **Review this document** - Discuss strategy options
2. **Decide on storage approach** - Hybrid vs full normalization
3. **Confirm entity types** - Which to index
4. **Set thresholds** - Similarity scoring weights
5. **Define LLM usage** - When to call, when to skip

### Implementation Order

1. **Schema updates** - Add index tables to V2 database
2. **Indexing functions** - Extract and populate entity indexes
3. **Candidate filtering** - SQL query optimization
4. **Similarity calculation** - Port from V1 or simplify
5. **LLM integration** - Borderline case handling
6. **Testing** - Validate with existing data
7. **Metrics** - Track accuracy, performance, costs

---

## References

**Existing Code**:
- `scripts/content-generation/lib/fingerprint.ts` - V1 similarity logic
- `scripts/content-generation/cli/filter-articles-entity.ts` - V1 entity filtering
- `scripts/content-generation/lib/db-client.ts` - V1 database queries
- `scripts/db/schema.sql` - V1 normalized schema

**Documentation**:
- `ARCHITECTURE-DECISIONS.md` - Entity-based pipeline design
- `PHASE-1-COMPLETE.md` - V1 database setup
- `scripts/content-generation-v2/LLM.md` - V2 architecture

---

**Status**: 🔴 AWAITING DECISIONS - No code changes until strategy confirmed.
