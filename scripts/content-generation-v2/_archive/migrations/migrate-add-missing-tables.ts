#!/usr/bin/env tsx

/**
 * Add Missing Supporting Tables
 * 
 * Adds tables that were missing from initial V3 migration based on news-structured-schema.ts:
 * - article_sources (url, title, website, date)
 * - article_events (datetime, summary)
 * - article_mitre_techniques (technique_id, name, tactic)
 * - article_impact_scope (geographic, countries, industries, etc.)
 * 
 * Also adds missing fields to articles table:
 * - twitter_post, meta_description, article_type, keywords, reading_time_minutes, title
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/migrate-add-missing-tables.ts
 *   npx tsx scripts/content-generation-v2/migrate-add-missing-tables.ts --dry-run
 * 
 * @created 2025-10-14
 * @version V3.1
 */

import Database from 'better-sqlite3';

const DB_PATH = 'logs/content-generation-v2.db';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

console.log('🔧 Adding Missing Supporting Tables & Fields');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (dryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made\n');
}

// Open database
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

/**
 * Check if table exists
 */
function tableExists(tableName: string): boolean {
  const result = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name=?
  `).get(tableName);
  return !!result;
}

/**
 * Check if column exists in table
 */
function columnExists(tableName: string, columnName: string): boolean {
  const columns = db.pragma(`table_info(${tableName})`) as Array<{ name: string }>;
  return columns.some((col) => col.name === columnName);
}

/**
 * Step 1: Add missing fields to articles table
 */
function addMissingArticleFields() {
  console.log('📋 Step 1: Add missing fields to articles table');
  
  if (!tableExists('articles')) {
    console.log('   ❌ Articles table does not exist\n');
    return;
  }
  
  const fieldsToAdd = [
    { name: 'title', type: 'TEXT', description: 'Article title (different from headline)' },
    { name: 'twitter_post', type: 'TEXT', description: 'Twitter/X post (max 280 chars)' },
    { name: 'meta_description', type: 'TEXT', description: 'SEO meta description' },
    { name: 'article_type', type: 'TEXT', description: 'Schema.org type (NewsArticle, TechArticle, etc.)' },
    { name: 'keywords', type: 'TEXT', description: 'JSON array of SEO keywords' },
    { name: 'reading_time_minutes', type: 'INTEGER', description: 'Estimated reading time' }
  ];
  
  let addedCount = 0;
  
  for (const field of fieldsToAdd) {
    if (!columnExists('articles', field.name)) {
      console.log(`   Adding ${field.name}...`);
      if (!dryRun) {
        db.exec(`ALTER TABLE articles ADD COLUMN ${field.name} ${field.type};`);
      }
      addedCount++;
    }
  }
  
  if (addedCount === 0) {
    console.log('   ✅ All fields already exist');
  } else {
    console.log(`   ✅ Added ${addedCount} field(s)`);
  }
  
  console.log('');
}

/**
 * Step 2: Create article_sources table
 */
function createArticleSourcesTable() {
  console.log('📋 Step 2: Create article_sources table');
  
  if (tableExists('article_sources')) {
    console.log('   ✅ Table already exists\n');
    return;
  }
  
  const sql = `
    CREATE TABLE IF NOT EXISTS article_sources (
      article_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      website TEXT,
      date TEXT,
      PRIMARY KEY (article_id, url),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_sources_article ON article_sources(article_id);
    CREATE INDEX IF NOT EXISTS idx_sources_website ON article_sources(website);
  `;
  
  if (!dryRun) {
    db.exec(sql);
  }
  
  console.log('   ✅ article_sources table created\n');
}

/**
 * Step 3: Create article_events table
 */
function createArticleEventsTable() {
  console.log('📋 Step 3: Create article_events table');
  
  if (tableExists('article_events')) {
    console.log('   ✅ Table already exists\n');
    return;
  }
  
  const sql = `
    CREATE TABLE IF NOT EXISTS article_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      datetime TEXT NOT NULL,
      summary TEXT NOT NULL,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_events_article ON article_events(article_id);
    CREATE INDEX IF NOT EXISTS idx_events_datetime ON article_events(datetime);
  `;
  
  if (!dryRun) {
    db.exec(sql);
  }
  
  console.log('   ✅ article_events table created\n');
}

/**
 * Step 4: Create article_mitre_techniques table
 */
function createArticleMitreTechniquesTable() {
  console.log('📋 Step 4: Create article_mitre_techniques table');
  
  if (tableExists('article_mitre_techniques')) {
    console.log('   ✅ Table already exists\n');
    return;
  }
  
  const sql = `
    CREATE TABLE IF NOT EXISTS article_mitre_techniques (
      article_id TEXT NOT NULL,
      technique_id TEXT NOT NULL,
      technique_name TEXT NOT NULL,
      tactic TEXT,
      PRIMARY KEY (article_id, technique_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_mitre_article ON article_mitre_techniques(article_id);
    CREATE INDEX IF NOT EXISTS idx_mitre_technique ON article_mitre_techniques(technique_id);
    CREATE INDEX IF NOT EXISTS idx_mitre_tactic ON article_mitre_techniques(tactic);
  `;
  
  if (!dryRun) {
    db.exec(sql);
  }
  
  console.log('   ✅ article_mitre_techniques table created\n');
}

/**
 * Step 5: Create article_impact_scope table
 */
function createArticleImpactScopeTable() {
  console.log('📋 Step 5: Create article_impact_scope table');
  
  if (tableExists('article_impact_scope')) {
    console.log('   ✅ Table already exists\n');
    return;
  }
  
  const sql = `
    CREATE TABLE IF NOT EXISTS article_impact_scope (
      article_id TEXT PRIMARY KEY,
      geographic_scope TEXT CHECK(geographic_scope IN ('global', 'regional', 'national', 'local')),
      countries_affected TEXT,
      industries_affected TEXT,
      companies_affected TEXT,
      people_affected_estimate TEXT,
      governments_affected TEXT,
      other_affected TEXT,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_impact_article ON article_impact_scope(article_id);
    CREATE INDEX IF NOT EXISTS idx_impact_scope ON article_impact_scope(geographic_scope);
  `;
  
  if (!dryRun) {
    db.exec(sql);
  }
  
  console.log('   ✅ article_impact_scope table created');
  console.log('   ℹ️  Note: Array fields (countries, industries, etc.) stored as JSON TEXT\n');
}

/**
 * Step 6: Verify schema
 */
function verifySchema() {
  console.log('📋 Step 6: Verify schema');
  
  const checks = [
    { type: 'table', name: 'article_sources', expected: true },
    { type: 'table', name: 'article_events', expected: true },
    { type: 'table', name: 'article_mitre_techniques', expected: true },
    { type: 'table', name: 'article_impact_scope', expected: true },
    { type: 'field', table: 'articles', name: 'title', expected: true },
    { type: 'field', table: 'articles', name: 'twitter_post', expected: true },
    { type: 'field', table: 'articles', name: 'meta_description', expected: true },
    { type: 'field', table: 'articles', name: 'article_type', expected: true },
    { type: 'field', table: 'articles', name: 'keywords', expected: true },
    { type: 'field', table: 'articles', name: 'reading_time_minutes', expected: true }
  ];
  
  let allPass = true;
  
  for (const check of checks) {
    if (check.type === 'table') {
      const exists = tableExists(check.name);
      const status = exists === check.expected ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${exists ? 'exists' : 'missing'}`);
      if (exists !== check.expected) allPass = false;
    } else if (check.type === 'field' && check.table) {
      const exists = columnExists(check.table, check.name);
      const status = exists === check.expected ? '✅' : '❌';
      console.log(`   ${status} ${check.table}.${check.name}: ${exists ? 'present' : 'missing'}`);
      if (exists !== check.expected) allPass = false;
    }
  }
  
  console.log('');
  
  if (allPass) {
    console.log('✅ Schema verification passed!\n');
  } else {
    console.log('❌ Schema verification failed - check errors above\n');
  }
  
  return allPass;
}

/**
 * Display summary
 */
function displaySummary() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Migration Summary\n');
  
  console.log('New Tables Added:');
  console.log('  - article_sources (url, title, website, date)');
  console.log('  - article_events (datetime, summary)');
  console.log('  - article_mitre_techniques (technique_id, name, tactic)');
  console.log('  - article_impact_scope (geographic_scope, countries, industries, etc.)');
  
  console.log('\nNew Fields Added to articles:');
  console.log('  - title (article title)');
  console.log('  - twitter_post (social media)');
  console.log('  - meta_description (SEO)');
  console.log('  - article_type (Schema.org)');
  console.log('  - keywords (JSON array)');
  console.log('  - reading_time_minutes (integer)');
  
  console.log('\nComplete V3 Schema:');
  console.log('  Core Tables:');
  console.log('    - articles (main content with resolution tracking)');
  console.log('    - articles_fts (FTS5 full-text search)');
  console.log('    - publications (with article_ids JSON)');
  
  console.log('  Supporting Tables:');
  console.log('    - article_cves (CVE references)');
  console.log('    - article_entities (threat actors, malware, companies, etc.)');
  console.log('    - article_tags (keywords)');
  console.log('    - article_sources (source URLs and references)');
  console.log('    - article_events (timeline events)');
  console.log('    - article_mitre_techniques (ATT&CK mappings)');
  console.log('    - article_impact_scope (impact analysis)');
  
  console.log('\nStaging Tables:');
  console.log('    - raw_search (Google News raw data)');
  console.log('    - structured_news (LLM processed data)');
  
  console.log('\nNext Steps:');
  console.log('  1. Update V3-DATABASE-SCHEMA.md with new tables');
  console.log('  2. Test with sample data insertion');
  console.log('  3. Proceed to Phase 2: Create insert-articles.ts');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run migration
try {
  addMissingArticleFields();
  createArticleSourcesTable();
  createArticleEventsTable();
  createArticleMitreTechniquesTable();
  createArticleImpactScopeTable();
  
  if (!dryRun) {
    const verified = verifySchema();
    
    if (verified) {
      displaySummary();
      console.log('✅ Migration complete!');
    } else {
      console.log('⚠️  Migration completed with warnings - review output above');
    }
  } else {
    console.log('✅ Dry run complete - no changes made');
    console.log('   Run without --dry-run to apply migration');
  }
  
} catch (error) {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
