/**
 * Content Generation V3 - FTS5 Duplicate Detection
 * 
 * Phase 3 of V3 migration: Use FTS5 full-text search with BM25 scoring
 * for duplicate detection instead of entity-based weighted similarity.
 * 
 * Algorithm:
 * 1. Query FTS5 with weighted BM25: headline 10x, summary 5x, full_report 1x
 * 2. Apply 3-tier threshold:
 *    - Score 0 to -80: AUTO mark as NEW (different story)
 *    - Score -201 or lower: AUTO mark as SKIP-FTS5 (clear duplicate)
 *    - Score -81 to -200: Call LLM to decide (NEW, SKIP-LLM, or SKIP-UPDATE)
 * 3. Update article with resolution, similarity_score, matched_article_id, skip_reasoning
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-07
 *   npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --all
 *   npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-07 --dry-run
 * 
 * Documentation:
 * - FTS5-SIMILARITY-STRATEGY.md - Complete strategy & validation
 * - V3-DATABASE-SCHEMA.md - Schema reference
 * - HANDOVER_PROMPT.md - Migration status
 */

import 'dotenv/config';
import { Command } from 'commander';
import { getDB, ensureInitialized } from './database/index.js';
import { callVertex } from './ai/vertex.js';
import { applyUpdate, ensureUpdateFields } from './apply-updates.js';
import { DuplicateResolutionWithUpdateSchema } from './duplicate-resolution-schema-v3.js';
import type { Database } from 'better-sqlite3';
import { removeStopwords, eng } from 'stopword';
import { createPipelineLogger } from './utils/pipeline-logger.js';

interface CLIOptions {
  all: boolean;
  date?: string;
  dryRun: boolean;
  lookbackDays: number;
}

interface Article {
  id: string;
  slug: string;
  headline: string;
  summary: string;
  full_report: string;
  pub_date: string;
  created_at: string;
  resolution: string | null;
}

interface SimilarArticle {
  article_id: string;
  slug: string;
  headline: string;
  score: number;
  pub_date: string;
}

interface DuplicateCheckResult {
  article_id: string;
  decision: 'NEW' | 'SKIP-FTS5' | 'SKIP-LLM' | 'SKIP-UPDATE';
  similarity_score: number | null;
  matched_article_id: string | null;
  skip_reasoning: string | null;
  update?: {
    datetime: string;
    summary: string;
    content: string;
    sources: Array<{ url: string; title: string }>;
    severity_change: 'increased' | 'decreased' | 'unchanged';
  };
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('check-duplicates-v3')
    .description('V3 FTS5-based duplicate detection using BM25 scoring')
    .option('--all', 'Check all articles with resolution=NULL')
    .option('--date <date>', 'Check articles from specific date (YYYY-MM-DD)')
    .option('--dry-run', 'Show what would be done without updating database')
    .option('--lookback-days <number>', 'Lookback window in days (default: 30)', parseInt)
    .helpOption('-h, --help', 'Display help information')
    .addHelpText('after', `
Examples:
  # Check all articles from specific date
  npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-09
  
  # Check all unprocessed articles
  npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --all
  
  # Dry run (no database updates)
  npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-09 --dry-run

FTS5 Scoring Thresholds:
  Score 0 to -80:    AUTO NEW (different story)
  Score -81 to -200: CALL LLM (borderline case - may be update or duplicate)
  Score -201+:       AUTO SKIP-FTS5 (clear duplicate)

Resolution Types:
  NEW:        Unique article (include in publication)
  SKIP-FTS5:  Auto-detected duplicate (no LLM call)
  SKIP-LLM:   LLM confirmed duplicate
  SKIP-UPDATE: LLM says article updates existing one
`)
    .parse(process.argv);
  
  const options = program.opts();
  
  // Validate options
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
  
  if (options.lookbackDays !== undefined && options.lookbackDays < 1) {
    console.error('❌ Error: Lookback days must be at least 1');
    process.exit(1);
  }
  
  return {
    all: hasAll,
    date: options.date,
    dryRun: !!options.dryRun,
    lookbackDays: options.lookbackDays ?? 30
  };
}

