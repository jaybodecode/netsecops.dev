/**
 * Content Generation V2 - Duplicate Detection
 * 
 * Phase 3 of Fingerprint V2 duplicate detection system.
 * Calculates 6-dimensional weighted Jaccard similarity for duplicate detection.
 * 
 * Process:
 * 1. Query articles in 30-day lookback window from target date
 * 2. Filter candidates by shared CVEs or entities (SQL indexed)
 * 3. Calculate weighted Jaccard similarity:
 *    - CVE overlap: 40% (PRIMARY campaign identifier)
 *    - Text similarity: 20% (character trigrams from full_report)
 *    - threat_actor: 12%
 *    - malware: 12%
 *    - product: 8%
 *    - company: 8%
 * 4. Classify: NEW (<0.35), BORDERLINE (0.35-0.70), UPDATE (≥0.70)
 * 5. Return similarity scores for all candidates
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/check-duplicates.ts --article-id <uuid>
 *   npx tsx scripts/content-generation-v2/check-duplicates.ts --date 2025-10-07
 *   npx tsx scripts/content-generation-v2/check-duplicates.ts --from 2025-10-07 --to 2025-10-14
 *   npx tsx scripts/content-generation-v2/check-duplicates.ts --all --threshold 0.6
 * 
 * Design: FINGERPRINT-V2.md
 * Phase 1: FINGERPRINT-V2-PHASE1-COMPLETE.md
 * Phase 2: FINGERPRINT-V2-PHASE2-COMPLETE.md
 */

import 'dotenv/config';
import { Command } from 'commander';
import { getDB } from './database/index.js';
import {
  getArticleMeta,
  getArticleCVEs,
  getArticleEntities,
  type ArticleMetaForIndexing,
  type CVEForIndexing,
  type EntityForIndexing
} from './database/schema-article-entities.js';

interface CLIOptions {
  all: boolean;
  articleId?: string;
  date?: string;
  from?: string;
  to?: string;
  threshold?: number;
  mark?: boolean;
  lookbackDays?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('check-duplicates')
    .description('Check articles for duplicates using 6D Jaccard similarity')
    .option('--all', 'Check all articles in database')
    .option('--article-id <uuid>', 'Check specific article by ID')
    .option('--date <date>', 'Check articles from specific date (YYYY-MM-DD)')
    .option('--from <date>', 'Check articles from date (YYYY-MM-DD, requires --to)')
    .option('--to <date>', 'Check articles to date (YYYY-MM-DD, requires --from)')
    .option('--threshold <number>', 'Similarity threshold for duplicate detection (default: 0.70)', parseFloat)
    .option('--mark', 'Mark duplicates in database (not yet implemented)')
    .option('--lookback-days <number>', 'Lookback window in days (default: 30)', parseInt)
    .helpOption('-h, --help', 'Display help information')
    .addHelpText('after', `
Examples:
  # Check single article
  npx tsx scripts/content-generation-v2/check-duplicates.ts --article-id <uuid>
  
  # Check all articles from specific date
  npx tsx scripts/content-generation-v2/check-duplicates.ts --date 2025-10-09
  
  # Check all articles in date range
  npx tsx scripts/content-generation-v2/check-duplicates.ts --from 2025-10-07 --to 2025-10-14
  
  # Check all with custom threshold
  npx tsx scripts/content-generation-v2/check-duplicates.ts --all --threshold 0.6
  
  # Use 14-day lookback window
  npx tsx scripts/content-generation-v2/check-duplicates.ts --date 2025-10-09 --lookback-days 14

Scoring:
  NEW:        < 0.35 (distinct article)
  BORDERLINE: 0.35-0.70 (manual review recommended)
  UPDATE:     >= 0.70 (clear duplicate/update)
  
Weights:
  CVE:           45% (PRIMARY campaign identifier)
  Text:          20% (character trigrams from full_report)
  Threat Actor:  11%
  Malware:       11%
  Product:        7%
  Company:        6%
`)
    .parse(process.argv);
  
  const options = program.opts();
  
