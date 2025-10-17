# Incremental Deployment Guide

## Overview

Speed up daily deployments by **skipping full rebuilds** when only content changes (articles/publications). This reduces deployment time from **~40 seconds to ~5 seconds** for content-only updates.

---

## 🚀 Quick Start

### Daily Content Deployment (Fast Path)

```bash
# After running your content pipeline
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17

# Deploy incrementally (auto-detects content-only changes)
./scripts/deploy-incremental.sh -y
```

**What happens:**
- ✅ Detects only articles/publications changed
- ✅ Skips full `npm run generate` (saves ~30s)
- ✅ Copies updated JSON files
- ✅ Generates only new routes (~2s)
- ✅ Deploys to GitHub Pages

---

## 📋 How It Works

### Change Detection

The script analyzes git changes and determines:

**Content-Only Changes** (Incremental Build):
- ✅ `public/data/articles/*.json`
- ✅ `public/data/publications/*.json`
- ✅ `public/data/articles-index.json`
- ✅ `public/data/publications-index.json`
- ✅ Markdown documentation files
- ✅ Log files

**Code Changes** (Full Build Required):
- ❌ Vue components (`components/*.vue`)
- ❌ Pages (`pages/*.vue`)
- ❌ Nuxt config (`nuxt.config.ts`)
- ❌ Package dependencies (`package.json`)
- ❌ Scripts/utilities
- ❌ Assets/styles

### Build Strategies

#### 1. Incremental Build (Content-Only)

When only content files changed:

```bash
Step 1/3: Copy updated content
  ✅ Articles → .output/public/data/articles/
  ✅ Publications → .output/public/data/publications/
  ✅ Index files → .output/public/data/

Step 2/3: Generate new routes
  ✅ Scan articles for new slugs
  ✅ Scan publications for new slugs
  ✅ Generate HTML for missing routes
  ✅ Preserve existing routes

Step 3/3: Update sitemap
  ✅ Regenerate sitemap with new routes
```

**Time:** ~2-5 seconds

#### 2. Full Build (Code Changes)

When code/config changed:

```bash
npm run generate
```

**Time:** ~30-40 seconds

---

## 📖 Usage Examples

### Default: Auto-Detect Mode

```bash
./scripts/deploy-incremental.sh
```

- Analyzes git changes
- Chooses incremental or full build automatically
- Prompts for confirmation before deployment

### Auto-Confirm Deployment

```bash
./scripts/deploy-incremental.sh -y
```

- Skips confirmation prompt
- Good for CI/CD pipelines

### Force Full Build

```bash
./scripts/deploy-incremental.sh -f
```

- Forces full `npm run generate`
- Useful when incremental build has issues

### Combined Flags

```bash
./scripts/deploy-incremental.sh -y -f
```

- Force full build + auto-confirm

---

## 🔄 Complete Daily Workflow

### Morning Content Update

```bash
# 1. Run content generation pipeline
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17

# 2. Review generated content (optional)
ls -la public/data/articles/
ls -la public/data/publications/

# 3. Deploy incrementally
./scripts/deploy-incremental.sh -y
```

**Total time:** ~2 minutes (mostly content generation, deployment is ~5s)

### When You Also Changed Code

```bash
# 1. Generate content
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17

# 2. Make code changes
vim components/CyberHeader.vue

# 3. Script automatically detects code changes and runs full build
./scripts/deploy-incremental.sh -y
```

**Total time:** ~45 seconds (full build required)

---

## 📊 Performance Comparison

### Before (Full Build Always)

```
npm run generate         ~30-35s
./scripts/deploy-to-pages.sh  ~10-15s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                   ~40-50s
```

### After (Incremental for Content-Only)

```
Incremental build         ~2-3s
./scripts/deploy-to-pages.sh  ~10-15s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                    ~12-18s (70% faster!)
```

### Daily Impact

- **Before:** 50s per deployment
- **After:** 15s per deployment
- **Savings:** 35 seconds per day
- **Weekly savings:** ~4 minutes
- **Monthly savings:** ~17 minutes

---

## 🛠️ Technical Details

### Incremental Route Generator

**Script:** `scripts/content-generation-v2/generate-routes-incremental.ts`

**What it does:**

1. **Scans content directory**
   ```typescript
   const articles = await getArticleSlugs();
   const publications = await getPublicationSlugs();
   ```

2. **Checks existing routes**
   ```typescript
   const exists = await routeExists(outputDir, `/articles/${slug}`);
   ```

