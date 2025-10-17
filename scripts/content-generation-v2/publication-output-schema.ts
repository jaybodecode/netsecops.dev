/**
 * Content Generation V2 - Publication Output Schema
 * 
 * TypeScript interfaces for generated publication JSON files.
 * These match the structure expected by the website frontend.
 * 
 * Based on:
 * - news-structured-schema.ts (LLM generation schema)
 * - types/cyber.ts (website schema)
 * 
 * Key differences from LLM schema:
 * - Added slug field for publications
 * - Added type field (daily/weekly/monthly)
 * - Added meta field for generation statistics
 * - Compatible with existing website code
 */

import type {
  SourceType,
  EventType,
  MITRETechniqueType,
  ImpactScopeType,
  CVEType,
  EntityType,
  ArticleType,
  CyberAdvisoryType
} from './news-structured-schema.js';

// Re-export LLM types for convenience
export type {
  SourceType,
  EventType,
  MITRETechniqueType,
  ImpactScopeType,
  CVEType,
  EntityType,
  ArticleType,
  CyberAdvisoryType
};

/**
 * Publication type indicator
 */
export type PublicationType = 'daily' | 'weekly' | 'monthly' | 'special-report';

/**
 * Article update entry
 * Tracks updates made to existing articles
 */
export interface ArticleUpdate {
  update_id: string;                 // Unique ID for this update
  update_date: string;               // ISO 8601 timestamp
  title: string;                     // Update headline
  summary: string;                   // What changed/was added
  events?: EventType[];              // Timeline events for this update
  sources: SourceType[];             // Sources for this update
  new_entities?: EntityType[];       // New entities in this update
  new_cves?: (string | CVEType)[];   // New CVEs in this update
  severity_change?: 'increased' | 'decreased' | 'unchanged';
  update_type?: 'patch' | 'advisory' | 'incident' | 'analysis' | 'threat_intel' | 'other';
}

/**
 * Article as it appears in generated publication files
 * Extended from ArticleType with update tracking
 */
export interface PublicationArticle extends ArticleType {
  /**
   * Update history for this article
   * Populated when article appears in multiple publications
   */
  updates?: ArticleUpdate[];
  
  /**
   * Whether this article is an update to an existing article
   * Set to true when the article appears in a later publication
   */
  is_update?: boolean;
  
  /**
   * Original publication date (YYYY-MM-DD)
   * Used for articles that appear in multiple publications
   */
  original_pub_date?: string;
}

/**
 * Generation metadata for tracking pipeline execution
 */
export interface PublicationGenerationMeta {
  total_articles: number;            // Total articles in candidate
  new_articles: number;              // Articles marked as NEW
  updated_articles: number;          // Articles marked as UPDATE
  skipped_articles: number;          // Articles marked as SKIP
  generated_at: string;              // ISO 8601 timestamp of generation
  pipeline_version?: string;         // Pipeline version (e.g., 'v2.0')
  llm_model?: string;                // Model used for generation
}

/**
 * Generated publication JSON file structure
 * This is what gets written to /public/data/publications/{slug}.json
 * 
 * Based on CyberAdvisoryType but with additional fields for:
 * - Deterministic slug
 * - Publication type
 * - Generation metadata
 * - Article updates
 */
export interface GeneratedPublication {
  // Core Identity
  pub_id: string;                    // UUID v4 identifier
  slug: string;                      // Deterministic: {type}_threat_publications_{date}
  
  // Headlines & Content
  headline: string;                  // Breaking news headline
  title?: string;                    // Alias for headline (website compatibility)
  summary: string;                   // Overall cybersecurity situation summary
  excerpt?: string;                  // Alias for summary (website compatibility)
  
  // Publication Metadata
  pub_date: string;                  // Publication date (YYYY-MM-DD)
  type: PublicationType;             // daily | weekly | monthly | special-report
  
  // Article Data
  total_articles: number;            // Number of articles in this publication
  articles: PublicationArticle[];    // Array of articles with update tracking
  
  // Generation Metadata
  generated_at: string;              // ISO 8601 timestamp
  date_range: string;                // Date range covered (e.g., '2025-10-09')
  
  // Pipeline Metadata (optional)
  meta?: PublicationGenerationMeta;  // Generation statistics and tracking
  
  // Website Compatibility Fields (optional)
  publishedAt?: string;              // Alias for pub_date (ISO 8601)
  categories?: string[];             // Publication-level categories
  tags?: string[];                   // Publication-level tags
  
  // SEO Fields (optional - can be added in Step 7)
  meta_description?: string;         // SEO meta description
  og_title?: string;                 // Open Graph title
  og_description?: string;           // Open Graph description
  og_image?: string;                 // Open Graph image URL
  keywords?: string[];               // SEO keywords
  
