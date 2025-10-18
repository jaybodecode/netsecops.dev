#!/usr/bin/env npx tsx

/**
 * Delete Articles by Date - Clean up Step 3 data for re-running
 * 
 * This script deletes all articles and related data for a specific date,
 * allowing you to re-run Step 3 (insert-articles) and Step 4 (check-duplicates)
 * 
 * DEFAULT BEHAVIOR:
 * - Preserves: raw_search (Step 1 - expensive search data)
 * - Preserves: structured_news (Step 2 - expensive LLM processing)
 * - Deletes: articles + all related tables (Step 3 data)
 * - Deletes: publications (Step 5 data)
 * 
 * Usage:
 *   npx tsx delete-articles-by-date.ts --date 2025-10-08
 *   npx tsx delete-articles-by-date.ts --date 2025-10-08 --force            # Skip confirmation
 *   npx tsx delete-articles-by-date.ts --date 2025-10-08 --include-step2    # Also delete structured_news
 * 
 * WHY PRESERVE structured_news BY DEFAULT?
 * - Step 1 (raw_search) + Step 2 (structured_news) are expensive (Vertex AI costs)
 * - Step 3 (articles) is cheap to regenerate from Step 2 data
 * - Use --include-step2 only when schema changes require regenerating Step 2
 */

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '../..')

const DB_PATH = join(rootDir, 'logs/content-generation-v2.db')

// Parse command line args
const args = process.argv.slice(2)
const dateArg = args.find(arg => arg.startsWith('--date='))?.split('=')[1]
const dateIndex = args.indexOf('--date')
const date = dateArg || (dateIndex >= 0 ? args[dateIndex + 1] : null)
const force = args.includes('--force')
const includeStep2 = args.includes('--include-step2')

if (!date) {
  console.error('❌ Error: --date argument is required')
  console.error('   Usage: npx tsx delete-articles-by-date.ts --date 2025-10-08')
  console.error('   Options:')
  console.error('     --force          Skip confirmation prompt')
  console.error('     --include-step2  Also delete structured_news (Step 2 data)')
  process.exit(1)
}

// Validate date format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
if (!dateRegex.test(date)) {
  console.error(`❌ Error: Invalid date format "${date}"`)
  console.error('   Expected format: YYYY-MM-DD (e.g., 2025-10-08)')
  process.exit(1)
}

interface TableCount {
  table: string
  count: number
}

function getArticleCountsForDate(db: Database.Database, targetDate: string, includeStep2: boolean): TableCount[] {
  const tables = [
    { table: 'articles', query: `SELECT COUNT(*) as count FROM articles WHERE DATE(created_at) = ?` },
    { table: 'article_cves', query: `SELECT COUNT(*) as count FROM article_cves WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_entities', query: `SELECT COUNT(*) as count FROM article_entities WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_tags', query: `SELECT COUNT(*) as count FROM article_tags WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_sources', query: `SELECT COUNT(*) as count FROM article_sources WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_events', query: `SELECT COUNT(*) as count FROM article_events WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_mitre_techniques', query: `SELECT COUNT(*) as count FROM article_mitre_techniques WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_mitre_mitigations', query: `SELECT COUNT(*) as count FROM article_mitre_mitigations WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_impact_scope', query: `SELECT COUNT(*) as count FROM article_impact_scope WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_iocs', query: `SELECT COUNT(*) as count FROM article_iocs WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_cyber_observables', query: `SELECT COUNT(*) as count FROM article_cyber_observables WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_d3fend_countermeasures', query: `SELECT COUNT(*) as count FROM article_d3fend_countermeasures WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_updates', query: `SELECT COUNT(*) as count FROM article_updates WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_update_sources', query: `SELECT COUNT(*) as count FROM article_update_sources WHERE update_id IN (SELECT id FROM article_updates WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?))` },
    { table: 'article_resolutions', query: `SELECT COUNT(*) as count FROM article_resolutions WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'articles_meta', query: `SELECT COUNT(*) as count FROM articles_meta WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'publications', query: `SELECT COUNT(*) as count FROM publications WHERE pub_date = ?` },
    { table: 'publication_articles', query: `SELECT COUNT(*) as count FROM publication_articles WHERE publication_id IN (SELECT id FROM publications WHERE pub_date = ?)` },
    { table: 'published_articles', query: `SELECT COUNT(*) as count FROM published_articles WHERE publication_id IN (SELECT id FROM publications WHERE pub_date = ?)` },
  ]
  
  // Add structured_news to the list if --include-step2 is specified
  if (includeStep2) {
    tables.push({ table: 'structured_news', query: `SELECT COUNT(*) as count FROM structured_news WHERE DATE(pub_date) = ?` })
  }
  
  return tables.map(({ table, query }) => {
    try {
      const result = db.prepare(query).get(targetDate) as { count: number }
      return { table, count: result.count }
    } catch (error) {
      return { table, count: 0 }
    }
  })
}