3. **Generates missing routes**
   ```typescript
   await generateRoute(outputDir, route, title, description);
   ```

**Generated HTML structure:**
- Minimal HTML shell
- Meta tags for SEO (title, description, OG tags)
- Links to Nuxt bundles (`/_nuxt/entry.js`, `/_nuxt/entry.css`)
- Client-side hydration on page load

**Why this works:**
- Nuxt is a SPA (Single Page Application)
- Each route just needs a shell HTML
- Real content loaded from JSON files client-side
- Vue router handles navigation

### File Preservation

The deployment script (`deploy-to-pages.sh`) already preserves:
- ✅ `CNAME` (custom domain)
- ✅ `.nojekyll` (GitHub Pages config)
- ✅ `README.md` (repo documentation)

Incremental builds **reuse** the existing `.output/public/` directory, so:
- ✅ Nuxt bundles preserved
- ✅ Optimized images preserved
- ✅ Static assets preserved
- ✅ Only content files + new routes updated

---

## 🚨 Troubleshooting

### "Incremental build failed - falling back to full build"

**Cause:** Missing `.output/public/` directory

**Solution:**
```bash
# Run full build once
npm run generate

# Then try incremental again
./scripts/deploy-incremental.sh
```

### "No git changes detected"

**Cause:** Files not staged/committed

**Solution:**
```bash
# Check git status
git status

# Stage your changes
git add public/data/

# Or commit first
git commit -am "Add new articles"

# Then deploy
./scripts/deploy-incremental.sh
```

### Routes return 404 after incremental deployment

**Cause:** Route generation failed or incomplete

**Solution:**
```bash
# Force full rebuild
./scripts/deploy-incremental.sh -f -y
```

### Incremental build not detecting changes correctly

**Cause:** Git state mismatch

**Solution:**
```bash
# Check what git sees as changed
git diff --name-only HEAD

# If needed, force full build
./scripts/deploy-incremental.sh -f
```

---

## 🔧 Configuration

### Customize Change Detection

Edit `scripts/deploy-incremental.sh`:

```bash
# Around line 75-85
local code_changes=$(echo "$changed_files" | grep -v \
    -e '^public/data/articles/' \
    -e '^public/data/publications/' \
    # Add more patterns to ignore here
    || true)
```

### Change Output Directory

```bash
# Default: .output/public
SOURCE_DIR=".output/public"

# Or use custom location
SOURCE_DIR="./dist"
```

### Modify Route Template

Edit `scripts/content-generation-v2/generate-routes-incremental.ts`:

```typescript
function generateRouteHtml(route: string, title: string, description?: string): string {
  // Customize HTML template here
  return `<!DOCTYPE html>...`;
}
```

---

## 📝 Best Practices

### When to Use Incremental

✅ **Good for:**
- Daily content updates (10-20 articles)
- Publication releases
- Index file updates
- Documentation changes

❌ **Not recommended for:**
- First deployment (no existing build)
- Major code refactoring
- Nuxt/dependency updates
- Route structure changes

### Fallback Strategy

The script **automatically falls back** to full build when:
- Code files changed
- `.output/public/` doesn't exist
- Route generation fails
- Forced via `--full` flag

**This means it's safe to use by default!**

### Verification After Deployment

```bash
# Check deployed routes
curl -I https://cyber.netsecops.io/articles/art-2025-10-17-new-article

# Should return: HTTP/2 200

# Check new content appears
curl https://cyber.netsecops.io/data/articles-index.json | jq '.totalCount'
```

---

## 🎯 Integration with Content Pipeline

### Updated Daily Workflow

```bash
#!/bin/bash
# daily-update.sh

DATE=$(date +%Y-%m-%d)

echo "🚀 Daily Content Update - $DATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Generate content
echo "📝 Running content pipeline..."
./scripts/content-generation-v2/run-pipeline.sh $DATE

# Step 2: Deploy incrementally
echo ""
echo "🚀 Deploying to production..."
./scripts/deploy-incremental.sh -y

echo ""
echo "✅ Daily update completed!"
```

Make it executable:
```bash
chmod +x daily-update.sh
```

Run daily:
```bash
./daily-update.sh
```

---

## 📚 Related Documentation

- **Full Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Content Pipeline:** [CONTENT-GENERATION-V2-PIPELINE.md](CONTENT-GENERATION-V2-PIPELINE.md)
- **Quick Start:** [QUICK-START.md](QUICK-START.md)

---

**Status:** ✅ Production Ready  
**Performance Gain:** 70% faster for content-only updates  
**Last Updated:** October 17, 2025
