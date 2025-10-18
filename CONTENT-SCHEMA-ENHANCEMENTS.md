# Content Generation V2 - Schema Enhancements Summary

**Date:** October 17, 2025  
**Status:** Implemented - Ready for Testing

## Overview
Enhanced the LLM prompt schema to include additional authoritative reference sources and defensive countermeasures for better threat intelligence generation.

## New Features

### 1. IOCs and Cyber Observables (Completed)
- **IOCs**: Article-sourced indicators (IPs, domains, hashes, etc.)
- **Cyber Observables**: LLM-generated detection indicators for YARA/STIX
- **Database Tables**: 
  - `article_iocs`
  - `article_cyber_observables`

### 2. Malpedia Integration (NEW)
Enhanced entity URL guidance to include Malpedia as PRIMARY authoritative source:

**Threat Actors (Malpedia First):**
1. FIRST: Malpedia Actors → `https://malpedia.caad.fkie.fraunhofer.de/actor/{actor_name}`
2. SECOND: MITRE ATT&CK Groups → `https://attack.mitre.org/groups/GXXXX/`
3. THIRD: Wikipedia if notable
4. If none exist, OMIT URL

**Malware Families (Malpedia First):**
1. FIRST: Malpedia Families → `https://malpedia.caad.fkie.fraunhofer.de/details/{family_name}`
2. SECOND: MITRE ATT&CK Software → `https://attack.mitre.org/software/SXXXX/`
3. THIRD: Wikipedia if notable
4. If none exist, OMIT URL

**Tools/Software (MITRE First):**
1. FIRST: MITRE ATT&CK Software → `https://attack.mitre.org/software/SXXXX/`
2. SECOND: Wikipedia for well-known tools
3. THIRD: Official project pages
4. If none exist, OMIT URL

**Rationale:** Malpedia has more comprehensive malware/threat actor coverage (2000+ families, better maintained for emerging threats). MITRE ATT&CK better for legitimate tools used by attackers.

### 3. MITRE D3FEND Integration (NEW)
Added defensive countermeasures framework to provide tactical security recommendations.

**New Schema:**
```typescript
D3FENDCountermeasureSchema = {
  technique_id: string,      // e.g., "D3-PH", "D3-NTA", "D3-AL"
  technique_name: string,    // e.g., "Process Heuristics"
  recommendation: string     // 100-200 word tactical guidance
}
```

**Database Table:** `article_d3fend_countermeasures`

**D3FEND Categories Covered:**
- Harden (D3-H*): Application/Credential/Platform Hardening
- Detect (D3-D*): File/Network/Process/User Behavior Analysis
- Isolate (D3-I*): Execution/Network Isolation
- Deceive (D3-DC*): Decoy Environment/Object
- Evict (D3-E*): Process/Connection Termination
- Restore (D3-R*): File/Configuration Restoration

**Integrated into Sections:**
- Detection & Response sections → Reference D3FEND detection techniques
- Mitigation sections → Map to D3FEND hardening/isolation techniques
- Remediation sections → Include D3FEND countermeasures

## Database Schema Changes

### New Tables
```sql
-- IOCs (article-sourced indicators)
CREATE TABLE article_iocs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- ip_address_v4, domain, file_hash_sha256, etc.
  value TEXT NOT NULL,
  description TEXT,
  source TEXT,
  FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- Cyber Observables (LLM-generated detection indicators)
CREATE TABLE article_cyber_observables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- file_path, registry_key, process_name, etc.
  value TEXT NOT NULL,
  description TEXT NOT NULL,
  context TEXT NOT NULL,        -- Where to look for this
  confidence TEXT NOT NULL,     -- high, medium, low
  FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- D3FEND Countermeasures
CREATE TABLE article_d3fend_countermeasures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  technique_id TEXT NOT NULL,   -- D3-PH, D3-NTA, etc.
  technique_name TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id)
);
```

### Modified Tables
```sql
-- Added entity_url to store MITRE ATT&CK, Malpedia, or other URLs
ALTER TABLE article_entities ADD COLUMN entity_url TEXT;
```

## Files Modified

### Schema Definition
- `scripts/content-generation-v2/news-structured-schema.ts`
  - Added `IOCSchema`, `CyberObservableSchema`, `D3FENDCountermeasureSchema`
  - Enhanced entity URL guidelines with Malpedia sources
  - Added D3FEND references to Detection & Mitigation sections
  - Updated TypeScript types

### Database Migrations
- `scripts/content-generation-v2/migrations/001-add-iocs-and-observables.sql`
- `scripts/content-generation-v2/migrations/002-add-d3fend-countermeasures.sql`

### Insert Script
- `scripts/content-generation-v2/insert-articles.ts`
  - Added `insertArticleIOCs()` function
  - Added `insertArticleCyberObservables()` function
  - Added `insertArticleD3FENDCountermeasures()` function
  - Updated `insertArticleEntities()` to store entity_url
  - Updated dry-run output to show new counts

## Testing Checklist

