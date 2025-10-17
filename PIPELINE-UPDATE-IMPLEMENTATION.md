# Pipeline UPDATE Implementation Plan

**Date:** October 13, 2025  
**Status:** Schema updates complete, implementation in progress  

---

## 🎯 Overview

The current pipeline has critical issues with UPDATE handling. This document outlines the complete redesign of the UPDATE process.

## 🚨 Problems Identified

1. **SEO Breaking Bug:** UPDATE creates new article with different ID/slug instead of updating existing file
2. **Wrong Decision Maker:** Entity fingerprinting makes final UPDATE/SKIP decision (should only filter candidates)
3. **No Update Tracking:** Articles don't track what changed in updates
4. **Missing LLM Step:** No AI comparison to intelligently determine if content is truly an update
5. **Missing Timestamps:** Articles don't track created_at/updated_at for sorting

---

## ✅ Schema Updates (COMPLETE)

### types/cyber.ts

```typescript
export interface ArticleUpdate {
  timestamp: string                  // ISO 8601 timestamp
  summary: string                    // What changed in this update
  new_entities?: string[]            // New entities mentioned
  new_cves?: string[]                // New CVEs added
  sources?: ArticleSource[]          // Sources for this update
}

export interface CyberArticle {
  // ... existing fields ...
  
  // NEW FIELDS:
  created_at: string                 // When first created
  updated_at: string                 // When last updated
  updates?: ArticleUpdate[]          // Update history
}
```

### scripts/content-generation/lib/db-client.ts

```typescript
export interface ArticleRecord {
  article_id: string
  slug: string
  // ... other fields ...
  created_at?: string
  updated_at?: string
}
```

---

## 🔄 New Pipeline Flow

### Current (Broken):
```
Step 1: search-news.ts → Raw search results
Step 2: generate-publication-unified.ts → Structured JSON with articles
Step 3: filter-articles-entity.ts → FINAL decision: NEW/UPDATE/SKIP ❌
Step 4: save-articles-with-entities.ts → Save (creates new article) ❌
Step 5: generate-indexes.ts → Create indexes
```

### New (Fixed):
```
Step 1: search-news.ts → Raw search results
Step 2: generate-publication-unified.ts → Structured JSON with articles
Step 3: filter-articles-entity.ts → FILTER candidates by entities (60%+ = POTENTIAL UPDATE)
Step 3.5: compare-articles-llm.ts → LLM decides UPDATE/SKIP + extracts update summary ✅
Step 4: save-articles-with-entities.ts → Intelligent merge (preserve ID/slug) ✅
Step 5: generate-indexes.ts → Sort by updated_at ✅
```

---

## 📋 Implementation Tasks

### Task 1: Refactor Entity Fingerprinting (Step 3)

**File:** `scripts/content-generation/cli/filter-articles-entity.ts`

**Current Behavior:**
- Calculates similarity (60-85% = UPDATE, 85%+ = SKIP, <60% = NEW)
- Makes FINAL decision

**New Behavior:**
- Calculates similarity
- If 60%+ similarity → Flag as **POTENTIAL_UPDATE** (send to LLM)
- If <60% similarity → **NEW** (no LLM needed)
- Output includes candidate info for LLM step

**Output Format:**
```json
{
  "article_id": "new-article-123",
  "action": "POTENTIAL_UPDATE",
  "candidate_article_id": "existing-article-456",
  "similarity": 65.3,
  "candidate_summary": "...",
  "needs_llm_comparison": true
}
```

---

### Task 2: Create LLM Comparison Step (Step 3.5)

**New File:** `scripts/content-generation/cli/compare-articles-llm.ts`

**Purpose:** 
- Takes POTENTIAL_UPDATE articles from Step 3
- Loads both NEW and EXISTING article full content
- Uses Gemini Flash 2.5 (Vertex AI) to intelligently compare
- Decides: UPDATE (with extracted summary) or SKIP
- If UPDATE, extracts what's new/changed

