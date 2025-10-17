#!/usr/bin/env tsx

/**
 * V3 Schema Migration Script
 * 
 * Migrates database from V2 (entity-based) to V3 (FTS5 full-text similarity)
 * 
 * Key Changes:
 * - Add articles table with resolution tracking
 * - Create articles_fts virtual table (FTS5 with weighted columns)
 * - Update publications table (add article_ids JSON field)
 * - Remove publication_articles linking table
 * - Remove article_updates table (tracked in articles.resolution)
 * - Remove article_resolutions table (tracked in articles.skip_reasoning)
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/migrate-to-fts5-schema.ts
 *   npx tsx scripts/content-generation-v2/migrate-to-fts5-schema.ts --dry-run
 *   npx tsx scripts/content-generation-v2/migrate-to-fts5-schema.ts --backup
 * 
 * @created 2025-10-14
 * @version V3.0
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = 'logs/content-generation-v2.db';
const BACKUP_DIR = 'logs/backups';

interface MigrationOptions {
  dryRun: boolean;
  backup: boolean;
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: MigrationOptions = {
  dryRun: args.includes('--dry-run'),
  backup: args.includes('--backup') || !args.includes('--no-backup')
};

console.log('🚀 V3 Schema Migration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (options.dryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made\n');
}

// Backup database if requested
if (options.backup && !options.dryRun) {
  console.log('📦 Creating database backup...');
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupPath = path.join(BACKUP_DIR, `content-generation-v2-pre-v3-${timestamp}.db`);
  
  fs.copyFileSync(DB_PATH, backupPath);
  console.log(`✅ Backup created: ${backupPath}\n`);
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
 * Step 1: Create articles table with resolution tracking
 */
function createArticlesTable() {
  console.log('📋 Step 1: Create articles table with resolution tracking');
  
  if (tableExists('articles')) {
    console.log('   ⚠️  Table "articles" already exists - checking schema...');
    
    // Check if resolution field exists
    if (!columnExists('articles', 'resolution')) {
      console.log('   Adding resolution tracking fields...');
      if (!options.dryRun) {
        db.exec(`
          ALTER TABLE articles ADD COLUMN resolution TEXT 
          CHECK(resolution IN ('NEW', 'SKIP-FTS5', 'SKIP-LLM', 'SKIP-UPDATE'));
        `);
        db.exec(`ALTER TABLE articles ADD COLUMN similarity_score REAL;`);
        db.exec(`ALTER TABLE articles ADD COLUMN matched_article_id TEXT;`);
        db.exec(`ALTER TABLE articles ADD COLUMN skip_reasoning TEXT;`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_resolution ON articles(resolution);`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_matched ON articles(matched_article_id);`);
      }
      console.log('   ✅ Resolution tracking fields added');
    } else {
      console.log('   ✅ Resolution tracking already exists');
    }
    return;
  }
  
  const sql = `
    CREATE TABLE IF NOT EXISTS articles (
      -- Primary identification
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      
      -- Content
      headline TEXT NOT NULL,
      summary TEXT NOT NULL,
      full_report TEXT NOT NULL,
      
      -- Source metadata
      source_url TEXT NOT NULL,
      source_domain TEXT,
      published_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      -- Classification
      category TEXT,
      threat_level INTEGER CHECK(threat_level BETWEEN 1 AND 5),
      
      -- Quality scores
      relevance_score REAL,
      confidence_score REAL,
      
      -- V3: Resolution tracking
      resolution TEXT CHECK(resolution IN ('NEW', 'SKIP-FTS5', 'SKIP-LLM', 'SKIP-UPDATE')),
      similarity_score REAL,
      matched_article_id TEXT,
      skip_reasoning TEXT,
      
      -- Foreign key
      FOREIGN KEY (matched_article_id) REFERENCES articles(id) ON DELETE SET NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(published_date);
    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at);
    CREATE INDEX IF NOT EXISTS idx_articles_resolution ON articles(resolution);
    CREATE INDEX IF NOT EXISTS idx_articles_matched ON articles(matched_article_id);
    CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles(source_domain);
  `;
  
  if (!options.dryRun) {
    db.exec(sql);
  }
  
  console.log('   ✅ Articles table created with indexes\n');
}

