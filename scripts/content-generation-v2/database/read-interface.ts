/**
 * Database Read Interface
 * 
 * Clean, flexible query interface for extracting article data.
 * Supports dynamic field selection and filtering by date, category, severity, etc.
 * 
 * Usage:
 *   const articles = getArticlesByDate('2025-10-16', ['slug', 'headline', 'full_report']);
 *   const data = getArticles({ severity: 'critical', limit: 10 }, ['slug', 'summary']);
 */

import { getDB } from './index.js';
import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ArticleFilters {
  /** Filter by publication date (YYYY-MM-DD) */
  date?: string;
  /** Filter by date range */
  dateFrom?: string;
  dateTo?: string;
  /** Filter by category (e.g., 'Ransomware', 'Vulnerability') */
  category?: string;
  /** Filter by severity (critical, high, medium, low) */
  severity?: string;
  /** Filter by is_update flag */
  isUpdate?: boolean;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Order by field */
  orderBy?: string;
  /** Order direction (ASC or DESC) */
  orderDirection?: 'ASC' | 'DESC';
}

export interface ArticleRecord {
  [key: string]: any;
}

// All available fields from both tables
export type PublishedArticleField = 
  | 'id'
  | 'publication_id'
  | 'slug'
  | 'headline'
  | 'summary'
  | 'full_report'
  | 'position'
  | 'is_update'
  | 'original_pub_date'
  | 'created_at';

export type ArticleField =
  | 'id'
  | 'slug'
  | 'headline'
  | 'title'
  | 'summary'
  | 'full_report'
  | 'twitter_post'
  | 'meta_description'
  | 'category'
  | 'severity'
  | 'article_type'
  | 'keywords'
  | 'reading_time_minutes'
  | 'pub_date'
  | 'extract_datetime'
  | 'created_at'
  | 'updated_at'
  | 'resolution'
  | 'similarity_score'
  | 'matched_article_id'
  | 'skip_reasoning'
  | 'isUpdate'
  | 'updateCount'
  | 'updates';

// ============================================================================
// Main Query Functions
// ============================================================================

/**
 * Get articles by specific date with custom field selection
 * 
 * @param date - Publication date (YYYY-MM-DD)
 * @param fields - Array of field names to retrieve (default: all)
 * @param limit - Maximum number of results (default: no limit)
 * @returns Array of article records with selected fields
 * 
 * @example
 * // Get slug and headline for articles on Oct 16
 * const articles = getArticlesByDate('2025-10-16', ['slug', 'headline']);
 * 
 * @example
 * // Get full context for tweet generation (top 20)
 * const articles = getArticlesByDate('2025-10-16', 
 *   ['slug', 'headline', 'summary', 'full_report', 'category', 'severity'], 
 *   20
 * );
 */
export function getArticlesByDate(
  date: string,
  fields?: string[],
  limit?: number
): ArticleRecord[] {
  return getArticles({
    date,
    limit,
    orderBy: 'position',
    orderDirection: 'ASC'
  }, fields);
}

/**
 * Get articles with flexible filtering and field selection
 * 
 * @param filters - Filter criteria
 * @param fields - Array of field names to retrieve (default: all common fields)
 * @returns Array of article records
 * 
 * @example
 * // Get critical vulnerabilities from last 2 days
 * const articles = getArticles({
 *   dateFrom: '2025-10-15',
 *   dateTo: '2025-10-16',
 *   severity: 'critical',
 *   category: 'Vulnerability'
 * }, ['slug', 'headline', 'summary']);
 */
export function getArticles(
  filters: ArticleFilters = {},
  fields?: string[]
): ArticleRecord[] {
  const db = getDB();
  
  // Build SELECT clause
  const selectedFields = buildFieldList(fields);
  
  // Build WHERE clause
  const { whereClause, params } = buildWhereClause(filters);
  
  // Build ORDER BY clause
  const orderClause = buildOrderClause(filters);
  
  // Build LIMIT/OFFSET clause
  const limitClause = buildLimitClause(filters);
  
  // Construct full query
  const query = `
    SELECT ${selectedFields}
    FROM published_articles pa
    LEFT JOIN articles a ON pa.slug = a.slug
    ${whereClause}
    ${orderClause}
    ${limitClause}
  `.trim();
  
  const stmt = db.prepare(query);
  return stmt.all(...params) as ArticleRecord[];
}

/**
 * Get a single article by slug with custom field selection
 * 
 * @param slug - Article slug
 * @param fields - Array of field names to retrieve
 * @returns Article record or null if not found
 */
