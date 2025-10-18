/**
 * Content Generation V2 - Phase 2: Insert Articles
 * 
 * Normalizes structured_news data into V3 schema:
 * - articles table (with resolution tracking)
 * - articles_fts (FTS5 virtual table)
 * - article_cves, article_entities, article_tags
 * - article_sources, article_events, article_mitre_techniques, article_impact_scope
 * - publications (with article_ids JSON array)
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-07
 *   npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-07 --dry-run
 *   npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-07 --json-file tmp/news-structured_2025-10-16_*.json
 */

import Database from 'better-sqlite3';
import { parseArgs } from 'node:util';
import { removeStopwords, eng } from 'stopword';
import type { ArticleType, CyberAdvisoryType } from './news-structured-schema.js';
import { ensureInitialized } from './database/index.js';
import { createPipelineLogger } from './utils/pipeline-logger.js';

const DB_PATH = 'logs/content-generation-v2.db';

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    date: { type: 'string', short: 'd' },
    'dry-run': { type: 'boolean', default: false },
  },
  strict: true,
  allowPositionals: false,
});

if (!values.date) {
  console.error('❌ Error: --date parameter required (format: YYYY-MM-DD)');
  console.error('   Example: npx tsx insert-articles.ts --date 2025-10-07');
  process.exit(1);
}

const targetDate = values.date;
const isDryRun = values['dry-run'];

// Validate date format
if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
  console.error('❌ Error: Invalid date format. Use YYYY-MM-DD');
  process.exit(1);
}

console.log('🚀 Insert Articles - Phase 2');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`   Date: ${targetDate}`);
console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '✍️  WRITE'}\n`);


// Open database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF'); // Disable FK constraints (old V2 tables have wrong references)

// Initialize pipeline logging
ensureInitialized();
const logger = createPipelineLogger(db);
logger.logStart({
  scriptName: 'insert-articles',
  dateProcessed: targetDate,
  metadata: { isDryRun },
});

/**
 * Get structured news for a specific date
 */
function getStructuredNews(date: string): CyberAdvisoryType | null {
  const stmt = db.prepare(`
    SELECT data 
    FROM structured_news 
    WHERE DATE(pub_date) = ?
  `);
  
  const row = stmt.get(date) as { data: string } | undefined;
  
  if (!row) {
    return null;
  }
  
  return JSON.parse(row.data) as CyberAdvisoryType;
}

/**
 * Check if articles already exist for this date
 */
function checkExistingArticles(date: string): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM articles
    WHERE DATE(created_at) = ?
  `);
  
  const result = stmt.get(date) as { count: number };
  return result.count;
}

/**
 * Insert article into articles table
 */
function insertArticle(article: ArticleType, targetDate: string) {
  const stmt = db.prepare(`
    INSERT INTO articles (
      id, slug, headline, title, summary, full_report,
      twitter_post, meta_description, category, severity,
      article_type, keywords, reading_time_minutes,
      pub_date, extract_datetime, created_at, updated_at,
      resolution, similarity_score, matched_article_id, skip_reasoning
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      NULL, NULL, NULL, NULL
    )
  `);
  
  stmt.run(
    article.id,
    article.slug,
    article.headline,
    article.title,
    article.summary,
    article.full_report,
    article.twitter_post,
    article.meta_description,
    JSON.stringify(article.category), // Store as JSON array
    article.severity,
    article.article_type || null,
    article.keywords ? JSON.stringify(article.keywords) : null,
    article.reading_time_minutes || null,
    targetDate.split('T')[0], // pub_date: Always use structured_news pub_date (YYYY-MM-DD format)
    targetDate, // extract_datetime: Always use structured_news pub_date at 9am CST (15:00 UTC)
    targetDate, // created_at
    targetDate  // updated_at
  );
}

/**
 * Insert article into FTS5 virtual table
 * CRITICAL: Use raw text WITHOUT stopword removal for better BM25 scores
 */
function insertArticleFTS(article: ArticleType) {
  const stmt = db.prepare(`
    INSERT INTO articles_fts (
      article_id, headline, summary, full_report
    ) VALUES (?, ?, ?, ?)
  `);
  
  // Use raw text - do NOT remove stopwords
  // Testing shows stopword removal actually reduces BM25 score quality
  stmt.run(
    article.id,
    article.headline,
    article.summary,
    article.full_report
  );
}

/**
 * Insert CVEs for an article
 */
