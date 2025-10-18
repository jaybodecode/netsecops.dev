# RSS Alignment Plan

## Overview
Fix RSS feed generation a### Phase 3: Content & Descriptions
**Goal:** Add meaningful descriptions and metadata

**Feed Descriptions to Add:**
- **All Articles:** "Latest cybersecurity threat intelligence articles from the past 3 days (up to 30 articles)"
- **Category Feeds:** "Latest [Category] threat intelligence from the past 3 days (up to 20 articles)"
- **Updates Feed:** "Recently updated cybersecurity threat intelligence articles (last 10 updates)"

**Database Queries:**
- **All Articles:** `SELECT * FROM published_articles WHERE original_pub_date >= date('now', '-3 days') ORDER BY original_pub_date DESC LIMIT 30`
- **Category Articles:** `SELECT * FROM published_articles WHERE category = ? AND original_pub_date >= date('now', '-3 days') ORDER BY original_pub_date DESC LIMIT 20`
- **Updates:** `SELECT * FROM published_articles WHERE is_update = 1 ORDER BY original_pub_date DESC LIMIT 10`

**Metadata to Include:**
- Article count and date range
- Last update timestamp
- Feed update frequency
- Clear descriptions of contentment issues. Move all RSS files to `/rss/` folder, align categories across schema/script/page, and implement article-based feeds with proper descriptions.

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
- **All Articles Feed:** Last 3 days of articles (up to 30), ordered by `original_pub_date DESC`
- **Category Feeds:** Last 20 articles from last 3 days for each category, ordered by `original_pub_date DESC`
- **Updates Feed:** Last 10 articles where `is_update = 1`, ordered by `original_pub_date DESC`
- Remove publication-level descriptions, use article-level content
- Ensure all files output to `/rss/` folder
- **NOTE:** The old "all publications" feed can be repurposed or removed since we're moving to article-based feeds

**Page Changes (`rss.vue`):**
- Update main feed URL: `rss/all.xml`
- Implement `rss/updates.xml` feed (last 10 updated articles)
- Add proper descriptions for all feeds with correct numbers
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

## Risk Assessment

### **Low Risk Changes:**
- **Category alignment:** Purely internal changes, no breaking changes for users
- **File relocation:** Internal path changes, existing URLs can redirect
- **Description updates:** UI improvements, no functional impact

### **Medium Risk Changes:**
- **Article-based feeds:** Changes RSS content structure - RSS consumers may need to adapt
- **Feed limits (3 days, 30 articles):** Reduces content volume - may affect user expectations
- **Updates feed:** New feed type, but optional for existing users

### **High Risk Considerations:**
- **Breaking change for RSS consumers:** Current publication-based feeds will change to article-based
- **URL changes:** `rss.xml` → `rss/all.xml` breaks existing bookmarks
- **Content reduction:** From unlimited publications to 3-day article limits

### **Mitigation Strategies:**
1. **No URL redirects needed** - New site, no existing users
2. **Feed versioning:** Keep old structure available during transition if needed
3. **Testing:** Validate all feeds work before deployment
4. **Rollback plan:** Ability to revert to old structure if needed

## Detailed Implementation Analysis

### **Current Script Analysis (`generate-rss.ts`)**

**Current Structure (Publication-Based):**
- Queries `publications` table for main content
- Uses `getPublicationArticlesWithCategories()` to get article metadata from `structured_news` JSON
- Generates RSS items from publications with nested article summaries
- Categories derived from publication articles via complex JSON parsing

**Required Changes:**
1. **Replace publication queries with article queries:**
   - `getPublications()` → `getArticles()` (last 3 days, limit 30)
   - `getPublicationArticlesWithCategories()` → `getArticleCategories()` (direct from published_articles)
   - Remove `findArticleMetaInStructuredNews()` dependency

2. **New article-based functions needed:**
   ```typescript
   // Get articles from last 3 days
   function getRecentArticles(limit?: number): PublishedArticle[]
   
   // Get articles by category from last 3 days  
   function getArticlesByCategory(category: string, limit?: number): PublishedArticle[]
   
   // Get updated articles
   function getUpdatedArticles(limit?: number): PublishedArticle[]
   ```

3. **Update RSS item generation:**
   - Change from publication titles/links to article titles/links
   - Update descriptions to use article content instead of publication summaries
   - Update categories to use article categories directly

