# GitHub Pages Deployment Guide

## Overview
Complete guide for deploying CyberNetSec.io to GitHub Pages using the automated deployment script.

- **Development Repo**: `jaybodecode/netsecops.dev` (this workspace)
- **Target Repo**: `jaybodecode/netsecops.github.io` (GitHub Pages hosting)
- **Live Site**: https://cyber.netsecops.io
- **Method**: Static site generation with automated, safe deployment script

---

## 🚀 Quick Start

### Prerequisites
1. **GitHub CLI** installed and authenticated
2. **Write access** to `jaybodecode/netsecops.github.io`
3. **Clean static build** in `.output/public/`

### Deploy in 3 Steps

```bash
# 1. Generate static site
npm run generate

# 2. Deploy to GitHub Pages (interactive)
./scripts/deploy-to-pages.sh

# 3. Verify deployment
# Visit: https://cyber.netsecops.io
```

---

## 📖 Complete Deployment Guide

### Step 1: Pre-Deployment Checklist

**Verify Environment:**
```bash
# Check GitHub CLI authentication
gh auth status

# Verify write access to target repo
gh repo view jaybodecode/netsecops.github.io

# Check node modules are installed
npm install
```

**Update Content Indexes (if new articles/publications added):**
```bash
# Regenerate articles index from public/data/articles/*.json
node scripts/generate-articles-index.mjs

# Regenerate publications index from public/data/publications/*.json
node scripts/generate-publications-index.mjs

# Or run both together:
node scripts/generate-articles-index.mjs && node scripts/generate-publications-index.mjs
```

**What Index Regeneration Does:**
- `generate-articles-index.mjs`: Scans all JSON files in `public/data/articles/`, extracts metadata (id, slug, title, headline, publishedAt, excerpt, tags, categories, severity, author), sorts by date descending, and writes to `public/data/articles-index.json` with totalCount and lastUpdated timestamp
- `generate-publications-index.mjs`: Scans all JSON files in `public/data/publications/`, determines publication type (weekly-digest, daily-digest, special-report, monthly-roundup), calculates reading time (3min per article, min 10min), and writes to `public/data/publications-index.json`

**When to Regenerate Indexes:**
- ✅ After adding new article JSON files to `public/data/articles/`
- ✅ After adding new publication JSON files to `public/data/publications/`
- ✅ After modifying article/publication metadata (title, tags, etc.)
- ❌ Not needed if only changing page components or styles

**Review Changes:**
- Run linting: `npm run lint`
- Run type checking: `npm run type-check`
- Test dev server: Use "Run Dev Server" task
- Review all file changes before building

### Step 2: Generate Static Site

```bash
# Full static site generation
npm run generate
```

**What This Does:**
- Builds production-optimized Vue/Nuxt code
- Pre-renders all routes (SSG - Static Site Generation)
- Generates SEO metadata and sitemap
- Optimizes images with `@nuxt/image`
- Creates `.output/public/` directory with static files

**Expected Output:**
```
✔ Client built in 4761ms
✔ Server built in 3110ms
ℹ Prerendered 45 routes in 9.594 seconds
✔ Generated public .output/public
```

**Verify Build:**
```bash
# Check generated files
ls -la .output/public/

# Preview locally (optional)
npm run preview
```

### Step 3: Run Deployment Script

```bash
./scripts/deploy-to-pages.sh
```

**Interactive Deployment Process:**

1. **Prerequisites Check**
   - Verifies GitHub CLI is installed
   - Confirms authentication
   - Checks write access to target repository
   - Validates `.output/public/` exists

2. **Repository Clone**
   - Creates temporary directory: `/tmp/netsecops-pages-deploy`
   - Clones target repository

3. **File Preservation**
   - Automatically backs up critical files:
     - `CNAME` (custom domain: `cyber.netsecops.io`)
     - `.nojekyll` (disables Jekyll processing)
     - `README.md` (repository documentation)

4. **Content Deployment**
   - Clears old content from target repo
   - Copies new build from `.output/public/`
   - Restores preserved critical files

5. **Preview & Confirmation**
   - Shows git diff of changes
   - Lists all modified files
   - **Prompts for confirmation** before pushing

6. **Push to GitHub**
   - Commits changes with timestamp
   - Pushes to `main` branch
   - GitHub Pages automatically deploys

7. **Cleanup**
   - Removes temporary files
   - Reports success status

**Example Output:**
```
🚀 CyberNetSec.io GitHub Pages Deployment
==================================================
📋 Checking prerequisites...
✅ Prerequisites met
📥 Cloning target repository...
💾 Preserving critical files...
  ✅ Preserved: CNAME
  ✅ Preserved: .nojekyll
  ✅ Preserved: README.md
🗑️  Clearing target directory...
📋 Copying new content...
🔄 Restoring preserved files...
📊 Deployment summary:
  Total files: 29
  Critical files preserved: ✅

🤔 Ready to deploy to jaybodecode/netsecops.github.io
Continue with deployment? (y/N): y

📤 Committing and pushing...
🚀 Pushing to GitHub...
🎉 Deployment completed successfully!
🌐 Your site should be available at: https://cyber.netsecops.io
```

