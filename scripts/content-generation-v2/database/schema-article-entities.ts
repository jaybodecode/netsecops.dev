/**
 * Content Generation V2 - Article Entity Indexing Schema
 * 
 * Phase 1 of Fingerprint V2 duplicate detection system.
 * Creates entity index tables for fast candidate filtering.
 * 
 * Strategy:
 * - SQL entity filtering: 300 articles → 5-20 candidates (30-day window)
 * - 6D Jaccard similarity: CVE (40%) + Text (20%) + 4 entity types (40%)
 * 
 * Design documented in: FINGERPRINT-V2.md
 */

import { getDB } from './index.js';

/**
 * Initialize article entity indexing tables
 */
export function initArticleEntitySchema(): void {
  const db = getDB();
  
  db.exec(`
    -- Table 1: Minimal article metadata for fingerprinting
    -- Links article IDs from structured_news.data JSON to entity indexes
    CREATE TABLE IF NOT EXISTS articles_meta (
      article_id TEXT PRIMARY KEY,              -- article.id UUID from LLM
      pub_id TEXT NOT NULL,                     -- Links to structured_news.pub_id
      pub_date_only TEXT NOT NULL,              -- Date-only for 30-day lookback queries
      slug TEXT NOT NULL,                       -- URL slug for article
      summary TEXT NOT NULL,                    -- For text similarity (character trigrams)
      full_report TEXT,                         -- Full article text for improved similarity (Phase 4)
      
      FOREIGN KEY (pub_id) REFERENCES structured_news(pub_id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_articles_pub_id ON articles_meta(pub_id);
    CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles_meta(pub_date_only);
    
    -- Table 2: CVE Entities (PRIMARY dimension - 40% weight)
    -- CVEs are the campaign identifier - highest discriminatory power within 30-day window
    CREATE TABLE IF NOT EXISTS article_cves (
      article_id TEXT NOT NULL,
      cve_id TEXT NOT NULL,                     -- e.g., 'CVE-2025-1234'
      
      -- Optional metadata from LLM extraction (for future filtering)
      cvss_score REAL,                          -- 0-10 score if available
      severity TEXT,                            -- 'critical', 'high', 'medium', 'low', 'none'
      kev INTEGER DEFAULT 0,                    -- 1 if Known Exploited Vulnerability, 0 otherwise
      
      FOREIGN KEY (article_id) REFERENCES articles_meta(article_id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_cve_lookup ON article_cves(cve_id);
    CREATE INDEX IF NOT EXISTS idx_cve_article ON article_cves(article_id);
    CREATE INDEX IF NOT EXISTS idx_cve_severity ON article_cves(severity);
    CREATE INDEX IF NOT EXISTS idx_cve_kev ON article_cves(kev);
    
    -- Table 3: Named Entities (SUPPORTING dimensions - 40% combined weight)
    -- Entity types indexed: threat_actor (12%), malware (12%), product (8%), company (8%)
    -- NOT indexed: person, technology, security_organization, other (too generic)
    CREATE TABLE IF NOT EXISTS article_entities (
      article_id TEXT NOT NULL,
      entity_name TEXT NOT NULL,                -- e.g., 'Cl0p', 'Oracle Database', 'Citibank'
      entity_type TEXT NOT NULL,                -- 'threat_actor', 'malware', 'product', 'company', 'government_agency'
      
      FOREIGN KEY (article_id) REFERENCES articles_meta(article_id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_entity_lookup ON article_entities(entity_name);
    CREATE INDEX IF NOT EXISTS idx_entity_type ON article_entities(entity_type);
    CREATE INDEX IF NOT EXISTS idx_entity_article ON article_entities(article_id);
    CREATE INDEX IF NOT EXISTS idx_entity_type_name ON article_entities(entity_type, entity_name);
  `);
  
  console.log('✅ Article entity indexing schema initialized');
}

/**
 * Entity types to index (high-value signals)
 */
export const INDEXED_ENTITY_TYPES = [
  'threat_actor',      // 12% weight - specific attribution (APT29, Cl0p)
  'malware',           // 12% weight - technical signature (Emotet, Cobalt Strike)
  'product',           // 8% weight - affected systems (Oracle EBS, Redis)
  'company',           // 8% weight - victims/vendors (Citibank, Microsoft)
  'vendor',            // 8% weight - maps to 'company' (Microsoft, Oracle)
  'government_agency'  // Low priority but indexed (FBI, CISA)
] as const;

/**
 * Entity types NOT indexed (low signal, too generic)
 */
export const EXCLUDED_ENTITY_TYPES = [
  'person',                // Names vary, low discriminatory power
  'technology',            // Too broad (e.g., "AI", "blockchain")
  'security_organization', // Too common (CrowdStrike, Mandiant mentioned frequently)
  'other'                  // Undefined category
] as const;

/**
 * Check if entity type should be indexed
 */
export function shouldIndexEntityType(entityType: string): boolean {
  return INDEXED_ENTITY_TYPES.includes(entityType as any);
}

/**
 * Normalize entity type for indexing
 * Maps 'vendor' → 'company' (both get 8% weight)
 */
export function normalizeEntityType(entityType: string): string {
  if (entityType === 'vendor') {
    return 'company';
  }
  return entityType;
}

/**
 * Article metadata for indexing
 */
export interface ArticleMetaForIndexing {
  article_id: string;
  pub_id: string;
  pub_date_only: string;
  slug: string;
  summary: string;
  full_report?: string;  // Phase 4: Full article text for improved similarity
}

/**
 * CVE for indexing
 */
