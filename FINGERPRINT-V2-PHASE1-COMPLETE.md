# Fingerprint V2 - Phase 1 Implementation Complete

**Date**: October 14, 2025  
**Status**: ✅ Phase 1 Complete - Entity Indexing Schema Created

---

## What Was Built

### 1. Entity Indexing Schema (`schema-article-entities.ts`)

Created three tables for fast duplicate detection:

#### Table 1: `articles_meta`
- Minimal article metadata extracted from JSON
- Fields: `article_id` (PK), `pub_id`, `pub_date_only`, `slug`, `summary`
- Purpose: Links articles to publications, enables 30-day lookback queries
- Indexes: `pub_id`, `pub_date_only`

#### Table 2: `article_cves` 
- CVE dimension (40% weight - PRIMARY campaign identifier)
- Fields: `article_id`, `cve_id`, `cvss_score`, `severity`, `kev`
- Purpose: Fast CVE matching across articles within 30-day window
- Indexes: `cve_id` (main lookup), `article_id`, `severity`, `kev`

#### Table 3: `article_entities`
- Named entity dimensions (40% combined weight - SUPPORTING evidence)
- Fields: `article_id`, `entity_name`, `entity_type`
- Purpose: Match threat actors, malware, products, companies
- Indexes: `entity_name` (main lookup), `entity_type`, composite `(type, name)`

### 2. Entity Type Filtering

**Indexed Types** (high signal):
- ✅ `threat_actor` - 12% weight (APT29, Cl0p)
- ✅ `malware` - 12% weight (Emotet, Cobalt Strike)  
- ✅ `product` - 8% weight (Oracle EBS, Redis)
- ✅ `company` - 8% weight (Citibank, Microsoft)
- ✅ `vendor` → `company` - 8% weight (normalized)
- ✅ `government_agency` - Low priority but indexed

**Excluded Types** (low signal):
- ❌ `person` - Names vary, low discriminatory power
- ❌ `technology` - Too broad
- ❌ `security_organization` - Too common
- ❌ `other` - Undefined category

### 3. Helper Functions

**Insertion**:
- `insertArticleMeta()` - Add article metadata
- `insertCVE()` - Add CVE with metadata
- `insertEntity()` - Add named entity

**Querying**:
- `isArticleIndexed()` - Check if article already indexed
- `getArticleMeta()` - Retrieve article metadata
- `getArticleCVEs()` - Get all CVEs for article
- `getArticleEntities()` - Get all entities for article
- `getEntityIndexStats()` - Get index statistics

**Utilities**:
- `shouldIndexEntityType()` - Filter entity types
- `normalizeEntityType()` - Map vendor→company
- `deleteArticleEntities()` - Remove for re-indexing

### 4. Test Script

Created `test-entity-schema.ts` to verify:
- ✅ Tables created correctly
- ✅ 11 indexes created
- ✅ Foreign key constraints work
- ✅ Insert/query operations work
- ✅ Entity type filtering works
- ✅ Statistics generation works

---

## Test Results

```
🧪 Testing Article Entity Indexing Schema

✅ Tables found: article_cves, article_entities, articles_meta
✅ Indexes found: 11
✅ Entity type filtering: 6 indexed, 4 excluded
✅ Insert operations: metadata, 2 CVEs, 5 entities
✅ Query operations: all functions working
✅ Statistics: 1 test article indexed successfully

✅ Found 5 existing publications (Oct 7-14, 2025) ready to index
```

---

## Verification Commands

```bash
# Check tables exist
sqlite3 logs/content-generation-v2.db ".tables"
# Expected: articles_meta, article_cves, article_entities (among others)

# Check CVE table schema
sqlite3 logs/content-generation-v2.db ".schema article_cves"
# Expected: cvss_score REAL, severity TEXT, kev INTEGER

# Check indexes
sqlite3 logs/content-generation-v2.db ".indexes article_cves"
# Expected: idx_cve_lookup, idx_cve_article, idx_cve_severity, idx_cve_kev

# Run test script
npx tsx scripts/content-generation-v2/test-entity-schema.ts
# Expected: All tests passed!
```

---

## Production Data Ready

**Existing Publications**: 5 publications (Oct 7-14, 2025)
- 2025-10-07: 10 articles - "Cl0p Exploits Oracle Zero-Day..."
- 2025-10-09: 10 articles - "Red Hat Breach Exposes 800+ Orgs..."
- 2025-10-10: 10 articles - "Critical Zero-Days in Oracle..."
- 2025-10-12: 10 articles - "CL0P Exploits Oracle Zero-Day..."
- 2025-10-14: 10 articles - "Oracle Races to Patch..."

