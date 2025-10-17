#!/usr/bin/env node
/**
 * Content Generation V2 - Step 8: Generate Index Files
 * 
 * Generates index files for publications and articles.
 * These provide quick metadata for listings without loading full JSON files.
 * 
 * Input:
 *   - Database: publications, published_articles, publication_articles
 *   - Enrichment: structured_news JSON blob for metadata
 * 
 * Output:
 *   - /public/data/publications-index.json
 *   - /public/data/articles-index.json
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/generate-indexes.ts
 *   npx tsx scripts/content-generation-v2/generate-indexes.ts --publications-only
 *   npx tsx scripts/content-generation-v2/generate-indexes.ts --articles-only
 */

import { getDB } from './database/index.js';
import type { Publication } from './database/schema-publications.js';
import type { PublishedArticle } from './database/schema-published-articles.js';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * CLI arguments
 */
interface Args {
  publicationsOnly?: boolean;
  articlesOnly?: boolean;
  outputDir?: string;
}

/**
 * Publication index entry
 */
interface PublicationIndexEntry {
  id: string;
  slug: string;
  title: string;
  type: string;
  publishedAt: string;
  pub_date?: string; // Optional pub_date field for consistency with source data
  articleCount: number;
  summary: string;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  statusCounts: {
    new: number;
    updated: number;
  };
  categories: string[];
}

/**
 * Article index entry
 */
interface ArticleIndexEntry {
  id: string;
  slug: string;
  headline: string;
  title: string;
  severity: string;
  article_type?: string;           // NewsArticle | TechArticle | Report | Analysis | Advisory
  excerpt: string;
  tags: string[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
  readingTime: number;
}

/**
 * Article metadata from structured_news
 */
interface StructuredArticleMeta {
  id: string;
  slug: string;
  headline: string;
  title: string;
  summary: string;
  severity: string;
  article_type?: string;          // NewsArticle | TechArticle | Report | Analysis | Advisory
  category: string[];
  tags: string[];
  reading_time_minutes?: number;
  full_report: string;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): Args {
  const args: Args = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--publications-only') {
      args.publicationsOnly = true;
    } else if (arg === '--articles-only') {
      args.articlesOnly = true;
    } else if (arg === '--output' && i + 1 < process.argv.length) {
      args.outputDir = process.argv[++i];
    }
  }
  
  return args;
}

/**
 * Get all publications ordered by date descending
 */
function getAllPublications(): Publication[] {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM publications
    ORDER BY pub_date DESC
  `);
  
  return stmt.all() as Publication[];
}

/**
 * Get all published articles ordered by date descending
 */
function getAllArticles(): PublishedArticle[] {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM published_articles
    ORDER BY original_pub_date DESC
  `);
  
  return stmt.all() as PublishedArticle[];
}

/**
 * Get article metadata with is_primary flag for a publication
 */