/**
 * Get articles to check based on CLI options
 */
function getArticlesToCheck(db: Database, options: CLIOptions): Article[] {
  let query = `
    SELECT id, slug, headline, summary, full_report, pub_date, created_at, resolution
    FROM articles
    WHERE resolution IS NULL
  `;
  const params: any[] = [];
  
  if (options.date) {
    query += ' AND DATE(created_at) = ?';
    params.push(options.date);
  }
  
  query += ' ORDER BY created_at ASC';
  
  return db.prepare(query).all(...params) as Article[];
}

/**
 * Find similar articles using FTS5 with BM25 scoring
 * 
 * Strategy: Extract top distinctive terms (by frequency) and use for MATCH query
 * Both the indexed content and query have stopwords removed
 * 
 * @param db Database instance
 * @param article Article to check for duplicates
 * @param lookbackDays Days to look back for candidates
 * @returns Array of similar articles with BM25 scores
 */
function findSimilarArticles(
  db: Database,
  article: Article,
  lookbackDays: number
): SimilarArticle[] {
  // Clean the full_report text by removing stopwords
  // This matches how articles_fts is populated in insert-articles.ts
  
  // Combine all text for comprehensive matching
  const fullText = `${article.headline} ${article.summary} ${article.full_report}`;
  
  // Extract words, normalize
  // NOTE: Do NOT remove stopwords - full text matching works better
  const words = fullText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3);
  
  if (words.length === 0) {
    return [];
  }
  
  // Get unique words (remove duplicates but keep all terms including stopwords)
  // BM25 with OR matching will rank articles higher that match MORE terms
  const uniqueWords = Array.from(new Set(words));
  
  // Build FTS5 query with OR matching
  // Articles that match MORE of these terms will rank higher in BM25
  // This is more effective than implicit AND which requires ALL terms
  const query = uniqueWords.join(' OR ');
  
  // Query FTS5 with weighted BM25 scoring
  // The full article content is already indexed in FTS5 (with stopwords removed)
  // The bm25() function applies column weights:
  // - headline: 10.0 (most important)
  // - summary: 5.0 (secondary)  
  // - full_report: 1.0 (base weight)
  const sql = `
    SELECT 
      fts.article_id,
      a.slug,
      a.headline,
      a.pub_date,
      bm25(articles_fts, 10.0, 5.0, 1.0) as score
    FROM articles_fts fts
    JOIN articles a ON fts.article_id = a.id
    WHERE articles_fts MATCH ?
      AND fts.article_id != ?
      AND DATE(a.created_at) < DATE(?)
      AND DATE(a.created_at) >= DATE(?, '-' || ? || ' days')
    ORDER BY score ASC
    LIMIT 10
  `;
  
  return db.prepare(sql).all(
    query,
    article.id,
    article.created_at,
    article.created_at,
    lookbackDays
  ) as SimilarArticle[];
}

/**
 * Call LLM to decide if article is NEW, SKIP-LLM, or SKIP-UPDATE
 * 
 * Uses gemini-2.5-flash-lite with Zod structured output for guaranteed response format
 */
