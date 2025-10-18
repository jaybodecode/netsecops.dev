# RSS Alignment Plan

## Overview
Fix RSS feed generation and page alignment issues. Move all RSS files to `/rss/` folder, align categories across schema/script/page, and implement article-based feeds with proper descriptions.

## Current Issues

### 1. File Location Mismatch
- **Generated:** `rss.xml` in root, `rss/daily.xml`, `rss/categories/*.xml`
- **Page Expects:** `rss/all.xml`, `rss/updates.xml`, `rss/categories/*.xml`
- **Result:** Main feed URL broken, missing updates feed

### 2. Category Misalignment
- **Schema (Authoritative):** 19 categories
- **Script Generates:** 17 categories (missing some schema categories)
- **Page Expects:** 13 categories (missing many schema categories, has invalid ones)
- **Result:** Broken category links, inconsistent filtering

### 3. Feed Content Issues
- **Current:** Publication-based feeds (nested structure not RSS-compatible)
- **Needed:** Article-based feeds (flat RSS structure)
- **Missing:** Proper descriptions and metadata

## Required Changes

### Phase 1: Category Alignment
**Goal:** All three sources use identical 19 categories from schema enum

**Files to Update:**
- `scripts/content-generation-v2/generate-rss.ts` - Update category generation logic
- `pages/rss.vue` - Update category list to match schema exactly

**Categories (from schema enum):**
```
'Ransomware', 'Malware', 'Threat Actor', 'Vulnerability', 'Data Breach',
'Phishing', 'Supply Chain Attack', 'Cyberattack', 'Industrial Control Systems',
'Cloud Security', 'Mobile Security', 'IoT Security', 'Patch Management',
'Threat Intelligence', 'Incident Response', 'Security Operations',
'Policy and Compliance', 'Regulatory', 'Other'
```

### Phase 2: RSS Structure Changes
**Goal:** Move to article-based feeds, relocate files to `/rss/` folder

**Script Changes (`generate-rss.ts`):**
- Change main feed from `rss.xml` → `rss/all.xml`
- Implement article-based RSS generation (not publication-based)
- Add 3-day limit (up to 30 articles) for main feed
- Add 20-article limit for category feeds
- Remove publication-level descriptions, use article-level content
- Ensure all files output to `/rss/` folder

**Page Changes (`rss.vue`):**
- Update main feed URL: `rss/all.xml`
- Remove or implement `rss/updates.xml` feed
- Add proper descriptions for all feeds
- Update category URLs to match new slugs

### Phase 3: Content & Descriptions
**Goal:** Add meaningful descriptions and metadata

**Feed Descriptions to Add:**
- **All Articles:** "Latest cybersecurity threat intelligence articles from the past 3 days"
- **Category Feeds:** "Latest [Category] threat intelligence and analysis"
- **Daily Feed:** "Daily cybersecurity threat briefings and digests"

**Metadata to Include:**
- Article count and date range
- Last update timestamp
- Feed update frequency
- Clear descriptions of content

### Phase 4: Testing & Validation
**Goal:** Ensure all feeds work correctly

**Tests Needed:**
- All RSS URLs accessible
- Feed validation (proper XML structure)
- Category filtering accuracy
- Content freshness (3-day limit)
- Page displays correct URLs and descriptions

## Implementation Order

1. **Category Alignment** (Phase 1)
   - Update RSS script categories
   - Update page categories
   - Test category generation

2. **RSS Structure** (Phase 2)
   - Modify script for article-based feeds
   - Change file output locations
   - Update page URLs

3. **Content & Descriptions** (Phase 3)
   - Add feed descriptions
   - Update metadata
   - Enhance page content

4. **Testing** (Phase 4)
   - Validate all feeds
   - Test page functionality
   - Verify category links

## Success Criteria

- ✅ All RSS files in `/rss/` folder
- ✅ Main feed at `rss/all.xml` (not root)
- ✅ All 19 categories match schema exactly
- ✅ Article-based feeds (not publication-based)
- ✅ 3-day content limit (up to 30 articles)
- ✅ Proper descriptions on RSS page
- ✅ All feed URLs functional
- ✅ Page and generated feeds aligned

## Files to Modify

1. `scripts/content-generation-v2/generate-rss.ts`
2. `pages/rss.vue`
3. Test generation and page functionality

## Risk Assessment

- **Low Risk:** Category alignment (cosmetic changes)
- **Medium Risk:** RSS structure changes (affects feed consumers)
- **Low Risk:** File relocation (internal change)
- **Low Risk:** Description updates (UI improvements)

## Rollback Plan

- Keep backup of original files
- Test in development before production
- Monitor RSS feed consumption after changes
- Have original URLs redirect if needed</content>
<parameter name="filePath">/Users/admin/cybernetsec-io/RSS-ALIGNMENT-PLAN.md