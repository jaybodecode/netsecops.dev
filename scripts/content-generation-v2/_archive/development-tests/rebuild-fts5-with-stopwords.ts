/**
 * Rebuild FTS5 Index with Stopwords Removed
 * 
 * This script rebuilds the articles_fts table with cleaned text (stopwords removed).
 * 
 * Why needed:
 * - Original FTS5 index contains raw text with stopwords
 * - New strategy removes stopwords before indexing for better matching
 * - Must rebuild existing data to match new insertion strategy
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/rebuild-fts5-with-stopwords.ts
 *   npx tsx scripts/content-generation-v2/rebuild-fts5-with-stopwords.ts --dry-run
 */

import { getDB } from './database/index.js';
import { removeStopwords, eng } from 'stopword';

interface Article {
  id: string;
  slug: string;
  headline: string;
  summary: string;
  full_report: string;
}

/**
 * Clean text by removing stopwords for FTS5 indexing
 */
function cleanTextForFTS(text: string): string {
  if (!text) return '';
  
  // Extract words, normalize
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3);
  
  // Remove English stopwords
  const cleaned = removeStopwords(words, eng);
  
  // Rejoin with spaces
  return cleaned.join(' ');
}

/**
 * Main execution
 */
function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Rebuild FTS5 Index with Stopwords Removed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  const db = getDB();
  
  // Get all articles
  console.log('📋 Step 1: Loading articles from database...');
  const articles = db.prepare(`
    SELECT id, slug, headline, summary, full_report
    FROM articles
    ORDER BY created_at ASC
  `).all() as Article[];
  
  console.log(`   ✅ Loaded ${articles.length} articles\n`);
  
  // Show sample of cleaning
  if (articles.length > 0) {
    const sample = articles[0]!;
    console.log('📝 Sample text cleaning (first article):');
    console.log(`   Original headline: "${sample.headline.substring(0, 80)}..."`);
    console.log(`   Cleaned headline:  "${cleanTextForFTS(sample.headline).substring(0, 80)}..."`);
    
    const originalWords = sample.headline.split(/\s+/).length;
    const cleanedWords = cleanTextForFTS(sample.headline).split(/\s+/).length;
    const reduction = Math.round((1 - cleanedWords / originalWords) * 100);
    console.log(`   Word count: ${originalWords} → ${cleanedWords} (${reduction}% reduction)\n`);
  }
  
  if (dryRun) {
    console.log('✅ Dry run complete - no changes made');
    return;
  }
  
  // Start rebuild
  console.log('📋 Step 2: Rebuilding articles_fts table...');
  
  const rebuildTransaction = db.transaction(() => {
    // Clear existing FTS5 data
    console.log('   🗑️  Clearing existing FTS5 data...');
    db.prepare('DELETE FROM articles_fts').run();
    
    // Insert cleaned data
    console.log('   📝 Inserting cleaned text...');
    const insertStmt = db.prepare(`
      INSERT INTO articles_fts (article_id, headline, summary, full_report)
      VALUES (?, ?, ?, ?)
    `);
    
    let processedCount = 0;
    for (const article of articles) {
      const cleanedHeadline = cleanTextForFTS(article.headline);
      const cleanedSummary = cleanTextForFTS(article.summary);
      const cleanedFullReport = cleanTextForFTS(article.full_report);
      
      insertStmt.run(
        article.id,
        cleanedHeadline,
        cleanedSummary,
        cleanedFullReport
      );
      
      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`   ⏳ Processed ${processedCount}/${articles.length} articles...`);
      }
    }
    
    return processedCount;
  });
  
  try {
    const count = rebuildTransaction();
    console.log(`   ✅ Rebuilt FTS5 index with ${count} articles\n`);
    
    // Optimize FTS5 index
    console.log('📋 Step 3: Optimizing FTS5 index...');
    db.prepare("INSERT INTO articles_fts(articles_fts) VALUES('optimize')").run();
    console.log('   ✅ Optimization complete\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS - FTS5 Index Rebuilt\n');
    console.log(`   Articles processed: ${count}`);
    console.log(`   Stopwords removed: Yes (using 'stopword' library)`);
    console.log(`   Query strategy: Space-separated implicit AND matching\n`);
    console.log('Next Steps:');
    console.log('   1. Run check-duplicates-v3.ts to test new scores');
    console.log('   2. Verify scores reach -150 to -177 range for known duplicates');
    console.log('   3. Adjust thresholds if needed based on actual score distribution\n');
    
  } catch (error: any) {
    console.error('\n❌ ERROR rebuilding FTS5 index:');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

// Run main
main();
