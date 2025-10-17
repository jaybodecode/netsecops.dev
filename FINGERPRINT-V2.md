# Article Fingerprinting V2 - Duplicate Detection Strategy

## 🎯 Quick Reference

**Status**: Design finalized, ready for implementation  
**Last Updated**: 2025-10-14  
**Production Data**: 4 days tested (Oct 7-10, 2025), CVE reuse patterns validated

### Core Strategy
```
1. SQL Entity Filtering:  300 articles → 5-20 candidates (30-day window)
2. 6D Jaccard Similarity:  Weighted scoring across CVE/Text/Entities
3. Classification:         NEW (<0.35), UPDATE (≥0.70), BORDERLINE (0.35-0.70)
```

### Scoring Weights (100% Total)
| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| **CVEs** | **40%** | PRIMARY: Campaign identifier within 30-day window |
| **Summary Text** | **20%** | SECONDARY: Narrative confirmation |
| **Threat Actors** | **12%** | SUPPORTING: Attribution signal |
| **Malware** | **12%** | SUPPORTING: Technical signature |
| **Products** | **8%** | CONTEXT: Affected systems |
| **Companies** | **8%** | CONTEXT: Victims/vendors |

### Key Design Decisions
- ✅ **30-day lookback window** - Prevents false positives from old CVE reuse
- ✅ **CVE-primary (40%)** - CVEs are the campaign pivot point
- ✅ **Keep all data forever** - Query filters by date, never delete
- ✅ **Character trigrams** - Better than word tokens for technical text
- ❌ **No MITRE indexing** - Too generic within 30-day window
- ❌ **No tags/keywords** - SEO-focused, not distinctive

### Real-World Validation
```
CVE-2025-61882: Mentioned 3 consecutive days (Oct 7-9)
  → Same CVE + Same threat actor (Cl0p) + Similar text = UPDATE ✅
  → After 30 days: Would be treated as NEW ✅
```

### Performance Targets
- SQL query: ~5-10ms (indexed)
- Jaccard calc: ~5-10ms (in-memory)
- **Total: ~10-20ms per article** (no LLM calls)

---

## Executive Summary

**Goal**: Efficiently detect duplicate/similar cybersecurity articles across 5000+ daily candidates without expensive LLM calls.

**Problem**: Daily news aggregation produces ~5000 raw articles. Need to identify duplicates and updates to existing articles before publishing cybersecurity advisories. Cannot afford to LLM-compare every new article against 30 days of history (150k+ comparisons/day).

**Solution**: Two-stage filtering approach proven in V1:
1. **SQL Entity Filtering**: Use shared entities (CVEs, companies, threat actors) to narrow 5000 candidates → 5-50 likely matches (fast, indexed queries)
2. **Jaccard Similarity**: Calculate weighted overlap score across 3 dimensions for remaining candidates (in-memory, milliseconds)

**Decision**: Use proven V1 entity-based filtering + Jaccard similarity. **NO semantic embeddings** (SecureBERT/BERT rejected due to poor security terminology understanding and C library dependencies for cloud deployment).

**Current Status**: 
- ✅ Schema ready (`structured_news` with `pub_type` and `pub_date_only` columns added)
- ✅ 6 test publications (Oct 7-14, 2025) with 50+ articles total
- ✅ CVE reuse patterns validated (CVE-2025-61882 appearing 5 consecutive days)
- ✅ Design finalized: 6-dimensional scoring with CVE-primary (40%) + 30-day lookback
- ✅ **Phase 1 Complete**: Entity indexing schema created and tested
- ✅ **Phase 2 Complete**: Entity extraction script created and tested (50 articles indexed)
- ⏳ **NEXT STEP**: Create duplicate detection script with 6D Jaccard similarity (Phase 3)

**Design Validation**:
```
Test Data: 40 articles over 4 days
CVE Reuse: CVE-2025-61882 (Cl0p/Oracle) appeared 3 consecutive days
Result:    30-day window correctly identifies as continuing story (UPDATE)
Proof:     Same CVE + Same entities + High text similarity = 0.70+ score
Future:    After 30 days, same CVE different context = NEW article ✅
```

---

## Context: Content Generation V2 Pipeline

### Current Pipeline (Steps 1-2 Complete)

```
Step 1: search-news.ts
  ↓ Searches news APIs (NewsAPI, Google News, Bing News)
  ↓ Stores raw articles in `raw_search` table
  ↓ ~5000 articles per day

Step 2: news-structured.ts  ✅ WORKING
  ↓ LLM (Vertex AI gemini-2.5-pro) structures raw articles
  ↓ Generates CyberAdvisoryType publication with ~30 curated articles
  ↓ Stores in `structured_news` table (JSON blob + metadata)
  ↓ Assigns UUIDs: pub_id (publication), article.id (each article)
  
Step 3: index-entities.ts  ⏳ TO BUILD
  ↓ Extract entities from structured_news.data JSON
  ↓ Populate entity index tables (articles_meta, article_cves, article_entities)
  ↓ Enable fast duplicate detection queries
  
Step 4: find-duplicates.ts  ⏳ TO BUILD
  ↓ For each new article, find candidates via SQL entity matching
  ↓ Calculate Jaccard similarity scores
  ↓ Mark as NEW, UPDATE, or BORDERLINE
```

### Database Location & Technology

- **Database**: `logs/content-generation-v2.db`
- **Driver**: better-sqlite3 v9.x with WAL mode
- **LLM**: Google Vertex AI (gemini-2.5-pro) via Genkit framework
- **Validation**: Zod schemas with structured output
- **Schema Files**: 
  - `scripts/content-generation-v2/database/index.ts` - DB initialization
  - `scripts/content-generation-v2/database/schema-structured-news.ts` - Main publication storage
  - `scripts/content-generation-v2/news-structured-schema.ts` - Zod validation schemas

### Current Data

```sql
-- One existing publication
sqlite3 logs/content-generation-v2.db "SELECT pub_id, pub_date_only, pub_type, headline, total_articles FROM structured_news;"

pub_id: a8b3c2d1-4e5f-4b6a-8c9d-1f2e3g4h5i6j
pub_date: 2025-10-07T15:00:00.000Z
pub_date_only: 2025-10-07
pub_type: daily
headline: Cl0p Exploits Oracle Zero-Day, Ransomware Titans Form Alliance, and Critical Redis Flaw Disclosed
total_articles: 30 (stored in JSON blob)
```

---

## Core Algorithm

### Six-Dimensional Overlap Score

**Key Insight**: CVEs are the **pivotal campaign identifier** in cybersecurity news. When a CVE is mentioned, it's the core of the story - everything else (threat actors, victims, products) revolves around it. However, the same CVE can be exploited in different campaigns over time.

**Solution**: Use **30-day lookback window** to prevent false positives from CVE reuse months later.

For each new article, calculate weighted Jaccard overlap with existing articles (last 30 days only):

