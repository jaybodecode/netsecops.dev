/**
 * Database schema for pipeline execution logging
 * Tracks every script execution with status, counts, errors, and timing
 */

import Database from 'better-sqlite3';

export interface PipelineExecutionLog {
  id?: number;
  script_name: string;
  date_processed: string; // YYYY-MM-DD format
  status: 'STARTED' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  started_at: string; // ISO timestamp
  completed_at?: string; // ISO timestamp
  execution_time_ms?: number;
  
  // Counts for different operations
  articles_inserted?: number;
  articles_new?: number;
  articles_skip_fts5?: number;
  articles_skip_update?: number;
  articles_published?: number;
  articles_regenerated?: number;
  llm_calls?: number;
  
  // Error tracking
  error_message?: string;
  error_stack?: string;
  
  // Additional context
  metadata?: string; // JSON string for flexible data
}

/**
 * Create pipeline_execution_log table
 */
export function createPipelineLogTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pipeline_execution_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_name TEXT NOT NULL,
      date_processed TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('STARTED', 'SUCCESS', 'FAILED', 'SKIPPED')),
      started_at TEXT NOT NULL,
      completed_at TEXT,
      execution_time_ms INTEGER,
      
      -- Operation counts
      articles_inserted INTEGER,
      articles_new INTEGER,
      articles_skip_fts5 INTEGER,
      articles_skip_update INTEGER,
      articles_published INTEGER,
      articles_regenerated INTEGER,
      llm_calls INTEGER,
      
      -- Error tracking
      error_message TEXT,
      error_stack TEXT,
      
      -- Additional context (JSON)
      metadata TEXT,
      
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Index for quick lookups by date and script
    CREATE INDEX IF NOT EXISTS idx_pipeline_log_date_script 
      ON pipeline_execution_log(date_processed, script_name);
    
    -- Index for status queries
    CREATE INDEX IF NOT EXISTS idx_pipeline_log_status 
      ON pipeline_execution_log(status);
    
    -- Index for recent logs
    CREATE INDEX IF NOT EXISTS idx_pipeline_log_started 
      ON pipeline_execution_log(started_at DESC);
  `);
}

/**
 * Initialize pipeline logging table
 */
export function ensurePipelineLogTable(db: Database.Database): void {
  createPipelineLogTable(db);
}
