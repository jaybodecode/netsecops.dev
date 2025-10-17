# Fingerprint V2 - Quick Start Guide

**Last Updated**: October 14, 2025  
**Status**: Phase 2 Complete ✅ → Ready for Phase 3

---

## Current Implementation

### ✅ Phase 1: Entity Indexing Schema (Complete)

**File**: `scripts/content-generation-v2/database/schema-article-entities.ts`

**Created Tables**:
- `articles_meta` - Article metadata (id, slug, summary, pub_id, date)
- `article_cves` - CVE entities with CVSS scores, severity, KEV status
- `article_entities` - Named entities (threat actors, malware, products, companies)

**Test**: `npx tsx scripts/content-generation-v2/test-entity-schema.ts`

---

### ✅ Phase 2: Entity Extraction Script (Complete)

**File**: `scripts/content-generation-v2/index-entities.ts`

**Extracts from**: `structured_news.data` JSON → Entity index tables

**Usage**:
```bash
# Index all publications
npx tsx scripts/content-generation-v2/index-entities.ts --all

# Index specific date
npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07

# Force re-index
npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07 --force

# Index date range
npx tsx scripts/content-generation-v2/index-entities.ts --from 2025-10-07 --to 2025-10-14
```

**Production Stats**:
- 50 articles indexed (Oct 7-14, 2025)
- 21 CVEs (14 unique)
- 228 entities (155 unique)
- CVE-2025-61882 appears 5 times (Cl0p Oracle campaign)

---

### ⏳ Phase 3: Duplicate Detection (Next)

**Create**: `scripts/content-generation-v2/check-duplicates.ts`

**Purpose**: Calculate 6D weighted Jaccard similarity for duplicate detection

**Algorithm**:
1. Query articles in 30-day window from target date
2. Filter candidates by shared CVEs or entities (SQL indexed)
3. Calculate weighted similarity:
   - CVE overlap: 40% (PRIMARY campaign identifier)
   - Text similarity: 20% (character trigrams from summary)
   - threat_actor: 12%
   - malware: 12%
   - product: 8%
   - company: 8%
4. Classify: NEW (<0.35), BORDERLINE (0.35-0.70), UPDATE (≥0.70)

**Expected Usage**:
```bash
# Check single article
npx tsx scripts/content-generation-v2/check-duplicates.ts --article-id <uuid>

# Check all articles in date range
npx tsx scripts/content-generation-v2/check-duplicates.ts --from 2025-10-07 --to 2025-10-14

# Mark duplicates with threshold
npx tsx scripts/content-generation-v2/check-duplicates.ts --all --threshold 0.6 --mark
```

---

## Database Queries

### Check Indexed Data

```bash
# Count articles, CVEs, entities
sqlite3 logs/content-generation-v2.db "
  SELECT 'Articles' as type, COUNT(*) FROM articles_meta
  UNION ALL SELECT 'CVEs', COUNT(*) FROM article_cves
  UNION ALL SELECT 'Entities', COUNT(*) FROM article_entities
"

# CVE reuse (campaign detection)
sqlite3 logs/content-generation-v2.db "
  SELECT cve_id, COUNT(DISTINCT article_id) as articles
  FROM article_cves
  GROUP BY cve_id
  ORDER BY articles DESC
  LIMIT 10
"

# Entity type distribution
sqlite3 logs/content-generation-v2.db "
  SELECT entity_type, COUNT(*) as count
  FROM article_entities
  GROUP BY entity_type
  ORDER BY count DESC
"
```

### Find Articles by CVE (30-day window)

```sql
SELECT a.pub_date_only, a.slug, a.summary
FROM articles_meta a
JOIN article_cves c ON a.article_id = c.article_id
WHERE c.cve_id = 'CVE-2025-61882'
  AND a.pub_date_only >= date('now', '-30 days')
ORDER BY a.pub_date_only;
```

### Find Articles by Entity

```sql
SELECT a.pub_date_only, a.slug, e.entity_type
FROM articles_meta a
JOIN article_entities e ON a.article_id = e.article_id
WHERE e.entity_name = 'Cl0p'
  AND a.pub_date_only >= date('now', '-30 days')
ORDER BY a.pub_date_only;
```

---

## Pipeline Integration

### After Article Generation

```bash
# Step 1: Generate structured news (already done)
npx tsx scripts/content-generation-v2/news-structured.ts --date $DATE --logtodb

# Step 2: Index entities (add to pipeline)
npx tsx scripts/content-generation-v2/index-entities.ts --date $DATE

# Step 3: Check for duplicates (Phase 3 - not yet implemented)
# npx tsx scripts/content-generation-v2/check-duplicates.ts --date $DATE --threshold 0.6
```

---

## Documentation

- **Design**: `FINGERPRINT-V2.md` - Complete design document (1456 lines)
- **Phase 1**: `FINGERPRINT-V2-PHASE1-COMPLETE.md` - Schema implementation
- **Phase 2**: `FINGERPRINT-V2-PHASE2-COMPLETE.md` - Indexer implementation
- **Quick Start**: `FINGERPRINT-V2-QUICK-START.md` - This document

---

## Key Design Decisions

### ✅ CVE-Primary Weighting (40%)
> "When there's a CVE, it's the pivotal point. That's the campaign."

Within 30-day window, same CVE = likely same campaign

### ✅ 30-Day Lookback Window
- Within 30 days: High CVE weight (40%) - same CVE = same story
- After 30 days: CVE can be reused in different context
- Prevents: Old CVE matched incorrectly (CVE-2024-1234 APT29 vs LockBit 6mo later)

### ✅ Entity Type Filtering
**Indexed** (high signal):
- threat_actor (12%) - APT29, Cl0p
- malware (12%) - Emotet, Cobalt Strike
- product (8%) - Oracle EBS, Redis
- company (8%) - Citibank, Microsoft

**Excluded** (low signal):
- person - Names vary
- technology - Too broad
- security_organization - Too common
- other - Undefined

### ✅ Character Trigrams (not word tokens)
Better for technical text: "CVE-2025-61882" → ["CVE", "VE-", "E-2", "2025", ...]

---

## Performance Targets

- **SQL Filtering**: 300 articles (30-day window) → 5-20 candidates (~5-10ms)
- **Jaccard Calculation**: 5-20 candidates → similarity scores (~5-10ms)
- **Total per article**: ~10-20ms (no LLM calls needed)

---

**Next Action**: Implement Phase 3 duplicate detection script with 6D Jaccard similarity.