  // Statistics (optional - can be computed in Step 7)
  severityBreakdown?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  
  statusCounts?: {
    new: number;
    updated: number;
  };
}

/**
 * Publication metadata for index files
 * Lightweight version for listings (e.g., publications-index.json)
 */
export interface PublicationIndexEntry {
  id: string;                        // pub_id
  slug: string;                      // Deterministic slug
  title: string;                     // headline
  headline?: string;                 // Alias
  summary: string;                   // Summary/excerpt
  excerpt?: string;                  // Alias
  publishedAt: string;               // pub_date (ISO 8601)
  pub_date?: string;                 // Alias
  type: PublicationType;             // Publication type
  articleCount: number;              // total_articles
  categories?: string[];             // Categories
  tags?: string[];                   // Tags
  readingTime?: number;              // Estimated reading time
  severityBreakdown?: {              // Severity counts
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  statusCounts?: {                   // Status counts
    new: number;
    updated: number;
  };
}

/**
 * Publications index file structure
 * Written to /public/data/publications/index.json
 */
export interface PublicationsIndex {
  total: number;                     // Total number of publications
  publications: PublicationIndexEntry[];
  lastUpdated?: string;              // ISO 8601 timestamp
}

/**
 * Article metadata for article index files
 * Lightweight version for listings (e.g., articles-index.json)
 */
export interface ArticleIndexEntry {
  id: string;                        // article_id
  slug: string;                      // Article slug
  headline: string;                  // Article headline
  title?: string;                    // Alias
  summary: string;                   // Article summary
  excerpt?: string;                  // Alias
  published: string;                 // Original publication date (YYYY-MM-DD)
  publishedAt?: string;              // Alias (ISO 8601)
  lastUpdated?: string;              // Last update date if any
  category: string[];                // Categories
  severity?: string;                 // Severity level
  tags?: string[];                   // Tags
  cveCount?: number;                 // Number of CVEs
  updateCount?: number;              // Number of updates
  readingTime?: number;              // Estimated reading time
}

/**
 * Articles index file structure
 * Written to /public/data/articles/index.json
 */
export interface ArticlesIndex {
  total: number;                     // Total number of articles
  articles: ArticleIndexEntry[];
  lastUpdated?: string;              // ISO 8601 timestamp
}

/**
 * Helper function to create deterministic publication slug
 */
export function createPublicationSlug(date: string, type: PublicationType = 'daily'): string {
  return `${type}-threat-publications-${date}`;
}

/**
 * Helper function to convert CyberAdvisoryType to GeneratedPublication
 */
export function toGeneratedPublication(
  advisory: CyberAdvisoryType,
  pubDate: string,
  pubType: PublicationType,
  meta?: PublicationGenerationMeta
): GeneratedPublication {
  return {
    pub_id: advisory.pub_id,
    slug: createPublicationSlug(pubDate, pubType),
    headline: advisory.headline,
    title: advisory.headline,
    summary: advisory.summary,
    excerpt: advisory.summary,
    pub_date: pubDate,
    type: pubType,
    total_articles: advisory.total_articles,
    articles: advisory.articles as PublicationArticle[],
    generated_at: advisory.generated_at,
    date_range: advisory.date_range,
    publishedAt: pubDate,
    meta
  };
}

/**
 * Helper function to create PublicationIndexEntry from GeneratedPublication
 */
export function toPublicationIndexEntry(pub: GeneratedPublication): PublicationIndexEntry {
  return {
    id: pub.pub_id,
    slug: pub.slug,
    title: pub.headline,
    headline: pub.headline,
    summary: pub.summary,
    excerpt: pub.summary,
    publishedAt: pub.pub_date,
    pub_date: pub.pub_date,
    type: pub.type,
    articleCount: pub.total_articles,
    categories: pub.categories,
    tags: pub.tags,
    severityBreakdown: pub.severityBreakdown,
    statusCounts: pub.statusCounts
  };
}

/**
 * Helper function to create ArticleIndexEntry from PublicationArticle
 */
export function toArticleIndexEntry(article: PublicationArticle): ArticleIndexEntry {
  const lastUpdate = article.updates && article.updates.length > 0
    ? article.updates[article.updates.length - 1]
    : undefined;
  
  const pubDate = article.pub_date || article.extract_datetime.split('T')[0] || '';
  
  return {
    id: article.id,
    slug: article.slug,
    headline: article.headline,
    title: article.title,
    summary: article.summary,
    excerpt: article.summary,
    published: pubDate,
    publishedAt: article.pub_date || article.extract_datetime,
    lastUpdated: lastUpdate?.update_date,
    category: article.category,
    severity: article.severity,
    tags: article.tags,
    cveCount: article.cves?.length || 0,
    updateCount: article.updates?.length || 0,
    readingTime: article.reading_time_minutes
  };
}
