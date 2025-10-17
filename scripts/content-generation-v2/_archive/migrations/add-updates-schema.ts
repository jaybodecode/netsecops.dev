/**
 * Add Updates Schema - Migration Script
 * 
 * Adds support for article updates:
 * 1. Add isUpdate column to articles table (default FALSE)
 * 2. Create article_updates table for storing incremental updates
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/add-updates-schema.ts
 *   npx tsx scripts/content-generation-v2/add-updates-schema.ts --dry-run
 */

import 'dotenv/config';
import { Command } from 'commander';
import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';

const DB_PATH = 'logs/content-generation-v2.db';

interface CLIOptions {
  dryRun: boolean;
}

function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('add-updates-schema')
    .description('Add article updates schema to V3 database')
    .option('--dry-run', 'Show SQL without executing', false)
    .parse(process.argv);
  
  return program.opts() as CLIOptions;
}

async function main() {
  console.log('🔧 Adding Updates Schema to V3 Database\n');
  
  const options = parseArgs();
  
  // Check database exists
  if (!existsSync(DB_PATH)) {
    console.error(`❌ Database not found: ${DB_PATH}`);
    process.exit(1);
  }
  
  const db = new Database(DB_PATH);
  
  console.log('📊 Current Schema Status:\n');
  
  // Check if columns/tables already exist
  const articlesInfo = db.pragma('table_info(articles)') as Array<{ name: string }>;
  const hasIsUpdate = articlesInfo.some((col) => col.name === 'isUpdate');
  const hasUpdateCount = articlesInfo.some((col) => col.name === 'updateCount');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
  const hasUpdatesTable = tables.some(t => t.name === 'article_updates');
  
  console.log(`   articles.isUpdate: ${hasIsUpdate ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`   articles.updateCount: ${hasUpdateCount ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`   article_updates table: ${hasUpdatesTable ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log('');
  
  if (hasIsUpdate && hasUpdateCount && hasUpdatesTable) {
    console.log('✅ All update schema components already exist. No changes needed.\n');
    db.close();
    return;
  }
  
  // Build migration SQL
  const migrations: string[] = [];
  
  // 1. Add isUpdate column if missing
  if (!hasIsUpdate) {
    migrations.push(`
-- Add isUpdate column (defaults to FALSE/0)
ALTER TABLE articles ADD COLUMN isUpdate INTEGER DEFAULT 0 CHECK(isUpdate IN (0, 1));
    `.trim());
  }
  
  // 2. Add updateCount column if missing
  if (!hasUpdateCount) {
    migrations.push(`
-- Add updateCount column (defaults to 0)
ALTER TABLE articles ADD COLUMN updateCount INTEGER DEFAULT 0;
    `.trim());
  }
  
  // 3. Create article_updates table if missing
  if (!hasUpdatesTable) {
    migrations.push(`
-- Create article_updates table for storing incremental updates
CREATE TABLE article_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  
  -- Update metadata
  datetime TEXT NOT NULL,              -- ISO 8601 timestamp of when update was published
  summary TEXT NOT NULL,               -- Brief summary (50-150 chars)
  content TEXT NOT NULL,               -- Detailed update content (200-800 chars)
  severity_change TEXT CHECK(severity_change IN ('increased', 'decreased', 'unchanged')),
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
    `.trim());
    
    migrations.push(`
-- Create index for efficient lookups
CREATE INDEX idx_article_updates_article_id ON article_updates(article_id);
    `.trim());
    
    migrations.push(`
-- Create index for chronological ordering
CREATE INDEX idx_article_updates_datetime ON article_updates(datetime);
    `.trim());
  }
  
  // 4. Create article_update_sources table for update-specific sources
  if (!tables.some(t => t.name === 'article_update_sources')) {
    migrations.push(`
-- Create article_update_sources table for sources specific to each update
CREATE TABLE article_update_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  update_id INTEGER NOT NULL,
  article_id TEXT NOT NULL,
  
  -- Source details
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  website TEXT,
  date TEXT,
  
  -- Foreign key
  FOREIGN KEY (update_id) REFERENCES article_updates(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
    `.trim());
    
    migrations.push(`
-- Create index for efficient lookups
CREATE INDEX idx_article_update_sources_update_id ON article_update_sources(update_id);
    `.trim());
  }
  
  if (migrations.length === 0) {
    console.log('✅ No migrations needed.\n');
    db.close();
    return;
  }
  
  console.log('📝 Migration SQL:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(migrations.join('\n\n'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (options.dryRun) {
    console.log('⚠️  DRY RUN: No changes made to database\n');
    db.close();
    return;
  }
  
  console.log('🚀 Executing migrations...\n');
  
  try {
    db.transaction(() => {
      for (const migration of migrations) {
        db.exec(migration);
      }
    })();
    
    console.log('✅ Migration complete!\n');
    
    // Verify changes
    console.log('📊 Updated Schema Status:\n');
    const updatedArticlesInfo = db.pragma('table_info(articles)') as Array<{ name: string }>;
    const updatedTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
    
    const nowHasIsUpdate = updatedArticlesInfo.some((col) => col.name === 'isUpdate');
    const nowHasUpdateCount = updatedArticlesInfo.some((col) => col.name === 'updateCount');
    const nowHasUpdatesTable = updatedTables.some(t => t.name === 'article_updates');
    const nowHasUpdateSourcesTable = updatedTables.some(t => t.name === 'article_update_sources');
    
    console.log(`   articles.isUpdate: ${nowHasIsUpdate ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   articles.updateCount: ${nowHasUpdateCount ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   article_updates table: ${nowHasUpdatesTable ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   article_update_sources table: ${nowHasUpdateSourcesTable ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
  
  console.log('✅ Updates schema ready!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Update insert-articles.ts to populate isUpdate/updateCount');
  console.log('   2. Update check-duplicates.ts to create article_updates entries');
  console.log('   3. Update article queries to JOIN article_updates\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
