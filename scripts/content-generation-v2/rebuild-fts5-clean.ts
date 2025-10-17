/**
 * Clean FTS5 Rebuild - Proper Virtual Table Recreation
 * 
 * Issue: Using DELETE FROM articles_fts may corrupt FTS5 index
 * Solution: DROP and recreate the virtual table completely
 * 
 * Best Practice: Keep stopwords - BM25 algorithm handles them correctly
 * Reference: FTS5 documentation on stop word handling
 */

import { getDB } from './database/index.js';

const db = getDB();

console.log('🔧 Clean FTS5 Rebuild - Proper Virtual Table Recreation\n');

// Step 1: Drop the existing virtual table
console.log('1️⃣  Dropping existing articles_fts virtual table...');
try {
  db.prepare('DROP TABLE IF EXISTS articles_fts').run();
  console.log('   ✅ Dropped\n');
} catch (error) {
  console.error('   ❌ Error dropping table:', error);
  process.exit(1);
}

// Step 2: Recreate the virtual table with same schema
console.log('2️⃣  Creating fresh articles_fts virtual table...');
try {
  db.prepare(`
    CREATE VIRTUAL TABLE articles_fts USING fts5(
      article_id UNINDEXED,
      headline,
      summary,
      full_report,
      tokenize = 'porter unicode61'
    )
  `).run();
  console.log('   ✅ Created with porter unicode61 tokenizer\n');
} catch (error) {
  console.error('   ❌ Error creating table:', error);
  process.exit(1);
}

// Step 3: Get article count
const { count } = db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number };
console.log(`3️⃣  Found ${count} articles to index\n`);

if (count === 0) {
  console.log('⚠️  No articles to index. Run news-structured.ts first.');
  process.exit(0);
}

// Step 4: Populate with RAW text (NO stopword removal)
console.log('4️⃣  Populating FTS5 index with RAW text (stopwords included)...');
console.log('   📝 Best Practice: Keep stopwords - BM25 handles semantic meaning\n');

const startTime = Date.now();

try {
  const stmt = db.prepare(`
    INSERT INTO articles_fts (article_id, headline, summary, full_report)
    SELECT id, headline, summary, full_report
    FROM articles
  `);
  
  const info = stmt.run();
  const elapsed = Date.now() - startTime;
  
  console.log(`   ✅ Indexed ${info.changes} articles in ${elapsed}ms\n`);
} catch (error) {
  console.error('   ❌ Error populating index:', error);
  process.exit(1);
}

// Step 5: Verify the index
console.log('5️⃣  Verifying FTS5 index...');
const ftsCount = db.prepare('SELECT COUNT(*) as count FROM articles_fts').get() as { count: number };

if (ftsCount.count === count) {
  console.log(`   ✅ Verified: ${ftsCount.count} entries in FTS5 index\n`);
} else {
  console.log(`   ⚠️  Mismatch: ${count} articles but ${ftsCount.count} FTS5 entries\n`);
}

// Step 6: Run a quick test query
console.log('6️⃣  Testing with Clop Oracle query...');
const testResult = db.prepare(`
  SELECT 
    fts.article_id,
    a.slug,
    bm25(articles_fts, 10.0, 5.0, 1.0) as score
  FROM articles_fts fts
  JOIN articles a ON fts.article_id = a.id
  WHERE articles_fts MATCH 'clop OR oracle OR ebs OR zero OR day OR exploitation'
  ORDER BY score ASC
  LIMIT 3
`).all() as any[];

if (testResult.length > 0) {
  console.log(`   ✅ Found ${testResult.length} matches\n`);
  for (const row of testResult) {
    console.log(`      Score: ${row.score.toFixed(2)} - ${row.slug.substring(0, 50)}...`);
  }
} else {
  console.log('   ⚠️  No matches found\n');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Clean FTS5 rebuild complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Next Steps:');
console.log('   1. Run: npx tsx scripts/content-generation-v2/test-fts5-scoring.ts');
console.log('   2. Check if scores improve (expecting -150 to -177 range)');
console.log('   3. If scores match previous -177 results, index corruption was the issue\n');
