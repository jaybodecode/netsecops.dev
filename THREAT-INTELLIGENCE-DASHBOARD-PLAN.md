# Threat Intelligence Dashboard - Option 2 Migration Plan

## Current State (Option 1)
- Junction table approach: `article_entities` stores (article_id, entity_name, entity_type)
- Entities are "tags on articles"
- Reports require GROUP BY queries across articles
- Statistics computed at dashboard generation time

## Future Enhancement (Option 2) - Entity-Centric Intelligence

### Overview
Transform from article-centric to entity-centric model where entities become first-class intelligence objects that accumulate knowledge across articles.

### Database Schema Changes

```sql
-- Master entities table with aggregated statistics
CREATE TABLE entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  first_seen TEXT NOT NULL,        -- First article date mentioning this entity
  last_seen TEXT NOT NULL,          -- Most recent article date
  article_count INTEGER DEFAULT 0,  -- Cached count for performance
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_last_seen ON entities(last_seen);
CREATE INDEX idx_entities_name ON entities(name);

-- Threat actor specific metadata
CREATE TABLE threat_actors (
  entity_id INTEGER PRIMARY KEY,
  aliases TEXT,              -- JSON array: ["Fancy Bear", "APT28", "Sofacy"]
  attribution TEXT,          -- Nation-state or group attribution
  motivation TEXT,           -- Financial, espionage, etc.
  sophistication TEXT,       -- Low, medium, high, advanced
  active_since TEXT,         -- Best known first activity date
  target_sectors TEXT,       -- JSON array of targeted industries
  ttps_summary TEXT,         -- Common tactics/techniques summary
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Malware specific metadata
CREATE TABLE malware (
  entity_id INTEGER PRIMARY KEY,
  family TEXT,               -- Malware family name
  variant TEXT,              -- Specific variant if applicable
  type TEXT,                 -- Ransomware, trojan, RAT, etc.
  first_seen_date TEXT,      -- First seen in wild (from articles)
  platforms TEXT,            -- JSON array: ["Windows", "Linux"]
  capabilities TEXT,         -- JSON array of capabilities
  associated_actors TEXT,    -- JSON array of threat actor entity_ids
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Vulnerability specific metadata (CVE enrichment)
CREATE TABLE vulnerabilities (
  entity_id INTEGER PRIMARY KEY,
  cve_id TEXT UNIQUE,        -- CVE identifier
  cvss_score REAL,           -- CVSS score if available
  severity TEXT,             -- Critical, High, Medium, Low
  exploitation_status TEXT,  -- Exploited in wild, PoC exists, etc.
  patch_available BOOLEAN,   -- Is patch available
  affected_products TEXT,    -- JSON array of product entity_ids
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Company/Vendor specific metadata
CREATE TABLE organizations (
  entity_id INTEGER PRIMARY KEY,
  industry TEXT,             -- Tech, Finance, Healthcare, etc.
  organization_type TEXT,    -- Vendor, Target, Researcher
  products TEXT,             -- JSON array of product entity_ids
  breach_count INTEGER DEFAULT 0,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Update junction table to use entity_id instead of name/type
CREATE TABLE article_entities_v2 (
  article_id TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  context TEXT,              -- How entity appears in article (victim, attacker, vendor)
  PRIMARY KEY (article_id, entity_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX idx_article_entities_v2_entity ON article_entities_v2(entity_id);
CREATE INDEX idx_article_entities_v2_article ON article_entities_v2(article_id);
```

### Migration Strategy

#### Phase 1: Create New Schema (Zero Downtime)
1. Create new tables alongside existing `article_entities`
2. Populate `entities` table from existing `article_entities` data:
   ```sql
   INSERT INTO entities (name, type, first_seen, last_seen, article_count)
   SELECT 
     ae.entity_name,
     ae.entity_type,
     MIN(a.published_at) as first_seen,
     MAX(a.published_at) as last_seen,
     COUNT(DISTINCT ae.article_id) as article_count
   FROM article_entities ae
   JOIN articles a ON ae.article_id = a.id
   GROUP BY ae.entity_name, ae.entity_type;
   ```

3. Populate `article_entities_v2` from existing data:
   ```sql
   INSERT INTO article_entities_v2 (article_id, entity_id)
   SELECT DISTINCT ae.article_id, e.id
   FROM article_entities ae
   JOIN entities e ON ae.entity_name = e.name AND ae.entity_type = e.type;
   ```

#### Phase 2: Update Insert Script
Modify `insert-articles.ts` to:
1. Check if entity exists in `entities` table
2. If new: INSERT into `entities` with first_seen = article date
3. If exists: UPDATE last_seen and increment article_count
4. INSERT into type-specific table (threat_actors, malware, etc.) with metadata from LLM
5. INSERT into `article_entities_v2` junction table

