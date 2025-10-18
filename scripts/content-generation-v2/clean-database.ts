#!/usr/bin/env npx tsx

/**
 * Clean Database - Remove generated data with flexible cleanup options
 * 
 * Usage:
 *   npx tsx clean-database.ts                         # Default: Keep raw_search, api_calls, structured_news
 *   npx tsx clean-database.ts --clear-step2           # Also delete structured_news (Step 2)
 *   npx tsx clean-database.ts --delete-all            # Delete EVERYTHING including raw search data
 *   npx tsx clean-database.ts --date 2025-10-08       # Delete only data for specific date
 *   npx tsx clean-database.ts --force                 # Skip confirmation prompt
 * 
 * DEFAULT MODE (RECOMMENDED) PRESERVES:
 * - raw_search (Step 1 data)
 * - structured_news (Step 2 output)
 * - api_calls (cost tracking)
 * 
 * DEFAULT MODE CLEARS:
 * - articles (Step 3 output)
 * - publications (Step 5 output)
 * - published_articles (Step 5 linking table)
 * - publication_articles (Step 5 linking table)
 * - pipeline_execution_log
 * 
 * --clear-step2 MODE:
 * - Same as default but also deletes structured_news
 * - Preserves raw_search and api_calls
 * - Use when you want to regenerate Step 2 output with new logic
 * 
 * --delete-all MODE (NUCLEAR OPTION):
 * - Deletes EVERYTHING except api_calls
 * - Use when starting completely fresh
 * 
 * --date MODE (SURGICAL DELETE):
 * - Deletes articles and related data for specific date only
 * - Preserves everything for other dates
 * - Always preserves raw_search, structured_news, api_calls
 */

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as readline from 'readline'
import { Command } from 'commander'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '../..')

const DB_PATH = join(rootDir, 'logs/content-generation-v2.db')

// Parse command line args with Commander
const program = new Command()
program
  .name('clean-database')
  .description('Clean database with flexible cleanup options')
  .option('--delete-all', 'Delete EVERYTHING including raw search data (preserves api_calls only)')
  .option('--clear-step2', 'Also delete structured_news (Step 2 data)')
  .option('--date <date>', 'Delete only data for specific date (YYYY-MM-DD)')
  .option('--force', 'Skip confirmation prompt')
  .parse(process.argv)

const options = program.opts()
const deleteAll = options.deleteAll || false
const clearStep2 = options.clearStep2 || false
const targetDate = options.date || null
const force = options.force || false

// Validate date format if provided
if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
  console.error('❌ Error: Invalid date format. Use --date YYYY-MM-DD')
  process.exit(1)
}

interface TableStats {
  name: string
  count: number
}

function getTableCounts(db: Database.Database): TableStats[] {
  const tables = [
    'raw_search',
    'structured_news', 
    'articles',
    'article_cves',
    'article_cyber_observables',
    'article_d3fend_countermeasures',
    'article_entities',
    'article_events',
    'article_impact_scope',
    'article_iocs',
    'article_mitre_techniques',
    'article_mitre_mitigations',
    'article_resolutions',
    'article_sources',
    'article_tags',
    'article_update_sources',
    'article_updates',
    'articles_meta',
    'publications',
    'published_articles',
    'publication_articles',
    'pipeline_execution_log',
    'api_calls'
  ]
  
  return tables.map(table => {
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }
      return { name: table, count: result.count }
    } catch (error) {
      return { name: table, count: 0 }
    }
  })
}