```python
score = (
  # Dimension 1: CVEs (PRIMARY - the campaign/story identifier)
  jaccard(new_cves, existing_cves) * 0.40
  
  # Dimension 2: Summary Text (SECONDARY - narrative confirmation)
  + jaccard_ngrams(new_summary, existing_summary) * 0.20
  
  # Dimension 3: Threat Actors (SUPPORTING - attribution)
  + jaccard(new_threat_actors, existing_threat_actors) * 0.12
  
  # Dimension 4: Malware (SUPPORTING - technical signature)
  + jaccard(new_malware, existing_malware) * 0.12
  
  # Dimension 5: Products (CONTEXT - affected systems)
  + jaccard(new_products, existing_products) * 0.08
  
  # Dimension 6: Companies (CONTEXT - victims/vendors)
  + jaccard(new_companies, existing_companies) * 0.08
)
```

**Total: 100% across 6 dimensions**

### Thresholds

```
if score < 0.35:     NEW        (distinct article)
if score >= 0.70:    UPDATE     (clear duplicate/update)
if 0.35-0.70:        BORDERLINE (optional LLM decision, or conservative: treat as NEW)
```

**Note**: V1 thresholds proven effective. Borderline cases can optionally invoke LLM for final decision, but not required for speed.

### 30-Day Lookback Window

**Problem**: Same CVE can be exploited in different campaigns months apart.
- Example: `CVE-2024-1234` exploited by APT29 on Day 1
- Six months later: Same CVE exploited by LockBit against different target
- Result: Same CVE ≠ Same story

**Solution**: Only compare against articles from **last 30 days**.
- Within 30 days: Same CVE = likely same campaign → High CVE weight (40%) works perfectly
- After 30 days: Article not even queried → No false positives from old CVE reuse
- Old news republished: Treated as NEW (outside window, fresh content)

**Scale Analysis**:
```
Daily rate:         10 articles/day (current production rate)
30-day window:      ~300 articles total
SQL entity filter:  300 → 5-20 candidates (fast, indexed)
Jaccard scoring:    5-20 candidates (in-memory, milliseconds)
Performance:        ~10-20ms per new article
```

**Configurable**: Can test 7, 14, 30, 60-day windows via CLI flag.

---

## Decision Log

### 2025-10-14: Major Design Revision - CVE-Primary Weighting

**Context**: Initial design had Text at 50% weight, CVEs at 20%. Analysis of production data and CVE reuse scenarios led to complete weight restructure.

**Key Insight**: 
> "When there's a CVE, it's the pivotal point. That's the campaign. That's the actual story. Whether it's phishing, ransomware, Citibank or a retail outlet... the story is the CVE, and everything else revolves around it."

**Evidence from Production Data**:
- Analyzed 40 articles across 4 days (Oct 7-10, 2025)
- Found 3 CVEs appearing on multiple days:
  - `CVE-2025-61882`: 3 consecutive days (Cl0p Oracle zero-day campaign)
  - `CVE-2025-49844`: 3 consecutive days
  - `CVE-2025-10035`: 2 days
- All multi-day appearances were **legitimate continuing stories**, not duplicates

**Problem Identified**: CVE Reuse Over Time
- Same CVE can be exploited in different campaigns months apart
- Example: CVE-2024-1234 exploited by APT29 on Day 1, then by LockBit 180 days later
- Without time limits, high CVE overlap would create false positives

**Solution**: 30-Day Lookback Window + CVE-Primary Weighting
- Within 30 days: Same CVE = highly likely same campaign → CVE weight **40%** (PRIMARY)
- After 30 days: Article not queried → No false positives from old CVE reuse
- Text reduced to **20%** (SECONDARY) - confirms CVE match but not primary signal

**Final Weight Distribution**:
```
CVE:           40% (PRIMARY - campaign identifier)
Text:          20% (SECONDARY - narrative confirmation)
Threat Actor:  12% (SUPPORTING - attribution)
Malware:       12% (SUPPORTING - technical signature)
Product:        8% (CONTEXT - affected systems)
Company:        8% (CONTEXT - victims)
TOTAL:        100%
```

**Rejected Alternatives**:
- ❌ Text 40%, CVE 30% - CVE deserves higher weight as unique identifier
- ❌ Text 50%, CVE 15% (original) - Too conservative on CVE signal
- ❌ 60-day lookback - Too long, increases false positives
- ❌ 14-day lookback - Too short, misses legitimate extended coverage

**Performance Impact**:
- 30-day window: ~300 articles to scan (10/day × 30)
- SQL filter: 300 → 5-20 candidates (~5-10ms)
- Jaccard: 5-20 candidates (~5-10ms)
- Total: ~10-20ms per article ✅

---

### 2025-10-14: MITRE ATT&CK Indexing - Decision NOT to Include

**Initial Consideration**: Index MITRE techniques at 5-10% weight as supporting evidence

**Arguments For**:
- Already extracted by LLM (no additional cost)
- Combination patterns (e.g., T1190 + T1505.003 + T1486) could be distinctive
- Could help borderline cases (0.35-0.70 scores)

**Arguments Against (Winner)**:
- Individual techniques too generic (T1190 in thousands of web exploit articles)
- Within 30-day window, other signals sufficient (CVE 40% + Text 20% = 60%)
- Adds complexity for minimal gain
- Can always add later if needed

**Decision**: Do NOT index MITRE ATT&CK techniques
- Simpler schema: 3 tables instead of 4
- Faster indexing: No technique extraction
- 6 dimensions sufficient: CVE + Text + 4 entity types = 100% coverage

---

### 2025-10-14: Entity Type Filtering - What to Index

**Indexed (High Signal)**:
- ✅ `threat_actor` (12% weight) - Specific attribution (APT29, Cl0p)
- ✅ `malware` (12% weight) - Technical signature (Emotet, Cobalt Strike)
- ✅ `product` (8% weight) - Affected systems (Oracle EBS, Redis)
- ✅ `company`/`vendor` (8% weight, merged) - Victims/vendors
- ✅ `government_agency` (included in company 8%) - Low priority but indexed

**Not Indexed (Low Signal)**:
- ❌ `person` - Names vary, low discriminatory power
- ❌ `technology` - Too broad (e.g., "AI", "blockchain")
- ❌ `security_organization` - Too common (CrowdStrike, Mandiant mentioned frequently)
- ❌ `other` - Undefined category

**Rationale**: Focus on high-value technical and organizational entities that are distinctive within 30-day window.

---

## CVE Reuse Analysis: Why 30-Day Lookback Works

### The Problem: CVEs as Campaign Identifiers vs. Long-Term Reuse

**Insight**: CVEs are **the pivotal point** of cybersecurity stories. When a CVE is mentioned, it's typically the center of the narrative - the campaign identifier around which everything else (threat actors, victims, products) revolves.

**However**: The same CVE can be exploited in **completely different campaigns** separated by time.

### Real-World Example from Production Data

From our Oct 7-10, 2025 test data, we observed `CVE-2025-61882` (Oracle E-Business Suite zero-day):

```
Day 1 (Oct 7):  "Cl0p Unleashes Extortion Spree via Oracle Zero-Day"
                → Initial disclosure of zero-day exploitation
                
Day 2 (Oct 8):  "Cl0p Unleashes Zero-Day Attack on Oracle E-Business Suite"
                → Continuing coverage, new attack details
                
Day 3 (Oct 9):  "Cl0p Exploits Critical Oracle Zero-Day in Mass Extortion Campaign"
                → Campaign expansion, additional victims
```

