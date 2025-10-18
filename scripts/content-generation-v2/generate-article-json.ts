#!/usr/bin/env node
/**
 * Content Generation V3 - Step 7: Generate Article JSON Files
 * 
 * Generates individual article JSON files for the website from the normalized database.
 * 
 * V3 Changes:
 *   - Reads updates from articles.updates JSON column (not article_updates table)
 *   - Simplified structure (no article_updates table needed)
 * 
 * Input:
 *   - Database: published_articles table
 *   - Enrichment: structured_news JSON blob for full article metadata
 *   - Updates: articles.updates JSON column
 * 
 * Output:
 *   - /public/data/articles/{slug}.json
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/generate-article-json-v3.ts --slug article-slug
 *   npx tsx scripts/content-generation-v2/generate-article-json-v3.ts --date 2025-10-09
 *   npx tsx scripts/content-generation-v2/generate-article-json-v3.ts --all
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = 'logs/content-generation-v2.db';

/**
 * CLI arguments
 */
interface Args {
  slug?: string;        // Generate for specific article slug
  date?: string;        // Generate for articles published on date (publication date)
  pubId?: string;       // Generate for articles in publication (e.g., pub-2025-10-07)
  all?: boolean;        // Generate all articles
  outputDir?: string;   // Output directory (default: public/data/articles)
}

/**
 * Published article from database
 */
interface PublishedArticle {
  id: string;
  publication_id: string;
  slug: string;
  headline: string;
  summary: string;
  full_report: string;
  position: number;
  is_update: number;
  original_pub_date: string;
}

/**
 * Update object from articles.updates JSON column
 */
interface ArticleUpdateFromJSON {
  update_date: string;
  summary: string;
  sources?: Array<{
    url: string;
    title: string;
  }>;
}

/**
 * Complete article structure from structured_news
 */
interface StructuredArticle {
  id: string;
  slug: string;
  headline: string;
  title: string;
  summary: string;
  full_report: string;
  twitter_post?: string;
  meta_description?: string;
  category: string[];
  severity: string;
  entities?: Array<{
    name: string;
    type: string;
  }>;
  cves?: Array<string | {
    id: string;
    cvss_score?: number;
    description?: string;
  }>;
  sources?: Array<{
    url: string;
    title: string;
  }>;
  events?: Array<{
    datetime: string;
    summary: string;
  }>;
  mitre_techniques?: Array<{
    id: string;
    name: string;
    tactic: string;
  }>;
  mitre_mitigations?: Array<{
    id: string;
    name: string;
    domain?: string;
    description?: string;
    d3fend_techniques?: Array<{
      id: string;
      name: string;
      url: string;
    }>;
  }>;
  d3fend_countermeasures?: Array<{
    technique_id: string;
    technique_name: string;
    url: string;
    recommendation: string;
    mitre_mitigation_id?: string;
  }>;
  iocs?: Array<{
    type: string;
    value: string;
    description?: string;
    source?: string;
  }>;
  cyber_observables?: Array<{
    type: string;
    value: string;
    description: string;
    context: string;
    confidence: string;
  }>;
  tags: string[];
  extract_datetime: string;
  article_type?: string;
  impact_scope?: {
    countries_affected?: string[];
    industries_affected?: string[];
    organizations_affected?: string[];
  };
  keywords?: string[];
  pub_date?: string;
  reading_time_minutes?: number;
}

/**
 * Article JSON output structure
 */
