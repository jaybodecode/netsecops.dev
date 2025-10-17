# Twitter OG Metadata Guide

**Date**: October 17, 2025  
**Status**: ✅ Production Ready

---

## Overview

The Twitter posting system now uses **OG (Open Graph) metadata** by default instead of uploading images directly. This is the recommended approach for better traffic, faster posting, and professional appearance.

---

## How It Works

### 1. Article Pages Have OG Tags

Every article page at `https://cyber.netsecops.io/articles/{slug}` includes:

```html
<meta property="og:image" content="https://cyber.netsecops.io/images/og-image/{slug}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="675">
<meta property="og:title" content="Article Headline">
<meta property="og:description" content="Article Summary">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://cyber.netsecops.io/images/og-image/{slug}.png">
```

### 2. Twitter Crawls Your Page

When you post a tweet with an article URL:
1. Twitter fetches your article page
2. Extracts the OG metadata
3. Displays the image as a Twitter Card
4. Shows your domain name under the card

### 3. Users Click Image → Your Site

**With OG metadata (default):**
- User clicks image → redirects to `https://cyber.netsecops.io/articles/{slug}`
- **Result**: Traffic to your site! 🚀

**With uploaded image (legacy):**
- User clicks image → opens just the image
- **Result**: Dead end, no traffic 😞

---

## Twitter Card Types & Options

### Available Twitter Card Types

Twitter supports **4 card types**:

#### 1. **summary** (Small image card)
- Image: 144x144px minimum (square)
- Use case: Small thumbnails, icons, logos
- Position: Image left, text right

#### 2. **summary_large_image** ⭐ (What we use)
- Image: 1200x675px recommended (16:9 aspect ratio)
- Use case: Hero images, article previews, featured content
- Position: Image full width on top, text below
- **Best for articles and content marketing**

#### 3. **app** (App download card)
- Shows app icon, name, description
- Includes App Store/Google Play install buttons
- Use case: Mobile app promotion

#### 4. **player** (Video/audio player card)
- Embeds video/audio player
- Image: 1200x675px thumbnail
- Use case: Video content, podcasts

### Twitter Card Meta Tags (Complete List)

**Currently Using:**
```html
<!-- Card Type -->
<meta name="twitter:card" content="summary_large_image">

<!-- Content -->
<meta name="twitter:title" content="Article Headline">
<meta name="twitter:description" content="Article summary (max 200 chars)">
<meta name="twitter:image" content="https://cyber.netsecops.io/images/og-image/slug.png">
<meta name="twitter:image:alt" content="Article headline">
```

**Additional Available Options:**

```html
<!-- Site Attribution -->
<meta name="twitter:site" content="@YourTwitterHandle">
<meta name="twitter:site:id" content="123456789">

<!-- Author Attribution -->
<meta name="twitter:creator" content="@AuthorHandle">
<meta name="twitter:creator:id" content="987654321">

<!-- Image Options -->
<meta name="twitter:image" content="https://example.com/image.png">
<meta name="twitter:image:alt" content="Image description for accessibility">

<!-- App Card (if using app card type) -->
<meta name="twitter:app:name:iphone" content="App Name">
<meta name="twitter:app:id:iphone" content="123456789">
<meta name="twitter:app:url:iphone" content="example://article">
<meta name="twitter:app:name:ipad" content="App Name">
<meta name="twitter:app:id:ipad" content="123456789">
<meta name="twitter:app:name:googleplay" content="App Name">
<meta name="twitter:app:id:googleplay" content="com.example.app">

<!-- Player Card (if using player card type) -->
<meta name="twitter:player" content="https://example.com/player.html">
<meta name="twitter:player:width" content="1280">
<meta name="twitter:player:height" content="720">
<meta name="twitter:player:stream" content="https://example.com/video.mp4">

<!-- Label/Data Pairs (deprecated but still supported) -->
<meta name="twitter:label1" content="Reading time">
<meta name="twitter:data1" content="5 minutes">
<meta name="twitter:label2" content="Category">
<meta name="twitter:data2" content="Cybersecurity">
```

