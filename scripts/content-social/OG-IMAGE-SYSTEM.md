# Open Graph Image System

## Overview

Dynamic, branded OG (Open Graph) images generated for all articles and publications using **Vue components + Playwright element screenshots**. These images are automatically displayed when sharing links on **Twitter, LinkedIn, Facebook, and Google Search**.

## Image Specifications

### Universal Format (Works for ALL Platforms)

```
Size:      1200×675px (16:9 aspect ratio)
Format:    PNG
Quality:   2x device scale (retina)
Location:  public/images/og-image/{slug}.png
Method:    Playwright element screenshot of Vue component
```

### Platform Compatibility

| Platform | Your 1200×675 | Optimal | Result |
|----------|---------------|---------|---------|
| **Twitter** | 1200×675 | 1200×675 | ✅ Perfect |
| **LinkedIn** | 1200×675 | 1200×627 | ✅ Slight crop (48px) - negligible |
| **Facebook** | 1200×675 | 1200×630 | ✅ Slight crop (45px) - negligible |
| **Google Search** | 1200×675 | 1200×675 | ✅ Perfect |

**Verdict:** One image size works perfectly across all platforms! 🎯

## Directory Structure

```
scripts/content-social/
├── generate-og-images-playwright.ts  # Image generator (Playwright)
├── generate-tweets.ts                # Tweet text generator
├── post-to-twitter-single.ts         # Twitter posting script
├── consolidate-tweets.ts             # Merge tweet JSONs
└── OG-IMAGE-SYSTEM.md               # This documentation

components/
└── OGImageCard.vue                   # Reusable OG card component

pages/
├── articles/[slug].vue               # Article pages with OG meta tags
├── publications/[slug].vue           # Publication pages with OG meta tags
└── og-image/[slug].vue              # Live preview route for design

public/images/
├── og-image/                         # Generated OG cards (1200×675)
│   ├── {article-slug}.png
│   ├── {article-slug}.png
│   └── ...
└── categories/                       # Legacy category images (deprecated)
    ├── ransomware.png
    └── ...

tmp/twitter/
└── tweets.json                       # Master tweet data file
```

## Image Generation

### Generate All Images (Production)


```bash
#mathed path to tmp
npx tsx scripts/content-social/generate-og-images-playwright.ts


cd scripts/content-social
npx tsx generate-og-images-playwright.ts
```

### Generate Single Test Image

```bash
npx tsx generate-og-images-playwright.ts --test
```

### Generate Specific Article

```bash
npx tsx generate-og-images-playwright.ts --slug microsoft-patch-tuesday
```

### Custom Options

```bash
# Custom source file
npx tsx generate-og-images-playwright.ts --source ../../tmp/twitter/custom-tweets.json

# Custom output directory
npx tsx generate-og-images-playwright.ts --output ../../public/images/custom

# Custom preview URL
npx tsx generate-og-images-playwright.ts --url http://localhost:4000

# Run with visible browser (debugging)
npx tsx generate-og-images-playwright.ts --headed
```

### Live Preview (Design Iteration)

```bash
# Start dev server
npm run dev

# Visit preview route in browser
http://localhost:3000/og-image/{slug}

# Example
http://localhost:3000/og-image/microsoft-october-2025-patch-tuesday-fixes-three-zero-days
```

**Benefits:**
- ✅ Hot reload on component changes
- ✅ Instant visual feedback
- ✅ Test different articles
- ✅ Responsive design testing
- ✅ No regeneration needed for tweaks

## Template Design

Images are generated using **Vue components + Playwright element screenshots** with mobile-optimized styling:

### Component Architecture

**File:** `components/OGImageCard.vue`

- **Exact dimensions:** 1200×675px with `data-testid="og-image-card"` for Playwright targeting
- **Matches site design:** Identical to article index cards (purple borders, cyan gradients)
- **Mobile-optimized:** Large typography for Twitter mobile feeds
- **Dynamic content:** Props-based (headline, severity, categories, tweet_text)
- **Cyberpunk theme:** Gray-900 background, purple/cyan gradients, neon effects

### Typography Scaling (Mobile-First)

