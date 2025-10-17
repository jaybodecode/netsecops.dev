/**
 * Content Generation V2 - Entity Indexer
 * 
 * Phase 2 of Fingerprint V2 duplicate detection system.
 * Extracts entities from structured_news.data JSON and populates entity indexes.
 * 
 * Process:
 * 1. Query structured_news table for publications (by date or all)
 * 2. Parse JSON from structured_news.data column
 * 3. Extract article metadata, CVEs, and entities
 * 4. Filter entities by type (see INDEXED_ENTITY_TYPES)
 * 5. Populate articles_meta, article_cves, article_entities tables
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/index-entities.ts --all
 *   npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07
 *   npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07 --force
 *   npx tsx scripts/content-generation-v2/index-entities.ts --from 2025-10-07 --to 2025-10-14
 * 
 * Design: FINGERPRINT-V2.md
 * Phase 1: FINGERPRINT-V2-PHASE1-COMPLETE.md
 */

import 'dotenv/config';
import { Command } from 'commander';
import { getDB } from './database/index.js';
import {
  getStructuredNewsRecord,
  type StructuredNewsRecord
} from './database/schema.js';
import {
  insertArticleMeta,
  insertCVE,
  insertEntity,
  isArticleIndexed,
  deleteArticleEntities,
  shouldIndexEntityType,
  normalizeEntityType,
  getEntityIndexStats,
  type ArticleMetaForIndexing,
  type CVEForIndexing,
  type EntityForIndexing
} from './database/schema.js';
import type { CyberAdvisoryType, ArticleType } from './news-structured-schema.js';

interface CLIOptions {
  all: boolean;
  date?: string;
  from?: string;
  to?: string;
  force: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('index-entities')
    .description('Extract and index entities from structured publications')
    .option('--all', 'Index all publications in database')
    .option('--date <date>', 'Index specific publication date (YYYY-MM-DD)')
    .option('--from <date>', 'Index publications from date (YYYY-MM-DD, requires --to)')
    .option('--to <date>', 'Index publications to date (YYYY-MM-DD, requires --from)')
    .option('--force', 'Force re-index (delete and re-insert existing articles)')
    .helpOption('-h, --help', 'Display help information')
    .addHelpText('after', `
Examples:
  # Index all publications
  npx tsx scripts/content-generation-v2/index-entities.ts --all
  
  # Index specific date
  npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07
  
  # Force re-index (delete existing, re-insert)
  npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07 --force
  
  # Index date range
  npx tsx scripts/content-generation-v2/index-entities.ts --from 2025-10-07 --to 2025-10-14

Input:
  Reads structured_news table for publications matching criteria
  
Output:
  Populates articles_meta, article_cves, article_entities tables
  
Entity Filtering:
  INDEXED: threat_actor, malware, product, company, vendor, government_agency
  EXCLUDED: person, technology, security_organization, other
`)
    .parse(process.argv);
  
  const options = program.opts();
  
  // Validate options
  const hasAll = !!options.all;
  const hasDate = !!options.date;
  const hasRange = !!options.from || !!options.to;
  
  if (!hasAll && !hasDate && !hasRange) {
    console.error('❌ Error: Must specify --all, --date, or --from/--to');
    process.exit(1);
  }
  
  if (hasAll && (hasDate || hasRange)) {
    console.error('❌ Error: Cannot combine --all with --date or --from/--to');
    process.exit(1);
  }
  
  if (hasDate && hasRange) {
    console.error('❌ Error: Cannot combine --date with --from/--to');
    process.exit(1);
  }
  
  if ((options.from && !options.to) || (!options.from && options.to)) {
    console.error('❌ Error: Both --from and --to are required for range indexing');
    process.exit(1);
  }
  
  return {
    all: hasAll,
    date: options.date,
    from: options.from,
    to: options.to,
    force: !!options.force
  };
}

/**
 * Get publications to index based on CLI options
 */
function getPublicationsToIndex(options: CLIOptions): StructuredNewsRecord[] {
  const db = getDB();
  
  if (options.all) {
    console.log('📊 Fetching all publications from database...');
    return db.prepare(`
      SELECT pub_id, pub_date, pub_date_only, pub_type, generated_at, data, headline, total_articles, date_range
      FROM structured_news
      ORDER BY pub_date DESC
    `).all() as StructuredNewsRecord[];
  }
  
  if (options.date) {
    console.log(`📊 Fetching publication for date: ${options.date}...`);
    const pubs = db.prepare(`
      SELECT pub_id, pub_date, pub_date_only, pub_type, generated_at, data, headline, total_articles, date_range
      FROM structured_news
      WHERE pub_date_only = ?
      ORDER BY generated_at DESC
    `).all(options.date) as StructuredNewsRecord[];
    return pubs;
  }
  
  if (options.from && options.to) {
    console.log(`📊 Fetching publications from ${options.from} to ${options.to}...`);
    const allPubs = db.prepare(`
      SELECT pub_id, pub_date, pub_date_only, pub_type, generated_at, data, headline, total_articles, date_range
      FROM structured_news
      WHERE pub_date_only >= ? AND pub_date_only <= ?
      ORDER BY pub_date DESC
    `).all(options.from, options.to) as StructuredNewsRecord[];
    return allPubs;
  }
  
  return [];
}

/**
 * Extract and index entities from a single article
 */
