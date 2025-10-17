# Publication System Design Document

> **Purpose:** Comprehensive design document for the automated content generation and publication system. Captures all architectural decisions, data structures, slug strategies, and implementation requirements discussed during planning.
>
> **⚠️ MAJOR UPDATE:** Architecture has been revised to use unified publication+article generation and entity-relationship database. See `ARCHITECTURE-DECISIONS.md` for the new approach.

**Last Updated:** October 13, 2025  
**Status:** ⚠️ Being Superseded by New Architecture

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Data Structures](#data-structures)
4. [Slug Strategy](#slug-strategy)
5. [Folder Structure](#folder-structure)
6. [Pipeline Flow](#pipeline-flow)
7. [API Requirements](#api-requirements)
8. [AI Prompt Guidelines](#ai-prompt-guidelines)
9. [Implementation Checklist](#implementation-checklist)

---

## 🎯 System Overview

### **Goal**
Automate daily cybersecurity content generation using AI (Vertex AI + Gemini) and deploy via GitHub Actions to a static Nuxt site.

### **Key Principles**
1. ✅ **GitHub Actions over Firebase Functions** - Leverage existing build environment
2. ✅ **Clean SEO-friendly URLs** - No dates in slugs, focus on keywords
3. ✅ **Organized folder structure** - Separate publications by type (daily/weekly/monthly/special)
4. ✅ **Duplicate detection** - Avoid republishing same story
5. ✅ **Update capability** - Enhance existing articles with new information
6. ✅ **Type safety** - Use existing TypeScript types from `types/cyber.ts`

### **Content Flow**
```
Daily News → Duplicate Check → Generate Articles → Group Publications → Generate Images → Build Indexes → Deploy Site
```

---

## 🏗️ Architecture Decisions

### **1. Deployment Platform**
**Decision:** GitHub Actions (NOT Firebase Functions)

**Rationale:**
- Already building site in GitHub Actions
- No cold starts or execution time limits (6 hours vs 9 minutes)
- Free for public repos (2,000 min/month)
- Same code runs locally and in CI/CD
- Native cron scheduling
- Better logging and debugging

**Implementation:**
- Scripts in `scripts/content-generation/`
- Workflow in `.github/workflows/daily-publish.yml`
- Scheduled run: 6 AM UTC daily

---

### **2. URL Strategy - NO Dates in Slugs**

**Decision:** Remove dates from slugs entirely

**Problem with Date-Based Slugs:**
```
❌ /articles/2025-10-08-ransomware-attack-healthcare
   - Looks outdated after a few days
   - Users skip "old" content
   - Hurts SEO click-through rate
   - Can't update article without changing URL
```

**Solution - Keyword-Focused Slugs:**
```
✅ /articles/ransomware-attack-memorial-hospital
   - Timeless appearance
   - Focuses on content, not age
   - Can update article anytime
   - Better for social sharing
   - Higher perceived freshness
```

**Show Dates In:**
- ✅ Article metadata (publishedAt, updatedAt)
- ✅ Article header UI
- ✅ Search results
- ❌ NOT in URLs

**Internal IDs Keep Dates:**
```javascript
{
  "id": "article-2025-10-12-001",              // Internal identifier
  "slug": "ransomware-memorial-hospital",      // Public URL
  "publishedAt": "2025-10-12T06:00:00Z",
  "updatedAt": "2025-10-15T10:30:00Z"         // Show it's fresh!
}
```

---

### **3. Folder Structure - Organize by Type**

**Decision:** Separate publications into type-specific folders

**Structure:**
```
public/data/
├── articles/
│   ├── article-2025-10-12-001.json
│   ├── article-2025-10-12-002.json
│   └── ...
└── publications/
    ├── daily/
    │   ├── daily-2025-10-12.json
    │   ├── daily-2025-10-11.json
    │   └── ...
    ├── weekly/
    │   ├── weekly-2025-w41.json
    │   ├── weekly-2025-w40.json
    │   └── ...
    ├── monthly/
    │   ├── monthly-2025-10.json
    │   ├── monthly-2025-09.json
    │   └── ...
    └── special/
        ├── q3-threat-landscape-report.json
        ├── ransomware-annual-analysis.json
        └── ...
```

**Benefits:**
- ✅ Clear separation by type
- ✅ Easier to manage hundreds of files
- ✅ Simpler archiving (delete old daily folders)
- ✅ Better performance (smaller directory listings)
- ✅ Type-specific operations

**Transparent to UI:**
- Index stores folder location
- API routes handle lookup automatically
- UI filters by type metadata
- No breaking changes to existing code

---

## 📊 Data Structures

### **Articles**

**File Location:** `public/data/articles/{id}.json`

**Schema:** Use existing `CyberArticle` from `types/cyber.ts`

```typescript
interface CyberArticle {
  // Core Identity
  id: string                              // article-2025-10-12-001
  slug: string                            // ransomware-memorial-hospital
  
  // Headlines & Titles
  headline: string                        // Short, punchy (40-80 chars)
  title: string                           // Full descriptive title
  
  // Content
  summary: string                         // Detailed summary
  full_report?: string                    // Complete analysis (markdown)
  
  // SEO & Social
  meta_description: string
  og_title: string
  og_description: string
  og_image: string
  twitter_post: string                    // Ready to publish
  linkedin_post: string                   // Ready to publish
  
  // Categorization
  category: ArticleCategory[]             // 1-3 categories
  tags: string[]                          // General tags
  keywords: string[]                      // SEO keywords
  
  // Cybersecurity Data
  events: ArticleEvent[]                  // Timeline
  cves: string[]                          // CVE IDs
  entities: ArticleEntity[]               // Mentioned entities
  
  // Industry & Geography
  affected_industries: string[]
  geographic_scope: 'local' | 'regional' | 'national' | 'global'
  
  // Sources
  sources: ArticleSource[]
  
  // Metadata
  article_type: 'Report' | 'NewsArticle' | 'Advisory' | 'Analysis'
  reading_time_minutes: number
  extract_datetime: string                // ISO 8601 timestamp
  
  // Related Content
  related_article_ids: string[]
  
  // Images
  featured_image_url: string
  featured_image_alt: string
}
```

**Key Fields for Slug Generation:**
- `headline` - Primary source for slug keywords
- `entities` - Extract company names, threat actors
- `category` - Use for context/differentiation
- `cves` - Include if present for uniqueness

---

### **Publications**

**File Location:** `public/data/publications/{type}/{id}.json`

**Schema:** Use existing `CyberPublication` from `types/cyber.ts`

```typescript
interface CyberPublication {
  // Core Identity
  pub_id: string                          // daily-2025-10-12, weekly-2025-w41
  slug: string                            // daily-digest-oct-12-ransomware-focus
  
  // Type (NEW FIELD)
  type: 'daily' | 'weekly' | 'monthly' | 'special'
  
  // Headlines & Titles
  headline: string
  title: string
  
  // Content
  summary: string                         // Overview of publication
  
  // SEO & Meta
  meta_description: string
  og_title: string
  og_description: string
  og_image: string
  
  // Images
  featured_image_url: string
  featured_image_alt: string
  
  // Keywords
  keywords: string[]
  
  // Article References
  articles: string[]                      // Array of article IDs
  
  // Metadata
  extract_datetime: string                // ISO 8601 timestamp
}
```

**Publication Types:**
- `daily` - Daily security digest (10-20 articles)
- `weekly` - Weekly roundup (50-100 articles)
- `monthly` - Monthly analysis (200+ articles)
- `special` - Special reports (theme-based, not time-bound)

---

### **Index Files**

#### **Articles Index**
**File:** `public/data/articles-index.json`

```typescript
interface ArticlesIndex {
  articles: ArticleMetadata[]
  totalCount: number
  lastUpdated: string                     // ISO 8601
}

interface ArticleMetadata {
  id: string
  slug: string
  title: string
  headline: string
  publishedAt: string                     // ISO 8601
  updatedAt?: string                      // ISO 8601 (if article updated)
  severity?: string
  excerpt: string
  tags: string[]
  categories: ArticleCategory[]
  readingTime: number
  imageUrl?: string
  author?: {
    name: string
    role?: string
  }
}
```

#### **Publications Index**
**File:** `public/data/publications-index.json`

```typescript
interface PublicationsIndex {
  publications: PublicationMetadata[]
  totalCount: number
  lastUpdated: string                     // ISO 8601
}

interface PublicationMetadata {
  id: string
  slug: string
  type: 'daily' | 'weekly' | 'monthly' | 'special'  // NEW FIELD
  folder: string                          // e.g., "daily", "weekly"
  title: string
  headline: string
  publishedAt: string
  articleCount: number
  excerpt: string
  tags: string[]
  categories: string[]
  readingTime: number
  author: {
    name: string
    role?: string
  }
}
```

#### **Topics Index (NEW)**
**File:** `public/data/topics-index.json`

**Purpose:** Duplicate detection and article update tracking

```typescript
interface TopicsIndex {
  topics: {
    [slug: string]: TopicEntry
  }
  lastUpdated: string
}

interface TopicEntry {
  id: string                              // article-2025-10-12-001
  slug: string                            // ransomware-memorial-hospital
  headline: string                        // For reference
  summary: string                         // 100-200 char summary
  fingerprint: string                     // Hash of key entities
  keywords: string[]                      // For semantic matching
  entities: string[]                      // Companies, threat actors, CVEs
  created: string                         // ISO 8601
  updated?: string                        // ISO 8601 (if updated)
  updateCount: number                     // Number of times updated
  sources: string[]                       // Original source URLs
}
```

**Fingerprint Generation:**
```javascript
// Create unique fingerprint for duplicate detection
function generateFingerprint(article) {
  const core = [
    article.mainEntity,          // e.g., "Memorial Hospital"
    article.threatType,          // e.g., "ransomware"
    article.malwareFamily,       // e.g., "LockBit"
    article.cveIds.join(','),    // e.g., "CVE-2025-1234"
    article.threatActor          // e.g., "APT29"
  ]
    .filter(Boolean)
    .map(s => s.toLowerCase().trim())
    .sort()
    .join('|')
  
  return hashString(core)  // SHA-256 hash
}
```

---

## 🔤 Slug Strategy

### **Core Principles**

1. **Keyword-Rich** - Include threat actor, company, malware, CVE
2. **Specific not Generic** - "lockbit-memorial-hospital" not "ransomware-attack"
3. **Unique Identifiers** - Include distinguishing entities
4. **SEO Optimized** - 40-60 characters ideal
5. **Human Readable** - Easy to understand at a glance

### **Length Guidelines**

```javascript
const SLUG_CONFIG = {
  articles: {
    minLength: 20,        // Too short loses context
    targetLength: 45,     // Sweet spot (75% of max)
    maxLength: 60,        // Hard limit
  },
  
  publications: {
    daily: {
      targetLength: 35,
      maxLength: 45,
    },
    weekly: {
      targetLength: 40,
      maxLength: 50,
    },
    monthly: {
      targetLength: 40,
      maxLength: 50,
    },
    special: {
      targetLength: 50,
      maxLength: 60,
    }
  }
}
```

**Full URL Calculations:**
```
Base URL: https://cybernetsec.io/articles/  (32 chars)
Slug:     ransomware-lockbit-memorial-hospital  (38 chars)
Total:    70 characters ✅ (under 75 char target)

Google SERP Display: ~60 chars shown
Social Share Display: ~50 chars shown
```

### **Slug Generation Algorithm**

```javascript
/**
 * Generate SEO-optimized slug from article data
 * Priority: specific entities > threat type > generic terms
 */
function generateArticleSlug(article) {
  const parts = []
  
  // 1. Threat Actor (highest priority if present)
  if (article.threatActor) {
    parts.push(article.threatActor.toLowerCase())
  }
  
  // 2. Malware/Threat Type
  if (article.malwareFamily) {
    parts.push(article.malwareFamily.toLowerCase())
  } else if (article.threatType) {
    parts.push(article.threatType.toLowerCase())
  }
  
  // 3. Target Entity (company, product, industry)
  if (article.targetCompany) {
    parts.push(article.targetCompany.toLowerCase())
  } else if (article.targetProduct) {
    parts.push(article.targetProduct.toLowerCase())
  } else if (article.primaryIndustry) {
    parts.push(article.primaryIndustry.toLowerCase())
  }
  
  // 4. CVE (if prominent)
  if (article.cves && article.cves.length === 1) {
    parts.push(article.cves[0].toLowerCase())
  }
  
  // 5. Geographic identifier (if specific enough)
  if (article.specificLocation) {
    parts.push(article.specificLocation.toLowerCase())
  }
  
  // Build slug
  let slug = parts
    .map(cleanSlugPart)
    .join('-')
  
  // Ensure within limits
  if (slug.length > 60) {
    slug = slug.substring(0, 60)
    slug = slug.substring(0, slug.lastIndexOf('-'))
  }
  
  // Handle collisions
  slug = ensureUniqueSlug(slug)
  
  return slug
}

function cleanSlugPart(part) {
  return part
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

### **Slug Examples - Good vs Bad**

#### **✅ GOOD Examples:**
```
Specific + Entity-Rich:
- "apt29-targets-us-energy-sector"               (33 chars)
- "lockbit-ransomware-memorial-hospital"         (38 chars)
- "cve-2025-1234-chrome-zero-day"                (31 chars)
- "lazarus-group-cryptocurrency-exchange-hack"   (45 chars)
- "microsoft-exchange-vulnerability-disclosed"   (43 chars)

Why Good:
✅ Include specific threat actor/malware
✅ Include target company/product
✅ Clear what article is about
✅ Unique identifiers
✅ Within 60 char limit
```

#### **❌ BAD Examples:**
```
Too Generic:
- "ransomware-attack"                            (18 chars - too vague)
- "data-breach-company"                          (20 chars - no specifics)
- "security-vulnerability-found"                 (30 chars - generic)

Too Long:
- "critical-ransomware-attack-targets-major-healthcare-system-affecting-patient-data-records"
  (92 chars - way too long)

Date-Based (OLD APPROACH):
- "2025-10-12-ransomware-attack"                 (29 chars - looks dated)
- "october-12-lockbit-attack"                    (26 chars - date irrelevant)
```

### **Slug Collision Handling**

```javascript
/**
 * Ensure slug is unique across all articles
 * If collision exists, append incrementing number
 */
async function ensureUniqueSlug(baseSlug) {
  const existingSlugs = await loadAllSlugs()
  
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug
  }
  
  // Try appending distinguishing info first
  // (better than just numbers)
  const variants = [
    `${baseSlug}-update`,
    `${baseSlug}-analysis`,
    `${baseSlug}-2`,
    `${baseSlug}-3`,
    // ... etc
  ]
  
  for (const variant of variants) {
    if (!existingSlugs.has(variant)) {
      return variant
    }
  }
  
  // Fallback: increment until unique
  let counter = 2
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++
  }
  
  return `${baseSlug}-${counter}`
}
```

---

## 📁 Folder Structure

### **Complete Directory Tree**

```
cybernetsec-io/
├── scripts/
│   └── content-generation/
│       ├── config/
│       │   ├── prompts.mjs              # AI prompts for each generation step
│       │   ├── sources.mjs              # News source configurations
│       │   ├── defaults.mjs             # Default settings & constants
│       │   └── vertex-config.mjs        # Vertex AI configuration
│       ├── lib/
│       │   ├── file-utils.mjs           # File I/O operations
│       │   ├── api-client.mjs           # API clients (Vertex, Gemini)
│       │   ├── validators.mjs           # JSON schema validation
│       │   ├── logger.mjs               # Logging with levels
│       │   ├── slug-generator.mjs       # Slug generation logic
│       │   └── fingerprint.mjs          # Duplicate detection
│       ├── generators/
│       │   ├── articles.mjs             # Article generation
│       │   ├── publications.mjs         # Publication generation
│       │   ├── images.mjs               # Image generation
│       │   └── indexes.mjs              # Index file generation
│       ├── cli/
│       │   ├── search-news.mjs          # Step 1: Search daily news
│       │   ├── check-duplicates.mjs     # Step 2: Duplicate detection
│       │   ├── generate-articles.mjs    # Step 3: Generate articles
│       │   ├── generate-publications.mjs # Step 4: Generate publications
│       │   ├── generate-images.mjs      # Step 5: Generate images
│       │   ├── generate-indexes.mjs     # Step 6: Generate indexes
│       │   ├── generate-all.mjs         # Main orchestrator
│       │   └── validate-content.mjs     # Validation tool
│       └── README.md
│
├── public/data/
│   ├── articles/
│   │   ├── article-2025-10-12-001.json
│   │   ├── article-2025-10-12-002.json
│   │   └── ...
│   ├── publications/
│   │   ├── daily/
│   │   │   ├── daily-2025-10-12.json
│   │   │   └── ...
│   │   ├── weekly/
│   │   │   ├── weekly-2025-w41.json
│   │   │   └── ...
│   │   ├── monthly/
│   │   │   ├── monthly-2025-10.json
│   │   │   └── ...
│   │   └── special/
│   │       ├── q3-threat-landscape.json
│   │       └── ...
│   ├── articles-index.json
│   ├── publications-index.json
│   └── topics-index.json                # NEW
│
└── .github/workflows/
    ├── daily-publish.yml                # Scheduled daily run
    ├── manual-publish.yml               # Manual trigger
    └── test-generation.yml              # Test only
```

---

## 🔄 Pipeline Flow

> **⚠️ NOTE:** This pipeline design is being replaced. See `ARCHITECTURE-DECISIONS.md` for the new unified approach that:
> - Generates publication + articles in ONE AI call (cheaper, better context)
> - Uses entity-relationship database for 10-100x faster similarity matching
> - Reduces cost from ~$5 to ~$0.50 per run

### **Complete 6-Step Pipeline** (OLD APPROACH - TO BE REPLACED)

```
┌─────────────────────────────────────────────────────────────┐
│                   DAILY CONTENT GENERATION                   │
│                      (GitHub Actions)                        │
└─────────────────────────────────────────────────────────────┘

Step 1: Search Daily News (5-10 minutes)
├─ Tool: Vertex AI with Grounded Search
├─ Input: Date, topics, sources
├─ Process:
│   ├─ Query cybersecurity news from past 24 hours
│   ├─ Filter by relevance and credibility
│   └─ Extract: headline, summary, entities, sources
├─ Output: newsItems[] (in-memory array)
└─ Pass to Step 2 ✓

Step 2: Check for Duplicates (2-5 minutes)
├─ Input: newsItems[] from Step 1
├─ Load: public/data/topics-index.json
├─ Process:
│   ├─ For each news item:
│   │   ├─ Generate fingerprint (entities + threat type)
│   │   ├─ Calculate similarity to existing topics
│   │   └─ Classify as: NEW | UPDATE | SKIP
│   └─ Filter results
├─ Output:
│   ├─ newTopics[]      → Step 3A (create new articles)
│   ├─ updateTopics[]   → Step 3B (update existing)
│   └─ skippedTopics[]  → Log only
└─ Pass to Step 3 ✓

Step 3A: Generate New Articles (10-20 minutes)
├─ Tool: Gemini with structured output
├─ Input: newTopics[] from Step 2
├─ Process:
│   ├─ For each new topic:
│   │   ├─ Generate complete CyberArticle JSON
│   │   ├─ Generate SEO-optimized slug (NO DATE)
│   │   ├─ Generate article ID: article-YYYY-MM-DD-NNN
│   │   ├─ Ensure slug uniqueness
│   │   ├─ Save: public/data/articles/{id}.json
│   │   └─ Update topics-index.json
├─ Output: generatedArticles[] (metadata array)
└─ Pass to Step 4 ✓

Step 3B: Update Existing Articles (5-10 minutes)
├─ Input: updateTopics[] from Step 2
├─ Process:
│   ├─ For each update:
│   │   ├─ Load existing article by ID
│   │   ├─ Merge new information with AI
│   │   ├─ Update "updatedAt" timestamp
│   │   ├─ Increment "updateCount"
│   │   ├─ Add to "sources" array
│   │   ├─ Save: public/data/articles/{id}.json
│   │   └─ Update topics-index.json
├─ Output: updatedArticles[] (metadata array)
└─ Merge with Step 3A output → Step 4 ✓

Step 4: Generate Publications (5-10 minutes)
├─ Input: All articles from Step 3A + 3B + existing articles
├─ Process:
│   ├─ Group articles by date
│   ├─ Generate daily publication:
│   │   ├─ pub_id: daily-YYYY-MM-DD
│   │   ├─ slug: daily-digest-{descriptive-keywords}
│   │   ├─ type: "daily"
│   │   ├─ Include: Today's articles (new + updated)
│   │   └─ Save: public/data/publications/daily/{pub_id}.json
│   └─ (Weekly/Monthly out of scope for now)
├─ Output: generatedPublications[] (metadata array)
└─ Pass to Step 5 ✓

Step 5: Generate Images (10-30 minutes, parallel)
├─ Input: Articles + Publications needing images
├─ Process (parallel execution):
│   ├─ For each article without featured_image_url:
│   │   ├─ Generate prompt from headline + summary
│   │   ├─ Call image generation API
│   │   ├─ Save: public/images/articles/{id}.webp
│   │   ├─ Update article JSON with image URL
│   │   └─ Update featured_image_alt
│   └─ For each publication without featured_image_url:
│       ├─ Generate composite/collage prompt
│       ├─ Call image generation API
│       ├─ Save: public/images/publications/{type}/{id}.webp
│       └─ Update publication JSON
├─ Output: Image files + updated JSON files
└─ Pass to Step 6 ✓

Step 6: Generate Indexes (1-2 minutes)
├─ Input: Final article & publication files
├─ Process:
│   ├─ Scan all articles in public/data/articles/
│   ├─ Generate articles-index.json:
│   │   ├─ Extract metadata from each article
│   │   ├─ Sort by publishedAt (newest first)
│   │   └─ Include updatedAt if present
│   ├─ Scan all publications in all type folders
│   └─ Generate publications-index.json:
│       ├─ Extract metadata from each publication
│       ├─ Include type and folder location
│       └─ Sort by publishedAt (newest first)
├─ Output:
│   ├─ public/data/articles-index.json
│   └─ public/data/publications-index.json
└─ Complete! ✓

┌─────────────────────────────────────────────────────────────┐
│               BUILD & DEPLOY (existing process)              │
├─────────────────────────────────────────────────────────────┤
│ 7. npm run generate  (Nuxt static build)                    │
│ 8. Deploy to GitHub Pages                                   │
│ 9. Commit generated content back to repo (optional)         │
└─────────────────────────────────────────────────────────────┘

Total Runtime: ~35-60 minutes
```

### **Data Flow Optimization**

```javascript
// Pass data through pipeline instead of re-reading files
async function runPipeline() {
  // Step 1: Search
  const newsItems = await searchDailyNews()
  
  // Step 2: Dedupe (uses newsItems from Step 1)
  const { newTopics, updateTopics } = await checkDuplicates(newsItems)
  
  // Step 3: Generate (uses filtered topics from Step 2)
  const articles = await Promise.all([
    generateNewArticles(newTopics),
    updateExistingArticles(updateTopics)
  ])
  
  const allArticles = [...articles[0], ...articles[1]]
  
  // Step 4: Publications (uses article metadata from Step 3)
  const publications = await generatePublications(allArticles)
  
  // Step 5: Images (uses metadata from Step 3 & 4)
  await generateImages([...allArticles, ...publications])
  
  // Step 6: Indexes (reads final files once)
  await generateIndexes()
  
  return {
    articlesGenerated: allArticles.length,
    publicationsGenerated: publications.length,
    duration: Date.now() - startTime
  }
}
```

---

## 🔌 API Requirements

### **Vertex AI (Step 1 Only)**

**Purpose:** Grounded search for cybersecurity news

**Why Vertex (not regular Gemini):**
- Grounded search required for current news
- Regular Gemini API doesn't support grounding
- Need real-time web search capabilities

**Configuration:**
```javascript
// scripts/content-generation/config/vertex-config.mjs
export const VERTEX_CONFIG = {
  projectId: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION || 'us-central1',
  model: 'gemini-2.0-flash-exp',  // or gemini-1.5-pro
  
  searchConfig: {
    dynamicRetrievalConfig: {
      mode: 'MODE_DYNAMIC',
      dynamicThreshold: 0.7
    }
  },
  
  // Service account for authentication
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
}
```

**Environment Variables:**
```bash
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

### **Gemini API (Steps 2-6)**

**Purpose:** Structured output generation for articles, publications

**Why Gemini (not Vertex):**
- Structured output support ✓
- Simpler authentication ✓
- Lower latency ✓
- Cheaper for bulk operations ✓

**Configuration:**
```javascript
// scripts/content-generation/lib/api-client.mjs
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const GEMINI_CONFIG = {
  model: 'gemini-2.0-flash-exp',  // Fast + structured output
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',  // Structured output
  }
}
```

**Environment Variables:**
```bash
GEMINI_API_KEY=your-api-key
```

---

### **Image Generation (Step 5)**

**Options:**
1. **Stability AI** - High quality, expensive
2. **DALL-E 3** - Good quality, moderate cost
3. **Gemini Imagen 3** - Fast, cheaper
4. **Placeholder** - Use generated category images temporarily

**Recommended Approach:**
```javascript
// Start with placeholders, add real generation later
const imageUrl = article.featured_image_url || 
                 `/images/categories/${categorySlug}.png`
```

---

## 🤖 AI Prompt Guidelines

### **Key Principles for All Prompts**

1. **Slug Generation Instructions:**
```
CRITICAL: Generate SEO-optimized slug following these rules:
- NO dates in slug (dates go in id field only)
- Length: 40-60 characters (target 45)
- Include specific entities: threat actor, company, malware, CVE
- Format: threat-actor-malware-target-entity
- Example: "apt29-solarwinds-supply-chain-attack"
- Example: "lockbit-ransomware-memorial-hospital"
- Example: "cve-2025-1234-chrome-zero-day"
- BAD: "ransomware-attack" (too generic)
- BAD: "2025-10-12-data-breach" (has date)
```

2. **Entity Extraction:**
```
Extract and prioritize these entities for slug:
1. Threat Actor (APT29, Lazarus Group, etc.)
2. Malware Family (LockBit, Emotet, Cobalt Strike, etc.)
3. Target Company/Organization (specific name)
4. CVE ID (if single prominent vulnerability)
5. Target Product/Technology (Chrome, Exchange, etc.)
6. Industry (only if no specific company)

Use most specific identifiers available.
```

3. **Avoid Generic Terms:**
```
Replace generic terms with specific ones:
❌ "company" → ✅ "memorial-hospital"
❌ "ransomware" → ✅ "lockbit-ransomware"
❌ "vulnerability" → ✅ "cve-2025-1234"
❌ "attack" → ✅ "supply-chain-compromise"
```

### **Step 1: News Search Prompt (Vertex AI)**

```javascript
const SEARCH_NEWS_PROMPT = `
You are a cybersecurity news analyst. Search for cybersecurity news from the past 24 hours.

Date: ${date}
Focus Areas:
- Ransomware attacks
- Data breaches
- Zero-day vulnerabilities
- APT activities
- CVE disclosures
- Security advisories from major vendors

For each relevant news item, extract:
{
  "headline": "Short, punchy headline (40-80 chars)",
  "summary": "2-3 sentence summary of the incident",
  "entities": {
    "companies": ["Specific company names"],
    "threatActors": ["APT groups or threat actor names"],
    "malware": ["Malware family names"],
    "cves": ["CVE IDs if mentioned"],
    "products": ["Affected products/technologies"]
  },
  "threatType": "ransomware | data-breach | vulnerability | apt-campaign | etc",
  "severity": "critical | high | medium | low",
  "sources": ["Original source URLs"],
  "geographic_scope": "local | regional | national | global"
}

Return array of news items, sorted by severity (critical first).
Minimum 10 items, maximum 50 items.
Only include credible sources (no rumors or unverified claims).
`
```

### **Step 3A: Article Generation Prompt (Gemini)**

```javascript
const GENERATE_ARTICLE_PROMPT = `
You are an expert cybersecurity analyst writing detailed threat intelligence reports.

Input: ${JSON.stringify(newsTopic)}

Generate a complete CyberArticle JSON following the exact schema:

CRITICAL SLUG GENERATION RULES:
1. NO dates in slug - dates go in id and extract_datetime only
2. Length: 40-60 characters (target 45 chars)
3. Include SPECIFIC entities in this priority:
   - Threat actor name (if known)
   - Malware family name (if applicable)
   - Specific target company/organization name
   - CVE ID (if single prominent vulnerability)
   - Product name (if vulnerability-focused)
4. Use hyphens to separate words
5. All lowercase
6. Example formats:
   - "{threat-actor}-{malware}-{target-company}"
   - "{malware}-{target-company}-{industry}"
   - "cve-{id}-{product}-{vulnerability-type}"

GOOD SLUG EXAMPLES:
✅ "apt29-solarwinds-supply-chain-attack"
✅ "lockbit-ransomware-memorial-hospital"
✅ "cve-2025-1234-chrome-zero-day"
✅ "lazarus-group-cryptocurrency-exchange"

BAD SLUG EXAMPLES:
❌ "ransomware-attack" (too generic, no specifics)
❌ "2025-10-12-data-breach" (contains date)
❌ "cybersecurity-incident" (too vague)

Generate:
{
  "id": "article-${date}-${counter}",  // e.g., "article-2025-10-12-001"
  "slug": "GENERATED_SLUG_HERE",       // Follow rules above!
  "headline": "Short punchy headline (40-80 chars)",
  "title": "Full descriptive title",
  "summary": "Detailed 2-3 paragraph summary",
  "full_report": "Complete analysis in markdown format",
  
  "category": ["Primary", "Secondary"],  // 1-3 categories
  "tags": ["tag1", "tag2", ...],        // 10-15 relevant tags
  "keywords": ["keyword1", ...],         // SEO keywords
  
  "events": [
    {
      "datetime": "ISO 8601",
      "summary": "Event description"
    }
  ],
  
  "cves": ["CVE-2025-XXXX"],
  
  "entities": [
    {
      "name": "Entity name",
      "type": "threat_actor | vendor | malware | product",
      "stix_type": "threat-actor | identity | malware | tool"
    }
  ],
  
  "affected_industries": ["Healthcare", "Finance"],
  "geographic_scope": "global | national | regional | local",
  
  "sources": [
    {
      "source_id": "hash",
      "url": "source URL",
      "title": "Source title",
      "root_url": "Domain",
      "source_date": "MM/DD/YYYY"
    }
  ],
  
  "article_type": "Report | NewsArticle | Advisory",
  "reading_time_minutes": 5,
  "extract_datetime": "${new Date().toISOString()}",
  
  "meta_description": "SEO meta (120-160 chars)",
  "og_title": "OG title (55 chars)",
  "og_description": "OG description (155 chars)",
  "twitter_post": "Tweet-ready post (233 chars, include hashtags)",
  "linkedin_post": "LinkedIn post (200 chars, professional tone)",
  
  "featured_image_url": "",  // Leave empty for now
  "featured_image_alt": "Alt text describing the threat/incident",
  
  "related_article_ids": []
}

Ensure all fields are present and properly formatted.
Use proper JSON escaping for strings.
`
```

### **Step 3B: Article Update Prompt (Gemini)**

```javascript
const UPDATE_ARTICLE_PROMPT = `
You are updating an existing cybersecurity article with new information.

Existing Article: ${JSON.stringify(existingArticle)}
New Information: ${JSON.stringify(newInfo)}

Merge the new information intelligently:
1. Keep original headline and slug (DO NOT CHANGE)
2. Update summary to include new developments
3. Append to full_report with "UPDATE [date]:" section
4. Add new events to events array
5. Add new CVEs to cves array
6. Add new entities to entities array
7. Add new sources to sources array
8. Update "updatedAt" to current timestamp
9. Keep "publishedAt" unchanged

Return complete updated CyberArticle JSON.
Mark significant updates in the summary with "UPDATE:" prefix.
`
```

### **Step 4: Publication Generation Prompt (Gemini)**

```javascript
const GENERATE_PUBLICATION_PROMPT = `
You are creating a daily cybersecurity digest publication.

Articles to include: ${JSON.stringify(articles)}

Generate a CyberPublication JSON:

SLUG GENERATION RULES (daily publications):
1. Format: "daily-digest-{date}-{primary-theme}"
2. Length: 35-45 characters
3. Include primary threat theme of the day
4. Examples:
   - "daily-digest-oct-12-ransomware-surge"
   - "daily-digest-oct-12-zero-day-focus"
   - "daily-digest-oct-12-apt-activity"

{
  "pub_id": "daily-${date}",
  "slug": "GENERATED_SLUG_HERE",
  "type": "daily",
  
  "headline": "Daily Security Digest - [Primary Theme]",
  "title": "Comprehensive daily overview title",
  "summary": "Executive summary of the day's threats (3-5 paragraphs)",
  
  "keywords": ["keyword1", "keyword2", ...],
  "articles": [${articles.map(a => `"${a.id}"`).join(', ')}],
  
  "meta_description": "SEO meta description",
  "og_title": "OG title",
  "og_description": "OG description",
  
  "featured_image_url": "",
  "featured_image_alt": "Daily digest cover image",
  
  "extract_datetime": "${new Date().toISOString()}"
}
`
```

---

## ✅ Implementation Checklist

### **Phase 1: Foundation (Week 1)**

- [ ] Set up directory structure
  - [ ] Create `scripts/content-generation/` folders
  - [ ] Create `public/data/publications/` type folders
  
- [ ] Configuration files
  - [ ] `config/defaults.mjs` - Constants and settings
  - [ ] `config/prompts.mjs` - All AI prompts
  - [ ] `config/vertex-config.mjs` - Vertex AI setup
  - [ ] `config/sources.mjs` - News sources
  
- [ ] Utility modules
  - [ ] `lib/logger.mjs` - Logging utility
  - [ ] `lib/file-utils.mjs` - File operations
  - [ ] `lib/validators.mjs` - JSON validation
  - [ ] `lib/slug-generator.mjs` - Slug generation logic
  - [ ] `lib/fingerprint.mjs` - Duplicate detection
  - [ ] `lib/api-client.mjs` - Vertex + Gemini clients

### **Phase 2: Core Generators (Week 2)**

- [ ] Step 1: News Search
  - [ ] `cli/search-news.mjs` - CLI interface
  - [ ] Vertex AI integration
  - [ ] News source scraping
  - [ ] Entity extraction
  
- [ ] Step 2: Duplicate Detection
  - [ ] `cli/check-duplicates.mjs` - CLI interface
  - [ ] Fingerprint generation
  - [ ] Similarity matching
  - [ ] Topics index management
  
- [ ] Step 3: Article Generation
  - [ ] `generators/articles.mjs` - Core logic
  - [ ] `cli/generate-articles.mjs` - CLI interface
  - [ ] Gemini structured output
  - [ ] Article update logic
  - [ ] Slug collision handling
  
- [ ] Step 4: Publication Generation
  - [ ] `generators/publications.mjs` - Core logic
  - [ ] `cli/generate-publications.mjs` - CLI interface
  - [ ] Daily digest creation
  - [ ] Folder management

### **Phase 3: Images & Indexes (Week 3)**

- [ ] Step 5: Image Generation
  - [ ] `generators/images.mjs` - Core logic
  - [ ] `cli/generate-images.mjs` - CLI interface
  - [ ] Placeholder fallback
  - [ ] Image API integration (later)
  
- [ ] Step 6: Index Generation
  - [ ] `generators/indexes.mjs` - Core logic
  - [ ] `cli/generate-indexes.mjs` - CLI interface
  - [ ] Update existing index generators
  - [ ] Topics index generation

### **Phase 4: Orchestration (Week 4)**

- [ ] Main pipeline
  - [ ] `cli/generate-all.mjs` - Orchestrator
  - [ ] Data flow optimization
  - [ ] Error handling
  - [ ] Progress reporting
  
- [ ] Testing & validation
  - [ ] `cli/validate-content.mjs` - Validator
  - [ ] Test with sample data
  - [ ] Dry run mode
  
- [ ] Documentation
  - [ ] Update README files
  - [ ] Add code comments
  - [ ] Usage examples

### **Phase 5: GitHub Actions Integration (Week 5)**

- [ ] Workflow files
  - [ ] `.github/workflows/daily-publish.yml`
  - [ ] `.github/workflows/manual-publish.yml`
  - [ ] `.github/workflows/test-generation.yml`
  
- [ ] Secrets management
  - [ ] Add API keys to GitHub Secrets
  - [ ] Test secret access
  
- [ ] Testing
  - [ ] Manual workflow trigger
  - [ ] Monitor execution
  - [ ] Debug issues
  
- [ ] Deployment
  - [ ] Enable scheduled runs
  - [ ] Monitor first automated run
  - [ ] Set up notifications

### **Phase 6: UI Updates (Week 6)**

- [ ] Update types
  - [ ] Add `type` field to PublicationMetadata
  - [ ] Add `folder` field
  - [ ] Update TypeScript interfaces
  
- [ ] Update API routes
  - [ ] `server/api/data/publications/[id].ts` - Handle folders
  - [ ] Test with new structure
  
- [ ] Update pages
  - [ ] Add publication type filtering
  - [ ] Add tab navigation
  - [ ] Update breadcrumbs
  
- [ ] Testing
  - [ ] Test all publication types
  - [ ] Test filtering
  - [ ] Test SEO/meta tags

---

## 📚 Reference Documents

### **Related Documentation**
- [GITHUB-ACTIONS.md](./GITHUB-ACTIONS.md) - CI/CD setup and workflow details
- [scripts/content-generation/README.md](./scripts/content-generation/README.md) - Developer guide
- [types/cyber.ts](./types/cyber.ts) - TypeScript interfaces

### **External Resources**
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google Generative AI Node.js SDK](https://www.npmjs.com/package/@google/generative-ai)
- [GenKit Documentation](https://firebase.google.com/docs/genkit)

---

## 🎯 Success Criteria

### **MVP Completion Metrics**

**Functionality:**
- ✅ Generate 10-20 articles daily automatically
- ✅ Create daily digest publication
- ✅ Detect and skip duplicate stories
- ✅ Update existing articles with new info
- ✅ Generate SEO-optimized slugs (no dates)
- ✅ Organize publications by type (daily folder)
- ✅ Build and deploy site automatically

**Quality:**
- ✅ All slugs under 60 characters
- ✅ Slugs include specific entities (not generic)
- ✅ All JSON valid per TypeScript schemas
- ✅ Images present (even if placeholders)
- ✅ Indexes updated correctly
- ✅ No broken links

**Performance:**
- ✅ Pipeline completes in under 60 minutes
- ✅ No API rate limit errors
- ✅ Graceful error handling
- ✅ Progress logging throughout

---

## 📝 Notes & Considerations

### **Future Enhancements (Out of Scope for MVP)**

1. **Weekly/Monthly Publications**
   - Aggregate articles over longer periods
   - More analysis and trends
   - Special formatting

2. **Special Reports**
   - Theme-based compilations
   - Quarterly threat landscapes
   - Annual reviews

3. **Real Image Generation**
   - Integrate Stability AI or DALL-E
   - Custom cybersecurity-themed images
   - Automated image generation

4. **Advanced Duplicate Detection**
   - Semantic embeddings (vector search)
   - ML-based similarity
   - Entity graph matching

5. **Article Relationships**
   - Automatically link related articles
   - Thread tracking (ongoing stories)
   - Campaign tracking

6. **Multi-language Support**
   - Translate articles
   - Region-specific content
   - International sources

### **Known Limitations**

1. **Vertex AI Cost** - Grounded search can be expensive at scale
2. **Rate Limits** - May need throttling for high-volume days
3. **Image Quality** - Starting with category placeholders
4. **Manual Review** - No human review before publish (automated trust)

### **Risk Mitigation**

1. **Bad Data** - Validate all AI outputs with JSON schemas
2. **API Failures** - Retry logic with exponential backoff
3. **Slug Collisions** - Automatic incrementing with fallback
4. **Duplicate Detection Miss** - Manual cleanup process
5. **Cost Overruns** - Set API budget alerts in GCP

---

## 🚀 Ready for Implementation

This document serves as the complete design specification for the automated content generation and publication system. All architectural decisions have been made, data structures defined, and implementation path outlined.

**Next Steps:**
1. Review this document for any gaps or questions
2. Create new chat session for implementation
3. Reference this document throughout development
4. Update document as changes occur

---

**Document Version:** 1.0  
**Created:** October 12, 2025  
**Authors:** Design Session Discussion  
**Status:** ✅ Complete - Ready for Development