/**
 * Step 2: Create articles_fts virtual table (FTS5)
 */
function createFTS5Table() {
  console.log('📋 Step 2: Create articles_fts virtual table (FTS5)');
  
  if (tableExists('articles_fts')) {
    console.log('   ⚠️  Table "articles_fts" already exists');
    
    // Drop and recreate to ensure correct schema
    console.log('   Dropping and recreating FTS5 table...');
    if (!options.dryRun) {
      db.exec(`DROP TABLE IF EXISTS articles_fts;`);
    }
  }
  
  const sql = `
    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
      article_id UNINDEXED,
      headline,
      summary,
      full_report,
      tokenize='porter unicode61 remove_diacritics 1'
    );
  `;
  
  if (!options.dryRun) {
    db.exec(sql);
  }
  
  console.log('   ✅ FTS5 table created');
  console.log('   ℹ️  Weighted queries use: bm25(articles_fts, 10.0, 5.0, 1.0)');
  console.log('      (headline: 10x, summary: 5x, full_report: 1x)\n');
}

/**
 * Step 3: Update publications table
 */
function updatePublicationsTable() {
  console.log('📋 Step 3: Update publications table');
  
  if (!tableExists('publications')) {
    console.log('   Creating publications table...');
    const sql = `
      CREATE TABLE IF NOT EXISTS publications (
        id TEXT PRIMARY KEY,
        pub_date TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        article_ids TEXT NOT NULL,
        article_count INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_publications_date ON publications(pub_date);
    `;
    
    if (!options.dryRun) {
      db.exec(sql);
    }
    console.log('   ✅ Publications table created\n');
    return;
  }
  
  // Check and add each field individually
  let addedFields = 0;
  
  if (!columnExists('publications', 'article_ids')) {
    console.log('   Adding article_ids JSON field...');
    if (!options.dryRun) {
      db.exec(`ALTER TABLE publications ADD COLUMN article_ids TEXT NOT NULL DEFAULT '[]';`);
    }
    addedFields++;
  }
  
  if (!columnExists('publications', 'article_count')) {
    console.log('   Adding article_count field...');
    if (!options.dryRun) {
      db.exec(`ALTER TABLE publications ADD COLUMN article_count INTEGER NOT NULL DEFAULT 0;`);
    }
    addedFields++;
  }
  
  if (!columnExists('publications', 'updated_at')) {
    console.log('   Adding updated_at field...');
    if (!options.dryRun) {
      db.exec(`ALTER TABLE publications ADD COLUMN updated_at TEXT;`);
    }
    addedFields++;
  }
  
  if (addedFields === 0) {
    console.log('   ✅ All required fields already exist');
  } else {
    console.log(`   ✅ Added ${addedFields} field(s) to publications table`);
  }
  
  console.log('');
}

/**
 * Step 3.5: Create supporting tables
 */