- [ ] Generate new structured content with enhanced schema
- [ ] Verify Malpedia URLs are included for known malware/actors
- [ ] Verify MITRE ATT&CK URLs still included
- [ ] Verify D3FEND countermeasures are generated (3-8 per article)
- [ ] Verify IOCs extracted from articles
- [ ] Verify cyber observables generated by LLM
- [ ] Check insert script successfully populates all new tables
- [ ] Verify entity URLs stored in article_entities
- [ ] Run full pipeline Steps 3-7
- [ ] Inspect JSON output for new fields
- [ ] Verify links render correctly in articles

## Expected LLM Behavior

### Threat Actor "APT28"
1. Check Malpedia → Include `https://malpedia.caad.fkie.fraunhofer.de/actor/apt28`
2. Check MITRE ATT&CK → Include `https://attack.mitre.org/groups/G0007/`
3. **Use Malpedia as primary** (more comprehensive threat actor coverage)

### Malware "Emotet"
1. Check Malpedia → Include `https://malpedia.caad.fkie.fraunhofer.de/details/emotet`
2. Check MITRE ATT&CK → Include `https://attack.mitre.org/software/S0367/`
3. **Use Malpedia as primary** (2000+ malware families tracked)

### Tool "Mimikatz"
1. Check MITRE ATT&CK → Include `https://attack.mitre.org/software/S0002/`
2. Check Wikipedia → Include if available
3. **Use MITRE ATT&CK as primary** (better for legitimate tools misused by attackers)

### New/Custom Malware "BrandNewRAT"
1. Not in MITRE ATT&CK → Skip
2. Not in Malpedia → Skip
3. Not in Wikipedia → Skip
4. **Correct behavior: OMIT URL** (entity_url = NULL)

### D3FEND for Ransomware Article
Expected countermeasures:
- D3-BA (Backup and Recovery)
- D3-PH (Process Heuristics) 
- D3-FE (File Encryption Detection)
- D3-SBA (System Backup)
- D3-NI (Network Isolation)
- D3-ET (Execution Termination)

## Next Steps

1. **Regenerate 2025-10-16** with enhanced schema:
   ```bash
   npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-16
   ```

2. **Insert with new fields**:
   ```bash
   npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-16
   ```

3. **Complete pipeline** (Steps 4-7):
   ```bash
   npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-16
   npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-16
   npx tsx scripts/content-generation-v2/generate-article-json.ts --date 2025-10-16
   npx tsx scripts/content-generation-v2/generate-indexes.ts
   npx tsx scripts/content-generation-v2/generate-rss.ts
   ```

4. **Inspect results**:
   - Check article JSON files for new fields
   - Verify entity URLs in database
   - Count D3FEND countermeasures generated
   - Review cyber observables quality

## Benefits

### Malpedia Integration
- ✅ More comprehensive entity coverage (Malpedia tracks 2000+ malware families)
- ✅ Better attribution for APT actors not in MITRE ATT&CK
- ✅ Additional authoritative source for threat intelligence
- ✅ Fallback when MITRE ATT&CK doesn't have entry

### MITRE D3FEND Integration
- ✅ Actionable defensive recommendations beyond "apply patches"
- ✅ Standardized defensive technique taxonomy
- ✅ Bridges offensive (ATT&CK) and defensive (D3FEND) frameworks
- ✅ Provides tactical implementation guidance for security teams
- ✅ Enables dashboards showing defensive posture gaps
- ✅ Links offensive techniques to defensive countermeasures

### IOCs and Cyber Observables
- ✅ Separate article-sourced IOCs from LLM-generated observables
- ✅ YARA/STIX-compatible observable types
- ✅ Detection context for each observable (where to look)
- ✅ Confidence scoring for hunting priorities
- ✅ Ready for STIX 2.1 export and YARA rule generation

## Known Limitations

1. **Malpedia URLs** - Based on LLM knowledge cutoff (6 months old)
   - New malware families won't have URLs yet (correct behavior)
   - LLM may use outdated family names (acceptable tradeoff)

2. **D3FEND Coverage** - LLM knowledge of D3FEND may be incomplete
   - Should generate 3-8 countermeasures per article
   - May not know all D3FEND technique IDs
   - Recommendations should still be tactically sound even if technique ID is wrong

3. **Entity URL Format** - Malpedia URLs require specific formatting
   - LLM must convert "APT28" → "apt28" (lowercase)
   - LLM must convert "Lazarus Group" → "lazarus_group" (underscores)
   - May have formatting errors that result in 404s (acceptable)

## Future Enhancements

### Option 2: Entity-Centric Intelligence (See THREAT-INTELLIGENCE-DASHBOARD-PLAN.md)
- Normalize entities into master table
- Track first_seen/last_seen across all articles
- Store aliases for threat actors
- Build entity relationships (actor → malware → CVE)
- Generate threat intelligence dashboard JSON

### STIX 2.1 Export
- Convert cyber_observables to STIX objects
- Export bundles per article or per date
- Support for threat intelligence sharing

### YARA Rule Generation
- Convert hex_pattern/string_pattern observables to YARA rules
- Auto-generate detection rules from high-confidence observables
- Export rule files for EDR/SIEM ingestion

---

**Status:** ✅ Schema updated, database migrated, insert script ready  
**Next:** Test with fresh generation of 2025-10-16 data
