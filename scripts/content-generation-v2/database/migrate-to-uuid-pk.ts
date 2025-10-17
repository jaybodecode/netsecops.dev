#!/usr/bin/env node
/**
 * Migration: Swap structured_news primary key from pub_date to pub_id
 * 
 * BEFORE:
 *   CREATE TABLE structured_news (
 *     id INTEGER PRIMARY KEY AUTOINCREMENT,
 *     pub_date TEXT NOT NULL UNIQUE,
 *     pub_id TEXT NOT NULL,
 *     ...
 *   );
 * 
 * AFTER:
 *   CREATE TABLE structured_news (
 *     pub_id TEXT PRIMARY KEY,
 *     pub_date TEXT NOT NULL,
 *     ...
 *   );
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/database/migrate-to-uuid-pk.ts
 */

import { getDB } from './index.js';

async function migrate() {
  const db = getDB();
  
  console.log('🔄 Starting migration: pub_date → pub_id as primary key\n');
  
  try {
    // Check if table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='structured_news'
    `).get();
    
    if (!tableExists) {
      console.log('✅ Table structured_news does not exist yet - nothing to migrate');
      console.log('   Schema will be created correctly on first use\n');
      return;
    }
    
    // Check current schema
    const currentSchema = db.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='structured_news'
    `).get() as { sql: string };
    
    console.log('📋 Current schema:');
    console.log(currentSchema.sql);
    console.log('');
    
    // Check if already migrated
    if (currentSchema.sql.includes('pub_id TEXT PRIMARY KEY')) {
      console.log('✅ Already migrated - pub_id is already the primary key\n');
      return;
    }
    
    // Get existing data
    const existingData = db.prepare(`
      SELECT * FROM structured_news
    `).all();
    
    console.log(`📊 Found ${existingData.length} existing record(s)\n`);
    
    // Start transaction
    db.exec('BEGIN TRANSACTION');
    
    try {
      // Drop old indexes first
      console.log('🗑️  Dropping old indexes...');
      db.exec(`DROP INDEX IF EXISTS idx_structured_news_generated`);
      db.exec(`DROP INDEX IF EXISTS idx_structured_news_pub_id`);
      
      // Create new table with correct schema
      console.log('🔨 Creating new table with pub_id as primary key...');
      db.exec(`
        CREATE TABLE structured_news_new (
          pub_id TEXT PRIMARY KEY,
          pub_date TEXT NOT NULL,
          generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          data TEXT NOT NULL,
          headline TEXT NOT NULL,
          total_articles INTEGER NOT NULL,
          date_range TEXT NOT NULL
        );
        
        CREATE INDEX idx_structured_news_pub_date ON structured_news_new(pub_date);
        CREATE INDEX idx_structured_news_generated ON structured_news_new(generated_at);
      `);
      
      // Copy data
      if (existingData.length > 0) {
        console.log('📦 Copying existing data...');
        const insertStmt = db.prepare(`
          INSERT INTO structured_news_new (
            pub_id, pub_date, generated_at, data, headline, total_articles, date_range
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const row of existingData as any[]) {
          insertStmt.run(
            row.pub_id,
            row.pub_date,
            row.generated_at,
            row.data,
            row.headline,
            row.total_articles,
            row.date_range
          );
        }
        console.log(`✅ Copied ${existingData.length} record(s)\n`);
      }
      
      // Drop old table and rename new one
      console.log('🔄 Swapping tables...');
      db.exec(`
        DROP TABLE structured_news;
        ALTER TABLE structured_news_new RENAME TO structured_news;
      `);
      
      // Commit transaction
      db.exec('COMMIT');
      
      console.log('✅ Migration completed successfully!\n');
      
      // Verify
      const newSchema = db.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='structured_news'
      `).get() as { sql: string };
      
      console.log('📋 New schema:');
      console.log(newSchema.sql);
      console.log('');
      
      const recordCount = db.prepare(`
        SELECT COUNT(*) as count FROM structured_news
      `).get() as { count: number };
      
      console.log(`📊 Verified ${recordCount.count} record(s) in new table\n`);
      
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrate().then(() => {
  console.log('🎉 Done!\n');
  process.exit(0);
});
