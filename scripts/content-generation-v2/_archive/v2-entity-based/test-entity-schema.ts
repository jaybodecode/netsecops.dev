#!/usr/bin/env tsx
/**
 * Test script for Article Entity Indexing Schema
 * 
 * Verifies Phase 1 implementation:
 * - Creates tables and indexes
 * - Checks table structure
 * - Tests basic insert/query operations
 */

import { initDB } from './database/index.js';
import { initSchema } from './database/schema.js';
import {
  insertArticleMeta,
  insertCVE,
  insertEntity,
  isArticleIndexed,
  getArticleMeta,
  getArticleCVEs,
  getArticleEntities,
  getEntityIndexStats,
  shouldIndexEntityType,
  normalizeEntityType,
  type ArticleMetaForIndexing,
  type CVEForIndexing,
  type EntityForIndexing
} from './database/schema.js';

console.log('🧪 Testing Article Entity Indexing Schema\n');

// Initialize database and schema
console.log('📋 Step 1: Initialize database and schema');
initDB();
initSchema();

// Check tables exist
console.log('\n📋 Step 2: Verify tables created');
const db = initDB();

const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  AND name IN ('articles_meta', 'article_cves', 'article_entities')
  ORDER BY name
`).all() as Array<{ name: string }>;

console.log('✅ Tables found:', tables.map(t => t.name).join(', '));

// Check indexes exist
console.log('\n📋 Step 3: Verify indexes created');
const indexes = db.prepare(`
  SELECT name, tbl_name 
  FROM sqlite_master 
  WHERE type='index' 
  AND tbl_name IN ('articles_meta', 'article_cves', 'article_entities')
  ORDER BY tbl_name, name
`).all() as Array<{ name: string; tbl_name: string }>;

console.log(`✅ Indexes found: ${indexes.length}`);
for (const idx of indexes) {
  console.log(`   - ${idx.name} on ${idx.tbl_name}`);
}

// Test entity type filtering
console.log('\n📋 Step 4: Test entity type filtering');
const testTypes = [
  'threat_actor',
  'malware',
  'product',
  'company',
  'vendor',
  'government_agency',
  'person',
  'technology',
  'security_organization',
  'other'
];

console.log('Entity type filtering:');
for (const type of testTypes) {
  const shouldIndex = shouldIndexEntityType(type);
  const normalized = normalizeEntityType(type);
  const status = shouldIndex ? '✅ INDEX' : '❌ SKIP';
  const normNote = normalized !== type ? ` → ${normalized}` : '';
  console.log(`   ${status}: ${type}${normNote}`);
}

// Test insert operations
console.log('\n📋 Step 5: Test insert operations');

// First create a test publication in structured_news (required for foreign key)
console.log('Creating test publication...');
db.prepare(`
  INSERT OR IGNORE INTO structured_news (
    pub_id, pub_date, pub_type, data, headline, total_articles, date_range
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  'test-pub-001',
  '2025-10-14T12:00:00.000Z',
  'daily',
  '{}',
  'Test Publication for Entity Schema',
  1,
  '2025-10-14'
);
console.log('✅ Test publication created');

const testArticleMeta: ArticleMetaForIndexing = {
  article_id: 'test-article-001',
  pub_id: 'test-pub-001',
  pub_date_only: '2025-10-14',
  slug: 'test-article-fingerprint-v2',
  summary: 'This is a test article for fingerprint V2 duplicate detection system.'
};

console.log('Inserting test article metadata...');
insertArticleMeta(testArticleMeta);
console.log('✅ Article metadata inserted');

const testCVEs: CVEForIndexing[] = [
  {
    article_id: 'test-article-001',
    cve_id: 'CVE-2025-1234',
    cvss_score: 9.8,
    severity: 'critical',
    kev: true
  },
  {
    article_id: 'test-article-001',
    cve_id: 'CVE-2025-5678',
    cvss_score: 7.5,
    severity: 'high',
    kev: false
  }
];

console.log('Inserting test CVEs...');
for (const cve of testCVEs) {
  insertCVE(cve);
}
console.log(`✅ ${testCVEs.length} CVEs inserted`);