  // Validate options
  const hasAll = !!options.all;
  const hasArticleId = !!options.articleId;
  const hasDate = !!options.date;
  const hasRange = !!options.from || !!options.to;
  
  if (!hasAll && !hasArticleId && !hasDate && !hasRange) {
    console.error('❌ Error: Must specify --all, --article-id, --date, or --from/--to');
    process.exit(1);
  }
  
  if ([hasAll, hasArticleId, hasDate, hasRange].filter(x => x).length > 1) {
    console.error('❌ Error: Cannot combine --all, --article-id, --date, and --from/--to');
    process.exit(1);
  }
  
  if ((options.from && !options.to) || (!options.from && options.to)) {
    console.error('❌ Error: Both --from and --to are required for range checking');
    process.exit(1);
  }
  
  if (options.threshold !== undefined && (options.threshold < 0 || options.threshold > 1)) {
    console.error('❌ Error: Threshold must be between 0 and 1');
    process.exit(1);
  }
  
  if (options.lookbackDays !== undefined && options.lookbackDays < 1) {
    console.error('❌ Error: Lookback days must be at least 1');
    process.exit(1);
  }
  
  return {
    all: hasAll,
    articleId: options.articleId,
    date: options.date,
    from: options.from,
    to: options.to,
    threshold: options.threshold ?? 0.70,
    mark: !!options.mark,
    lookbackDays: options.lookbackDays ?? 30
  };
}

/**
 * Article data for duplicate checking
 */
export interface ArticleData {
  meta: ArticleMetaForIndexing;
  cves: CVEForIndexing[];
  entities: EntityForIndexing[];
}

/**
 * Get article data by ID
 */
export function getArticleData(articleId: string): ArticleData | null {
  const meta = getArticleMeta(articleId);
  if (!meta) {
    return null;
  }
  
  const cves = getArticleCVEs(articleId);
  const entities = getArticleEntities(articleId);
  
  return { meta, cves, entities };
}

/**
 * Get articles to check based on CLI options
 */
function getArticlesToCheck(options: CLIOptions): ArticleData[] {
  const db = getDB();
  
  if (options.articleId) {
    console.log(`📊 Checking article: ${options.articleId}...`);
    const article = getArticleData(options.articleId);
    return article ? [article] : [];
  }
  
  let query = 'SELECT article_id FROM articles_meta';
  const params: any[] = [];
  
  if (options.date) {
    console.log(`📊 Checking articles from date: ${options.date}...`);
    query += ' WHERE pub_date_only = ?';
    params.push(options.date);
  } else if (options.from && options.to) {
    console.log(`📊 Checking articles from ${options.from} to ${options.to}...`);
    query += ' WHERE pub_date_only >= ? AND pub_date_only <= ?';
    params.push(options.from, options.to);
  } else if (options.all) {
    console.log(`📊 Checking all articles in database...`);
  }
  
  query += ' ORDER BY pub_date_only DESC';
  
  const rows = db.prepare(query).all(...params) as Array<{ article_id: string }>;
  
  const articles: ArticleData[] = [];
  for (const row of rows) {
    const article = getArticleData(row.article_id);
    if (article) {
      articles.push(article);
    }
  }
  
  return articles;
}

/**
 * Get candidate articles within lookback window
 */
function getCandidatesInWindow(
  targetDate: string,
  lookbackDays: number
): ArticleData[] {
  const db = getDB();
  
  // Calculate start date (targetDate - lookbackDays)
  const startDate = db.prepare(`
    SELECT date(?, '-' || ? || ' days') as start_date
  `).get(targetDate, lookbackDays) as { start_date: string };
  
  // Get all articles in window (excluding target date to avoid self-comparison)
  const rows = db.prepare(`
    SELECT article_id
    FROM articles_meta
    WHERE pub_date_only >= ?
      AND pub_date_only < ?
    ORDER BY pub_date_only DESC
  `).all(startDate.start_date, targetDate) as Array<{ article_id: string }>;
  
  const articles: ArticleData[] = [];
  for (const row of rows) {
    const article = getArticleData(row.article_id);
    if (article) {
      articles.push(article);
    }
  }
  
  return articles;
}

