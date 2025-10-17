#!/usr/bin/env node
/**
 * Content Generation V2 - Step 9: Generate RSS Feeds
 * 
 * Generates RSS 2.0 feeds from the normalized database.
 * 
 * Feeds generated:
 *   - /public/rss.xml - Latest 50 publications (main feed)
 *   - /public/rss/daily.xml - Daily publications only
 *   - /public/rss/weekly.xml - Weekly publications (future)
 *   - /public/rss/monthly.xml - Monthly publications (future)
 *   - /public/rss/categories/{category}.xml - By category
 * 
 * Input:
 *   - Database: publications, published_articles, publication_articles
 *   - Enrichment: structured_news for article metadata
 * 
 * Output:
 *   - RSS 2.0 XML files
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/generate-rss.ts
 *   npx tsx scripts/content-generation-v2/generate-rss.ts --limit 100
 */

import { getDB } from './database/index.js';
import type { Publication } from './database/schema-publications.js';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://cybernetsec.io';

/**
 * CLI arguments
 */
interface Args {
  limit?: number;
  outputDir?: string;
}

/**
 * RSS Item structure
 */
interface RSSItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
  categories: string[];
}

/**
 * RSS Channel configuration
 */
interface RSSChannel {
  title: string;
  link: string;
  description: string;
  items: RSSItem[];
}

/**
 * Parse CLI arguments
 */
function parseArgs(): Args {
  const args: Args = { limit: 50 };
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--limit' && i + 1 < process.argv.length) {
      args.limit = parseInt(process.argv[++i], 10);
    } else if (arg === '--output' && i + 1 < process.argv.length) {
      args.outputDir = process.argv[++i];
    }
  }
  
  return args;
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate RSS 2.0 XML
 */
