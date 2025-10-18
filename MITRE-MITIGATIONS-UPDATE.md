# MITRE Mitigations Schema Update

## Changes Made

### 1. Updated Zod Schema (`news-structured-schema.ts`)

Added new `MITREMitigationSchema` to capture MITRE ATT&CK Mitigations (M####):

```typescript
export const MITREMitigationSchema = z.object({
  id: z.string().describe("MITRE ATT&CK Mitigation ID in format M#### (e.g., M0801, M1047, M1032)"),
  name: z.string().describe("Friendly name of the mitigation"),
  domain: z.enum(['enterprise', 'ics', 'mobile']).optional().describe("MITRE domain"),
  description: z.string().optional().describe("How this mitigation applies to the threat")
});
```

### 2. Added to Article Schema

Articles now include:
- `mitre_techniques[]` - Attacker techniques (T####)
- **`mitre_mitigations[]`** - NEW: Defensive mitigations (M####)
- `d3fend_countermeasures[]` - D3FEND defensive techniques (D3-*)

### 3. Database Compatibility

**No database schema changes required!** ✅

The `structured_news` table stores the complete article as JSON in the `data` column, so mitigations are automatically included when saved.

## MITRE ATT&CK Mitigation Resources

### Enterprise Mitigations
- URL: https://attack.mitre.org/mitigations/enterprise/
- IDs: M0800-M1056
- Scope: General IT systems, corporate networks

### ICS Mitigations  
- URL: https://attack.mitre.org/mitigations/ics/
- IDs: M0800-M0948
- Scope: Industrial Control Systems, SCADA, OT environments
- **Note**: Many IDs overlap with Enterprise (e.g., M0801 exists in both domains)

### Mobile Mitigations
- URL: https://attack.mitre.org/mitigations/mobile/
- IDs: M1000-M1014
- Scope: Mobile devices, iOS/Android

## Common MITRE Mitigations (LLM Knowledge Examples)

### Enterprise
- **M0801**: Antivirus/Antimalware
- **M1047**: Audit (logging and monitoring)
- **M1032**: Multi-factor Authentication
- **M1049**: Antivirus/Antimalware (endpoint protection)
- **M1030**: Network Segmentation
- **M1026**: Privileged Account Management
- **M1017**: User Training
- **M1051**: Update Software (patching)
- **M1018**: User Account Management
- **M1037**: Filter Network Traffic
- **M1042**: Disable or Remove Feature or Program

### ICS
- **M0800**: Access Management
- **M0801**: Antivirus/Antimalware
- **M0802**: Communication Authenticity
- **M0804**: Human User Authentication
- **M0807**: Network Allowlists/Denylists
- **M0813**: Software Process and Device Authentication
- **M0937**: Filter Network Traffic
- **M0948**: Application Isolation and Sandboxing

## LLM Prompt Guidance

The schema now instructs the LLM to:

1. **Identify MITRE Techniques** from article content (T####)
2. **Generate MITRE Mitigations** based on techniques and expert knowledge (M####)
3. Only include mitigations the LLM knows exist in MITRE ATT&CK
4. Prioritize mitigations that directly address identified techniques
5. Consider both tactical (immediate) and strategic (long-term) controls
6. Use optional `description` field to explain mitigation applicability

## Next Steps

### Immediate (Working Now)
- ✅ LLM generates mitigations in structured output
- ✅ Mitigations saved to database automatically
- ⏳ Need to render mitigations in article page UI

### Future (Planned)
1. **Create Mitigation Mapping File**: `public/data/mitre-mitigation-details.json`
   - Map M#### → Full description, URL, related techniques
   - Source from official MITRE ATT&CK data

2. **Create Mitigation-to-D3FEND Mapper**: `composables/useMitigationToD3FEND.ts`
   - Map M#### → D3FEND defensive techniques (D3-*)
   - Render D3FEND section on article pages
   - Generate markdown table with links

3. **Update Article Page**: `pages/articles/[slug].vue`
   - Add "MITRE Mitigations" card section (after Techniques, before D3FEND)
   - Link to official MITRE pages: `https://attack.mitre.org/mitigations/M####/`
   - Style similarly to existing MITRE Techniques section

4. **Extend Article Entity Indexing**: `schema-article-entities.ts`
   - Add mitigation indexing for search/filtering
   - Track most common mitigations across articles

## Example Output Structure

```json
{
  "mitre_techniques": [
    {
      "id": "T1190",
      "name": "Exploit Public-Facing Application",
      "tactic": "Initial Access"
    }
  ],
  "mitre_mitigations": [
    {
      "id": "M1051",
      "name": "Update Software",
      "domain": "enterprise",
      "description": "Apply security patches immediately to close known vulnerabilities"
    },
    {
      "id": "M1050",
      "name": "Exploit Protection",
      "domain": "enterprise",
      "description": "Enable ASLR, DEP, and other exploit mitigation technologies"
    },
    {
      "id": "M1030",
      "name": "Network Segmentation",
      "domain": "enterprise",
      "description": "Isolate public-facing applications from internal networks"
    }
  ]
}
```

## Testing

To test the new schema:

```bash
# Generate structured news with mitigations
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-17 --logtodb

# Check output includes mitre_mitigations array
cat tmp/news-structured_2025-10-17_*.json | jq '.articles[0].mitre_mitigations'
```

## References

- MITRE ATT&CK Enterprise: https://attack.mitre.org/mitigations/enterprise/
- MITRE ATT&CK ICS: https://attack.mitre.org/mitigations/ics/
- MITRE ATT&CK Mobile: https://attack.mitre.org/mitigations/mobile/
- MITRE D3FEND: https://d3fend.mitre.org/