function main() {
  console.log('🗑️  Database Cleanup Tool\n')
  console.log('=' .repeat(60))
  
  if (deleteAll) {
    console.log('\n🔧 Mode: DELETE ALL (Nuclear Option - deletes raw_search & structured_news)')
  } else if (targetDate) {
    console.log(`\n🔧 Mode: Delete Single Date (${targetDate})`)
  } else if (clearStep2) {
    console.log('\n🔧 Mode: Clear Step 2+ (preserves raw_search, api_calls)')
  } else {
    console.log('\n🔧 Mode: Standard Cleanup (preserves raw_search, structured_news, api_calls)')
  }
  
  // Open database
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  
  // Show current state
  console.log('\n📊 CURRENT DATABASE STATE:\n')
  const beforeStats = getTableCounts(db)
  
  // Define which tables to preserve based on mode
  const preservedTables = new Set<string>()
  
  if (deleteAll) {
    preservedTables.add('api_calls')
  } else if (clearStep2) {
    preservedTables.add('raw_search')
    preservedTables.add('api_calls')
  } else {
    preservedTables.add('raw_search')
    preservedTables.add('structured_news')
    preservedTables.add('api_calls')
  }
  
  beforeStats.forEach(stat => {
    const preserve = preservedTables.has(stat.name)
    const emoji = preserve ? '✅' : '🗑️ '
    const label = preserve ? '(PRESERVE)' : targetDate ? `(CLEAR ${targetDate})` : '(CLEAR)'
    console.log(`   ${emoji} ${stat.name.padEnd(35)} ${stat.count.toString().padStart(6)} rows ${label}`)
  })
  
  console.log('\n' + '='.repeat(60))
  console.log('\n⚠️  WARNING: This will DELETE data!')
  if (deleteAll) {
    console.log('   Preserved: api_calls only')
    console.log('   Cleared: EVERYTHING (raw_search, structured_news, articles, publications, etc.)')
  } else if (targetDate) {
    console.log('   Preserved: raw_search, structured_news, api_calls')
    console.log(`   Cleared: Articles and publications for ${targetDate} only`)
  } else if (clearStep2) {
    console.log('   Preserved: raw_search, api_calls')
    console.log('   Cleared: structured_news, articles, publications, pipeline_execution_log')
  } else {
    console.log('   Preserved: raw_search, structured_news, api_calls')
    console.log('   Cleared: articles, publications, pipeline_execution_log')
  }
  console.log('')
  
  // Skip confirmation if --force flag is set
  if (force) {
    console.log('⚡ Force mode: Skipping confirmation\n')
    performCleanup(db)
    return
  }
  
  // Confirmation prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  rl.question('Type "YES" to confirm cleanup: ', (answer: string) => {
    if (answer.trim().toUpperCase() !== 'YES') {
      console.log('\n❌ Cleanup cancelled.\n')
      rl.close()
      db.close()
      process.exit(0)
    }
    
    console.log('\n🧹 Starting cleanup...\n')
    performCleanup(db)
    rl.close()
  })
}

