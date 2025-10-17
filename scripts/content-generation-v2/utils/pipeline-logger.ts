/**
 * Pipeline Logger Utility
 * Centralized logging for all pipeline scripts
 */

import type Database from 'better-sqlite3';
import type { PipelineExecutionLog } from '../database/schema-pipeline-logs.js';

export interface LogStartOptions {
  scriptName: string;
  dateProcessed: string;
  metadata?: Record<string, any>;
}

export interface LogCompletionOptions {
  articlesInserted?: number;
  articlesNew?: number;
  articlesSkipFts5?: number;
  articlesSkipUpdate?: number;
  articlesPublished?: number;
  articlesRegenerated?: number;
  llmCalls?: number;
  metadata?: Record<string, any>;
}

export interface LogErrorOptions {
  error: Error;
  metadata?: Record<string, any>;
}

export class PipelineLogger {
  private db: Database.Database;
  private logId: number | null = null;
  private startTime: number = 0;
  private scriptName: string = '';
  private dateProcessed: string = '';

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Log start of script execution
   */
  logStart(options: LogStartOptions): number {
    this.scriptName = options.scriptName;
    this.dateProcessed = options.dateProcessed;
    this.startTime = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO pipeline_execution_log (
        script_name,
        date_processed,
        status,
        started_at,
        metadata
      ) VALUES (?, ?, 'STARTED', ?, ?)
    `);

    const result = stmt.run(
      options.scriptName,
      options.dateProcessed,
      new Date().toISOString(),
      options.metadata ? JSON.stringify(options.metadata) : null
    );

    this.logId = result.lastInsertRowid as number;
    return this.logId;
  }

  /**
   * Log successful completion
   */
  logSuccess(options: LogCompletionOptions = {}): void {
    if (!this.logId) {
      throw new Error('Must call logStart() before logSuccess()');
    }

    const executionTime = Date.now() - this.startTime;

    const stmt = this.db.prepare(`
      UPDATE pipeline_execution_log
      SET 
        status = 'SUCCESS',
        completed_at = ?,
        execution_time_ms = ?,
        articles_inserted = ?,
        articles_new = ?,
        articles_skip_fts5 = ?,
        articles_skip_update = ?,
        articles_published = ?,
        articles_regenerated = ?,
        llm_calls = ?,
        metadata = CASE 
          WHEN ? IS NOT NULL THEN ?
          ELSE metadata
        END
      WHERE id = ?
    `);

    stmt.run(
      new Date().toISOString(),
      executionTime,
      options.articlesInserted ?? null,
      options.articlesNew ?? null,
      options.articlesSkipFts5 ?? null,
      options.articlesSkipUpdate ?? null,
      options.articlesPublished ?? null,
      options.articlesRegenerated ?? null,
      options.llmCalls ?? null,
      options.metadata ? JSON.stringify(options.metadata) : null,
      options.metadata ? JSON.stringify(options.metadata) : null,
      this.logId
    );
  }

  /**
   * Log execution failure
   */
  logError(options: LogErrorOptions): void {
    if (!this.logId) {
      throw new Error('Must call logStart() before logError()');
    }

    const executionTime = Date.now() - this.startTime;

    const stmt = this.db.prepare(`
      UPDATE pipeline_execution_log
      SET 
        status = 'FAILED',
        completed_at = ?,
        execution_time_ms = ?,
        error_message = ?,
        error_stack = ?,
        metadata = CASE 
          WHEN ? IS NOT NULL THEN ?
          ELSE metadata
        END
      WHERE id = ?
    `);

    stmt.run(
      new Date().toISOString(),
      executionTime,
      options.error.message,
      options.error.stack ?? null,
      options.metadata ? JSON.stringify(options.metadata) : null,
      options.metadata ? JSON.stringify(options.metadata) : null,
      this.logId
    );
  }

  /**
   * Log skipped execution (e.g., no data available)
   */
  logSkip(reason: string, metadata?: Record<string, any>): void {
    if (!this.logId) {
      throw new Error('Must call logStart() before logSkip()');
    }

    const executionTime = Date.now() - this.startTime;

    const combinedMetadata = {
      ...(metadata ?? {}),
      skip_reason: reason,
    };

    const stmt = this.db.prepare(`
      UPDATE pipeline_execution_log
      SET 
        status = 'SKIPPED',
        completed_at = ?,
        execution_time_ms = ?,
        metadata = ?
      WHERE id = ?
    `);

    stmt.run(
      new Date().toISOString(),
      executionTime,
      JSON.stringify(combinedMetadata),
      this.logId
    );
  }

  /**
   * Update counts mid-execution (optional, for long-running processes)
   */
  updateCounts(options: LogCompletionOptions): void {
    if (!this.logId) {
      throw new Error('Must call logStart() before updateCounts()');
    }

    const stmt = this.db.prepare(`
      UPDATE pipeline_execution_log
      SET 
        articles_inserted = COALESCE(?, articles_inserted),
        articles_new = COALESCE(?, articles_new),
        articles_skip_fts5 = COALESCE(?, articles_skip_fts5),
        articles_skip_update = COALESCE(?, articles_skip_update),
        articles_published = COALESCE(?, articles_published),
        articles_regenerated = COALESCE(?, articles_regenerated),
        llm_calls = COALESCE(?, llm_calls)
      WHERE id = ?
    `);

    stmt.run(
      options.articlesInserted ?? null,
      options.articlesNew ?? null,
      options.articlesSkipFts5 ?? null,
      options.articlesSkipUpdate ?? null,
      options.articlesPublished ?? null,
      options.articlesRegenerated ?? null,
      options.llmCalls ?? null,
      this.logId
    );
  }

  /**
   * Get current log ID
   */
  getLogId(): number | null {
    return this.logId;
  }

  /**
   * Get execution time in milliseconds
   */
  getExecutionTime(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Create a pipeline logger instance
 */
export function createPipelineLogger(db: Database.Database): PipelineLogger {
  return new PipelineLogger(db);
}
