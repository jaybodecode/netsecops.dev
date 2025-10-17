/**
 * Content Generation V2 - Publications Schema
 * 
 * Final normalized publications table (not JSON blobs).
 * Created in Step 6 (generate-publication.ts) after resolution decisions.
 */

import { getDB } from './index.js';

export interface Publication {
  id: string;                    // pub-2025-10-09
  pub_date: string;              // 2025-10-09
  headline: string;              // Publication headline
  summary: string;               // Publication summary
  slug?: string;                 // Optional: Computed on export (e.g., "daily-threat-report-2025-10-09")
  article_count: number;         // Number of articles
  article_ids?: string;          // JSON array of article IDs
  created_at: string;            // ISO timestamp
  updated_at?: string;           // Last update timestamp
}

/**
 * Initialize publications schema
 * 
 * NOTE: Slug is optional and can be computed on export based on pub_type and pub_date.
 * Examples: "daily-threat-report-2025-10-09", "weekly-threat-report-2025-w41"
 */
export function initPublicationsSchema(): void {
  const db = getDB();
  
  // Check if table exists
  const tableExists = db.prepare(`
    SELECT COUNT(*) as count 
    FROM sqlite_master 
    WHERE type='table' AND name='publications'
  `).get() as { count: number };
  
  if (tableExists.count > 0) {
    // Table exists - check if it has slug column
    const hasSlug = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('publications') 
      WHERE name='slug'
    `).get() as { count: number };
    
    if (hasSlug.count === 0) {
      // Add slug column if missing (safe - allows NULL)
      try {
        db.exec(`ALTER TABLE publications ADD COLUMN slug TEXT;`);
        console.log('✅ Added slug column to publications table');
      } catch (error) {
        console.warn('⚠️  Could not add slug column to publications table (may already exist)');
      }
    }
    return; // Table exists, skip creation
  }
  
  // Create new table with all columns
  db.exec(`
    CREATE TABLE IF NOT EXISTS publications (
      id TEXT PRIMARY KEY,
      pub_date TEXT NOT NULL,
      headline TEXT NOT NULL,
      summary TEXT NOT NULL,
      article_count INTEGER DEFAULT 0,
      article_ids TEXT DEFAULT '[]',
      slug TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      
      UNIQUE(pub_date)
    );
    
    CREATE INDEX IF NOT EXISTS idx_publications_pub_date 
      ON publications(pub_date DESC);
    
    CREATE INDEX IF NOT EXISTS idx_publications_slug 
      ON publications(slug);
  `);
}

/**
 * Create a new publication
 */
export function createPublication(publication: Omit<Publication, 'created_at'>): void {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT INTO publications (id, pub_date, headline, summary, article_count, article_ids, slug)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    publication.id,
    publication.pub_date,
    publication.headline,
    publication.summary,
    publication.article_count,
    publication.article_ids || '[]',
    publication.slug || null
  );
}

/**
 * Get publication by ID
 */
export function getPublication(id: string): Publication | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM publications
    WHERE id = ?
  `);
  
  return stmt.get(id) as Publication | null;
}

/**
 * Get publication by date
 */
export function getPublicationByDate(pubDate: string): Publication | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM publications
    WHERE pub_date = ?
  `);
  
  return stmt.get(pubDate) as Publication | null;
}

/**
 * Get publication by slug
 */
export function getPublicationBySlug(slug: string): Publication | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM publications
    WHERE slug = ?
  `);
  
  return stmt.get(slug) as Publication | null;
}

/**
 * Get all publications (ordered by date descending)
 */
export function getAllPublications(limit?: number): Publication[] {
  const db = getDB();
  
  const sql = limit
    ? `SELECT * FROM publications ORDER BY pub_date DESC LIMIT ?`
    : `SELECT * FROM publications ORDER BY pub_date DESC`;
  
  const stmt = db.prepare(sql);
  
  return limit ? stmt.all(limit) as Publication[] : stmt.all() as Publication[];
}

/**
 * Check if publication exists for date
 */
export function hasPublication(pubDate: string): boolean {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM publications
    WHERE pub_date = ?
  `);
  
  const result = stmt.get(pubDate) as { count: number };
  return result.count > 0;
}

/**
 * Delete publication (for re-processing)
 */
export function deletePublication(id: string): number {
  const db = getDB();
  
  const stmt = db.prepare(`
    DELETE FROM publications
    WHERE id = ?
  `);
  
  const result = stmt.run(id);
  return result.changes;
}

/**
 * Update publication article count
 */
export function updatePublicationArticleCount(id: string, count: number): void {
  const db = getDB();
  
  const stmt = db.prepare(`
    UPDATE publications
    SET article_count = ?
    WHERE id = ?
  `);
  
  stmt.run(count, id);
}

/**
 * Compute slug for a publication based on type and date
 * 
 * @param pubType - Publication type ('daily', 'weekly', 'monthly', 'special')
 * @param pubDate - Publication date (YYYY-MM-DD)
 * @returns Computed slug (e.g., "daily-threat-report-2025-10-09")
 */
export function computePublicationSlug(pubType: string, pubDate: string): string {
  const date = new Date(pubDate);
  
  switch (pubType.toLowerCase()) {
    case 'daily':
      return `daily-threat-report-${pubDate}`;
    
    case 'weekly':
      // Get ISO week number
      const week = getISOWeek(date);
      const year = date.getFullYear();
      return `weekly-threat-report-${year}-w${week.toString().padStart(2, '0')}`;
    
    case 'monthly':
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year2 = date.getFullYear();
      return `monthly-threat-report-${year2}-${month}`;
    
    case 'special':
      return `special-report-${pubDate}`;
    
    default:
      return `threat-report-${pubDate}`;
  }
}

/**
 * Get ISO week number for a date
 */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Update or generate slug for existing publications
 * 
 * @param pubDate - Publication date to update
 * @param pubType - Publication type (defaults to 'daily')
 */
export function updatePublicationSlug(pubDate: string, pubType: string = 'daily'): void {
  const db = getDB();
  
  const slug = computePublicationSlug(pubType, pubDate);
  
  db.prepare(`
    UPDATE publications
    SET slug = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE pub_date = ?
  `).run(slug, pubDate);
}

/**
 * Batch update slugs for all publications missing them
 * 
 * @param pubType - Default publication type (defaults to 'daily')
 */
export function batchUpdatePublicationSlugs(pubType: string = 'daily'): number {
  const db = getDB();
  
  const publications = db.prepare(`
    SELECT pub_date 
    FROM publications 
    WHERE slug IS NULL OR slug = ''
  `).all() as Array<{ pub_date: string }>;
  
  let updated = 0;
  for (const pub of publications) {
    updatePublicationSlug(pub.pub_date, pubType);
    updated++;
  }
  
  return updated;
}