function createSupportingTables() {
  console.log('📋 Step 3.5: Create supporting tables');
  
  const tables = [
    {
      name: 'article_cves',
      sql: `
        CREATE TABLE IF NOT EXISTS article_cves (
          article_id TEXT NOT NULL,
          cve_id TEXT NOT NULL,
          cvss_score REAL,
          severity TEXT CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE')),
          PRIMARY KEY (article_id, cve_id),
          FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_cves_article ON article_cves(article_id);
        CREATE INDEX IF NOT EXISTS idx_cves_id ON article_cves(cve_id);
        CREATE INDEX IF NOT EXISTS idx_cves_severity ON article_cves(severity);
      `
    },
    {
      name: 'article_entities',
      sql: `
        CREATE TABLE IF NOT EXISTS article_entities (
          article_id TEXT NOT NULL,
          entity_name TEXT NOT NULL,
          entity_type TEXT NOT NULL CHECK(entity_type IN ('threat_actor', 'malware', 'product', 'company')),
          confidence REAL,
          PRIMARY KEY (article_id, entity_name, entity_type),
          FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_entities_article ON article_entities(article_id);
        CREATE INDEX IF NOT EXISTS idx_entities_name ON article_entities(entity_name);
        CREATE INDEX IF NOT EXISTS idx_entities_type ON article_entities(entity_type);
      `
    },
    {
      name: 'article_tags',
      sql: `
        CREATE TABLE IF NOT EXISTS article_tags (
          article_id TEXT NOT NULL,
          tag TEXT NOT NULL,
          PRIMARY KEY (article_id, tag),
          FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_tags_article ON article_tags(article_id);
        CREATE INDEX IF NOT EXISTS idx_tags_tag ON article_tags(tag);
      `
    }
  ];
  
  let createdCount = 0;
  
  for (const table of tables) {
    if (!tableExists(table.name)) {
      console.log(`   Creating ${table.name} table...`);
      if (!options.dryRun) {
        db.exec(table.sql);
      }
      createdCount++;
    }
  }
  
  if (createdCount === 0) {
    console.log('   ✅ All supporting tables already exist');
  } else {
    console.log(`   ✅ Created ${createdCount} supporting table(s)`);
  }
  
  console.log('');
}

/**
 * Step 4: Remove deprecated tables
 */
function removeDeprecatedTables() {
  console.log('📋 Step 4: Remove deprecated V2 tables');
  
  const deprecatedTables = [
    'publication_articles',
    'article_updates',
    'article_resolutions'
  ];
  
  let removedCount = 0;
  
  for (const tableName of deprecatedTables) {
    if (tableExists(tableName)) {
      console.log(`   Removing ${tableName}...`);
      if (!options.dryRun) {
        db.exec(`DROP TABLE IF EXISTS ${tableName};`);
      }
      removedCount++;
    }
  }
  
  if (removedCount === 0) {
    console.log('   ℹ️  No deprecated tables found');
  } else {
    console.log(`   ✅ Removed ${removedCount} deprecated table(s)`);
  }
  
  console.log('');
}

/**
 * Step 5: Migrate existing data (if any)
 */
function migrateExistingData() {
  console.log('📋 Step 5: Migrate existing data');
  
  // Check if published_articles exists (V2 table)
  if (!tableExists('published_articles')) {
    console.log('   ℹ️  No V2 data to migrate (published_articles table not found)\n');
    return;
  }
  
  // Check if articles table exists before querying
  if (!tableExists('articles')) {
    console.log('   ⚠️  Articles table does not exist yet (dry-run mode)\n');
    return;
  }
  
  // Check if articles already has data
  const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number };
  if (articleCount.count > 0) {
    console.log(`   ℹ️  Articles table already has ${articleCount.count} records - skipping migration\n`);
    return;
  }
  
  console.log('   Migrating data from published_articles to articles...');
  
  if (!options.dryRun) {
    const publishedArticles = db.prepare(`
      SELECT * FROM published_articles
    `).all();
    
    const insertArticle = db.prepare(`
      INSERT INTO articles (
        id, slug, headline, summary, full_report,
        source_url, source_domain, published_date,
        category, threat_level, relevance_score, confidence_score,
        resolution
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
    `);
    
    const insertFTS = db.prepare(`
      INSERT INTO articles_fts (article_id, headline, summary, full_report)
      VALUES (?, ?, ?, ?)
    `);
    
    let migratedCount = 0;
    
    for (const article of publishedArticles as any[]) {
      try {
        insertArticle.run(
          article.id,
          article.slug,
          article.headline,
          article.summary,
          article.full_report,
          article.source_url,
          article.source_domain,
          article.published_date,
          article.category,
          article.threat_level,
          article.relevance_score,
          article.confidence_score
        );
        
        insertFTS.run(
          article.id,
          article.headline,
          article.summary,
          article.full_report
        );
        
        migratedCount++;
      } catch (error) {
        console.warn(`   ⚠️  Failed to migrate article ${article.id}: ${error}`);
      }
    }
    
    console.log(`   ✅ Migrated ${migratedCount} articles from published_articles`);
  }
  
  console.log('');
}