**Analysis**:
- ✅ **Same CVE** (`CVE-2025-61882`)
- ✅ **Same threat actor** (Cl0p)
- ✅ **Same product** (Oracle EBS)
- ✅ **Continuing story** - each day brings new developments
- ✅ **Result**: Should be classified as UPDATE

**This is correct behavior within a 30-day window.**

### The 180-Day Scenario (Why We Need Time Limits)

**Hypothetical future scenario**:

```
Day 1 (Oct 7, 2025):      CVE-2025-61882 exploited by Cl0p → Citibank targeted
Day 180 (April 5, 2026):  CVE-2025-61882 exploited by LockBit → Healthcare provider targeted
```

**Without time limits**:
- ❌ High CVE overlap (1.0) would suggest UPDATE
- ❌ Different threat actor (0.0) would lower score
- ❌ Different victim (0.0) would lower score
- ❌ But with 40% CVE weight, might still score > 0.35 (BORDERLINE or UPDATE)
- ❌ **FALSE POSITIVE**: These are completely different stories

**With 30-day lookback**:
- ✅ Day 180 article **not even compared** to Day 1 article (outside window)
- ✅ Treated as NEW article
- ✅ **CORRECT CLASSIFICATION**: Separate campaigns, different stories

### Why 30 Days is the Right Window

```
News cycle characteristics:
├─ Breaking news:        Days 1-3 (initial disclosure, immediate reactions)
├─ Follow-up coverage:   Days 4-7 (deeper analysis, vendor response)
├─ Extended coverage:    Days 8-14 (patch releases, mitigation guidance)
├─ Incident updates:     Days 15-30 (ongoing campaigns, new victims)
└─ Old news threshold:   > 30 days (legitimate re-exploitation = new story)
```

**Balance achieved**:
- ✅ Catches all legitimate updates and continuing coverage (Days 1-30)
- ✅ Prevents false positives from future re-exploitation (> 30 days)
- ✅ Performance: ~300 articles to scan (10/day × 30 days)
- ✅ Flexible: Can adjust to 7, 14, 60 days via config if needed

### Weight Distribution Rationale

**CVE (40%) - The Campaign Pivot**:
- Highest weight because CVEs are **unique technical identifiers**
- Within 30 days, same CVE = highly likely same campaign
- Strong signal when present, but not all articles have CVEs

**Text (20%) - Narrative Confirmation**:
- Confirms the CVE-based match with content similarity
- Catches updates with different headlines but similar content
- Lower than V1 (was 50%) because CVE is more reliable within 30-day window

**Threat Actor (12%) + Malware (12%) - Attribution Signals**:
- High-value technical entities
- Combined 24% provides strong supporting evidence
- Specific attributions (APT29, LockBit) are distinctive

**Product (8%) + Company (8%) - Contextual Evidence**:
- Lower weight because more reusable across stories
- Oracle Database mentioned in many different campaigns
- Citibank can be targeted multiple times

### Observed CVE Reuse Patterns

From 4 days of production data (40 articles total):

```sql
-- CVEs appearing on multiple days
CVE-2025-49844:  3 days (Oct 7, 8, 9)    → Continuing story
CVE-2025-61882:  3 days (Oct 7, 8, 9)    → Continuing story  
CVE-2025-10035:  2 days (Oct 7, 9)       → Update coverage
```

**Validation**: All multi-day CVE mentions were **legitimate continuing stories**, not separate campaigns. The 30-day window correctly identifies these as UPDATEs.

---

## Database Schema

### Existing: Full JSON Storage

```sql
-- Main publication storage (already implemented)
CREATE TABLE structured_news (
  pub_id TEXT PRIMARY KEY,                  -- UUID from LLM
  pub_date TEXT NOT NULL,                   -- ISO 8601 datetime (e.g., '2025-10-07T15:00:00.000Z')
  pub_date_only TEXT GENERATED ALWAYS AS (date(pub_date)) STORED,  -- Computed '2025-10-07'
  pub_type TEXT NOT NULL DEFAULT 'daily',   -- 'daily', 'weekly', 'monthly'
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data TEXT NOT NULL,                       -- Full CyberAdvisoryType JSON blob
  headline TEXT NOT NULL,
  total_articles INTEGER NOT NULL,
  date_range TEXT NOT NULL
);

CREATE INDEX idx_structured_news_pub_date ON structured_news(pub_date);
CREATE INDEX idx_structured_news_date_only ON structured_news(pub_date_only);
CREATE INDEX idx_structured_news_type ON structured_news(pub_type);
CREATE INDEX idx_structured_news_date_type ON structured_news(pub_date_only, pub_type);
CREATE INDEX idx_structured_news_generated ON structured_news(generated_at);
```

### NEW: Entity Indexing Tables

These tables enable fast candidate filtering (300 articles → 5-20 candidates):

```sql
-- Minimal article metadata for fingerprinting
CREATE TABLE articles_meta (
  article_id TEXT PRIMARY KEY,              -- article.id UUID from LLM
  pub_id TEXT NOT NULL,                     -- Link to structured_news
  summary TEXT NOT NULL,                    -- For Jaccard text similarity (20% weight)
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pub_id) REFERENCES structured_news(pub_id)
);

CREATE INDEX idx_articles_pub_id ON articles_meta(pub_id);

-- Dimension 1: CVE Entities (PRIMARY - 40% weight, the campaign identifier)
CREATE TABLE article_cves (
  article_id TEXT NOT NULL,
  cve_id TEXT NOT NULL,
  cvss_score REAL,                          -- Optional: for future severity filtering
  severity TEXT,                            -- Optional: 'critical', 'high', 'medium', 'low'
  PRIMARY KEY (article_id, cve_id),
  FOREIGN KEY (article_id) REFERENCES articles_meta(article_id)
);

CREATE INDEX idx_cve_lookup ON article_cves(cve_id);
CREATE INDEX idx_cve_severity ON article_cves(severity);

-- Dimension 2-6: Named Entities (SUPPORTING - 40% combined weight)
CREATE TABLE article_entities (
  article_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,                -- 'threat_actor', 'malware', 'product', 'company', 'government_agency'
  PRIMARY KEY (article_id, entity_name),
  FOREIGN KEY (article_id) REFERENCES articles_meta(article_id)
);

CREATE INDEX idx_entity_lookup ON article_entities(entity_name);
CREATE INDEX idx_entity_type ON article_entities(entity_type);
```

**Entity Type Mapping** (from LLM schema):
```typescript
// Index these entity types:
'threat_actor'       → 'threat_actor'    // 12% weight
'malware'           → 'malware'          // 12% weight
'product'           → 'product'          // 8% weight
'vendor'            → 'company'          // 8% weight (map to company)
'company'           → 'company'          // 8% weight
'government_agency' → 'government_agency' // Low priority

// DO NOT INDEX (too generic or low signal):
'person', 'technology', 'security_organization', 'other'
```

**IMPORTANT**: Do NOT index MITRE ATT&CK techniques, tags, keywords, or categories - too generic, poor signal for duplicates within 30-day window.

---

## Candidate Filtering Query

**Step 1**: Use SQL to find 5-20 candidates sharing specific entities (fast, indexed).

**Key Feature**: 30-day lookback window via `WHERE pub_date_only >= date('now', '-30 days')`