interface ArticleOutput extends StructuredArticle {
  createdAt: string;
  updatedAt?: string;
  updates?: Array<{
    update_id: string;
    update_date: string;
    title: string;
    summary: string;
    sources?: Array<{
      url: string;
      title: string;
    }>;
  }>;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): Args {
  const args: Args = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--slug' && i + 1 < process.argv.length) {
      args.slug = process.argv[++i];
    } else if (arg === '--date' && i + 1 < process.argv.length) {
      args.date = process.argv[++i];
    } else if (arg === '--pub-id' && i + 1 < process.argv.length) {
      args.pubId = process.argv[++i];
    } else if (arg === '--all') {
      args.all = true;
    } else if (arg === '--output-dir' && i + 1 < process.argv.length) {
      args.outputDir = process.argv[++i];
    }
  }
  
  // Validate: must have one of slug, date, pubId, or all
  if (!args.slug && !args.date && !args.pubId && !args.all) {
    console.error('❌ Error: Must specify --slug, --date, --pub-id, or --all');
    console.error('Usage:');
    console.error('  --slug <slug>       Generate for specific article');
    console.error('  --date <date>       Generate for publication date (YYYY-MM-DD)');
    console.error('  --pub-id <id>       Generate for publication ID (e.g., pub-2025-10-07)');
    console.error('  --all               Generate all articles');
    process.exit(1);
  }
  
  return args;
}

/**
 * Get published articles by criteria
 */
function getPublishedArticles(db: Database.Database, args: Args): PublishedArticle[] {
  let stmt;
  
  if (args.slug) {
    stmt = db.prepare(`
      SELECT * FROM published_articles
      WHERE slug = ?
    `);
    return stmt.all(args.slug) as PublishedArticle[];
  } else if (args.pubId) {
    stmt = db.prepare(`
      SELECT * FROM published_articles
      WHERE publication_id = ?
      ORDER BY position
    `);
    return stmt.all(args.pubId) as PublishedArticle[];
  } else if (args.date) {
    // Query by publication date (from publications table)
    stmt = db.prepare(`
      SELECT pa.* FROM published_articles pa
      JOIN publications p ON pa.publication_id = p.id
      WHERE p.pub_date = ?
      ORDER BY pa.position
    `);
    return stmt.all(args.date) as PublishedArticle[];
  } else {
    stmt = db.prepare(`
      SELECT * FROM published_articles
      ORDER BY position
    `);
    return stmt.all() as PublishedArticle[];
  }
}

/**
 * Get updates for an article from articles.updates JSON column
 */
function getArticleUpdates(db: Database.Database, articleId: string): ArticleUpdateFromJSON[] {
  const stmt = db.prepare(`
    SELECT updates FROM articles
    WHERE id = ?
  `);
  
  const result = stmt.get(articleId) as { updates: string | null } | undefined;
  
  if (!result || !result.updates) {
    return [];
  }
  
  try {
    const updates = JSON.parse(result.updates);
    return Array.isArray(updates) ? updates : [];
  } catch (error) {
    console.error(`     ⚠️  Failed to parse updates JSON for article ${articleId}`);
    return [];
  }
}

/**
 * Find article in structured_news by ID
 */
