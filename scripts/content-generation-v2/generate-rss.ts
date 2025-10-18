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
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Import ArticleCategory enum for consistent categories
import type { ArticleCategory } from '../../types/cyber.js';

// Get the directory of this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default output directory relative to script location
// scripts/content-generation-v2/generate-rss.ts -> ../../public
const DEFAULT_OUTPUT_DIR = join(__dirname, '..', '..', 'public');

// Base URL for links (should match your production site)
const BASE_URL = 'https://cyber.netsecops.io';

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
  const args: Args = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--limit' && i + 1 < process.argv.length) {
      const limitStr = process.argv[++i];
      if (limitStr) {
        args.limit = parseInt(limitStr, 10);
      }
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
 * Get articles from the last 3 days
 */
function getRecentArticles(limit?: number): any[] {
  const db = getDB();
  
  const sql = `
    SELECT a.*, JSON_EXTRACT(a.category, '$') as categories
    FROM articles a
    WHERE a.pub_date >= date('now', '-3 days')
    AND a.resolution = 'NEW'
    ORDER BY a.pub_date DESC
  `;
  
  const stmt = db.prepare(limit ? sql + ` LIMIT ?` : sql);
  const results = limit ? stmt.all(limit) : stmt.all();
  
  // Parse categories from JSON and add severity
  return results.map((row: any) => ({
    ...row,
    categories: JSON.parse(row.categories || '[]'),
    severity: row.severity || 'informational'
  }));
}

/**
 * Get articles by category (last 10 articles by updated_at)
 */
function getArticlesByCategory(category: ArticleCategory, limit?: number): any[] {
  const db = getDB();
  
  const sql = `
    SELECT a.*, JSON_EXTRACT(a.category, '$') as categories
    FROM articles a
    WHERE a.resolution = 'NEW'
    AND a.category LIKE '%"${category}"%'
    ORDER BY a.updated_at DESC
  `;
  
  const stmt = db.prepare(limit ? sql + ` LIMIT ?` : sql);
  const results = limit ? stmt.all(limit) : stmt.all();
  
  // Parse categories from JSON and add severity
  return results.map((row: any) => ({
    ...row,
    categories: JSON.parse(row.categories || '[]'),
    severity: row.severity || 'informational'
  }));
}

/**
 * Get updated articles (isUpdate = 1)
 */
function getUpdatedArticles(limit?: number): any[] {
  const db = getDB();
  
  const sql = `
    SELECT a.*, JSON_EXTRACT(a.category, '$') as categories
    FROM articles a
    WHERE a.isUpdate = 1
    ORDER BY a.updated_at DESC
  `;
  
  const stmt = db.prepare(limit ? sql + ` LIMIT ?` : sql);
  const results = limit ? stmt.all(limit) : stmt.all();
  
  // Parse categories from JSON and add severity
  return results.map((row: any) => ({
    ...row,
    categories: JSON.parse(row.categories || '[]'),
    severity: row.severity || 'informational'
  }));
}

/**
 * Get all articles from the last day (both NEW and UPDATE)
 */
function getLastDayArticles(limit?: number): any[] {
  const db = getDB();
  
  const sql = `
    SELECT a.*, 
           JSON_EXTRACT(a.category, '$') as categories
    FROM articles a
    WHERE date(a.updated_at) >= date('now', '-1 day')
    ORDER BY a.updated_at DESC
  `;
  
  const stmt = db.prepare(limit ? sql + ` LIMIT ?` : sql);
  const results = limit ? stmt.all(limit) : stmt.all();
  
  // Parse categories and enrich with structured_news data
  return results.map((row: any) => {
    const meta = findArticleMetaInStructuredNews(row.id);
    
    return {
      ...row,
      categories: JSON.parse(row.categories || '[]'),
      entities: meta?.entities || {},
      impact_scope: meta?.impact_scope || {},
      source_url: meta?.source_url || '',
      severity: row.severity || 'informational',
      isNew: row.isUpdate !== 1
    };
  });
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
  entities?: any;
  impact_scope?: any;
  source_url?: string;
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
          category: article.category,
          entities: article.entities || {},
          impact_scope: article.impact_scope || {},
          source_url: article.source_url || article.url || ''
        };
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Format article description for RSS
 */