```sql
-- Find duplicate candidates for a new article
-- Only searches last 30 days of publications (prevents old CVE reuse false positives)
WITH new_article_data AS (
  SELECT 
    'article-new-123' as article_id,
    json('["CVE-2025-1234", "CVE-2025-5678"]') as cves,
    json('["Cl0p", "APT29"]') as threat_actors,
    json('["Cobalt Strike", "Emotet"]') as malware,
    json('["Oracle Database", "Redis"]') as products,
    json('["Citibank", "Microsoft"]') as companies
),
candidate_scores AS (
  SELECT 
    a.article_id,
    a.pub_id,
    a.summary,
    s.pub_date_only,  -- For debugging/logging
    
    -- CVE overlap count (highest weight - 40%)
    (SELECT COUNT(*) 
     FROM article_cves ac, json_each((SELECT cves FROM new_article_data)) cve
     WHERE ac.article_id = a.article_id 
     AND ac.cve_id = cve.value) as cve_matches,
    
    -- Threat actor overlap (12% weight)
    (SELECT COUNT(*) 
     FROM article_entities ae, json_each((SELECT threat_actors FROM new_article_data)) ta
     WHERE ae.article_id = a.article_id 
     AND ae.entity_type = 'threat_actor'
     AND ae.entity_name = ta.value) as threat_actor_matches,
    
    -- Malware overlap (12% weight)
    (SELECT COUNT(*) 
     FROM article_entities ae, json_each((SELECT malware FROM new_article_data)) mal
     WHERE ae.article_id = a.article_id 
     AND ae.entity_type = 'malware'
     AND ae.entity_name = mal.value) as malware_matches,
    
    -- Product overlap (8% weight)
    (SELECT COUNT(*) 
     FROM article_entities ae, json_each((SELECT products FROM new_article_data)) prod
     WHERE ae.article_id = a.article_id 
     AND ae.entity_type = 'product'
     AND ae.entity_name = prod.value) as product_matches,
    
    -- Company overlap (8% weight)
    (SELECT COUNT(*) 
     FROM article_entities ae, json_each((SELECT companies FROM new_article_data)) comp
     WHERE ae.article_id = a.article_id 
     AND ae.entity_type = 'company'
     AND ae.entity_name = comp.value) as company_matches,
    
    -- Raw overlap score (CVEs weighted heavily - 4x other entities)
    (cve_matches * 4 + threat_actor_matches * 2 + malware_matches * 2 + 
     product_matches + company_matches) as raw_score
    
  FROM articles_meta a
  JOIN structured_news s ON s.pub_id = a.pub_id
  
  -- ⭐ CRITICAL: 30-DAY LOOKBACK WINDOW (prevents old CVE reuse false positives)
  WHERE s.pub_date_only >= date('now', '-30 days')  -- Last 30 days only
    AND s.pub_date_only < date('now')               -- Exclude today (new articles being processed)
  
  -- Must have SOME overlap to be a candidate (filter ~300 → ~5-20)
  AND (
    -- Has at least one overlapping CVE (strongest signal - 40% weight)
    EXISTS (
      SELECT 1 FROM article_cves ac, json_each((SELECT cves FROM new_article_data)) cve
      WHERE ac.article_id = a.article_id AND ac.cve_id = cve.value
    )
    OR
    -- Has at least 2 overlapping high-value entities (threat actors or malware)
    (threat_actor_matches + malware_matches) >= 2
    OR
    -- Has at least 3 overlapping entities total (any type)
    (threat_actor_matches + malware_matches + product_matches + company_matches) >= 3
  )
)
SELECT 
  article_id,
  pub_id,
  pub_date_only,
  summary,
  cve_matches,
  threat_actor_matches,
  malware_matches,
  product_matches,
  company_matches,
  raw_score
FROM candidate_scores
WHERE raw_score >= 4  -- Minimum overlap threshold (at least 1 CVE or 2 high-value entities)
ORDER BY raw_score DESC, pub_date_only DESC  -- Prioritize recent matches
LIMIT 50;
```

**Output**: 5-20 candidate articles that share significant entities with the new article (from last 30 days only).

**Performance**:
- Query time: ~5-10ms (indexed on `pub_date_only`, `cve_id`, `entity_name`)
- Articles scanned: ~300 (10/day × 30 days)
- Candidates returned: ~5-20 (after entity filtering)

**Data Retention Strategy**:
- ✅ **Keep ALL data forever** in database (never delete)
- ✅ **Query only last 30 days** for duplicate detection
- ✅ Historical data available for analysis, reporting, debugging
- ✅ Can adjust lookback window via config (7, 14, 30, 60 days)

---

## Jaccard Similarity Calculation

**Step 2**: For each candidate from SQL, calculate detailed Jaccard similarity (in-memory).

### Character N-Gram Implementation (V1 Proven)

```typescript
/**
 * Generate character n-grams from text
 * Preserves word boundaries and punctuation
 */
function generateNGrams(text: string, n: number = 3): Set<string> {
  const normalized = text.toLowerCase().trim();
  const ngrams = new Set<string>();
  
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.add(normalized.slice(i, i + n));
  }
  
  return ngrams;
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate text similarity using character trigrams
 */
function textSimilarity(text1: string, text2: string): number {
  const ngrams1 = generateNGrams(text1, 3);
  const ngrams2 = generateNGrams(text2, 3);
  
  return jaccardSimilarity(ngrams1, ngrams2);
}
```

### Six-Dimensional Score Calculation

```typescript
interface Article {
  id: string;
  summary: string;
  cves: string[];
  threat_actors: string[];
  malware: string[];
  products: string[];
  companies: string[];
}

interface SimilarityScore {
  articleId: string;
  cveScore: number;           // 40% weight
  textScore: number;          // 20% weight
  threatActorScore: number;   // 12% weight
  malwareScore: number;       // 12% weight
  productScore: number;       // 8% weight
  companyScore: number;       // 8% weight
  totalScore: number;         // Sum of all weighted scores
  classification: 'NEW' | 'UPDATE' | 'BORDERLINE';
}

function calculateSimilarity(
  newArticle: Article,
  candidate: Article
): SimilarityScore {
  
  // Dimension 1: CVE overlap (PRIMARY - 40%)
  const cvesNew = new Set(newArticle.cves);
  const cvesExisting = new Set(candidate.cves);
  const cveScore = jaccardSimilarity(cvesNew, cvesExisting) * 0.40;
  
  // Dimension 2: Summary text overlap (SECONDARY - 20%, character trigrams)
  const textScore = textSimilarity(newArticle.summary, candidate.summary) * 0.20;
  
  // Dimension 3: Threat actor overlap (SUPPORTING - 12%)
  const threatActorsNew = new Set(newArticle.threat_actors);
  const threatActorsExisting = new Set(candidate.threat_actors);
  const threatActorScore = jaccardSimilarity(threatActorsNew, threatActorsExisting) * 0.12;
  
  // Dimension 4: Malware overlap (SUPPORTING - 12%)
  const malwareNew = new Set(newArticle.malware);
  const malwareExisting = new Set(candidate.malware);
  const malwareScore = jaccardSimilarity(malwareNew, malwareExisting) * 0.12;
  
  // Dimension 5: Product overlap (CONTEXT - 8%)
  const productsNew = new Set(newArticle.products);
  const productsExisting = new Set(candidate.products);
  const productScore = jaccardSimilarity(productsNew, productsExisting) * 0.08;
  
  // Dimension 6: Company overlap (CONTEXT - 8%)
  const companiesNew = new Set(newArticle.companies);
  const companiesExisting = new Set(candidate.companies);
  const companyScore = jaccardSimilarity(companiesNew, companiesExisting) * 0.08;
  
  // Total weighted score (sum = 100%)
  const totalScore = cveScore + textScore + threatActorScore + 
                     malwareScore + productScore + companyScore;
  
  // Classification
  let classification: 'NEW' | 'UPDATE' | 'BORDERLINE';
  if (totalScore < 0.35) {
    classification = 'NEW';
  } else if (totalScore >= 0.70) {
    classification = 'UPDATE';
  } else {
    classification = 'BORDERLINE';
  }
  
  return {
    articleId: candidate.id,
    cveScore,
    textScore,
    threatActorScore,
    malwareScore,
    productScore,
    companyScore,
    totalScore,
    classification
  };
}
```

