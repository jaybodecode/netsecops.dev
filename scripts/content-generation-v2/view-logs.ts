#!/usr/bin/env node
/**
 * Database Query Tool - View logs, stats, and analytics
 * 
 * Usage:
 *   npx tsx view-logs.ts api                    # API call logs (default)
 *   npx tsx view-logs.ts costs --date 2025-10-17
 *   npx tsx view-logs.ts resolutions --date 2025-10-17
 *   npx tsx view-logs.ts updates --date 2025-10-17
 *   npx tsx view-logs.ts tables                 # Table sizes
 *   npx tsx view-logs.ts sources --days 7       # Top sources
 *   npx tsx view-logs.ts mitre --days 7         # MITRE coverage
 *   npx tsx view-logs.ts severity --days 7      # Severity distribution
 */

import 'dotenv/config';
import { Command } from 'commander';
import Database from 'better-sqlite3';
import { join } from 'path';

interface ViewLogsOptions {
  command: string;
  script?: string;
  today?: boolean;
  limit: string;
  date?: string;
  days: string;
}

function parseArgs(): ViewLogsOptions {
  const program = new Command();
  
  program
    .name('view-logs')
    .description('Database query tool for logs, stats, and analytics')
    .version('1.0.0')
    .argument('[command]', 'Command to run: api, costs, resolutions, updates, tables, sources, mitre, severity', 'api')
    .option('-s, --script <name>', 'Filter by script name (api command)')
    .option('-t, --today', 'Show only today\'s data (api command)')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .option('-d, --date <YYYY-MM-DD>', 'Filter by specific date')
    .option('--days <number>', 'Number of days to look back', '7')
    .parse(process.argv);
  
  const opts = program.opts() as Omit<ViewLogsOptions, 'command'>;
  
  return {
    command: program.args[0] || 'api',
    ...opts
  };
}