4. **File output changes:**
   - `rss.xml` → `rss/all.xml`
   - Remove daily feed (or repurpose)
   - Update category feed generation

### **Current Page Analysis (`rss.vue`)**

**Current Issues:**
- Expects `rss/all.xml` but script generates `rss.xml`
- Has `rss/updates.xml` but script doesn't generate it
- Category list doesn't match schema (13 vs 19 categories)
- Descriptions don't reflect new limits

**Required Changes:**
1. **Update feed URLs:**
   - Change "All Publications" to "All Articles" with `/rss/all.xml`
   - Add "Updates" feed with `/rss/updates.xml`
   - Update category URLs to match schema slugs

2. **Update category array:**
   - Replace hardcoded array with schema-based categories
   - Update descriptions to reflect "last 3 days, up to 20 articles"

3. **Update descriptions:**
   - "All Articles: Latest cybersecurity threat intelligence articles from the past 3 days (up to 30 articles)"
   - "Updates: Recently updated cybersecurity threat intelligence articles (last 10 updates)"
   - Category feeds: "Latest [Category] threat intelligence from the past 3 days (up to 20 articles)"

### **Database Query Changes**

**Current Queries (Publication-Based):**
```sql
-- Get publications
SELECT * FROM publications WHERE 1=1 ORDER BY pub_date DESC LIMIT ?

-- Get publication articles (complex JSON parsing)
SELECT pa.id as article_id FROM published_articles pa
JOIN publication_articles pap ON pa.id = pap.article_id
WHERE pap.publication_id = ?
```

**New Queries (Article-Based):**
```sql
-- Get recent articles (last 3 days)
SELECT * FROM published_articles 
WHERE original_pub_date >= date('now', '-3 days')
ORDER BY original_pub_date DESC LIMIT 30

-- Get articles by category (last 3 days)
SELECT pa.* FROM published_articles pa
WHERE pa.category LIKE ? 
AND pa.original_pub_date >= date('now', '-3 days')
ORDER BY pa.original_pub_date DESC LIMIT 20

-- Get updated articles
SELECT * FROM published_articles 
WHERE is_update = 1
ORDER BY original_pub_date DESC LIMIT 10
```

### **Category Mapping**

**Schema Categories (19):**
```
'Ransomware', 'Malware', 'Threat Actor', 'Vulnerability', 'Data Breach',
'Phishing', 'Supply Chain Attack', 'Cyberattack', 'Industrial Control Systems',
'Cloud Security', 'Mobile Security', 'IoT Security', 'Patch Management',
'Threat Intelligence', 'Incident Response', 'Security Operations',
'Policy and Compliance', 'Regulatory', 'Other'
```

**Current Page Categories (13 - needs update):**
- Missing: Cyberattack, Industrial Control Systems, Mobile Security, Patch Management, Threat Intelligence, Incident Response, Security Operations, Policy and Compliance, Regulatory, Other
- Extra: zero-day, apt, ddos, insider-threat (not in schema)

**Slug Generation:**
- Schema categories → kebab-case slugs (e.g., 'Threat Actor' → 'threat-actor')
- Must match between script generation and page expectations

## Deployment Strategy

### **Option A: Immediate Cutover (Recommended)**
- Deploy all changes at once
- Add URL redirects for backward compatibility
- Monitor RSS feed consumption for issues

### **Option B: Gradual Rollout**
- Deploy category alignment first (no breaking changes)
- Deploy RSS structure changes with old feeds still available
- Phase out old feeds after user migration

### **Rollback Plan:**
1. **Immediate rollback:** Revert git changes if critical issues
2. **Partial rollback:** Keep new feeds but restore old feed URLs
3. **Data integrity:** No data changes, only feed generation logic

## Success Metrics

- ✅ All RSS feeds generate without errors
- ✅ All feed URLs return HTTP 200
- ✅ XML validation passes for all feeds
- ✅ Page displays correct URLs and descriptions
- ✅ Category counts match between generation and page
- ✅ No broken links or missing content
- ✅ Feed consumers can adapt to new structure

## Timeline Estimate

- **Phase 1:** 45 minutes
- **Phase 2:** 90 minutes  
- **Phase 3:** 30 minutes
- **Phase 4:** 45 minutes
- **Total:** ~3.5 hours
- **Buffer:** +1 hour for unexpected issues

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