#### Phase 3: Dashboard JSON Generation
Create new script: `generate-threat-intelligence-dashboard.ts`
```typescript
// Output: public/data/threat-intelligence-dashboard.json
{
  "generated_at": "2025-10-17T00:00:00Z",
  "threat_actors": [
    {
      "name": "APT28",
      "aliases": ["Fancy Bear", "Sofacy"],
      "article_count": 15,
      "first_seen": "2024-03-15",
      "last_seen": "2025-10-15",
      "recent_articles": [...], // Last 5 articles
      "associated_malware": ["X-Agent", "Zebrocy"],
      "target_sectors": ["Government", "Defense"]
    }
  ],
  "malware": [...],
  "trending_entities": [...], // Most active in last 30 days
  "statistics": {
    "total_threat_actors": 49,
    "total_malware": 34,
    "active_this_month": 12
  }
}
```

#### Phase 4: LLM Enhancement
Update `news-structured-schema.ts` to extract entity metadata:
```typescript
export const EntityMetadataSchema = z.object({
  entity_name: z.string(),
  entity_type: z.enum(['threat_actor', 'malware', 'vulnerability', ...]),
  // Threat actor specific
  aliases: z.array(z.string()).optional(),
  attribution: z.string().optional(),
  // Malware specific
  malware_family: z.string().optional(),
  malware_type: z.string().optional(),
  // ... etc
});
```

#### Phase 5: Deprecate Old Schema (Future)
Once validated:
1. Drop `article_entities` table
2. Rename `article_entities_v2` to `article_entities`
3. Update all queries to use new structure

### Dashboard Features Enabled

**With Option 2, can generate dashboard showing:**
1. **Threat Actor Tracker**
   - Active threat actors (last seen < 30 days)
   - Most mentioned actors by article count
   - Threat actor timelines (first seen → last seen)
   - Associated malware per actor

2. **Malware Trends**
   - New malware families this month
   - Most prevalent malware by article mentions
   - Malware family evolution tracking
   - Platform targeting analysis

3. **Entity Relationships**
   - Which threat actors use which malware
   - Which products are most targeted
   - Vendor vulnerability patterns

4. **Activity Heatmaps**
   - Entity activity over time
   - Sector targeting trends
   - Geographic patterns (if extracted)

5. **Intelligence Timeline**
   - "What happened this week?" - entities with activity
   - Emerging threats (first seen recently + high article count)
   - Persistent threats (long first_seen → last_seen span)

### Performance Benefits

**Query Comparison:**

Current (Option 1):
```sql
-- "Show top 10 threat actors this month" - Requires full table scan + JOIN
SELECT entity_name, COUNT(*) 
FROM article_entities ae 
JOIN articles a ON ae.article_id = a.id
WHERE ae.entity_type = 'threat_actor' 
  AND a.published_at >= '2025-10-01'
GROUP BY entity_name 
ORDER BY COUNT(*) DESC 
LIMIT 10;
```

Option 2:
```sql
-- Same query - Uses cached article_count + indexed last_seen
SELECT name, article_count, last_seen
FROM entities 
WHERE type = 'threat_actor' 
  AND last_seen >= '2025-10-01'
ORDER BY article_count DESC 
LIMIT 10;
```

### JSON File Structure

```
public/data/
├── threat-intelligence-dashboard.json  (Main dashboard data)
├── entities/
│   ├── threat-actors-index.json       (All threat actors summary)
│   ├── threat-actor-{slug}.json       (Individual actor details)
│   ├── malware-index.json
│   ├── malware-{slug}.json
│   └── ... (other entity types)
├── trends/
│   ├── weekly-activity.json           (Last 7 days)
│   ├── monthly-activity.json          (Last 30 days)
│   └── trending-entities.json         (Hot entities)
└── relationships/
    ├── actor-malware-map.json         (Actor → Malware associations)
    └── product-vulnerability-map.json (Product → CVE associations)
```

### Implementation Checklist

- [ ] Create migration SQL script with all new tables
- [ ] Write data migration script to populate from existing data
- [ ] Update `insert-articles.ts` to use new schema
- [ ] Enhance LLM schema to extract entity metadata
- [ ] Create `generate-threat-intelligence-dashboard.ts` script
- [ ] Create dashboard components in Nuxt
- [ ] Add to pipeline step (Step 7.5 or 8)
- [ ] Test with historical data
- [ ] Document entity enrichment workflow
- [ ] Add to daily-update.sh script

### Future Enhancements

1. **Entity Linking**: Connect entities mentioned across articles even with slight variations
2. **Confidence Scoring**: Track how certain we are about entity metadata
3. **Source Attribution**: Which articles contributed which metadata
4. **Entity Verification**: Manual review/approval workflow for high-value entities
5. **External Enrichment**: Pull data from MITRE ATT&CK, AlienVault OTX, etc.
6. **Graph Database**: Neo4j for complex relationship queries (actor → malware → CVE → product chains)

---

## Notes
- Option 2 is a **superset** of Option 1 - all Option 1 queries still work
- Migration can happen incrementally - old and new schemas coexist
- Dashboard generation is still SSR-compatible (generates static JSON)
- Estimated effort: 3-4 hours for basic implementation, 8-12 hours with LLM enhancements
- Consider after article count exceeds 200-300 for performance benefits

**Date Created:** 2025-10-17
**Status:** Planning - Option 1 in progress first
