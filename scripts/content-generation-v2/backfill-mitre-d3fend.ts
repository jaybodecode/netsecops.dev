#!/usr/bin/env node
/**
 * Backfill MITRE Mitigations and D3FEND Data
 * 
 * Purpose: Inject missing mitre_mitigations data from structured_news JSON
 *          into database tables without re-running expensive Step 2 (LLM calls)
 * 
 * This script:
 * 1. Reads existing structured_news JSON blobs from database
 * 2. Extracts mitre_mitigations, iocs, cyber_observables, d3fend_countermeasures
 * 3. Finds matching articles in database (by slug/id)
 * 4. Inserts missing data into normalized tables
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/backfill-mitre-d3fend.ts --date 2025-10-07
 *   npx tsx scripts/content-generation-v2/backfill-mitre-d3fend.ts --all
 */

import Database from 'better-sqlite3';
import { parseArgs } from 'node:util';

const DB_PATH = 'logs/content-generation-v2.db';

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    date: { type: 'string', short: 'd' },
    all: { type: 'boolean', default: false },
  },
  strict: true,
  allowPositionals: false,
});

const targetDate = values.date;
const processAll = values.all;

console.log('🔄 Backfill MITRE Mitigations & D3FEND Data');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (processAll) {
  console.log('   Mode: Process ALL structured_news records\n');
} else if (targetDate) {
  console.log(`   Date: ${targetDate}\n`);
} else {
  console.error('❌ Error: --date or --all parameter required');
  console.error('   Examples:');
  console.error('     npx tsx backfill-mitre-d3fend.ts --date 2025-10-07');
  console.error('     npx tsx backfill-mitre-d3fend.ts --all');
  process.exit(1);
}

// Open database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF'); // Disable FK constraints for backfill

/**
 * Get structured news records to process
 */
function getStructuredNewsRecords(): Array<{ pub_id: string; pub_date: string; data: string }> {
  let sql = 'SELECT pub_id, pub_date, data FROM structured_news';
  const params: any[] = [];
  
  if (targetDate) {
    sql += ' WHERE DATE(pub_date) = ?';
    params.push(targetDate);
  }
  
  sql += ' ORDER BY pub_date';
  
  const stmt = db.prepare(sql);
  return stmt.all(...params) as Array<{ pub_id: string; pub_date: string; data: string }>;
}

/**
 * Backfill data for a single article
 */
function backfillArticle(article: any, articleDbId: string): { mitigations: number; d3fend: number; iocs: number; observables: number } {
  let mitigationCount = 0;
  let d3fendCount = 0;
  let iocCount = 0;
  let observableCount = 0;
  
  // 1. Insert MITRE Mitigations
  if (article.mitre_mitigations && article.mitre_mitigations.length > 0) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO article_mitre_mitigations (
        article_id, mitigation_id, name, domain, description, d3fend_techniques
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const mitigation of article.mitre_mitigations) {
      stmt.run(
        articleDbId,
        mitigation.id,
        mitigation.name,
        mitigation.domain || null,
        mitigation.description || null,
        mitigation.d3fend_techniques ? JSON.stringify(mitigation.d3fend_techniques) : null
      );
      mitigationCount++;
    }
  }
  
  // 2. Insert D3FEND Countermeasures (with url and mitre_mitigation_id)
  if (article.d3fend_countermeasures && article.d3fend_countermeasures.length > 0) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO article_d3fend_countermeasures (
        article_id, technique_id, technique_name, url, recommendation, mitre_mitigation_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const countermeasure of article.d3fend_countermeasures) {
      stmt.run(
        articleDbId,
        countermeasure.technique_id,
        countermeasure.technique_name,
        countermeasure.url,
        countermeasure.recommendation,
        countermeasure.mitre_mitigation_id || null
      );
      d3fendCount++;
    }
  }
  
  // 3. Insert IOCs
  if (article.iocs && article.iocs.length > 0) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO article_iocs (
        article_id, type, value, description, source
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const ioc of article.iocs) {
      stmt.run(
        articleDbId,
        ioc.type,
        ioc.value,
        ioc.description || null,
        ioc.source || null
      );
      iocCount++;
    }
  }
  
  // 4. Insert Cyber Observables
  if (article.cyber_observables && article.cyber_observables.length > 0) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO article_cyber_observables (
        article_id, type, value, description, context, confidence
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const observable of article.cyber_observables) {
      stmt.run(
        articleDbId,
        observable.type,
        observable.value,
        observable.description,
        observable.context,
        observable.confidence
      );
      observableCount++;
    }
  }
  
  return { mitigations: mitigationCount, d3fend: d3fendCount, iocs: iocCount, observables: observableCount };
}

/**
 * Main execution
 */
function main() {
  console.log('📋 Fetching structured_news records...\n');
  
  const records = getStructuredNewsRecords();
  
  if (records.length === 0) {
    console.log('❌ No structured_news records found');
    process.exit(1);
  }
  
  console.log(`✅ Found ${records.length} structured_news record(s)\n`);
  
  let totalArticles = 0;
  let totalMitigations = 0;
  let totalD3fend = 0;
  let totalIocs = 0;
  let totalObservables = 0;
  
  // Process each publication
  for (const record of records) {
    console.log(`\n📰 Processing: ${record.pub_date}`);
    console.log(`   pub_id: ${record.pub_id}`);
    
    const publication = JSON.parse(record.data);
    const articles = publication.articles || [];
    
    console.log(`   Articles in publication: ${articles.length}\n`);
    
    for (const article of articles) {
      // Find article in database by slug
      const dbArticle = db.prepare('SELECT id FROM articles WHERE slug = ?').get(article.slug) as { id: string } | undefined;
      
      if (!dbArticle) {
        console.log(`   ⚠️  Article not found in DB: ${article.slug} (skipping)`);
        continue;
      }
      
      const counts = backfillArticle(article, dbArticle.id);
      totalArticles++;
      totalMitigations += counts.mitigations;
      totalD3fend += counts.d3fend;
      totalIocs += counts.iocs;
      totalObservables += counts.observables;
      
      console.log(`   ✅ ${article.slug}`);
      console.log(`      → ${counts.mitigations} mitigations, ${counts.d3fend} d3fend, ${counts.iocs} iocs, ${counts.observables} observables`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ BACKFILL COMPLETE\n');
  console.log(`   Articles processed: ${totalArticles}`);
  console.log(`   MITRE mitigations inserted: ${totalMitigations}`);
  console.log(`   D3FEND countermeasures inserted: ${totalD3fend}`);
  console.log(`   IOCs inserted: ${totalIocs}`);
  console.log(`   Cyber observables inserted: ${totalObservables}\n`);
  
  console.log('Next Steps:');
  console.log('   1. Verify data: SELECT COUNT(*) FROM article_mitre_mitigations');
  console.log('   2. Continue pipeline from Step 4 or regenerate JSON (Step 6)\n');
}

// Run
main();
db.close();
