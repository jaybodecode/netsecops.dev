/**
 * Content Generation V2 - Duplicate Resolution
 * 
 * Step 5: LLM-based resolution for BORDERLINE    borderlineMin: options.borderlineMin ?? 0.35,
    borderlineMax: options.borderlineMax ?? 0.70,
    autoResolve: options.autoResolve ?? false,
    lookbackDays: options.lookbackDays ?? 30,
    force: options.force ?? false
  };
}cate cases
 * 
 * Process:
 * 1. Load articles from structured_news for target date
 * 2. Get duplicate detection results from check-duplicates.ts
 * 3. For BORDERLINE cases (0.35-0.70), use LLM to compare full_report texts
 * 4. LLM decides: NEW (publish separately), UPDATE (add to existing), or SKIP (no new info)
 * 5. Save resolution decisions to database
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/resolve-duplicates.ts --date 2025-10-07
 *   npx tsx scripts/content-generation-v2/resolve-duplicates.ts --article-id <uuid>
 *   npx tsx scripts/content-generation-v2/resolve-duplicates.ts --date 2025-10-07 --threshold 0.60
 * 
 * LLM: Gemini 2.5 Flash (fast, cost-effective for text comparison)
 */

import 'dotenv/config';
import { Command } from 'commander';
import { callVertex } from './ai/vertex.js';
import { DuplicateResolutionSchema, type DuplicateResolution } from './duplicate-resolution-schema.js';
import { getStructuredNewsByDate } from './database/schema-structured-news.js';
import { saveArticleResolution, deleteResolutionsByDate } from './database/schema-article-resolutions.js';
import { 
  getArticleData, 
  checkArticle, 
  type ArticleData,
  type SimilarityResult 
} from './check-duplicates.js';
import type { CVEForIndexing, EntityForIndexing } from './database/schema-article-entities.js';

interface CLIOptions {
  date?: string;
  articleId?: string;
  threshold?: number;
  borderlineMin?: number;
  borderlineMax?: number;
  autoResolve?: boolean;
  lookbackDays?: number;
  force?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('resolve-duplicates')
    .description('Resolve BORDERLINE duplicate cases using LLM text comparison')
    .option('--date <date>', 'Process articles from specific date (YYYY-MM-DD)')
    .option('--article-id <uuid>', 'Process specific article by ID')
    .option('--threshold <number>', 'Overall duplicate threshold (default: 0.70)', parseFloat)
    .option('--borderline-min <number>', 'Minimum score for BORDERLINE range (default: 0.35)', parseFloat)
    .option('--borderline-max <number>', 'Maximum score for BORDERLINE range (default: 0.70)', parseFloat)
    .option('--auto-resolve', 'Automatically apply high-confidence resolutions')
    .option('--lookback-days <number>', 'Lookback window in days (default: 30)', parseInt)
    .option('--force', 'Force re-processing (delete existing resolutions for this date)')
    .helpOption('-h, --help', 'Display help information')
    .addHelpText('after', `
Examples:
  # Resolve duplicates for specific date
  npx tsx scripts/content-generation-v2/resolve-duplicates.ts --date 2025-10-09
  
  # Resolve single article
  npx tsx scripts/content-generation-v2/resolve-duplicates.ts --article-id <uuid>
  
  # Custom BORDERLINE range (0.40-0.65)
  npx tsx scripts/content-generation-v2/resolve-duplicates.ts --date 2025-10-09 --borderline-min 0.40 --borderline-max 0.65

Process:
  1. Loads articles from structured_news table
  2. Runs duplicate detection (check-duplicates.ts logic)
  3. For BORDERLINE cases, calls Gemini 2.5 Flash to compare full_report texts
  4. LLM decides: NEW, UPDATE, or SKIP
  5. Displays results with reasoning
  
Model: Gemini 2.5 Flash (optimized for speed and cost)
`)
    .parse(process.argv);
  
  const options = program.opts();
  
  // Validation
  if (!options.date && !options.articleId) {
    console.error('❌ Error: Must specify --date or --article-id');
    process.exit(1);
  }
  
  if (options.date && options.articleId) {
    console.error('❌ Error: Cannot specify both --date and --article-id');
    process.exit(1);
  }
  
  return {
    date: options.date,
    articleId: options.articleId,
    threshold: options.threshold ?? 0.70,
    borderlineMin: options.borderlineMin ?? 0.35,
    borderlineMax: options.borderlineMax ?? 0.70,
    autoResolve: !!options.autoResolve,
    lookbackDays: options.lookbackDays ?? 30
  };
}

/**
 * Build prompt for LLM comparison
 */