- **Headline:** `text-7xl` (72px) - 1.5x increase for readability
- **Severity badges:** `text-3xl` (30px), `border-4`, `px-8/py-4` - 4x larger
- **Category badges:** `text-3xl` (30px), `border-3`, `px-8/py-4` - 1.5x increase
- **Shield icon:** `w-32/h-32` container, `w-24/h-24` icon (96px) - 2x bigger
- **Brand text:** `text-4xl` (36px) - CyberNetSec.io
- **Tagline:** `text-xl` (20px) - "THREAT INTELLIGENCE" - 2x bigger

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Cyber grid background (10% opacity)            │
│  ┌───────────────────────────────────────────┐  │
│  │ Purple border card (1140×615)             │  │
│  │                                           │  │
│  │  [Centered -mt-16]                        │  │
│  │                                           │  │
│  │  HEADLINE TEXT (text-7xl, cyan→purple)    │  │
│  │  Line-clamp-3, max 3 lines        [CRITICAL] │
│  │                                           │  │
│  │  [PATCH] [VULNERABILITY] [CYBERATTACK]    │  │
│  │  (max-width: 75%, wraps if needed)        │  │
│  │                                           │  │
│  │                                           │  │
│  │                          [Bottom Right]   │  │
│  │                          🛡️ (2x bigger)   │  │
│  │                          CyberNetSec.io   │  │
│  │                          THREAT INTEL     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Design Decisions

**INCLUDED:**
- ✅ Headline (line-clamp-3)
- ✅ Severity badge (color-coded: red/orange/yellow/blue)
- ✅ Category badges (max 3, constrained to 75% width)
- ✅ CyberNetSec.io branding (vertical logo with shield above text)
- ✅ Gradient backgrounds (cyan→purple for text)
- ✅ Neon shadow effects (severity-based glow)

**EXCLUDED:**
- ❌ Hashtag entities (already in tweet text)
- ❌ Date field (not needed for social cards)
- ❌ Subtitle/description (headline is enough)
- ❌ Multiple images (single card only)

### Severity Color Coding

| Severity | Badge Color | Border | Glow Effect |
|----------|-------------|--------|-------------|
| **CRITICAL** | Red (`bg-red-500/20`, `border-red-500`, `text-red-400`) | `border-4` | `shadow-[0_0_20px_rgba(239,68,68,0.8)]` |
| **HIGH** | Orange (`bg-orange-500/20`, `border-orange-500`, `text-orange-400`) | `border-4` | `shadow-[0_0_20px_rgba(249,115,22,0.8)]` |
| **MEDIUM** | Yellow (`bg-yellow-500/20`, `border-yellow-500`, `text-yellow-400`) | `border-4` | `shadow-[0_0_20px_rgba(234,179,8,0.8)]` |
| **LOW** | Yellow (same as medium) | `border-4` | `shadow-[0_0_20px_rgba(234,179,8,0.8)]` |
| **INFORMATIONAL** | Blue (`bg-blue-500/20`, `border-blue-500`, `text-blue-400`) | `border-4` | `shadow-[0_0_20px_rgba(59,130,246,0.8)]` |

### Category Badge Styling

```vue
<div class="px-8 py-4 bg-orange-500/20 border-3 border-orange-500/60 
     text-orange-300 rounded-xl text-3xl font-black uppercase 
     tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.5)]">
  {{ category }}
</div>
```

- **Layout:** `max-w-[75%]` constraint, wraps to multiple rows if 3 badges exceed width
- **Spacing:** `gap-4` between badges
- **Max badges:** 3 (enforced by `.slice(0, 3)`)

### Example Output

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Microsoft Patches 3 Actively Exploited      [🔴]│
│  Zero-Days in Massive October Update        CRITICAL│
│                                                  │
│  [PATCH] [VULNERABILITY] [CYBERATTACK]          │
│                                                  │
│                                                  │
│                                      🛡️          │
│                                  CyberNetSec.io  │
│                                  THREAT INTEL    │
└──────────────────────────────────────────────────┘
```

## Implementation

### Article Pages (`pages/articles/[slug].vue`)

```typescript
const ogCardImage = `/images/og-image/${newArticle.slug}.png`

useSeoMeta({
  // Open Graph - ALL platforms (Twitter, LinkedIn, Facebook, Google)
  ogImage: ogCardImage,
  ogImageWidth: '1200',
  ogImageHeight: '675',
  ogUrl: `https://cyber.netsecops.io/articles/${newArticle.slug}`,
  
  // Twitter Card - SAME image
  twitterCard: 'summary_large_image',
  twitterImage: ogCardImage,
})
```

### Publication Pages (`pages/publications/[slug].vue`)

```typescript
const ogCardImage = `/images/og-image/${publicationSlug}.png`

useSeoMeta({
  ogImage: ogCardImage,
  ogImageWidth: '1200',
  ogImageHeight: '675',
  twitterImage: ogCardImage,
})
```

## Twitter Posting Strategy

### Option A: Twitter Cards (Recommended) ✅

Post **URL only** - Twitter fetches image from meta tags:

```
📢 UPDATE: Oracle patches critical CVE-2025-21287
#Oracle #CVE202521287 #CVSS9