function formatArticleDescription(article: any): string {
  let html = `<p>${escapeXML(article.summary.substring(0, 300))}${article.summary.length > 300 ? '...' : ''}</p>`;
  
  // Add severity and categories
  const severity = article.severity || 'informational';
  const categories = article.categories || [];
  
  html += `<p><strong>Severity:</strong> ${severity.charAt(0).toUpperCase() + severity.slice(1)}</p>`;
  
  if (categories.length > 0) {
    html += `<p><strong>Categories:</strong> ${categories.join(', ')}</p>`;
  }
  
  html += `<p><a href="${BASE_URL}/articles/${article.slug}">Read Full Article →</a></p>`;
  
  return html;
}

/**
 * Format enhanced article description for last.xml feed
 */
function formatEnhancedArticleDescription(article: any): string {
  let html = '';
  
  // Add headline (if different from title)
  if (article.headline && article.headline !== article.title) {
    html += `<p><strong>Headline:</strong> ${escapeXML(article.headline)}</p>`;
  }
  
  // Add summary
  html += `<p><strong>Summary:</strong><br/>${escapeXML(article.summary)}</p>`;
  
  // Add article metadata
  const severity = article.severity || 'informational';
  const categories = article.categories || [];
  
  html += `<p><strong>Severity:</strong> ${severity.charAt(0).toUpperCase() + severity.slice(1)}</p>`;
  
  if (categories.length > 0) {
    html += `<p><strong>Categories:</strong> ${categories.join(', ')}</p>`;
  }
  
  // Add article type if available
  if (article.article_type) {
    html += `<p><strong>Article Type:</strong> ${escapeXML(article.article_type)}</p>`;
  }
  
  // Add keywords if available
  if (article.keywords) {
    try {
      const keywords = typeof article.keywords === 'string' ? JSON.parse(article.keywords) : article.keywords;
      if (Array.isArray(keywords) && keywords.length > 0) {
        html += `<p><strong>Keywords:</strong> ${keywords.map(k => escapeXML(k)).join(', ')}</p>`;
      }
    } catch (e) {
      // Skip if keywords parsing fails
    }
  }
  
  // Add reading time if available
  if (article.reading_time_minutes) {
    html += `<p><strong>Reading Time:</strong> ${article.reading_time_minutes} minute${article.reading_time_minutes !== 1 ? 's' : ''}</p>`;
  }
  
  // Add entities if available
  if (article.entities && Object.keys(article.entities).length > 0) {
    const entities = article.entities;
    const entityParts: string[] = [];
    
    if (entities.malware?.length > 0) {
      entityParts.push(`Malware: ${entities.malware.map((m: string) => escapeXML(m)).join(', ')}`);
    }
    if (entities.threat_actors?.length > 0) {
      entityParts.push(`Threat Actors: ${entities.threat_actors.map((t: string) => escapeXML(t)).join(', ')}`);
    }
    if (entities.vulnerabilities?.length > 0) {
      entityParts.push(`Vulnerabilities: ${entities.vulnerabilities.map((v: string) => escapeXML(v)).join(', ')}`);
    }
    if (entities.affected_products?.length > 0) {
      entityParts.push(`Affected Products: ${entities.affected_products.map((p: string) => escapeXML(p)).join(', ')}`);
    }
    if (entities.companies?.length > 0) {
      entityParts.push(`Companies: ${entities.companies.map((c: string) => escapeXML(c)).join(', ')}`);
    }
    if (entities.threat_groups?.length > 0) {
      entityParts.push(`Threat Groups: ${entities.threat_groups.map((g: string) => escapeXML(g)).join(', ')}`);
    }
    
    if (entityParts.length > 0) {
      html += `<p><strong>Entities:</strong><br/>${entityParts.join('<br/>')}</p>`;
    }
  }
  
  // Add impact scope if available
  if (article.impact_scope && Object.keys(article.impact_scope).length > 0) {
    const scope = article.impact_scope;
    const scopeParts: string[] = [];
    
    if (scope.industries?.length > 0) {
      scopeParts.push(`Industries: ${scope.industries.map((i: string) => escapeXML(i)).join(', ')}`);
    }
    if (scope.regions?.length > 0) {
      scopeParts.push(`Regions: ${scope.regions.map((r: string) => escapeXML(r)).join(', ')}`);
    }
    if (scope.attack_vectors?.length > 0) {
      scopeParts.push(`Attack Vectors: ${scope.attack_vectors.map((v: string) => escapeXML(v)).join(', ')}`);
    }
    if (scope.affected_systems?.length > 0) {
      scopeParts.push(`Affected Systems: ${scope.affected_systems.map((s: string) => escapeXML(s)).join(', ')}`);
    }
    
    if (scopeParts.length > 0) {
      html += `<p><strong>Impact Scope:</strong><br/>${scopeParts.join('<br/>')}</p>`;
    }
  }
  
  // Add source URL if available
  if (article.source_url) {
    html += `<p><strong>Source URL:</strong> <a href="${escapeXML(article.source_url)}">${escapeXML(article.source_url)}</a></p>`;
  }
  
  // Add metadata description if available
  if (article.meta_description && article.meta_description !== article.summary) {
    html += `<p><strong>Meta Description:</strong> ${escapeXML(article.meta_description)}</p>`;
  }
  
  // Add slug for reference
  html += `<p><strong>Article Slug:</strong> ${escapeXML(article.slug)}</p>`;
  
  // Add dates
  html += `<p><strong>Published Date:</strong> ${article.pub_date ? new Date(article.pub_date).toUTCString() : 'N/A'}</p>`;
  html += `<p><strong>Created Date:</strong> ${new Date(article.created_at).toUTCString()}</p>`;
  html += `<p><strong>Updated Date:</strong> ${new Date(article.updated_at).toUTCString()}</p>`;
  
  // Add update information if this is an update
  if (article.isUpdate === 1) {
    html += `<p><strong>Update Count:</strong> ${article.updateCount || 1}</p>`;
    if (article.updates) {
      try {
        const updates = typeof article.updates === 'string' ? JSON.parse(article.updates) : article.updates;
        if (Array.isArray(updates) && updates.length > 0) {
          html += `<p><strong>Update History:</strong> ${updates.length} update${updates.length !== 1 ? 's' : ''} recorded</p>`;
        }
      } catch (e) {
        // Skip if updates parsing fails
      }
    }
  }
  
  html += `<p><a href="${BASE_URL}/articles/${article.slug}">Read Full Article →</a></p>`;
  
  return html;
}

