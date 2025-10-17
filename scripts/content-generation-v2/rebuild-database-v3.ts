/**
 * Content Generation V2 - Rebuild Database with V3 Schema
 * 
 * CLEAN SLATE APPROACH:
 * 1. Export raw_search and structured_news data to JSON files
 * 2. Drop and recreate all tables with correct V3 schema
 * 3. Re-import raw_search and structured_news
 * 4. Ready for insert-articles.ts to populate V3 tables
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/rebuild-database-v3.ts
 *   npx tsx scripts/content-generation-v2/rebuild-database-v3.ts --backup-only
 */

import Database from 'better-sqlite3';
import { writeFileSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const DB_PATH = 'logs/content-generation-v2.db';
const BACKUP_DIR = 'logs/backups';
const RAW_SEARCH_BACKUP = `${BACKUP_DIR}/raw-search-backup.json`;
const STRUCTURED_NEWS_BACKUP = `${BACKUP_DIR}/structured-news-backup.json`;

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'backup-only': { type: 'boolean', default: false },
  },
  strict: true,
  allowPositionals: false,
});

const backupOnly = values['backup-only'];

console.log('🔨 Rebuild Database with V3 Schema');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (backupOnly) {
  console.log('   Mode: 📦 BACKUP ONLY (no database changes)\n');
} else {
  console.log('   Mode: 🔥 FULL REBUILD (will drop and recreate tables)\n');
  console.log('⚠️  WARNING: This will drop all article and publication tables!');
  console.log('   raw_search and structured_news data will be preserved.\n');
  console.log('   Press Ctrl+C now to cancel, or wait 3 seconds...\n');
  
  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 3000));
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

/**
 * Step 1: Export raw_search and structured_news to JSON files
 */
function backupSourceData() {
  console.log('📋 Step 1: Backing up source data...\n');
  
  // Export raw_search
  console.log('   Exporting raw_search...');
  const rawSearchData = db.prepare('SELECT * FROM raw_search ORDER BY pub_date').all();
  writeFileSync(RAW_SEARCH_BACKUP, JSON.stringify(rawSearchData, null, 2));
  console.log(`   ✅ Exported ${rawSearchData.length} raw_search records\n`);
  
  // Export structured_news
  console.log('   Exporting structured_news...');
  const structuredNewsData = db.prepare('SELECT * FROM structured_news ORDER BY pub_date').all();
  writeFileSync(STRUCTURED_NEWS_BACKUP, JSON.stringify(structuredNewsData, null, 2));
  console.log(`   ✅ Exported ${structuredNewsData.length} structured_news records\n`);
  
  console.log(`   Backups saved to:`);
  console.log(`   - ${RAW_SEARCH_BACKUP}`);
  console.log(`   - ${STRUCTURED_NEWS_BACKUP}\n`);
}

/**
 * Step 2: Drop old tables and create V3 schema
 */