export function getArticleBySlug(
  slug: string,
  fields?: string[]
): ArticleRecord | null {
  const db = getDB();
  const selectedFields = buildFieldList(fields);
  
  const query = `
    SELECT ${selectedFields}
    FROM published_articles pa
    LEFT JOIN articles a ON pa.slug = a.slug
    WHERE pa.slug = ?
  `;
  
  const stmt = db.prepare(query);
  const result = stmt.get(slug) as ArticleRecord | undefined;
  
  return result || null;
}

/**
 * Get count of articles matching filters
 * 
 * @param filters - Filter criteria
 * @returns Number of matching articles
 */
export function getArticleCount(filters: ArticleFilters = {}): number {
  const db = getDB();
  const { whereClause, params } = buildWhereClause(filters);
  
  const query = `
    SELECT COUNT(*) as count
    FROM published_articles pa
    LEFT JOIN articles a ON pa.slug = a.slug
    ${whereClause}
  `;
  
  const stmt = db.prepare(query);
  const result = stmt.get(...params) as { count: number };
  
  return result.count;
}

// ============================================================================
// Query Builder Helpers
// ============================================================================

/**
 * Build SELECT field list
 */
function buildFieldList(fields?: string[]): string {
  if (!fields || fields.length === 0) {
    // Default: all commonly used fields with table prefixes to avoid ambiguity
    return `
      pa.id,
      pa.slug,
      pa.headline,
      pa.summary,
      pa.full_report,
      pa.position,
      pa.is_update,
      pa.created_at,
      a.category,
      a.severity,
      a.twitter_post,
      a.keywords
    `.trim();
  }
  
  // Map fields to table aliases (pa = published_articles, a = articles)
  const fieldMap: Record<string, string> = {
    // published_articles fields
    id: 'pa.id',
    publication_id: 'pa.publication_id',
    slug: 'pa.slug',
    headline: 'pa.headline',
    summary: 'pa.summary',
    full_report: 'pa.full_report',
    position: 'pa.position',
    is_update: 'pa.is_update',
    original_pub_date: 'pa.original_pub_date',
    created_at: 'pa.created_at',
    
    // articles fields
    category: 'a.category',
    severity: 'a.severity',
    twitter_post: 'a.twitter_post',
    meta_description: 'a.meta_description',
    article_type: 'a.article_type',
    keywords: 'a.keywords',
    reading_time_minutes: 'a.reading_time_minutes',
    pub_date: 'a.pub_date',
    resolution: 'a.resolution',
    isUpdate: 'a.isUpdate',
    updateCount: 'a.updateCount',
    updates: 'a.updates',
  };
  
  return fields
    .map(field => fieldMap[field] || field)
    .join(', ');
}

/**
 * Build WHERE clause from filters
 */
