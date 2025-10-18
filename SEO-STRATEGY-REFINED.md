# SEO Strategy - Refined & Simplified

**Created:** 2025-10-17  
**Context:** User feedback on avoiding keyword stuffing and differentiating SEO keywords vs JSON-LD purpose

---

## Core Philosophy

### SEO Keywords = What Humans Search For
**Purpose:** Appear in Google search results for terms people actually type

**Include:**
- ✅ Entity names (APT28, LockBit, Emotet)
- ✅ CVE IDs (CVE-2024-12345) - high search volume
- ✅ Industries (Healthcare, Finance, Manufacturing)
- ✅ Countries (United States, China, Russia)
- ✅ **Source names (Unit 42, Cisco Talos, CrowdStrike)** ← CRITICAL for search mix
- ✅ Category & severity (Ransomware, critical)

**Exclude (move to JSON-LD):**
- ❌ MITRE technique IDs (T1059.001) - too technical, no search volume
- ❌ IOCs (IPs, domains, file hashes) - people don't Google these
- ❌ Cyber observables - internal use only

**Why Source Names Matter:**
> "I'm worried adding IOC too much is long lists... I also wonder if we should put the source names. So if someone's searching for malware on a popular article site like Unit 42 that we could be in that search mix as a result."

**Example Search Benefit:**
- User searches: "Unit 42 ransomware analysis"
- Our article appears because `keywords` includes "Unit 42" + "ransomware" + entity names
- **Result:** We compete in searches for popular security vendor content

---

### JSON-LD = Machine-Readable Context
**Purpose:** Help Google understand entity relationships & provide authority signals

**Include:**
- ✅ Primary entities in "about" field (threat actors, malware, vulns) + Malpedia/MITRE URLs
- ✅ Secondary entities in "mentions" field (companies, products, people)
- ✅ MITRE technique IDs with ATT&CK links (technical context)
- ✅ **Top 10 IOCs ONLY** (capped to avoid bloat)
- ✅ CVE links to NVD

**Benefits:**
- Google Knowledge Graph connections
- Entity disambiguation ("Which APT28?" → Links to Malpedia)
- Authority signals (links to Malpedia, MITRE, NVD)
- Technical context WITHOUT polluting search keywords

---

## Implementation Plan

### Phase 1: Enhanced Keywords (High Priority)

**File:** `composables/useArticleSeo.ts`

```typescript
// Build keywords from SEARCH-FRIENDLY sources only
const keywords = [
  // 1. Original editorial keywords
  ...(article.keywords || []),
  
  // 2. Entity names (threat actors, malware, companies, products)
  ...(article.entities?.map(e => e.name) || []),
  
  // 3. CVE identifiers
  ...(article.cves?.map(cve => cve.id) || []),
  
  // 4. Industries & countries
  ...(article.impact_scope?.industries_affected || []),
  ...(article.impact_scope?.countries_affected || []),
  
  // 5. SOURCE NAMES (CRITICAL - enables "Unit 42 malware" searches)
  // Extract from article metadata or sources array
  ...(article.sources?.map(s => s.name) || []),
  
  // 6. Category & severity
  article.category?.[0],
  article.severity,
  
].filter(Boolean)

// Deduplicate and cap at 40 keywords
const uniqueKeywords = [...new Set(keywords)]
  .slice(0, 40)
  .join(', ')
```

**Schema Change Needed:**
Add `sources` array to article schema with `name` field:
```typescript
sources: z.array(z.object({
  url: z.string(),
  name: z.string(), // "Unit 42", "Cisco Talos", etc.
  published_date: z.string().optional()
}))
```

**Expected Result:**
- 25-40 keywords per article (currently 8-12)
- All search-relevant terms, no technical jargon
- Source names enable vendor-specific search mix

---

### Phase 2: Enhanced JSON-LD (Medium Priority)

**File:** `composables/useArticleSeo.ts`

