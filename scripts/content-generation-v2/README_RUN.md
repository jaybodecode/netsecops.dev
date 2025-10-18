# Content Generation V3 - Quick Reference

**Purpose**: Command reference for daily pipeline execution  
**Last Updated**: October 2025

---

## 📑 Quick Navigation

| Section | Description |
|---------|-------------|
| [🚀 Run Pipeline](#-run-pipeline) | Automated daily pipeline execution |
| [�️ OG Image Generation](#%EF%B8%8F-og-image-generation-step-85) | Generate Open Graph images for social media |
| [�🗄️ Database Management](#%EF%B8%8F-database-management) | Clean database, delete articles by date |
| [🔍 Inspect Database](#-inspect-database) | Query database with view-logs tool |
| [🔧 Troubleshooting](#-troubleshooting) | Common issues and fixes |

---

## 🚀 Run Pipeline

### Full Automated Pipeline

```bash
# Run complete pipeline for specific date
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17

# Skip build/deploy (testing only)
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17 --no-publish

# Start from step 3 (default, skips expensive Steps 1-2)
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17 --start-step 3

# Skip updating old articles (Step 5.5)
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17 --skip-step-5.5
```

**Pipeline Steps**:
1. Search news (expensive LLM, usually skip)
2. Structure content (expensive LLM, usually skip)
3. Generate articles
4. Check duplicates
5. Generate publications
6. Generate article JSON
7. Generate indexes
8. Generate last-updates
8.5. Generate OG images
9. Build site - skipped with --no-publish
10. Deploy to GitHub Pages - skipped with --no-publish

**Options**:
- `--start-step N` - Start from step N (default: 3)
- `--skip-step-5.5` - Don't regenerate updated articles
- `--no-publish` - Skip build and deployment

### Manual Step-by-Step

```bash
DATE="2025-10-17"

# Step 3: Generate articles
npx tsx scripts/content-generation-v2/insert-articles.ts --date $DATE --logtodb

# Step 4: Check duplicates
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date $DATE --logtodb

# Step 5: Generate publication
npx tsx scripts/content-generation-v2/generate-publication.ts --date $DATE

# Step 5.5: Regenerate updated articles
npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date $DATE

# Step 6: Generate article JSON files
npx tsx scripts/content-generation-v2/generate-article-json.ts --date $DATE

# Step 7: Generate indexes
npx tsx scripts/content-generation-v2/generate-indexes.ts

# Step 8: Generate last-updates
npx tsx scripts/content-generation-v2/generate-last-updates.ts --date $DATE

# Step 8.5: Generate OG images
npx tsx scripts/content-generation-v2/export-tweets-for-images.ts --date $DATE
npx tsx scripts/content-generation-v2/generate-twitter-images.ts
```

---

## �️ OG Image Generation (Step 8.5)

### What It Does

Generates Open Graph (OG) images for articles published on a specific date. These 1200×675px images are used by social media platforms (Twitter, LinkedIn, Facebook) when articles are shared.

### Usage

```bash
# Generate OG images for specific date (two-step process)
DATE="2025-10-17"

# Step 1: Export articles to tmp/twitter/tweets.json
npx tsx scripts/content-generation-v2/export-tweets-for-images.ts --date $DATE

# Step 2: Generate PNG images from JSON
npx tsx scripts/content-generation-v2/generate-twitter-images.ts
```

### Scripts

**`export-tweets-for-images.ts`**
- Queries database for NEW articles on specific date
- Exports to `tmp/twitter/tweets.json` format
- Required fields: slug, headline, twitter_post, category, severity

**`generate-twitter-images.ts`**
- Reads `tmp/twitter/tweets.json`
- Launches Puppeteer (headless Chromium)
- Renders HTML template with Tailwind CSS
- Takes screenshots at 1200×675px (2x device scale)
- Saves to `public/images/og-image/{slug}.png`

### Options

```bash
# Export with custom date
npx tsx scripts/content-generation-v2/export-tweets-for-images.ts --date 2025-10-17

# Generate images with custom output directory
npx tsx scripts/content-generation-v2/generate-twitter-images.ts --output public/images/og-image
```

### Performance

- First image: ~3-4s (browser startup)
- Subsequent images: ~2.5s each
- Batch of 10 images: ~25-30s total
- File size: 500KB - 1.1MB per image

### Output

Images are saved to: `public/images/og-image/{article-slug}.png`

Example:
```
public/images/og-image/
├── cisa-issues-advisories-oct-17.png
├── new-ransomware-variant-detected.png
└── critical-apache-vulnerability.png
```

### Troubleshooting

**No images generated**:
```bash
# Check if articles were exported
cat tmp/twitter/tweets.json | jq length

# If 0, check if articles exist for date
npx tsx scripts/content-generation-v2/view-logs.ts resolutions --date 2025-10-17
```

**Browser errors**:
```bash
# Ensure Puppeteer is installed
npm install puppeteer

# Check Chromium is available
npx puppeteer browsers install chrome
```

---

## �🗄️ Database Management

### Clean Database

```bash
# Interactive - asks for confirmation
npx tsx scripts/content-generation-v2/clean-database.ts

# Force clean (no confirmation)
npx tsx scripts/content-generation-v2/clean-database.ts --force

# Dry run
npx tsx scripts/content-generation-v2/clean-database.ts --dry-run
```

### Delete Articles by Date

```bash
# Delete articles from specific date
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts 2025-10-17

# Force without confirmation
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts 2025-10-17 --force

# Skip regenerating indexes (faster)
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts 2025-10-17 --skip-indexes
```

---

## 🔍 Inspect Database

```bash
# View database table statistics
npx tsx scripts/content-generation-v2/view-logs.ts tables

# Check API costs
npx tsx scripts/content-generation-v2/view-logs.ts costs --days 7
npx tsx scripts/content-generation-v2/view-logs.ts costs --date 2025-10-17

# View API call logs
npx tsx scripts/content-generation-v2/view-logs.ts api --limit 20
npx tsx scripts/content-generation-v2/view-logs.ts api --script search-news --today

# Check article resolutions
npx tsx scripts/content-generation-v2/view-logs.ts resolutions --date 2025-10-17

# Check articles that received updates
npx tsx scripts/content-generation-v2/view-logs.ts updates --date 2025-10-17

# Check severity distribution
npx tsx scripts/content-generation-v2/view-logs.ts severity --days 7
```

**Available Commands**:
- `tables` - Database table row counts
- `costs` - API cost analysis
- `api` - API call logs with filters
- `resolutions` - Article resolution distribution
- `updates` - Articles that received updates
- `severity` - Severity distribution

---

## 🔧 Troubleshooting

### Issue: "No articles found for date"

```bash
# Check what's in database
npx tsx scripts/content-generation-v2/view-logs.ts tables
```

### Issue: "High API costs"

```bash
# View costs by date
npx tsx scripts/content-generation-v2/view-logs.ts costs --days 7
```

### Daily Health Check

```bash
DATE=$(date -v-1d +%Y-%m-%d)
echo "📊 Health Check for $DATE"
npx tsx scripts/content-generation-v2/view-logs.ts resolutions --date $DATE
npx tsx scripts/content-generation-v2/view-logs.ts costs --date $DATE
npx tsx scripts/content-generation-v2/view-logs.ts severity --days 1
```

---

## 🎯 Quick Command Reference

```bash
# Run daily pipeline
./scripts/content-generation-v2/run-pipeline.sh $(date -v-1d +%Y-%m-%d)

# Re-run content generation (Steps 3-8)
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts 2025-10-17 --force
./scripts/content-generation-v2/run-pipeline.sh 2025-10-17 --start-step 3 --no-publish

# Check results
npx tsx scripts/content-generation-v2/view-logs.ts resolutions --date 2025-10-17
npx tsx scripts/content-generation-v2/view-logs.ts costs --date 2025-10-17
```
