/**
 * Content Generation V3 - Regenerate Updated Article JSON Files
 * 
 * Re-exports JSON files for articles that have received updates.
 * Run this after check-duplicates-v3.ts whe  // MITRE techniques
  const mitreTechniquesStmt = db.prepare(`
    SELECT technique_id as id, name, tactic
    FROM article_mitre_techniques
    WHERE article_id = ?
  `);UPDATE resolutions occur.
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts
 *   npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --date 2025-10-08
 *   npx tsx scripts/content-generation-v2/regenerate-updated-articles.ts --all
 */

import 'dotenv/config';
import { Command } from 'commander';
import { getDB } from './database/index.js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = 'public/data/articles';

interface Article {
  id: string;
  slug: string;
  headline: string;
  title: string;
  summary: string;
  full_report: string;
  twitter_post: string | null;
  meta_description: string | null;
  category: string; // JSON array
  severity: string;
  pub_date: string;
  reading_time_minutes: number | null;
  created_at: string;
  updated_at: string;
}

interface ArticleUpdate {
  id: number;
  datetime: string;
  summary: string;
  content: string;
  severity_change: string | null;
  sources: Array<{
    url: string;
    title: string;
    website: string;
    date: string | null;
  }>;
}

const program = new Command();

program
  .name('regenerate-updated-articles')
  .description('Regenerate JSON files for articles with updates')
  .option('--date <date>', 'Regenerate articles updated on this date (YYYY-MM-DD)')
  .option('--all', 'Regenerate all articles with updates')
  .parse(process.argv);

const options = program.opts();

console.log('🔄 Regenerate Updated Article JSON Files');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const db = getDB();

/**
 * Get articles that have updates
 */
function getArticlesWithUpdates(date?: string): string[] {
  if (date) {
    // Get articles with updates on specific date
    const stmt = db.prepare(`
      SELECT DISTINCT article_id
      FROM article_updates
      WHERE DATE(datetime) = ?
      ORDER BY datetime DESC
    `);
    return stmt.all(date).map((row: any) => row.article_id);
  } else {
    // Get all articles with updates
    const stmt = db.prepare(`
      SELECT DISTINCT article_id
      FROM article_updates
      ORDER BY article_id
    `);
    return stmt.all().map((row: any) => row.article_id);
  }
}

/**
 * Get article details
 */
function getArticle(articleId: string): Article | null {
  const stmt = db.prepare(`
    SELECT *
    FROM articles
    WHERE id = ?
  `);
  return stmt.get(articleId) as Article | null;
}

/**
 * Get all updates for an article
 */
function getArticleUpdates(articleId: string): ArticleUpdate[] {
  const updatesStmt = db.prepare(`
    SELECT 
      id,
      datetime,
      summary,
      content,
      severity_change
    FROM article_updates
    WHERE article_id = ?
    ORDER BY datetime DESC
  `);
  
  const updates = updatesStmt.all(articleId) as Array<Omit<ArticleUpdate, 'sources'>>;
  
  // Get sources for each update
  const sourcesStmt = db.prepare(`
    SELECT url, title, website, date
    FROM article_update_sources
    WHERE update_id = ?
  `);
  
  return updates.map(update => ({
    ...update,
    sources: sourcesStmt.all(update.id) as ArticleUpdate['sources']
  }));
}

/**
 * Get article entities, CVEs, tags, sources, events, MITRE techniques, impact scope
 */