### Step 4: Verify Deployment

**Immediate Checks:**
```bash
# Check GitHub Pages deployment status
gh repo view jaybodecode/netsecops.github.io --web

# View recent commits
gh repo view jaybodecode/netsecops.github.io
```

**Site Verification:**
1. Visit https://cyber.netsecops.io
2. Check:
   - Homepage loads correctly
   - Articles page displays
   - Publications page displays
   - Navigation works
   - Favicon appears (cyberpunk shield)
   - Google Search Console verification meta tag present

**Troubleshooting Deployment Issues:**
- GitHub Pages typically deploys in 1-2 minutes
- Check GitHub Actions in target repo for build status
- Clear browser cache if changes don't appear
- Verify CNAME file contains: `cyber.netsecops.io`

---

## 🛠️ Technical Details

### Nuxt Static Generation Configuration

**File:** `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  ssr: true,
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      failOnError: false,
    },
  },
  
  // Static site settings
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
  },
  
  // SEO and metadata
  site: {
    url: 'https://cyber.netsecops.io',
    name: 'CyberNetSec.io',
  },
})
```

### Deployment Script Architecture

**File:** `scripts/deploy-to-pages.sh`

**Key Functions:**

1. **`check_prerequisites()`**
   - Validates GitHub CLI installation
   - Checks authentication status
   - Verifies repository access
   - Ensures build directory exists

2. **`preserve_files()`**
   - Backs up: CNAME, .nojekyll, README.md
   - Stores in temporary location
   - Handles missing files gracefully

3. **`restore_files()`**
   - Copies preserved files back after deployment
   - Maintains GitHub Pages configuration

4. **`cleanup()`**
   - Removes temporary directories
   - Runs automatically on script exit
   - Handles errors gracefully

**Safety Features:**
- ✅ Non-destructive to local workspace
- ✅ Preserves critical GitHub Pages files
- ✅ Interactive confirmation before push
- ✅ Full preview of changes
- ✅ Automatic cleanup on failure
- ✅ Detailed status reporting at each step

### Generated Static Site Structure

```
.output/public/
├── _nuxt/                    # Nuxt bundles (JS/CSS)
├── _payload.json             # Prerendered data
├── articles/                 # Article pages
│   ├── index.html
│   ├── art-2025-01-06-zero-day/
│   ├── art-2025-01-07-supply-chain/
│   └── ...
├── publications/             # Publication pages
│   ├── index.html
│   └── ...
├── data/                     # JSON data files
│   ├── articles-index.json
│   ├── publications-index.json
│   └── articles/*.json
├── images/                   # Optimized images
├── favicon.ico               # Multi-resolution favicon
├── favicon.svg               # Vector favicon
├── favicon-16.png            # 16x16 favicon
├── favicon-32.png            # 32x32 favicon
├── favicon-48.png            # 48x48 favicon
├── index.html                # Homepage
├── sitemap.xml               # SEO sitemap
├── robots.txt                # Search engine directives
├── 200.html                  # SPA fallback
└── 404.html                  # Error page
```

### GitHub Pages Configuration

**Target Repository Settings:**
- **Source**: Deploy from branch `main` / `/ (root)`
- **Custom domain**: `cyber.netsecops.io` (configured via CNAME)
- **Enforce HTTPS**: Enabled (automatic)
- **Build and deployment**: Classic GitHub Pages (not Actions)

**DNS Configuration:**
- CNAME record: `cyber.netsecops.io` → `jaybodecode.github.io`
- Configured at DNS provider level
- HTTPS certificate auto-generated by GitHub

---

## 🔒 Security & Safety

### Protected Files

These files in the target repository are **never overwritten**:

1. **CNAME** - Custom domain configuration
   ```
   cyber.netsecops.io
   ```

2. **.nojekyll** - Disables Jekyll processing
   - Empty file that tells GitHub Pages to serve files directly
   - Critical for Nuxt/Vue apps with `_nuxt` directories

3. **README.md** - Repository documentation
   - Provides context for the GitHub Pages repository

### Deployment Safety Features

**Pre-Deployment:**
- ✅ Validates authentication and permissions
- ✅ Checks build directory exists and is not empty
- ✅ Clones to temporary directory (not local workspace)

**During Deployment:**
- ✅ Preserves critical files before clearing
- ✅ Shows full diff of changes
- ✅ Requires explicit confirmation (`y`) to proceed
- ✅ Can be cancelled safely at any time (`n` or Ctrl+C)

**Post-Deployment:**
- ✅ Automatic cleanup of temporary files
- ✅ Success/failure status reporting
- ✅ Site URL provided for verification

**Error Handling:**
- Graceful failure on any error
- Automatic cleanup even on failure
- Clear error messages
- Safe to re-run after fixing issues

---