/**
 * Get all categories from schema enum (consistent with frontend)
 */
function getAllCategories(): ArticleCategory[] {
  return [
    'Ransomware',
    'Malware',
    'Threat Actor',
    'Vulnerability',
    'Data Breach',
    'Phishing',
    'Supply Chain Attack',
    'Cyberattack',
    'Industrial Control Systems',
    'Cloud Security',
    'Mobile Security',
    'IoT Security',
    'Patch Management',
    'Threat Intelligence',
    'Incident Response',
    'Security Operations',
    'Policy and Compliance',
    'Regulatory',
    'Other'
  ];
}

/**
 * Generate metadata.json file with feed information
 */
async function generateMetadataFile(outputDir: string): Promise<void> {
  console.log('\n📋 Generating RSS metadata file...');
  
  const now = new Date().toISOString();
  const rssDir = join(outputDir, 'rss');
  
  // Read existing feeds to get actual counts
  const allFeedPath = join(rssDir, 'all.xml');
  const updatesFeedPath = join(rssDir, 'updates.xml');
  const lastFeedPath = join(rssDir, 'last.xml');
  
  let allItemCount = 0;
  let updatesItemCount = 0;
  let lastItemCount = 0;
  
  // Count items in all.xml
  if (existsSync(allFeedPath)) {
    const allContent = readFileSync(allFeedPath, 'utf-8');
    const allMatches = allContent.match(/<item>/g);
    allItemCount = allMatches ? allMatches.length : 0;
  }
  
  // Count items in updates.xml
  if (existsSync(updatesFeedPath)) {
    const updatesContent = readFileSync(updatesFeedPath, 'utf-8');
    const updatesMatches = updatesContent.match(/<item>/g);
    updatesItemCount = updatesMatches ? updatesMatches.length : 0;
  }
  
  // Count items in last.xml
  if (existsSync(lastFeedPath)) {
    const lastContent = readFileSync(lastFeedPath, 'utf-8');
    const lastMatches = lastContent.match(/<item>/g);
    lastItemCount = lastMatches ? lastMatches.length : 0;
  }
  
  // Get category feed information
  const categoriesDir = join(rssDir, 'categories');
  const categoryFeeds = [];
  
  if (existsSync(categoriesDir)) {
    const categoryFiles = readdirSync(categoriesDir).filter(file => file.endsWith('.xml'));
    
    for (const file of categoryFiles) {
      const filePath = join(categoriesDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const matches = content.match(/<item>/g);
      const itemCount = matches ? matches.length : 0;
      
      // Convert filename to slug (remove .xml)
      const slug = file.replace('.xml', '');
      
      // Get title from the categories enum
      const category = getAllCategories().find(cat => 
        cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug
      );
      
      if (category) {
        categoryFeeds.push({
          slug,
          title: category,
          description: `Latest ${category.toLowerCase()} threat intelligence - the last 10 articles`,
          url: `/rss/categories/${file}`,
          full_url: `${BASE_URL}/rss/categories/${file}`,
          item_count: itemCount,
          article_count: itemCount,
          last_updated: now,
          icon: getCategoryIcon(category)
        });
      }
    }
  }
  
  const metadata = {
    generated_at: now,
    feeds: {
      all: {
        title: 'CyberNetSec - Latest Cybersecurity Articles',
        description: 'Latest cybersecurity threat intelligence articles from the past 3 days',
        url: '/rss/all.xml',
        full_url: `${BASE_URL}/rss/all.xml`,
        item_count: allItemCount,
        last_updated: now,
        update_frequency: 'Daily'
      },
      updates: {
        title: 'Updates only',
        description: '20 Recently updated articles',
        url: '/rss/updates.xml',
        full_url: `${BASE_URL}/rss/updates.xml`,
        item_count: updatesItemCount,
        last_updated: now,
        update_frequency: 'Daily'
      },
      last: {
        title: 'Last Day - NEW & UPDATE',
        description: 'All NEW and UPDATE articles from the last day with enhanced metadata',
        url: '/rss/last.xml',
        full_url: `${BASE_URL}/rss/last.xml`,
        item_count: lastItemCount,
        last_updated: now,
        update_frequency: 'Daily'
      },
      categories: categoryFeeds
    },
    statistics: {
      total_feeds: 3 + categoryFeeds.length,
      total_articles: allItemCount,
      total_publications: 0,
      categories_count: categoryFeeds.length,
      last_pipeline_run: now
    }
  };
  
  const metadataPath = join(rssDir, 'metadata.json');
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  
  console.log(`   ✅ Written to: ${metadataPath}`);
  console.log(`   📊 ${categoryFeeds.length} categories, ${allItemCount} total articles`);
}

/**
 * Get icon for category
 */
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Ransomware': 'lock-closed',
    'Malware': 'bug',
    'Threat Actor': 'user-group',
    'Vulnerability': 'exclamation-circle',
    'Data Breach': 'exclamation-triangle',
    'Phishing': 'envelope',
    'Supply Chain Attack': 'link',
    'Cyberattack': 'shield-exclamation',
    'Industrial Control Systems': 'cog',
    'Cloud Security': 'cloud',
    'Mobile Security': 'device-phone-mobile',
    'IoT Security': 'chip',
    'Patch Management': 'wrench',
    'Threat Intelligence': 'eye',
    'Incident Response': 'wrench-screwdriver',
    'Security Operations': 'shield-check',
    'Policy and Compliance': 'document-text',
    'Regulatory': 'scale',
    'Other': 'question-mark-circle'
  };
  
  return iconMap[category] || 'tag';
}