https://cyber.netsecops.io/articles/oracle-critical-patch
```

**Benefits:**
- ✅ Image is **clickable** (links to article)
- ✅ Cleaner, more professional look
- ✅ No API media upload needed
- ✅ Same as what pros do

**Requirements:**
- Images must be generated first
- Meta tags must be correct (already configured)

### Option B: Direct Upload (Alternative)

Upload image with tweet:

```typescript
const mediaId = await client.v1.uploadMedia(imagePath);
await client.v2.tweet({
  text: fullText,
  media: { media_ids: [mediaId] }
});
```

**Trade-offs:**
- ❌ Image NOT clickable
- ❌ Takes up media attachment slot
- ✅ Works without meta tags

## Validation

### Check Generated Images

```bash
ls -la public/images/og-image/
```

### Test Meta Tags

1. Generate images for test articles
2. Open article in browser: `https://cyber.netsecops.io/articles/{slug}`
3. Use Twitter Card Validator: https://cards-dev.twitter.com/validator
4. Use LinkedIn Inspector: https://www.linkedin.com/post-inspector/
5. Use Facebook Debugger: https://developers.facebook.com/tools/debug/

### Verify OG Tags in Browser

```bash
curl -s https://cyber.netsecops.io/articles/{slug} | grep -E "og:image|twitter:image"
```

Should output:
```html
<meta property="og:image" content="/images/og-image/{slug}.png">
<meta name="twitter:image" content="/images/og-image/{slug}.png">
```

## Performance

- **Generation time:** ~3.5-4s per image (includes Playwright browser launch + navigation + render + screenshot)
- **First image:** ~4s (includes chromium startup)
- **Subsequent images:** ~3.5s average (browser context reused)
- **Batch of 20:** ~70-80 seconds total (~3.5s × 20)
- **File size:** ~500-700KB per image (well under 5MB Twitter limit)
- **Memory:** Browser context reused across all images for efficiency

### Optimization Tips

- Run in headless mode (default) for faster generation
- Use `--test` flag for single image testing
- Browser launch is slowest part - batch generation much more efficient than individual
- Preview route (`/og-image/{slug}`) for instant design feedback without regeneration

## Fallback Strategy

If OG image doesn't exist:

**For Twitter Card display:**
1. Try `/images/og-image/{slug}.png` (primary)
2. Platform falls back to default (no image shown)

**For posting script with image upload:**
1. Try `/images/og-image/{slug}.png` (primary)
2. **Fail validation** if not found (forces image generation before posting)
3. No fallback to category images (deprecated approach)

## Maintenance

### Regenerate All Images

When design changes (update `components/OGImageCard.vue`):
```bash
cd scripts/content-social
npx tsx generate-og-images-playwright.ts
```

### Clean Old Images

```bash
rm -rf public/images/og-image/*.png
```

### Update Template Design

**Primary design file:** `components/OGImageCard.vue`

**Workflow:**
1. Edit `components/OGImageCard.vue` (Tailwind classes, layout, colors)
2. Start dev server: `npm run dev`
3. Preview changes: `http://localhost:3000/og-image/{slug}`
4. Iterate with hot reload (instant feedback)
5. Once satisfied, regenerate all images:
   ```bash
   npx tsx scripts/content-social/generate-og-images-playwright.ts
   ```

**Common edits:**
- Typography sizes: `text-7xl`, `text-3xl`, etc.
- Colors: `bg-red-500/20`, `border-purple-500`, `text-cyan-400`
- Spacing: `p-8`, `gap-4`, `mb-6`, `-mt-16`
- Layout: `flex`, `flex-col`, `justify-center`, `items-center`
- Effects: `shadow-[0_0_20px_...]`, `bg-gradient-to-r`

**Preview route:** `pages/og-image/[slug].vue`
- Reads from `tmp/twitter/tweets.json` (SSG-compatible static import)
- Maps tweet data to `OGImageCard` props
- Includes refresh button for quick testing

## Related Files

**Core Generation:**
- `scripts/content-social/generate-og-images-playwright.ts` - Image generator (Playwright element screenshot)
- `components/OGImageCard.vue` - Vue component template (1200×675 card design)
- `pages/og-image/[slug].vue` - Live preview route for design iteration

**Supporting Scripts:**
- `scripts/content-social/generate-tweets.ts` - Tweet text generator (OpenAI API)
- `scripts/content-social/post-to-twitter-single.ts` - Twitter posting script
- `scripts/content-social/consolidate-tweets.ts` - Merge individual tweet JSONs