### What We Could Add (Recommendations)

#### 1. **Site Attribution** (Highly Recommended)
```html
<meta name="twitter:site" content="@CyberNetSec">
```
**Benefits:**
- Links tweets back to your Twitter account
- Increases brand recognition
- Shows "via @CyberNetSec" in tweet metadata
- Helps with follower growth

#### 2. **Creator Attribution** (Optional)
```html
<meta name="twitter:creator" content="@AuthorHandle">
```
**Benefits:**
- Credits individual authors
- Good if you have multiple contributors
- Shows "by @AuthorHandle" in tweet metadata

#### 3. **Enhanced Image Alt Text** (Currently Using)
```html
<meta name="twitter:image:alt" content="Detailed description of the image">
```
**Benefits:**
- Accessibility (screen readers)
- SEO boost
- Shows when image fails to load

### Schema Extension Needed?

**For Site/Creator Attribution: YES** (Minimal)

Add to `tweets.json` schema:
```typescript
interface Tweet {
  slug: string;
  headline: string;
  tweet_text: string;
  categories: string[];
  primary_category: string;
  severity: string;
  is_update: boolean;
  
  // NEW: Twitter Card enhancements (optional)
  twitter_site?: string;      // @YourHandle
  twitter_creator?: string;    // @AuthorHandle
  image_alt?: string;          // Enhanced alt text (defaults to headline)
}
```

**For Article Pages: YES** (Update Nuxt useSeoMeta)

Add to `pages/articles/[slug].vue`:
```typescript
useSeoMeta({
  // ... existing fields ...
  
  // NEW: Twitter Card enhancements
  twitterSite: '@CyberNetSec',           // Your site's Twitter handle
  twitterCreator: article.author_twitter, // Author's Twitter handle (if exists)
  twitterImageAlt: article.og_image_alt || article.headline, // Better alt text
})
```

### Priority Recommendations

#### High Priority (Add These)
1. **`twitter:site`** - Links to your Twitter account
   - Add to all article pages: `<meta name="twitter:site" content="@CyberNetSec">`
   - No schema change needed (hardcoded)
   
2. **Enhanced `twitter:image:alt`** - Better accessibility
   - Already using headline as alt text
   - Could add field in DB for custom alt text (optional)

#### Medium Priority (Nice to Have)
3. **`twitter:creator`** - Author attribution
   - Requires DB field: `author_twitter_handle`
   - Good for team/guest posts
   
4. **Summary optimization** - Better description
   - Already using `meta_description` (good!)
   - Could optimize length (max 200 chars for Twitter)

#### Low Priority (Skip for Now)
5. **Label/Data pairs** - Deprecated by Twitter
6. **App/Player cards** - Not applicable for articles

---

## Posting Commands

### Default Mode (OG Metadata - Recommended)

```bash
# Post with OG metadata
npx tsx scripts/content-social/post-to-twitter-single.ts

# Preview first
npx tsx scripts/content-social/post-to-twitter-single.ts --dry-run

# Test with first tweet
npx tsx scripts/content-social/post-to-twitter-single.ts --test
```

**What happens:**
- Tweet contains: Text + URL
- Twitter fetches OG image from your article page
- Image appears as Twitter Card
- Click image → goes to your site

### Legacy Mode (Upload Image)

```bash
# Upload image with tweet
npx tsx scripts/content-social/post-to-twitter-single.ts --upload_image
```

**What happens:**
- Script uploads `public/images/og-image/{slug}.png` to Twitter
- Tweet contains: Text + URL + Uploaded Image
- Click image → opens just the image (not your site)

---

## Benefits Comparison