/**
 * Filter candidates by shared CVEs or entities (fast SQL pre-filter)
 */
function filterCandidatesByEntities(
  targetArticle: ArticleData,
  candidatePool: ArticleData[]
): ArticleData[] {
  // Get target CVE IDs and entity names
  const targetCveIds = new Set(targetArticle.cves.map(c => c.cve_id));
  const targetEntityNames = new Set(targetArticle.entities.map(e => e.entity_name));
  
  // Filter candidates that share at least one CVE or entity
  return candidatePool.filter(candidate => {
    // Skip self-comparison
    if (candidate.meta.article_id === targetArticle.meta.article_id) {
      return false;
    }
    
    // Check for shared CVEs
    const candidateCveIds = candidate.cves.map(c => c.cve_id);
    const hasSharedCve = candidateCveIds.some(cve => targetCveIds.has(cve));
    if (hasSharedCve) {
      return true;
    }
    
    // Check for shared entities
    const candidateEntityNames = candidate.entities.map(e => e.entity_name);
    const hasSharedEntity = candidateEntityNames.some(entity => targetEntityNames.has(entity));
    if (hasSharedEntity) {
      return true;
    }
    
    return false;
  });
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) {
    return 0;
  }
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Generate character trigrams from text
 * Better for technical text than word tokens
 */
function generateTrigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().trim();
  const trigrams = new Set<string>();
  
  for (let i = 0; i < normalized.length - 2; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }
  
  return trigrams;
}

/**
 * Calculate text similarity using character trigrams
 */
function textSimilarity(text1: string, text2: string): number {
  const trigrams1 = generateTrigrams(text1);
  const trigrams2 = generateTrigrams(text2);
  
  return jaccardSimilarity(trigrams1, trigrams2);
}

/**
 * Similarity result with dimension breakdown
 */
export interface SimilarityResult {
  candidateId: string;
  candidateSlug: string;
  candidateDate: string;
  totalScore: number;
  classification: 'NEW' | 'BORDERLINE' | 'UPDATE';
  breakdown: {
    cve: { score: number; weight: number; weighted: number };
    text: { score: number; weight: number; weighted: number };
    threat_actor: { score: number; weight: number; weighted: number };
    malware: { score: number; weight: number; weighted: number };
    product: { score: number; weight: number; weighted: number };
    company: { score: number; weight: number; weighted: number };
  };
}

/**
 * Calculate 6-dimensional weighted Jaccard similarity
 */
