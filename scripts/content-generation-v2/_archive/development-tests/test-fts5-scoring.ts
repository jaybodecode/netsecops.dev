/**
 * Test FTS5 Scoring - Manual Check
 * 
 * Test the improved FTS5 scoring by comparing known duplicate articles
 */

import { getDB } from './database/index.js';
import { removeStopwords, eng } from 'stopword';

const db = getDB();

// Get the Oct 9 Clop Oracle article
const targetArticle = db.prepare(`
  SELECT id, slug, headline, summary, full_report, created_at
  FROM articles
  WHERE slug = 'clop-exploits-critical-oracle-ebs-zero-day-in-mass-extortion-campaign'
`).get() as any;

if (!targetArticle) {
  console.error('❌ Target article not found');
  process.exit(1);
}

console.log('🎯 Target Article (Oct 9):');
console.log(`   ID: ${targetArticle.id}`);
console.log(`   Slug: ${targetArticle.slug}`);
console.log(`   Headline: ${targetArticle.headline}\n`);

// Use ALL text (headline + summary + full_report) - matches check-duplicates-v3.ts
const fullText = `${targetArticle.headline} ${targetArticle.summary} ${targetArticle.full_report}`;

const words = fullText
  .toLowerCase()
  .replace(/[^\w\s]/g, ' ')
  .split(/\s+/)
  .filter((w: string) => w.length >= 3);

// Keep stopwords - FTS5 BM25 algorithm handles semantic meaning correctly
// Best Practice: "in Texas" vs "Texas" has different meaning
const cleanedWords = words; // Use ALL words including stopwords

// Get unique words (remove duplicates but keep all terms)
const uniqueWords = Array.from(new Set(cleanedWords));

// Build FTS5 query with OR matching
const query = uniqueWords.join(' OR ');

console.log(`📝 Query Stats:`);
console.log(`   Total words: ${words.length}`);
console.log(`   Unique terms: ${uniqueWords.length}`);
console.log(`   Stopwords: INCLUDED (BM25 handles semantic meaning)`);
console.log(`   Reduction: ${Math.round((1 - uniqueWords.length / words.length) * 100)}%`);
console.log(`   Query: ALL text (headline + summary + full_report)`);
console.log(`   Query method: OR matching (all unique terms)`);
console.log(`   Weights: 5x headline, 2x summary, 1x full_report (testing)`);
console.log(`   Top 10 terms: ${uniqueWords.slice(0, 10).join(', ')}`);
console.log(`   Query preview: ${query.substring(0, 150)}...\n`);

// Query FTS5
const sql = `
  SELECT 
    fts.article_id,
    a.slug,
    a.headline,
    DATE(a.created_at) as date,
    bm25(articles_fts, 5.0, 2.0, 1.0) as score
  FROM articles_fts fts
  JOIN articles a ON fts.article_id = a.id
  WHERE articles_fts MATCH ?
    AND fts.article_id != ?
    AND DATE(a.created_at) < DATE(?)
    AND DATE(a.created_at) >= DATE(?, '-30 days')
  ORDER BY score ASC
  LIMIT 10
`;

const results = db.prepare(sql).all(
  query,
  targetArticle.id,
  targetArticle.created_at,
  targetArticle.created_at
) as any[];

console.log(`🔍 FTS5 Results (Top ${results.length} matches):\n`);

for (const [index, result] of results.entries()) {
  const emoji = result.score < -150 ? '🔴 SKIP-FTS5' :
                result.score < -50 ? '🟡 LLM' : '🟢 NEW';
  
  console.log(`${index + 1}. ${emoji} Score: ${result.score.toFixed(2)}`);
  console.log(`   Date: ${result.date}`);
  console.log(`   Slug: ${result.slug}`);
  console.log(`   Headline: ${result.headline}\n`);
}

// Summary
if (results.length > 0) {
  const bestScore = results[0].score;
  const worstScore = results[results.length - 1].score;
  const skipFTS5Count = results.filter(r => r.score < -150).length;
  const llmCount = results.filter(r => r.score >= -150 && r.score < -50).length;
  const newCount = results.filter(r => r.score >= -50).length;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`   Score range: ${bestScore.toFixed(2)} to ${worstScore.toFixed(2)}`);
  console.log(`   🔴 SKIP-FTS5 (<-150): ${skipFTS5Count}`);
  console.log(`   🟡 LLM (-150 to -50): ${llmCount}`);
  console.log(`   🟢 NEW (≥-50): ${newCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} else {
  console.log('⚠️  No similar articles found');
}