async function callLLMForDuplicateResolution(
  db: Database,
  newArticle: Article,
  existingArticle: Article
): Promise<{ 
  decision: 'NEW' | 'SKIP-LLM' | 'SKIP-UPDATE'; 
  reasoning: string;
  update?: {
    datetime: string;
    summary: string;
    content: string;
    sources: Array<{ url: string; title: string }>;
    severity_change: 'increased' | 'decreased' | 'unchanged';
  };
}> {
  // Fetch sources for the NEW article
  const newArticleSources = db.prepare(`
    SELECT url, title FROM article_sources 
    WHERE article_id = ? 
    LIMIT 5
  `).all(newArticle.id) as Array<{ url: string; title: string }>;
  
  const sourcesText = newArticleSources.length > 0
    ? '\nSources:\n' + newArticleSources.map((s, i) => `  ${i + 1}. ${s.title}\n     ${s.url}`).join('\n')
    : '\nSources: None available';
  
  // Simplified prompt - no JSON format instructions needed (schema handles it)
  const prompt = `You are analyzing whether a new cybersecurity article should be published or skipped.

EXISTING ARTICLE (${existingArticle.pub_date}):
Headline: ${existingArticle.headline}
Summary: ${existingArticle.summary}
Full Report: ${existingArticle.full_report}

NEW ARTICLE (${newArticle.pub_date}):
Headline: ${newArticle.headline}
Summary: ${newArticle.summary}
Full Report: ${newArticle.full_report}${sourcesText}

DECISION CRITERIA:

NEW - Publish as separate article if:
- Reports a completely different incident or vulnerability
- Different threat actor or campaign
- Different affected organization or product
- Substantially different technical details

SKIP - Skip as duplicate if:
- Same incident/vulnerability with just different wording
- Same source but different news outlet reporting it
- No new information beyond what's in existing article
- Less detailed than existing article

UPDATE - Merge into existing article if:
- Reports new developments or consequences of the same incident
- Contains new technical details (CVEs, IOCs, TTPs) for same incident
- Reports additional victims for the same campaign
- Provides patch/mitigation information for same vulnerability
- Adds expert analysis or attribution for same event

**CRITICAL FOR UPDATE DECISIONS:**
If you choose UPDATE, you MUST provide the complete update object with ALL fields:
- datetime: ISO 8601 timestamp of when the update occurred (e.g., "2025-10-14T12:00:00Z")
- summary: Brief 50-150 character summary of what's new
- content: Detailed 200-800 character description of the new information
- sources: Array of 1-3 source objects from the NEW article
  * Extract actual URLs and titles from the NEW article's source list
  * Use format: [{url: "https://...", title: "Article Title"}]
  * If NEW article has no sources or you cannot extract them, use: [{url: "unknown", title: "Source not available"}]
  * REQUIRED - this array cannot be empty for UPDATE decisions
- severity_change: Must be 'increased', 'decreased', or 'unchanged'

ALL these fields are REQUIRED for UPDATE decisions. Do not omit any field.

Analyze both articles and provide your decision.`;

  try {
    // Use structured output with Zod schema - guaranteed correct format!
    const response = await callVertex(
      prompt,
      {
        model: 'gemini-2.5-flash',
        temperature: 0.1,
        maxTokens: 8000,
        schema: DuplicateResolutionWithUpdateSchema // Zod schema ensures type safety
      }
    );
    
    // response.content is already a typed object matching the schema!
    // No JSON parsing needed, no try/catch for parsing errors
    const result = response.content as {
      decision: 'NEW' | 'SKIP' | 'UPDATE';
      reasoning: string;
      update?: {
        datetime: string;
        summary: string;
        content: string;
        sources: Array<{ url: string; title: string }>;
        severity_change: 'increased' | 'decreased' | 'unchanged';
      };
    };
    
    // Map UPDATE to SKIP-UPDATE, SKIP to SKIP-LLM for database resolution field
    let decision: 'NEW' | 'SKIP-LLM' | 'SKIP-UPDATE';
    if (result.decision === 'UPDATE') {
      decision = 'SKIP-UPDATE';
    } else if (result.decision === 'SKIP') {
      decision = 'SKIP-LLM';
    } else {
      decision = 'NEW';
    }
    
    return {
      decision,
      reasoning: result.reasoning || 'No reasoning provided',
      update: result.update // Pass through the complete update object if present
    };
  } catch (error) {
    console.error('❌ LLM call failed:', error);
    // Default to NEW on error (safer than skipping)
    return {
      decision: 'NEW',
      reasoning: `LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Add sources from skipped article to original article
 * Used when SKIP-FTS5 (auto-duplicate) is detected
 * Merges sources without updating the article's updated_at or isUpdate flags
 */
function addSourcesToOriginalArticle(
  db: Database,
  skippedArticleId: string,
  originalArticleId: string
): void {
  // Get sources from the skipped article
  const skippedSources = db.prepare(`
    SELECT url, title, website, date
    FROM article_sources
    WHERE article_id = ?
  `).all(skippedArticleId) as Array<{
    url: string;
    title: string;
    website: string | null;
    date: string | null;
  }>;
  
  if (skippedSources.length === 0) {
    return; // No sources to add
  }
  
  // Get existing sources from the original article
  const existingSources = db.prepare(`
    SELECT url, website
    FROM article_sources
    WHERE article_id = ?
  `).all(originalArticleId) as Array<{
    url: string;
    website: string | null;
  }>;
  
  // Create a Set of existing source identifiers (url + website)
  // This allows different URLs from same website
  const existingSourceKeys = new Set(
    existingSources.map(s => `${s.url}||${s.website || ''}`)
  );
  
  // Filter out duplicates and insert new sources
  let addedCount = 0;
  const insertStmt = db.prepare(`
    INSERT INTO article_sources (article_id, url, title, website, date)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  for (const source of skippedSources) {
    const sourceKey = `${source.url}||${source.website || ''}`;
    
    // Only add if this exact URL+website combo doesn't exist
    if (!existingSourceKeys.has(sourceKey)) {
      insertStmt.run(
        originalArticleId,
        source.url,
        source.title,
        source.website,
        source.date
      );
      addedCount++;
      existingSourceKeys.add(sourceKey); // Prevent duplicates within this batch
    }
  }
  
  if (addedCount > 0) {
    console.log(`      📚 Added ${addedCount} new source(s) to original article`);
  }
}

/**
 * Check article for duplicates using FTS5 + 3-tier threshold
 */
async function checkArticleForDuplicates(
  db: Database,
  article: Article,
  lookbackDays: number
): Promise<DuplicateCheckResult> {
  // Find similar articles using FTS5
  const candidates = findSimilarArticles(db, article, lookbackDays);
  
  if (candidates.length === 0) {
    return {
      article_id: article.id,
      decision: 'NEW',
      similarity_score: null,
      matched_article_id: null,
      skip_reasoning: null
    };
  }
  
  // Get top match (best BM25 score) - guaranteed to exist here
  const topMatch = candidates[0]!;
  const score = topMatch.score;
  
  console.log(`   🔍 Top match: ${topMatch.headline.substring(0, 60)}...`);
  console.log(`      Score: ${score.toFixed(2)} | Date: ${topMatch.pub_date}`);
  
  // Apply 3-tier threshold (updated 2025-10-15: expanded LLM range to catch more updates)
  if (score >= -80) {
    // Low similarity - auto mark as NEW
    console.log(`      ✅ AUTO NEW (score 0 to -80)`);
    return {
      article_id: article.id,
      decision: 'NEW',
      similarity_score: score,
      matched_article_id: null,
      skip_reasoning: null
    };
  } else if (score <= -201) {
    // High similarity - auto skip
    console.log(`      ❌ AUTO SKIP-FTS5 (score -201 or lower)`);
    return {
      article_id: article.id,
      decision: 'SKIP-FTS5',
      similarity_score: score,
      matched_article_id: topMatch.article_id,
      skip_reasoning: `FTS5 auto-skip: BM25 score ${score.toFixed(2)} with article ${topMatch.article_id.substring(0, 8)} (${topMatch.pub_date})`
    };
  } else {
    // Borderline case - call LLM (expanded range to catch updates)
    console.log(`      🤔 BORDERLINE (-81 to -200), calling LLM...`);
    
    const existingArticle = db.prepare('SELECT * FROM articles WHERE id = ?').get(topMatch.article_id) as Article;
    const llmResult = await callLLMForDuplicateResolution(db, article, existingArticle);
    
    console.log(`      🤖 LLM Decision: ${llmResult.decision}`);
    console.log(`      💭 Reasoning: ${llmResult.reasoning}`);
    
    return {
      article_id: article.id,
      decision: llmResult.decision,
      similarity_score: score,
      matched_article_id: llmResult.decision === 'NEW' ? null : topMatch.article_id,
      skip_reasoning: llmResult.reasoning,
      update: llmResult.update // Pass through the complete update object
    };
  }
}

/**
 * Update article with duplicate check result
 */
function updateArticleResolution(
  db: Database,
  result: DuplicateCheckResult,
  dryRun: boolean
): void {
  if (dryRun) {
    console.log(`      [DRY-RUN] Would update: resolution=${result.decision}, score=${result.similarity_score?.toFixed(2)}`);
    if (result.decision === 'SKIP-UPDATE' && result.update) {
      console.log(`      [DRY-RUN] Would create update: ${result.update.summary}`);
    }
    return;
  }
  
  // Update article resolution
  db.prepare(`
    UPDATE articles
    SET 
      resolution = ?,
      similarity_score = ?,
      matched_article_id = ?,
      skip_reasoning = ?
    WHERE id = ?
  `).run(
    result.decision,
    result.similarity_score,
    result.matched_article_id,
    result.skip_reasoning,
    result.article_id
  );
  
  // If SKIP-UPDATE, apply the update to the original article
  if (result.decision === 'SKIP-UPDATE' && 
      result.matched_article_id &&
      result.update) {
    
    const updateId = applyUpdate(db, {
      originalArticleId: result.matched_article_id,
      updateArticleId: result.article_id,
      updateObject: result.update // Pass the complete update object
    });
    
    if (updateId) {
      console.log(`      ✅ Applied update ID ${updateId} to article ${result.matched_article_id.substring(0, 8)}`);
    } else {
      console.log(`      ❌ Failed to apply update`);
    }
  }
  
  // If SKIP-FTS5, add sources from skipped article to original
  if (result.decision === 'SKIP-FTS5' && result.matched_article_id) {
    addSourcesToOriginalArticle(db, result.article_id, result.matched_article_id);
  }
}

/**
 * Regenerate publication summary after filtering articles
 * 
 * Called when articles are marked as SKIP - updates publication to reflect
 * only the NEW articles that will actually be published.
 */
async function regeneratePublicationSummary(
  db: Database,
  pubDate: string
): Promise<void> {
  console.log(`\n🔄 Regenerating publication summary for ${pubDate}...`);
  
  // Get all NEW articles for this publication
  const newArticles = db.prepare(`
    SELECT id, headline, summary
    FROM articles
    WHERE DATE(created_at) = ?
      AND resolution = 'NEW'
    ORDER BY created_at ASC
  `).all(pubDate) as Array<{ id: string; headline: string; summary: string }>;
  
  if (newArticles.length === 0) {
    console.log('   ⚠️  No NEW articles found - publication will be empty');
    return;
  }
  
  console.log(`   📊 ${newArticles.length} NEW articles to include in publication`);
  
  // Build prompt for LLM
  const articlesText = newArticles.map((a, i) => 
    `${i + 1}. ${a.headline}\n   ${a.summary}`
  ).join('\n\n');
  
  const prompt = `You are creating a daily cybersecurity publication summary.

Here are the ${newArticles.length} articles for ${pubDate}:

${articlesText}

Create a compelling publication with:
1. A headline that captures the most significant threats/developments (60-80 chars)
2. A brief summary highlighting key themes and critical items (150-200 words)

Respond ONLY with JSON (no markdown):
{
  "headline": "Publication headline here",
  "summary": "Publication summary here"
}`;

  try {
    const response = await callVertex(
      prompt,
      {
        model: 'gemini-2.5-flash-lite',
        temperature: 0.3,
        maxTokens: 500,
      }
    );
    
    // Parse response
    let content = response.content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const result = JSON.parse(content);
    
    // Update publication
    const articleIds = newArticles.map(a => a.id);
    
    db.prepare(`
      UPDATE publications
      SET 
        headline = ?,
        summary = ?,
        article_ids = ?,
        article_count = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE pub_date = ?
    `).run(
      result.headline,
      result.summary,
      JSON.stringify(articleIds),
      articleIds.length,
      pubDate
    );
    
    console.log(`   ✅ Updated publication: "${result.headline}"`);
    console.log(`   📊 Article count: ${articleIds.length}`);
  } catch (error) {
    console.error('   ❌ Failed to regenerate publication summary:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 V3 FTS5 Duplicate Detection - Phase 3\n');
  
  const options = parseArgs();
  ensureInitialized();
  const db = getDB();
  
  // Initialize pipeline logging
  const logger = createPipelineLogger(db);
  const dateProcessed = options.date || 'ALL';
  logger.logStart({
    scriptName: 'check-duplicates-v3',
    dateProcessed,
    metadata: { 
      lookbackDays: options.lookbackDays,
      isDryRun: options.dryRun,
      mode: options.all ? 'all' : 'date'
    },
  });
  
  // Ensure update fields exist (updateCount, isUpdate)
  ensureUpdateFields(db);
  
  console.log(`⚙️  Configuration:`);
  console.log(`   Mode: ${options.all ? 'ALL articles' : `Date ${options.date}`}`);
  console.log(`   Lookback window: ${options.lookbackDays} days`);
  console.log(`   Dry run: ${options.dryRun ? 'YES' : 'NO'}\n`);
  
  // Get articles to check
  const articles = getArticlesToCheck(db, options);
  
  if (articles.length === 0) {
    console.log('✅ No articles found with resolution=NULL');
    logger.logSkip('No articles with resolution=NULL');
    return;
  }
  
  console.log(`📊 Found ${articles.length} article(s) to check\n`);
  
  // Process each article
  const stats = {
    new: 0,
    skipFts5: 0,
    skipLlm: 0,
    skipUpdate: 0,
    llmCalls: 0
  };
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    if (!article) continue;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Article ${i + 1}/${articles.length}:`);
    console.log(`   ${article.headline}`);
    console.log(`   Date: ${article.pub_date} | ID: ${article.id.substring(0, 8)}...\n`);
    
    // Check for duplicates
    const result = await checkArticleForDuplicates(db, article, options.lookbackDays);
    
    // Update database
    updateArticleResolution(db, result, options.dryRun);
    
    // Update stats
    if (result.decision === 'NEW') stats.new++;
    else if (result.decision === 'SKIP-FTS5') stats.skipFts5++;
    else if (result.decision === 'SKIP-LLM') {
      stats.skipLlm++;
      stats.llmCalls++;
    } else if (result.decision === 'SKIP-UPDATE') {
      stats.skipUpdate++;
      stats.llmCalls++;
    }
    
    console.log('');
  }
  
  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Duplicate Detection Summary:');
  console.log(`   Articles processed: ${articles.length}`);
  console.log(`   ✅ NEW (unique): ${stats.new}`);
  console.log(`   ❌ SKIP-FTS5 (auto): ${stats.skipFts5}`);
  console.log(`   ❌ SKIP-LLM (duplicate): ${stats.skipLlm}`);
  console.log(`   🔄 SKIP-UPDATE (merge): ${stats.skipUpdate}`);
  console.log(`   🤖 LLM calls made: ${stats.llmCalls}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Regenerate publication if articles were skipped
  const skippedCount = stats.skipFts5 + stats.skipLlm + stats.skipUpdate;
  if (skippedCount > 0 && !options.dryRun && options.date) {
    await regeneratePublicationSummary(db, options.date);
  } else if (skippedCount > 0 && options.all) {
    console.log('\n⚠️  Note: --all mode detected. Publications not regenerated automatically.');
    console.log('   Run with --date for specific dates to regenerate publications.');
  }
  
  if (options.dryRun) {
    console.log('\n⚠️  DRY-RUN mode: No changes written to database');
  }
  
  // Log completion
  logger.logSuccess({
    articlesNew: stats.new,
    articlesSkipFts5: stats.skipFts5,
    articlesSkipUpdate: stats.skipUpdate,
    llmCalls: stats.llmCalls,
    metadata: {
      skipLlm: stats.skipLlm,
      totalProcessed: articles.length,
      isDryRun: options.dryRun,
    },
  });
  
  console.log('\n✅ Duplicate detection complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
