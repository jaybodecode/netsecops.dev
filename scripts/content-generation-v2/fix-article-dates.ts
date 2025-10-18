/**
 * One-Time Fix: Update articles.created_at and articles.updated_at
 * 
 * Converts date-only format (YYYY-MM-DD) to ISO 8601 with time and timezone
 * (YYYY-MM-DDTHH:MM:SS.SSSZ) for all articles in the database.
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/fix-article-dates.ts
 *   npx tsx scripts/content-generation-v2/fix-article-dates.ts --dry-run
 */

import Database from 'better-sqlite3';
import { parseArgs } from 'node:util';

const DB_PATH = 'logs/content-generation-v2.db';

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'dry-run': { type: 'boolean', default: false },
  },
  strict: true,
  allowPositionals: false,
});

const isDryRun = values['dry-run'];

console.log('🔧 Fix Article Dates - One-Time Database Update');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '✍️  WRITE'}\n`);

// Open database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

interface Article {
  id: string;
  slug: string;
  created_at: string;
  updated_at: string | null;
}

/**
 * Check if a date string is date-only format (YYYY-MM-DD)
 */
function isDateOnly(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Convert date-only format to ISO 8601 with time at 15:00 UTC (9am CST)
 */
function convertToISO8601(dateStr: string): string {
  if (dateStr.includes('T')) {
    // Already has time component
    return dateStr;
  }
  // Add time component: 9am CST = 15:00 UTC
  return `${dateStr}T15:00:00.000Z`;
}

/**
 * Get all articles with date-only format in created_at or updated_at
 */
function getArticlesWithDateOnlyFormat(): Article[] {
  const stmt = db.prepare(`
    SELECT id, slug, created_at, updated_at
    FROM articles
    ORDER BY created_at DESC
  `);
  
  const articles = stmt.all() as Article[];
  
  return articles.filter(article => 
    isDateOnly(article.created_at) || isDateOnly(article.updated_at)
  );
}

/**
 * Update article dates
 */
function updateArticleDates(article: Article): void {
  const newCreatedAt = convertToISO8601(article.created_at);
  const newUpdatedAt = article.updated_at ? convertToISO8601(article.updated_at) : newCreatedAt;
  
  if (isDryRun) {
    console.log(`   📄 ${article.slug}`);
    if (isDateOnly(article.created_at)) {
      console.log(`      created_at: ${article.created_at} → ${newCreatedAt}`);
    }
    if (isDateOnly(article.updated_at)) {
      console.log(`      updated_at: ${article.updated_at} → ${newUpdatedAt}`);
    }
  } else {
    const stmt = db.prepare(`
      UPDATE articles
      SET created_at = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(newCreatedAt, newUpdatedAt, article.id);
    
    console.log(`   ✅ ${article.slug}`);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Get articles needing updates
    const articles = getArticlesWithDateOnlyFormat();
    
    if (articles.length === 0) {
      console.log('✨ All article dates are already in ISO 8601 format!\n');
      return;
    }
    
    console.log(`📊 Found ${articles.length} article(s) with date-only format\n`);
    
    if (isDryRun) {
      console.log('🔍 DRY RUN - Would update:\n');
    } else {
      console.log('✍️  Updating article dates:\n');
    }
    
    // Update articles
    for (const article of articles) {
      updateArticleDates(article);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (isDryRun) {
      console.log(`🔍 DRY RUN: Would update ${articles.length} article(s)`);
      console.log('   Run without --dry-run to apply changes');
    } else {
      console.log(`✅ Updated ${articles.length} article(s) to ISO 8601 format`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