| Feature | OG Metadata (Default) | Upload Image (Legacy) |
|---------|----------------------|----------------------|
| **Click image →** | Your article page 🚀 | Just the image 😞 |
| **Upload speed** | Instant ⚡ | Slower (1-2s per image) |
| **Image size limit** | None (served from your site) | 5MB Twitter limit |
| **Traffic to site** | ✅ Yes | ❌ No |
| **SEO benefit** | ✅ Yes (validates page) | ❌ No |
| **Domain shown** | ✅ Yes (under card) | ❌ No |
| **Updates** | ✅ Auto (Twitter refetches) | ❌ Must repost |

---

## OG Image Generation

### Location
- **URL**: `https://cyber.netsecops.io/images/og-image/{slug}.png`
- **Disk**: `public/images/og-image/{slug}.png`
- **Size**: 1200x675px (Twitter's recommended size)
- **Format**: PNG

### Generation Script

```bash
# Generate all OG images
npx tsx scripts/content-social/generate-og-images-playwright.ts

# Generate specific article
npx tsx scripts/content-social/generate-og-images-playwright.ts --slug article-slug

# Test with first article
npx tsx scripts/content-social/generate-og-images-playwright.ts --test
```

### Verification

```bash
# Check if OG image exists
curl -I "https://cyber.netsecops.io/images/og-image/{slug}.png"

# Should return: HTTP/2 200
```

---

## Troubleshooting

### Image Not Showing on Twitter

1. **Verify OG image exists:**
   ```bash
   curl -I "https://cyber.netsecops.io/images/og-image/{slug}.png"
   ```

2. **Test OG tags with Twitter Card Validator:**
   - Visit: https://cards-dev.twitter.com/validator
   - Enter: `https://cyber.netsecops.io/articles/{slug}`
   - Should show: Image preview + article details

3. **Check article page source:**
   ```bash
   curl -s "https://cyber.netsecops.io/articles/{slug}" | grep "og:image"
   ```
   - Should return: `<meta property="og:image" content="https://cyber.netsecops.io/images/og-image/{slug}.png">`

4. **Twitter cache issue:**
   - Twitter caches OG metadata for ~7 days
   - Force refresh: Use Twitter Card Validator
   - Or wait 24 hours for natural refresh

### Image Wrong Size

OG images must be:
- **Width**: 1200px
- **Height**: 675px
- **Aspect ratio**: 16:9
- **Format**: PNG or JPEG

Regenerate if wrong size:
```bash
npx tsx scripts/content-social/generate-og-images-playwright.ts --slug {slug}
```

### Want to Use Upload Mode Temporarily

```bash
# Use --upload_image flag
npx tsx scripts/content-social/post-to-twitter-single.ts --upload_image

# Good for:
# - Testing image upload functionality
# - Site temporarily down
# - Specific visual effect you want
```

---

## Technical Details

### OG Metadata Implementation

Located in: `pages/articles/[slug].vue`

```typescript
useSeoMeta({
  // Open Graph - uses generated card (1200x675)
  ogImage: `/images/og-image/${newArticle.slug}.png`,
  ogImageWidth: '1200',
  ogImageHeight: '675',
  ogImageAlt: String(newArticle.headline),
  
  ogTitle: String(newArticle.headline),
  ogDescription: String(newArticle.meta_description),
  ogType: 'article',
  ogUrl: `https://cyber.netsecops.io/articles/${newArticle.slug}`,
  
  // Twitter Card - uses same generated image
  twitterCard: 'summary_large_image',
  twitterTitle: String(newArticle.headline),
  twitterDescription: String(newArticle.meta_description),
  twitterImage: `/images/og-image/${newArticle.slug}.png`,
  twitterImageAlt: String(newArticle.headline),
})
```

### Script Changes

**File**: `scripts/content-social/post-to-twitter-single.ts`

**New flag**: `--upload_image`
- Default (no flag): OG metadata mode
- With flag: Upload image mode

**Logic**:
```typescript
if (uploadImage) {
  // Upload image with tweet
  const mediaId = await client.v1.uploadMedia(imagePath);
  await client.v2.tweet({ text: fullText, media: { media_ids: [mediaId] } });
} else {
  // Let Twitter fetch OG image
  await client.v2.tweet({ text: fullText });
}
```

---

## Quick Implementation: Add Twitter Site Attribution

### Step 1: Update Article Page (5 minutes)

**File**: `pages/articles/[slug].vue`

Find the `useSeoMeta` section (around line 291) and add:

```typescript
useSeoMeta({
  // ... existing OG tags ...
  
  // Twitter Card - ENHANCED
  twitterCard: 'summary_large_image',
  twitterSite: '@CyberNetSec',  // ← ADD THIS LINE
  twitterTitle: String(newArticle.og_title || newArticle.headline || newArticle.title || 'Article'),
  twitterDescription: String(newArticle.og_description || newArticle.meta_description || newArticle.summary || ''),
  twitterImage: ogCardImage,
  twitterImageAlt: String(newArticle.headline || newArticle.title || 'Cybersecurity Article'),
})
```

### Step 2: Verify (1 minute)

```bash
# Check page source
curl -s "https://cyber.netsecops.io/articles/{slug}" | grep "twitter:site"