function rebuildSchema() {
  console.log('📋 Step 2: Rebuilding database schema...\n');
  
  // Drop all article-related tables
  console.log('   Dropping old tables...');
  db.exec(`
    DROP TABLE IF EXISTS articles_fts;
    DROP TABLE IF EXISTS articles;
    DROP TABLE IF EXISTS article_cves;
    DROP TABLE IF EXISTS article_entities;
    DROP TABLE IF EXISTS article_tags;
    DROP TABLE IF EXISTS article_sources;
    DROP TABLE IF EXISTS article_events;
    DROP TABLE IF EXISTS article_mitre_techniques;
    DROP TABLE IF EXISTS article_impact_scope;
    DROP TABLE IF EXISTS publications;
    DROP TABLE IF EXISTS articles_meta;
    DROP TABLE IF EXISTS article_resolutions;
    DROP TABLE IF EXISTS article_updates;
    DROP TABLE IF EXISTS publication_articles;
    DROP TABLE IF EXISTS published_articles;
    DROP TABLE IF EXISTS raw_search;
    DROP TABLE IF EXISTS structured_news;
  `);
  console.log('   ✅ Dropped old tables\n');
  
  // Recreate raw_search and structured_news first
  console.log('   Creating raw_search table...');
  db.exec(`
    CREATE TABLE raw_search (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pub_date TEXT NOT NULL,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      data TEXT NOT NULL
    )
  `);
  
  console.log('   Creating structured_news table...');
  db.exec(`
    CREATE TABLE structured_news (
      pub_id TEXT PRIMARY KEY,
      pub_date TEXT NOT NULL,
      pub_type TEXT NOT NULL DEFAULT 'daily',
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      data TEXT NOT NULL,
      headline TEXT NOT NULL,
      total_articles INTEGER NOT NULL,
      date_range TEXT NOT NULL
    )
  `);
  console.log('   ✅ Created source data tables\n');
  
  // Create V3 articles table
  console.log('   Creating articles table...');
  db.exec(`
    CREATE TABLE articles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      
      -- Content
      headline TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      full_report TEXT NOT NULL,
      twitter_post TEXT,
      meta_description TEXT,
      
      -- Classification
      category TEXT NOT NULL,  -- JSON array
      severity TEXT CHECK(severity IN ('critical', 'high', 'medium', 'low', 'informational')),
      article_type TEXT,
      keywords TEXT,  -- JSON array
      reading_time_minutes INTEGER,
      
      -- Dates
      pub_date TEXT,
      extract_datetime TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      
      -- V3 Resolution Tracking
      resolution TEXT CHECK(resolution IS NULL OR resolution IN ('NEW', 'SKIP-FTS5', 'SKIP-LLM', 'SKIP-UPDATE', 'UPDATE')),
      similarity_score REAL,
      matched_article_id TEXT,
      skip_reasoning TEXT
    )
  `);
  console.log('   ✅ Created articles table\n');
  
  // Create FTS5 virtual table
  console.log('   Creating articles_fts (FTS5)...');
  db.exec(`
    CREATE VIRTUAL TABLE articles_fts USING fts5(
      article_id UNINDEXED,
      headline,
      summary,
      full_report,
      tokenize = 'porter unicode61 remove_diacritics 1'
    )
  `);
  console.log('   ✅ Created articles_fts\n');
  
  // Create supporting tables
  console.log('   Creating article_cves...');
  db.exec(`
    CREATE TABLE article_cves (
      article_id TEXT NOT NULL,
      cve_id TEXT NOT NULL,
      cvss_score REAL,
      cvss_version TEXT,
      severity TEXT,
      kev INTEGER DEFAULT 0,
      PRIMARY KEY (article_id, cve_id)
    )
  `);
  
  console.log('   Creating article_entities...');
  db.exec(`
    CREATE TABLE article_entities (
      article_id TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      PRIMARY KEY (article_id, entity_name, entity_type)
    )
  `);
  
  console.log('   Creating article_tags...');
  db.exec(`
    CREATE TABLE article_tags (
      article_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (article_id, tag)
    )
  `);
  
  console.log('   Creating article_sources...');
  db.exec(`
    CREATE TABLE article_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      website TEXT,
      date TEXT
    )
  `);
  
  console.log('   Creating article_events...');
  db.exec(`
    CREATE TABLE article_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      datetime TEXT NOT NULL,
      summary TEXT NOT NULL
    )
  `);
  
  console.log('   Creating article_mitre_techniques...');
  db.exec(`
    CREATE TABLE article_mitre_techniques (
      article_id TEXT NOT NULL,
      technique_id TEXT NOT NULL,
      name TEXT NOT NULL,
      tactic TEXT,
      PRIMARY KEY (article_id, technique_id)
    )
  `);
  
  console.log('   Creating article_impact_scope...');
  db.exec(`
    CREATE TABLE article_impact_scope (
      article_id TEXT PRIMARY KEY,
      geographic_scope TEXT,
      countries_affected TEXT,  -- JSON array
      industries_affected TEXT,  -- JSON array
      companies_affected TEXT,  -- JSON array
      people_affected_estimate TEXT,
      governments_affected TEXT,  -- JSON array
      other_affected TEXT  -- JSON array
    )
  `);
  console.log('   ✅ Created all supporting tables\n');
  
  // Create publications table
  console.log('   Creating publications table...');
  db.exec(`
    CREATE TABLE publications (
      id TEXT PRIMARY KEY,
      headline TEXT NOT NULL,
      summary TEXT NOT NULL,
      article_count INTEGER DEFAULT 0,
      article_ids TEXT DEFAULT '[]',  -- JSON array of article IDs
      pub_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    )
  `);
  console.log('   ✅ Created publications table\n');
  
  // Create indexes
  console.log('   Creating indexes...');
  db.exec(`
    CREATE INDEX idx_articles_created_at ON articles(created_at);
    CREATE INDEX idx_articles_resolution ON articles(resolution);
    CREATE INDEX idx_articles_matched_article_id ON articles(matched_article_id);
    CREATE INDEX idx_article_cves_cve_id ON article_cves(cve_id);
    CREATE INDEX idx_article_entities_entity_name ON article_entities(entity_name);
    CREATE INDEX idx_article_tags_tag ON article_tags(tag);
    CREATE INDEX idx_publications_pub_date ON publications(pub_date);
  `);
  console.log('   ✅ Created indexes\n');
}