export function calculateSimilarity(
  target: ArticleData,
  candidate: ArticleData,
  threshold: number
): SimilarityResult {
  // Dimension 1: CVEs (45% weight - PRIMARY)
  // Phase 4: Increased from 40% to 45% based on Cl0p analysis showing CVE contributed 57.9% of score
  const targetCves = new Set(target.cves.map(c => c.cve_id));
  const candidateCves = new Set(candidate.cves.map(c => c.cve_id));
  const cveScore = jaccardSimilarity(targetCves, candidateCves);
  const cveWeighted = cveScore * 0.45;
  
  // Dimension 2: Text (20% weight - SECONDARY)
  // Phase 4: Use full_report instead of summary for better semantic coverage
  const targetText = target.meta.full_report || target.meta.summary;
  const candidateText = candidate.meta.full_report || candidate.meta.summary;
  const textScore = textSimilarity(targetText, candidateText);
  const textWeighted = textScore * 0.20;
  
  // Dimension 3: Threat Actors (11% weight)
  // Phase 4: Reduced from 12% to 11% to accommodate CVE increase
  const targetThreatActors = new Set(
    target.entities.filter(e => e.entity_type === 'threat_actor').map(e => e.entity_name)
  );
  const candidateThreatActors = new Set(
    candidate.entities.filter(e => e.entity_type === 'threat_actor').map(e => e.entity_name)
  );
  const threatActorScore = jaccardSimilarity(targetThreatActors, candidateThreatActors);
  const threatActorWeighted = threatActorScore * 0.11;
  
  // Dimension 4: Malware (11% weight)
  // Phase 4: Reduced from 12% to 11% to accommodate CVE increase
  const targetMalware = new Set(
    target.entities.filter(e => e.entity_type === 'malware').map(e => e.entity_name)
  );
  const candidateMalware = new Set(
    candidate.entities.filter(e => e.entity_type === 'malware').map(e => e.entity_name)
  );
  const malwareScore = jaccardSimilarity(targetMalware, candidateMalware);
  const malwareWeighted = malwareScore * 0.11;
  
  // Dimension 5: Products (7% weight)
  // Phase 4: Reduced from 8% to 7% to accommodate CVE increase
  const targetProducts = new Set(
    target.entities.filter(e => e.entity_type === 'product').map(e => e.entity_name)
  );
  const candidateProducts = new Set(
    candidate.entities.filter(e => e.entity_type === 'product').map(e => e.entity_name)
  );
  const productScore = jaccardSimilarity(targetProducts, candidateProducts);
  const productWeighted = productScore * 0.07;
  
  // Dimension 6: Companies (6% weight - includes normalized vendor)
  // Phase 4: Reduced from 8% to 6% to accommodate CVE increase
  const targetCompanies = new Set(
    target.entities.filter(e => e.entity_type === 'company').map(e => e.entity_name)
  );
  const candidateCompanies = new Set(
    candidate.entities.filter(e => e.entity_type === 'company').map(e => e.entity_name)
  );
  const companyScore = jaccardSimilarity(targetCompanies, candidateCompanies);
  const companyWeighted = companyScore * 0.06;
  
  // Total weighted score
  const totalScore = 
    cveWeighted + 
    textWeighted + 
    threatActorWeighted + 
    malwareWeighted + 
    productWeighted + 
    companyWeighted;
  
  // Classification
  let classification: 'NEW' | 'BORDERLINE' | 'UPDATE';
  if (totalScore < 0.35) {
    classification = 'NEW';
  } else if (totalScore >= threshold) {
    classification = 'UPDATE';
  } else {
    classification = 'BORDERLINE';
  }
  
  return {
    candidateId: candidate.meta.article_id,
    candidateSlug: candidate.meta.slug,
    candidateDate: candidate.meta.pub_date_only,
    totalScore,
    classification,
    breakdown: {
      cve: { score: cveScore, weight: 0.45, weighted: cveWeighted },
      text: { score: textScore, weight: 0.20, weighted: textWeighted },
      threat_actor: { score: threatActorScore, weight: 0.11, weighted: threatActorWeighted },
      malware: { score: malwareScore, weight: 0.11, weighted: malwareWeighted },
      product: { score: productScore, weight: 0.07, weighted: productWeighted },
      company: { score: companyScore, weight: 0.06, weighted: companyWeighted }
    }
  };
}

/**
 * Format similarity result for display
 */
function formatSimilarityResult(result: SimilarityResult): string {
  const emoji = result.classification === 'UPDATE' ? '🔴' : 
                result.classification === 'BORDERLINE' ? '🟡' : '🟢';
  
  const lines = [
    `${emoji} ${result.totalScore.toFixed(3)} - ${result.classification}`,
    `   ${result.candidateDate} - ${result.candidateSlug}`,
    `   Breakdown:`,
    `     CVE:          ${result.breakdown.cve.score.toFixed(3)} × ${result.breakdown.cve.weight} = ${result.breakdown.cve.weighted.toFixed(3)}`,
    `     Text:         ${result.breakdown.text.score.toFixed(3)} × ${result.breakdown.text.weight} = ${result.breakdown.text.weighted.toFixed(3)}`,
    `     Threat Actor: ${result.breakdown.threat_actor.score.toFixed(3)} × ${result.breakdown.threat_actor.weight} = ${result.breakdown.threat_actor.weighted.toFixed(3)}`,
    `     Malware:      ${result.breakdown.malware.score.toFixed(3)} × ${result.breakdown.malware.weight} = ${result.breakdown.malware.weighted.toFixed(3)}`,
    `     Product:      ${result.breakdown.product.score.toFixed(3)} × ${result.breakdown.product.weight} = ${result.breakdown.product.weighted.toFixed(3)}`,
    `     Company:      ${result.breakdown.company.score.toFixed(3)} × ${result.breakdown.company.weight} = ${result.breakdown.company.weighted.toFixed(3)}`
  ];
  
  return lines.join('\n');
}