**Total**: ~50 articles ready to be indexed

---

## Next Steps: Phase 2

### Create `index-entities.ts` Script

**Purpose**: Extract entities from `structured_news.data` JSON and populate entity indexes

**Key Requirements**:
1. Parse JSON from `structured_news.data` column
2. Extract `article.id`, `article.slug`, `article.summary` for `articles_meta`
3. Extract `article.cves[]` for `article_cves` table
4. Extract `article.entities[]`, filter by type, normalize, insert to `article_entities`
5. Skip articles already indexed (unless `--force` flag)
6. Support batch processing (e.g., index all publications at once)
7. Support single date (e.g., `--date 2025-10-07`)

**Usage Examples**:
```bash
# Index all publications
npx tsx scripts/content-generation-v2/index-entities.ts --all

# Index specific date
npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07

# Force re-index (delete existing, re-insert)
npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07 --force

# Index date range
npx tsx scripts/content-generation-v2/index-entities.ts --from 2025-10-07 --to 2025-10-14
```

**Expected Output**:
```
📊 Indexing entities from structured publications
✅ Processing 2025-10-07 (10 articles)
   - Extracted 15 CVEs (8 unique)
   - Extracted 120 entities (85 unique, 72 indexed)
✅ Processing 2025-10-09 (10 articles)
   ...
✅ Indexed 50 articles from 5 publications
   - Total CVEs: 75 (45 unique)
   - Total entities: 600 (320 indexed)
```

---

## Schema Design Decisions

### Why 30-Day Lookback?
- Within 30 days: Same CVE = likely same campaign → High CVE weight (40%)
- After 30 days: CVE can be reused in different campaign → Not queried, no false positives
- Prevents: CVE-2024-1234 exploited by APT29 (Day 1) matched with LockBit (Day 180)

### Why CVE = 40% (PRIMARY)?
> "When there's a CVE, it's the pivotal point. That's the campaign. That's the actual story."

- CVEs are **unique technical identifiers** of campaigns
- Within 30-day window, same CVE = highly likely same story
- Validated with production data: CVE-2025-61882 appeared 3 consecutive days (Cl0p Oracle campaign)

### Why Text = 20% (SECONDARY)?
- Confirms CVE match with narrative similarity
- Lower than V1 (was 50%) because CVE is more reliable within window
- Character trigrams for technical text (proven in V1)

### Why No MITRE Indexing?
- Individual techniques too generic (T1190 in thousands of web exploit articles)
- Within 30-day window, CVE + Text + 4 entity types = sufficient (100% weight)
- Can add later if needed (simpler schema now)

---

## Files Modified/Created

### Created:
- `scripts/content-generation-v2/database/schema-article-entities.ts` - Entity indexing schema (320 lines)
- `scripts/content-generation-v2/test-entity-schema.ts` - Test script (210 lines)
- `FINGERPRINT-V2-PHASE1-COMPLETE.md` - This summary document

### Modified:
- `scripts/content-generation-v2/database/schema.ts` - Added entity schema initialization

---

## Performance Targets

**SQL Query** (candidate filtering):
- Input: 300 articles (30-day window, 10/day)
- Filter: Shared CVEs or entities
- Output: 5-20 candidates
- Time: ~5-10ms (indexed)

**Jaccard Calculation** (in-memory):
- Input: 5-20 candidates
- Process: 6D weighted overlap (CVE, Text, 4 entity types)
- Output: Similarity scores (0-1)
- Time: ~5-10ms

**Total per article**: ~10-20ms (no LLM calls)

---

## Acceptance Criteria

✅ Three tables created: `articles_meta`, `article_cves`, `article_entities`  
✅ 11 indexes created for fast lookups  
✅ CVE metadata fields: `cvss_score`, `severity`, `kev`  
✅ Entity type filtering: 6 indexed, 4 excluded  
✅ Helper functions: insert, query, delete, stats  
✅ Test script passes all checks  
✅ Foreign key constraints enforced  
✅ Schema integrates with existing `structured_news` table  

**Phase 1 Complete** ✅

---

## Documentation References

- **Design**: `FINGERPRINT-V2.md` - Complete design with 30-day window strategy
- **Handover**: `FINGERPRINT-V2-HANDOVER.md` - Session context for future work
- **Schema**: `scripts/content-generation-v2/database/schema-article-entities.ts` - Implementation
- **Test**: `scripts/content-generation-v2/test-entity-schema.ts` - Verification

---

**Next Action**: Create `index-entities.ts` to populate entity indexes from existing publications (Phase 2).
