# SEO Source Names Implementation

**Date:** 2025-10-17  
**Status:** ✅ Complete - Ready for Testing

---

## Summary

Added friendly brand/publication names to source schema and integrated into SEO keywords to enable "Unit 42 malware" style searches.

---

## Changes Made

### 1. Schema Update (`scripts/content-generation-v2/news-structured-schema.ts`)

**Added `name` field with detailed guidance:**

```typescript
export const SourceSchema = z.object({
  url: z.string().describe("Source URL - full article URL"),
  title: z.string().describe("Source article title"),
  name: z.string().optional().describe(`Optional: FRIENDLY brand/publication name for SEO (e.g., 'The Hacker News', 'BleepingComputer', 'Unit 42', 'Cisco Talos', 'CrowdStrike', 'Mandiant', 'SecurityWeek', 'Dark Reading').
    
    IMPORTANT: Use recognizable BRAND NAMES that people search for, NOT domain names.
    Examples:
    - thehackernews.com → "The Hacker News"
    - bleepingcomputer.com → "BleepingComputer"
    - unit42.paloaltonetworks.com → "Unit 42"
    - blog.talosintelligence.com → "Cisco Talos"
    - www.crowdstrike.com/blog → "CrowdStrike"
    - cloud.google.com/blog/topics/threat-intelligence → "Google Threat Intelligence"
    - securityaffairs.com → "Security Affairs"
    - darkreading.com → "Dark Reading"`),
  website: z.string().optional().describe("Optional: Source website domain for backward compatibility (e.g., 'bleepingcomputer.com', 'thehackernews.com')"),
  date: z.string().optional().describe("Optional: Original publication date from source in YYYY-MM-DD format if available")
});
```

**Key Points:**
- ✅ `name` field is **optional** - backward compatible
- ✅ `website` field **kept** for existing data
- ✅ Comprehensive examples guide LLM to use brand names, not domains

---

### 2. Type Definitions (`types/cyber.ts`)

**Updated `ArticleSource` interface:**

```typescript
export interface ArticleSource {
  source_id: string
  url: string
  title: string
  name?: string         // Friendly brand name (e.g., "Unit 42", "The Hacker News")
  website?: string      // Source domain (backward compatibility)
  root_url: string
  source_date?: string  // Format: MM/DD/YYYY
  date?: string         // ISO format date (YYYY-MM-DD)
}
```

**Updated `Source` interface:**

```typescript
export interface Source {
  url: string                        // Source URL
  title: string                      // Source title
  name?: string                      // Friendly brand/publication name
  website?: string                   // Source domain - backward compatibility
  date?: string                      // Publication date (YYYY-MM-DD)
}
```

---

### 3. UI Display (`pages/articles/[slug].vue`)

**Updated source display to prioritize `name`:**

```vue
<div class="text-sm text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
  <span>{{ source.name || source.website || source.root_url || extractDomain(source.url) }}</span>
  <!-- ... date display ... -->
</div>
```

**Fallback chain:**
1. `source.name` (friendly brand name) ← PRIORITY
2. `source.website` (domain name) ← backward compatibility
3. `source.root_url` (legacy field)
4. `extractDomain(source.url)` (last resort)

---

### 4. SEO Keywords (`composables/useArticleSeo.ts`)

**Enhanced keyword generation:**

```typescript
// Build enhanced keywords from multiple sources (SEARCH-FRIENDLY ONLY)
const keywordArray = [
  // 1. Original editorial keywords
  ...(article.keywords || []),
  
  // 2. Entity names (threat actors, malware, companies, products)
  ...(article.entities?.map(e => e.name) || []),
  
  // 3. CVE identifiers (high search volume)
  ...(article.cves?.map(cve => typeof cve === 'string' ? cve : cve.id) || []),
  
  // 4. Source brand names (enables "Unit 42 malware" searches) ← NEW!
  ...(article.sources?.map(s => s.name).filter(Boolean) || []),
  
  // 5. Industries & countries
  ...(article.impact_scope?.industries_affected || []),
  ...(article.impact_scope?.countries_affected || []),
  
  // 6. Category & severity
  article.category?.[0],
  article.severity,
].filter(Boolean)

// Deduplicate and cap at 40 keywords to avoid keyword stuffing
const enhancedKeywords = [...new Set(keywordArray)]
  .slice(0, 40)
  .join(', ')
```