/**
 * Step 6: Verify schema
 */
function verifySchema() {
  console.log('📋 Step 6: Verify schema');
  
  const checks = [
    { name: 'articles', expected: true },
    { name: 'articles_fts', expected: true },
    { name: 'publications', expected: true },
    { name: 'article_cves', expected: true },
    { name: 'article_entities', expected: true },
    { name: 'article_tags', expected: true },
    { name: 'structured_news', expected: true }
  ];
  
  let allPass = true;
  
  for (const check of checks) {
    const exists = tableExists(check.name);
    const status = exists === check.expected ? '✅' : '❌';
    console.log(`   ${status} ${check.name}: ${exists ? 'exists' : 'missing'}`);
    if (exists !== check.expected) allPass = false;
  }
  
  console.log('');
  
  // Check resolution constraint
  if (tableExists('articles')) {
    const hasResolution = columnExists('articles', 'resolution');
    const status = hasResolution ? '✅' : '❌';
    console.log(`   ${status} articles.resolution field: ${hasResolution ? 'present' : 'missing'}`);
    if (!hasResolution) allPass = false;
  }
  
  // Check article_ids in publications
  if (tableExists('publications')) {
    const hasArticleIds = columnExists('publications', 'article_ids');
    const status = hasArticleIds ? '✅' : '❌';
    console.log(`   ${status} publications.article_ids field: ${hasArticleIds ? 'present' : 'missing'}`);
    if (!hasArticleIds) allPass = false;
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
  
  // Count records in key tables (only if they exist)
  console.log('Record Counts:');
  
  if (tableExists('articles')) {
    const count = (db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number }).count;
    console.log(`  - articles: ${count}`);
  } else {
    console.log(`  - articles: N/A (table not created)`);
  }
  
  if (tableExists('articles_fts')) {
    const count = (db.prepare('SELECT COUNT(*) as count FROM articles_fts').get() as { count: number }).count;
    console.log(`  - articles_fts: ${count}`);
  } else {
    console.log(`  - articles_fts: N/A (table not created)`);
  }
  
  if (tableExists('publications')) {
    const count = (db.prepare('SELECT COUNT(*) as count FROM publications').get() as { count: number }).count;
    console.log(`  - publications: ${count}`);
  } else {
    console.log(`  - publications: N/A (table not created)`);
  }
  
  if (tableExists('structured_news')) {
    const count = (db.prepare('SELECT COUNT(*) as count FROM structured_news').get() as { count: number }).count;
    console.log(`  - structured_news: ${count}`);
  } else {
    console.log(`  - structured_news: N/A (table not found)`);
  }
  
  console.log('\nNext Steps:');
  console.log('  1. Review V3-DATABASE-SCHEMA.md for complete schema reference');
  console.log('  2. Test FTS5 queries with test-fts5-micro.ts');
  console.log('  3. Proceed to Phase 2: Create insert-articles.ts');
  console.log('\nDocumentation:');
  console.log('  - V3-DATABASE-SCHEMA.md');
  console.log('  - FTS5-SIMILARITY-STRATEGY.md');
  console.log('  - V3-MIGRATION-STRATEGY.md');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run migration
try {
  createArticlesTable();
  createFTS5Table();
  updatePublicationsTable();
  createSupportingTables();
  removeDeprecatedTables();
  migrateExistingData();
  
  if (!options.dryRun) {
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
