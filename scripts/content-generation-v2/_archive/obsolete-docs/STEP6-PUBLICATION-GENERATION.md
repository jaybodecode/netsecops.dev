# Step 6: Publication Generation - Normalized Schema

## 📊 Database Schema Overview

### Existing Tables (Keep as-is)
```sql
-- Publication CANDIDATES (LLM output storage)
structured_news (pub_id, pub_date_only, data, headline, slug, ...)

-- Article metadata (Step 3 indexing)
articles_meta (article_id, pub_id, pub_date_only, slug, summary, full_report)

-- Entity indexing
article_cves (article_id, cve_id, ...)
article_entities (article_id, entity_type, entity_value, ...)

-- Resolution decisions (Step 5)
article_resolutions (
  article_id,              -- NEW article UUID
  canonical_article_id,    -- ID to use (ORIGINAL for UPDATE, NEW for NEW)
  decision,                -- NEW/UPDATE/SKIP
  original_article_id,     -- Link to original
  ...
)
```

### New Tables (Step 6 creates these)

```sql
-- Real publications table
CREATE TABLE publications (
  id TEXT PRIMARY KEY,              -- pub-2025-10-09
  pub_date TEXT NOT NULL,           -- 2025-10-09
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  slug TEXT NOT NULL,               -- From LLM or regenerated if SKIP
  article_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(pub_date),
  INDEX idx_pub_date (pub_date)
);

-- Real published articles (normalized, not JSON blob!)
CREATE TABLE published_articles (
  id TEXT PRIMARY KEY,              -- canonical_article_id
  publication_id TEXT NOT NULL,     -- Which publication includes this
  slug TEXT NOT NULL,               -- From articles_meta (NEVER changes)
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_report TEXT NOT NULL,
  position INTEGER,                 -- Sort order (1-10)
  is_update BOOLEAN DEFAULT 0,      -- Is this an update to existing?
  original_pub_date TEXT,           -- For updates: when was original published?
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (publication_id) REFERENCES publications(id),
  INDEX idx_publication (publication_id),
  INDEX idx_slug (slug)
);

-- Many-to-many: Publications can have multiple articles
-- Articles can appear in multiple publications (as updates)
CREATE TABLE publication_articles (
  publication_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  position INTEGER NOT NULL,        -- Sort order within publication
  is_primary BOOLEAN DEFAULT 1,     -- Is this the original publication?
  
  PRIMARY KEY (publication_id, article_id),
  FOREIGN KEY (publication_id) REFERENCES publications(id),
  FOREIGN KEY (article_id) REFERENCES published_articles(id)
);

-- Track article update history
CREATE TABLE article_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,         -- canonical_article_id (ORIGINAL)
  update_date TEXT NOT NULL,        -- When update was added (pub_date)
  update_summary TEXT NOT NULL,     -- What's new
  source_article_id TEXT NOT NULL,  -- The NEW article UUID that triggered update
  publication_id TEXT NOT NULL,     -- Which publication added this update
  
  FOREIGN KEY (article_id) REFERENCES published_articles(id),
  FOREIGN KEY (publication_id) REFERENCES publications(id),
  INDEX idx_article_updates (article_id)
);
```

## 🔄 Step 6: generate-publication.ts Flow

### Input
- Publication date (e.g., `2025-10-09`)

### Process

