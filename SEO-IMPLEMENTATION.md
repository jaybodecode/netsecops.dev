# SEO Implementation Guide

**Last Updated:** October 17, 2025  
**Status:** Articles ✅ Complete | Publications ✅ Complete | Static Pages ⏳ Pending

---

## Overview

This project uses **composable-based SEO** to generate meta tags and JSON-LD structured data for all pages. Each page type has its own dedicated composable.

---

## Composables

### 1. `useArticleSeo.ts` - Article Detail Pages ✅

**Location:** `/composables/useArticleSeo.ts`  
**Usage:** `useArticleSeo(article.value)`  
**Schema:** NewsArticle JSON-LD

**Handles:**
- Article headline, description, keywords
- Publication dates (pub_date, updatedAt)
- Category, tags, severity
- CVEs, MITRE techniques, entities
- Author information

### 2. `usePublicationSeo.ts` - Publication Detail Pages ✅

**Location:** `/composables/usePublicationSeo.ts`  
**Usage:** `usePublicationSeo(publication.value)`  
**Schema:** Report JSON-LD

**Handles:**
- Publication headline, summary
- Publication date (pub_date)
- Article count
- Publication type (daily/weekly/monthly)

### 3. `usePageSeo.ts` - Static Pages ⏳ TODO

**Location:** `/composables/usePageSeo.ts` (not yet created)  
**Usage:** `usePageSeo({ title, description, type })`  
**Schema:** WebPage, CollectionPage, or ItemList JSON-LD

**Will handle:**
- Index pages (articles list, publications list)
- Static pages (home, RSS, about, etc.)
- Custom page-specific metadata

---

## Meta Tag Strategy

