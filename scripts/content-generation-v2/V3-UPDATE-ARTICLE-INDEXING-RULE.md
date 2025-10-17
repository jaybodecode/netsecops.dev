# 🚨 CRITICAL: UPDATE Articles Don't Get Indexed

## The Key Rule

**When an article is marked as UPDATE in Step 5:**
- ❌ **Don't index the NEW article in `articles_meta`**
- ✅ **Only the ORIGINAL article exists in `articles_meta`**
- ✅ **NEW article's content comes from `structured_news` candidate**

## Why This Matters

### The Problem We're Avoiding

If we indexed BOTH articles:
```sql
-- BAD: Both articles in articles_meta
articles_meta:
  uuid-123 | 2025-10-07 | redis-vuln-cve-2025-49844
  uuid-456 | 2025-10-09 | redis-rce-cve-2025-49844   ← WRONG!
```

**Issues:**
- Two nearly identical slugs
- Database bloat with duplicate articles
- Confusion about which is canonical
- Broken article identity model

### The Correct Approach

```sql
-- GOOD: Only ORIGINAL in articles_meta
articles_meta:
  uuid-123 | 2025-10-07 | redis-vuln-cve-2025-49844  ← Only this!

article_resolutions:
  article_id: uuid-456            (NEW article - for reference)
  decision: UPDATE
  canonical_article_id: uuid-123  (Use this for all lookups)
  original_article_id: uuid-123
  
article_updates:
  article_id: uuid-123            (ORIGINAL)
  update_date: 2025-10-09
  source_article_id: uuid-456     (NEW article triggered this)
```

## Pipeline Flow

### Step 1-2: Generate Publication Candidate
```
structured_news (Oct 9):
  - 10 articles including uuid-456 (Redis update)
  - Stored as JSON blob ✅
```

### Step 3: Index Entities (CONDITIONAL!)
```typescript
// BEFORE indexing
for (const article of candidate.articles) {
  // Check if we already processed this date
  const resolution = getResolutionByArticleId(article.id);
  
  if (resolution && resolution.decision === 'UPDATE') {
    console.log(`⏭️  SKIP indexing ${article.id}`);
    console.log(`   Marked as UPDATE to ${resolution.canonical_article_id}`);
    continue; // ❌ Don't index!
  }
  
  // Only index NEW articles
  indexArticle(article); // ✅ Creates articles_meta entry
}
```

### Step 4-5: Detect & Resolve
```typescript
// Step 5 creates resolution record
article_resolutions:
  article_id: uuid-456              // NEW article UUID
  decision: UPDATE
  canonical_article_id: uuid-123    // Use ORIGINAL ID
  original_article_id: uuid-123
  
// uuid-456 is NOT in articles_meta! ✅
```

### Step 6: Generate Publication
```typescript
// For UPDATE articles
const resolution = getResolutionByArticleId('uuid-456');

// ❌ WRONG: This will fail!
const newArticle = getArticleMeta(resolution.article_id); // uuid-456 not indexed

// ✅ CORRECT: Get from candidate
const candidate = getStructuredNewsByDate(resolution.pub_date);
const candidateData = JSON.parse(candidate.data);
const newArticleData = candidateData.articles.find(a => a.id === resolution.article_id);

// Get ORIGINAL article for slug/ID
const originalArticle = getArticleMeta(resolution.canonical_article_id); // uuid-123 ✅

// Create update entry
createArticleUpdate({
  article_id: originalArticle.article_id,  // uuid-123
  update_summary: newArticleData.summary,  // From candidate
  source_article_id: resolution.article_id // uuid-456
});
```

## Data Sources by Article Type

| Article Type | Metadata Source | Content Source | Indexed in articles_meta? |
|--------------|-----------------|----------------|---------------------------|
| **NEW** | `articles_meta` (canonical_article_id) | `articles_meta` | ✅ Yes |
| **UPDATE** | `articles_meta` (ORIGINAL via canonical_article_id) | `structured_news` candidate | ❌ No (NEW article) |
| **SKIP** | N/A (not published) | N/A | ❌ No |

## Querying Pattern

### ✅ Correct: Use canonical_article_id

```typescript
// Get resolutions for publication date
const resolutions = getResolutionsByDate('2025-10-09');

for (const res of resolutions) {
  if (res.decision === 'NEW') {
    // NEW article: indexed in articles_meta
    const article = getArticleMeta(res.canonical_article_id); ✅
    const slug = article.slug;
    const content = article.full_report;
  }
  else if (res.decision === 'UPDATE') {
    // ORIGINAL article: indexed in articles_meta
    const originalArticle = getArticleMeta(res.canonical_article_id); ✅
    const slug = originalArticle.slug; // Keep original slug
    
    // NEW article content: from candidate (not indexed)
    const candidate = getStructuredNewsByDate(res.pub_date);
    const candidateData = JSON.parse(candidate.data);
    const updateContent = candidateData.articles.find(a => a.id === res.article_id);
  }
}
```

### ❌ Wrong: Query NEW article directly

```typescript
// This will FAIL for UPDATE articles!
const resolution = getResolutionByArticleId('uuid-456');
const article = getArticleMeta(resolution.article_id); // ❌ Not indexed!
```

## Step 3 Implementation Requirements

**File: `index-entities.ts`**

Add pre-check before indexing:

```typescript
async function indexArticle(articleId: string, articleData: any) {
  // Check if resolution already exists
  const resolution = getResolutionByArticleId(articleId);
  
  if (resolution) {
    if (resolution.decision === 'UPDATE') {
      console.log(`⏭️  Skipping article ${articleId}`);
      console.log(`   Resolution: UPDATE to ${resolution.canonical_article_id}`);
      console.log(`   Using ORIGINAL article's metadata`);
      return; // Don't index
    }
    
    if (resolution.decision === 'SKIP') {
      console.log(`⏭️  Skipping article ${articleId}`);
      console.log(`   Resolution: SKIP (not publishing)`);
      return; // Don't index
    }
  }
  
  // Only NEW articles (or not yet resolved) get indexed
  console.log(`📇 Indexing article ${articleId}...`);
  
  // Create articles_meta entry
  insertArticleMeta({
    article_id: articleId,
    slug: articleData.slug,
    ...
  });
  
  // Index CVEs, entities, etc.
  // ...
}
```

## Benefits of This Approach

1. **Clean Database**: Only one entry per unique article story
2. **Stable Identifiers**: Original ID/slug never changes
3. **Clear Audit Trail**: `source_article_id` tracks what triggered updates
4. **No Duplicates**: Can't have conflicting slugs or IDs
5. **Efficient Queries**: Fewer rows to scan
6. **Correct Semantics**: UPDATE means "enhance existing", not "create new"

## Testing Checklist

- [ ] Oct 9 Redis article (uuid-456) is NOT in `articles_meta`
- [ ] Oct 7 Redis article (uuid-123) IS in `articles_meta`
- [ ] `article_resolutions` has uuid-456 with `canonical_article_id = uuid-123`
- [ ] Step 6 can retrieve update content from `structured_news` candidate
- [ ] Final publication uses uuid-123 (original) with updates
- [ ] Article JSON file uses original slug "redis-vuln-cve-2025-49844"
- [ ] No duplicate slugs exist in database

## Summary

**The Golden Rule:**
> If `decision = 'UPDATE'`, the NEW article (resolution.article_id) is NEVER indexed in articles_meta. Only the ORIGINAL article (resolution.canonical_article_id) exists there.

This is the foundation of our article identity and update linking system!
