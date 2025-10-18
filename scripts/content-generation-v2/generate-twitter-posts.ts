#!/usr/bin/env npx tsx

/**
 * Generate Twitter/X Posts (Step 8.5a)
 * 
 * Generates Twitter/X posts for NEW articles and saves to database.
 * Always writes to tmp/ directory for debugging.
 * 
 * Usage:
 *   # Normal mode - writes to database
 *   npx tsx scripts/content-generation-v2/generate-twitter-posts.ts --date 2025-10-17
 * 
 *   # Test mode - writes to tmp/ only (no database)
 *   npx tsx scripts/content-generation-v2/generate-twitter-posts.ts --date 2025-10-17 --test
 * 
 * Options:
 *   --date YYYY-MM-DD    Generate posts for articles from this date (required)
 *   --test               Test mode - write to tmp/ only, skip database
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = 'logs/content-generation-v2.db';
const TMP_OUTPUT_DIR = 'tmp/twitter-posts';
const TMP_TWEETS_JSON = 'tmp/twitter/tweets.json'; // For image generator compatibility

interface ArticleRow {
  slug: string;
  headline: string;
  twitter_post: string | null;
  category: string; // JSON array
  severity: string;
}

// Matches post-to-twitter-single.ts Tweet interface
interface TweetExport {
  slug: string;
  headline: string;
  tweet_text: string;
  categories: string[];
  primary_category: string;
  image_filename: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  is_update: boolean;
  char_count?: number;
}

/**
 * Parse arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let date: string | null = null;
  let testMode = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      date = args[i + 1]!;
      i++;
    } else if (args[i] === '--test') {
      testMode = true;
    }
  }

  if (!date) {
    console.error('❌ ERROR: --date argument required\n');
    console.error('Usage:');
    console.error('  npx tsx scripts/content-generation-v2/generate-twitter-posts.ts --date YYYY-MM-DD [--test]\n');
    console.error('Example:');
    console.error('  npx tsx scripts/content-generation-v2/generate-twitter-posts.ts --date 2025-10-17');
    console.error('  npx tsx scripts/content-generation-v2/generate-twitter-posts.ts --date 2025-10-17 --test\n');
    process.exit(1);
  }

  return { date, testMode };
}

/**
 * Ensure database schema exists
 * Schema matches post-to-twitter-single.ts Tweet interface
 */
