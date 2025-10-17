/**
 * Test: Full Report vs Summary Text Similarity
 * 
 * Compares character trigram similarity using:
 * 1. Summary fields (150-300 words, ~800 chars)
 * 2. Full report fields (1000-2500 words, ~3000-5000 chars)
 * 
 * Question: Does longer text improve duplicate detection?
 */

import 'dotenv/config';
import { getDB } from './database/index.js';

interface ArticleText {
  slug: string;
  summary: string;
  full_report: string;
}

/**
 * Generate character trigrams from text
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
 * Get article text from structured_news
 */
function getArticleText(pubDate: string, slugPattern: string): ArticleText | null {
  const db = getDB();
  
  const row = db.prepare(`
    SELECT data
    FROM structured_news
    WHERE pub_date_only = ?
    LIMIT 1
  `).get(pubDate) as { data: string } | undefined;
  
  if (!row) {
    return null;
  }
  
  const publication = JSON.parse(row.data);
  const article = publication.articles.find((a: any) => a.slug.includes(slugPattern));
  
  if (!article) {
    return null;
  }
  
  return {
    slug: article.slug,
    summary: article.summary,
    full_report: article.full_report
  };
}

/**
 * Main analysis
 */
async function main() {
  console.log('🔍 Full Report vs Summary Text Similarity Analysis\n');
  
  // Get Oct 7 and Oct 9 Cl0p articles
  const oct7 = getArticleText('2025-10-07', 'clop-exploits-critical-oracle-ebs-zero-day-cve');
  const oct9 = getArticleText('2025-10-09', 'clop-exploits-critical-oracle-ebs-zero-day-in-mass');
  
  if (!oct7 || !oct9) {
    console.error('❌ Could not find articles');
    return;
  }
  
  console.log('📊 Article Lengths:\n');
  console.log(`Oct 7: ${oct7.slug}`);
  console.log(`  Summary:     ${oct7.summary.length.toLocaleString()} chars`);
  console.log(`  Full Report: ${oct7.full_report.length.toLocaleString()} chars`);
  console.log('');
  console.log(`Oct 9: ${oct9.slug}`);
  console.log(`  Summary:     ${oct9.summary.length.toLocaleString()} chars`);
  console.log(`  Full Report: ${oct9.full_report.length.toLocaleString()} chars`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Generate trigrams
  console.log('⚙️  Generating character trigrams...\n');
  
  const t1 = Date.now();
  const oct7SummaryTrigrams = generateTrigrams(oct7.summary);
  const oct9SummaryTrigrams = generateTrigrams(oct9.summary);
  const summaryTime = Date.now() - t1;
  
  const t2 = Date.now();
  const oct7FullTrigrams = generateTrigrams(oct7.full_report);
  const oct9FullTrigrams = generateTrigrams(oct9.full_report);
  const fullTime = Date.now() - t2;
  
  console.log(`Summary trigrams:`);
  console.log(`  Oct 7: ${oct7SummaryTrigrams.size.toLocaleString()} unique trigrams`);
  console.log(`  Oct 9: ${oct9SummaryTrigrams.size.toLocaleString()} unique trigrams`);
  console.log(`  Time: ${summaryTime}ms`);
  console.log('');
  console.log(`Full report trigrams:`);
  console.log(`  Oct 7: ${oct7FullTrigrams.size.toLocaleString()} unique trigrams`);
  console.log(`  Oct 9: ${oct9FullTrigrams.size.toLocaleString()} unique trigrams`);
  console.log(`  Time: ${fullTime}ms`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Calculate similarities
  console.log('📈 Jaccard Similarity Scores:\n');
  
  const summarySimilarity = jaccardSimilarity(oct7SummaryTrigrams, oct9SummaryTrigrams);
  const fullSimilarity = jaccardSimilarity(oct7FullTrigrams, oct9FullTrigrams);
  
  console.log(`Using SUMMARY field (current system):`);
  console.log(`  Similarity: ${(summarySimilarity * 100).toFixed(2)}%`);
  console.log(`  Weighted contribution (20%): ${(summarySimilarity * 0.20).toFixed(3)}`);
  console.log('');
  console.log(`Using FULL REPORT field (proposed):`);
  console.log(`  Similarity: ${(fullSimilarity * 100).toFixed(2)}%`);
  console.log(`  Weighted contribution (20%): ${(fullSimilarity * 0.20).toFixed(3)}`);
  console.log('');
  console.log(`Difference: ${((fullSimilarity - summarySimilarity) * 100).toFixed(2)}%`);
  console.log(`Impact on total score: ${((fullSimilarity - summarySimilarity) * 0.20).toFixed(3)}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Calculate impact on overall 6D score
  console.log('🎯 Impact on Overall 6D Score (Cl0p Case):\n');
  
  const cveScore = 1.000;
  const threatActorScore = 0.750;
  const productScore = 1.000;
  const companyScore = 0.500;
  
  const currentTotal = 
    (cveScore * 0.40) +
    (summarySimilarity * 0.20) +
    (threatActorScore * 0.12) +
    (0.000 * 0.12) + // malware
    (productScore * 0.08) +
    (companyScore * 0.08);
  
  const proposedTotal = 
    (cveScore * 0.40) +
    (fullSimilarity * 0.20) +
    (threatActorScore * 0.12) +
    (0.000 * 0.12) + // malware
    (productScore * 0.08) +
    (companyScore * 0.08);
  
  console.log(`Current score (summary):      ${currentTotal.toFixed(3)} (BORDERLINE with 0.70 threshold)`);
  console.log(`Proposed score (full report): ${proposedTotal.toFixed(3)}`);
  console.log(`Difference:                   ${(proposedTotal - currentTotal).toFixed(3)}`);
  console.log('');
  
  if (proposedTotal >= 0.70) {
    console.log(`✅ With full report: Classified as UPDATE (≥0.70)`);
  } else if (proposedTotal >= 0.35) {
    console.log(`🟡 With full report: Still BORDERLINE (0.35-0.70)`);
  } else {
    console.log(`🟢 With full report: Classified as NEW (<0.35)`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Performance analysis
  console.log('⚡ Performance Analysis:\n');
  
  const summaryCharsPerMs = (oct7.summary.length + oct9.summary.length) / summaryTime;
  const fullCharsPerMs = (oct7.full_report.length + oct9.full_report.length) / fullTime;
  
  console.log(`Summary processing:     ${summaryTime}ms for ${(oct7.summary.length + oct9.summary.length).toLocaleString()} chars (${summaryCharsPerMs.toFixed(0)} chars/ms)`);
  console.log(`Full report processing: ${fullTime}ms for ${(oct7.full_report.length + oct9.full_report.length).toLocaleString()} chars (${fullCharsPerMs.toFixed(0)} chars/ms)`);
  console.log(`Slowdown factor:        ${(fullTime / summaryTime).toFixed(1)}x`);
  console.log('');
  
  const articlesPerDay = 10;
  const candidatesPerArticle = 10; // average
  const comparisonsPerDay = articlesPerDay * candidatesPerArticle;
  
  const summaryDailyTime = comparisonsPerDay * summaryTime;
  const fullDailyTime = comparisonsPerDay * fullTime;
  
  console.log(`Estimated daily comparisons: ${comparisonsPerDay} (${articlesPerDay} articles × ${candidatesPerArticle} candidates)`);
  console.log(`  Summary method:     ${summaryDailyTime}ms (${(summaryDailyTime / 1000).toFixed(2)}s)`);
  console.log(`  Full report method: ${fullDailyTime}ms (${(fullDailyTime / 1000).toFixed(2)}s)`);
  console.log(`  Additional time:    ${fullDailyTime - summaryDailyTime}ms (${((fullDailyTime - summaryDailyTime) / 1000).toFixed(2)}s)`);
  console.log('');
  
  if (fullDailyTime < 10000) {
    console.log(`✅ Still fast enough (<10s per day) - compute is cheap!`);
  } else if (fullDailyTime < 60000) {
    console.log(`⚠️  Slower but acceptable (<60s per day)`);
  } else {
    console.log(`❌ Too slow (>60s per day)`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Sample trigrams comparison
  console.log('🔬 Sample Trigrams (first 20 unique to each):\n');
  
  const summaryOnlyOct7 = [...oct7SummaryTrigrams].filter(t => !oct9SummaryTrigrams.has(t)).slice(0, 20);
  const summaryOnlyOct9 = [...oct9SummaryTrigrams].filter(t => !oct7SummaryTrigrams.has(t)).slice(0, 20);
  
  const fullOnlyOct7 = [...oct7FullTrigrams].filter(t => !oct9FullTrigrams.has(t)).slice(0, 20);
  const fullOnlyOct9 = [...oct9FullTrigrams].filter(t => !oct7FullTrigrams.has(t)).slice(0, 20);
  
  console.log(`Summary - Oct 7 unique: ${summaryOnlyOct7.join(', ')}`);
  console.log(`Summary - Oct 9 unique: ${summaryOnlyOct9.join(', ')}`);
  console.log('');
  console.log(`Full - Oct 7 unique: ${fullOnlyOct7.join(', ')}`);
  console.log(`Full - Oct 9 unique: ${fullOnlyOct9.join(', ')}`);
  
  console.log('\n✅ Analysis complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
