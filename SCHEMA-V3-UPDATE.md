# Schema v3 Update - Publications Raw Audit Trail

**Date:** October 13, 2025  
**Status:** ✅ Complete  
**Schema Version:** v2 → v3

---

## Summary

Added `publications_raw` table to store raw AI generation outputs for audit trail purposes. This allows us to review what the AI generated in Step 2 before any filtering or processing happens.

---

## Changes Made

### 1. Database Schema (`scripts/db/schema.sql`)

**Added Table:**
```sql
CREATE TABLE IF NOT EXISTS publications_raw (
    raw_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pub_id VARCHAR(50) NOT NULL,
    raw_data TEXT NOT NULL,           -- Full JSON from AI generation
    model_used VARCHAR(50),            -- e.g., gemini-2.0-flash-exp
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_publications_raw_pub ON publications_raw(pub_id);
CREATE INDEX IF NOT EXISTS idx_publications_raw_created ON publications_raw(created_at DESC);
```

**Key Decisions:**
- No foreign key constraint to `publications` table (allows saving raw output before publication is created)
- Stores complete JSON response from AI
- Tracks model and token usage per generation
- Lightweight audit trail without enforced relationships

**Schema Version Updated:**
- v2: "Added api_calls table and cost reporting views"
- v3: "Added publications_raw table for audit trail"

### 2. Database Client (`scripts/content-generation/lib/db-client.ts`)

**Added Functions:**

```typescript
// Save raw AI output
export function savePublicationRaw(
  db: Database.Database, 
  data: PublicationRaw
): number

// Get latest raw output for a publication
export function getPublicationRaw(
  db: Database.Database, 
  pubId: string
): PublicationRaw | undefined

// Get all raw outputs (for audit)
export function getAllPublicationRaws(
  db: Database.Database, 
  limit = 50
): PublicationRaw[]
```

**Updated Function:**
- `getDatabaseStats()` - Now includes `publications_raw` count

### 3. Documentation Updates

**Updated Files:**

1. **`scripts/content-generation/docs/SQLITE-ARCHITECTURE.md`**
   - Added warning banner marking it as HISTORICAL document
   - References current implementation in `/scripts/db/schema.sql`
   - Kept for reference on audit trail concepts

2. **`scripts/content-generation/docs/00-INDEX.md`**
   - Added note about historical vs current architecture
   - Added section explaining current database implementation
   - Clarified that old design may be integrated later

### 4. Test Coverage

**Created:** `scripts/db/test-publications-raw.ts`
- Tests saving raw AI output
- Tests retrieving by pub_id
- Tests getting all raw outputs
- Validates database stats

**All tests passing ✅**

---

## Usage Example

```typescript
import { initDatabase, savePublicationRaw } from './lib/db-client.js'

// Step 2: Generate publication + articles in ONE AI call
const result = await callGenkitGemini(searchResults, {
  schema: CyberAdvisorySchema,
  model: 'gemini-2.0-flash-exp'
})

// Save raw output for audit
await savePublicationRaw(db, {
  pub_id: result.pub_id,
  raw_data: JSON.stringify(result),
  model_used: 'gemini-2.0-flash-exp',
  prompt_tokens: result.usage.inputTokens,
  completion_tokens: result.usage.outputTokens
})

// Continue with Step 3: Entity-based filtering...
```

---

## Purpose

### Why Store Raw AI Output?

1. **Audit Trail:** Can review exactly what AI generated before filtering
2. **Debugging:** If filtering logic has bugs, can replay from raw output
3. **Quality Analysis:** Can analyze AI output quality over time
4. **Regeneration:** Can re-run Step 3 filtering without calling AI again
5. **Cost Transparency:** See token usage per generation

### What Gets Stored?

The COMPLETE AI response including:
- Publication metadata (headline, summary, pub_type)
- ALL generated articles (before filtering)
- Entity extraction (CVEs, companies, threat actors, malware, MITRE)
- Model information and token counts

### When to Use?

**Query raw output when:**
- Debugging why an article was filtered out
- Analyzing AI generation quality
- Investigating entity extraction accuracy
- Re-running filtering with different thresholds (future)
- Cost analysis per publication

---

## Database Stats

After initialization:
```
✅ Created 14 tables (including publications_raw)
✅ Created 36 indexes
✅ Schema version: 3
```

Tables:
- `articles`, `entities`, `cves`, `mitre_techniques` (entity-relationship)
- `article_cves`, `article_entities`, `article_mitre` (relationships)
- `publications`, `publication_articles` (publication metadata)
- `publications_raw` (audit trail) ← NEW
- `api_calls`, `pipeline_runs` (cost/execution tracking)
- `schema_version` (migrations)

---

## Entity-Based Fingerprinting (Clarification)

### What AI Outputs:
```json
{
  "articles": [{
    "entities": {
      "cves": ["CVE-2025-1234"],
      "threat_actors": ["APT29"],
      "malware": ["LockBit"],
      "companies": ["Microsoft"],
      "products": ["Exchange Server"]
    },
    "mitre_attack": {
      "tactics": ["Execution"],
      "techniques": ["T1059.001"]
    }
  }]
}
```

### What Gets Used for Fingerprinting:
✅ CVEs (very specific)  
✅ Companies/vendors (specific)  
✅ Threat actors (specific)  
✅ Products (specific)  
✅ Malware (specific)  
❌ MITRE techniques (too generic - NOT used for filtering)

### What Gets Stored in Database:
✅ ALL entities (including MITRE) - for search/categorization later  
✅ Used for fingerprinting: CVEs + companies + threat actors + products + malware  
❌ NOT used for fingerprinting: MITRE techniques

**Benefit:** Can search by MITRE technique later, but won't false-positive match articles just because they share common techniques like "T1078 - Valid Accounts"

---

## Next Steps (Phase 2)

1. ✅ Database schema complete (v3)
2. ✅ Audit trail infrastructure ready
3. 🔄 Build unified generation script (`generate-publication-unified.ts`)
4. 🔄 Implement entity-based filtering logic
5. 🔄 Integrate with existing CLI pipeline

**Ready for Phase 2 implementation!**