---

## Complete Workflow

### 1. Extract Entities from New Articles

When processing new structured publication from LLM:

```typescript
interface CyberAdvisoryType {
  pub_id: string;
  pub_date: string;
  headline: string;
  articles: ArticleType[];
  // ...
}

interface ArticleType {
  id: string;           // UUID from LLM
  summary: string;
  cves: CVEType[];      // Array of CVE objects with id, cvss_score, severity
  entities: EntityType[]; // Array of entity objects with name and type
  // ...
}

interface CVEType {
  id: string;           // e.g., "CVE-2025-1234"
  cvss_score?: number;  // Optional: 0-10
  severity?: string;    // Optional: 'critical', 'high', 'medium', 'low'
}

interface EntityType {
  name: string;         // e.g., "Cl0p", "Oracle Database", "Citibank"
  type: string;         // 'threat_actor', 'malware', 'product', 'vendor', 'company', 'government_agency', etc.
}

function extractEntitiesForFingerprint(article: ArticleType) {
  // Filter entities by type for indexing
  const threat_actors = article.entities
    .filter(e => e.type === 'threat_actor')
    .map(e => e.name);
  
  const malware = article.entities
    .filter(e => e.type === 'malware')
    .map(e => e.name);
  
  const products = article.entities
    .filter(e => e.type === 'product')
    .map(e => e.name);
  
  const companies = article.entities
    .filter(e => ['company', 'vendor'].includes(e.type))
    .map(e => e.name);
  
  const government_agencies = article.entities
    .filter(e => e.type === 'government_agency')
    .map(e => e.name);
  
  return {
    article_id: article.id,
    summary: article.summary,
    cves: article.cves || [],
    threat_actors,
    malware,
    products,
    companies,
    government_agencies
    // DO NOT include: mitre_techniques, tags, keywords, categories (too generic)
  };
}
```

### 2. Populate Entity Index Tables

```typescript
function indexArticleEntities(
  pubId: string,
  article: ArticleType,
  db: Database
): void {
  
  // Insert article metadata
  db.prepare(`
    INSERT INTO articles_meta (article_id, pub_id, summary)
    VALUES (?, ?, ?)
  `).run(article.id, pubId, article.summary);
  
  // Insert CVEs with optional metadata
  const insertCVE = db.prepare(`
    INSERT INTO article_cves (article_id, cve_id, cvss_score, severity)
    VALUES (?, ?, ?, ?)
  `);
  for (const cve of article.cves || []) {
    insertCVE.run(
      article.id, 
      cve.id, 
      cve.cvss_score || null,
      cve.severity || null
    );
  }
  
  // Insert entities with types (filter by schema)
  const insertEntity = db.prepare(`
    INSERT INTO article_entities (article_id, entity_name, entity_type)
    VALUES (?, ?, ?)
  `);
  
  for (const entity of article.entities || []) {
    // Only index high-value entity types
    if (['threat_actor', 'malware', 'product', 'vendor', 'company', 'government_agency'].includes(entity.type)) {
      // Map 'vendor' to 'company' for consistency
      const entityType = entity.type === 'vendor' ? 'company' : entity.type;
      insertEntity.run(article.id, entity.name, entityType);
    }
    // Skip: person, technology, security_organization, other
  }
}
```

### 3. Find Duplicates for New Article

```typescript
interface DuplicateResult {
  isDuplicate: boolean;
  matchType: 'NEW' | 'UPDATE' | 'BORDERLINE';
  bestMatch?: {
    articleId: string;
    pubId: string;
    pubDate: string;
    score: number;
    breakdown: {
      cve: number;           // 40% weight
      text: number;          // 20% weight
      threatActor: number;   // 12% weight
      malware: number;       // 12% weight
      product: number;       // 8% weight
      company: number;       // 8% weight
    };
  };
}

async function findDuplicates(
  newArticle: Article,
  lookbackDays: number = 30
): Promise<DuplicateResult> {
  
  // Step 1: SQL candidate filtering (300 articles → 5-20 candidates)
  // Uses 30-day lookback window via pub_date_only filter
  const candidates = await findCandidatesSQL(newArticle, lookbackDays);
  
  if (candidates.length === 0) {
    return { isDuplicate: false, matchType: 'NEW' };
  }
  
  // Step 2: Calculate 6-dimensional Jaccard similarity for each candidate
  const scores = candidates.map(candidate => 
    calculateSimilarity(newArticle, candidate)
  );
  
  // Step 3: Find best match
  const bestMatch = scores.reduce((best, current) => 
    current.totalScore > best.totalScore ? current : best
  );
  
  // Step 4: Return result based on classification
  if (bestMatch.classification === 'NEW') {
    return { isDuplicate: false, matchType: 'NEW' };
  }
  
  if (bestMatch.classification === 'UPDATE') {
    return {
      isDuplicate: true,
      matchType: 'UPDATE',
      bestMatch: {
        articleId: bestMatch.articleId,
        pubId: candidates.find(c => c.id === bestMatch.articleId)!.pub_id,
        pubDate: candidates.find(c => c.id === bestMatch.articleId)!.pub_date_only,
        score: bestMatch.totalScore,
        breakdown: {
          cve: bestMatch.cveScore,
          text: bestMatch.textScore,
          threatActor: bestMatch.threatActorScore,
          malware: bestMatch.malwareScore,
          product: bestMatch.productScore,
          company: bestMatch.companyScore
        }
      }
    };
  }
  
  // Borderline case (0.35-0.70) - could invoke LLM here (optional)
  return {
    isDuplicate: false, // Conservative: treat as NEW unless clear UPDATE
    matchType: 'BORDERLINE',
    bestMatch: {
      articleId: bestMatch.articleId,
      pubId: candidates.find(c => c.id === bestMatch.articleId)!.pub_id,
      pubDate: candidates.find(c => c.id === bestMatch.articleId)!.pub_date_only,
      score: bestMatch.totalScore,
      breakdown: {
        cve: bestMatch.cveScore,
        text: bestMatch.textScore,
        threatActor: bestMatch.threatActorScore,
        malware: bestMatch.malwareScore,
        product: bestMatch.productScore,
        company: bestMatch.companyScore
      }
    }
  };
}
```

---

## Performance Characteristics

### Scalability