export interface CVEForIndexing {
  article_id: string;
  cve_id: string;
  cvss_score?: number;
  severity?: string;
  kev?: boolean;
}

/**
 * Entity for indexing
 */
export interface EntityForIndexing {
  article_id: string;
  entity_name: string;
  entity_type: string;
}

/**
 * Insert article metadata (idempotent - skips if exists)
 */
export function insertArticleMeta(meta: ArticleMetaForIndexing): void {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO articles_meta (article_id, pub_id, pub_date_only, slug, summary, full_report)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    meta.article_id,
    meta.pub_id,
    meta.pub_date_only,
    meta.slug,
    meta.summary,
    meta.full_report ?? null
  );
}

/**
 * Insert CVE (allows duplicates for multiple articles referencing same CVE)
 */
export function insertCVE(cve: CVEForIndexing): void {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT INTO article_cves (article_id, cve_id, cvss_score, severity, kev)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    cve.article_id,
    cve.cve_id,
    cve.cvss_score ?? null,
    cve.severity ?? null,
    cve.kev ? 1 : 0
  );
}

/**
 * Insert entity (allows duplicates for multiple articles mentioning same entity)
 */
export function insertEntity(entity: EntityForIndexing): void {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT INTO article_entities (article_id, entity_name, entity_type)
    VALUES (?, ?, ?)
  `);
  
  stmt.run(
    entity.article_id,
    entity.entity_name,
    entity.entity_type
  );
}

/**
 * Check if article is already indexed
 */
export function isArticleIndexed(articleId: string): boolean {
  const db = getDB();
  
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM articles_meta
    WHERE article_id = ?
  `).get(articleId) as { count: number };
  
  return result.count > 0;
}

/**
 * Get article metadata by ID
 */
export function getArticleMeta(articleId: string): ArticleMetaForIndexing | undefined {
  const db = getDB();
  
  return db.prepare(`
    SELECT article_id, pub_id, pub_date_only, slug, summary, full_report
    FROM articles_meta
    WHERE article_id = ?
  `).get(articleId) as ArticleMetaForIndexing | undefined;
}

/**
 * Get all CVEs for an article
 */
export function getArticleCVEs(articleId: string): CVEForIndexing[] {
  const db = getDB();
  
  const rows = db.prepare(`
    SELECT article_id, cve_id, cvss_score, severity, kev
    FROM article_cves
    WHERE article_id = ?
  `).all(articleId) as Array<{
    article_id: string;
    cve_id: string;
    cvss_score: number | null;
    severity: string | null;
    kev: number;
  }>;
  
  return rows.map(row => ({
    article_id: row.article_id,
    cve_id: row.cve_id,
    cvss_score: row.cvss_score ?? undefined,
    severity: row.severity ?? undefined,
    kev: row.kev === 1
  }));
}

/**
 * Get all entities for an article
 */
export function getArticleEntities(articleId: string): EntityForIndexing[] {
  const db = getDB();
  
  return db.prepare(`
    SELECT article_id, entity_name, entity_type
    FROM article_entities
    WHERE article_id = ?
  `).all(articleId) as EntityForIndexing[];
}

/**
 * Delete all entity data for an article (for re-indexing)
 */
export function deleteArticleEntities(articleId: string): void {
  const db = getDB();
  
  db.prepare('DELETE FROM article_cves WHERE article_id = ?').run(articleId);
  db.prepare('DELETE FROM article_entities WHERE article_id = ?').run(articleId);
  db.prepare('DELETE FROM articles_meta WHERE article_id = ?').run(articleId);
}

/**
 * Get statistics about indexed articles
 */
export interface EntityIndexStats {
  total_articles: number;
  total_publications: number;
  total_cves: number;
  unique_cves: number;
  total_entities: number;
  unique_entities: number;
  oldest_date: string | null;
  newest_date: string | null;
  entity_type_counts: Record<string, number>;
}

export function getEntityIndexStats(): EntityIndexStats {
  const db = getDB();
  
  const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles_meta').get() as { count: number };
  const pubCount = db.prepare('SELECT COUNT(DISTINCT pub_id) as count FROM articles_meta').get() as { count: number };
  const cveCount = db.prepare('SELECT COUNT(*) as count FROM article_cves').get() as { count: number };
  const uniqueCveCount = db.prepare('SELECT COUNT(DISTINCT cve_id) as count FROM article_cves').get() as { count: number };
  const entityCount = db.prepare('SELECT COUNT(*) as count FROM article_entities').get() as { count: number };
  const uniqueEntityCount = db.prepare('SELECT COUNT(DISTINCT entity_name) as count FROM article_entities').get() as { count: number };
  
  const dateRange = db.prepare(`
    SELECT MIN(pub_date_only) as oldest, MAX(pub_date_only) as newest
    FROM articles_meta
  `).get() as { oldest: string | null; newest: string | null };
  
  const entityTypes = db.prepare(`
    SELECT entity_type, COUNT(*) as count
    FROM article_entities
    GROUP BY entity_type
    ORDER BY count DESC
  `).all() as Array<{ entity_type: string; count: number }>;
  
  const entity_type_counts: Record<string, number> = {};
  for (const row of entityTypes) {
    entity_type_counts[row.entity_type] = row.count;
  }
  
  return {
    total_articles: articleCount.count,
    total_publications: pubCount.count,
    total_cves: cveCount.count,
    unique_cves: uniqueCveCount.count,
    total_entities: entityCount.count,
    unique_entities: uniqueEntityCount.count,
    oldest_date: dateRange.oldest,
    newest_date: dateRange.newest,
    entity_type_counts
  };
}
