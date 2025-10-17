/**
 * Content Generation V2 - API Calls Schema
 * 
 * Schema and functions for tracking API usage and costs
 */

import { getDB } from './index.js';

/**
 * Initialize API calls table
 */
export function initAPICallsSchema(): void {
  const db = getDB();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Call metadata
      script_name TEXT NOT NULL,
      model TEXT NOT NULL,
      call_type TEXT NOT NULL,
      
      -- Timestamp
      called_at TEXT NOT NULL,
      
      -- Token usage
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      total_tokens INTEGER NOT NULL,
      
      -- Cost (USD)
      cost_usd REAL NOT NULL,
      
      -- Optional metadata
      notes TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_api_calls_script ON api_calls(script_name);
    CREATE INDEX IF NOT EXISTS idx_api_calls_model ON api_calls(model);
    CREATE INDEX IF NOT EXISTS idx_api_calls_date ON api_calls(called_at);
  `);
}

/**
 * API call log entry
 */
export interface APICallLog {
  scriptName: string;
  model: string;
  callType: 'grounded_search' | 'generation';
  calledAt: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  notes?: string;
}

/**
 * Log an API call
 */
export function logAPICall(log: APICallLog): void {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT INTO api_calls (
      script_name, model, call_type, called_at,
      input_tokens, output_tokens, total_tokens,
      cost_usd, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    log.scriptName,
    log.model,
    log.callType,
    log.calledAt,
    log.inputTokens,
    log.outputTokens,
    log.totalTokens,
    log.costUsd,
    log.notes || null
  );
}

/**
 * Get API call statistics
 */
export function getAPIStats(scriptName?: string) {
  const db = getDB();
  
  let query = `
    SELECT 
      COUNT(*) as call_count,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(total_tokens) as total_tokens,
      SUM(cost_usd) as total_cost
    FROM api_calls
  `;
  
  if (scriptName) {
    query += ` WHERE script_name = ?`;
    return db.prepare(query).get(scriptName);
  }
  
  return db.prepare(query).get();
}