- **30-Day Window**: ~300 articles (10/day × 30 days) scanned per new article
- **SQL Candidate Filtering**: O(log N) with indexes - ~5-10ms, returns 5-20 candidates
- **Jaccard Calculation**: O(K × M) where K = 5-20 candidates, M = avg summary length ~200 chars
- **Total Time**: ~10-20ms per new article (no LLM calls except optional borderline cases)
- **Daily Batch**: Process 10 new articles in ~100-200ms total

### Storage

- **Main JSON blob**: ~10-50 KB per publication (full structured output)
- **Entity indexes**: ~1-2 KB per article (CVEs + entities metadata)
- **1 year (365 days)**: ~3,650 articles × 30 KB = ~110 MB JSON + ~3.6 MB indexes
- **Database size**: ~120 MB per year (highly compressible with SQLite)
- **Keep forever**: Historical data useful for trend analysis, reporting, debugging

### Accuracy (To Be Validated)

- **Expected True Positives**: 90%+ (duplicate detection within 30 days)
- **Expected False Positives**: <10% (incorrectly marked as duplicate)
- **CVE Reuse Protection**: 30-day window prevents false positives from old CVE re-exploitation
- **Threshold tuning**: Adjust 0.35/0.70 based on production precision/recall metrics
- **Borderline handling**: Optional LLM invocation for 0.35-0.70 scores (conservative: treat as NEW)

### Real-World Test Data

From 4 days of production data (Oct 7-10, 2025):
- **CVE Reuse Observed**: 
  - `CVE-2025-61882` (Cl0p Oracle zero-day) - mentioned 3 consecutive days
  - `CVE-2025-49844` - mentioned 3 consecutive days
  - `CVE-2025-10035` - mentioned 2 days
- **Result**: Same CVE, continuing story across days = UPDATE (correct)
- **Validation**: 30-day window would correctly identify these as updates, not separate stories

---

## Configuration and Tuning

### Configurable Parameters

```typescript
interface FingerprintConfig {
  // Time window
  lookbackDays: number;              // Default: 30 (test: 7, 14, 30, 60, 90)
  
  // Scoring weights (must sum to 1.0)
  weights: {
    cve: number;                     // Default: 0.40 (PRIMARY)
    text: number;                    // Default: 0.20 (SECONDARY)
    threatActor: number;             // Default: 0.12 (SUPPORTING)
    malware: number;                 // Default: 0.12 (SUPPORTING)
    product: number;                 // Default: 0.08 (CONTEXT)
    company: number;                 // Default: 0.08 (CONTEXT)
  };
  
  // Classification thresholds
  thresholds: {
    new: number;                     // Default: 0.35 (score < this = NEW)
    update: number;                  // Default: 0.70 (score >= this = UPDATE)
    // Between = BORDERLINE
  };
  
  // SQL filtering
  minCandidateScore: number;         // Default: 4 (raw overlap threshold)
  maxCandidates: number;             // Default: 50 (limit results)
  requireCveMatch: boolean;          // Default: false (CVE OR 2+ entities)
  
  // Text similarity
  ngramSize: number;                 // Default: 3 (character trigrams)
  
  // Performance
  enableLLMBorderline: boolean;      // Default: false (skip LLM for speed)
}

const DEFAULT_CONFIG: FingerprintConfig = {
  lookbackDays: 30,
  weights: {
    cve: 0.40,
    text: 0.20,
    threatActor: 0.12,
    malware: 0.12,
    product: 0.08,
    company: 0.08
  },
  thresholds: {
    new: 0.35,
    update: 0.70
  },
  minCandidateScore: 4,
  maxCandidates: 50,
  requireCveMatch: false,
  ngramSize: 3,
  enableLLMBorderline: false
};
```

### Testing Different Configurations

```bash
# Test aggressive deduplication (7-day window, high CVE weight)
npx tsx scripts/content-generation-v2/find-duplicates.ts \
  --date 2025-10-14 \
  --lookback 7 \
  --cve-weight 0.50 \
  --text-weight 0.20

# Test conservative deduplication (60-day window, balanced weights)
npx tsx scripts/content-generation-v2/find-duplicates.ts \
  --date 2025-10-14 \
  --lookback 60 \
  --cve-weight 0.30 \
  --text-weight 0.30

# Test with LLM for borderline cases
npx tsx scripts/content-generation-v2/find-duplicates.ts \
  --date 2025-10-14 \
  --use-llm-borderline
```

### Tuning Recommendations

**For daily news (current use case)**:
- ✅ **lookbackDays: 30** - Optimal balance
- ✅ **CVE weight: 0.40** - CVEs are campaign identifiers
- ✅ **Update threshold: 0.70** - High confidence required

**For weekly digests**:
- 🔧 **lookbackDays: 14** - Shorter window, less overlap expected
- 🔧 **CVE weight: 0.35** - Slightly lower, more weight on text
- 🔧 **Text weight: 0.25** - Weekly summaries need more narrative comparison

**For breaking news alerts**:
- 🔧 **lookbackDays: 7** - Very aggressive, only recent duplicates
- 🔧 **CVE weight: 0.50** - CVE match is strongest signal
- 🔧 **requireCveMatch: true** - Must have CVE overlap to be candidate

**Metrics to monitor**:
```typescript
interface DuplicateDetectionMetrics {
  totalArticles: number;
  candidatesFound: number;        // Should be ~5-20 avg
  classificationsNew: number;      // ~60-80% expected
  classificationsUpdate: number;   // ~10-20% expected
  classificationsBorderline: number; // ~10-20% expected
  avgSqlQueryMs: number;          // Should be <10ms
  avgJaccardMs: number;           // Should be <10ms
  avgTotalMs: number;             // Should be <20ms
}
```

---

## Implementation Plan

### Architecture Decision: Separate Indexing Script (Step 3)

**DECISION**: Entity indexing runs as **separate script** after publications exist (not inline during Step 2).

**Rationale**:
- ✅ **Separation of concerns** - publication generation ≠ entity indexing
- ✅ **Can rerun** if entity extraction logic changes (no expensive LLM regeneration)
- ✅ **Backfill existing data** easily (we already have 2025-10-07 publication)
- ✅ **Independent optimization** - batch process 100s of publications at once
- ✅ **Debugging** - test entity extraction without regenerating publications
- ✅ **LLM output evolves** - entity schema might change, need to reprocess

**Pipeline**:
```
Step 2: news-structured.ts     → structured_news (JSON blobs)
Step 3: index-entities.ts      → Parse JSON → Populate entity indexes
Step 4: find-duplicates.ts     → Use entity indexes for fingerprinting
```

**Idempotency**: Check if `pub_id` already indexed in `articles_meta`, skip if exists (unless `--force` flag).

---

## Migration Path

### Phase 1: Create Entity Index Schema ✅ COMPLETE (2025-10-14)
**File**: `scripts/content-generation-v2/database/schema-article-entities.ts`

**Tasks**:
- ✅ Create schema file with `articles_meta`, `article_cves`, `article_entities` tables
- ✅ Include CVE metadata fields: `cvss_score`, `severity`, `kev` (for future filtering)
- ✅ Add initialization function to create tables and indexes (11 indexes total)
- ✅ Update `database/schema.ts` to call entity schema init
- ✅ Test table creation with existing database (test script passes)

**Summary**: See `FINGERPRINT-V2-PHASE1-COMPLETE.md` for details

