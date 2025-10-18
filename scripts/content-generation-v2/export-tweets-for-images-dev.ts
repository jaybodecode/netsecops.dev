#!/usr/bin/env npx tsx

/**
 * Export Tweet Data for OG Image Generation
 * 
 * Exports articles from database to tmp/twitter/tweets.json format
 * required by generate-twitter-images.ts for OG image generation.
 * 
 * This is Step 8.5 in the V3 pipeline (between last-updates and build).
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/export-tweets-for-images.ts --date 2025-10-17
 *   npx tsx scripts/content-generation-v2/export-tweets-for-images.ts --date 2025-10-17 --append
 * 
 * Options:
 *   --date YYYY-MM-DD    Export articles from this date
 *   --append             Append to existing tweets.json instead of overwriting
 *   --output PATH        Custom output path (default: tmp/twitter/tweets.json)
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = 'logs/content-generation-v2.db';
const DEFAULT_OUTPUT = 'tmp/twitter/tweets.json';

interface ArticleRow {
  slug: string;
  headline: string;
  twitter_post: string | null;
  category: string; // JSON array
  severity: string;
  resolution: string;
  created_at: string;
}

interface TweetExport {
  slug: string;
  headline: string;
  tweet_text: string;
  categories: string[];
  primary_category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  is_update: boolean;
}

/**
 * Parse arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let date: string | null = null;
  let append = false;
  let outputPath = DEFAULT_OUTPUT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      date = args[i + 1]!;
      i++;
    } else if (args[i] === '--append') {
      append = true;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1]!;
      i++;
    }
  }

  if (!date) {
    console.error('❌ ERROR: --date argument required');
    console.error('');
    console.error('Usage:');
    console.error('  npx tsx scripts/content-generation-v2/export-tweets-for-images.ts --date YYYY-MM-DD');
    console.error('');
    console.error('Examples:');
    console.error('  npx tsx scripts/content-generation-v2/export-tweets-for-images.ts --date 2025-10-17');
    console.error('  npx tsx scripts/content-generation-v2/export-tweets-for-images.ts --date 2025-10-17 --append');
    process.exit(1);
  }

  return { date, append, outputPath };
}

/**
 * Load existing tweets if appending
 */
function loadExistingTweets(outputPath: string): TweetExport[] {
  if (!fs.existsSync(outputPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(outputPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️  Warning: Could not parse existing tweets.json, starting fresh');
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  console.log('📤 Export Tweet Data for OG Images\n');

  const { date, append, outputPath } = parseArgs();

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('❌ ERROR: Invalid date format. Expected YYYY-MM-DD');
    process.exit(1);
  }

  // Check database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ ERROR: Database not found: ${DB_PATH}`);
    process.exit(1);
  }

  // Open database
  const db = new Database(DB_PATH, { readonly: true });

  // Query articles for the date (only NEW resolution)
  console.log(`📅 Querying articles for ${date}...\n`);
  
  const articles = db.prepare<ArticleRow[], string>(`
    SELECT 
      slug,
      headline,
      twitter_post,
      category,
      severity,
      resolution,
      created_at
    FROM articles
    WHERE date(created_at) = ?
      AND resolution = 'NEW'
    ORDER BY created_at DESC
  `).all(date);

  db.close();

  if (articles.length === 0) {
    console.error(`❌ ERROR: No NEW articles found for ${date}`);
    console.error('');
    console.error('Possible causes:');
    console.error('  - Date has not been processed yet (run Steps 1-5 first)');
    console.error('  - All articles were marked as duplicates (SKIP-FTS5/SKIP-LLM)');
    console.error('  - Date format is incorrect');
    process.exit(1);
  }

  console.log(`✅ Found ${articles.length} NEW articles\n`);

  // Transform to tweet format
  const tweets: TweetExport[] = articles.map(article => {
    // Parse category JSON
    let categories: string[] = [];
    try {
      const parsed = JSON.parse(article.category);
      if (Array.isArray(parsed)) {
        categories = parsed;
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Could not parse category for ${article.slug}, using empty array`);
      categories = ['Other'];
    }

    // Use twitter_post or fallback to headline
    const tweetText = article.twitter_post || article.headline;

    return {
      slug: article.slug,
      headline: article.headline,
      tweet_text: tweetText,
      categories: categories,
      primary_category: categories[0] || 'Other',
      severity: article.severity as any,
      is_update: false, // NEW articles are never updates
    };
  });

  // Load existing tweets if appending
  let finalTweets = tweets;
  if (append) {
    const existing = loadExistingTweets(outputPath);
    
    // Remove duplicates by slug (new data overwrites old)
    const existingSlugs = new Set(tweets.map(t => t.slug));
    const filtered = existing.filter(t => !existingSlugs.has(t.slug));
    
    finalTweets = [...filtered, ...tweets];
    console.log(`📝 Appending to existing tweets (${existing.length} → ${finalTweets.length})\n`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}\n`);
  }

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(finalTweets, null, 2), 'utf-8');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ EXPORT COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`  Exported: ${tweets.length} articles`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Total tweets in file: ${finalTweets.length}\n`);

  // Show sample
  if (tweets.length > 0) {
    console.log('📋 Sample export:\n');
    const sample = tweets[0]!;
    console.log(`  Slug: ${sample.slug}`);
    console.log(`  Headline: ${sample.headline}`);
    console.log(`  Tweet: ${sample.tweet_text.substring(0, 100)}...`);
    console.log(`  Category: ${sample.primary_category}`);
    console.log(`  Severity: ${sample.severity}\n`);
  }

  console.log('🎨 Next step: Generate OG images');
  console.log(`   npx tsx scripts/content-social/generate-twitter-images.ts\n`);
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