function buildWhereClause(filters: ArticleFilters): { whereClause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  
  // Date filter (exact match)
  if (filters.date) {
    conditions.push(`DATE(pa.created_at) = ?`);
    params.push(filters.date);
  }
  
  // Date range filter
  if (filters.dateFrom) {
    conditions.push(`DATE(pa.created_at) >= ?`);
    params.push(filters.dateFrom);
  }
  
  if (filters.dateTo) {
    conditions.push(`DATE(pa.created_at) <= ?`);
    params.push(filters.dateTo);
  }
  
  // Category filter (handles JSON array format)
  if (filters.category) {
    conditions.push(`a.category LIKE ?`);
    params.push(`%"${filters.category}"%`);
  }
  
  // Severity filter
  if (filters.severity) {
    conditions.push(`a.severity = ?`);
    params.push(filters.severity);
  }
  
  // Update filter
  if (filters.isUpdate !== undefined) {
    conditions.push(`pa.is_update = ?`);
    params.push(filters.isUpdate ? 1 : 0);
  }
  
  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}`
    : '';
  
  return { whereClause, params };
}

/**
 * Build ORDER BY clause
 */
function buildOrderClause(filters: ArticleFilters): string {
  if (!filters.orderBy) {
    return '';
  }
  
  const direction = filters.orderDirection || 'ASC';
  
  // Map field to table alias
  const fieldMap: Record<string, string> = {
    position: 'pa.position',
    created_at: 'pa.created_at',
    headline: 'pa.headline',
    severity: 'a.severity',
    category: 'a.category',
  };
  
  const orderField = fieldMap[filters.orderBy] || filters.orderBy;
  
  return `ORDER BY ${orderField} ${direction}`;
}

/**
 * Build LIMIT/OFFSET clause
 */
function buildLimitClause(filters: ArticleFilters): string {
  const clauses: string[] = [];
  
  if (filters.limit) {
    clauses.push(`LIMIT ${filters.limit}`);
  }
  
  if (filters.offset) {
    clauses.push(`OFFSET ${filters.offset}`);
  }
  
  return clauses.join(' ');
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get articles for Twitter feed generation (optimized field selection)
 * Returns: slug, headline, summary, full_report (first 2000 chars), category, severity, is_update
 */
export function getArticlesForTwitter(date: string, limit: number = 20): ArticleRecord[] {
  const db = getDB();
  
  const query = `
    SELECT 
      pa.slug,
      pa.headline,
      pa.summary,
      SUBSTR(pa.full_report, 1, 2000) as full_report,
      a.category,
      a.severity,
      pa.is_update
    FROM published_articles pa
    LEFT JOIN articles a ON pa.slug = a.slug
    WHERE DATE(pa.created_at) = ?
    ORDER BY pa.position ASC
    LIMIT ?
  `;
  
  return db.prepare(query).all(date, limit) as ArticleRecord[];
}

/**
 * Get date range of available articles
 */
export function getAvailableDateRange(): { earliest: string; latest: string } | null {
  const db = getDB();
  
  const query = `
    SELECT 
      DATE(MIN(created_at)) as earliest,
      DATE(MAX(created_at)) as latest
    FROM published_articles
  `;
  
  const result = db.prepare(query).get() as { earliest: string; latest: string } | undefined;
  return result || null;
}

/**
 * Export articles to JSON file
 * 
 * @param filters - Filter criteria
 * @param fields - Fields to include
 * @param outputPath - Path to save JSON file
 */
export function exportArticlesToJSON(
  filters: ArticleFilters,
  fields: string[],
  outputPath: string
): void {
  const articles = getArticles(filters, fields);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2));
  console.log(`✅ Exported ${articles.length} articles to: ${outputPath}`);
}

// ============================================================================
// CLI Interface
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
Database Read Interface - CLI

Usage:
  # Get articles by date
  npx tsx scripts/content-generation-v2/database/read-interface.ts --date 2025-10-16

  # Get specific fields
  npx tsx scripts/content-generation-v2/database/read-interface.ts --date 2025-10-16 --fields slug,headline,summary

  # Get articles for Twitter
  npx tsx scripts/content-generation-v2/database/read-interface.ts --twitter --date 2025-10-16 --limit 20

  # Export to JSON
  npx tsx scripts/content-generation-v2/database/read-interface.ts --date 2025-10-16 --export tmp/articles.json

  # Get date range
  npx tsx scripts/content-generation-v2/database/read-interface.ts --date-range

  # Filter by severity
  npx tsx scripts/content-generation-v2/database/read-interface.ts --date 2025-10-16 --severity critical

  # Filter by category
  npx tsx scripts/content-generation-v2/database/read-interface.ts --date 2025-10-16 --category Ransomware
    `);
    process.exit(0);
  }
  
  // Parse arguments
  const date = args[args.indexOf('--date') + 1];
  const fieldsArg = args[args.indexOf('--fields') + 1];
  const fields = fieldsArg ? fieldsArg.split(',') : undefined;
  const limitArg = args.includes('--limit') ? args[args.indexOf('--limit') + 1] : undefined;
  const limit = limitArg ? parseInt(limitArg) : undefined;
  const severity = args.includes('--severity') ? args[args.indexOf('--severity') + 1] : undefined;
  const category = args.includes('--category') ? args[args.indexOf('--category') + 1] : undefined;
  const exportPath = args.includes('--export') ? args[args.indexOf('--export') + 1] : undefined;
  
  // Date range query
  if (args.includes('--date-range')) {
    const range = getAvailableDateRange();
    if (range) {
      console.log(`\n📅 Available date range:`);
      console.log(`   Earliest: ${range.earliest}`);
      console.log(`   Latest: ${range.latest}\n`);
    }
    process.exit(0);
  }
  
  // Twitter-optimized query
  if (args.includes('--twitter')) {
    if (!date) {
      console.error('❌ --twitter requires --date argument');
      process.exit(1);
    }
    
    const articles = getArticlesForTwitter(date, limit || 20);
    
    if (exportPath) {
      exportArticlesToJSON({ date, limit: limit || 20 }, 
        ['slug', 'headline', 'summary', 'full_report', 'category', 'severity', 'is_update'],
        exportPath
      );
    } else {
      console.log(JSON.stringify(articles, null, 2));
    }
    process.exit(0);
  }
  
  // Standard query
  if (date) {
    const filters: ArticleFilters = {
      date,
      limit,
      severity,
      category,
      orderBy: 'position',
      orderDirection: 'ASC'
    };
    
    if (exportPath) {
      exportArticlesToJSON(filters, fields || [], exportPath);
    } else {
      const articles = getArticles(filters, fields);
      console.log(JSON.stringify(articles, null, 2));
    }
  } else {
    console.error('❌ Missing required argument. Use --help for usage information.');
    process.exit(1);
  }
}
