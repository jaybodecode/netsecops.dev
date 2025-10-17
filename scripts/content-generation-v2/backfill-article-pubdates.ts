#!/usr/bin/env npx tsx
/**
 * Backfill pub_date field in structured_news articles
 * 
 * This script ensures all articles in structured_news have the correct pub_date
 * set based on the structured_news record's pub_date.
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'logs/content-generation-v2.db');

interface StructuredNewsRecord {
  pub_id: string;
  pub_date: string;
  data: string;
}

function main() {
  console.log('🔧 Backfilling pub_date in structured_news articles...\n');
  
  const db = new Database(DB_PATH);
  
  // Get all structured_news records
  const records = db.prepare('SELECT pub_id, pub_date, data FROM structured_news ORDER BY pub_date').all() as StructuredNewsRecord[];
  
  let totalUpdated = 0;
  
  for (const record of records) {
    const data = JSON.parse(record.data);
    const pubDate = record.pub_date.split('T')[0]; // Extract YYYY-MM-DD
    
    let articlesUpdated = 0;
    
    // Set pub_date on each article
    data.articles.forEach((article: any) => {
      if (!article.pub_date || article.pub_date !== pubDate) {
        article.pub_date = pubDate;
        articlesUpdated++;
      }
    });
    
    if (articlesUpdated > 0) {
      // Update the record
      db.prepare('UPDATE structured_news SET data = ? WHERE pub_id = ?').run(
        JSON.stringify(data),
        record.pub_id
      );
      
      console.log(`✅ ${pubDate}: Updated ${articlesUpdated} articles`);
      totalUpdated += articlesUpdated;
    } else {
      console.log(`⏭️  ${pubDate}: All articles already have correct pub_date`);
    }
  }
  
  console.log(`\n✅ Total articles updated: ${totalUpdated}`);
  db.close();
}

main();
