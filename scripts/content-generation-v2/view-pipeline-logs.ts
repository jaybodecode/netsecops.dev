#!/usr/bin/env node
/**
 * View Pipeline Execution Logs
 * 
 * Query and display pipeline execution history with filtering
 * 
 * Usage:
 *   npx tsx view-pipeline-logs.ts
 *   npx tsx view-pipeline-logs.ts --date 2025-10-07
 *   npx tsx view-pipeline-logs.ts --script check-duplicates-v3
 *   npx tsx view-pipeline-logs.ts --status FAILED
 *   npx tsx view-pipeline-logs.ts --date 2025-10-07 --script insert-articles
 *   npx tsx view-pipeline-logs.ts --today
 *   npx tsx view-pipeline-logs.ts --summary
 */

import 'dotenv/config';
import { Command } from 'commander';
import { getDB, ensureInitialized } from './database/index.js';

interface CLIOptions {
  date?: string;
  script?: string;
  status?: string;
  today: boolean;
  summary: boolean;
  limit: number;
}

function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('view-pipeline-logs')
    .description('View pipeline execution logs')
    .version('1.0.0')
    .option('-d, --date <date>', 'Filter by date (YYYY-MM-DD)')
    .option('-s, --script <name>', 'Filter by script name')
    .option('--status <status>', 'Filter by status (STARTED, SUCCESS, FAILED, SKIPPED)')
    .option('-t, --today', 'Show only today\'s logs')
    .option('--summary', 'Show summary statistics only')
    .option('-l, --limit <number>', 'Limit number of results', '50')
    .parse(process.argv);
  
  const options = program.opts();
  
  return {
    date: options.date,
    script: options.script,
    status: options.status,
    today: options.today === true,
    summary: options.summary === true,
    limit: parseInt(options.limit, 10),
  };
}