### Open Graph (Facebook/LinkedIn)
- ✅ `og:title` - **POPULATED** with content title
- ✅ `og:description` - Content description
- ✅ `og:image` - Absolute URL (https://cyber.netsecops.io/images/og-image/{slug}.png)
- ✅ `og:image:alt` - Descriptive alt text
- ✅ `og:type` - "article" or "website"

### Twitter Cards
- ✅ `twitter:card` - "summary_large_image"
- ✅ `twitter:site` - "@CyberNetSec"
- ✅ `twitter:creator` - "@CyberNetSec"
- ✅ `twitter:title` - **EMPTY** (by design - image contains title)
- ✅ `twitter:description` - Content description
- ✅ `twitter:image` - Same as og:image
- ✅ `twitter:image:alt` - Descriptive alt text

**Why twitter:title is empty:** The OG card images already contain the title text within the image design, so no additional text title is needed.

---

## Implementation Pattern

### Step 1: Create Composable

```typescript
// composables/useYourSeo.ts
import type { YourType } from '~/types/cyber'

export function useYourSeo(item: YourType | null | undefined) {
  if (!item) return
  
  const config = useRuntimeConfig()
  const canonicalUrl = `${config.public.siteUrl}/path/${item.slug}`
  const ogImageUrl = `${config.public.siteUrl}/images/og-image/${item.slug}.png`
  const imageAltText = `${item.title} - Description`
  
  useSeoMeta({
    title: `${item.title} | CyberNetSec.io`,
    description: item.description,
    
    // Open Graph
    ogTitle: item.title,
    ogDescription: item.description,
    ogType: 'article',
    ogUrl: canonicalUrl,
    ogImage: ogImageUrl,
    ogImageAlt: imageAltText,
    
    // Twitter
    twitterCard: 'summary_large_image',
    twitterSite: '@CyberNetSec',
    twitterCreator: '@CyberNetSec',
    twitterTitle: '', // EMPTY by design
    twitterDescription: item.description,
    twitterImage: ogImageUrl,
    twitterImageAlt: imageAltText,
  })
  
  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
    script: [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'YourSchemaType',
        // ... schema fields
      })
    }]
  })
}
```

### Step 2: Use in Page Component

```vue
<script setup lang="ts">
const { data: item } = useYourData()

// SEO - single line
useYourSeo(item.value)
</script>
```

### Step 3: Verify

```bash
# Build static site
npm run generate

# Check generated HTML
grep '<meta property="og:title"' .output/public/path/*/index.html
```

---

## Architecture Principles

### 1. Composables, Not Components
- Meta tags are **logic**, not UI
- Use Nuxt's `useSeoMeta()` and `useHead()`
- Auto-imported, type-safe, no props drilling

### 2. Separate Composables per Page Type
- `useArticleSeo` - Articles only
- `usePublicationSeo` - Publications only
- `usePageSeo` - Static/index pages only
- **Why:** Type safety, separation of concerns, easier maintenance

### 3. Direct Field Mapping
- No fallback chains (schema guarantees fields exist)
- Simple: `ogTitle: article.headline` not `ogTitle: article.og_title || article.headline || article.title || ''`

### 4. Absolute URLs
- Always use `${config.public.siteUrl}/path/to/resource`
- Never use relative URLs for og:image or twitter:image

### 5. Descriptive Alt Text
- Always provide meaningful alt text for images
- Format: `${content.title} - Context description`

---

## Files Modified

### Composables Created
- ✅ `/composables/useArticleSeo.ts` (123 lines)
- ✅ `/composables/usePublicationSeo.ts` (148 lines)
- ⏳ `/composables/usePageSeo.ts` (pending)

### Pages Refactored
- ✅ `/pages/articles/[slug].vue` - Uses `useArticleSeo()`
- ✅ `/pages/publications/[slug].vue` - Uses `usePublicationSeo()`
- ⏳ `/pages/articles/index.vue` - Needs `usePageSeo()`
- ⏳ `/pages/publications/index.vue` - Needs `usePageSeo()`
- ⏳ `/pages/index.vue` - Needs `usePageSeo()`
- ⏳ `/pages/rss.vue` - Needs `usePageSeo()`

---

## Phase 3: Static/Index Pages - COMPLETE ✅

### Implementation (October 17, 2025)

Created `composables/usePageSeo.ts` for static and index pages:
- Handles both `WebPage` and `CollectionPage` schema types
- Accepts `PageSeoConfig` interface with flexible options
- Generates Open Graph, Twitter Card, and JSON-LD tags

**Pages Updated:**
- `pages/index.vue` - Home page (WebPage schema)
- `pages/articles/index.vue` - Articles listing (CollectionPage schema)
- `pages/publications/index.vue` - Publications listing (CollectionPage schema)
- `pages/rss.vue` - RSS subscriptions page (WebPage schema)

**Verification:**
Static build completed successfully with 198 routes prerendered. All meta tags confirmed in generated HTML files.

## TODO: Phase 4 - External Validation

Once all pages are deployed, validation is needed with external tools:
- Twitter Card Validator (https://cards-dev.twitter.com/validator)
- Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/)
- LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/)
- Google Rich Results Test (https://search.google.com/test/rich-results)

---

## Validation Tools

- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **Facebook Debugger:** https://developers.facebook.com/tools/debug/
- **LinkedIn Inspector:** https://www.linkedin.com/post-inspector/
- **Google Rich Results:** https://search.google.com/test/rich-results

---

## Schema.org Resources

- **NewsArticle:** https://schema.org/NewsArticle
- **Report:** https://schema.org/Report
- **WebPage:** https://schema.org/WebPage
- **CollectionPage:** https://schema.org/CollectionPage

---

## Common Issues

### Issue: Meta tags not appearing in generated HTML
**Solution:** Ensure you're checking `.output/public/` after running `npm run generate`, not just dev server

### Issue: Images not loading in social previews
**Solution:** Verify images use absolute URLs starting with `https://`

### Issue: Twitter:title showing when it shouldn't
**Solution:** Set `twitterTitle: ''` explicitly (empty string, not undefined)

---

**End of Documentation**