function indexArticle(
  article: ArticleType,
  pubId: string,
  pubDateOnly: string,
  force: boolean
): { cves: number; entities: number; skipped: boolean } {
  
  // Check if already indexed
  if (isArticleIndexed(article.id)) {
    if (!force) {
      return { cves: 0, entities: 0, skipped: true };
    }
    
    // Force re-index: delete existing
    deleteArticleEntities(article.id);
  }
  
  // Insert article metadata
  const meta: ArticleMetaForIndexing = {
    article_id: article.id,
    pub_id: pubId,
    pub_date_only: pubDateOnly,
    slug: article.slug,
    summary: article.summary,
    full_report: article.full_report  // Phase 4: Store full report for improved text similarity
  };
  insertArticleMeta(meta);
  
  // Insert CVEs
  let cveCount = 0;
  for (const cve of article.cves || []) {
    const cveData: CVEForIndexing = {
      article_id: article.id,
      cve_id: cve.id,
      cvss_score: cve.cvss_score,
      severity: cve.severity,
      kev: cve.kev
    };
    insertCVE(cveData);
    cveCount++;
  }
  
  // Insert entities (filtered by type)
  let entityCount = 0;
  for (const entity of article.entities || []) {
    // Filter out excluded entity types
    if (!shouldIndexEntityType(entity.type)) {
      continue;
    }
    
    // Normalize entity type (vendor → company)
    const normalizedType = normalizeEntityType(entity.type);
    
    const entityData: EntityForIndexing = {
      article_id: article.id,
      entity_name: entity.name,
      entity_type: normalizedType
    };
    insertEntity(entityData);
    entityCount++;
  }
  
  return { cves: cveCount, entities: entityCount, skipped: false };
}

/**
 * Index entities from a single publication
 */
function indexPublication(pub: StructuredNewsRecord, force: boolean): {
  articles: number;
  articlesSkipped: number;
  cves: number;
  entities: number;
} {
  // Parse JSON data
  let publication: CyberAdvisoryType;
  try {
    publication = JSON.parse(pub.data);
  } catch (error) {
    console.error(`   ❌ Failed to parse JSON for pub_id ${pub.pub_id}:`, error);
    return { articles: 0, articlesSkipped: 0, cves: 0, entities: 0 };
  }
  
  // Validate articles array
  if (!publication.articles || !Array.isArray(publication.articles)) {
    console.error(`   ❌ No articles array found in pub_id ${pub.pub_id}`);
    return { articles: 0, articlesSkipped: 0, cves: 0, entities: 0 };
  }
  
  // Process each article
  let totalCVEs = 0;
  let totalEntities = 0;
  let articlesIndexed = 0;
  let articlesSkipped = 0;
  
  for (const article of publication.articles) {
    const result = indexArticle(article, pub.pub_id, pub.pub_date_only, force);
    
    if (result.skipped) {
      articlesSkipped++;
    } else {
      articlesIndexed++;
      totalCVEs += result.cves;
      totalEntities += result.entities;
    }
  }
  
  return {
    articles: articlesIndexed,
    articlesSkipped,
    cves: totalCVEs,
    entities: totalEntities
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Entity Indexer - Phase 2 of Fingerprint V2\n');
  
  const options = parseArgs();
  
  // Get publications to index
  const publications = getPublicationsToIndex(options);
  
  if (publications.length === 0) {
    console.log('⚠️  No publications found matching criteria');
    return;
  }
  
  console.log(`✅ Found ${publications.length} publication(s) to index\n`);
  
  if (options.force) {
    console.log('⚠️  Force mode enabled - will re-index existing articles\n');
  }
  
  // Process each publication
  let totalArticles = 0;
  let totalArticlesSkipped = 0;
  let totalCVEs = 0;
  let totalEntities = 0;
  
  for (const pub of publications) {
    console.log(`📰 Processing ${pub.pub_date_only} (${pub.pub_type}) - "${pub.headline.substring(0, 60)}..."`);
    
    const result = indexPublication(pub, options.force);
    
    totalArticles += result.articles;
    totalArticlesSkipped += result.articlesSkipped;
    totalCVEs += result.cves;
    totalEntities += result.entities;
    
    if (result.articles > 0) {
      console.log(`   ✅ Indexed ${result.articles} article(s)`);
      console.log(`      - CVEs: ${result.cves}`);
      console.log(`      - Entities: ${result.entities}`);
    }
    
    if (result.articlesSkipped > 0) {
      console.log(`   ⏭️  Skipped ${result.articlesSkipped} article(s) (already indexed)`);
    }
    
    console.log('');
  }
  
  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Indexing Summary:');
  console.log(`   Publications processed: ${publications.length}`);
  console.log(`   Articles indexed: ${totalArticles}`);
  if (totalArticlesSkipped > 0) {
    console.log(`   Articles skipped: ${totalArticlesSkipped}`);
  }
  console.log(`   CVEs indexed: ${totalCVEs}`);
  console.log(`   Entities indexed: ${totalEntities}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Get overall stats
  console.log('\n📈 Overall Index Statistics:');
  const stats = getEntityIndexStats();
  console.log(`   Total articles in index: ${stats.total_articles}`);
  console.log(`   Total publications: ${stats.total_publications}`);
  console.log(`   Date range: ${stats.oldest_date} to ${stats.newest_date}`);
  console.log(`   Total CVEs: ${stats.total_cves} (${stats.unique_cves} unique)`);
  console.log(`   Total entities: ${stats.total_entities} (${stats.unique_entities} unique)`);
  
  if (Object.keys(stats.entity_type_counts).length > 0) {
    console.log('\n   Entity breakdown by type:');
    const sortedTypes = Object.entries(stats.entity_type_counts)
      .sort(([, a], [, b]) => b - a);
    
    for (const [type, count] of sortedTypes) {
      console.log(`      ${type}: ${count}`);
    }
  }
  
  console.log('\n✅ Entity indexing complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