**Applied to:**
- ✅ `<meta name="keywords">` tag
- ✅ JSON-LD NewsArticle `keywords` field

---

## Expected Outcomes

### SEO Search Discoverability

**Before:**
- Keywords: 8-12 per article (just `article.keywords`)
- Source visibility: None (sources not in keywords)

**After:**
- Keywords: 25-40 per article (comprehensive, search-optimized)
- Source visibility: ✅ Enabled

**New Search Opportunities:**

| User Search Query | Will Match Article With |
|-------------------|-------------------------|
| "Unit 42 ransomware analysis" | `keywords` includes "Unit 42" + "ransomware" + entity names |
| "Cisco Talos APT28" | `keywords` includes "Cisco Talos" + "APT28" |
| "CrowdStrike malware report" | `keywords` includes "CrowdStrike" + malware entities |
| "The Hacker News CVE-2024-1234" | `keywords` includes "The Hacker News" + "CVE-2024-1234" |

**Benefit:** Your articles appear in searches for popular security vendor content! 🚀

---

## Testing Plan

### 1. Generate Fresh Content

```bash
# Run Step 2 with enhanced schema
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-17

# Check if source.name is populated
cat tmp/news-structured_2025-10-17_*.json | jq '.articles[0].sources[] | {name, website, url}' | head -20
```

**Expected Result:**
```json
{
  "name": "The Hacker News",
  "website": "thehackernews.com",
  "url": "https://thehackernews.com/..."
}
{
  "name": "Unit 42",
  "website": "unit42.paloaltonetworks.com",
  "url": "https://unit42.paloaltonetworks.com/..."
}
```

### 2. Run Full Pipeline

```bash
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-17
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-17
npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-17
npx tsx scripts/content-generation-v2/generate-article-json.ts --date 2025-10-17
```

### 3. Verify SEO Keywords

```bash
# Generate static site
npm run generate

# Check meta keywords in HTML
grep -A 2 'name="keywords"' .output/public/articles/*/index.html | head -20
```

**Expected:** Keywords should include source brand names like "Unit 42", "Cisco Talos", etc.

### 4. Verify UI Display

**Start dev server and check article page:**
- Source names should show brand names (e.g., "The Hacker News")
- NOT domain names (e.g., "thehackernews.com")
- Legacy articles should still work (fallback to `website` field)

### 5. Validate JSON-LD

**Use Google Rich Results Test:**
- URL: https://search.google.com/test/rich-results
- Paste article HTML
- Verify `keywords` field includes source names

---

## Backward Compatibility

✅ **Fully backward compatible:**
- Old articles without `name` field → Falls back to `website` → Falls back to domain extraction
- No database migrations needed (JSON field addition)
- No breaking changes to existing code

---

## Files Modified

1. ✅ `scripts/content-generation-v2/news-structured-schema.ts` - Added `name` field with guidance
2. ✅ `types/cyber.ts` - Updated `ArticleSource` and `Source` interfaces
3. ✅ `pages/articles/[slug].vue` - Updated UI to prioritize `name` field
4. ✅ `composables/useArticleSeo.ts` - Added source names to keyword generation

---

## Next Steps

1. ⏳ Run Step 2 to generate content with new schema
2. ⏳ Verify source names are brand-friendly (not domain names)
3. ⏳ Complete pipeline steps 3-7
4. ⏳ Validate enhanced keywords in generated HTML
5. ⏳ Test Google Rich Results with enhanced JSON-LD

---

## Related Documentation

- `SEO-STRATEGY-REFINED.md` - Complete SEO enhancement strategy
- `SEO-ENHANCEMENTS-V3.md` - Original comprehensive SEO recommendations
- `CONTENT-SCHEMA-ENHANCEMENTS.md` - IOCs, cyber observables, D3FEND, Malpedia integration

---

## User Feedback Addressed

> "I also wonder if we should put the source names. So if someone's searching for malware on a popular article site like Unit 42 that we could be in that search mix as a result."

**Solution:** ✅ Implemented
- Added `name` field to source schema
- Integrated source names into SEO keywords
- Enables "Unit 42 malware analysis" searches to find our articles

> "Ok add the name (friendly SEO searchable name) to schema but keep the other one for backward compatibility (source domain)"

**Solution:** ✅ Implemented
- `name` = Friendly brand name for SEO
- `website` = Domain name (kept for backward compatibility)
- Both optional, UI falls back gracefully
