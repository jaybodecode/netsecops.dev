/**
 * Content Generation V2 - View Resolution Results
 * 
 * View saved article resolution decisions and statistics.
 * Useful for analyzing LLM performance and tuning thresholds.
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/view-resolutions.ts --date 2025-10-09
 *   npx tsx scripts/content-generation-v2/view-resolutions.ts --stats
 *   npx tsx scripts/content-generation-v2/view-resolutions.ts --stats --from 2025-10-07 --to 2025-10-14
 */

import 'dotenv/config';
import { Command } from 'commander';
import { 
  getResolutionsByDate, 
  getResolutionStats,
  type ArticleResolution 
} from './database/schema-article-resolutions.js';

interface CLIOptions {
  date?: string;
  stats?: boolean;
  from?: string;
  to?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('view-resolutions')
    .description('View article resolution decisions and statistics')
    .option('--date <date>', 'View resolutions for specific date (YYYY-MM-DD)')
    .option('--stats', 'Show resolution statistics')
    .option('--from <date>', 'Start date for stats (YYYY-MM-DD)')
    .option('--to <date>', 'End date for stats (YYYY-MM-DD)')
    .helpOption('-h, --help', 'Display help information')
    .addHelpText('after', `
Examples:
  # View resolutions for specific date
  npx tsx scripts/content-generation-v2/view-resolutions.ts --date 2025-10-09
  
  # Show overall statistics
  npx tsx scripts/content-generation-v2/view-resolutions.ts --stats
  
  # Show statistics for date range
  npx tsx scripts/content-generation-v2/view-resolutions.ts --stats --from 2025-10-07 --to 2025-10-14
`)
    .parse(process.argv);
  
  return program.opts();
}

/**
 * Format resolution for display
 */
function formatResolution(res: ArticleResolution): void {
  const decisionEmoji = {
    'NEW': '🟢',
    'UPDATE': '🔴',
    'SKIP': '⚪'
  };
  
  const confidenceEmoji = {
    'high': '✅',
    'medium': '⚠️',
    'low': '❓'
  };
  
  const methodEmoji = {
    'automatic': '🤖',
    'llm': '🧠'
  };
  
  console.log(`\n${decisionEmoji[res.decision]} ${res.decision} (${res.confidence} ${confidenceEmoji[res.confidence]})`);
  console.log(`   Method: ${res.resolution_method} ${methodEmoji[res.resolution_method]}`);
  console.log(`   Similarity: ${(res.similarity_score * 100).toFixed(1)}%`);
  
  if (res.original_article_id) {
    console.log(`   Original: ${res.original_slug} (${res.original_pub_date})`);
  }
  
  if (res.reasoning) {
    const reasoning = JSON.parse(res.reasoning) as string[];
    console.log(`   Reasoning:`);
    reasoning.forEach(line => console.log(`     - ${line}`));
  }
}

/**
 * Main function
 */
async function main() {
  console.log('📊 Article Resolutions Viewer\n');
  
  const options = parseArgs();
  
  if (options.date) {
    // View resolutions for specific date
    const resolutions = getResolutionsByDate(options.date);
    
    if (resolutions.length === 0) {
      console.log(`⚠️  No resolutions found for ${options.date}`);
      return;
    }
    
    console.log(`📅 Resolutions for ${options.date}:`);
    console.log(`   Total: ${resolutions.length}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const res of resolutions) {
      formatResolution(res);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Summary
    const newCount = resolutions.filter(r => r.decision === 'NEW').length;
    const updateCount = resolutions.filter(r => r.decision === 'UPDATE').length;
    const skipCount = resolutions.filter(r => r.decision === 'SKIP').length;
    const llmCount = resolutions.filter(r => r.resolution_method === 'llm').length;
    
    console.log('\n📊 Summary:');
    console.log(`   NEW: ${newCount}`);
    console.log(`   UPDATE: ${updateCount}`);
    console.log(`   SKIP: ${skipCount}`);
    console.log(`   LLM decisions: ${llmCount}`);
    
  } else if (options.stats) {
    // Show statistics
    const stats = getResolutionStats(options.from, options.to);
    
    const dateRange = options.from && options.to 
      ? `${options.from} to ${options.to}`
      : options.from 
        ? `from ${options.from}`
        : options.to
          ? `until ${options.to}`
          : 'all time';
    
    console.log(`📈 Resolution Statistics (${dateRange})\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`\n📊 Total Resolutions: ${stats.total}\n`);
    
    console.log('By Decision:');
    for (const stat of stats.by_decision) {
      const percentage = stats.total > 0 ? (stat.count / stats.total * 100).toFixed(1) : 0;
      console.log(`   ${stat.decision}: ${stat.count} (${percentage}%)`);
    }
    
    console.log('\nBy Method:');
    for (const stat of stats.by_method) {
      const percentage = stats.total > 0 ? (stat.count / stats.total * 100).toFixed(1) : 0;
      console.log(`   ${stat.resolution_method}: ${stat.count} (${percentage}%)`);
    }
    
    console.log('\nAverage Similarity by Decision:');
    for (const stat of stats.avg_similarity) {
      console.log(`   ${stat.decision}: ${(stat.avg_score * 100).toFixed(1)}%`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } else {
    console.log('⚠️  Please specify --date or --stats');
    console.log('   Example: npx tsx scripts/content-generation-v2/view-resolutions.ts --date 2025-10-09');
    console.log('   Example: npx tsx scripts/content-generation-v2/view-resolutions.ts --stats');
  }
}

main().catch(console.error);