function formatDuration(ms: number | null): string {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function displayLog(log: any, index: number): void {
  const statusEmoji: Record<string, string> = {
    STARTED: '🔄',
    SUCCESS: '✅',
    FAILED: '❌',
    SKIPPED: '⏭️ ',
  };
  
  const emoji = statusEmoji[log.status] || '❓';
  
  console.log(`\n[${index}] ${emoji} ${log.script_name} - ${log.date_processed}`);
  console.log(`    Status: ${log.status}`);
  console.log(`    Started: ${formatTimestamp(log.started_at)}`);
  
  if (log.completed_at) {
    console.log(`    Completed: ${formatTimestamp(log.completed_at)}`);
    console.log(`    Duration: ${formatDuration(log.execution_time_ms)}`);
  }
  
  // Show counts if available
  const counts: string[] = [];
  if (log.articles_inserted !== null) counts.push(`inserted:${log.articles_inserted}`);
  if (log.articles_new !== null) counts.push(`new:${log.articles_new}`);
  if (log.articles_skip_fts5 !== null) counts.push(`skip-fts5:${log.articles_skip_fts5}`);
  if (log.articles_skip_update !== null) counts.push(`skip-update:${log.articles_skip_update}`);
  if (log.articles_published !== null) counts.push(`published:${log.articles_published}`);
  if (log.articles_regenerated !== null) counts.push(`regenerated:${log.articles_regenerated}`);
  if (log.llm_calls !== null) counts.push(`llm:${log.llm_calls}`);
  
  if (counts.length > 0) {
    console.log(`    Counts: ${counts.join(', ')}`);
  }
  
  // Show error if failed
  if (log.status === 'FAILED' && log.error_message) {
    console.log(`    Error: ${log.error_message}`);
  }
  
  // Show metadata if present
  if (log.metadata) {
    try {
      const meta = JSON.parse(log.metadata);
      if (meta.skip_reason) {
        console.log(`    Reason: ${meta.skip_reason}`);
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
}

function displaySummary(db: any): void {
  console.log('\n📊 Pipeline Execution Summary\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Overall stats
  const overall = db.prepare(`
    SELECT 
      COUNT(*) as total_executions,
      SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
      SUM(CASE WHEN status = 'SKIPPED' THEN 1 ELSE 0 END) as skipped_count,
      AVG(CASE WHEN execution_time_ms IS NOT NULL THEN execution_time_ms ELSE NULL END) as avg_duration_ms
    FROM pipeline_execution_log
  `).get() as any;
  
  console.log('Overall Statistics:');
  console.log(`   Total executions: ${overall.total_executions}`);
  console.log(`   ✅ Success: ${overall.success_count}`);
  console.log(`   ❌ Failed: ${overall.failed_count}`);
  console.log(`   ⏭️  Skipped: ${overall.skipped_count}`);
  console.log(`   ⏱️  Average duration: ${formatDuration(overall.avg_duration_ms)}\n`);
  
  // By script
  console.log('By Script:');
  const byScript = db.prepare(`
    SELECT 
      script_name,
      COUNT(*) as executions,
      SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
      AVG(CASE WHEN execution_time_ms IS NOT NULL THEN execution_time_ms ELSE NULL END) as avg_duration_ms
    FROM pipeline_execution_log
    GROUP BY script_name
    ORDER BY executions DESC
  `).all() as any[];
  
  for (const row of byScript) {
    console.log(`   ${row.script_name}:`);
    console.log(`      Executions: ${row.executions} (✅ ${row.success}, ❌ ${row.failed})`);
    console.log(`      Avg duration: ${formatDuration(row.avg_duration_ms)}`);
  }
  
  // By date
  console.log('\nBy Date:');
  const byDate = db.prepare(`
    SELECT 
      date_processed,
      COUNT(*) as executions,
      SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
    FROM pipeline_execution_log
    WHERE date_processed != 'ALL'
    GROUP BY date_processed
    ORDER BY date_processed DESC
    LIMIT 10
  `).all() as any[];
  
  for (const row of byDate) {
    console.log(`   ${row.date_processed}: ${row.executions} runs (✅ ${row.success}, ❌ ${row.failed})`);
  }
  
  // Recent failures
  console.log('\nRecent Failures:');
  const recentFailures = db.prepare(`
    SELECT 
      script_name,
      date_processed,
      started_at,
      error_message
    FROM pipeline_execution_log
    WHERE status = 'FAILED'
    ORDER BY started_at DESC
    LIMIT 5
  `).all() as any[];
  
  if (recentFailures.length === 0) {
    console.log('   None! 🎉');
  } else {
    for (const failure of recentFailures) {
      console.log(`   ${formatTimestamp(failure.started_at)} - ${failure.script_name} (${failure.date_processed})`);
      console.log(`      Error: ${failure.error_message}`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function main() {
  const options = parseArgs();
  ensureInitialized();
  const db = getDB();
  
  // Show summary if requested
  if (options.summary) {
    displaySummary(db);
    return;
  }
  
  console.log('\n📋 Pipeline Execution Logs\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Build query
  let query = `
    SELECT *
    FROM pipeline_execution_log
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (options.date) {
    query += ` AND date_processed = ?`;
    params.push(options.date);
  }
  
  if (options.script) {
    query += ` AND script_name = ?`;
    params.push(options.script);
  }
  
  if (options.status) {
    query += ` AND status = ?`;
    params.push(options.status);
  }
  
  if (options.today) {
    query += ` AND date(started_at) = date('now')`;
  }
  
  query += ` ORDER BY started_at DESC LIMIT ?`;
  params.push(options.limit);
  
  // Execute query
  const logs = db.prepare(query).all(...params);
  
  if (logs.length === 0) {
    console.log('No logs found matching the criteria.\n');
    console.log('Try:');
    console.log('   npx tsx view-pipeline-logs.ts --summary');
    console.log('   npx tsx view-pipeline-logs.ts --today');
    console.log('   npx tsx view-pipeline-logs.ts --status FAILED\n');
    return;
  }
  
  console.log(`Found ${logs.length} execution log(s):\n`);
  
  // Display logs
  logs.forEach((log, index) => displayLog(log, index + 1));
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nShowing ${logs.length} result(s). Use --limit to see more.`);
  console.log('Use --summary to see overall statistics.\n');
}

main();
