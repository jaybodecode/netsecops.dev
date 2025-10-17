# GitHub Actions - Automated Content Generation & Publishing

> **Purpose:** Automate daily cybersecurity content generation and site deployment using GitHub Actions instead of Firebase Functions.

---

## 🎯 Architecture Overview

### **The Big Picture**
```
Daily @ 6 AM UTC (GitHub Actions):
┌─────────────────────────────────────────────────────────┐
│ 1. Trigger: Scheduled (cron) or Manual                 │
│ 2. Checkout Repository                                 │
│ 3. Setup Node.js Environment                           │
│ 4. Install Dependencies (npm install)                  │
│ 5. Generate Content (NEW!)                             │
│    ├─ Fetch cybersecurity news from sources           │
│    ├─ Generate articles (AI-powered)                  │
│    ├─ Generate daily/weekly publications              │
│    ├─ Generate images for content                     │
│    └─ Generate index files                            │
│ 6. Build Static Site (npm run generate)               │
│ 7. Deploy to GitHub Pages                             │
│ 8. Commit generated content back to repo (optional)   │
└─────────────────────────────────────────────────────────┘
```

### **Why GitHub Actions > Firebase Functions**

| Feature | GitHub Actions | Firebase Functions |
|---------|----------------|-------------------|
| **Build Environment** | ✅ Already needed for site | ❌ Separate deployment |
| **Execution Time** | ✅ Up to 6 hours | ❌ 9 minutes max |
| **Cost (Public Repo)** | ✅ 2,000 min/month FREE | ❌ Pay per invocation |
| **Cold Starts** | ✅ None | ❌ Yes |
| **Scheduling** | ✅ Native cron | ❌ Need Cloud Scheduler |
| **Secrets Management** | ✅ GitHub Secrets | ❌ Firebase config |
| **Testing** | ✅ Run locally first | ❌ Deploy to test |
| **Logs** | ✅ Excellent UI | ✅ Good |
| **Deployment** | ✅ Git commit | ❌ Separate deploy |

**Decision:** Use GitHub Actions. Same scripts run locally AND in CI/CD.

---

## 📁 Project Structure

```
scripts/
├── content-generation/          # Content generation system
│   ├── config/                  # Configuration files
│   │   ├── prompts.mjs         # AI prompts for content generation
│   │   ├── sources.mjs         # News sources configuration
│   │   └── defaults.mjs        # Default settings
│   ├── lib/                     # Shared utilities
│   │   ├── file-utils.mjs      # File I/O operations
│   │   ├── api-client.mjs      # API clients (OpenAI, etc.)
│   │   ├── validators.mjs      # Data validation
│   │   └── logger.mjs          # Logging utilities
│   ├── generators/              # Content generators
│   │   ├── articles.mjs        # Article generation
│   │   ├── publications.mjs    # Publication generation
│   │   ├── images.mjs          # Image generation
│   │   └── indexes.mjs         # Index file generation
│   └── cli/                     # CLI entry points
│       ├── generate-articles.mjs
│       ├── generate-publications.mjs
│       ├── generate-images.mjs
│       ├── generate-indexes.mjs
│       └── generate-all.mjs    # Main orchestrator
├── generate-articles-index.mjs  # Existing index generator
└── generate-publications-index.mjs

.github/
└── workflows/
    ├── daily-publish.yml        # Scheduled daily run
    ├── manual-publish.yml       # Manual trigger
    └── test-generation.yml      # Test content generation only
```

---

## 🔧 Local Development Workflow

### **1. Environment Setup**

Create `.env` file (gitignored):
```bash
# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Image Generation (optional)
STABILITY_API_KEY=sk-...
DALLE_API_KEY=sk-...

# Content Sources
NEWS_API_KEY=...
THREATPOST_API_KEY=...

# Configuration
GENERATION_MODE=development  # development | production
DRY_RUN=false               # true to skip writes
VERBOSE=true                # detailed logging
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Test Individual Generators**

```bash
# Generate articles only
npm run generate:articles

# Generate publications only
npm run generate:publications

# Generate images only
npm run generate:images

# Generate indexes only
npm run generate:indexes

# Run everything
npm run generate:all
```

### **4. Test Full Build**

```bash
# Generate content + build site
npm run generate