function deleteArticlesForDate(db: Database.Database, targetDate: string, includeStep2: boolean): void {
  console.log('\n🗑️  Starting deletion...\n')
  
  const transaction = db.transaction(() => {
    // Get article IDs for this date
    const articleIds = db.prepare(`
      SELECT id FROM articles WHERE DATE(created_at) = ?
    `).all(targetDate).map((row: any) => row.id)
    
    if (articleIds.length === 0) {
      console.log('   ⚠️  No articles found for this date')
      return
    }
    
    console.log(`   Found ${articleIds.length} article(s) to delete`)
    
    // Delete from related tables (foreign key constraints)
    const tables = [
      'article_cves',
      'article_entities',
      'article_tags',
      'article_sources',
      'article_events',
      'article_mitre_techniques',
      'article_mitre_mitigations',
      'article_impact_scope',
      'article_iocs',
      'article_cyber_observables',
      'article_d3fend_countermeasures',
      'article_updates',
      'article_resolutions',
      'articles_meta',
    ]
    
    for (const table of tables) {
      try {
        const placeholders = articleIds.map(() => '?').join(',')
        const deleted = db.prepare(`DELETE FROM ${table} WHERE article_id IN (${placeholders})`).run(...articleIds)
        if (deleted.changes > 0) {
          console.log(`   ✅ Deleted ${deleted.changes} rows from ${table}`)
        }
      } catch (error) {
        // Table might not exist, skip
      }
    }
    
    // Delete article_update_sources (joins to article_updates, not articles directly)
    try {
      // First get update IDs for this date's articles
      const updateIds = db.prepare(`
        SELECT id FROM article_updates WHERE article_id IN (${articleIds.map(() => '?').join(',')})
      `).all(...articleIds).map((row: any) => row.id)
      
      if (updateIds.length > 0) {
        const updatePlaceholders = updateIds.map(() => '?').join(',')
        const deleted = db.prepare(`DELETE FROM article_update_sources WHERE update_id IN (${updatePlaceholders})`).run(...updateIds)
        if (deleted.changes > 0) {
          console.log(`   ✅ Deleted ${deleted.changes} rows from article_update_sources`)
        }
      }
    } catch (error) {
      // Table might not exist, skip
    }
    
    // Delete from FTS5 index
    console.log('   Clearing FTS5 index...')
    for (const articleId of articleIds) {
      try {
        db.prepare('DELETE FROM articles_fts WHERE article_id = ?').run(articleId)
      } catch (error) {
        // FTS5 table might not exist
      }
    }
    
    // Delete articles
    const articlePlaceholders = articleIds.map(() => '?').join(',')
    const articlesDeleted = db.prepare(`DELETE FROM articles WHERE id IN (${articlePlaceholders})`).run(...articleIds)
    console.log(`   ✅ Deleted ${articlesDeleted.changes} article(s)`)
    
    // Delete publication-related data for this date
    try {
      // Get publication ID(s) for this date
      const pubs = db.prepare('SELECT id FROM publications WHERE pub_date = ?').all(targetDate)
      
      for (const pub of pubs as any[]) {
        // Delete from publication_articles first (FK constraint)
        const pubArticlesDeleted = db.prepare('DELETE FROM publication_articles WHERE publication_id = ?').run(pub.id)
        if (pubArticlesDeleted.changes > 0) {
          console.log(`   ✅ Deleted ${pubArticlesDeleted.changes} rows from publication_articles`)
        }
        
        // Delete from published_articles (FK constraint)
        const publishedArticlesDeleted = db.prepare('DELETE FROM published_articles WHERE publication_id = ?').run(pub.id)
        if (publishedArticlesDeleted.changes > 0) {
          console.log(`   ✅ Deleted ${publishedArticlesDeleted.changes} rows from published_articles`)
        }
      }
      
      // Now delete the publication(s) itself
      const pubDeleted = db.prepare('DELETE FROM publications WHERE pub_date = ?').run(targetDate)
      if (pubDeleted.changes > 0) {
        console.log(`   ✅ Deleted ${pubDeleted.changes} publication(s)`)
      }
    } catch (error) {
      // Publications tables might not exist
    }
    
    // Delete structured_news only if --include-step2 flag is set
    if (includeStep2) {
      try {
        const structuredDeleted = db.prepare('DELETE FROM structured_news WHERE DATE(pub_date) = ?').run(targetDate)
        if (structuredDeleted.changes > 0) {
          console.log(`   ✅ Deleted ${structuredDeleted.changes} rows from structured_news (Step 2 data)`)
        }
      } catch (error) {
        // structured_news table might not exist
      }
    } else {
      console.log('   ⏭️  Preserving structured_news (Step 2 data) - use --include-step2 to delete')
    }
    
    // NOTE: raw_search is always preserved (contains original search results)
  })
  
  transaction()
}

