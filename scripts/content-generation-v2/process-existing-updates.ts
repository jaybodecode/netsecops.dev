/**
 * Process Existing SKIP-UPDATE Articles
 * 
 * This script processes articles that were already marked as SKIP-UPDATE
 * but don't have structured update entries yet (from before Phase 4).
 * 
 * It will:
 * 1. Find all articles with resolution='SKIP-UPDATE'
 * 2. Check if they already have an entry in article_updates
 * 3. For those without updates, call LLM to regenerate structured update data
 * 4. Apply the update using applyUpdate()
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/process-existing-updates.ts
 *   npx tsx scripts/content-generation-v2/process-existing-updates.ts --dry-run
 */

import 'dotenv/config';
import { Command } from 'commander';
import { getDB } from './database/index.js';
import { callVertex } from './ai/vertex.js';
import { applyUpdate, ensureUpdateFields } from './apply-updates.js';
import type { Database } from 'better-sqlite3';

interface SkipUpdateArticle {
  id: string;
  headline: string;
  summary: string;
  full_report: string;
  pub_date: string;
  matched_article_id: string;
  skip_reasoning: string;
}

interface OriginalArticle {
  id: string;
  headline: string;
  summary: string;
  full_report: string;
  pub_date: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): { dryRun: boolean } {
  const program = new Command();
  
  program
    .name('process-existing-updates')
    .description('Process articles marked as SKIP-UPDATE that need structured update entries')
    .option('--dry-run', 'Show what would be done without updating database')
    .parse(process.argv);
  
  return {
    dryRun: !!program.opts().dryRun
  };
}

/**
 * Call LLM to extract structured update data from existing SKIP-UPDATE article
 */
async function extractUpdateData(
  updateArticle: SkipUpdateArticle,
  originalArticle: OriginalArticle
): Promise<{
  update_summary: string;
  update_content: string;
  severity_change: 'increased' | 'decreased' | 'unchanged';
} | null> {
  const prompt = `You are extracting structured update information from a cybersecurity article that updates an existing report.

ORIGINAL ARTICLE (${originalArticle.pub_date}):
Headline: ${originalArticle.headline}
Summary: ${originalArticle.summary}
Full Report: ${originalArticle.full_report}

UPDATE ARTICLE (${updateArticle.pub_date}):
Headline: ${updateArticle.headline}
Summary: ${updateArticle.summary}
Full Report: ${updateArticle.full_report}

Previous Analysis: ${updateArticle.skip_reasoning}

Extract the new information as a structured update with these fields:

{
  "update_summary": "Brief 50-150 char summary of what changed (e.g., 'New victims identified', 'Patch released', 'Additional CVEs disclosed')",
  "update_content": "Detailed 200-800 char description of the new information, technical details, or developments",
  "severity_change": "increased" | "decreased" | "unchanged"
}

Respond ONLY with JSON (no markdown, no explanation):`;

  try {
    const response = await callVertex(
      prompt,
      {
        model: 'gemini-2.5-flash-lite',
        temperature: 0.1,
        maxTokens: 500,
      }
    );
    
    // Parse JSON response
    let content = response.content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const result = JSON.parse(content);
    
    return {
      update_summary: result.update_summary,
      update_content: result.update_content,
      severity_change: result.severity_change || 'unchanged'
    };
  } catch (error) {
    console.error('❌ LLM call failed:', error);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔄 Processing Existing SKIP-UPDATE Articles\n');
  
  const options = parseArgs();
  const db = getDB();
  
  // Ensure update fields exist
  ensureUpdateFields(db);
  
  console.log(`⚙️  Configuration:`);
  console.log(`   Dry run: ${options.dryRun ? 'YES' : 'NO'}\n`);
  
  // Find all SKIP-UPDATE articles
  const skipUpdateArticles = db.prepare(`
    SELECT 
      a.id,
      a.headline,
      a.summary,
      a.full_report,
      a.pub_date,
      a.matched_article_id,
      a.skip_reasoning
    FROM articles a
    WHERE a.resolution = 'SKIP-UPDATE'
      AND a.matched_article_id IS NOT NULL
  `).all() as SkipUpdateArticle[];
  
  if (skipUpdateArticles.length === 0) {
    console.log('✅ No SKIP-UPDATE articles found');
    return;
  }
  
  console.log(`📊 Found ${skipUpdateArticles.length} SKIP-UPDATE article(s)\n`);
  
  // Process each article
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  
  for (let i = 0; i < skipUpdateArticles.length; i++) {
    const article = skipUpdateArticles[i];
    if (!article) continue;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Article ${i + 1}/${skipUpdateArticles.length}:`);
    console.log(`   ${article.headline}`);
    console.log(`   ID: ${article.id.substring(0, 8)}...`);
    console.log(`   Updates: ${article.matched_article_id.substring(0, 8)}...\n`);
    
    // Check if update already exists
    const existingUpdate = db.prepare(`
      SELECT COUNT(*) as count
      FROM article_update_sources
      WHERE article_id = ?
    `).get(article.id) as { count: number };
    
    if (existingUpdate.count > 0) {
      console.log(`   ⏭️  Already has update entry, skipping\n`);
      skipped++;
      continue;
    }
    
    // Get original article
    const originalArticle = db.prepare(`
      SELECT id, headline, summary, full_report, pub_date
      FROM articles
      WHERE id = ?
    `).get(article.matched_article_id) as OriginalArticle | undefined;
    
    if (!originalArticle) {
      console.log(`   ❌ Original article not found\n`);
      failed++;
      continue;
    }
    
    console.log(`   🤖 Calling LLM to extract update data...`);
    
    // Extract structured update data
    const updateData = await extractUpdateData(article, originalArticle);
    
    if (!updateData) {
      console.log(`   ❌ Failed to extract update data\n`);
      failed++;
      continue;
    }
    
    console.log(`   ✅ Update Summary: ${updateData.update_summary}`);
    console.log(`   📝 Severity: ${updateData.severity_change}`);
    
    if (options.dryRun) {
      console.log(`   [DRY-RUN] Would create update entry\n`);
      processed++;
      continue;
    }
    
    // Apply the update
    const updateId = applyUpdate(db, {
      originalArticleId: article.matched_article_id,
      updateArticleId: article.id,
      updateSummary: updateData.update_summary,
      updateContent: updateData.update_content,
      severityChange: updateData.severity_change,
      datetime: article.pub_date
    });
    
    if (updateId) {
      console.log(`   ✅ Created update ID ${updateId}\n`);
      processed++;
    } else {
      console.log(`   ❌ Failed to create update\n`);
      failed++;
    }
  }
  
  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Processing Summary:');
  console.log(`   Total articles: ${skipUpdateArticles.length}`);
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⏭️  Skipped (already done): ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (options.dryRun) {
    console.log('\n⚠️  DRY-RUN mode: No changes written to database');
  }
  
  console.log('\n✅ Processing complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
