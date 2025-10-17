/**
 * Content Generation V3 - Process Article Updates
 * 
 * For articles marked as SKIP-UPDATE, generate update objects and append to the
 * original article's updates array.
 * 
 * Process:
 * 1. Find all articles with resolution='SKIP-UPDATE'
 * 2. For each, read the original article (matched_article_id)
 * 3. Call LLM to generate an ArticleUpdate object comparing old vs new
 * 4. Append update to the updates JSON array in the original article
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/process-article-updates.ts --all
 *   npx tsx scripts/content-generation-v2/process-article-updates.ts --date 2025-10-07
 *   npx tsx scripts/content-generation-v2/process-article-updates.ts --dry-run
 */

import 'dotenv/config';
import { Command } from 'commander';
import { getDB } from './database/index.js';
import { callVertex } from './ai/vertex.js';
import type { Database } from 'better-sqlite3';

interface CLIOptions {
  all: boolean;
  date?: string;
  dryRun: boolean;
}

interface Article {
  id: string;
  slug: string;
  headline: string;
  summary: string;
  full_report: string;
  pub_date: string;
  created_at: string;
  updates: string | null; // JSON string
}

interface ArticleUpdate {
  datetime: string;
  summary: string;
  content: string;
  sources: Array<{
    source_id: string;
    url: string;
    title: string;
    root_url: string;
    source_date?: string;
  }>;
  severity_change: 'increased' | 'decreased' | 'unchanged';
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('process-article-updates')
    .description('Generate and append update objects for SKIP-UPDATE articles')
    .option('--all', 'Process all SKIP-UPDATE articles')
    .option('--date <date>', 'Process SKIP-UPDATE articles from specific date (YYYY-MM-DD)')
    .option('--dry-run', 'Show what would be done without updating database')
    .helpOption('-h, --help', 'Display help information')
    .addHelpText('after', `
Examples:
  # Process all SKIP-UPDATE articles
  npx tsx scripts/content-generation-v2/process-article-updates.ts --all
  
  # Process from specific date
  npx tsx scripts/content-generation-v2/process-article-updates.ts --date 2025-10-09
  
  # Dry run
  npx tsx scripts/content-generation-v2/process-article-updates.ts --all --dry-run
`)
    .parse(process.argv);
  
  const options = program.opts();
  
  const hasAll = !!options.all;
  const hasDate = !!options.date;
  
  if (!hasAll && !hasDate) {
    console.error('❌ Error: Must specify --all or --date');
    process.exit(1);
  }
  
  if (hasAll && hasDate) {
    console.error('❌ Error: Cannot combine --all and --date');
    process.exit(1);
  }
  
  return {
    all: hasAll,
    date: options.date,
    dryRun: !!options.dryRun
  };
}

/**
 * Get articles marked as SKIP-UPDATE
 */
function getSkipUpdateArticles(db: Database, options: CLIOptions): Array<{
  new_article_id: string;
  matched_article_id: string;
  new_created_at: string;
}> {
  let query = `
    SELECT 
      id as new_article_id,
      matched_article_id,
      created_at as new_created_at
    FROM articles
    WHERE resolution = 'SKIP-UPDATE'
      AND matched_article_id IS NOT NULL
  `;
  const params: any[] = [];
  
  if (options.date) {
    query += ' AND DATE(created_at) = ?';
    params.push(options.date);
  }
  
  query += ' ORDER BY created_at ASC';
  
  return db.prepare(query).all(...params) as Array<{
    new_article_id: string;
    matched_article_id: string;
    new_created_at: string;
  }>;
}

/**
 * Get article by ID
 */
function getArticle(db: Database, articleId: string): Article | null {
  return db.prepare(`
    SELECT id, slug, headline, summary, full_report, pub_date, created_at, updates
    FROM articles
    WHERE id = ?
  `).get(articleId) as Article | null;
}

/**
 * Generate ArticleUpdate object using LLM
 * 
 * Uses gemini-2.0-flash-exp for speed (fast, cheap, good for structured output)
 */