function getPublicationArticlesWithMeta(publicationId: string): Array<{
  article_id: string;
  severity: string;
  is_primary: number;
  categories: string[];
}> {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT 
      pa.id as article_id,
      pap.is_primary
    FROM published_articles pa
    JOIN publication_articles pap ON pa.id = pap.article_id
    WHERE pap.publication_id = ?
    ORDER BY pap.position
  `);
  
  const articles = stmt.all(publicationId) as Array<{
    article_id: string;
    is_primary: number;
  }>;
  
  // Enrich with metadata from structured_news
  return articles.map(article => {
    const meta = findArticleMetaInStructuredNews(article.article_id);
    return {
      article_id: article.article_id,
      severity: meta?.severity || 'informational',
      is_primary: article.is_primary,
      categories: meta?.category || []
    };
  });
}

/**
 * Find article metadata in structured_news
 */
function findArticleMetaInStructuredNews(articleId: string): StructuredArticleMeta | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT pub_date, data FROM structured_news
    ORDER BY pub_date DESC
  `);
  
  const results = stmt.all() as Array<{ pub_date: string; data: string }>;
  
  for (const result of results) {
    try {
      const data = JSON.parse(result.data);
      const article = data.articles?.find((a: any) => a.id === articleId);
      if (article) {
        return article;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Calculate reading time from text
 */
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Get last update date for an article (V3: from articles.updates JSON column)
 */
function getLastUpdateDate(articleId: string): string | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT updates FROM articles
    WHERE id = ?
  `);
  
  const result = stmt.get(articleId) as { updates: string | null } | undefined;
  
  if (!result || !result.updates) {
    return null;
  }
  
  try {
    const updates = JSON.parse(result.updates);
    if (Array.isArray(updates) && updates.length > 0) {
      // Return most recent update date (LAST in array, since updates are appended)
      return updates[updates.length - 1].update_date || null;
    }
  } catch (error) {
    // Invalid JSON, return null
  }
  
  return null;
}

/**
 * Generate publications index
 */
async function generatePublicationsIndex(outputDir: string): Promise<void> {
  console.log('\n📋 Generating publications index...');
  
  const publications = getAllPublications();
  console.log(`   Found ${publications.length} publications`);
  
  const entries: PublicationIndexEntry[] = [];
  
  for (const pub of publications) {
    // Get articles with metadata
    const articles = getPublicationArticlesWithMeta(pub.id);
    
    // Calculate severity breakdown
    const severityBreakdown = {
      critical: articles.filter(a => a.severity === 'critical').length,
      high: articles.filter(a => a.severity === 'high').length,
      medium: articles.filter(a => a.severity === 'medium').length,
      low: articles.filter(a => a.severity === 'low').length,
      informational: articles.filter(a => a.severity === 'informational').length
    };
    
    // Calculate status counts
    const statusCounts = {
      new: articles.filter(a => a.is_primary === 1).length,
      updated: articles.filter(a => a.is_primary === 0).length
    };
    
    // Get unique categories
    const categories = Array.from(
      new Set(articles.flatMap(a => a.categories))
    ).sort();
    
    entries.push({
      id: pub.id,
      slug: pub.slug || `unknown-${pub.id}`,
      title: pub.headline,
      type: 'daily', // Can be extracted from slug if needed
      publishedAt: pub.pub_date,
      pub_date: pub.pub_date, // Include pub_date field for consistency
      articleCount: pub.article_count,
      summary: pub.summary,
      severityBreakdown,
      statusCounts,
      categories
    });
  }
  
  // Write index file
  const output = {
    publications: entries
  };
  
  const outputPath = join(outputDir, 'publications-index.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`   ✅ Written to: ${outputPath}`);
  console.log(`   📊 Total publications: ${entries.length}`);
}

/**
 * Generate articles index
 */
async function generateArticlesIndex(outputDir: string): Promise<void> {
  console.log('\n📋 Generating articles index...');
  
  const articles = getAllArticles();
  console.log(`   Found ${articles.length} articles`);
  
  const entries: ArticleIndexEntry[] = [];
  
  for (const article of articles) {
    // Get full metadata from structured_news
    const meta = findArticleMetaInStructuredNews(article.id);
    
    if (!meta) {
      console.log(`   ⚠️  No metadata for ${article.slug}, skipping...`);
      continue;
    }
    
    // Get last update date
    const lastUpdate = getLastUpdateDate(article.id);
    
    // Calculate reading time
    const readingTime = meta.reading_time_minutes || 
                        calculateReadingTime(meta.full_report);
    
    // Format dates - always use 9am CST (15:00 UTC) for consistency
    const pubDate = article.original_pub_date.split('T')[0];
    const createdAt = `${pubDate}T15:00:00.000Z`;
    const updatedAt = lastUpdate || createdAt;  // Use update datetime or match createdAt
    
    entries.push({
      id: article.id,
      slug: article.slug,
      headline: meta.headline,
      title: meta.title,
      severity: meta.severity,
      article_type: meta.article_type || 'Unknown',  // Include article_type with fallback
      excerpt: meta.summary,
      tags: meta.tags,
      categories: meta.category,
      createdAt,
      updatedAt,
      readingTime
    });
  }
  
  // Write index file
  const output = {
    articles: entries
  };
  
  const outputPath = join(outputDir, 'articles-index.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`   ✅ Written to: ${outputPath}`);
  console.log(`   📊 Total articles: ${entries.length}`);
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();
  const outputDir = args.outputDir || join(process.cwd(), 'public/data');
  
  console.log('='.repeat(60));
  console.log('Step 8: Generate Index Files');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}\n`);
  
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate indexes based on args
  if (args.articlesOnly) {
    await generateArticlesIndex(outputDir);
  } else if (args.publicationsOnly) {
    await generatePublicationsIndex(outputDir);
  } else {
    // Generate both by default
    await generatePublicationsIndex(outputDir);
    await generateArticlesIndex(outputDir);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Step 8 Complete!');
  console.log('='.repeat(60));
  console.log(`Index files written to: ${outputDir}/`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