function getArticleData(articleId: string) {
  // Get entities
  const entitiesStmt = db.prepare(`
    SELECT entity_name as name, entity_type as type
    FROM article_entities
    WHERE article_id = ?
    ORDER BY entity_name
  `);
  const entities = entitiesStmt.all(articleId);
  
  // Get CVEs
  const cvesStmt = db.prepare(`
    SELECT cve_id as id, cvss_score, cvss_version, kev, severity
    FROM article_cves
    WHERE article_id = ?
    ORDER BY cve_id
  `);
  const cves = cvesStmt.all(articleId);
  
  // Get tags
  const tagsStmt = db.prepare(`
    SELECT tag
    FROM article_tags
    WHERE article_id = ?
    ORDER BY tag
  `);
  const tags = tagsStmt.all(articleId).map((row: any) => row.tag);
  
  // Get sources
  const sourcesStmt = db.prepare(`
    SELECT url, title, date, website
    FROM article_sources
    WHERE article_id = ?
    ORDER BY id
  `);
  const sources = sourcesStmt.all(articleId);
  
  // Get events
  const eventsStmt = db.prepare(`
    SELECT datetime, summary
    FROM article_events
    WHERE article_id = ?
    ORDER BY datetime
  `);
  const events = eventsStmt.all(articleId);
  
  // Get MITRE techniques
  const mitreStmt = db.prepare(`
    SELECT technique_id as id, name, tactic
    FROM article_mitre_techniques
    WHERE article_id = ?
    ORDER BY technique_id
  `);
  const mitre_techniques = mitreStmt.all(articleId);
  
  // Get impact scope
  const impactStmt = db.prepare(`
    SELECT *
    FROM article_impact_scope
    WHERE article_id = ?
  `);
  const impact_scope = impactStmt.get(articleId) as any;
  
  return {
    entities,
    cves,
    tags,
    sources,
    events,
    mitre_techniques,
    impact_scope: impact_scope ? {
      geographic_scope: impact_scope.geographic_scope,
      industries_affected: impact_scope.industries_affected ? JSON.parse(impact_scope.industries_affected) : [],
      companies_affected: impact_scope.companies_affected ? JSON.parse(impact_scope.companies_affected) : [],
      governments_affected: impact_scope.governments_affected ? JSON.parse(impact_scope.governments_affected) : [],
      countries_affected: impact_scope.countries_affected ? JSON.parse(impact_scope.countries_affected) : [],
      other_affected: impact_scope.other_affected ? JSON.parse(impact_scope.other_affected) : [],
      people_affected_estimate: impact_scope.people_affected_estimate
    } : null
  };
}

/**
 * Export article to JSON file
 */
function exportArticleJSON(article: Article): void {
  const articleData = getArticleData(article.id);
  const updates = getArticleUpdates(article.id);
  
  const jsonData = {
    id: article.id,
    slug: article.slug,
    headline: article.headline,
    title: article.title,
    summary: article.summary,
    full_report: article.full_report,
    twitter_post: article.twitter_post,
    meta_description: article.meta_description,
    category: JSON.parse(article.category),
    severity: article.severity,
    entities: articleData.entities,
    cves: articleData.cves,
    sources: articleData.sources,
    events: articleData.events,
    mitre_techniques: articleData.mitre_techniques,
    tags: articleData.tags,
    extract_datetime: article.pub_date,
    article_type: 'NewsArticle',
    impact_scope: articleData.impact_scope,
    keywords: articleData.tags,
    pub_date: article.pub_date,
    reading_time_minutes: article.reading_time_minutes,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    updates: updates.map(u => ({
      datetime: u.datetime,
      summary: u.summary,
      content: u.content,
      severity_change: u.severity_change,
      sources: u.sources
    }))
  };
  
  const filename = `${article.slug}.json`;
  const filepath = join(OUTPUT_DIR, filename);
  
  writeFileSync(filepath, JSON.stringify(jsonData, null, 2));
  console.log(`   ✅ Regenerated: ${filename}`);
  console.log(`      Updates: ${updates.length}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    const date = options.date;
    const all = options.all;
    
    if (!date && !all) {
      console.error('❌ Please specify --date or --all');
      process.exit(1);
    }
    
    const articleIds = getArticlesWithUpdates(date);
    
    if (articleIds.length === 0) {
      console.log(`ℹ️  No articles with updates found${date ? ` for ${date}` : ''}`);
      return;
    }
    
    console.log(`📊 Found ${articleIds.length} article(s) with updates\n`);
    
    for (const articleId of articleIds) {
      const article = getArticle(articleId);
      
      if (!article) {
        console.warn(`   ⚠️  Article ${articleId} not found, skipping...`);
        continue;
      }
      
      exportArticleJSON(article);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Regenerated ${articleIds.length} article JSON file(s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

main();