# Should show:
# <meta name="twitter:site" content="@CyberNetSec">
```

### Step 3: Test Tweet

```bash
# Post a test tweet
npx tsx scripts/content-social/post-to-twitter-single.ts --test

# Check tweet metadata - should show:
# "via @CyberNetSec"
```

### Benefits You'll See Immediately

1. **Brand Attribution**: Tweets show "via @CyberNetSec"
2. **Profile Link**: Click attribution → your Twitter profile
3. **Follower Growth**: Makes it easy for readers to follow you
4. **Professional Look**: Shows you own the content

---

## Advanced: Add Author Attribution (Optional)

### If You Have Multiple Authors

**Step 1: Add DB Field**

Add to `published_articles` table:
```sql
ALTER TABLE published_articles 
ADD COLUMN author_twitter VARCHAR(50);  -- e.g., '@AuthorHandle'
```

**Step 2: Update Article Page**

```typescript
useSeoMeta({
  // ... existing fields ...
  
  twitterSite: '@CyberNetSec',
  twitterCreator: newArticle.author_twitter || '@CyberNetSec', // ← Author handle
  
  // ... rest of fields ...
})
```

**Step 3: Result**

Tweets will show:
- "via @CyberNetSec" (site)
- "by @AuthorHandle" (creator)

---

## Testing Your Twitter Card

### Method 1: Twitter Card Validator (Recommended)

1. Visit: https://cards-dev.twitter.com/validator
2. Enter: `https://cyber.netsecops.io/articles/{slug}`
3. Click "Preview card"

**You should see:**
- ✅ Card type: `summary_large_image`
- ✅ Image: 1200x675px
- ✅ Title: Article headline
- ✅ Description: Article summary
- ✅ Site: `@CyberNetSec` (if added)

### Method 2: View Page Source

```bash
curl -s "https://cyber.netsecops.io/articles/{slug}" | grep "twitter:"
```

**Should show:**
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@CyberNetSec">
<meta name="twitter:title" content="Article Headline">
<meta name="twitter:description" content="Article Summary">
<meta name="twitter:image" content="https://cyber.netsecops.io/images/og-image/slug.png">
<meta name="twitter:image:alt" content="Article Headline">
```

### Method 3: Post Test Tweet

```bash
# Post first tweet
npx tsx scripts/content-social/post-to-twitter-single.ts --test