function insertArticleCVEs(articleId: string, cves: ArticleType['cves']) {
  if (!cves || cves.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_cves (
      article_id, cve_id, cvss_score, cvss_version, severity, kev
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const cve of cves) {
    stmt.run(
      articleId,
      cve.id,
      cve.cvss_score || null,
      cve.cvss_version || null,
      cve.severity || null,
      cve.kev ? 1 : 0
    );
  }
}

/**
 * Insert entities for an article
 */
function insertArticleEntities(articleId: string, entities: ArticleType['entities']) {
  if (!entities || entities.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_entities (
      article_id, entity_name, entity_type, entity_url
    ) VALUES (?, ?, ?, ?)
  `);
  
  for (const entity of entities) {
    stmt.run(articleId, entity.name, entity.type, entity.url || null);
  }
}

/**
 * Insert tags for an article
 */
function insertArticleTags(articleId: string, tags: string[]) {
  if (!tags || tags.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_tags (
      article_id, tag
    ) VALUES (?, ?)
  `);
  
  for (const tag of tags) {
    stmt.run(articleId, tag);
  }
}

/**
 * Insert sources for an article
 */
function insertArticleSources(articleId: string, sources: ArticleType['sources']) {
  if (!sources || sources.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_sources (
      article_id, url, title, website, friendly_name, date
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const source of sources) {
    stmt.run(
      articleId,
      source.url,
      source.title,
      source.website || null,
      source.friendly_name || (source as any).name || null, // Support both friendly_name (new schema) and name (old JSON)
      source.date || null
    );
  }
}

/**
 * Insert events for an article
 */
function insertArticleEvents(articleId: string, events: ArticleType['events']) {
  if (!events || events.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_events (
      article_id, datetime, summary
    ) VALUES (?, ?, ?)
  `);
  
  for (const event of events) {
    stmt.run(articleId, event.datetime, event.summary);
  }
}

/**
 * Insert MITRE techniques for an article
 */
function insertArticleMitreTechniques(articleId: string, techniques: ArticleType['mitre_techniques']) {
  if (!techniques || techniques.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_mitre_techniques (
      article_id, technique_id, name, tactic
    ) VALUES (?, ?, ?, ?)
  `);
  
  for (const technique of techniques) {
    stmt.run(
      articleId,
      technique.id,
      technique.name,
      technique.tactic || null
    );
  }
}

/**
 * Insert impact scope for an article
 */
function insertArticleImpactScope(articleId: string, impactScope: ArticleType['impact_scope']) {
  if (!impactScope) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_impact_scope (
      article_id, geographic_scope, countries_affected, industries_affected,
      companies_affected, people_affected_estimate, governments_affected, other_affected
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    articleId,
    impactScope.geographic_scope || null,
    impactScope.countries_affected ? JSON.stringify(impactScope.countries_affected) : null,
    impactScope.industries_affected ? JSON.stringify(impactScope.industries_affected) : null,
    impactScope.companies_affected ? JSON.stringify(impactScope.companies_affected) : null,
    impactScope.people_affected_estimate || null,
    impactScope.governments_affected ? JSON.stringify(impactScope.governments_affected) : null,
    impactScope.other_affected ? JSON.stringify(impactScope.other_affected) : null
  );
}

/**
 * Insert IOCs for an article
 */
function insertArticleIOCs(articleId: string, iocs: ArticleType['iocs']) {
  if (!iocs || iocs.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_iocs (
      article_id, type, value, description, source
    ) VALUES (?, ?, ?, ?, ?)
  `);
  
  for (const ioc of iocs) {
    stmt.run(
      articleId,
      ioc.type,
      ioc.value,
      ioc.description || null,
      ioc.source || null
    );
  }
}

/**
 * Insert cyber observables for an article
 */
function insertArticleCyberObservables(articleId: string, observables: ArticleType['cyber_observables']) {
  if (!observables || observables.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_cyber_observables (
      article_id, type, value, description, context, confidence
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const observable of observables) {
    stmt.run(
      articleId,
      observable.type,
      observable.value,
      observable.description,
      observable.context,
      observable.confidence
    );
  }
}

/**
 * Insert MITRE mitigations for an article
 */
function insertArticleMitreMitigations(articleId: string, mitigations: ArticleType['mitre_mitigations']) {
  if (!mitigations || mitigations.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_mitre_mitigations (
      article_id, mitigation_id, name, domain, description, d3fend_techniques
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const mitigation of mitigations) {
    stmt.run(
      articleId,
      mitigation.id,
      mitigation.name,
      mitigation.domain || null,
      mitigation.description || null,
      mitigation.d3fend_techniques ? JSON.stringify(mitigation.d3fend_techniques) : null
    );
  }
}

/**
 * Insert D3FEND countermeasures for an article
 */
function insertArticleD3FENDCountermeasures(articleId: string, countermeasures: ArticleType['d3fend_countermeasures']) {
  if (!countermeasures || countermeasures.length === 0) return;
  
  const stmt = db.prepare(`
    INSERT INTO article_d3fend_countermeasures (
      article_id, technique_id, technique_name, url, recommendation, mitre_mitigation_id
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const countermeasure of countermeasures) {
    stmt.run(
      articleId,
      countermeasure.technique_id,
      countermeasure.technique_name,
      countermeasure.url,
      countermeasure.recommendation,
      countermeasure.mitre_mitigation_id || null
    );
  }
}

/**
 * Main execution
 */
function main() {
  console.log('📋 Step 1: Fetching structured news...');
  
  // Get structured news for target date
  const advisory = getStructuredNews(targetDate);
  
  if (!advisory) {
    const errorMsg = `No structured news found for ${targetDate}`;
    console.error(`❌ ${errorMsg}`);
    console.error('   Run news-structured.ts first to generate structured news');
    logger.logSkip(errorMsg);
    db.close();
    process.exit(1);
  }
  
  console.log(`   ✅ Found advisory with ${advisory.articles.length} articles\n`);
  
  // Check for existing data
  console.log('📋 Step 2: Checking for existing data...');
  
  const existingArticleCount = checkExistingArticles(targetDate);
  if (existingArticleCount > 0) {
    console.error(`❌ Found ${existingArticleCount} existing articles for ${targetDate}`);
    console.error('   Delete them first or use a different date');
    process.exit(1);
  }
  
  // Check if articles already exist (not publications - those are created in Step 5)
  const existingArticles = checkExistingArticles(targetDate);
  if (existingArticles) {
    console.error(`❌ Articles already exist for ${targetDate}`);
    console.error('   Delete them first or use a different date');
    process.exit(1);
  }
  
  console.log('   ✅ No existing data found\n');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN - Would insert:');
    console.log(`   - ${advisory.articles.length} articles`);
    console.log(`   - ${advisory.articles.reduce((sum, a) => sum + (a.cves?.length || 0), 0)} CVEs`);
    console.log(`   - ${advisory.articles.reduce((sum, a) => sum + (a.entities?.length || 0), 0)} entities`);
    console.log(`   - ${advisory.articles.reduce((sum, a) => sum + (a.tags?.length || 0), 0)} tags`);
    console.log(`   - ${advisory.articles.reduce((sum, a) => sum + (a.sources?.length || 0), 0)} sources`);
    console.log(`   - ${advisory.articles.reduce((sum, a) => sum + (a.events?.length || 0), 0)} events`);
    console.log(`   - ${advisory.articles.reduce((sum, a) => sum + (a.mitre_techniques?.length || 0), 0)} MITRE ATT&CK techniques`);
    console.log(`   - ${advisory.articles.reduce((sum, a) => sum + (a.iocs?.length || 0), 0)} IOCs`);
    console.log(`   - ${advisory.articles.reduce((sum, a) => sum + (a.cyber_observables?.length || 0), 0)} cyber observables`);
    console.log(`   - ${advisory.articles.reduce((sum, a) => sum + (a.d3fend_countermeasures?.length || 0), 0)} D3FEND countermeasures\n`);
    return;
  }
  
  // Start transaction
  console.log('📋 Step 3: Inserting articles...');
  
  const insertTransaction = db.transaction(() => {
    const articleIds: string[] = [];
    let insertedCount = 0;
    
    for (const article of advisory.articles) {
      try {
        // Insert main article FIRST (for foreign key constraints)
        insertArticle(article, targetDate);
        articleIds.push(article.id);
        
        // Then insert FTS entry
        insertArticleFTS(article);
        
        // Then insert supporting data (all have FK to articles.id)
        insertArticleCVEs(article.id, article.cves);
        insertArticleEntities(article.id, article.entities);
        insertArticleTags(article.id, article.tags);
        insertArticleSources(article.id, article.sources);
        insertArticleEvents(article.id, article.events);
        insertArticleMitreTechniques(article.id, article.mitre_techniques);
        insertArticleMitreMitigations(article.id, article.mitre_mitigations);
        insertArticleImpactScope(article.id, article.impact_scope);
        insertArticleIOCs(article.id, article.iocs);
        insertArticleCyberObservables(article.id, article.cyber_observables);
        insertArticleD3FENDCountermeasures(article.id, article.d3fend_countermeasures);
        
        insertedCount++;
        console.log(`   ✅ Inserted article ${insertedCount}/${advisory.articles.length}: ${article.slug}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to insert article ${article.id}: ${error.message}`);
        throw error;
      }
    }
    
    // NOTE: Publication creation moved to Step 5 (generate-publication.ts)
    // This ensures only NEW articles (after duplicate detection) are published
    
    return { insertedCount, articleIds };
  });
  
  try {
    const result = insertTransaction();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS - Step 3 Complete\n');
    console.log(`   Articles inserted: ${result.insertedCount}`);
    console.log(`   All articles have resolution = NULL (ready for duplicate detection)\n`);
    console.log('Next Steps:');
    console.log(`   1. Run Step 4: check-duplicates-v3.ts --date ${targetDate}`);
    console.log(`   2. Run Step 5: generate-publication.ts --date ${targetDate}`);
    console.log('   3. Run Steps 6-7 for JSON/RSS output\n');
    
    // Log success
    logger.logSuccess({
      articlesInserted: result.insertedCount,
      metadata: {
        articleIds: result.articleIds,
      },
    });
    
  } catch (error: any) {
    console.error('\n❌ ERROR - Transaction rolled back');
    console.error(`   ${error.message}\n`);
    
    // Log error
    logger.logError({ error });
    
    db.close();
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run main function
main();
