/**
 * Content Generation V3 - Publication Generation
 * 
 * Step 5: Generate final publication from resolution decisions
 * 
 * Process:
 * 1. Load articles by date with resolution='NEW' from articles table
 * 2. Load publication candidate from structured_news
 * 3. Create records in publications, published_articles, publication_articles tables
 * 4. For NEW: Use article data directly from articles table
 * 5. For UPDATE: Already handled by apply-updates.ts (updates JSON column)
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/generate-publication-v3.ts --date 2025-10-09
 *   npx tsx scripts/content-generation-v2/generate-publication-v3.ts --date 2025-10-09 --force
 * 
 * Critical Rules:
 * - V3 stores resolutions in articles.resolution column (not article_resolutions table)
 * - V3 stores all article data in articles table (no articles_meta or entity tables)
 * - Publication slugs are deterministic: {pub_type}-threat-publications-{date}
 * - Article slugs from articles table (NEVER change)
 * - UPDATE handling: Done by apply-updates.ts, not this script
 * - SKIP handling: Not needed in V3 (SKIPs don't get published)
 * 
 * LLM: None needed - V3 simplifies publication generation
 */

import 'dotenv/config';
import { Command } from 'commander';
import Database from 'better-sqlite3';
import { getStructuredNewsByDate } from './database/schema-structured-news.js';
import {
  createPublication,
  getPublicationByDate,
  deletePublication,
  type Publication
} from './database/schema-publications.js';
import type { CyberAdvisoryType } from './news-structured-schema.js';

const DB_PATH = 'logs/content-generation-v2.db';

interface CLIOptions {
  date: string;
  force: boolean;
}

interface ArticleRow {
  id: string;
  slug: string;
  headline: string;
  title: string;
  summary: string;
  full_report: string;
  pub_date: string;
  resolution: string;
  created_at: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('generate-publication-v3')
    .description('Generate final publication from resolution decisions (Step 5) - V3')
    .requiredOption('--date <date>', 'Publication date (YYYY-MM-DD)')
    .option('--force', 'Force re-generation (delete existing publication)')
    .helpOption('-h, --help', 'Display help information')
    .addHelpText('after', `
Examples:
  # Generate publication for specific date
  npx tsx scripts/content-generation-v2/generate-publication-v3.ts --date 2025-10-09
  
  # Force re-generation (delete and recreate)
  npx tsx scripts/content-generation-v2/generate-publication-v3.ts --date 2025-10-09 --force

Database Tables Created:
  - publications (normalized publication metadata)
  - published_articles (normalized article content)
  - publication_articles (many-to-many join table)

Key Concepts:
  - NEW articles: Create new published_articles entry
  - UPDATE articles: Already handled by apply-updates.ts (not by this script)
  - SKIP articles: Not published (filtered out)
  - V3 Simplification: Direct queries from articles table
`)
    .parse(process.argv);
  
  return {
    date: program.opts().date,
    force: program.opts().force ?? false
  };
}

/**
 * Get articles by date and resolution
 */
function getArticlesByDateAndResolution(db: Database.Database, date: string, resolution: string): ArticleRow[] {
  const stmt = db.prepare(`
    SELECT 
      id, slug, headline, title, summary, full_report,
      pub_date, resolution, created_at
    FROM articles
    WHERE DATE(pub_date) = ? AND resolution = ?
    ORDER BY created_at ASC
  `);
  
  return stmt.all(date, resolution) as ArticleRow[];
}

/**
 * Process NEW article - create new published_articles entry
 */