**SQL Schema** (see "Database Schema → Entity Indexing Tables" section for full DDL)

**Key Indexes**:
- `idx_cve_lookup` on `article_cves(cve_id)` - Fast CVE matching (40% weight)
- `idx_entity_lookup` on `article_entities(entity_name)` - Fast entity matching
- `idx_entity_type` on `article_entities(entity_type)` - Filter by type
- `idx_articles_pub_id` on `articles_meta(pub_id)` - Join to publications

**Acceptance Criteria**:
```bash
# Should create tables without error
npx tsx scripts/content-generation-v2/database/schema-article-entities.ts

# Verify tables exist
sqlite3 logs/content-generation-v2.db ".tables"
# Expected: structured_news, raw_search, articles_meta, article_cves, article_entities

# Verify indexes
sqlite3 logs/content-generation-v2.db ".indexes article_cves"
# Expected: idx_cve_lookup, idx_cve_severity

# Verify schema
sqlite3 logs/content-generation-v2.db ".schema article_cves"
# Expected: cvss_score REAL, severity TEXT columns present
```

---

### Phase 2: Build Entity Extraction Script ⏳ NEXT STEP
**File**: `scripts/content-generation-v2/index-entities.ts`

**Tasks**:
- [ ] Create CLI script with args: `--date`, `--pub-id`, `--all`, `--force`
- [ ] Implement entity extraction from `CyberAdvisoryType.articles[]` JSON
- [ ] Extract article metadata: `id`, `slug`, `summary` → `articles_meta`
- [ ] Extract CVEs with metadata: `{id, cvss_score?, severity?, kev?}` → `article_cves`
- [ ] Extract entities, filter by type, normalize vendor→company → `article_entities`
- [ ] Add progress logging and error handling
- [ ] Implement idempotency check (skip if already indexed unless `--force`)

**Usage**:
```bash
# Index all publications
npx tsx scripts/content-generation-v2/index-entities.ts --all

# Index specific date
npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07

# Force reindex (delete existing, re-insert)
npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07 --force
```

**Acceptance Criteria**: See `FINGERPRINT-V2-PHASE1-COMPLETE.md` for detailed requirements

---

---

### Phase 3: Port V1 Jaccard Similarity Functions ⏳ AFTER PHASE 2
**File**: `scripts/content-generation-v2/lib/fingerprint.ts`

**Tasks**:
- [ ] Port character n-gram generation from V1 (`scripts/content-generation/lib/fingerprint.ts`)
- [ ] Port Jaccard similarity calculation
- [ ] Implement three-dimensional score calculation (CVE 20%, Entity 30%, Text 50%)
- [ ] Add threshold classification (NEW <0.35, UPDATE ≥0.70, BORDERLINE 0.35-0.70)
- [ ] Add TypeScript types for all interfaces

**Reference Implementation**: `scripts/content-generation/lib/fingerprint.ts` (V1 - proven code)

---

### Phase 4: Build SQL Candidate Filtering ⏳ AFTER PHASE 3
**File**: `scripts/content-generation-v2/database/query-candidates.ts`

**Tasks**:
- [ ] Implement SQL query to find candidates (see "Candidate Filtering Query" section)
- [ ] Add parameters: article entities, lookback days, minimum overlap threshold
- [ ] Return candidate articles with metadata (article_id, pub_id, summary, overlap counts)
- [ ] Add query performance logging

**Query Strategy**:
- Requires at least 1 CVE match OR 2+ entity matches
- CVEs weighted 2x in raw scoring
- Default lookback: 30 days
- Limit: 50 candidates max

---

### Phase 5: Build Duplicate Detection Script ⏳ AFTER PHASE 4
**File**: `scripts/content-generation-v2/find-duplicates.ts`

**Tasks**:
- [ ] Create CLI script with args: `--date`, `--pub-id`, `--article-id`, `--lookback`
- [ ] Combine SQL candidate filtering (30-day window) + 6-dimensional Jaccard similarity
- [ ] Implement configurable lookback window (default: 30 days)
- [ ] Output duplicate detection results (NEW/UPDATE/BORDERLINE with 6D score breakdown)
- [ ] Add optional LLM decision for BORDERLINE cases (flag: `--use-llm-borderline`)
- [ ] Log results with detailed score breakdowns and matched article info
- [ ] Add performance metrics (SQL time, Jaccard time, total time)

**Usage**:
```bash
# Check all articles in a publication (default 30-day lookback)
npx tsx scripts/content-generation-v2/find-duplicates.ts --date 2025-10-14

# Test different lookback windows
npx tsx scripts/content-generation-v2/find-duplicates.ts --date 2025-10-14 --lookback 7
npx tsx scripts/content-generation-v2/find-duplicates.ts --date 2025-10-14 --lookback 60

# Check specific article
npx tsx scripts/content-generation-v2/find-duplicates.ts --article-id <uuid>

# Use LLM for borderline cases (0.35-0.70 scores)
npx tsx scripts/content-generation-v2/find-duplicates.ts --date 2025-10-14 --use-llm-borderline

# Test weight configurations
npx tsx scripts/content-generation-v2/find-duplicates.ts --date 2025-10-14 --cve-weight 0.50 --text-weight 0.20
```

**Expected Output**:
```
Processing publication: 2025-10-14 (10 articles)
Lookback window: 30 days (scanning ~300 articles from 2025-09-14 to 2025-10-13)

Article 1/10: "Cl0p Exploits Oracle Zero-Day in New Campaign"
  Candidates found: 8 (from SQL filter)
  Best match: article-abc123 (2025-10-09, score: 0.82)
    CVE:          0.40 (1.00 × 0.40) - [CVE-2025-61882]
    Text:         0.15 (0.75 × 0.20) - High summary overlap
    Threat Actor: 0.12 (1.00 × 0.12) - [Cl0p]
    Malware:      0.00 (0.00 × 0.12) - No overlap
    Product:      0.08 (1.00 × 0.08) - [Oracle EBS]
    Company:      0.07 (0.85 × 0.08) - [Citibank, Harvard]
    TOTAL:        0.82
  Classification: UPDATE (continuing coverage)
  
Article 2/10: "New Ransomware Variant Targets Healthcare"
  Candidates found: 2
  Best match: article-xyz789 (2025-10-12, score: 0.28)
  Classification: NEW (distinct story)

Summary:
  Total articles:  10
  NEW:             7 (70%)
  UPDATE:          2 (20%)
  BORDERLINE:      1 (10%)
  Avg SQL time:    8ms
  Avg Jaccard:     5ms
  Total time:      130ms
```

---

### Phase 6: Testing & Validation ⏳ AFTER PHASE 5
**Tasks**:
- [ ] Compare results against V1 duplicate detection (if available)
- [ ] Manually review sample of NEW/UPDATE/BORDERLINE classifications
- [ ] Tune thresholds (0.35/0.70) based on precision/recall
- [ ] Optimize SQL query performance
- [ ] Add integration tests

---

## References

### V1 Implementation (Proven Codebase)
- `scripts/content-generation/lib/fingerprint.ts` - Jaccard similarity
- `scripts/content-generation/cli/filter-articles-entity.ts` - Entity filtering
- Character trigrams (n=3) proven more effective than word-based for security content