```typescript
async function generatePublication(pubDate: string) {
  // 1. Load publication candidate from structured_news
  const candidate = getStructuredNewsByDate(pubDate);
  if (!candidate) {
    throw new Error(`No publication candidate for ${pubDate}`);
  }

  // 2. Load resolution decisions
  const resolutions = getResolutionsByDate(pubDate);
  
  // 3. Filter: Only NEW and UPDATE articles get published
  const toPublish = resolutions.filter(r => 
    r.decision === 'NEW' || r.decision === 'UPDATE'
  );
  
  const hasSkips = resolutions.some(r => r.decision === 'SKIP');
  
  // 4. Determine publication metadata
  let finalHeadline = candidate.headline;
  let finalSummary = candidate.summary;
  let finalSlug = candidate.slug; // ← Use LLM-generated slug!
  
  if (hasSkips) {
    console.log(`⚠️  ${resolutions.filter(r => r.decision === 'SKIP').length} article(s) SKIPped`);
    console.log(`🔄 Regenerating publication metadata...`);
    
    // Call LLM to regenerate headline, summary, AND slug
    const regenerated = await regeneratePublicationMetadata({
      originalCandidate: candidate,
      remainingArticles: toPublish.map(r => 
        getArticleMeta(r.canonical_article_id)
      )
    });
    
    finalHeadline = regenerated.headline;
    finalSummary = regenerated.summary;
    finalSlug = regenerated.slug; // ← LLM generates new slug
  }
  
  // 5. Create publication record
  const publicationId = `pub-${pubDate}`;
  
  createPublication({
    id: publicationId,
    pub_date: pubDate,
    headline: finalHeadline,
    summary: finalSummary,
    slug: finalSlug, // ← From LLM (original or regenerated)
    article_count: toPublish.length
  });
  
  console.log(`✅ Created publication: ${publicationId}`);
  console.log(`   Slug: ${finalSlug}`);
  console.log(`   Articles: ${toPublish.length}`);
  
  // 6. Process each article
  let position = 1;
  
  for (const resolution of toPublish) {
    if (resolution.decision === 'NEW') {
      await processNewArticle(resolution, publicationId, position++);
    }
    else if (resolution.decision === 'UPDATE') {
      await processUpdateArticle(resolution, publicationId, position++);
    }
  }
  
  console.log(`\n✅ Publication generation complete!`);
  return publicationId;
}
```

### Process NEW Articles

```typescript
async function processNewArticle(
  resolution: ArticleResolution,
  publicationId: string,
  position: number
) {
  // Get article metadata (from articles_meta via canonical_article_id)
  const article = getArticleMeta(resolution.canonical_article_id);
  
  console.log(`\n📄 NEW Article (${position}):`);
  console.log(`   ID: ${article.article_id}`);
  console.log(`   Slug: ${article.slug}`); // ← Use existing slug from Step 3
  
  // Create published article record
  createPublishedArticle({
    id: article.article_id,
    publication_id: publicationId,
    slug: article.slug,           // ← From articles_meta (NEVER generate!)
    headline: article.headline,
    summary: article.summary,
    full_report: article.full_report,
    position: position,
    is_update: false,
    original_pub_date: article.pub_date_only
  });
  
  // Link article to publication
  linkArticleToPublication({
    publication_id: publicationId,
    article_id: article.article_id,
    position: position,
    is_primary: true  // This is the original publication
  });
}
```

### Process UPDATE Articles

```typescript
async function processUpdateArticle(
  resolution: ArticleResolution,
  publicationId: string,
  position: number
) {
  // Get ORIGINAL article (using canonical_article_id)
  const originalArticle = getArticleMeta(resolution.canonical_article_id);
  
  // ⚠️ IMPORTANT: NEW article (resolution.article_id) does NOT exist in articles_meta!
  // It was never indexed because it's marked as UPDATE.
  // We need to get its content from the publication candidate instead.
  
  const candidate = getStructuredNewsByDate(resolution.pub_date);
  const candidateData = JSON.parse(candidate.data);
  const newArticleData = candidateData.articles.find(a => a.id === resolution.article_id);
  
  if (!newArticleData) {
    console.error(`❌ Could not find NEW article data in candidate`);
    return;
  }
  
  console.log(`\n🔄 UPDATE Article (${position}):`);
  console.log(`   Original ID: ${originalArticle.article_id}`);
  console.log(`   Original Slug: ${originalArticle.slug}`); // ← Keep original!
  console.log(`   Original Date: ${originalArticle.pub_date_only}`);
  console.log(`   Update Source: ${resolution.article_id} (not indexed)`);
  
  // Check if original article already published
  const existingArticle = getPublishedArticle(originalArticle.article_id);
  
  if (!existingArticle) {
    // First time publishing this article
    console.log(`   ℹ️  First publication of this article`);
    
    createPublishedArticle({
      id: originalArticle.article_id,
      publication_id: publicationId,
      slug: originalArticle.slug,    // ← Use ORIGINAL slug
      headline: originalArticle.headline,
      summary: originalArticle.summary,
      full_report: originalArticle.full_report,
      position: position,
      is_update: false,
      original_pub_date: originalArticle.pub_date_only
    });
  }
  
  // Add update record using NEW article's content from candidate
  createArticleUpdate({
    article_id: originalArticle.article_id,  // ← ORIGINAL article
    update_date: resolution.pub_date,
    update_summary: newArticleData.summary,  // From candidate, not articles_meta
    source_article_id: resolution.article_id,
    publication_id: publicationId
  });
  
  // Link original article to this publication
  linkArticleToPublication({
    publication_id: publicationId,
    article_id: originalArticle.article_id,
    position: position,
    is_primary: false  // This is an update, not the original
  });
}
```

