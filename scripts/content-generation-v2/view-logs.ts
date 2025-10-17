#!/usr/bin/env node
/**
 * View API call logs from database
 * 
 * Usage:
 *   npx tsx view-logs.ts
 *   npx tsx view-logs.ts --script=search-news
 *   npx tsx view-logs.ts --today
 */

import 'dotenv/config';
import { Command } from 'commander';
import { getDB, ensureInitialized } from './database/index.js';

function parseArgs() {
  const program = new Command();
  
  program
    .name('view-logs')
    .description('View API call logs')
    .version('1.0.0')
    .option('-s, --script <name>', 'Filter by script name')
    .option('-t, --today', 'Show only today\'s logs')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .parse(process.argv);
  
  return program.opts();
}

function main() {
  console.log('📊 API Call Logs\n');
  
  const options = parseArgs();
  ensureInitialized();
  const db = getDB();
  
  // Build query
  let query = `
    SELECT 
      id,
      script_name,
      model,
      call_type,
      datetime(called_at) as called_at,
      input_tokens,
      output_tokens,
      total_tokens,
      cost_usd
    FROM api_calls
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (options.script) {
    query += ` AND script_name = ?`;
    params.push(options.script);
  }
  
  if (options.today) {
    query += ` AND date(called_at) = date('now')`;
  }
  
  query += ` ORDER BY called_at DESC LIMIT ?`;
  params.push(parseInt(options.limit, 10));
  
  // Execute query
  const logs = db.prepare(query).all(...params);
  
  if (logs.length === 0) {
    console.log('No API calls found.');
    return;
  }
  
  // Display logs
  console.log(`Found ${logs.length} API call(s):\n`);
  
  let totalCost = 0;
  let totalTokens = 0;
  
  for (const log of logs as any[]) {
    console.log(`[${ log.id }] ${log.script_name} - ${log.model}`);
    console.log(`   Time: ${log.called_at}`);
    console.log(`   Type: ${log.call_type}`);
    console.log(`   Tokens: ${log.input_tokens.toLocaleString()} in + ${log.output_tokens.toLocaleString()} out = ${log.total_tokens.toLocaleString()} total`);
    console.log(`   Cost: $${log.cost_usd.toFixed(4)}`);
    console.log();
    
    totalCost += log.cost_usd;
    totalTokens += log.total_tokens;
  }
  
  console.log('─'.repeat(70));
  console.log(`Total: ${totalTokens.toLocaleString()} tokens, $${totalCost.toFixed(4)}`);
  
  // Show summary stats
  console.log('\n📈 Summary Statistics:\n');
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as call_count,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(total_tokens) as total_tokens,
      SUM(cost_usd) as total_cost
    FROM api_calls
  `).get() as any;
  
  console.log(`   Total API calls: ${stats.call_count}`);
  console.log(`   Total tokens: ${stats.total_tokens.toLocaleString()}`);
  console.log(`   Total cost: $${stats.total_cost.toFixed(4)}`);
  
  // By script
  console.log('\n📊 By Script:\n');
  const byScript = db.prepare(`
    SELECT 
      script_name,
      COUNT(*) as calls,
      SUM(total_tokens) as tokens,
      SUM(cost_usd) as cost
    FROM api_calls
    GROUP BY script_name
    ORDER BY cost DESC
  `).all() as any[];
  
  for (const row of byScript) {
    console.log(`   ${row.script_name}: ${row.calls} calls, ${row.tokens.toLocaleString()} tokens, $${row.cost.toFixed(4)}`);
  }
}

main();