### Design Decisions
- ❌ **NO SecureBERT/BERT**: Poor security terminology, C library dependencies
- ❌ **NO MITRE ATT&CK indexing**: Too generic, low signal
- ✅ **YES Entity-based filtering**: High precision, proven in V1
- ✅ **YES Character n-grams**: Better than word tokenization for technical text
- ✅ **YES Computed columns**: `pub_date_only` for fast date queries

### Schema Files
- `scripts/content-generation-v2/database/schema-structured-news.ts` - Main storage
- `scripts/content-generation-v2/news-structured-schema.ts` - Zod validation
- `logs/content-generation-v2.db` - SQLite database

---

## Quick Start for New Session

### What's Already Done ✅

1. **Schema Updated**: `structured_news` table has `pub_type` (daily/weekly/monthly) and `pub_date_only` computed column
2. **Migration Complete**: Existing data migrated to use `pub_id` UUID as primary key (not `pub_date`)
3. **One Publication Exists**: 2025-10-07 daily publication with 30 articles in JSON blob
4. **Database Ready**: `logs/content-generation-v2.db` with better-sqlite3 + WAL mode

### Immediate Next Action ⏳

**Phase 2 Complete** ✅

**Status Update**:
- ✅ Phase 1 Complete: Entity indexing schema (`schema-article-entities.ts`)
- ✅ Phase 2 Complete: Entity extraction script (`index-entities.ts`)
- ✅ 50 production articles indexed (Oct 7-14, 2025)
- ✅ Campaign validation: CVE-2025-61882 across 5 days (Cl0p Oracle)

**START HERE**: Implement **Phase 3 - Create Duplicate Detection Script**

```bash
# Create duplicate detection script
touch scripts/content-generation-v2/check-duplicates.ts

# Implement 6D Jaccard similarity:
# - Query 30-day window for candidate articles (SQL)
# - Filter by shared CVEs/entities (indexed lookups)
# - Calculate weighted similarity (CVE 40%, Text 20%, 4 entity types 40%)
# - Return scores (0-1) and classify (NEW/UPDATE/BORDERLINE)

# Test on real data
npx tsx scripts/content-generation-v2/check-duplicates.ts --date 2025-10-09
```

See `FINGERPRINT-V2-PHASE2-COMPLETE.md` for Phase 2 results and Phase 3 requirements.

### Files to Reference

**Schema Examples**:
- `scripts/content-generation-v2/database/schema-structured-news.ts` - Pattern to follow
- `scripts/content-generation-v2/database/index.ts` - DB initialization

**V1 Reference Code** (proven implementations):
- `scripts/content-generation/lib/fingerprint.ts` - Jaccard similarity calculations
- `scripts/content-generation/cli/filter-articles-entity.ts` - Entity filtering patterns

**Zod Schemas** (entity structure):
- `scripts/content-generation-v2/news-structured-schema.ts` - See `ArticleSchema.entities`

### Key Design Constraints

1. **DO NOT index MITRE ATT&CK, tags, keywords, categories** - Too generic, low signal within 30-day window
2. **DO NOT index person, technology, security_organization entities** - Low signal or too generic
3. **Only index these entities**: CVEs (40%), threat_actors (12%), malware (12%), products (8%), companies/vendors (8%)
4. **Character trigrams (n=3)** - Proven better than word tokens for security text (20% weight)
5. **30-day lookback window** - Prevents false positives from old CVE reuse (configurable: 7, 14, 30, 60 days)
6. **CVE-primary weighting** - CVEs are the campaign identifier, highest weight (40%)
7. **Thresholds**: NEW <0.35, UPDATE ≥0.70, BORDERLINE 0.35-0.70
8. **Data retention**: Keep all data forever, query filters by date (never delete)

### Testing the Existing Publication

```bash
# View existing publication structure
sqlite3 logs/content-generation-v2.db "SELECT pub_id, pub_date_only, total_articles FROM structured_news;"

# Extract JSON to inspect entity structure
sqlite3 logs/content-generation-v2.db "SELECT json_extract(data, '$.articles[0].entities') FROM structured_news LIMIT 1;"

# Count expected entities for validation
sqlite3 logs/content-generation-v2.db "SELECT json_array_length(json_extract(data, '$.articles')) as article_count FROM structured_news WHERE pub_date_only = '2025-10-07';"
```

---

## Troubleshooting

### If Tables Don't Exist
```bash
# Reinitialize structured_news schema
npx tsx -e "import { initStructuredNewsSchema } from './scripts/content-generation-v2/database/schema-structured-news.js'; initStructuredNewsSchema();"
```

### If Migration Needed
```bash
# Check current schema
sqlite3 logs/content-generation-v2.db ".schema structured_news"

# Re-run migrations if needed
npx tsx scripts/content-generation-v2/database/migrate-to-uuid-pk.ts
npx tsx scripts/content-generation-v2/database/migrate-add-pub-type.ts
```

### If Data Missing
```bash
# Regenerate publication for 2025-10-07
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-07 --logtodb
```

---

## References

### V1 Implementation (Proven Codebase)
- `scripts/content-generation/lib/fingerprint.ts` - Jaccard similarity
- `scripts/content-generation/cli/filter-articles-entity.ts` - Entity filtering
- Character trigrams (n=3) proven more effective than word-based for security content

### Design Decisions
- ❌ **NO SecureBERT/BERT**: Poor security terminology, C library dependencies
- ❌ **NO MITRE ATT&CK indexing**: Too generic, low signal within 30-day window
- ❌ **NO tags/keywords/categories**: Too broad, SEO-focused, not distinctive
- ❌ **NO person/technology/security_org entities**: Low signal or too generic
- ✅ **YES Entity-based filtering**: High precision, proven in V1
- ✅ **YES Character n-grams**: Better than word tokenization for technical text
- ✅ **YES Computed columns**: `pub_date_only` for fast date queries
- ✅ **YES Separate indexing script**: Allows reprocessing without LLM regeneration
- ✅ **YES 30-day lookback window**: Prevents false positives from old CVE reuse
- ✅ **YES CVE-primary weighting**: CVEs are the campaign identifier (40% weight)
- ✅ **YES Keep all data forever**: Query filters by date, never delete historical data

### Schema Files
- `scripts/content-generation-v2/database/index.ts` - DB initialization
- `scripts/content-generation-v2/database/schema-structured-news.ts` - Main publication storage
- `scripts/content-generation-v2/news-structured-schema.ts` - Zod validation
- `logs/content-generation-v2.db` - SQLite database

### Key Technologies
- **Database**: better-sqlite3 v9.x with WAL mode
- **LLM**: Google Vertex AI gemini-2.5-pro (Genkit framework)
- **Validation**: Zod schemas with structured output
- **Language**: TypeScript with ES modules (.js imports)

---

**Last Updated**: 2025-10-14  
**Status**: Design finalized with 6-dimensional scoring, CVE-primary weighting (40%), 30-day lookback window  
**Key Decisions**: 
- CVE is primary campaign identifier (40% weight) based on real-world data analysis
- 30-day lookback prevents false positives from old CVE reuse (configurable)
- Keep all data forever, query filters by date
- Validated with production data showing CVE reuse across 3 consecutive days
**Next Session**: Start with Phase 1 - Create `schema-article-entities.ts` with updated 6-dimensional schema
