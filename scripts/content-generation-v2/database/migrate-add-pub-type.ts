#!/usr/bin/env node
/**
 * Migration: Add pub_type and pub_date_only columns
 * 
 * Adds:
 * - pub_type TEXT DEFAULT 'daily' 
 * - pub_date_only TEXT GENERATED ALWAYS AS (date(pub_date)) STORED
 * - Indexes for efficient querying
 */

import { getDB } from './index.js';

function migrateAddPubType(): void {
  const db = getDB();
  
  console.log('🔄 Starting migration: Add pub_type and pub_date_only columns...\n');
  
  // Check current schema
  const tableInfo = db.prepare(`PRAGMA table_info(structured_news)`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }>;
  
  const hasPublType = tableInfo.some(col => col.name === 'pub_type');
  const hasPubDateOnly = tableInfo.some(col => col.name === 'pub_date_only');
  
  if (hasPublType && hasPubDateOnly) {
    console.log('✅ Migration already applied - columns exist');
    return;
  }
  
  // Count existing records
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM structured_news`).get() as { count: number };
  console.log(`📊 Found ${count} existing record(s)`);
  
  if (count === 0) {
    console.log('⚠️  No records to migrate - just updating schema\n');
  }
  
  // Begin transaction
  db.exec('BEGIN TRANSACTION');
  
  try {
    // Create new table with updated schema
    console.log('📝 Creating new table structure...');
    db.exec(`
      CREATE TABLE structured_news_new (
        pub_id TEXT PRIMARY KEY,
        pub_date TEXT NOT NULL,
        pub_date_only TEXT GENERATED ALWAYS AS (date(pub_date)) STORED,
        pub_type TEXT NOT NULL DEFAULT 'daily',
        generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        data TEXT NOT NULL,
        headline TEXT NOT NULL,
        total_articles INTEGER NOT NULL,
        date_range TEXT NOT NULL
      )
    `);
    
    // Copy existing data (pub_type will default to 'daily', pub_date_only will be computed)
    if (count > 0) {
      console.log('📋 Copying existing records...');
      db.exec(`
        INSERT INTO structured_news_new (pub_id, pub_date, generated_at, data, headline, total_articles, date_range)
        SELECT pub_id, pub_date, generated_at, data, headline, total_articles, date_range
        FROM structured_news
      `);
      
      const copied = db.prepare(`SELECT COUNT(*) as count FROM structured_news_new`).get() as { count: number };
      console.log(`✅ Copied ${copied.count} record(s)`);
    }
    
    // Drop old table
    console.log('🗑️  Dropping old table...');
    db.exec('DROP TABLE structured_news');
    
    // Rename new table
    console.log('🔄 Renaming new table...');
    db.exec('ALTER TABLE structured_news_new RENAME TO structured_news');
    
    // Create indexes
    console.log('📇 Creating indexes...');
    db.exec(`
      CREATE INDEX idx_structured_news_pub_date ON structured_news(pub_date);
      CREATE INDEX idx_structured_news_date_only ON structured_news(pub_date_only);
      CREATE INDEX idx_structured_news_type ON structured_news(pub_type);
      CREATE INDEX idx_structured_news_date_type ON structured_news(pub_date_only, pub_type);
      CREATE INDEX idx_structured_news_generated ON structured_news(generated_at);
    `);
    
    // Commit transaction
    db.exec('COMMIT');
    
    // Verify
    const finalResult = db.prepare(`SELECT COUNT(*) as count FROM structured_news`).get() as { count: number };
    const finalCount = finalResult.count;
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`📊 Verified ${finalCount} record(s) in new table`);
    
    // Show sample
    if (finalCount > 0) {
      console.log('\n📋 Sample record:');
      const sample = db.prepare(`
        SELECT pub_id, pub_date, pub_date_only, pub_type, headline 
        FROM structured_news 
        LIMIT 1
      `).get();
      console.log(JSON.stringify(sample, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    db.exec('ROLLBACK');
    throw error;
  }
}

// Run migration
migrateAddPubType();
