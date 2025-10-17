/**
 * Content Generation V2 - Raw Search Results Schema
 * 
 * Schema and functions for storing raw LLM search results
 */

import { getDB } from './index.js';

/**
 * Initialize raw search results table
 */
export function initRawSearchSchema(): void {
  const db = getDB();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_search (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Publication datetime (end of search window as UTC timestamp, e.g., 9am CST = 15:00 UTC)
      pub_date TEXT NOT NULL,  -- ISO 8601 UTC datetime string
      
      -- Publication type (daily, weekly, monthly, special)
      pub_type TEXT NOT NULL DEFAULT 'daily',
      
      -- When this record was created (UTC)
      generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      -- Complete raw text response from LLM
      data TEXT NOT NULL,
      
      -- Ensure only one record per date + type combination
      UNIQUE(pub_date, pub_type)
    );
    
    CREATE INDEX IF NOT EXISTS idx_raw_search_generated ON raw_search(generated_at);
    CREATE INDEX IF NOT EXISTS idx_raw_search_pub_date ON raw_search(pub_date, pub_type);
  `);
}

/**
 * Raw search result entry
 */
export interface RawSearchResult {
  pubDate: string;      // ISO 8601 UTC datetime string (end of search window, e.g., 9am CST = 15:00 UTC)
  pubType?: string;     // Publication type (daily, weekly, monthly, special) - defaults to 'daily'
  data: string;         // Complete raw text response
}

/**
 * Raw search record from database
 */
export interface RawSearchRecord {
  id: number;
  pub_date: string;
  pub_type: string;
  generated_at: string;
  data: string;
}

/**
 * Save raw search result to database
 * Uses INSERT OR REPLACE to overwrite existing entries for the same pub_date + pub_type
 */
export function saveRawSearch(result: RawSearchResult): number {
  const db = getDB();
  
  const pubType = result.pubType || 'daily';
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO raw_search (pub_date, pub_type, data, generated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  const info = stmt.run(result.pubDate, pubType, result.data);
  return info.lastInsertRowid as number;
}

/**
 * Get raw search result by publication date and type
 */
export function getRawSearch(pubDate: string, pubType: string = 'daily'): RawSearchRecord | undefined {
  const db = getDB();
  
  return db.prepare(`
    SELECT id, pub_date, pub_type, generated_at, data
    FROM raw_search
    WHERE pub_date = ? AND pub_type = ?
    ORDER BY generated_at DESC
    LIMIT 1
  `).get(pubDate, pubType) as RawSearchRecord | undefined;
}

/**
 * Get all raw search results ordered by publication date
 */
export function getAllRawSearches(limit?: number) {
  const db = getDB();
  
  let query = `
    SELECT id, pub_date, pub_type, generated_at, LENGTH(data) as data_size
    FROM raw_search
    ORDER BY pub_date DESC, pub_type
  `;
  
  if (limit) {
    query += ` LIMIT ?`;
    return db.prepare(query).all(limit);
  }
  
  return db.prepare(query).all();
}