/**
 * Check single article for duplicates
 */
export function checkArticle(
  article: ArticleData,
  lookbackDays: number,
  threshold: number
): SimilarityResult[] {
  // Get candidates in lookback window
  const candidatePool = getCandidatesInWindow(article.meta.pub_date_only, lookbackDays);
  
  if (candidatePool.length === 0) {
    return [];
  }
  
  // Filter by shared entities
  const candidates = filterCandidatesByEntities(article, candidatePool);
  
  if (candidates.length === 0) {
    return [];
  }
  
  // Calculate similarity for each candidate
  const results = candidates.map(candidate => 
    calculateSimilarity(article, candidate, threshold)
  );
  
  // Sort by total score descending
  results.sort((a, b) => b.totalScore - a.totalScore);
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Duplicate Detection - Phase 3 of Fingerprint V2\n');
  
  const options = parseArgs();
  
  console.log(`⚙️  Configuration:`);
  console.log(`   Lookback window: ${options.lookbackDays} days`);
  console.log(`   Threshold: ${options.threshold}`);
  console.log(`   Mark duplicates: ${options.mark ? 'YES' : 'NO'}\n`);
  
  const lookbackDays = options.lookbackDays ?? 30;
  const threshold = options.threshold ?? 0.70;
  
  // Get articles to check
  const articles = getArticlesToCheck(options);
  
  if (articles.length === 0) {
    console.log('⚠️  No articles found matching criteria');
    return;
  }
  
  console.log(`✅ Found ${articles.length} article(s) to check\n`);
  
  // Check each article
  let totalDuplicates = 0;
  let totalBorderline = 0;
  let totalNew = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    if (!article) {
      continue;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔍 Checking article ${i + 1}/${articles.length}:`);
    console.log(`   Date: ${article.meta.pub_date_only}`);
    console.log(`   Slug: ${article.meta.slug}`);
    console.log(`   ID: ${article.meta.article_id}\n`);
    
    const results = checkArticle(article, lookbackDays, threshold);
    
    if (results.length === 0) {
      console.log('   ✅ No candidates found (no shared CVEs or entities)\n');
      totalNew++;
      continue;
    }
    
    console.log(`   📊 Candidates analyzed: ${results.length}\n`);
    
    const updates = results.filter(r => r.classification === 'UPDATE');
    const borderline = results.filter(r => r.classification === 'BORDERLINE');
    const newArticles = results.filter(r => r.classification === 'NEW');
    
    if (updates.length > 0) {
      console.log(`   🔴 DUPLICATES DETECTED (${updates.length}):\n`);
      for (const result of updates) {
        console.log(formatSimilarityResult(result));
        console.log('');
      }
      totalDuplicates += updates.length;
    }
    
    if (borderline.length > 0) {
      console.log(`   🟡 BORDERLINE (${borderline.length}):\n`);
      for (const result of borderline) {
        console.log(formatSimilarityResult(result));
        console.log('');
      }
      totalBorderline += borderline.length;
    }
    
    if (newArticles.length > 0 && (updates.length > 0 || borderline.length > 0)) {
      console.log(`   🟢 NEW (${newArticles.length} candidates below 0.35 threshold)\n`);
    }
    
    if (updates.length === 0 && borderline.length === 0) {
      console.log(`   ✅ All candidates below threshold (NEW article)\n`);
      totalNew++;
    }
    
    console.log('');
  }
  
  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Detection Summary:');
  console.log(`   Articles checked: ${articles.length}`);
  console.log(`   Duplicates detected (UPDATE): ${totalDuplicates}`);
  console.log(`   Borderline cases: ${totalBorderline}`);
  console.log(`   New articles: ${totalNew}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (options.mark) {
    console.log('\n⚠️  Note: --mark flag not yet implemented (future feature)');
  }
  
  console.log('\n✅ Duplicate detection complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
