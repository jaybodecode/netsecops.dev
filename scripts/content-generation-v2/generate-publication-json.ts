#!/usr/bin/env node
/**
 * Content Generation V2 - Step 7A: Generate Publication JSON Files
 * 
 * Generates publication JSON files for the website from the normalized database.
 * 
 * Input:
 *   - Database: publications, published_articles, publication_articles
 *   - Enrichment: structured_news JSON blob for full article metadata
 * 
 * Output:
 *   - /public/data/publications/{slug}.json
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/generate-publication-json.ts --date 2025-10-09
 *   npx tsx scripts/content-generation-v2/generate-publication-json.ts --pub-id pub-2025-10-09
 *   npx tsx scripts/content-generation-v2/generate-publication-json.ts --all
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
  date?: string;        // Generate for specific date (YYYY-MM-DD)
  pubId?: string;       // Generate for specific publication ID
  all?: boolean;        // Generate all publications
  outputDir?: string;   // Output directory (default: public/data/publications)
}

/**
 * Article as stored in structured_news JSON
 */
interface StructuredArticle {
  id: string;
  slug: string;
  headline: string;
  title: string;
  summary: string;
  full_report: string;
  severity: string;
  category: string[];
  tags: string[];
  cves?: (string | { id: string; cvss_score?: number })[];
  entities?: any[];
  sources?: any[];
  events?: any[];
  mitre_techniques?: any[];
  impact_scope?: any;
  keywords?: string[];
  twitter_post?: string;
  meta_description?: string;
  extract_datetime: string;
  article_type?: string;
  reading_time_minutes?: number;
  pub_date?: string;
}

/**
 * Article for publication JSON output
 */
interface PublicationArticleOutput {
  id: string;
  slug: string;
  headline: string;
  title: string;
  severity: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  createdAt: string;
  readingTime: number;
  cves?: string[];
  cvssScore?: number;
  isUpdate: boolean;
}

/**
 * Publication JSON output structure
 */
interface PublicationOutput {
  pub_id: string;
  headline: string;
  summary: string;
  pub_date: string;
  total_articles: number;
  articles: PublicationArticleOutput[];
}

/**
 * Parse CLI arguments
 */
function parseArgs(): Args {
  const args: Args = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--date' && i + 1 < process.argv.length) {
      args.date = process.argv[++i];
    } else if (arg === '--pub-id' && i + 1 < process.argv.length) {
      args.pubId = process.argv[++i];
    } else if (arg === '--all') {
      args.all = true;
    } else if (arg === '--output' && i + 1 < process.argv.length) {
      args.outputDir = process.argv[++i];
    }
  }
  
  return args;
}

/**
 * Get publication by date
 */
function getPublicationByDate(date: string): Publication | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM publications
    WHERE pub_date = ?
  `);
  
  return stmt.get(date) as Publication | null;
}

/**
 * Get publication by ID
 */
function getPublicationById(id: string): Publication | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT * FROM publications
    WHERE id = ?
  `);
  
  return stmt.get(id) as Publication | null;
}

/**
 * Get all publications
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
 * Get articles for a publication
 */
function getPublicationArticles(publicationId: string): Array<PublishedArticle & { is_primary: number }> {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT 
      pa.*,
      pap.is_primary
    FROM published_articles pa
    JOIN publication_articles pap ON pa.id = pap.article_id
    WHERE pap.publication_id = ?
    ORDER BY pap.position
  `);
  
  return stmt.all(publicationId) as Array<PublishedArticle & { is_primary: number }>;
}

/**
 * Get full article data from structured_news JSON
 */
function getArticleFromStructuredNews(articleId: string, pubDate: string): StructuredArticle | null {
  const db = getDB();
  
  // Try to find the article in structured_news for the given date
  // Use DATE() to normalize both ISO datetime and simple date formats
  const stmt = db.prepare(`
    SELECT data FROM structured_news
    WHERE DATE(pub_date) = DATE(?)
  `);
  
  const result = stmt.get(pubDate) as { data: string } | undefined;
  
  if (!result) {
    return null;
  }
  
  try {
    const data = JSON.parse(result.data);
    const article = data.articles?.find((a: any) => a.id === articleId);
    return article || null;
  } catch (error) {
    console.error(`Error parsing structured_news data: ${error}`);
    return null;
  }
}

/**
 * Check if structured_news exists for a given date
 */
function hasStructuredNewsForDate(pubDate: string): boolean {
  const db = getDB();
  
  // Use DATE() to normalize both ISO datetime and simple date formats
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM structured_news
    WHERE DATE(pub_date) = DATE(?)
  `);
  
  const result = stmt.get(pubDate) as { count: number };
  return result.count > 0;
}

/**
 * Search for article in structured_news across multiple dates
 */