async function generateArticleUpdate(
  originalArticle: Article,
  newArticle: Article
): Promise<ArticleUpdate> {
  const prompt = `You are analyzing a cybersecurity article update. An original article exists, and a new article provides additional information about the same incident.

Generate an ArticleUpdate object that summarizes ONLY the NEW information from the updated article.

ORIGINAL ARTICLE (${originalArticle.pub_date}):
Headline: ${originalArticle.headline}
Summary: ${originalArticle.summary}
Full Report:
${originalArticle.full_report}

NEW ARTICLE (${newArticle.pub_date}):
Headline: ${newArticle.headline}
Summary: ${newArticle.summary}
Full Report:
${newArticle.full_report}

CRITICAL INSTRUCTIONS:
1. datetime: Use the new article's publication date (${newArticle.pub_date}) in ISO 8601 format with time
2. summary: 50-150 chars summarizing what's NEW (e.g., "Vendor released emergency patch" or "Attack confirmed in 5 additional countries")
3. content: 200-800 chars explaining the NEW information - what changed, why it matters, new recommendations
4. sources: Extract ONLY sources from the NEW article that aren't in the original
5. severity_change: Determine if this update makes the threat worse (increased), better (decreased), or same severity (unchanged)

Write the update as a STANDALONE addition that readers can understand without re-reading the full original article.

Respond ONLY with valid JSON matching this exact schema (no markdown, no explanation):
{
  "datetime": "ISO 8601 timestamp",
  "summary": "Brief summary of what changed (50-150 chars)",
  "content": "Detailed update content (200-800 chars)",
  "sources": [
    {
      "source_id": "base64_url_hash_16_chars",
      "url": "https://...",
      "title": "Article title",
      "root_url": "domain.com",
      "source_date": "MM/DD/YYYY or empty"
    }
  ],
  "severity_change": "increased" | "decreased" | "unchanged"
}`;

  try {
    const response = await callVertex(
      prompt,
      {
        model: 'gemini-2.0-flash-exp', // Fast and cheap for structured output
        temperature: 0.1,
        maxTokens: 1000,
      }
    );
    
    // Parse JSON response from content - strip markdown if present
    let content = response.content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const update = JSON.parse(content) as ArticleUpdate;
    
    // Validate required fields
    if (!update.datetime || !update.summary || !update.content || !update.sources || !update.severity_change) {
      throw new Error('Missing required fields in LLM response');
    }
    
    return update;
  } catch (error) {
    console.error('❌ LLM call failed:', error);
    throw error;
  }
}

/**
 * Append update to article's updates array
 */
function appendUpdateToArticle(
  db: Database,
  articleId: string,
  update: ArticleUpdate,
  dryRun: boolean
): void {
  if (dryRun) {
    console.log(`      [DRY-RUN] Would append update to article ${articleId.substring(0, 8)}...`);
    console.log(`      Summary: ${update.summary}`);
    console.log(`      Severity change: ${update.severity_change}`);
    return;
  }
  
  // Get current updates array
  const article = getArticle(db, articleId);
  if (!article) {
    throw new Error(`Article ${articleId} not found`);
  }
  
  // Parse existing updates or create empty array
  let updates: ArticleUpdate[] = [];
  if (article.updates) {
    try {
      updates = JSON.parse(article.updates);
    } catch (e) {
      console.warn(`⚠️  Failed to parse existing updates for ${articleId}, creating new array`);
    }
  }
  
  // Append new update
  updates.push(update);
  
  // Update database
  db.prepare(`
    UPDATE articles
    SET updates = ?
    WHERE id = ?
  `).run(JSON.stringify(updates), articleId);
  
  console.log(`      ✅ Appended update to article (total updates: ${updates.length})`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Process Article Updates - Generate Update Objects\n');
  
  const options = parseArgs();
  const db = getDB();
  
  console.log(`⚙️  Configuration:`);
  console.log(`   Mode: ${options.all ? 'ALL articles' : `Date ${options.date}`}`);
  console.log(`   Dry run: ${options.dryRun ? 'YES' : 'NO'}\n`);
  
  // Get SKIP-UPDATE articles
  const skipUpdateArticles = getSkipUpdateArticles(db, options);
  
  if (skipUpdateArticles.length === 0) {
    console.log('✅ No SKIP-UPDATE articles found');
    return;
  }
  
  console.log(`📊 Found ${skipUpdateArticles.length} article(s) to process\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < skipUpdateArticles.length; i++) {
    const item = skipUpdateArticles[i];
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Processing ${i + 1}/${skipUpdateArticles.length}:`);
    console.log(`   New article: ${item.new_article_id.substring(0, 8)}...`);
    console.log(`   Original article: ${item.matched_article_id.substring(0, 8)}...\n`);
    
    try {
      // Get both articles
      const newArticle = getArticle(db, item.new_article_id);
      const originalArticle = getArticle(db, item.matched_article_id);
      
      if (!newArticle || !originalArticle) {
        console.error(`   ❌ Failed to fetch articles`);
        failCount++;
        continue;
      }
      
      console.log(`   📖 Original: ${originalArticle.headline.substring(0, 60)}...`);
      console.log(`   🆕 New: ${newArticle.headline.substring(0, 60)}...\n`);
      console.log(`   🤖 Calling LLM to generate update object...`);
      
      // Generate update object
      const update = await generateArticleUpdate(originalArticle, newArticle);
      
      console.log(`   ✅ Generated update:`);
      console.log(`      Summary: ${update.summary}`);
      console.log(`      Content length: ${update.content.length} chars`);
      console.log(`      Sources: ${update.sources.length}`);
      console.log(`      Severity change: ${update.severity_change}\n`);
      
      // Append to original article
      appendUpdateToArticle(db, item.matched_article_id, update, options.dryRun);
      
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error processing article:`, error);
      failCount++;
    }
    
    console.log('');
  }
  
  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Processing Summary:');
  console.log(`   Articles processed: ${skipUpdateArticles.length}`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (options.dryRun) {
    console.log('\n⚠️  DRY-RUN mode: No changes written to database');
  }
  
  console.log('\n✅ Article update processing complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