function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      slug TEXT NOT NULL,
      platform TEXT NOT NULL,
      headline TEXT NOT NULL,
      tweet_text TEXT NOT NULL,
      categories TEXT NOT NULL,
      primary_category TEXT NOT NULL,
      image_filename TEXT NOT NULL,
      severity TEXT NOT NULL,
      is_update INTEGER NOT NULL DEFAULT 0,
      char_count INTEGER,
      posted INTEGER DEFAULT 0,
      posted_at DATETIME,
      tweet_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_social_posts_article_id ON social_posts(article_id);
    CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
    CREATE INDEX IF NOT EXISTS idx_social_posts_slug ON social_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_social_posts_posted ON social_posts(posted);
  `);
}

/**
 * Main function
 */
async function main() {
  console.log('� Generate Twitter/X Posts (Step 8.5a)\n');

  const { date, testMode } = parseArgs();

  if (testMode) {
    console.log('⚠️  TEST MODE: Will write to tmp/ only (no database)\n');
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('❌ ERROR: Invalid date format. Expected YYYY-MM-DD\n');
    process.exit(1);
  }

  // Check database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ ERROR: Database not found: ${DB_PATH}\n`);
    process.exit(1);
  }

  // Open database
  const db = new Database(DB_PATH);
  
  // Ensure schema exists (only in non-test mode)
  if (!testMode) {
    ensureSchema(db);
  }

  // Query articles for the date (only NEW resolution)
  console.log(`📅 Querying NEW articles for ${date}...\n`);
  
  const articles = db.prepare(`
    SELECT 
      slug,
      headline,
      twitter_post,
      category,
      severity
    FROM articles
    WHERE date(created_at) = ?
      AND resolution = 'NEW'
    ORDER BY created_at DESC
  `).all(date) as ArticleRow[];

  if (articles.length === 0) {
    db.close();
    console.error(`❌ ERROR: No NEW articles found for ${date}\n`);
    console.error('Possible causes:');
    console.error('  - Date has not been processed yet (run Steps 1-5 first)');
    console.error('  - All articles were marked as duplicates (SKIP-FTS5/SKIP-LLM)');
    console.error('  - Date format is incorrect\n');
    process.exit(1);
  }

  console.log(`✅ Found ${articles.length} NEW articles\n`);

  // Transform to tweet format (matches post-to-twitter-single.ts format)
  const tweets: TweetExport[] = articles.map(article => {
    // Parse category JSON array
    let categories: string[] = [];
    try {
      const parsed = JSON.parse(article.category);
      if (Array.isArray(parsed)) {
        categories = parsed;
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Could not parse category for ${article.slug}, using ['Other']`);
      categories = ['Other'];
    }

    // Use twitter_post or fallback to headline
    const tweetText = article.twitter_post || article.headline;
    
    // Image filename (OG image format)
    const imageFilename = `${article.slug}.png`;

    return {
      slug: article.slug,
      headline: article.headline,
      tweet_text: tweetText,
      categories: categories,
      primary_category: categories[0] || 'Other',
      image_filename: imageFilename,
      severity: article.severity as TweetExport['severity'],
      is_update: false, // NEW articles are never updates
    };
  });

  // ALWAYS write to tmp/ for debugging (like other generate scripts)
  if (!fs.existsSync(TMP_OUTPUT_DIR)) {
    fs.mkdirSync(TMP_OUTPUT_DIR, { recursive: true });
  }
  
  // Write to tmp/twitter-posts/{date}.json for debugging
  const tmpOutputPath = path.join(TMP_OUTPUT_DIR, `${date}.json`);
  fs.writeFileSync(tmpOutputPath, JSON.stringify(tweets, null, 2), 'utf-8');
  
  // Also write to tmp/twitter/tweets.json for image generator compatibility
  const tweetsDir = path.dirname(TMP_TWEETS_JSON);
  if (!fs.existsSync(tweetsDir)) {
    fs.mkdirSync(tweetsDir, { recursive: true });
  }
  fs.writeFileSync(TMP_TWEETS_JSON, JSON.stringify(tweets, null, 2), 'utf-8');

  console.log(`� Wrote to tmp: ${tmpOutputPath}`);
  console.log(`💾 Wrote to tmp: ${TMP_TWEETS_JSON} (for image generator)\n`);

  // Write to database (unless test mode)
  if (!testMode) {
    console.log('💾 Writing to database...\n');
    
    const insertStmt = db.prepare(`
      INSERT INTO social_posts (
        article_id, slug, platform, headline, tweet_text, 
        categories, primary_category, image_filename, severity, is_update
      )
      VALUES (
        (SELECT id FROM articles WHERE slug = ?),
        ?, 'twitter', ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    let inserted = 0;
    for (const tweet of tweets) {
      try {
        insertStmt.run(
          tweet.slug,              // for article_id lookup
          tweet.slug,              // slug
          tweet.headline,          // headline
          tweet.tweet_text,        // tweet_text
          JSON.stringify(tweet.categories),  // categories (as JSON array)
          tweet.primary_category,  // primary_category
          tweet.image_filename,    // image_filename
          tweet.severity,          // severity
          tweet.is_update ? 1 : 0  // is_update (boolean to integer)
        );
        inserted++;
      } catch (error: any) {
        console.warn(`⚠️  Warning: Could not insert ${tweet.slug}: ${error.message}`);
      }
    }

    console.log(`✅ Inserted ${inserted} posts into database\n`);
  }

  // Close database
  db.close();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ GENERATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`  Generated: ${tweets.length} Twitter posts`);
  console.log(`  Tmp output: ${tmpOutputPath}`);
  if (!testMode) {
    console.log(`  Database: Saved to social_posts table`);
  }
  console.log();

  // Show sample
  if (tweets.length > 0) {
    console.log('📋 Sample export:\n');
    const sample = tweets[0]!;
    console.log(`  Slug: ${sample.slug}`);
    console.log(`  Headline: ${sample.headline}`);
    console.log(`  Categories: ${sample.categories.join(', ')}`);
    console.log(`  Primary: ${sample.primary_category}`);
    console.log(`  Severity: ${sample.severity}\n`);
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