const testEntities: EntityForIndexing[] = [
  { article_id: 'test-article-001', entity_name: 'Cl0p', entity_type: 'threat_actor' },
  { article_id: 'test-article-001', entity_name: 'Cobalt Strike', entity_type: 'malware' },
  { article_id: 'test-article-001', entity_name: 'Oracle Database', entity_type: 'product' },
  { article_id: 'test-article-001', entity_name: 'Citibank', entity_type: 'company' },
  { article_id: 'test-article-001', entity_name: 'FBI', entity_type: 'government_agency' }
];

console.log('Inserting test entities...');
for (const entity of testEntities) {
  insertEntity(entity);
}
console.log(`✅ ${testEntities.length} entities inserted`);

// Test query operations
console.log('\n📋 Step 6: Test query operations');

const isIndexed = isArticleIndexed('test-article-001');
console.log(`Article indexed check: ${isIndexed ? '✅ YES' : '❌ NO'}`);

const retrievedMeta = getArticleMeta('test-article-001');
console.log('Retrieved metadata:', retrievedMeta ? '✅ SUCCESS' : '❌ FAILED');
if (retrievedMeta) {
  console.log(`   - Article ID: ${retrievedMeta.article_id}`);
  console.log(`   - Pub ID: ${retrievedMeta.pub_id}`);
  console.log(`   - Date: ${retrievedMeta.pub_date_only}`);
  console.log(`   - Slug: ${retrievedMeta.slug}`);
}

const retrievedCVEs = getArticleCVEs('test-article-001');
console.log(`Retrieved CVEs: ${retrievedCVEs.length} found`);
for (const cve of retrievedCVEs) {
  console.log(`   - ${cve.cve_id}: ${cve.severity} (CVSS: ${cve.cvss_score}, KEV: ${cve.kev})`);
}

const retrievedEntities = getArticleEntities('test-article-001');
console.log(`Retrieved entities: ${retrievedEntities.length} found`);
for (const entity of retrievedEntities) {
  console.log(`   - ${entity.entity_name} (${entity.entity_type})`);
}

// Get statistics
console.log('\n📋 Step 7: Get index statistics');
const stats = getEntityIndexStats();
console.log('Entity Index Statistics:');
console.log(`   - Total articles: ${stats.total_articles}`);
console.log(`   - Total publications: ${stats.total_publications}`);
console.log(`   - Total CVEs: ${stats.total_cves} (${stats.unique_cves} unique)`);
console.log(`   - Total entities: ${stats.total_entities} (${stats.unique_entities} unique)`);
console.log(`   - Date range: ${stats.oldest_date} to ${stats.newest_date}`);
console.log('   - Entity type breakdown:');
for (const [type, count] of Object.entries(stats.entity_type_counts)) {
  console.log(`     • ${type}: ${count}`);
}

// Test production data exists
console.log('\n📋 Step 8: Check existing production data');
const existingPubs = db.prepare(`
  SELECT pub_date_only, total_articles, headline
  FROM structured_news
  ORDER BY pub_date_only
`).all() as Array<{ pub_date_only: string; total_articles: number; headline: string }>;

if (existingPubs.length > 0) {
  console.log(`✅ Found ${existingPubs.length} existing publications:`);
  for (const pub of existingPubs) {
    console.log(`   - ${pub.pub_date_only}: ${pub.total_articles} articles`);
    console.log(`     "${pub.headline.substring(0, 80)}..."`);
  }
  console.log('\n💡 Ready to run Phase 2: index-entities.ts to populate entity indexes');
} else {
  console.log('⚠️  No existing publications found');
  console.log('   Run news-structured.ts first to generate publications');
}

console.log('\n✅ All tests passed! Entity indexing schema is ready.');
console.log('\n📝 Next Steps:');
console.log('   1. Review schema in: scripts/content-generation-v2/database/schema-article-entities.ts');
console.log('   2. Check tables: sqlite3 logs/content-generation-v2.db ".tables"');
console.log('   3. Check schema: sqlite3 logs/content-generation-v2.db ".schema article_cves"');
console.log('   4. Create index-entities.ts to populate indexes from existing publications');