/**
 * Generate main RSS feed (all articles from last 3 days)
 */
async function generateMainFeed(outputDir: string, limit?: number): Promise<void> {
  console.log('\n📰 Generating main RSS feed...');
  
  const articles = getRecentArticles(limit || 30);
  console.log(`   Found ${articles.length} articles from last 3 days`);
  
  const items: RSSItem[] = [];
  
  for (const article of articles) {
    items.push({
      title: article.headline,
      link: `${BASE_URL}/articles/${article.slug}`,
      guid: `${BASE_URL}/articles/${article.slug}`,
      pubDate: new Date(article.pub_date).toUTCString(),
      description: formatArticleDescription(article),
      categories: article.categories
    });
  }
  
  const xml = generateRSSXML({
    title: 'CyberNetSec - Latest Cybersecurity Articles',
    link: BASE_URL,
    description: 'Latest cybersecurity threat intelligence articles from the past 3 days',
    items
  });
  
  const outputPath = join(outputDir, 'rss', 'all.xml');
  const rssDir = join(outputDir, 'rss');
  if (!existsSync(rssDir)) {
    mkdirSync(rssDir, { recursive: true });
  }
  writeFileSync(outputPath, xml, 'utf-8');
  
  console.log(`   ✅ Written to: ${outputPath}`);
  console.log(`   📊 ${items.length} articles`);
}