**LLM Prompt:**
```
You are comparing two cybersecurity articles about the same story to determine if the new article contains updates.

EXISTING ARTICLE (published [date]):
Title: [title]
Summary: [summary]
CVEs: [cves]
Entities: [entities]
Sources: [sources]

NEW ARTICLE (published [date]):
Title: [title]
Summary: [summary]
CVEs: [cves]
Entities: [entities]
Sources: [sources]

TASK:
1. Determine if the NEW article contains meaningful updates/new information
2. If YES (UPDATE):
   - Extract a concise update summary (2-3 sentences)
   - List new entities mentioned
   - List new CVEs mentioned
   - Decision: UPDATE
3. If NO (too similar/duplicate):
   - Decision: SKIP

OUTPUT (JSON):
{
  "decision": "UPDATE" | "SKIP",
  "confidence": 0-100,
  "update_summary": "...",  // if UPDATE
  "new_entities": [],       // if UPDATE
  "new_cves": []            // if UPDATE
}
```

**Output Format:**
```json
{
  "article_id": "new-article-123",
  "action": "UPDATE",
  "matched_article_id": "existing-article-456",
  "update": {
    "summary": "Oracle released emergency patch for CVE-2025-61882. CISA added to KEV catalog.",
    "new_entities": ["CISA"],
    "new_cves": [],
    "timestamp": "2025-10-09T10:00:00Z"
  }
}
```

**Usage:**
```bash
npx tsx scripts/content-generation/cli/compare-articles-llm.ts \
  --input=OUTPUT/publication-unified_4daysago_*_filtered.json
```

---

### Task 3: Fix Save Logic (Step 4)

**File:** `scripts/content-generation/cli/save-articles-with-entities.ts`

**Current Issues:**
- Uses `classification.matched_article_id` but then creates NEW article
- Generates new ID and slug
- Breaks SEO

**Required Changes:**

#### 3.1: Use ID for UPDATE Lookups

```typescript
// BEFORE (WRONG):
const existingArticle = getArticleBySlug(db, article.slug)

// AFTER (CORRECT):
const existingArticle = getArticleById(db, classification.matched_article_id)
```

#### 3.2: Preserve ID and Slug

```typescript
async function updateArticleWithEntities(
  db: any, 
  newArticleData: any, 
  existingArticleId: string,
  updateInfo: any,  // From LLM step
  dryRun: boolean
): Promise<SaveStats> {
  
  // 1. Load existing article from database
  const existingArticle = getArticleById(db, existingArticleId)
  if (!existingArticle) {
    throw new Error(`Existing article not found: ${existingArticleId}`)
  }
  
  // 2. Load existing article JSON file
  const existingFilePath = join(articlesDir, `${existingArticle.slug}.json`)
  const existingJSON = await readJSON(existingFilePath)
  
  // 3. PRESERVE original ID and slug (critical for SEO)
  const mergedArticle = {
    ...newArticleData,
    id: existingArticle.article_id,           // KEEP original ID
    slug: existingArticle.slug,               // KEEP original slug
    created_at: existingArticle.created_at,   // KEEP creation date
    updated_at: new Date().toISOString(),     // UPDATE timestamp
  }
  
  // 4. Append to updates array
  if (!existingJSON.updates) {
    existingJSON.updates = []
  }
  existingJSON.updates.push({
    timestamp: updateInfo.timestamp,
    summary: updateInfo.summary,
    new_entities: updateInfo.new_entities,
    new_cves: updateInfo.new_cves,
    sources: newArticleData.sources
  })
  
  // 5. Merge entities (add new, keep existing)
  const mergedEntities = mergeEntities(existingJSON.entities, newArticleData.entities)
  const mergedCVEs = mergeCVEs(existingJSON.cves, newArticleData.cves)
  
  // 6. Update database with SAME article_id
  upsertArticle(db, {
    article_id: existingArticle.article_id,  // SAME ID
    slug: existingArticle.slug,              // SAME slug
    headline: mergedArticle.headline,
    title: mergedArticle.title,
    summary: mergedArticle.summary,
    category: mergedArticle.category,
    severity: mergedArticle.severity
  })
  
  // 7. Update entity relationships
  linkNewEntities(db, existingArticle.article_id, mergedEntities)
  linkNewCVEs(db, existingArticle.article_id, mergedCVEs)
  
  // 8. Overwrite SAME file (preserves SEO)
  const finalArticle = {
    ...existingJSON,
    ...mergedArticle,
    entities: mergedEntities,
    cves: mergedCVEs
  }
  await writeJSON(existingFilePath, finalArticle)
  
  logger.success(`✅ Updated existing article: ${existingArticle.slug}`)
}
```

