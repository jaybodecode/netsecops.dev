/**
 * Content Generation V2 - Published Articles Schema
 * 
 * Final normalized articles table (not JSON blobs).
 * Stores actual published articles with proper foreign keys.
 * 
 * Key concepts:
 * - Uses canonical_article_id (original ID for updates)
 * - Slug NEVER changes (from articles_meta)
 * - Many-to-many with publications via publication_articles
 * - Update history tracked in article_updates
 */

import { getDB } from './index.js';

export interface PublishedArticle {
  id: string;                    // canonical_article_id
  publication_id: string;        // Primary publication
  slug: string;                  // From articles_meta (NEVER changes)
  headline: string;
  summary: string;
  full_report: string;
  position: number;              // Sort order (1-10)
  is_update: boolean;            // Is this an update to existing?
  original_pub_date: string;     // When first published
  created_at: string;            // ISO timestamp
}

export interface PublicationArticle {
  publication_id: string;
  article_id: string;
  position: number;
  is_primary: boolean;           // Original publication vs update
}

export interface ArticleUpdate {
  id: number;
  article_id: string;            // canonical_article_id (ORIGINAL article)
  datetime: string;              // ISO 8601 timestamp of update
  summary: string;               // Brief summary (50-150 chars)
  content: string;               // Detailed update content (200-800 chars)
  severity_change?: string;      // 'increased' | 'decreased' | 'unchanged'
  created_at: string;
}

/**
 * Initialize published articles schema
 * 
 * NOTE: This schema expects a specific structure. If tables already exist
 * with different schema, initialization will be skipped with a warning.
 */
export function initPublishedArticlesSchema(): void {
  const db = getDB();
  
  // Check if published_articles table exists
  const tableExists = db.prepare(`
    SELECT COUNT(*) as count 
    FROM sqlite_master 
    WHERE type='table' AND name='published_articles'
  `).get() as { count: number };
  
  //if (tableExists.count > 0) {
  //  console.warn('⚠️  published_articles table already exists.');
  //  console.warn('    Skipping schema initialization. Existing schema will be used.');
  //  return; // Skip initialization if table exists
  //}
  
  db.exec(`
    -- Main published articles table
    CREATE TABLE IF NOT EXISTS published_articles (
      id TEXT PRIMARY KEY,
      publication_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      headline TEXT NOT NULL,
      summary TEXT NOT NULL,
      full_report TEXT NOT NULL,
      position INTEGER NOT NULL,
      is_update BOOLEAN DEFAULT 0,
      original_pub_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      
      FOREIGN KEY (publication_id) REFERENCES publications(id),
      UNIQUE(slug)
    );
    
    CREATE INDEX IF NOT EXISTS idx_published_articles_publication 
      ON published_articles(publication_id);
    
    CREATE INDEX IF NOT EXISTS idx_published_articles_slug 
      ON published_articles(slug);
    
    CREATE INDEX IF NOT EXISTS idx_published_articles_date 
      ON published_articles(original_pub_date DESC);
    
    -- Many-to-many: Articles can appear in multiple publications
    CREATE TABLE IF NOT EXISTS publication_articles (
      publication_id TEXT NOT NULL,
      article_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      is_primary BOOLEAN DEFAULT 1,
      
      PRIMARY KEY (publication_id, article_id),
      FOREIGN KEY (publication_id) REFERENCES publications(id),
      FOREIGN KEY (article_id) REFERENCES published_articles(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_publication_articles_publication 
      ON publication_articles(publication_id);
    
    CREATE INDEX IF NOT EXISTS idx_publication_articles_article 
      ON publication_articles(article_id);
    
    -- Article update history (V2 schema - matches apply-updates.ts)
    CREATE TABLE IF NOT EXISTS article_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      datetime TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      severity_change TEXT CHECK(severity_change IN ('increased', 'decreased', 'unchanged')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_article_updates_article_id 
      ON article_updates(article_id);
    
    CREATE INDEX IF NOT EXISTS idx_article_updates_datetime 
      ON article_updates(datetime);
    
    -- Article update sources (V2 schema - matches apply-updates.ts)
    CREATE TABLE IF NOT EXISTS article_update_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      update_id INTEGER NOT NULL,
      article_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      website TEXT,
      date TEXT,
      
      FOREIGN KEY (update_id) REFERENCES article_updates(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_article_update_sources_update_id 
      ON article_update_sources(update_id);
    
    CREATE INDEX IF NOT EXISTS idx_article_update_sources_article_id 
      ON article_update_sources(article_id);
  `);
}