function buildComparisonPrompt(
  candidateArticle: ArticleData,
  originalArticle: ArticleData,
  similarityScore: number
): string {
  return `You are a cybersecurity news editor evaluating whether a new article should be published separately, added as an update to an existing article, or skipped entirely.

CONTEXT:
- Similarity score: ${similarityScore.toFixed(3)} (0.35-0.70 BORDERLINE range)
- This score is based on CVE overlap, text similarity, and shared entities
- You need to make the final editorial decision by comparing the full article texts

ORIGINAL ARTICLE (Published ${originalArticle.meta.pub_date_only}):
Slug: ${originalArticle.meta.slug}
ID: ${originalArticle.meta.article_id}

Summary:
${originalArticle.meta.summary}

Full Report:
${originalArticle.meta.full_report || originalArticle.meta.summary}

CVEs: ${originalArticle.cves.map((c: CVEForIndexing) => c.cve_id).join(', ') || 'None'}
Entities: ${originalArticle.entities.map((e: EntityForIndexing) => `${e.entity_name} (${e.entity_type})`).join(', ')}

---

CANDIDATE ARTICLE (Being evaluated):
Slug: ${candidateArticle.meta.slug}
ID: ${candidateArticle.meta.article_id}

Summary:
${candidateArticle.meta.summary}

Full Report:
${candidateArticle.meta.full_report || candidateArticle.meta.summary}

CVEs: ${candidateArticle.cves.map((c: CVEForIndexing) => c.cve_id).join(', ') || 'None'}
Entities: ${candidateArticle.entities.map((e: EntityForIndexing) => `${e.entity_name} (${e.entity_type})`).join(', ')}

---

DECISION CRITERIA:

Choose NEW if:
- The candidate article covers a substantially different angle or story
- It discusses different victims, campaigns, or attack vectors
- It provides distinct technical analysis or different implications
- The overlap is coincidental (same CVE but different contexts)
- Readers would benefit from seeing both articles

Choose UPDATE if:
- The candidate article provides new developments on the same story
- It adds new technical details, patches, or mitigation steps
- It updates victim count, attribution, or impact assessment
- It's clearly a continuation or follow-up to the original story
- The same campaign/incident is being tracked over time

Choose SKIP if:
- The candidate article provides no meaningful new information
- It merely rephrases what's already covered in the original
- The only difference is writing style or source
- Publishing it would create redundancy without value
- It would confuse readers rather than inform them

Analyze both articles carefully and provide your decision with clear reasoning.`;
}

/**
 * Resolve single article pair using LLM
 */
async function resolveArticlePair(
  candidateArticle: ArticleData,
  originalArticle: ArticleData,
  similarityScore: number
): Promise<DuplicateResolution> {
  console.log(`   🤖 Calling Gemini 2.5 Flash to compare full texts...`);
  
  const prompt = buildComparisonPrompt(candidateArticle, originalArticle, similarityScore);
  
  const result = await callVertex(prompt, {
    model: 'gemini-2.5-flash',
    temperature: 0.3,  // Lower temperature for more consistent decisions
    maxTokens: 2048,
    schema: DuplicateResolutionSchema
  });
  
  // Show token usage
  if (result.usage) {
    console.log(`   📊 Tokens: ${result.usage.inputTokens.toLocaleString()} in, ${result.usage.outputTokens.toLocaleString()} out`);
  }
  
  return result.content as DuplicateResolution;
}

/**
 * Format resolution result for display
 */