/**
 * Step 3: Re-import raw_search and structured_news
 */
function restoreSourceData() {
  console.log('📋 Step 3: Restoring source data...\n');
  
  // Import raw_search
  console.log('   Importing raw_search...');
  const rawSearchData = JSON.parse(readFileSync(RAW_SEARCH_BACKUP, 'utf-8'));
  const insertRawSearch = db.prepare(`
    INSERT INTO raw_search (id, pub_date, generated_at, data)
    VALUES (?, ?, ?, ?)
  `);
  
  const rawSearchTransaction = db.transaction((records: any[]) => {
    for (const record of records) {
      insertRawSearch.run(
        record.id,
        record.pub_date,
        record.generated_at,
        record.data
      );
    }
  });
  
  rawSearchTransaction(rawSearchData);
  console.log(`   ✅ Imported ${rawSearchData.length} raw_search records\n`);
  
  // Import structured_news
  console.log('   Importing structured_news...');
  const structuredNewsData = JSON.parse(readFileSync(STRUCTURED_NEWS_BACKUP, 'utf-8'));
  const insertStructuredNews = db.prepare(`
    INSERT INTO structured_news (pub_id, pub_date, pub_type, generated_at, data, headline, total_articles, date_range)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const structuredNewsTransaction = db.transaction((records: any[]) => {
    for (const record of records) {
      insertStructuredNews.run(
        record.pub_id,
        record.pub_date,
        record.pub_type,
        record.generated_at,
        record.data,
        record.headline,
        record.total_articles,
        record.date_range
      );
    }
  });
  
  structuredNewsTransaction(structuredNewsData);
  console.log(`   ✅ Imported ${structuredNewsData.length} structured_news records\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    // Step 1: Backup
    backupSourceData();
    
    if (backupOnly) {
      console.log('✅ Backup complete! Database unchanged.\n');
      return;
    }
    
    // Step 2: Rebuild schema
    rebuildSchema();
    
    // Step 3: Restore source data
    restoreSourceData();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS - Database rebuilt with V3 schema!\n');
    console.log('Next Steps:');
    console.log('   1. Run: npx tsx insert-articles.ts --date 2025-10-07');
    console.log('   2. Run for all other dates to populate articles');
    console.log('   3. Run check-duplicates.ts for FTS5 duplicate detection\n');
    
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDatabase backups preserved at:');
    console.error(`   - ${RAW_SEARCH_BACKUP}`);
    console.error(`   - ${STRUCTURED_NEWS_BACKUP}\n`);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run main function
main();