async function main() {
  console.log('🗑️  Delete Articles by Date\n')
  console.log('=' .repeat(60))
  console.log(`\n📅 Target Date: ${date}\n`)
  
  if (includeStep2) {
    console.log('⚠️  Mode: DELETE STEP 2 + STEP 3 (includes structured_news)\n')
  } else {
    console.log('🔧 Mode: DELETE STEP 3 ONLY (preserves structured_news)\n')
  }
  
  // TypeScript safety: date is guaranteed to be string after validation above
  const targetDate: string = date!
  
  // Open database
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  
  // Show what will be deleted
  console.log('📊 DATA TO BE DELETED:\n')
  const counts = getArticleCountsForDate(db, targetDate, includeStep2)
  
  let hasData = false
  for (const { table, count } of counts) {
    if (count > 0) {
      hasData = true
      console.log(`   🗑️  ${table.padEnd(30)} ${count.toString().padStart(6)} rows`)
    }
  }
  
  if (!hasData) {
    console.log('   ✅ No data found for this date\n')
    db.close()
    process.exit(0)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n⚠️  WARNING: This will permanently delete all data for this date!')
  console.log('   You can re-run Step 3 and 4 after deletion.')
  if (!includeStep2) {
    console.log('   💡 TIP: Use --include-step2 to also delete structured_news (Step 2 data)')
  }
  console.log('')
  
  if (force) {
    console.log('🔧 Force mode enabled, skipping confirmation...\n')
    deleteArticlesForDate(db, targetDate, includeStep2)
    console.log('\n✅ Deletion complete!\n')
    console.log('🎯 NEXT STEPS:\n')
    if (includeStep2) {
      console.log(`   1. Run Step 2: npx tsx scripts/content-generation-v2/news-structured.ts --date ${targetDate} --logtodb`)
      console.log(`   2. Run Step 3: npx tsx scripts/content-generation-v2/insert-articles.ts --date ${targetDate}`)
      console.log(`   3. Run Step 4: npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date ${targetDate}\n`)
    } else {
      console.log(`   1. Run Step 3: npx tsx scripts/content-generation-v2/insert-articles.ts --date ${targetDate}`)
      console.log(`   2. Run Step 4: npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date ${targetDate}\n`)
    }
    db.close()
    return
  }
  
  // Confirmation prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  rl.question('Type "YES" to confirm deletion: ', (answer: string) => {
    if (answer.trim().toUpperCase() !== 'YES') {
      console.log('\n❌ Deletion cancelled.\n')
      rl.close()
      db.close()
      process.exit(0)
    }
    
    deleteArticlesForDate(db, targetDate, includeStep2)
    
    console.log('\n✅ Deletion complete!\n')
    console.log('🎯 NEXT STEPS:\n')
    if (includeStep2) {
      console.log(`   1. Run Step 2: npx tsx scripts/content-generation-v2/news-structured.ts --date ${targetDate} --logtodb`)
      console.log(`   2. Run Step 3: npx tsx scripts/content-generation-v2/insert-articles.ts --date ${targetDate}`)
      console.log(`   3. Run Step 4: npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date ${targetDate}\n`)
    } else {
      console.log(`   1. Run Step 3: npx tsx scripts/content-generation-v2/insert-articles.ts --date ${targetDate}`)
      console.log(`   2. Run Step 4: npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date ${targetDate}\n`)
    }
    
    rl.close()
    db.close()
  })
}

main()