#### 3.3: Entity/CVE Merging

```typescript
function mergeEntities(existing: ArticleEntity[], newEntities: ArticleEntity[]): ArticleEntity[] {
  const entityMap = new Map<string, ArticleEntity>()
  
  // Add existing entities
  for (const entity of existing) {
    const key = `${entity.name}:${entity.type}`
    entityMap.set(key, entity)
  }
  
  // Add new entities (deduplicate)
  for (const entity of newEntities) {
    const key = `${entity.name}:${entity.type}`
    if (!entityMap.has(key)) {
      entityMap.set(key, entity)
    }
  }
  
  return Array.from(entityMap.values())
}

function mergeCVEs(existing: string[], newCVEs: string[]): string[] {
  const cveSet = new Set([...existing, ...newCVEs])
  return Array.from(cveSet).sort()
}
```

---

### Task 4: Update Index Generation (Step 5)

**File:** `scripts/content-generation/cli/generate-indexes.ts`

**Changes:**

```typescript
// Sort articles by updated_at (most recent first)
articles.sort((a, b) => {
  const aTime = new Date(a.updated_at || a.created_at).getTime()
  const bTime = new Date(b.updated_at || b.created_at).getTime()
  return bTime - aTime  // Descending order
})

// Include timestamps in index
const articleSummaries = articles.map(article => ({
  ...articleSummary(article),
  created_at: article.created_at,
  updated_at: article.updated_at
}))
```

---

## 🧪 Testing Strategy

### Test Case 1: Fresh Database (5daysago)
- **Expected:** All 3 articles → NEW
- **Verify:** created_at === updated_at, no updates array

### Test Case 2: First Update (4daysago)
- **Expected:** 
  - CL0P/Oracle: 61.3% → POTENTIAL_UPDATE → LLM → UPDATE
  - SonicWall: 53.2% → NEW
  - LockBit: 86.7% → POTENTIAL_UPDATE → LLM → SKIP
- **Verify CL0P Article:**
  - Same ID: `a1b2c3d4-e5f6-7890-1234-567890abcdef`
  - Same slug: `clop-exploits-critical-oracle-ebs-zero-day-cve-2025-61882`
  - created_at unchanged
  - updated_at = new timestamp
  - updates array has 1 entry with summary

### Test Case 3: Second Update (3daysago)
- **Expected:** CL0P gets 2nd update
- **Verify:** updates array has 2 entries

---

## 📊 Expected Results

### Database After 4daysago:
```
Articles: 4 total
- a1b2c3d4... (CL0P) - created 2025-10-08, updated 2025-10-09
- b2c3d4e5... (SonicWall #1) - created 2025-10-08
- f7e6d5c4... (SonicWall #2) - created 2025-10-09
- c3d4e5f6... (LockBit) - created 2025-10-08
```

### Files After 4daysago:
```
public/data/articles/
├── clop-exploits-critical-oracle-ebs-zero-day-cve-2025-61882.json (UPDATED)
├── sonicwall-confirms-cloud-backup-breach-exposes-customer-data.json
├── sonicwall-confirms-cloud-backup-breach-exposes-customer-firewall-configurations.json (NEW)
└── lockbit-qilin-dragonforce-form-ransomware-alliance.json
```

---

## 🚀 Implementation Order

1. ✅ **Schema updates** (completed)
2. **Step 3.5**: Create `compare-articles-llm.ts` (LLM comparison)
3. **Step 3**: Refactor `filter-articles-entity.ts` (filter only)
4. **Step 4**: Fix `save-articles-with-entities.ts` (intelligent merge)
5. **Step 5**: Update `generate-indexes.ts` (sort by updated_at)
6. **Test**: Run full pipeline for 5daysago → 4daysago → 3daysago → 2daysago

---

## 📝 Next Steps

Ready to implement Step 3.5 (LLM comparison script). This is the critical new component that makes intelligent UPDATE decisions.

Shall I proceed with creating `compare-articles-llm.ts`?