# Check tweet on Twitter:
# 1. Image should appear as large card
# 2. Domain shown below card
# 3. Attribution shows "via @CyberNetSec" (if added)
# 4. Click image → goes to article page
```

---

## Best Practices

### ✅ DO:

1. **Use OG metadata by default**
   - Better for traffic, SEO, and speed

2. **Add `twitter:site` attribution**
   - Links tweets to your Twitter account
   - Helps with brand recognition and follower growth

3. **Generate OG images before posting**
   ```bash
   npx tsx scripts/content-social/generate-og-images-playwright.ts
   npx tsx scripts/content-social/post-to-twitter-single.ts
   ```

4. **Test with first tweet**
   ```bash
   npx tsx scripts/content-social/post-to-twitter-single.ts --test
   ```

5. **Use Twitter Card Validator**
   - Test cards before posting
   - Force refresh Twitter's cache

4. **Verify OG tags before posting**
   - Use Twitter Card Validator
   - Check image loads correctly

5. **Monitor first few posts**
   - Ensure images appear
   - Check click behavior (should go to article)

### ❌ DON'T:

1. **Don't use `--upload_image` unless needed**
   - Slower posting
   - No traffic benefit
   - Image size limits

2. **Don't post without OG images**
   - Twitter won't show preview
   - Less engagement

3. **Don't change OG image URLs after posting**
   - Twitter caches for 7 days
   - May show old/broken images

---

## Automation

### GitHub Actions

```yaml
name: Post to Twitter

on:
  schedule:
    - cron: '0 13 * * *'  # Daily at 7 AM CST

jobs:
  post-to-twitter:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      # Generate OG images first
      - name: Generate OG Images
        run: npx tsx scripts/content-social/generate-og-images-playwright.ts
      
      # Post to Twitter (OG metadata mode)
      - name: Post to Twitter
        env:
          TWITTER_API_KEY: ${{ secrets.TWITTER_API_KEY }}
          TWITTER_API_SECRET: ${{ secrets.TWITTER_API_SECRET }}
          TWITTER_ACCESS_TOKEN: ${{ secrets.TWITTER_ACCESS_TOKEN }}
          TWITTER_ACCESS_SECRET: ${{ secrets.TWITTER_ACCESS_SECRET }}
        run: npx tsx scripts/content-social/post-to-twitter-single.ts
```

---

## Success Metrics

### Track These:

1. **Twitter Card display rate**
   - What % of tweets show image preview
   - Should be 100% with OG metadata

2. **Click-through rate**
   - Twitter Analytics → Link clicks
   - Compare OG metadata vs uploaded images

3. **Website traffic from Twitter**
   - Google Analytics → Social → Twitter
   - Should increase with OG metadata

4. **Engagement rate**
   - Likes, retweets, replies
   - Twitter Cards typically get 2-3x more engagement

### Expected Results:

| Metric | With OG Metadata | With Uploaded Images |
|--------|-----------------|---------------------|
| CTR | 2-5% | 0.5-1% |
| Website visits | High | None |
| Engagement | +50-100% | Baseline |
| Posting speed | Fast | Slow |

---

## FAQ

### Q: Do I need to generate OG images every time?
**A:** Only when you have new articles. If images already exist, Twitter will fetch them automatically.

### Q: What if Twitter doesn't show my OG image?
**A:** 
1. Verify image exists at URL
2. Use Twitter Card Validator to force refresh
3. Wait 24 hours for cache to clear
4. Temporarily use `--upload_image` as workaround

### Q: Can I mix OG metadata and uploaded images?
**A:** Not in the same tweet. Choose one mode per run. Default is OG metadata (recommended).

### Q: How long does Twitter cache OG metadata?
**A:** ~7 days. Use Twitter Card Validator to force refresh.

### Q: Will this work for LinkedIn and Facebook too?
**A:** Yes! They all use OG metadata. Same image will work for all platforms.

### Q: What happens if my site is down when Twitter crawls?
**A:** Twitter won't show preview. Use `--upload_image` temporarily or wait for site to come back up.

---

## Related Documentation

- **Setup**: `SETUP-TWITTER.md` - Twitter API setup
- **Implementation**: `TWITTER-IMPLEMENTATION-SUMMARY.md` - Full system overview
- **Strategy**: `TWITTER-X.md` - Platform strategy and format
- **OG Images**: `OG-IMAGE-SYSTEM.md` - Image generation system

---

**Questions?** Check the related docs above or test with `--dry-run` first!
