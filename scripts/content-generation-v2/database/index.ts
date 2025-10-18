/**
 * Content Generation V2 - Database Module
 * 
 * Central database access for all scripts.
 * Simple SQLite database - no complex schemas yet.
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ensurePipelineLogTable } from './schema-pipeline-logs.js';

// Get the directory of this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path relative to script location: scripts/content-generation-v2/database/index.ts
// -> Go up 3 levels to project root, then into logs/
const DEFAULT_DB_PATH = join(__dirname, '..', '..', '..', 'logs', 'content-generation-v2.db');

let db: Database.Database | null = null;
let dbInitialized = false;

/**
 * Initialize database connection
 */
export function initDB(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  if (db) {
    return db;
  }

  // Ensure directory exists
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Create database connection
  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

  console.log(`✅ Database initialized: ${dbPath}`);
  
  return db;
}

/**
 * Get current database connection (auto-initialize if needed)
 */
export function getDB(): Database.Database {
  if (!db) {
    initDB();
  }
  return db!;
}

/**
 * Ensure database is initialized with schema
 */
export function ensureInitialized(): void {
  if (!dbInitialized) {
    const database = getDB(); // Make sure DB exists
    // Initialize pipeline logging table
    ensurePipelineLogTable(database);
    dbInitialized = true;
  }
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
    console.log('✅ Database closed');
  }
}

/**
 * Execute a query with the database
 */
export function query<T = any>(sql: string, params?: any[]): T[] {
  const database = getDB();
  const stmt = database.prepare(sql);
  return params ? stmt.all(...params) as T[] : stmt.all() as T[];
}

/**
 * Execute a single row query
 */
export function queryOne<T = any>(sql: string, params?: any[]): T | undefined {
  const database = getDB();
  const stmt = database.prepare(sql);
  return params ? stmt.get(...params) as T | undefined : stmt.get() as T | undefined;
}

/**
 * Execute an insert/update/delete
 */
export function execute(sql: string, params?: any[]): Database.RunResult {
  const database = getDB();
  const stmt = database.prepare(sql);
  return params ? stmt.run(...params) : stmt.run();
}