function performCleanup(db: Database.Database) {
    
    // Begin transaction
    const transaction = db.transaction(() => {
      if (targetDate) {
        // DATE-SPECIFIC CLEANUP: Delete only articles for specific date
        console.log(`   Deleting articles for ${targetDate}...`)
        
        // Get article IDs for this date
        const articleIds = db.prepare(`
          SELECT id FROM articles WHERE date(created_at) = ?
        `).all(targetDate).map((row: any) => row.id)
        
        if (articleIds.length === 0) {
          console.log(`   ⚠️  No articles found for ${targetDate}`)
          return
        }
        
        console.log(`   Found ${articleIds.length} articles to delete`)
        const placeholders = articleIds.map(() => '?').join(',')
        
        // Delete related data
        console.log('   Clearing article_cves...')
        try { db.prepare(`DELETE FROM article_cves WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_cyber_observables...')
        try { db.prepare(`DELETE FROM article_cyber_observables WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_d3fend_countermeasures...')
        try { db.prepare(`DELETE FROM article_d3fend_countermeasures WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_entities...')
        try { db.prepare(`DELETE FROM article_entities WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_tags...')
        try { db.prepare(`DELETE FROM article_tags WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_sources...')
        try { db.prepare(`DELETE FROM article_sources WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_events...')
        try { db.prepare(`DELETE FROM article_events WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_iocs...')
        try { db.prepare(`DELETE FROM article_iocs WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_mitre_techniques...')
        try { db.prepare(`DELETE FROM article_mitre_techniques WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_mitre_mitigations...')
        try { db.prepare(`DELETE FROM article_mitre_mitigations WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_impact_scope...')
        try { db.prepare(`DELETE FROM article_impact_scope WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_updates...')
        try { db.prepare(`DELETE FROM article_updates WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_update_sources...')
        try { db.prepare(`DELETE FROM article_update_sources WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing article_resolutions...')
        try { db.prepare(`DELETE FROM article_resolutions WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing articles_meta...')
        try { db.prepare(`DELETE FROM articles_meta WHERE article_id IN (${placeholders})`).run(...articleIds) } catch (e) {}
        
        console.log('   Clearing articles...')
        db.prepare(`DELETE FROM articles WHERE id IN (${placeholders})`).run(...articleIds)
        db.prepare(`DELETE FROM articles_fts WHERE rowid IN (SELECT rowid FROM articles_fts WHERE id IN (${placeholders}))`).run(...articleIds)
        
        // Delete publications for this date
        console.log('   Clearing publications...')
        db.prepare('DELETE FROM publication_articles WHERE publication_id IN (SELECT id FROM publications WHERE date(pub_date) = ?)').run(targetDate)
        db.prepare('DELETE FROM published_articles WHERE publication_id IN (SELECT id FROM publications WHERE date(pub_date) = ?)').run(targetDate)
        db.prepare('DELETE FROM publications WHERE date(pub_date) = ?').run(targetDate)
        
      } else {
        // FULL CLEANUP: Clear all generated data
        console.log('   Clearing publication_articles...')
        db.prepare('DELETE FROM publication_articles').run()
        
        console.log('   Clearing published_articles...')
        db.prepare('DELETE FROM published_articles').run()
        
        console.log('   Clearing publications...')
        db.prepare('DELETE FROM publications').run()
        
        // Clear all article-related tables (foreign keys reference articles)
        console.log('   Clearing article_cves...')
        try { db.prepare('DELETE FROM article_cves').run() } catch (e) {}
        
        console.log('   Clearing article_cyber_observables...')
        try { db.prepare('DELETE FROM article_cyber_observables').run() } catch (e) {}
        
        console.log('   Clearing article_d3fend_countermeasures...')
        try { db.prepare('DELETE FROM article_d3fend_countermeasures').run() } catch (e) {}
        
        console.log('   Clearing article_entities...')
        try { db.prepare('DELETE FROM article_entities').run() } catch (e) {}
        
        console.log('   Clearing article_tags...')
        try { db.prepare('DELETE FROM article_tags').run() } catch (e) {}
        
        console.log('   Clearing article_sources...')
        try { db.prepare('DELETE FROM article_sources').run() } catch (e) {}
        
        console.log('   Clearing article_events...')
        try { db.prepare('DELETE FROM article_events').run() } catch (e) {}
        
        console.log('   Clearing article_iocs...')
        try { db.prepare('DELETE FROM article_iocs').run() } catch (e) {}
        
        console.log('   Clearing article_mitre_techniques...')
        try { db.prepare('DELETE FROM article_mitre_techniques').run() } catch (e) {}
        
        console.log('   Clearing article_mitre_mitigations...')
        try { db.prepare('DELETE FROM article_mitre_mitigations').run() } catch (e) {}
        
        console.log('   Clearing article_impact_scope...')
        try { db.prepare('DELETE FROM article_impact_scope').run() } catch (e) {}
        
        console.log('   Clearing article_updates...')
        try { db.prepare('DELETE FROM article_updates').run() } catch (e) {}
        
        console.log('   Clearing article_update_sources...')
        try { db.prepare('DELETE FROM article_update_sources').run() } catch (e) {}
        
        console.log('   Clearing article_resolutions...')
        try { db.prepare('DELETE FROM article_resolutions').run() } catch (e) {}
        
        console.log('   Clearing articles_meta...')
        try { db.prepare('DELETE FROM articles_meta').run() } catch (e) {}
        
        // Clear pipeline execution log
        console.log('   Clearing pipeline_execution_log...')
        try { db.prepare('DELETE FROM pipeline_execution_log').run() } catch (e) {}
        
        // Clear articles (and FTS5 index)
        console.log('   Clearing articles...')
        db.prepare('DELETE FROM articles').run()
        db.prepare('DELETE FROM articles_fts').run()
        
        // Clear structured_news and raw_search based on mode
        if (deleteAll) {
          console.log('   Clearing structured_news...')
          db.prepare('DELETE FROM structured_news').run()
          
          console.log('   Clearing raw_search...')
          db.prepare('DELETE FROM raw_search').run()
        } else if (clearStep2) {
          console.log('   Clearing structured_news...')
          db.prepare('DELETE FROM structured_news').run()
        }
      }
    })
    
    try {
      transaction()
      console.log('\n✅ Cleanup complete!\n')
      
      // Show after state
      console.log('📊 FINAL DATABASE STATE:\n')
      const afterStats = getTableCounts(db)
      afterStats.forEach(stat => {
        const emoji = stat.count > 0 ? '✅' : '⚪'
        console.log(`   ${emoji} ${stat.name.padEnd(25)} ${stat.count.toString().padStart(6)} rows`)
      })
      
      console.log('\n' + '='.repeat(60))
      console.log('\n🎯 NEXT STEPS:\n')
      if (targetDate) {
        console.log(`   Re-run pipeline for ${targetDate}:`)
        console.log(`   1. Step 3: npx tsx scripts/content-generation-v2/insert-articles.ts --date ${targetDate}`)
        console.log(`   2. Step 4: npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date ${targetDate}`)
        console.log(`   3. Step 5: npx tsx scripts/content-generation-v2/generate-publication.ts --date ${targetDate}`)
        console.log(`   4. Step 6: Re-export JSON for this date\n`)
      } else if (deleteAll) {
        console.log('   Start from Step 1:')
        console.log('   1. Run Step 1: npx tsx scripts/content-generation-v2/search-news.ts --date 2025-10-15')
        console.log('   2. Run Step 2: npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-15 --logtodb')
        console.log('   3. Continue with Steps 3-7\n')
      } else if (clearStep2) {
        console.log('   Start from Step 2:')
        console.log('   1. Run Step 2: npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-15 --logtodb')
        console.log('   2. Run Step 3: npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-15')
        console.log('   3. Continue with Steps 4-7\n')
      } else {
        console.log('   Process day-by-day starting with oldest date:')
        console.log('   1. Run Step 3: npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-07')
        console.log('   2. Run Step 4: npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-07')
        console.log('   3. Run Step 5: npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-07')
        console.log('   4. Repeat for next day (2025-10-08), etc.\n')
      }
      
    } catch (error) {
      console.error('\n❌ Error during cleanup:', error)
      throw error
    } finally {
      db.close()
    }
}

main()
