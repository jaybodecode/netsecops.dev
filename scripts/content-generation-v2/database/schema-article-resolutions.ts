/**
 * Content Generation V2 - Article Resolutions Schema
 * 
 * Stores duplicate resolution decisions from Step 5 (resolve-duplicates.ts).
 * Used for:
 * - Performance analysis (LLM decision quality)
 * - Threshold tuning (review BORDERLINE cases)
 * - Audit trail (why articles were NEW/UPDATE/SKIP)
 * - Input for Step 6 (generate-publication.ts)
 */

import { getDB } from './index.js';

export interface ArticleResolution {
  id: number;                       // Auto-increment primary key
  article_id: string;                // UUID from structured_news (the NEW article being evaluated)
  pub_date: string;                  // Publication date (YYYY-MM-DD) for the NEW article
  
  // Duplicate detection results
  decision: 'NEW' | 'UPDATE' | 'SKIP'; // Final resolution decision
  confidence: 'high' | 'medium' | 'low'; // LLM confidence level
  similarity_score: number;          // 6D Jaccard score (0-1)
  
  // Original article (if UPDATE or SKIP)
  original_article_id: string | null; // UUID of the existing article to update/link to
  original_pub_date: string | null;   // Publication date of original article
  original_slug: string | null;       // Slug of original article
  
  // IMPORTANT: Which article ID to use for publication generation
  // - For NEW: same as article_id (create new article)
  // - For UPDATE: same as original_article_id (add update to existing)
  // - For SKIP: NULL (don't include in publication)
  canonical_article_id: string | null;
  
  // LLM reasoning (for BORDERLINE cases)
  reasoning: string | null;           // LLM explanation (JSON array of strings)
  resolution_method: 'automatic' | 'llm'; // How decision was made
  
  // Metadata
  created_at: string;                 // ISO timestamp when resolution was created
}

/**
 * Initialize article resolutions schema
 */
export function initArticleResolutionsSchema(): void {
  const db = getDB();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_resolutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      pub_date TEXT NOT NULL,
      
      -- Resolution decision
      decision TEXT NOT NULL CHECK(decision IN ('NEW', 'UPDATE', 'SKIP')),
      confidence TEXT NOT NULL CHECK(confidence IN ('high', 'medium', 'low')),
      similarity_score REAL NOT NULL,
      
      -- Original article (for UPDATE/SKIP)
      original_article_id TEXT,
      original_pub_date TEXT,
      original_slug TEXT,
      
      -- Canonical article ID for publication generation
      canonical_article_id TEXT,
      
      -- LLM reasoning
      reasoning TEXT,
      resolution_method TEXT NOT NULL CHECK(resolution_method IN ('automatic', 'llm')),
      
      -- Metadata
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      
      -- Indexes
      FOREIGN KEY (article_id) REFERENCES articles_meta(article_id),
      UNIQUE(article_id, original_article_id)
    );
    
    -- Index for querying by publication date
    CREATE INDEX IF NOT EXISTS idx_article_resolutions_pub_date 
      ON article_resolutions(pub_date);
    
    -- Index for querying by decision type
    CREATE INDEX IF NOT EXISTS idx_article_resolutions_decision 
      ON article_resolutions(decision);
    
    -- Index for finding all updates to an original article
    CREATE INDEX IF NOT EXISTS idx_article_resolutions_original 
      ON article_resolutions(original_article_id) WHERE original_article_id IS NOT NULL;
    
    -- Index for performance analysis (BORDERLINE LLM cases)
    CREATE INDEX IF NOT EXISTS idx_article_resolutions_llm 
      ON article_resolutions(resolution_method, decision);
  `);
}

/**
 * Save article resolution decision
 */
export function saveArticleResolution(resolution: Omit<ArticleResolution, 'id' | 'created_at'>): number {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT INTO article_resolutions (
      article_id, pub_date, decision, confidence, similarity_score,
      original_article_id, original_pub_date, original_slug,
      canonical_article_id, reasoning, resolution_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    resolution.article_id,
    resolution.pub_date,
    resolution.decision,
    resolution.confidence,
    resolution.similarity_score,
    resolution.original_article_id,
    resolution.original_pub_date,
    resolution.original_slug,
    resolution.canonical_article_id,
    resolution.reasoning,
    resolution.resolution_method
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Get resolutions for a specific publication date
 */
export function getResolutionsByDate(pubDate: string): ArticleResolution[] {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM article_resolutions
    WHERE pub_date = ?
    ORDER BY id
  `);
  
  return stmt.all(pubDate) as ArticleResolution[];
}

/**
 * Get resolution for a specific article
 */
export function getResolutionByArticleId(articleId: string): ArticleResolution | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM article_resolutions
    WHERE article_id = ?
    LIMIT 1
  `);
  
  return stmt.get(articleId) as ArticleResolution | null;
}

/**
 * Get all updates to a specific original article
 */
export function getUpdatesToArticle(originalArticleId: string): ArticleResolution[] {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM article_resolutions
    WHERE original_article_id = ?
      AND decision = 'UPDATE'
    ORDER BY pub_date DESC
  `);
  
  return stmt.all(originalArticleId) as ArticleResolution[];
}

/**
 * Get statistics for resolution decisions
 */
export function getResolutionStats(startDate?: string, endDate?: string): {
  total: number;
  by_decision: { decision: string; count: number; }[];
  by_method: { resolution_method: string; count: number; }[];
  avg_similarity: { decision: string; avg_score: number; }[];
} {
  const db = getDB();
  
  let whereClause = '';
  const params: string[] = [];
  
  if (startDate && endDate) {
    whereClause = 'WHERE pub_date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  } else if (startDate) {
    whereClause = 'WHERE pub_date >= ?';
    params.push(startDate);
  } else if (endDate) {
    whereClause = 'WHERE pub_date <= ?';
    params.push(endDate);
  }
  
  // Total count
  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM article_resolutions ${whereClause}`);
  const total = (totalStmt.get(...params) as { count: number }).count;
  
  // By decision
  const decisionStmt = db.prepare(`
    SELECT decision, COUNT(*) as count
    FROM article_resolutions ${whereClause}
    GROUP BY decision
  `);
  const by_decision = decisionStmt.all(...params) as { decision: string; count: number; }[];
  
  // By method
  const methodStmt = db.prepare(`
    SELECT resolution_method, COUNT(*) as count
    FROM article_resolutions ${whereClause}
    GROUP BY resolution_method
  `);
  const by_method = methodStmt.all(...params) as { resolution_method: string; count: number; }[];
  
  // Average similarity by decision
  const avgStmt = db.prepare(`
    SELECT decision, AVG(similarity_score) as avg_score
    FROM article_resolutions ${whereClause}
    GROUP BY decision
  `);
  const avg_similarity = avgStmt.all(...params) as { decision: string; avg_score: number; }[];
  
  return {
    total,
    by_decision,
    by_method,
    avg_similarity
  };
}

/**
 * Delete resolutions for a specific date (for re-processing)
 */
export function deleteResolutionsByDate(pubDate: string): number {
  const db = getDB();
  
  const stmt = db.prepare(`
    DELETE FROM article_resolutions
    WHERE pub_date = ?
  `);
  
  const result = stmt.run(pubDate);
  return result.changes;
}
