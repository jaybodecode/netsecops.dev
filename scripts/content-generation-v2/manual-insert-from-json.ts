#!/usr/bin/env node
/**
 * Manual Insert from Structured JSON
 * 
 * Inserts articles from a structured news JSON file directly into the database
 * without re-running the generation step. Useful when you have a good JSON file
 * but want to insert it with updated schema/code.
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/manual-insert-from-json.ts <json-file-path>
 * 
 * Example:
 *   npx tsx scripts/content-generation-v2/manual-insert-from-json.ts tmp/news-structured_2025-10-16_2025-10-18T02-25-55.json
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DB_PATH = 'logs/content-generation-v2.db';

interface StructuredNewsFile {
  articles: any[];
  metadata?: {
    date: string;
    total_raw_results: number;
    timestamp: string;
  };
}

// Get JSON file path from command line
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('❌ Error: Please provide a JSON file path');
  console.error('Usage: npx tsx scripts/content-generation-v2/manual-insert-from-json.ts <json-file-path>');
  process.exit(1);
}

const absolutePath = resolve(jsonFilePath);
console.log(`📄 Reading JSON file: ${absolutePath}`);

// Read and parse JSON
let data: StructuredNewsFile;
try {
  const jsonContent = readFileSync(absolutePath, 'utf-8');
  data = JSON.parse(jsonContent);
} catch (error) {
  console.error(`❌ Error reading JSON file: ${error}`);
  process.exit(1);
}

if (!data.articles || !Array.isArray(data.articles)) {
  console.error('❌ Error: Invalid JSON structure - missing articles array');
  process.exit(1);
}

console.log(`✅ Found ${data.articles.length} articles in JSON file`);
console.log('');

// Open database
const db = new Database(DB_PATH);
db.pragma('foreign_keys = OFF'); // Disable for bulk insert

// Prepare statements
const insertArticleStmt = db.prepare(`
  INSERT OR REPLACE INTO articles (
    id, slug, headline, title, summary, full_report,
    meta_description, keywords, category, severity, 
    pub_date, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertEntityStmt = db.prepare(`
  INSERT OR IGNORE INTO article_entities (article_id, entity_name, entity_type, entity_url)
  VALUES (?, ?, ?, ?)
`);

const insertCVEStmt = db.prepare(`
  INSERT OR IGNORE INTO article_cves (article_id, cve_id, description, cvss_score, severity, kev)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertMITREStmt = db.prepare(`
  INSERT OR IGNORE INTO article_mitre_techniques (article_id, technique_id, technique_name, tactic)
  VALUES (?, ?, ?, ?)
`);

const insertSourceStmt = db.prepare(`
  INSERT OR IGNORE INTO article_sources (article_id, url, title, domain, published_date)
  VALUES (?, ?, ?, ?, ?)
`);

const insertEventStmt = db.prepare(`
  INSERT OR IGNORE INTO article_events (article_id, datetime, summary)
  VALUES (?, ?, ?)
`);

const insertIOCStmt = db.prepare(`
  INSERT OR IGNORE INTO article_iocs (article_id, type, value, description, source)
  VALUES (?, ?, ?, ?, ?)
`);

const insertCyberObservableStmt = db.prepare(`
  INSERT OR IGNORE INTO article_cyber_observables (article_id, type, value, description, context, confidence)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertD3FENDStmt = db.prepare(`
  INSERT OR IGNORE INTO article_d3fend_countermeasures (article_id, technique_id, technique_name, recommendation)
  VALUES (?, ?, ?, ?)
`);

const insertImpactScopeStmt = db.prepare(`
  INSERT OR REPLACE INTO article_impact_scope (
    article_id, geographic_scope, industries_affected, countries_affected,
    companies_affected, people_affected_estimate, financial_impact_estimate,
    regulatory_implications
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Helper functions
function insertArticleEntities(articleId: string, entities: any[]) {
  if (!entities || entities.length === 0) return;
  
  for (const entity of entities) {
    insertEntityStmt.run(
      articleId,
      entity.name,
      entity.type,
      entity.url || null
    );
  }
}

function insertArticleCVEs(articleId: string, cves: any[]) {
  if (!cves || cves.length === 0) return;
  
  for (const cve of cves) {
    const cveId = typeof cve === 'string' ? cve : cve.id;
    const description = typeof cve === 'object' ? cve.description : null;
    const cvssScore = typeof cve === 'object' ? cve.cvss_score : null;
    const severity = typeof cve === 'object' ? cve.severity : null;
    const kev = typeof cve === 'object' ? (cve.kev ? 1 : 0) : 0;
    
    insertCVEStmt.run(articleId, cveId, description, cvssScore, severity, kev);
  }
}

function insertArticleMITRETechniques(articleId: string, techniques: any[]) {
  if (!techniques || techniques.length === 0) return;
  
  for (const technique of techniques) {
    insertMITREStmt.run(
      articleId,
      technique.id,
      technique.name,
      technique.tactic || null
    );
  }
}

function insertArticleSources(articleId: string, sources: any[]) {
  if (!sources || sources.length === 0) return;
  
  for (const source of sources) {
    // Use name field if available, otherwise website or extract from URL
    const domain = source.name || source.website || new URL(source.url).hostname;
    const publishedDate = source.date || source.published_date || null;
    
    insertSourceStmt.run(
      articleId,
      source.url,
      source.title,
      domain,
      publishedDate
    );
  }
}

function insertArticleEvents(articleId: string, events: any[]) {
  if (!events || events.length === 0) return;
  
  for (const event of events) {
    insertEventStmt.run(articleId, event.datetime, event.summary);
  }
}

function insertArticleIOCs(articleId: string, iocs: any[]) {
  if (!iocs || iocs.length === 0) return;
  
  for (const ioc of iocs) {
    insertIOCStmt.run(
      articleId,
      ioc.type,
      ioc.value,
      ioc.description || null,
      ioc.source || null
    );
  }
}

function insertArticleCyberObservables(articleId: string, observables: any[]) {
  if (!observables || observables.length === 0) return;
  
  for (const observable of observables) {
    insertCyberObservableStmt.run(
      articleId,
      observable.type,
      observable.value,
      observable.description,
      observable.context,
      observable.confidence
    );
  }
}

function insertArticleD3FENDCountermeasures(articleId: string, countermeasures: any[]) {
  if (!countermeasures || countermeasures.length === 0) return;
  
  for (const cm of countermeasures) {
    insertD3FENDStmt.run(
      articleId,
      cm.technique_id,
      cm.technique_name,
      cm.recommendation
    );
  }
}

function insertArticleImpactScope(articleId: string, impactScope: any) {
  if (!impactScope) return;
  
  insertImpactScopeStmt.run(
    articleId,
    impactScope.geographic_scope || null,
    impactScope.industries_affected ? JSON.stringify(impactScope.industries_affected) : null,
    impactScope.countries_affected ? JSON.stringify(impactScope.countries_affected) : null,
    impactScope.companies_affected ? JSON.stringify(impactScope.companies_affected) : null,
    impactScope.people_affected_estimate || null,
    impactScope.financial_impact_estimate || null,
    impactScope.regulatory_implications ? JSON.stringify(impactScope.regulatory_implications) : null
  );
}

// Insert articles
console.log('🚀 Starting database insert...\n');

let successCount = 0;
let errorCount = 0;

for (const article of data.articles) {
  try {
    // Insert main article
    insertArticleStmt.run(
      article.id,
      article.slug,
      article.headline,
      article.title,
      article.summary,
      article.full_report,
      article.meta_description,
      article.keywords ? JSON.stringify(article.keywords) : null,
      article.category ? JSON.stringify(article.category) : null,
      article.severity || null,
      article.date || new Date().toISOString().split('T')[0],
      new Date().toISOString(),
      new Date().toISOString()
    );
    
    // Insert related data
    insertArticleEntities(article.id, article.entities);
    insertArticleCVEs(article.id, article.cves);
    insertArticleMITRETechniques(article.id, article.mitre_techniques);
    insertArticleSources(article.id, article.sources);
    insertArticleEvents(article.id, article.events);
    insertArticleIOCs(article.id, article.iocs);
    insertArticleCyberObservables(article.id, article.cyber_observables);
    insertArticleD3FENDCountermeasures(article.id, article.d3fend_countermeasures);
    insertArticleImpactScope(article.id, article.impact_scope);
    
    console.log(`✅ ${article.slug}`);
    console.log(`   - Entities: ${article.entities?.length || 0}`);
    console.log(`   - CVEs: ${article.cves?.length || 0}`);
    console.log(`   - MITRE Techniques: ${article.mitre_techniques?.length || 0}`);
    console.log(`   - Sources: ${article.sources?.length || 0}`);
    console.log(`   - IOCs: ${article.iocs?.length || 0}`);
    console.log(`   - Cyber Observables: ${article.cyber_observables?.length || 0}`);
    console.log(`   - D3FEND Countermeasures: ${article.d3fend_countermeasures?.length || 0}`);
    console.log(`   - Impact Scope: ${article.impact_scope ? '✓' : '✗'}`);
    console.log('');
    
    successCount++;
  } catch (error) {
    console.error(`❌ Error inserting article ${article.slug}: ${error}`);
    errorCount++;
  }
}

db.close();

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log(`✅ Successfully inserted: ${successCount} articles`);
if (errorCount > 0) {
  console.log(`❌ Failed: ${errorCount} articles`);
}
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('Next steps:');
console.log('1. Run check-duplicates-v3.ts to verify no duplicates');
console.log('2. Run generate-publication.ts to create daily publication');
console.log('3. Run generate-article-json.ts to create article files');
console.log('4. Run generate-indexes.ts and generate-rss.ts');