/**
 * Create a new published article
 */
export function createPublishedArticle(article: Omit<PublishedArticle, 'created_at'>): void {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT INTO published_articles (
      id, publication_id, slug, headline, summary, full_report,
      position, is_update, original_pub_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    article.id,
    article.publication_id,
    article.slug,
    article.headline,
    article.summary,
    article.full_report,
    article.position,
    article.is_update ? 1 : 0,
    article.original_pub_date
  );
}

/**
 * Get published article by ID
 */
export function getPublishedArticle(id: string): PublishedArticle | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM published_articles
    WHERE id = ?
  `);
  
  return stmt.get(id) as PublishedArticle | null;
}

/**
 * Get published article by slug
 */
export function getPublishedArticleBySlug(slug: string): PublishedArticle | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM published_articles
    WHERE slug = ?
  `);
  
  return stmt.get(slug) as PublishedArticle | null;
}

/**
 * Get all articles for a publication
 */
export function getArticlesByPublication(publicationId: string): PublishedArticle[] {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT pa.*
    FROM published_articles pa
    JOIN publication_articles pap ON pa.id = pap.article_id
    WHERE pap.publication_id = ?
    ORDER BY pap.position
  `);
  
  return stmt.all(publicationId) as PublishedArticle[];
}

/**
 * Get all published articles (ordered by date descending)
 */
export function getAllPublishedArticles(limit?: number): PublishedArticle[] {
  const db = getDB();
  
  const sql = limit
    ? `SELECT * FROM published_articles ORDER BY original_pub_date DESC LIMIT ?`
    : `SELECT * FROM published_articles ORDER BY original_pub_date DESC`;
  
  const stmt = db.prepare(sql);
  
  return limit ? stmt.all(limit) as PublishedArticle[] : stmt.all() as PublishedArticle[];
}

/**
 * Link article to publication
 */
export function linkArticleToPublication(link: PublicationArticle): void {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT INTO publication_articles (publication_id, article_id, position, is_primary)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(
    link.publication_id,
    link.article_id,
    link.position,
    link.is_primary ? 1 : 0
  );
}

/**
 * Create article update record
 */
export function createArticleUpdate(update: Omit<ArticleUpdate, 'id' | 'created_at'>): number {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT INTO article_updates (
      article_id, datetime, summary, content, severity_change
    ) VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    update.article_id,
    update.datetime,
    update.summary,
    update.content,
    update.severity_change || null
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Get all updates for an article
 */
export function getArticleUpdates(articleId: string): ArticleUpdate[] {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM article_updates
    WHERE article_id = ?
    ORDER BY update_date DESC
  `);
  
  return stmt.all(articleId) as ArticleUpdate[];
}

/**
 * Get latest update date for an article
 */
export function getLastUpdateDate(articleId: string): string | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT datetime FROM article_updates
    WHERE article_id = ?
    ORDER BY datetime DESC
    LIMIT 1
  `);
  
  const result = stmt.get(articleId) as { datetime: string } | undefined;
  return result?.datetime ?? null;
}

/**
 * Check if article exists
 */
export function hasPublishedArticle(id: string): boolean {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM published_articles
    WHERE id = ?
  `);
  
  const result = stmt.get(id) as { count: number };
  return result.count > 0;
}

/**
 * Delete article (for re-processing)
 */
export function deletePublishedArticle(id: string): number {
  const db = getDB();
  
  // Delete in order: updates, links, article
  db.exec(`DELETE FROM article_updates WHERE article_id = '${id}'`);
  db.exec(`DELETE FROM publication_articles WHERE article_id = '${id}'`);
  
  const stmt = db.prepare(`
    DELETE FROM published_articles
    WHERE id = ?
  `);
  
  const result = stmt.run(id);
  return result.changes;
}