function showApiLogs(db: any, options: ViewLogsOptions) {
  console.log('📊 API Call Logs\n');
  
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
  
  if (options.date) {
    query += ` AND date(called_at) = ?`;
    params.push(options.date);
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
    console.log(`[${log.id}] ${log.script_name} - ${log.model}`);
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

function showCosts(db: any, options: ViewLogsOptions) {
  console.log('💰 API Cost Analysis\n');
  
  // Total cost by script
  console.log('📊 Total Cost by Script:\n');
  const byScript = db.prepare(`
    SELECT 
      script_name,
      ROUND(SUM(cost_usd), 2) as total_cost,
      COUNT(*) as calls
    FROM api_calls
    GROUP BY script_name
    ORDER BY total_cost DESC
  `).all() as any[];
  
  for (const row of byScript) {
    console.log(`   ${row.script_name.padEnd(30)} $${row.total_cost.toFixed(2).padStart(8)} (${row.calls} calls)`);
  }
  
  // Cost by date (last N days)
  console.log(`\n📅 Daily Costs (last ${options.days} days):\n`);
  const byDate = db.prepare(`
    SELECT 
      date(called_at) as date,
      ROUND(SUM(cost_usd), 2) as daily_cost,
      COUNT(*) as calls
    FROM api_calls
    WHERE date(called_at) >= date('now', '-' || ? || ' days')
    GROUP BY date(called_at)
    ORDER BY date DESC
  `).all(options.days) as any[];
  
  for (const row of byDate) {
    console.log(`   ${row.date}  $${row.daily_cost.toFixed(2).padStart(8)} (${row.calls} calls)`);
  }
  
  // Specific date breakdown if provided
  if (options.date) {
    console.log(`\n🔍 Detailed Breakdown for ${options.date}:\n`);
    const detailed = db.prepare(`
      SELECT 
        script_name,
        model,
        input_tokens,
        output_tokens,
        ROUND(cost_usd, 4) as cost
      FROM api_calls
      WHERE date(called_at) = ?
      ORDER BY called_at
    `).all(options.date) as any[];
    
    if (detailed.length === 0) {
      console.log('   No API calls found for this date.');
    } else {
      for (const row of detailed) {
        console.log(`   ${row.script_name} (${row.model})`);
        console.log(`      Tokens: ${row.input_tokens} in, ${row.output_tokens} out`);
        console.log(`      Cost: $${row.cost}`);
      }
    }
  }
  
  // Total cost
  const total = db.prepare(`
    SELECT ROUND(SUM(cost_usd), 2) as total_cost
    FROM api_calls
  `).get() as any;
  
  console.log(`\n💵 Total Cost (all time): $${total.total_cost.toFixed(2)}`);
}

function showResolutions(db: any, options: ViewLogsOptions) {
  if (!options.date) {
    console.error('❌ ERROR: --date required for resolutions command');
    console.error('Usage: npx tsx view-logs.ts resolutions --date 2025-10-17');
    process.exit(1);
  }
  
  console.log(`📋 Article Resolutions for ${options.date}\n`);
  
  // Resolution counts
  const resolutions = db.prepare(`
    SELECT 
      resolution,
      COUNT(*) as count
    FROM articles
    WHERE date(created_at) = ?
    GROUP BY resolution
    ORDER BY count DESC
  `).all(options.date) as any[];
  
  if (resolutions.length === 0) {
    console.log('No articles found for this date.');
    return;
  }
  
  console.log('Resolution Distribution:\n');
  for (const row of resolutions) {
    const emoji = row.resolution === 'NEW' ? '✅' :
                  row.resolution === 'SKIP-FTS5' ? '🔍' :
                  row.resolution === 'SKIP-LLM' ? '🤖' :
                  row.resolution === 'SKIP-UPDATE' ? '🔄' : '❓';
    console.log(`   ${emoji} ${row.resolution.padEnd(15)} ${row.count}`);
  }
  
  // Detailed resolution info
  console.log(`\n📝 Detailed Resolution Info:\n`);
  const detailed = db.prepare(`
    SELECT 
      id,
      headline,
      resolution,
      similarity_score,
      duplicate_of
    FROM articles
    WHERE date(created_at) = ?
    ORDER BY resolution, similarity_score DESC
    LIMIT ?
  `).all(options.date, parseInt(options.limit, 10)) as any[];
  
  for (const row of detailed) {
    console.log(`   [${row.id}] ${row.resolution}`);
    console.log(`       ${row.headline.substring(0, 80)}${row.headline.length > 80 ? '...' : ''}`);
    if (row.similarity_score) {
      console.log(`       Similarity: ${row.similarity_score.toFixed(2)}`);
    }
    if (row.duplicate_of) {
      console.log(`       Duplicate of: ${row.duplicate_of}`);
    }
    console.log();
  }
}

function showUpdates(db: any, options: ViewLogsOptions) {
  if (!options.date) {
    console.error('❌ ERROR: --date required for updates command');
    console.error('Usage: npx tsx view-logs.ts updates --date 2025-10-17');
    process.exit(1);
  }
  
  console.log(`🔄 Article Updates for ${options.date}\n`);
  
  // Articles that received updates
  const withUpdates = db.prepare(`
    SELECT 
      id,
      slug,
      headline,
      json_array_length(updates) as update_count
    FROM articles
    WHERE json_array_length(updates) > 0
      AND date(created_at) = ?
  `).all(options.date) as any[];
  
  if (withUpdates.length === 0) {
    console.log('No articles with updates found for this date.');
  } else {
    console.log(`📢 Articles that Received Updates (${withUpdates.length}):\n`);
    for (const row of withUpdates) {
      console.log(`   [${row.id}] ${row.headline}`);
      console.log(`       Slug: ${row.slug}`);
      console.log(`       Updates: ${row.update_count}`);
      console.log();
    }
  }
  
  // Articles marked as SKIP-UPDATE
  console.log('\n🔗 Articles Merged into Existing (SKIP-UPDATE):\n');
  const skipUpdate = db.prepare(`
    SELECT 
      id,
      headline,
      duplicate_of
    FROM articles
    WHERE resolution = 'SKIP-UPDATE'
      AND date(created_at) = ?
  `).all(options.date) as any[];
  
  if (skipUpdate.length === 0) {
    console.log('   No SKIP-UPDATE articles for this date.');
  } else {
    for (const row of skipUpdate) {
      console.log(`   [${row.id}] → [${row.duplicate_of}]`);
      console.log(`       ${row.headline.substring(0, 80)}${row.headline.length > 80 ? '...' : ''}`);
      console.log();
    }
  }
}

function showTables(db: any) {
  console.log('📊 Database Table Statistics\n');
  
  const tables = [
    { name: 'raw_search', query: 'SELECT COUNT(*) as rows FROM raw_search' },
    { name: 'structured_news', query: 'SELECT COUNT(*) as rows FROM structured_news' },
    { name: 'articles', query: 'SELECT COUNT(*) as rows FROM articles' },
    { name: 'publications', query: 'SELECT COUNT(*) as rows FROM publications' },
    { name: 'api_calls', query: 'SELECT COUNT(*) as rows FROM api_calls' },
    { name: 'articles_fts', query: 'SELECT COUNT(*) as rows FROM articles_fts' },
  ];
  
  for (const table of tables) {
    try {
      const result = db.prepare(table.query).get() as any;
      console.log(`   ${table.name.padEnd(20)} ${result.rows.toLocaleString().padStart(10)} rows`);
    } catch (error) {
      console.log(`   ${table.name.padEnd(20)} ${' Error'.padStart(10)}`);
    }
  }
  
  // Database file size
  console.log('\n💾 Database File Size:\n');
  try {
    const fs = require('fs');
    const stats = fs.statSync('logs/content-generation-v2.db');
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   ${sizeMB} MB`);
  } catch (error) {
    console.log('   Unable to determine file size');
  }
}

function showSources(db: any, options: ViewLogsOptions) {
  console.log(`🌐 Top Sources (last ${options.days} days)\n`);
  
  const sources = db.prepare(`
    SELECT 
      json_extract(value, '$.friendly_name') as source,
      COUNT(*) as article_count
    FROM articles,
         json_each(articles.sources)
    WHERE date(articles.created_at) >= date('now', '-' || ? || ' days')
    GROUP BY source
    ORDER BY article_count DESC
    LIMIT ?
  `).all(options.days, parseInt(options.limit, 10)) as any[];
  
  if (sources.length === 0) {
    console.log('No sources found.');
    return;
  }
  
  for (const row of sources) {
    const source = row.source || '(no friendly_name)';
    console.log(`   ${source.padEnd(40)} ${row.article_count.toString().padStart(5)} articles`);
  }
  
  // Articles missing friendly_name
  const missing = db.prepare(`
    SELECT COUNT(*) as count
    FROM articles,
         json_each(articles.sources)
    WHERE json_extract(value, '$.friendly_name') IS NULL
      AND date(articles.created_at) >= date('now', '-' || ? || ' days')
  `).get(options.days) as any;
  
  if (missing.count > 0) {
    console.log(`\n⚠️  ${missing.count} sources missing friendly_name (SEO issue)`);
  }
}

function showMitre(db: any, options: ViewLogsOptions) {
  console.log(`🛡️ MITRE ATT&CK Coverage (last ${options.days} days)\n`);
  
  // Articles with MITRE techniques
  const coverage = db.prepare(`
    SELECT 
      date(created_at) as date,
      COUNT(*) as total_articles,
      SUM(CASE WHEN json_array_length(mitre_techniques) > 0 THEN 1 ELSE 0 END) as with_mitre
    FROM articles
    WHERE resolution = 'NEW'
      AND date(created_at) >= date('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date DESC
  `).all(options.days) as any[];
  
  if (coverage.length === 0) {
    console.log('No articles found.');
    return;
  }
  
  console.log('Daily Coverage:\n');
  for (const row of coverage) {
    const percentage = ((row.with_mitre / row.total_articles) * 100).toFixed(1);
    console.log(`   ${row.date}  ${row.with_mitre.toString().padStart(3)}/${row.total_articles.toString().padStart(3)} (${percentage}%)`);
  }
  
  // Most common techniques
  console.log(`\n🔝 Top MITRE Techniques:\n`);
  const techniques = db.prepare(`
    SELECT 
      json_extract(value, '$.id') as technique_id,
      json_extract(value, '$.name') as technique_name,
      COUNT(*) as frequency
    FROM articles,
         json_each(articles.mitre_techniques)
    WHERE date(articles.created_at) >= date('now', '-' || ? || ' days')
      AND articles.resolution = 'NEW'
    GROUP BY technique_id
    ORDER BY frequency DESC
    LIMIT ?
  `).all(options.days, parseInt(options.limit, 10)) as any[];
  
  for (const row of techniques) {
    console.log(`   ${row.technique_id?.padEnd(10) || '(no id)'.padEnd(10)} ${row.frequency.toString().padStart(3)}x  ${row.technique_name || '(no name)'}`);
  }
}

function showSeverity(db: any, options: ViewLogsOptions) {
  console.log(`⚠️  Severity Distribution (last ${options.days} days)\n`);
  
  const severity = db.prepare(`
    SELECT 
      severity,
      COUNT(*) as count
    FROM articles
    WHERE resolution = 'NEW'
      AND date(created_at) >= date('now', '-' || ? || ' days')
    GROUP BY severity
    ORDER BY 
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        WHEN 'informational' THEN 5
      END
  `).all(options.days) as any[];
  
  if (severity.length === 0) {
    console.log('No articles found.');
    return;
  }
  
  const total = severity.reduce((sum: number, row: any) => sum + row.count, 0);
  
  for (const row of severity) {
    const emoji = row.severity === 'critical' ? '🔴' :
                  row.severity === 'high' ? '🟠' :
                  row.severity === 'medium' ? '🟡' :
                  row.severity === 'low' ? '🔵' : '⚪';
    const percentage = ((row.count / total) * 100).toFixed(1);
    console.log(`   ${emoji} ${row.severity.padEnd(15)} ${row.count.toString().padStart(4)} (${percentage}%)`);
  }
  
  console.log(`\n   Total: ${total} articles`);
}

function main() {
  const options = parseArgs();
  
  // Connect to database
  const DB_PATH = 'logs/content-generation-v2.db';
  const db = new Database(DB_PATH, { readonly: true });
  
  // Route to appropriate command
  switch (options.command) {
    case 'api':
      showApiLogs(db, options);
      break;
    case 'costs':
      showCosts(db, options);
      break;
    case 'resolutions':
      showResolutions(db, options);
      break;
    case 'updates':
      showUpdates(db, options);
      break;
    case 'tables':
      showTables(db);
      break;
    case 'sources':
      showSources(db, options);
      break;
    case 'mitre':
      showMitre(db, options);
      break;
    case 'severity':
      showSeverity(db, options);
      break;
    default:
      console.error(`❌ Unknown command: ${options.command}`);
      console.error('Available commands: api, costs, resolutions, updates, tables, sources, mitre, severity');
      process.exit(1);
  }
}

main();