**Integration:**
- `pages/articles/[slug].vue` - Article pages with OG meta tags
- `pages/publications/[slug].vue` - Publication pages with OG meta tags

**Data:**
- `tmp/twitter/tweets.json` - Master tweet data file (source for image generation)
- `public/images/og-image/*.png` - Generated OG card images (output)

**Documentation:**
- `scripts/content-social/OG-IMAGE-SYSTEM.md` - This file

## Best Practices

✅ **DO:**
- Generate images BEFORE posting to Twitter
- Use live preview route (`/og-image/{slug}`) for design iteration
- Test design on actual mobile device (Twitter app) before bulk generation
- Keep typography large for mobile readability (current: 1.5-4x increases)
- Maintain consistent brand colors (purple/cyan/pink gradients)
- Use severity-based color coding (red=critical, orange=high, etc.)
- Constrain category badges to 75% width max (prevents logo overlap)
- Run in headless mode for production (faster generation)

❌ **DON'T:**
- Upload images larger than 5MB (current: ~500-700KB)
- Use aspect ratios other than 16:9 (platforms will crop incorrectly)
- Hard-code article-specific data in component (use props)
- Skip image validation before posting (script will fail gracefully)
- Mix category images with OG images (deprecated approach)
- Edit Playwright script for design changes (edit Vue component instead)
- Generate images one-by-one (batch mode reuses browser for efficiency)
- Use visible browser (`--headed`) in production (much slower)

## Troubleshooting

### Image Not Showing on Twitter

1. **Check image exists:**
   ```bash
   ls -la public/images/og-image/{slug}.png
   ```

2. **Verify meta tags in article page:**
   ```bash
   curl -s https://cyber.netsecops.io/articles/{slug} | grep -E "og:image|twitter:image"
   ```
   Should show:
   ```html
   <meta property="og:image" content="/images/og-image/{slug}.png">
   <meta name="twitter:image" content="/images/og-image/{slug}.png">
   ```

3. **Clear Twitter cache:**
   - Visit: https://cards-dev.twitter.com/validator
   - Enter article URL: `https://cyber.netsecops.io/articles/{slug}`
   - Click "Preview card"

4. **Check image accessibility:**
   - Direct URL: `https://cyber.netsecops.io/images/og-image/{slug}.png`
   - Must be publicly accessible (no auth required)
   - HTTPS only

### Image Shows Wrong Content

- **Cached by platform:** Use Twitter Card Validator to refresh cache
- **Wrong slug:** Verify tweet data slug matches article slug exactly
- **Old design:** Regenerate images after component changes
- **Wrong article:** Check `tmp/twitter/tweets.json` has correct slug

### Generation Fails

**Playwright not installed:**
```bash
npm install -D playwright
npx playwright install chromium
```

**Source file missing:**
```bash
ls tmp/twitter/tweets.json  # Must exist
```

**Dev server not running (for preview):**
```bash
npm run dev  # Must be running on port 3000
```

**Permission denied:**
```bash
chmod 755 public/images/og-image/
```

**Memory issues:**
- Reduce batch size or increase Node heap:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npx tsx generate-og-images-playwright.ts
  ```

### Preview Route Issues

**404 on `/og-image/{slug}`:**
- Check dev server is running: `npm run dev`
- Verify slug exists in `tmp/twitter/tweets.json`
- Check `pages/og-image/[slug].vue` exists

**Component changes not showing:**
- Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check browser console for Vue errors
- Verify Tailwind classes are valid

**Screenshot shows wrong size:**
- Check `OGImageCard.vue` has: `class="w-[1200px] h-[675px]"`
- Verify `data-testid="og-image-card"` exists for Playwright targeting

## Future Enhancements

- [ ] Auto-generate images during article creation pipeline (post-publication hook)
- [ ] A/B test different template designs (multiple component variants)
- [ ] Add publication-specific templates (daily digest format with multiple headlines)
- [ ] Generate different sizes for Instagram (1080×1080), Pinterest (1000×1500)
- [ ] Add real-time preview in admin dashboard
- [ ] Batch regeneration with progress bar UI
- [ ] Image compression optimization (WebP format, lazy loading)
- [ ] CDN integration for faster loading (Cloudflare Images)
- [ ] Animation support (GIF/MP4 for Twitter videos)
- [ ] Dynamic text sizing based on headline length (auto-scale for long titles)
- [ ] Multiple design themes (light mode, dark mode, high contrast)
- [ ] Integration with GitHub Actions (auto-generate on article publish)

---

**Last Updated:** October 16, 2025  
**Maintained By:** CyberNetSec Content Team