```typescript
{
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  // ... existing fields ...
  
  // Primary entities (what article is ABOUT)
  about: article.entities
    ?.filter(e => ['threat_actor', 'malware', 'vulnerability'].includes(e.type))
    .slice(0, 3)
    .map(e => ({
      '@type': 'Thing',
      name: e.name,
      url: e.url || undefined, // Malpedia/MITRE URLs
    })),
  
  // Secondary context (what article MENTIONS)
  mentions: [
    // Organizations, products, people
    ...(article.entities
      ?.filter(e => !['threat_actor', 'malware', 'vulnerability'].includes(e.type))
      .map(e => ({
        '@type': e.type === 'company' ? 'Organization' : 'Thing',
        name: e.name,
        url: e.url || undefined,
      })) || []),
    
    // MITRE techniques (technical context not in keywords)
    ...(article.mitre_techniques?.slice(0, 8).map(t => ({
      '@type': 'Thing',
      name: `${t.name} (${t.id})`,
      url: `https://attack.mitre.org/techniques/${t.id.replace('.', '/')}/`,
    })) || []),
    
    // Top 10 IOCs (capped - people don't search these)
    ...(article.iocs?.slice(0, 10).map(ioc => ({
      '@type': 'Thing',
      name: ioc.value,
      description: `Indicator of Compromise (${ioc.type})`,
    })) || []),
  ],
}
```

**Benefits:**
- Entity relationships for Google Knowledge Graph
- Authority signals (Malpedia, MITRE ATT&CK links)
- Technical context (MITRE IDs, limited IOCs) without keyword stuffing

---

### Phase 3: Enhanced Tags (Low Priority)

**Current:** `article.tags` (3-5 basic tags)

**Enhanced:**
```typescript
const articleTags = [
  ...(article.tags || []),
  
  // Entity types (unique)
  ...(new Set(article.entities?.map(e => e.type) || [])),
  
  // IOC types present (unique)
  ...(new Set(article.iocs?.map(ioc => ioc.type) || [])),
  
  // MITRE tactics (unique)
  ...(new Set(article.mitre_techniques?.map(t => t.tactic).filter(Boolean) || [])),
  
  // Geographic scope
  article.impact_scope?.geographic_scope,
].filter(Boolean)
```

**Expected:** 15-20 contextual tags for better categorization

---

## Key Differentiators

| Feature | SEO Keywords | JSON-LD |
|---------|--------------|---------|
| **Purpose** | Human search terms | Machine context |
| **MITRE IDs** | ❌ No (too technical) | ✅ Yes (context) |
| **IOCs** | ❌ No (no search volume) | ✅ Top 10 only |
| **Entity Names** | ✅ Yes (high search) | ✅ Yes (relationships) |
| **Source Names** | ✅ Yes (search mix) | ❌ No (not relevant) |
| **CVE IDs** | ✅ Yes (high search) | ✅ Yes (with NVD links) |
| **Industries** | ✅ Yes (targeting) | ❌ No (not schema.org) |

---

## Expected Outcomes

**Search Discoverability:**
- ✅ "APT28 attack" → Entity name in keywords
- ✅ "CVE-2024-12345 exploit" → CVE ID in keywords
- ✅ "healthcare ransomware" → Industry + category in keywords
- ✅ **"Unit 42 malware analysis"** → Source name + entity in keywords ← NEW!
- ❌ "192.168.1.1 malware" → NOT in keywords (IOCs in JSON-LD only)

**Authority Signals:**
- Links to Malpedia (malware database)
- Links to MITRE ATT&CK (industry taxonomy)
- Links to NVD (vulnerability database)
- Entity disambiguation for Google Knowledge Graph

**Keyword Density:**
- Before: 8-12 keywords (basic editorial)
- After: 25-40 keywords (search-optimized)
- Improvement: 2-3x increase WITHOUT technical jargon

**SEO Health:**
- No keyword stuffing (capped at 40, deduplicated)
- All terms have real search volume
- Technical identifiers isolated to JSON-LD
- Source attribution enables vendor search mix

---

## Next Steps

1. ✅ **Schema Update:** Add `sources[].name` field to capture "Unit 42", "Cisco Talos", etc.
2. ⏳ **Implement Phase 1:** Enhanced keywords in `useArticleSeo.ts`
3. ⏳ **Implement Phase 2:** Enhanced JSON-LD with entity linking
4. ⏳ **Test:** Generate articles and verify meta tags
5. ⏳ **Validate:** Google Rich Results Test, Twitter Card Validator

---

## User Feedback Addressed

> "I don't think anyone puts an IP address or a domain name or a file name into Google expecting results."

**Solution:** IOCs excluded from SEO keywords, capped at 10 in JSON-LD for context only.

> "I'm worried about too much tags for SEO so some of these could really blow that out and destroy the credibility for SEO page rankings."

**Solution:** Keywords capped at 40, deduplicated, only search-relevant terms included.

> "I also wonder if we should put the source names. So if someone's searching for malware on a popular article site like Unit 42 that we could be in that search mix."

**Solution:** Source names added to keywords strategy - enables "Unit 42 ransomware" search mix.

> "Definitely malware ones and threat actors should be in there."

**Solution:** Entity names prioritized in keywords, plus Malpedia/MITRE links in JSON-LD.

> "I'm just trying to differentiate this SEO keywords to the JSON-LD and its purpose for each."

**Solution:** Clear separation - Keywords = human search terms, JSON-LD = machine context + authority signals.