/**
 * Generate updates RSS feed (recently updated articles)
 */
async function generateUpdatesFeed(outputDir: string, limit?: number): Promise<void> {
  console.log('\n� Generating updates RSS feed...');
  
  const rssDir = join(outputDir, 'rss');
  if (!existsSync(rssDir)) {
    mkdirSync(rssDir, { recursive: true });
  }
  
  const articles = getUpdatedArticles(limit || 10);
  console.log(`   Found ${articles.length} updated articles`);
  
  const items: RSSItem[] = [];
  
  for (const article of articles) {
    items.push({
      title: `[UPDATED] ${article.headline}`,
      link: `${BASE_URL}/articles/${article.slug}`,
      guid: `${BASE_URL}/articles/${article.slug}`,
      pubDate: new Date(article.pub_date).toUTCString(),
      description: formatArticleDescription(article),
      categories: article.categories
    });
  }
  
  const xml = generateRSSXML({
    title: 'Updates only',
    link: BASE_URL,
    description: '20 Recently updated articles',
    items
  });
  
  const outputPath = join(rssDir, 'updates.xml');
  writeFileSync(outputPath, xml, 'utf-8');
  
  console.log(`   ✅ Written to: ${outputPath}`);
  console.log(`   📊 ${items.length} updated articles`);
}

/**
 * Generate last day feed (NEW and UPDATE articles)
 */
