/**
 * Content Generation V2 - Structured News Schema
 * 
 * Schema and functions for storing structured article publications
 */

import { getDB } from './index.js';
import type { CyberAdvisoryType } from '../news-structured-schema.js';

/**
 * Initialize structured news table
 * 
 * NOTE: If table already exists without pub_date_only column, this will fail.
 * The pub_date_only is a GENERATED column that cannot be added via ALTER TABLE.
 * If you need to add it to existing table, must drop and recreate.
 */
export function initStructuredNewsSchema(): void {
  const db = getDB();
  
  // Check if table exists
  const tableExists = db.prepare(`
    SELECT COUNT(*) as count 
    FROM sqlite_master 
    WHERE type='table' AND name='structured_news'
  `).get() as { count: number };
  
  if (tableExists.count > 0) {
    // Table exists - check if it has pub_date_only column
    const hasColumn = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('structured_news') 
      WHERE name='pub_date_only'
    `).get() as { count: number };
    
    if (hasColumn.count === 0) {
      console.warn('⚠️  structured_news table exists without pub_date_only column.');
      console.warn('    Skipping schema initialization. Table will work but without generated column.');
      console.warn('    To add generated column, drop and recreate table (will lose data).');
      return; // Skip initialization - table works fine without generated column
    }
  }
  
  // Create table with generated column (only if table doesn't exist)
  db.exec(`
    CREATE TABLE IF NOT EXISTS structured_news (
      pub_id TEXT PRIMARY KEY,         -- UUID from publication (LLM-generated)
      
      -- Publication datetime (linkage to raw_search.pub_date)
      pub_date TEXT NOT NULL,          -- ISO 8601 UTC datetime string (not unique - allows multiple per day)
      pub_date_only TEXT GENERATED ALWAYS AS (date(pub_date)) STORED,  -- Date-only for easy queries
      
      -- Publication type for multiple publications per day
      pub_type TEXT NOT NULL DEFAULT 'daily',  -- 'daily', 'weekly', 'monthly'
      
      -- When this structured version was created (UTC)
      generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      -- Complete structured JSON output (CyberAdvisoryType)
      data TEXT NOT NULL,
      
      -- Quick access fields for queries (denormalized from JSON)
      headline TEXT NOT NULL,           -- Main headline
      total_articles INTEGER NOT NULL,  -- Number of articles
      date_range TEXT NOT NULL          -- Date range covered
    );
    
    CREATE INDEX IF NOT EXISTS idx_structured_news_pub_date ON structured_news(pub_date);
    CREATE INDEX IF NOT EXISTS idx_structured_news_date_only ON structured_news(pub_date_only);
    CREATE INDEX IF NOT EXISTS idx_structured_news_type ON structured_news(pub_type);
    CREATE INDEX IF NOT EXISTS idx_structured_news_date_type ON structured_news(pub_date_only, pub_type);
    CREATE INDEX IF NOT EXISTS idx_structured_news_generated ON structured_news(generated_at);
  `);
}

/**
 * Structured news result for saving
 */
export interface StructuredNewsResult {
  pubDate: string;           // ISO 8601 UTC datetime (must match raw_search.pub_date)
  pubType?: string;          // 'daily', 'weekly', 'monthly' (defaults to 'daily')
  data: CyberAdvisoryType;   // Complete structured publication
}

/**
 * Structured news record from database
 */
export interface StructuredNewsRecord {
  pub_id: string;            // PRIMARY KEY
  pub_date: string;
  pub_date_only: string;     // Computed: date-only portion (e.g., '2025-10-07')
  pub_type: string;          // 'daily', 'weekly', 'monthly'
  generated_at: string;
  data: string;              // JSON string
  headline: string;
  total_articles: number;
  date_range: string;
}

/**
 * Save structured news to database
 * Deletes existing entries for the same date+type before inserting to prevent duplicates
 */
export function saveStructuredNews(result: StructuredNewsResult): string {
  const db = getDB();
  
  const dataJson = JSON.stringify(result.data, null, 2);
  const pubType = result.pubType || 'daily';
  
  // Delete any existing entries for this date and type to prevent duplicates
  // (pub_id is UUID generated fresh each time, so INSERT OR REPLACE won't work)
  db.prepare(`
    DELETE FROM structured_news
    WHERE date(pub_date) = date(?) AND pub_type = ?
  `).run(result.pubDate, pubType);
  
  // Now insert the new entry
  const stmt = db.prepare(`
    INSERT INTO structured_news (
      pub_id,
      pub_date,
      pub_type,
      data, 
      headline, 
      total_articles, 
      date_range,
      generated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.run(
    result.data.pub_id,
    result.pubDate,
    pubType,
    dataJson,
    result.data.headline,
    result.data.total_articles,
    result.data.date_range
  );
  
  return result.data.pub_id;
}

/**
 * Get structured news by publication date
 * Returns parsed CyberAdvisoryType object
 */
export function getStructuredNews(pubDate: string): CyberAdvisoryType | undefined {
  const db = getDB();
  
  const record = db.prepare(`
    SELECT data
    FROM structured_news
    WHERE pub_date = ?
    ORDER BY generated_at DESC
    LIMIT 1
  `).get(pubDate) as { data: string } | undefined;
  
  if (!record) return undefined;
  
  return JSON.parse(record.data) as CyberAdvisoryType;
}

/**
 * Get structured news record by publication date (with metadata)
 * 
 * NOTE: Uses date(pub_date) function for compatibility with tables
 * that don't have the pub_date_only generated column.
 */
export function getStructuredNewsRecord(pubDate: string): StructuredNewsRecord | undefined {
  const db = getDB();
  
  return db.prepare(`
    SELECT pub_id, pub_date, date(pub_date) as pub_date_only, pub_type, generated_at, data, headline, total_articles, date_range
    FROM structured_news
    WHERE pub_date = ?
    ORDER BY generated_at DESC
    LIMIT 1
  `).get(pubDate) as StructuredNewsRecord | undefined;
}

/**
 * Get structured news record by date-only (YYYY-MM-DD)
 * 
 * NOTE: Uses date(pub_date) function for compatibility with tables
 * that don't have the pub_date_only generated column.
 */
export function getStructuredNewsByDate(pubDateOnly: string): StructuredNewsRecord | undefined {
  const db = getDB();
  
  return db.prepare(`
    SELECT pub_id, pub_date, date(pub_date) as pub_date_only, pub_type, generated_at, data, headline, total_articles, date_range
    FROM structured_news
    WHERE date(pub_date) = ?
    ORDER BY generated_at DESC
    LIMIT 1
  `).get(pubDateOnly) as StructuredNewsRecord | undefined;
}

/**
 * Get all structured news records ordered by publication date
 * 
 * NOTE: Uses date(pub_date) function for compatibility with tables
 * that don't have the pub_date_only generated column.
 */
export function getAllStructuredNews(limit?: number): StructuredNewsRecord[] {
  const db = getDB();
  
  let query = `
    SELECT pub_id, pub_date, date(pub_date) as pub_date_only, pub_type, generated_at, headline, total_articles, date_range, LENGTH(data) as data_size
    FROM structured_news
    ORDER BY pub_date DESC
  `;
  
  if (limit) {
    query += ` LIMIT ?`;
    return db.prepare(query).all(limit) as StructuredNewsRecord[];
  }
  
  return db.prepare(query).all() as StructuredNewsRecord[];
}

/**
 * Check if structured news exists for a date
 */
export function hasStructuredNews(pubDate: string): boolean {
  const db = getDB();
  
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM structured_news
    WHERE pub_date = ?
  `).get(pubDate) as { count: number };
  
  return result.count > 0;
}

/**
 * Delete structured news by pub_id
 */
export function deleteStructuredNews(pubId: string): void {
  const db = getDB();
  
  db.prepare(`
    DELETE FROM structured_news
    WHERE pub_id = ?
  `).run(pubId);
}

/**
 * Delete all structured news for a date (useful for regeneration)
 */
export function deleteStructuredNewsByDate(pubDate: string): void {
  const db = getDB();
  
  db.prepare(`
    DELETE FROM structured_news
    WHERE pub_date = ?
  `).run(pubDate);
}