## 📤 Output: Database Records

After running Step 6 on Oct 9 data:

### `publications` table
```
id              | pub_date   | headline                          | slug                  | article_count
----------------|------------|-----------------------------------|-----------------------|--------------
pub-2025-10-09  | 2025-10-09 | Red Hat Breach Exposes 800+ Orgs  | red-hat-breach-oct-09 | 10
```

### `published_articles` table
```
id       | publication_id  | slug                    | headline              | is_update | original_pub_date
---------|-----------------|-------------------------|-----------------------|-----------|------------------
uuid-123 | pub-2025-10-07  | redis-vuln-cve-2025-... | Critical Redis RCE... | 0         | 2025-10-07
uuid-789 | pub-2025-10-09  | red-hat-breach...       | Crimson Collective... | 0         | 2025-10-09
```

### `publication_articles` table (Join table)
```
publication_id  | article_id | position | is_primary
----------------|------------|----------|------------
pub-2025-10-07  | uuid-123   | 1        | 1          ← Original publication
pub-2025-10-09  | uuid-123   | 4        | 0          ← Included as update
pub-2025-10-09  | uuid-789   | 1        | 1          ← New article
```

### `article_updates` table
```
id | article_id | update_date | update_summary                  | source_article_id | publication_id
---|------------|-------------|---------------------------------|-------------------|----------------
1  | uuid-123   | 2025-10-09  | Added specific patch versions... | uuid-456          | pub-2025-10-09
```

## 📝 Step 7: Generate JSON Files

```typescript
async function generatePublicationJSON(publicationId: string) {
  // Query with JOIN
  const publication = getPublication(publicationId);
  const articles = getArticlesByPublication(publicationId);
  
  // Write publication JSON
  await writeJSON(`/public/publications/${publication.slug}.json`, {
    id: publication.id,
    date: publication.pub_date,
    headline: publication.headline,
    summary: publication.summary,
    slug: publication.slug,
    articles: articles.map(a => ({
      id: a.id,
      slug: a.slug,
      headline: a.headline,
      summary: a.summary,
      is_update: !a.is_primary
    }))
  });
  
  // Write individual article JSON files
  for (const article of articles) {
    const updates = getArticleUpdates(article.id);
    
    await writeJSON(`/public/articles/${article.slug}.json`, {
      id: article.id,
      slug: article.slug,
      headline: article.headline,
      summary: article.summary,
      full_report: article.full_report,
      published: article.original_pub_date,
      updates: updates.map(u => ({
        date: u.update_date,
        summary: u.update_summary,
        publication_id: u.publication_id
      }))
    });
  }
}
```

## 📊 Index Generation (Step 8)

### Publications Index
```typescript
async function generatePublicationsIndex() {
  const publications = getAllPublications(); // ORDER BY pub_date DESC
  
  await writeJSON('/public/publications/index.json', {
    total: publications.length,
    publications: publications.map(p => ({
      id: p.id,
      date: p.pub_date,
      headline: p.headline,
      slug: p.slug,
      article_count: p.article_count
    }))
  });
}
```

### Articles Index
```typescript
async function generateArticlesIndex() {
  const articles = getAllPublishedArticles(); // ORDER BY created_at DESC
  
  await writeJSON('/public/articles/index.json', {
    total: articles.length,
    articles: articles.map(a => ({
      id: a.id,
      slug: a.slug,
      headline: a.headline,
      published: a.original_pub_date,
      last_updated: getLastUpdateDate(a.id)
    }))
  });
}
```

## 🎯 Key Benefits

1. **Clean Queries**: SQL JOINs instead of JSON parsing
2. **Stable Slugs**: Articles keep their original slugs forever
3. **Update Tracking**: Clear history of what changed when
4. **Proper Indexes**: Fast queries for publications/articles lists
5. **Referential Integrity**: Foreign keys prevent orphaned data
6. **LLM-Generated Slugs**: Use original LLM slugs, only regenerate if needed