function formatResolution(
  resolution: DuplicateResolution,
  candidateArticle: ArticleData,
  originalArticle: ArticleData,
  similarityScore: number
): string {
  const emoji = resolution.decision === 'NEW' ? '🟢' : 
                resolution.decision === 'UPDATE' ? '🔵' : '🔴';
  
  const confidenceEmoji = resolution.confidence === 'high' ? '✅' : 
                          resolution.confidence === 'medium' ? '⚠️' : '❓';
  
  const lines = [
    `${emoji} ${resolution.decision} (${resolution.confidence} confidence ${confidenceEmoji})`,
    `   Similarity Score: ${similarityScore.toFixed(3)}`,
    `   Candidate: ${candidateArticle.meta.slug} (${candidateArticle.meta.pub_date_only})`,
    `   Original:  ${originalArticle.meta.slug} (${originalArticle.meta.pub_date_only})`,
    ``,
    `   Reasoning:`,
    `   ${resolution.reasoning}`,
  ];
  
  if (resolution.new_information && resolution.new_information.length > 0) {
    lines.push(``);
    lines.push(`   New Information:`);
    resolution.new_information.forEach(info => {
      lines.push(`     • ${info}`);
    });
  }
  
  if (resolution.overlap_summary) {
    lines.push(``);
    lines.push(`   Overlap:`);
    lines.push(`   ${resolution.overlap_summary}`);
  }
  
  return lines.join('\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Duplicate Resolution - Step 5 (LLM-based)\n');
  
  const options = parseArgs();
  
  console.log(`⚙️  Configuration:`);
  console.log(`   Model: Gemini 2.5 Flash`);
  console.log(`   BORDERLINE range: ${options.borderlineMin} - ${options.borderlineMax}`);
  console.log(`   Duplicate threshold: ${options.threshold}`);
  console.log(`   Lookback window: ${options.lookbackDays} days`);
  console.log(`   Auto-resolve: ${options.autoResolve ? 'YES' : 'NO'}\n`);
  
  // Check if resolutions already exist and handle --force flag
  if (options.date && !options.force) {
    const existingResolutions = await import('./database/schema-article-resolutions.js').then(m => m.getResolutionsByDate(options.date!));
    if (existingResolutions.length > 0) {
      console.log(`⚠️  Found ${existingResolutions.length} existing resolutions for ${options.date}`);
      console.log(`   Use --force to re-process and overwrite\n`);
      process.exit(0);
    }
  }
  
  // Delete existing resolutions if --force is set
  if (options.date && options.force) {
    const deleted = deleteResolutionsByDate(options.date);
    if (deleted > 0) {
      console.log(`🗑️  Deleted ${deleted} existing resolution(s) for ${options.date}\n`);
    }
  }
  
  // Load articles from database
  let articlesToCheck: ArticleData[] = [];
  
  if (options.articleId) {
    const article = getArticleData(options.articleId);
    if (!article) {
      console.error(`❌ Article not found: ${options.articleId}`);
      process.exit(1);
    }
    articlesToCheck = [article];
  } else if (options.date) {
    // Get all articles from structured_news for this date
    const record = getStructuredNewsByDate(options.date);
    if (!record) {
      console.error(`❌ No structured news found for date: ${options.date}`);
      process.exit(1);
    }
    
    console.log(`📊 Found publication: ${record.headline}`);
    console.log(`   Articles: ${record.total_articles}`);
    console.log(`   Date: ${record.pub_date_only}\n`);
    
    // Parse the JSON data
    const publicationData = JSON.parse(record.data) as any;
    
    // Get article data for each article ID
    for (const articleData of publicationData.articles) {
      const article = getArticleData(articleData.id);
      if (article) {
        articlesToCheck.push(article);
      }
    }
    
    console.log(`✅ Loaded ${articlesToCheck.length} articles for checking\n`);
  }
  
  if (articlesToCheck.length === 0) {
    console.log('⚠️  No articles to check');
    return;
  }
  
  // Track statistics
  let totalResolutions = 0;
  let newCount = 0;
  let updateCount = 0;
  let skipCount = 0;
  let borderlineCount = 0;
  
  // Check each article
  for (let i = 0; i < articlesToCheck.length; i++) {
    const maybeArticle = articlesToCheck[i];
    if (!maybeArticle) continue;
    
    const article: ArticleData = maybeArticle; // Type assertion
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔍 Checking article ${i + 1}/${articlesToCheck.length}:`);
    console.log(`   Date: ${article.meta.pub_date_only}`);
    console.log(`   Slug: ${article.meta.slug}`);
    console.log(`   ID: ${article.meta.article_id}\n`);
    
    // Run duplicate detection
    const results = checkArticle(article, options.lookbackDays ?? 30, options.threshold ?? 0.70);
    
    if (results.length === 0) {
      console.log(`   ✅ No candidates found - NEW article\n`);
      
      // Save resolution to database
      saveArticleResolution({
        article_id: article.meta.article_id,
        pub_date: article.meta.pub_date_only,
        decision: 'NEW',
        confidence: 'high',
        similarity_score: 0,
        original_article_id: null,
        original_pub_date: null,
        original_slug: null,
        canonical_article_id: article.meta.article_id, // Use NEW article's ID
        reasoning: null,
        resolution_method: 'automatic'
      });
      
      newCount++;
      continue;
    }
    
    console.log(`   📊 Found ${results.length} candidate(s)\n`);
    
    // Process results by classification
    const updates = results.filter(r => r.classification === 'UPDATE');
    const borderline = results.filter(r => r.classification === 'BORDERLINE');
    const newArticles = results.filter(r => r.classification === 'NEW');
    
    // Handle UPDATE (score >= 0.70) - No LLM needed
    if (updates.length > 0) {
      console.log(`   🔴 AUTOMATIC UPDATE (${updates.length}):`);
      for (const result of updates) {
        console.log(`      ${result.totalScore.toFixed(3)} - ${result.candidateSlug} (${result.candidateDate})`);
        
        // Save resolution to database
        saveArticleResolution({
          article_id: article.meta.article_id,
          pub_date: article.meta.pub_date_only,
          decision: 'UPDATE',
          confidence: 'high',
          similarity_score: result.totalScore,
          original_article_id: result.candidateId,
          original_pub_date: result.candidateDate,
          original_slug: result.candidateSlug,
          canonical_article_id: result.candidateId, // Use ORIGINAL article's ID for updates!
          reasoning: null,
          resolution_method: 'automatic'
        });
      }
      console.log(`   → No LLM call needed (score >= ${options.threshold})\n`);
      updateCount++;
      continue;
    }
    
    // Handle BORDERLINE (0.35-0.70) - Call LLM
    if (borderline.length > 0) {
      console.log(`   🟡 BORDERLINE CASES (${borderline.length}) - Calling LLM:\n`);
      
      for (const result of borderline) {
        const candidateArticle = getArticleData(result.candidateId);
        if (!candidateArticle) continue;
        
        console.log(`   Candidate: ${result.candidateSlug} (${result.candidateDate})`);
        console.log(`   Similarity: ${result.totalScore.toFixed(3)}\n`);
        
        try {
          // Call LLM for resolution
          const resolution = await resolveArticlePair(
            article,
            candidateArticle,
            result.totalScore
          );
          
          console.log(formatResolution(resolution, article, candidateArticle, result.totalScore));
          console.log('');
          
          // Save resolution to database
          saveArticleResolution({
            article_id: article.meta.article_id,
            pub_date: article.meta.pub_date_only,
            decision: resolution.decision,
            confidence: resolution.confidence,
            similarity_score: result.totalScore,
            original_article_id: resolution.decision === 'NEW' ? null : candidateArticle.meta.article_id,
            original_pub_date: resolution.decision === 'NEW' ? null : candidateArticle.meta.pub_date_only,
            original_slug: resolution.decision === 'NEW' ? null : candidateArticle.meta.slug,
            canonical_article_id: resolution.decision === 'NEW' 
              ? article.meta.article_id  // NEW: use new article ID
              : resolution.decision === 'UPDATE'
                ? candidateArticle.meta.article_id  // UPDATE: use ORIGINAL article ID
                : null,  // SKIP: no canonical ID
            reasoning: JSON.stringify(resolution.reasoning),
            resolution_method: 'llm'
          });
          
          totalResolutions++;
          borderlineCount++;
          
          // Track decisions
          if (resolution.decision === 'NEW') newCount++;
          else if (resolution.decision === 'UPDATE') updateCount++;
          else if (resolution.decision === 'SKIP') skipCount++;
          
        } catch (error: any) {
          console.error(`   ❌ LLM resolution failed: ${error.message}\n`);
        }
      }
    }
    
    // Show NEW articles summary
    if (newArticles.length > 0) {
      console.log(`   🟢 NEW (${newArticles.length} candidates below 0.35 threshold)\n`);
    }
    
    if (updates.length === 0 && borderline.length === 0) {
      console.log(`   ✅ All candidates below threshold - NEW article\n`);
      
      // Save resolution to database (candidate exists but score too low)
      const bestCandidate = results[0]; // Get the highest scoring candidate
      if (bestCandidate) {
        saveArticleResolution({
          article_id: article.meta.article_id,
          pub_date: article.meta.pub_date_only,
          decision: 'NEW',
          confidence: 'high',
          similarity_score: bestCandidate.totalScore,
          original_article_id: null,
          original_pub_date: null,
          original_slug: null,
          canonical_article_id: article.meta.article_id, // Use NEW article's ID
          reasoning: JSON.stringify([`Highest similarity: ${bestCandidate.totalScore.toFixed(3)} (below 0.35 threshold)`]),
          resolution_method: 'automatic'
        });
      }
      
      newCount++;
    }
  }
  
  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Resolution Summary:');
  console.log(`   Articles checked: ${articlesToCheck.length}`);
  console.log(`   BORDERLINE cases analyzed by LLM: ${borderlineCount}`);
  console.log(`   LLM resolutions:`);
  console.log(`     - NEW: ${newCount - (articlesToCheck.length - totalResolutions - borderlineCount)}`);
  console.log(`     - UPDATE: ${updateCount}`);
  console.log(`     - SKIP: ${skipCount}`);
  console.log(`   Automatic classifications:`);
  console.log(`     - NEW (no candidates): ${articlesToCheck.length - totalResolutions - updateCount - borderlineCount}`);
  console.log(`     - UPDATE (score >= 0.70): ${updateCount - (updateCount > 0 ? borderlineCount : 0)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n✅ Duplicate resolution complete!\n');
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
  buildComparisonPrompt,
  resolveArticlePair,
  formatResolution
};