function findArticleInStructuredNews(db: Database.Database, articleId: string): StructuredArticle | null {
  // Search in all structured_news entries (ordered by date desc)
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
      // Skip invalid JSON
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
 * Format article updates for output
 */
function formatArticleUpdates(updates: ArticleUpdateFromJSON[]): Array<{
  update_id: string;
  update_date: string;
  title: string;
  summary: string;
  sources?: Array<{
    url: string;
    title: string;
  }>;
}> {
  return updates.map((update, index) => ({
    update_id: `update-${index + 1}`,
    update_date: update.update_date,
    title: `Update ${index + 1}`,
    summary: update.summary,
    sources: update.sources
  }));
}

/**
 * Generate article JSON file
 */
async function generateArticleJson(
  db: Database.Database,
  article: PublishedArticle,
  outputDir: string
): Promise<void> {
  console.log(`\n📝 Generating article JSON: ${article.slug}`);
  console.log(`   Article ID: ${article.id}`);
  console.log(`   Original Date: ${article.original_pub_date}`);
  
  // Get full article data from structured_news
  const structuredArticle = findArticleInStructuredNews(db, article.id);
  
  if (!structuredArticle) {
    console.log(`   ⚠️  No structured data found, using database only`);
  } else {
    console.log(`   ✅ Found structured data`);
  }
  
  // Get updates from articles.updates JSON column
  const updates = getArticleUpdates(db, article.id);
  
  // Extract date portion from pub_date (YYYY-MM-DD)
  const pubDate = article.original_pub_date.split('T')[0];
  
  // createdAt: Always use 9am CST (15:00 UTC) for consistency
  const createdAt = `${pubDate}T15:00:00.000Z`;
  
  // updatedAt: Use latest update datetime if exists, otherwise match createdAt
  // Note: Updates are appended, so the LAST element is the most recent
  const lastUpdate = updates.length > 0 ? updates[updates.length - 1] : null;
  const latestUpdateDate = lastUpdate?.update_date || createdAt;
  
  // Build output (merge structured data with published data)
  const output: ArticleOutput = {
    id: article.id,
    slug: article.slug,
    headline: structuredArticle?.headline || article.headline,
    title: structuredArticle?.title || article.headline,
    summary: structuredArticle?.summary || article.summary,
    full_report: structuredArticle?.full_report || article.full_report,
    twitter_post: structuredArticle?.twitter_post,
    meta_description: structuredArticle?.meta_description,
    category: structuredArticle?.category || [],
    severity: structuredArticle?.severity || 'medium',
    entities: structuredArticle?.entities,
    cves: structuredArticle?.cves,
    sources: structuredArticle?.sources,
    events: structuredArticle?.events,
    mitre_techniques: structuredArticle?.mitre_techniques,
    mitre_mitigations: structuredArticle?.mitre_mitigations,
    d3fend_countermeasures: structuredArticle?.d3fend_countermeasures,
    iocs: structuredArticle?.iocs,
    cyber_observables: structuredArticle?.cyber_observables,
    tags: structuredArticle?.tags || [],
    extract_datetime: structuredArticle?.extract_datetime || createdAt,  // Use createdAt fallback
    article_type: structuredArticle?.article_type,
    impact_scope: structuredArticle?.impact_scope,
    keywords: structuredArticle?.keywords,
    pub_date: article.original_pub_date,
    reading_time_minutes: structuredArticle?.reading_time_minutes || calculateReadingTime(article.full_report),
    createdAt: createdAt,
    updatedAt: latestUpdateDate,
    updates: updates.length > 0 ? formatArticleUpdates(updates) : undefined
  };
  
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON file
  const outputPath = join(outputDir, `${article.slug}.json`);
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`   ✅ Written to: ${outputPath}`);
  if (updates.length > 0) {
    console.log(`   📊 Updates: ${updates.length}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();
  const outputDir = args.outputDir || join(process.cwd(), 'public/data/articles');
  
  console.log('='.repeat(60));
  console.log('Step 7: Generate Article JSON Files (V3)');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}\n`);
  
  // Open database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  
  try {
    console.log('✅ Database initialized:', DB_PATH);
    
    // Get articles to process
    const articles = getPublishedArticles(db, args);
    
    console.log(`Found ${articles.length} article(s) to generate\n`);
    
    if (articles.length === 0) {
      console.log('⚠️  No articles found matching criteria');
      return;
    }
    
    // Generate JSON for each article
    let successCount = 0;
    let errorCount = 0;
    
    for (const article of articles) {
      try {
        await generateArticleJson(db, article, outputDir);
        successCount++;
      } catch (error: any) {
        console.error(`❌ Error generating ${article.slug}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Step 7 Complete!');
    console.log('='.repeat(60));
    console.log(`Generated: ${successCount} article JSON file(s)`);
    if (errorCount > 0) {
      console.log(`Errors: ${errorCount} article(s)`);
    }
    console.log(`Output: ${outputDir}`);
    
  } finally {
    db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

// Export functions for use in other scripts
export {
  getPublishedArticles,
  getArticleUpdates,
  findArticleInStructuredNews,
  generateArticleJson
};