async function generateLastDayFeed(outputDir: string, limit?: number): Promise<void> {
  console.log('\n🕐 Generating last day RSS feed...');
  
  const rssDir = join(outputDir, 'rss');
  if (!existsSync(rssDir)) {
    mkdirSync(rssDir, { recursive: true });
  }
  
  const articles = getLastDayArticles(limit);
  console.log(`   Found ${articles.length} articles from last day`);
  
  const items: RSSItem[] = [];
  
  for (const article of articles) {
    const prefix = article.isNew ? 'NEW:' : 'UPDATE:';
    
    items.push({
      title: `${prefix} ${article.headline}`,
      link: `${BASE_URL}/articles/${article.slug}`,
      guid: `${BASE_URL}/articles/${article.slug}`,
      pubDate: new Date(article.updated_at).toUTCString(),
      description: formatEnhancedArticleDescription(article),
      categories: article.categories
    });
  }
  
  const xml = generateRSSXML({
    title: 'Last Day - NEW & UPDATE',
    link: BASE_URL,
    description: 'All NEW and UPDATE articles from the last day with enhanced metadata',
    items
  });
  
  const outputPath = join(rssDir, 'last.xml');
  writeFileSync(outputPath, xml, 'utf-8');
  
  console.log(`   ✅ Written to: ${outputPath}`);
  console.log(`   📊 ${items.length} articles (NEW + UPDATE)`);
}

/**
 * Generate category feeds
 */
async function generateCategoryFeeds(outputDir: string, limit?: number): Promise<void> {
  console.log('\n📂 Generating category feeds...');
  
  const categoriesDir = join(outputDir, 'rss', 'categories');
  if (!existsSync(categoriesDir)) {
    mkdirSync(categoriesDir, { recursive: true });
  }
  
  const categories = getAllCategories();
  console.log(`   Found ${categories.length} categories`);
  
  for (const category of categories) {
    // Convert category to kebab-case slug (matches frontend expectations)
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Get articles for this category (last 10 by updated_at)
    const articles = getArticlesByCategory(category, limit || 10);
    
    if (articles.length === 0) {
      console.log(`   ⏭️  Skipping ${category} (no articles in last 3 days)`);
      continue;
    }
    
    const items: RSSItem[] = [];
    
    for (const article of articles) {
      items.push({
        title: article.headline,
        link: `${BASE_URL}/articles/${article.slug}`,
        guid: `${BASE_URL}/articles/${article.slug}`,
        pubDate: new Date(article.pub_date).toUTCString(),
        description: formatArticleDescription(article),
        categories: article.categories
      });
    }
    
    const xml = generateRSSXML({
      title: `CyberNetSec - ${category}`,
      link: BASE_URL,
      description: `Latest ${category.toLowerCase()} threat intelligence - the last 10 articles`,
      items
    });
    
    const outputPath = join(categoriesDir, `${slug}.xml`);
    writeFileSync(outputPath, xml, 'utf-8');
    
    console.log(`   ✅ ${slug}.xml (${items.length} articles)`);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();
  const outputDir = args.outputDir || DEFAULT_OUTPUT_DIR;
  const limit = args.limit; // No default limit - include all articles
  
  console.log('='.repeat(60));
  console.log('Step 9: Generate RSS Feeds');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}`);
  console.log(`Item limit: ${limit || 'No limit (all articles)'}\n`);
  
  try {
    // Generate main feed (all publications)
    await generateMainFeed(outputDir, limit);
    
    // Generate updates feed (last 20 updated articles)
    await generateUpdatesFeed(outputDir, limit || 20);
    
    // Generate last day feed (NEW and UPDATE articles)
    await generateLastDayFeed(outputDir, limit);
    
    // Generate category feeds (limit to 30 if limit is specified)
    await generateCategoryFeeds(outputDir, limit ? Math.min(limit, 30) : undefined);
    
    // Generate metadata file
    await generateMetadataFile(outputDir);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Step 9 Complete!');
    console.log('='.repeat(60));
    console.log(`RSS feeds written to: ${outputDir}/`);
    console.log(`Main feed: ${outputDir}/rss/all.xml`);
    console.log(`Updates feed: ${outputDir}/rss/updates.xml`);
    console.log(`Last day feed: ${outputDir}/rss/last.xml`);
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