function generateRSSXML(channel: RSSChannel): string {
  const now = new Date().toUTCString();
  
  const itemsXML = channel.items.map(item => {
    const categoriesXML = item.categories
      .map(cat => `      <category>${escapeXML(cat)}</category>`)
      .join('\n');
    
    return `    <item>
      <title>${escapeXML(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${item.description}]]></description>
${categoriesXML}
    </item>`;
  }).join('\n\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(channel.title)}</title>
    <link>${channel.link}</link>
    <description>${escapeXML(channel.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${channel.link}/rss.xml" rel="self" type="application/rss+xml"/>

${itemsXML}
  </channel>
</rss>`;
}

/**
 * Get publications for RSS
 */
function getPublications(limit: number, type?: string): Publication[] {
  const db = getDB();
  
  let sql = `
    SELECT * FROM publications
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (type) {
    // Future: filter by type (daily, weekly, monthly)
    // For now, we'll extract from slug pattern
    sql += ` AND slug LIKE ?`;
    params.push(`%${type}%`);
  }
  
  sql += `
    ORDER BY pub_date DESC
    LIMIT ?
  `;
  params.push(limit);
  
  const stmt = db.prepare(sql);
  return stmt.all(...params) as Publication[];
}

/**
 * Get articles for a publication with metadata
 */
function getPublicationArticlesWithCategories(publicationId: string): Array<{
  severity: string;
  categories: string[];
}> {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT pa.id as article_id
    FROM published_articles pa
    JOIN publication_articles pap ON pa.id = pap.article_id
    WHERE pap.publication_id = ?
    ORDER BY pap.position
  `);
  
  const articles = stmt.all(publicationId) as Array<{ article_id: string }>;
  
  // Get metadata from structured_news
  return articles.map(article => {
    const meta = findArticleMetaInStructuredNews(article.article_id);
    return {
      severity: meta?.severity || 'informational',
      categories: meta?.category || []
    };
  });
}

/**
 * Find article metadata in structured_news
 */
function findArticleMetaInStructuredNews(articleId: string): {
  severity: string;
  category: string[];
} | null {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT data FROM structured_news
    ORDER BY pub_date DESC
  `);
  
  const results = stmt.all() as Array<{ data: string }>;
  
  for (const result of results) {
    try {
      const data = JSON.parse(result.data);
      const article = data.articles?.find((a: any) => a.id === articleId);
      if (article) {
        return {
          severity: article.severity,
          category: article.category
        };
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Format publication description for RSS
 */
function formatPublicationDescription(pub: Publication, articles: Array<{ severity: string; categories: string[] }>): string {
  let html = `<p>${escapeXML(pub.summary.substring(0, 300))}${pub.summary.length > 300 ? '...' : ''}</p>`;
  
  // Add article count and severity breakdown
  const severityCounts = {
    critical: articles.filter(a => a.severity === 'critical').length,
    high: articles.filter(a => a.severity === 'high').length,
    medium: articles.filter(a => a.severity === 'medium').length,
    low: articles.filter(a => a.severity === 'low').length
  };
  
  html += `<p><strong>${pub.article_count} Articles:</strong> `;
  const parts = [];
  if (severityCounts.critical > 0) parts.push(`${severityCounts.critical} Critical`);
  if (severityCounts.high > 0) parts.push(`${severityCounts.high} High`);
  if (severityCounts.medium > 0) parts.push(`${severityCounts.medium} Medium`);
  if (severityCounts.low > 0) parts.push(`${severityCounts.low} Low`);
  html += parts.join(', ') + '</p>';
  
  html += `<p><a href="${BASE_URL}/publications/${pub.slug}">Read Full Publication →</a></p>`;
  
  return html;
}

/**
 * Get unique categories from all publications
 */
function getAllCategories(): string[] {
  const db = getDB();
  
  const publications = db.prepare(`
    SELECT id FROM publications
  `).all() as Array<{ id: string }>;
  
  const categorySet = new Set<string>();
  
  for (const pub of publications) {
    const articles = getPublicationArticlesWithCategories(pub.id);
    articles.forEach(article => {
      article.categories.forEach(cat => categorySet.add(cat));
    });
  }
  
  return Array.from(categorySet).sort();
}

/**
 * Generate main RSS feed (all publications)
 */
async function generateMainFeed(outputDir: string, limit: number): Promise<void> {
  console.log('\n📰 Generating main RSS feed...');
  
  const publications = getPublications(limit);
  console.log(`   Found ${publications.length} publications`);
  
  const items: RSSItem[] = [];
  
  for (const pub of publications) {
    const articles = getPublicationArticlesWithCategories(pub.id);
    const categories = Array.from(
      new Set(articles.flatMap(a => a.categories))
    );
    
    items.push({
      title: pub.headline,
      link: `${BASE_URL}/publications/${pub.slug}`,
      guid: `${BASE_URL}/publications/${pub.slug}`,
      pubDate: new Date(pub.pub_date).toUTCString(),
      description: formatPublicationDescription(pub, articles),
      categories: categories
    });
  }
  
  const xml = generateRSSXML({
    title: 'CyberNetSec - Cyber Threat Intelligence',
    link: BASE_URL,
    description: 'Daily cybersecurity threat intelligence and analysis',
    items
  });
  
  const outputPath = join(outputDir, 'rss.xml');
  writeFileSync(outputPath, xml, 'utf-8');
  
  console.log(`   ✅ Written to: ${outputPath}`);
  console.log(`   📊 ${items.length} publications`);
}

/**
 * Generate daily publications feed
 */
async function generateDailyFeed(outputDir: string, limit: number): Promise<void> {
  console.log('\n📅 Generating daily publications feed...');
  
  const rssDir = join(outputDir, 'rss');
  if (!existsSync(rssDir)) {
    mkdirSync(rssDir, { recursive: true });
  }
  
  const publications = getPublications(limit, 'daily');
  console.log(`   Found ${publications.length} daily publications`);
  
  const items: RSSItem[] = [];
  
  for (const pub of publications) {
    const articles = getPublicationArticlesWithCategories(pub.id);
    const categories = Array.from(
      new Set(articles.flatMap(a => a.categories))
    );
    
    items.push({
      title: pub.headline,
      link: `${BASE_URL}/publications/${pub.slug}`,
      guid: `${BASE_URL}/publications/${pub.slug}`,
      pubDate: new Date(pub.pub_date).toUTCString(),
      description: formatPublicationDescription(pub, articles),
      categories: categories
    });
  }
  
  const xml = generateRSSXML({
    title: 'CyberNetSec - Daily Threat Intelligence',
    link: BASE_URL,
    description: 'Daily cybersecurity threat briefings',
    items
  });
  
  const outputPath = join(rssDir, 'daily.xml');
  writeFileSync(outputPath, xml, 'utf-8');
  
  console.log(`   ✅ Written to: ${outputPath}`);
  console.log(`   📊 ${items.length} daily publications`);
}

/**
 * Generate category feeds
 */
async function generateCategoryFeeds(outputDir: string, limit: number): Promise<void> {
  console.log('\n📂 Generating category feeds...');
  
  const categoriesDir = join(outputDir, 'rss', 'categories');
  if (!existsSync(categoriesDir)) {
    mkdirSync(categoriesDir, { recursive: true });
  }
  
  const categories = getAllCategories();
  console.log(`   Found ${categories.length} categories`);
  
  for (const category of categories) {
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Get publications that have articles in this category
    const allPublications = getPublications(limit * 2); // Get more to filter
    const categoryItems: RSSItem[] = [];
    
    for (const pub of allPublications) {
      const articles = getPublicationArticlesWithCategories(pub.id);
      const hasCategory = articles.some(a => a.categories.includes(category));
      
      if (hasCategory) {
        const categories = Array.from(
          new Set(articles.flatMap(a => a.categories))
        );
        
        categoryItems.push({
          title: pub.headline,
          link: `${BASE_URL}/publications/${pub.slug}`,
          guid: `${BASE_URL}/publications/${pub.slug}`,
          pubDate: new Date(pub.pub_date).toUTCString(),
          description: formatPublicationDescription(pub, articles),
          categories: categories
        });
        
        if (categoryItems.length >= limit) break;
      }
    }
    
    if (categoryItems.length === 0) {
      console.log(`   ⏭️  Skipping ${category} (no publications)`);
      continue;
    }
    
    const xml = generateRSSXML({
      title: `CyberNetSec - ${category}`,
      link: BASE_URL,
      description: `Latest ${category.toLowerCase()} threat intelligence`,
      items: categoryItems
    });
    
    const outputPath = join(categoriesDir, `${slug}.xml`);
    writeFileSync(outputPath, xml, 'utf-8');
    
    console.log(`   ✅ ${slug}.xml (${categoryItems.length} items)`);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();
  const outputDir = args.outputDir || join(process.cwd(), 'public');
  const limit = args.limit || 50;
  
  console.log('='.repeat(60));
  console.log('Step 9: Generate RSS Feeds');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}`);
  console.log(`Item limit: ${limit}\n`);
  
  try {
    // Generate main feed (all publications)
    await generateMainFeed(outputDir, limit);
    
    // Generate daily feed
    await generateDailyFeed(outputDir, limit);
    
    // Generate category feeds
    await generateCategoryFeeds(outputDir, Math.min(limit, 30));
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Step 9 Complete!');
    console.log('='.repeat(60));
    console.log(`RSS feeds written to: ${outputDir}/`);
    console.log(`Main feed: ${outputDir}/rss.xml`);
    console.log(`Daily feed: ${outputDir}/rss/daily.xml`);
    console.log(`Category feeds: ${outputDir}/rss/categories/`);
  } catch (error) {
    console.error('❌ Error generating RSS feeds:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
