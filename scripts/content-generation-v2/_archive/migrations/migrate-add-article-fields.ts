/**
 * Migration: Add missing article fields for V3 schema
 * 
 * Adds columns needed by insert-articles.ts that weren't in the initial migration
 */

import Database from 'better-sqlite3';

const DB_PATH = 'logs/content-generation-v2.db';
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('🔧 Adding missing article fields...\n');

// Check if column exists
function hasColumn(table: string, column: string): boolean {
  const info = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
  return info.some((col) => col.name === column);
}

// Add severity column (from news-structured schema)
if (!hasColumn('articles', 'severity')) {
  console.log('   Adding severity column...');
  db.exec(`ALTER TABLE articles ADD COLUMN severity TEXT CHECK(severity IN ('critical', 'high', 'medium', 'low', 'informational'))`);
  console.log('   ✅ Added severity\n');
} else {
  console.log('   ℹ️  severity column already exists\n');
}

// Add pub_date column (original publication date from source)
if (!hasColumn('articles', 'pub_date')) {
  console.log('   Adding pub_date column...');
  db.exec(`ALTER TABLE articles ADD COLUMN pub_date TEXT`);
  console.log('   ✅ Added pub_date\n');
} else {
  console.log('   ℹ️  pub_date column already exists\n');
}

// Add extract_datetime column
if (!hasColumn('articles', 'extract_datetime')) {
  console.log('   Adding extract_datetime column...');
  db.exec(`ALTER TABLE articles ADD COLUMN extract_datetime TEXT`);
  console.log('   ✅ Added extract_datetime\n');
} else {
  console.log('   ℹ️  extract_datetime column already exists\n');
}

// Add updated_at column
if (!hasColumn('articles', 'updated_at')) {
  console.log('   Adding updated_at column...');
  db.exec(`ALTER TABLE articles ADD COLUMN updated_at TEXT`);
  console.log('   ✅ Added updated_at\n');
} else {
  console.log('   ℹ️  updated_at column already exists\n');
}

db.close();
console.log('✅ Migration complete!\n');