## 📊 Deployment History

### First Deployment
- **Date**: October 11, 2025, 03:23 AM
- **Commit**: `b118497` - "Deploy CyberNetSec.io site - 2025-10-11 03:23:11"
- **Changes**: 48 files changed, 110 insertions, 43 deletions
- **Features Deployed**:
  - ✅ Complete Nuxt 4.1.3 static site
  - ✅ Google Search Console verification
  - ✅ Cyberpunk shield favicon (SVG + ICO)
  - ✅ 45 pre-rendered routes
  - ✅ SEO optimization with sitemap
  - ✅ 0 build errors, 0 warnings
  - ✅ GTM container configured (GTM-NDQRG373) - Lazy loaded via custom plugin

### Deployment Stats
- **Build Time**: ~10 seconds
- **Deployment Time**: ~30-60 seconds
- **Total Routes**: 45 pages
- **Static Assets**: Images, JSON data, favicon files
- **Bundle Size**: Optimized for production

---

## 🐛 Troubleshooting

### Common Issues

**1. GitHub CLI Not Authenticated**
```bash
# Solution:
gh auth login
```

**2. No Write Access to Repository**
```bash
# Check access:
gh repo view jaybodecode/netsecops.github.io

# Solution: Request access or authenticate with correct account
```

**3. Build Directory Missing**
```bash
# Solution: Generate static site
npm run generate
```

**4. Deployment Fails Mid-Process**
- Script includes automatic cleanup
- Safe to re-run after fixing the underlying issue
- Check error message for specific problem

**5. Site Not Updating After Deployment**
- Wait 1-2 minutes for GitHub Pages to deploy
- Hard refresh browser (Cmd+Shift+R or Ctrl+F5)
- Clear browser cache
- Check GitHub Pages status in target repo

**6. CNAME or .nojekyll Missing**
- Script automatically preserves these files
- If missing from target repo, manually add them:
  ```bash
  echo "cyber.netsecops.io" > CNAME
  touch .nojekyll
  ```

### Manual Recovery

If the automated script fails, you can manually deploy:

```bash
# 1. Clone target repository
git clone https://github.com/jaybodecode/netsecops.github.io.git /tmp/manual-deploy
cd /tmp/manual-deploy

# 2. Preserve critical files
cp CNAME /tmp/CNAME.backup
cp .nojekyll /tmp/.nojekyll.backup

# 3. Clear directory (except .git)
rm -rf * .[^.]*
git checkout CNAME .nojekyll

# 4. Copy new build
cp -r /path/to/cybernetsec-io/.output/public/* .

# 5. Restore preserved files
cp /tmp/CNAME.backup CNAME
cp /tmp/.nojekyll.backup .nojekyll

# 6. Commit and push
git add -A
git commit -m "Manual deployment - $(date)"
git push origin main
```

---

## 📚 Additional Resources

### Related Documentation
- **Deployment Script Details**: [scripts/deploy-to-pages.md](scripts/deploy-to-pages.md)
- **Quick Reference**: [README.md](README.md) - See "Deployment" section
- **Build Configuration**: `nuxt.config.ts`
- **Tasks Configuration**: `.vscode/tasks.json`

### External Resources
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Nuxt Static Site Generation](https://nuxt.com/docs/getting-started/deployment#static-hosting)
- [GitHub CLI Documentation](https://cli.github.com/manual/)

### Support
For deployment issues or questions:
- Check GitHub Pages status: https://www.githubstatus.com/
- Review GitHub Actions logs in target repository
- Verify DNS configuration at domain provider

---

## 🎯 Best Practices

### Before Each Deployment

1. **Test Locally**
   ```bash
   npm run generate
   npm run preview
   ```

2. **Run Quality Checks**
   ```bash
   npm run lint
   npm run type-check
   ```

3. **Verify Content**
   - Review article data in `public/data/`
   - Check image assets are optimized
   - Test navigation and links

4. **Review Changes**
   - Use git to see what changed since last deploy
   - Update version numbers if applicable
   - Document significant changes

### During Deployment

1. **Review Preview**
   - Carefully read the git diff shown by script
   - Verify critical files are preserved
   - Check file counts make sense

2. **Confirm Only When Ready**
   - Type `y` only when certain
   - Use `n` or Ctrl+C to cancel safely

3. **Monitor Progress**
   - Watch for error messages
   - Note the deployment timestamp
   - Save the commit hash

### After Deployment

1. **Verify Live Site**
   - Check all major pages load
   - Test navigation
   - Verify new content appears
   - Check favicon displays correctly

2. **Test Performance**
   - Run Lighthouse audit
   - Check page load times
   - Verify images load properly

3. **Document Deployment**
   - Note deployment time
   - Record any issues encountered
   - Update CHANGELOG if maintained

---

**Status**: ✅ Complete - Production Ready  
**Last Updated**: October 11, 2025  
**Deployment Script Version**: 1.0  
**Last Successful Deploy**: October 11, 2025, 03:23 AM