function findArticleInStructuredNews(articleId: string): StructuredArticle | null {
  const db = getDB();
  
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
 * Get highest CVSS score from CVE array
 */
function getHighestCvssScore(cves?: (string | { id: string; cvss_score?: number })[]): number | undefined {
  if (!cves || cves.length === 0) return undefined;
  
  let maxScore = 0;
  
  for (const cve of cves) {
    if (typeof cve === 'object' && cve.cvss_score) {
      maxScore = Math.max(maxScore, cve.cvss_score);
    }
  }
  
  return maxScore > 0 ? maxScore : undefined;
}

/**
 * Extract CVE IDs from CVE array
 */
function extractCveIds(cves?: (string | { id: string; cvss_score?: number })[]): string[] {
  if (!cves || cves.length === 0) return [];
  
  return cves.map(cve => typeof cve === 'string' ? cve : cve.id);
}

/**
 * Merge database article with structured_news metadata
 */
function mergeArticleData(
  dbArticle: PublishedArticle & { is_primary: number },
  structuredArticle: StructuredArticle | null
): PublicationArticleOutput {
  // Use structured data if available, fallback to database
  const title = structuredArticle?.title || dbArticle.headline;
  const severity = structuredArticle?.severity || 'informational';
  const tags = structuredArticle?.tags || [];
  const categories = structuredArticle?.category || [];
  const cves = structuredArticle ? extractCveIds(structuredArticle.cves) : [];
  const cvssScore = structuredArticle ? getHighestCvssScore(structuredArticle.cves) : undefined;
  
  // Calculate reading time
  const readingTime = structuredArticle?.reading_time_minutes || 
                      calculateReadingTime(dbArticle.full_report);
  
  // Format createdAt as ISO timestamp at 9am CST (15:00 UTC)
  const pubDate = dbArticle.original_pub_date.split('T')[0]; // Get YYYY-MM-DD
  const createdAt = `${pubDate}T15:00:00.000Z`; // 9am CST = 15:00 UTC
  
  return {
    id: dbArticle.id,
    slug: dbArticle.slug,
    headline: dbArticle.headline,
    title: title,
    severity: severity,
    excerpt: dbArticle.summary,
    tags: tags,
    categories: categories,
    createdAt: createdAt,
    readingTime: readingTime,
    cves: cves.length > 0 ? cves : undefined,
    cvssScore: cvssScore,
    isUpdate: dbArticle.is_primary === 0  // is_primary=0 means this is an update publication
  };
}

/**
 * Generate publication JSON file
 */
async function generatePublicationJson(
  publication: Publication,
  outputDir: string
): Promise<void> {
  console.log(`\n📝 Generating publication JSON: ${publication.slug}`);
  console.log(`   Publication ID: ${publication.id}`);
  console.log(`   Date: ${publication.pub_date}`);
  
  // Get articles for this publication
  const dbArticles = getPublicationArticles(publication.id);
  console.log(`   Articles: ${dbArticles.length}`);
  
  // Merge article data with structured_news metadata
  const articles: PublicationArticleOutput[] = [];
  
  for (const dbArticle of dbArticles) {
    console.log(`   - Processing article: ${dbArticle.slug}`);
    
    // First try to find article in structured_news for this publication date
    let structuredArticle = getArticleFromStructuredNews(dbArticle.id, publication.pub_date);
    
    // If not found (e.g., for UPDATE articles), search all dates
    if (!structuredArticle) {
      // Check if structured_news exists for this date
      const hasStructuredNews = hasStructuredNewsForDate(publication.pub_date);
      
      if (!hasStructuredNews) {
        console.log(`     ℹ️  No structured_news for ${publication.pub_date}, searching other dates...`);
      } else {
        console.log(`     ⚠️  Article not found in structured_news for ${publication.pub_date}, searching other dates...`);
      }
      
      structuredArticle = findArticleInStructuredNews(dbArticle.id);
    }
    
    if (!structuredArticle) {
      console.log(`     ⚠️  No structured data found, using database only`);
    }
    
    const article = mergeArticleData(dbArticle, structuredArticle);
    articles.push(article);
  }
  
  // Create publication output
  const output: PublicationOutput = {
    pub_id: publication.id,
    headline: publication.headline,
    summary: publication.summary,
    pub_date: publication.pub_date,
    total_articles: publication.article_count,
    articles: articles
  };
  
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON file
  const outputPath = join(outputDir, `${publication.slug}.json`);
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`   ✅ Written to: ${outputPath}`);
  console.log(`   📊 Total articles: ${articles.length}`);
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();
  const outputDir = args.outputDir || join(process.cwd(), 'public/data/publications');
  
  console.log('='.repeat(60));
  console.log('Step 7A: Generate Publication JSON Files');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}\n`);
  
  let publications: Publication[] = [];
  
  // Determine which publications to generate
  if (args.pubId) {
    const pub = getPublicationById(args.pubId);
    if (!pub) {
      console.error(`❌ Publication not found: ${args.pubId}`);
      process.exit(1);
    }
    publications = [pub];
  } else if (args.date) {
    const pub = getPublicationByDate(args.date);
    if (!pub) {
      console.error(`❌ Publication not found for date: ${args.date}`);
      process.exit(1);
    }
    publications = [pub];
  } else if (args.all) {
    publications = getAllPublications();
    if (publications.length === 0) {
      console.error('❌ No publications found in database');
      process.exit(1);
    }
  } else {
    console.error('Usage:');
    console.error('  npx tsx generate-publication-json.ts --date 2025-10-09');
    console.error('  npx tsx generate-publication-json.ts --pub-id pub-2025-10-09');
    console.error('  npx tsx generate-publication-json.ts --all');
    process.exit(1);
  }
  
  console.log(`Found ${publications.length} publication(s) to generate\n`);
  
  // Generate JSON for each publication
  for (const pub of publications) {
    try {
      await generatePublicationJson(pub, outputDir);
    } catch (error) {
      console.error(`❌ Error generating ${pub.slug}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Step 7A Complete!');
  console.log('='.repeat(60));
  console.log(`Generated ${publications.length} publication JSON file(s)`);
  console.log(`Output: ${outputDir}/`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
