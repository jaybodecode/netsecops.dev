#!/usr/bin/env node
/**
 * FTS5 Micro-Test: Full Report Only
 * 
 * Test BM25 scoring with ONLY full_report text (no headline, summary, CVEs, entities)
 * to see if full content alone can detect the two failed duplicates.
 * 
 * Test Cases:
 * 1. LockBit/Qilin/DragonForce Alliance (Oct 7 vs Oct 9) - old score: 0.194
 * 2. Qantas Data Leak (Oct 7 vs Oct 9) - old score: 0.269
 * 
 * Baseline: All 10 Oct 7 articles indexed
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'logs/content-generation-v2.db');
const db = new Database(dbPath);

interface Article {
  id: string;
  slug: string;
  pub_date: string;
  headline: string;
  summary: string;
  full_report: string;
}

/**
 * Extract articles from structured_news JSON blob
 */
function extractArticles(pubDate: string): Article[] {
  const sql = `
    SELECT data FROM structured_news
    WHERE pub_date LIKE ?
  `;
  
  const result = db.prepare(sql).get(`%${pubDate}%`) as { data: string } | undefined;
  
  if (!result) {
    throw new Error(`No structured_news found for ${pubDate}`);
  }
  
  const data = JSON.parse(result.data);
  return data.articles.map((a: any) => ({
    id: a.id,
    slug: a.slug,
    pub_date: pubDate,
    headline: a.headline,
    summary: a.summary,
    full_report: a.full_report
  }));
}

/**
 * Create temporary FTS5 table for testing
 * 
 * Schema with weighted columns:
 * - headline: 20x weight (most important - contains key entities)
 * - summary: 10x weight (distilled key information)
 * - full_report: 1x weight (full context)
 */
function createTestFTS5() {
  console.log('Creating temporary FTS5 table with weighted columns...');
  
  db.exec(`
    DROP TABLE IF EXISTS test_fts;
    
    CREATE VIRTUAL TABLE test_fts USING fts5(
      article_id UNINDEXED,
      slug UNINDEXED,
      pub_date UNINDEXED,
      headline,
      summary,
      full_report,
      tokenize='porter unicode61 remove_diacritics 1'
    );
  `);
  
  console.log('✅ FTS5 table created (headline 20x, summary 10x, full_report 1x)\n');
}

/**
 * Index Oct 7 articles
 */