# Preview locally
npm run preview
```

### **5. Manual Deploy** (if needed)

```bash
./scripts/deploy-to-pages.sh
```

---

## 🤖 GitHub Actions Setup

### **Step 1: Add Secrets to GitHub**

Go to: **Settings → Secrets and variables → Actions → New repository secret**

Add each secret:
```
OPENAI_API_KEY
ANTHROPIC_API_KEY
STABILITY_API_KEY
NEWS_API_KEY
# ... add all API keys from your .env
```

### **Step 2: Create Workflow Files**

#### **`.github/workflows/daily-publish.yml`** - Automated Daily Run

```yaml
name: Daily Content Generation & Publishing

on:
  schedule:
    # Run at 6 AM UTC every day (adjust timezone as needed)
    - cron: '0 6 * * *'
  workflow_dispatch:  # Allow manual trigger

jobs:
  generate-and-publish:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate content
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          STABILITY_API_KEY: ${{ secrets.STABILITY_API_KEY }}
          NEWS_API_KEY: ${{ secrets.NEWS_API_KEY }}
          GENERATION_MODE: production
          DRY_RUN: false
        run: npm run generate:all
      
      - name: Commit generated content
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add public/data/articles/*.json
          git add public/data/publications/*.json
          git add public/data/articles-index.json
          git add public/data/publications-index.json
          git diff-index --quiet HEAD || git commit -m "chore: auto-generate daily content [skip ci]"
          git push
      
      - name: Build static site
        run: npm run generate
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./.output/public
          cname: cybernetsec.io  # Your custom domain
```

#### **`.github/workflows/manual-publish.yml`** - Manual Trigger

```yaml
name: Manual Content Generation

on:
  workflow_dispatch:
    inputs:
      generation_mode:
        description: 'Generation mode'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - development
      dry_run:
        description: 'Dry run (no writes)'
        required: false
        default: false
        type: boolean
      skip_images:
        description: 'Skip image generation'
        required: false
        default: false
        type: boolean

jobs:
  generate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Generate content
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GENERATION_MODE: ${{ inputs.generation_mode }}
          DRY_RUN: ${{ inputs.dry_run }}
          SKIP_IMAGES: ${{ inputs.skip_images }}
        run: npm run generate:all
      
      # ... rest of deploy steps
```

#### **`.github/workflows/test-generation.yml`** - Test Only

```yaml
name: Test Content Generation

on:
  pull_request:
    paths:
      - 'scripts/content-generation/**'
      - 'package.json'
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      - name: Test generators (dry run)
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          DRY_RUN: true
          VERBOSE: true
        run: |
          npm run generate:articles
          npm run generate:publications
          npm run generate:indexes
      
      - name: Validate generated data
        run: npm run validate:content
```

---

## 📦 NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "generate:articles": "node scripts/content-generation/cli/generate-articles.mjs",
    "generate:publications": "node scripts/content-generation/cli/generate-publications.mjs",
    "generate:images": "node scripts/content-generation/cli/generate-images.mjs",
    "generate:indexes": "node scripts/content-generation/cli/generate-indexes.mjs",
    "generate:all": "node scripts/content-generation/cli/generate-all.mjs",
    "validate:content": "node scripts/content-generation/cli/validate-content.mjs"
  }
}
```

---

## 🔄 Data Flow & Optimization

### **Pipeline Stages**

```
Stage 1: Fetch News Sources (5-10 min)
  ├─ Output: Raw news data in memory
  └─ Pass to Stage 2 ✓

Stage 2: Generate Articles (10-20 min)
  ├─ Input: Raw news data
  ├─ Output: Article JSON files + article metadata array
  └─ Pass metadata to Stage 3 ✓

Stage 3: Generate Publications (5-10 min)
  ├─ Input: Article metadata array (from Stage 2)
  ├─ Output: Publication JSON files
  └─ Pass to Stage 4 ✓

Stage 4: Generate Images (10-30 min, parallel)
  ├─ Input: Article & publication metadata
  ├─ Output: Image files + updated JSON with image URLs
  └─ Parallel execution for speed ✓

Stage 5: Generate Indexes (1-2 min)
  ├─ Input: Final article & publication JSON files
  ├─ Output: Index JSON files
  └─ Complete! ✓
```

### **Memory Optimization**

```javascript
// ❌ BAD: Read files multiple times
async function generatePublications() {
  const articles = await readAllArticleFiles()  // Slow!
}

// ✅ GOOD: Pass data through pipeline
async function runPipeline() {
  const newsData = await fetchNews()
  const articles = await generateArticles(newsData)
  const publications = await generatePublications(articles)  // Reuse!
  await generateImages([...articles, ...publications])
  await generateIndexes()  // Reads final files once
}
```

---

## 🎛️ Configuration

### **Environment Variables**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI API key | `sk-proj-...` |
| `GENERATION_MODE` | No | Mode (development/production) | `production` |
| `DRY_RUN` | No | Skip file writes | `false` |
| `VERBOSE` | No | Detailed logging | `true` |
| `SKIP_IMAGES` | No | Skip image generation | `false` |
| `MAX_ARTICLES` | No | Limit articles generated | `50` |

### **Generation Modes**

**Development Mode:**
- Generate fewer articles (5-10)
- Use cheaper AI models
- More verbose logging
- Faster iteration

**Production Mode:**
- Generate full content (50+ articles)
- Use best AI models
- Concise logging
- Full quality

---

## 🚨 Error Handling & Monitoring

### **GitHub Actions Notifications**

Enable in: **Settings → Notifications → Actions**

- ✅ Email on workflow failure
- ✅ Slack/Discord webhook (optional)

### **Retry Logic**

```javascript
// Built into generators
async function generateWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(1000 * Math.pow(2, i))  // Exponential backoff
    }
  }
}
```

### **Partial Success**

```javascript
// If 45/50 articles succeed, still proceed
// Log failures but don't block pipeline
const results = await Promise.allSettled(articlePromises)
const succeeded = results.filter(r => r.status === 'fulfilled')
console.log(`✅ ${succeeded.length}/${results.length} articles generated`)
```

---

## 📊 Monitoring & Debugging

### **View Workflow Runs**

Go to: **Actions tab** in GitHub repository

### **Check Logs**

1. Click on workflow run
2. Expand job steps
3. View detailed logs

### **Download Artifacts** (optional)

```yaml
- name: Upload generation logs
  uses: actions/upload-artifact@v3
  with:
    name: generation-logs
    path: logs/
    retention-days: 7
```

### **Local Testing**

```bash
# Test with same env as GitHub Actions
GENERATION_MODE=production \
DRY_RUN=false \
npm run generate:all
```

---

## 🔐 Security Best Practices

1. **Never commit API keys** - Use GitHub Secrets only
2. **Rotate keys regularly** - Update secrets every 90 days
3. **Limit scope** - Use read-only keys where possible
4. **Monitor usage** - Check API dashboards for anomalies
5. **Use `[skip ci]`** - In commit messages to avoid infinite loops

---

## 🚀 Deployment Checklist

- [ ] Add all API keys to GitHub Secrets
- [ ] Create workflow files in `.github/workflows/`
- [ ] Test locally with `npm run generate:all`
- [ ] Test dry run: `DRY_RUN=true npm run generate:all`
- [ ] Trigger manual workflow first
- [ ] Verify generated content in repo
- [ ] Verify site deployed to GitHub Pages
- [ ] Enable scheduled workflow (cron)
- [ ] Monitor first few runs
- [ ] Set up failure notifications

---

## 📝 Common Issues & Solutions

### **Issue: Workflow doesn't trigger**

**Solution:** Check cron syntax, ensure workflow file is in `main` branch

### **Issue: API rate limits**

**Solution:** Add rate limiting in generators, use exponential backoff

### **Issue: Timeout (6 hour limit)**

**Solution:** Reduce `MAX_ARTICLES`, skip image generation if needed

### **Issue: Out of memory**

**Solution:** Process in batches, use streams for large files

### **Issue: Deployment fails**

**Solution:** Check GitHub Pages settings, verify `publish_dir` path

---

## 🎓 Next Steps

1. ✅ **Build CLI Scripts** - Local development first
2. ✅ **Test Thoroughly** - Run multiple times locally
3. ✅ **Create Workflows** - Add GitHub Actions YAML files
4. ✅ **Manual Test** - Trigger workflow manually first
5. ✅ **Enable Scheduling** - Let it run automatically
6. ✅ **Monitor & Iterate** - Improve based on logs

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Cron Syntax](https://crontab.guru/)
- [Deploying to GitHub Pages](https://github.com/peaceiris/actions-gh-pages)
- [OpenAI API Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

---

**Last Updated:** October 12, 2025