function processNewArticle(
  db: Database.Database,
  article: ArticleRow,
  publicationId: string,
  position: number
): void {
  console.log(`\n📄 NEW Article (${position}):`);
  console.log(`   ID: ${article.id}`);
  console.log(`   Slug: ${article.slug}`);
  console.log(`   Headline: ${article.headline.substring(0, 60)}...`);
  
  // Create published article record
  const insertArticle = db.prepare(`
    INSERT INTO published_articles (
      id, publication_id, slug, headline, summary, full_report,
      position, is_update, original_pub_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertArticle.run(
    article.id,
    publicationId,
    article.slug,
    article.headline,
    article.summary,
    article.full_report,
    position,
    0, // is_update = false
    article.pub_date
  );
  
  // Link article to publication
  const linkArticle = db.prepare(`
    INSERT INTO publication_articles (
      publication_id, article_id, position, is_primary
    ) VALUES (?, ?, ?, ?)
  `);
  
  linkArticle.run(
    publicationId,
    article.id,
    position,
    1 // is_primary = true
  );
  
  console.log(`   ✅ Created published_articles entry`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Publication Generation - Step 5 (V3)\n');
  
  const options = parseArgs();
  
  console.log(`⚙️  Configuration:`);
  console.log(`   Date: ${options.date}`);
  console.log(`   Force: ${options.force ? 'YES' : 'NO'}\n`);
  
  // Open database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF'); // Disable FK constraints (old V2 tables have wrong references)
  
  try {
    // Check if publication already exists
    if (!options.force) {
      const existingPub = getPublicationByDate(options.date);
      if (existingPub) {
        console.log(`⚠️  Publication already exists for ${options.date}`);
        console.log(`   ID: ${existingPub.id}`);
        console.log(`   Headline: ${existingPub.headline}`);
        console.log(`   Use --force to re-generate\n`);
        process.exit(0);
      }
    } else {
      // Delete existing publication if --force
      const existingPub = getPublicationByDate(options.date);
      if (existingPub) {
        console.log(`🗑️  Deleting existing publication: ${existingPub.id}\n`);
        deletePublication(existingPub.id);
      }
    }
    
    // 1. Load publication candidate from structured_news
    const candidate = getStructuredNewsByDate(options.date);
    if (!candidate) {
      console.error(`❌ No publication candidate found for ${options.date}`);
      console.error(`   Run: npx tsx scripts/content-generation-v2/news-structured.ts --date ${options.date}`);
      process.exit(1);
    }
    
    console.log(`📊 Loaded publication candidate:`);
    console.log(`   Headline: ${candidate.headline}`);
    console.log(`   Articles: ${candidate.total_articles}`);
    console.log(`   Pub ID: ${candidate.pub_id}\n`);
    
    const candidateData = JSON.parse(candidate.data) as CyberAdvisoryType;
    
    // 2. Load articles with resolution='NEW'
    const newArticles = getArticlesByDateAndResolution(db, options.date, 'NEW');
    
    console.log(`📊 Found ${newArticles.length} NEW articles to publish\n`);
    
    if (newArticles.length === 0) {
      console.error(`❌ No NEW articles found for ${options.date}`);
      console.error(`   Check resolutions: sqlite3 logs/content-generation-v2.db "SELECT resolution, COUNT(*) FROM articles WHERE DATE(created_at)='${options.date}' GROUP BY resolution"`);
      process.exit(1);
    }
    
    // 3. Determine publication metadata
    const finalHeadline = candidateData.headline;
    const finalSummary = candidateData.summary;
    
    // Generate deterministic slug based on pub_type and date
    const pubType = candidate.pub_type || 'daily';
    const finalSlug = `${pubType}-threat-publications-${options.date}`;
    
    console.log(`📝 Publication details:`);
    console.log(`   Type: ${pubType}`);
    console.log(`   Slug: ${finalSlug}`);
    console.log(`   Headline: ${finalHeadline}`);
    console.log(`   Articles: ${newArticles.length}\n`);
    
    // 4. Create publication record
    const publicationId = `pub-${options.date}`;
    
    console.log(`📝 Creating publication record...`);
    createPublication({
      id: publicationId,
      pub_date: options.date,
      headline: finalHeadline,
      summary: finalSummary,
      slug: finalSlug,
      article_count: newArticles.length
    });
    
    console.log(`   ✅ Created publication: ${publicationId}\n`);
    
    // 5. Process each article
    console.log(`📄 Processing articles...`);
    
    let position = 1;
    let successCount = 0;
    let errorCount = 0;
    
    for (const article of newArticles) {
      try {
        processNewArticle(db, article, publicationId, position);
        successCount++;
        position++;
      } catch (error: any) {
        console.error(`\n❌ Failed to process article ${article.id}:`);
        console.error(`   ${error.message}`);
        errorCount++;
      }
    }
    
    // Final summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Publication Generation Summary:');
    console.log(`   Publication ID: ${publicationId}`);
    console.log(`   Date: ${options.date}`);
    console.log(`   Headline: ${finalHeadline}`);
    console.log(`   Slug: ${finalSlug}`);
    console.log(`   Articles processed: ${successCount} / ${newArticles.length}`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Errors: ${errorCount}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (successCount > 0) {
      console.log('\n✅ Publication generation complete!\n');
      
      console.log('Next steps:');
      console.log('  1. View publication:');
      console.log(`     sqlite3 logs/content-generation-v2.db "SELECT * FROM publications WHERE id = '${publicationId}'"`);
      console.log('  2. View articles:');
      console.log(`     sqlite3 logs/content-generation-v2.db "SELECT * FROM published_articles WHERE publication_id = '${publicationId}'"`);
      console.log('  3. Export JSON files (Step 6):');
      console.log(`     npx tsx scripts/content-generation-v2/generate-publication-json.ts --date ${options.date}`);
    } else {
      console.error('\n❌ No articles were successfully processed');
      process.exit(1);
    }
    
  } finally {
    db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

// Export functions for use in other scripts
export {
  getArticlesByDateAndResolution,
  processNewArticle
};