function indexOct7Articles() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📚 Indexing October 7 Articles (Baseline)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const articles = extractArticles('2025-10-07');
  
  const insert = db.prepare(`
    INSERT INTO test_fts (article_id, slug, pub_date, headline, summary, full_report)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const article of articles) {
    insert.run(
      article.id,
      article.slug,
      article.pub_date,
      article.headline,
      article.summary,
      article.full_report
    );
    
    const wordCount = article.full_report.split(/\s+/).length;
    console.log(`✅ ${article.slug}`);
    console.log(`   Words: ${wordCount}\n`);
  }
  
  console.log(`📊 Total indexed: ${articles.length} articles\n`);
  return articles;
}

/**
 * Query FTS5 for similar articles
 * 
 * Strategy: Use ALL words from headline, summary, and full_report
 * Apply column weights in BM25 scoring: headline 20x, summary 10x, full_report 1x
 */
function findSimilar(article: Article, debug = false): Array<{
  article_id: string;
  slug: string;
  headline: string;
  score: number;
}> {
  // Extract ALL words from headline, summary, and full_report
  const allText = `${article.headline} ${article.summary} ${article.full_report}`;
  
  const allWords = allText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2) // Keep short words (CVE, API, etc.)
    .map(word => word.replace(/[^a-z0-9]/g, ''))
    .filter(word => word.length > 2);
  
  // Remove duplicates but preserve all unique terms
  const uniqueWords = Array.from(new Set(allWords));
  
  if (uniqueWords.length === 0) {
    return [];
  }
  
  // Use OR - documents matching more terms rank higher
  const query = uniqueWords.join(' OR ');
  
  if (debug) {
    console.log(`   Total unique terms: ${uniqueWords.length}`);
    console.log(`   Headline words: ${article.headline.split(/\s+/).length}`);
    console.log(`   Summary words: ${article.summary.split(/\s+/).length}`);
    console.log(`   Full report words: ${article.full_report.split(/\s+/).length}`);
    console.log(`   Sample terms: ${uniqueWords.slice(0, 20).join(', ')}...`);
    console.log(`   Query length: ${query.length} chars\n`);
  }
  
  // Use bm25() with column weights: headline=20.0, summary=10.0, full_report=1.0
  const matchSql = `
    SELECT 
      article_id,
      slug,
      headline,
      bm25(test_fts, 20.0, 10.0, 1.0) as score
    FROM test_fts
    WHERE test_fts MATCH ?
      AND article_id != ?
    ORDER BY score DESC
    LIMIT 10
  `;
  
  return db.prepare(matchSql).all(query, article.id) as any[];
}

/**
 * Test specific Oct 9 article
 */
function testArticle(article: Article, testName: string, oldScore: number) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔍 TEST: ${testName}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`📄 Oct 9 Article:`);
  console.log(`   Slug: ${article.slug}`);
  console.log(`   Headline: ${article.headline}`);
  console.log(`   Words: ${article.full_report.split(/\s+/).length}`);
  console.log(`   Old Entity Score: ${oldScore.toFixed(3)}\n`);
  
  const matches = findSimilar(article, true); // Enable debug
  
  if (matches.length === 0) {
    console.log('❌ No matches found!\n');
    return;
  }
  
  console.log(`📊 FTS5 Results (Top ${Math.min(10, matches.length)} matches):\n`);
  
  for (let i = 0; i < Math.min(10, matches.length); i++) {
    const match = matches[i];
    if (!match) continue;
    
    const isExpectedMatch = 
      (testName.includes('LockBit') && match.slug.includes('lockbit')) ||
      (testName.includes('Qantas') && match.slug.includes('qantas'));
    
    const icon = isExpectedMatch ? '🎯' : '  ';
    console.log(`${icon} Rank ${i + 1}: BM25 Score = ${match.score.toFixed(2)}`);
    console.log(`   Slug: ${match.slug}`);
    console.log(`   Headline: ${match.headline.substring(0, 80)}...`);
    
    if (isExpectedMatch) {
      console.log(`   ✅ CORRECT MATCH FOUND!`);
      console.log(`   Old Score: ${oldScore.toFixed(3)} → New Score: ${match.score.toFixed(2)}`);
      
      // Interpret score
      if (match.score < -20) {
        console.log(`   Decision: AUTO UPDATE (very high similarity)`);
      } else if (match.score < -10) {
        console.log(`   Decision: AUTO UPDATE (high similarity)`);
      } else if (match.score < -5) {
        console.log(`   Decision: BORDERLINE (call LLM)`);
      } else {
        console.log(`   Decision: NEW (low similarity)`);
      }
    }
    console.log('');
  }
}

/**
 * Main test execution
 */
function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FTS5 MICRO-TEST: Full Report Text Only');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n');
  
  // Step 1: Create FTS5 table
  createTestFTS5();
  
  // Step 2: Index Oct 7 baseline
  const oct7Articles = indexOct7Articles();
  
  // Step 3: Extract Oct 9 test articles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 Loading October 9 Test Cases');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const oct9Articles = extractArticles('2025-10-09');
  
  // Find the two failed cases
  const lockbitArticle = oct9Articles.find(a => 
    a.slug.includes('lockbit') && a.slug.includes('alliance')
  );
  
  const qantasArticle = oct9Articles.find(a => 
    a.slug.includes('qantas') && a.slug.includes('lapsus')
  );
  
  if (!lockbitArticle || !qantasArticle) {
    console.error('❌ Could not find test articles!');
    console.error('LockBit found:', !!lockbitArticle);
    console.error('Qantas found:', !!qantasArticle);
    process.exit(1);
  }
  
  console.log('✅ Found LockBit Alliance article');
  console.log('✅ Found Qantas Leak article\n');
  
  // Step 4: Test LockBit Alliance
  testArticle(lockbitArticle, 'LockBit/Qilin/DragonForce Alliance', 0.194);
  
  // Step 5: Test Qantas Leak
  testArticle(qantasArticle, 'Qantas Data Leak', 0.269);
  
  // Step 6: Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Configuration:');
  console.log('  • Index: headline (20x weight) + summary (10x weight) + full_report (1x weight)');
  console.log('  • Tokenizer: porter unicode61 remove_diacritics 1');
  console.log('  • Baseline: 10 Oct 7 articles');
  console.log('  • Test cases: 2 Oct 9 articles (known duplicates)\n');
  
  console.log('Expected behavior:');
  console.log('  • Weighted BM25 prioritizes headline/summary matches');
  console.log('  • Full report provides additional context');
  console.log('  • Should see HIGHER scores for duplicates vs 10x/5x/1x approach\n');
  
  console.log('Questions to answer:');
  console.log('  1. Do 20x/10x/1x weights improve separation vs 10x/5x/1x?');
  console.log('  2. What threshold should trigger AUTO UPDATE?');
  console.log('  3. Is there a point of diminishing returns on weighting?\n');
  
  // Cleanup
  db.exec('DROP TABLE test_fts;');
  db.close();
  
  console.log('✅ Test complete!\n');
}

main();
