#!/usr/bin/env npx tsx

/**
 * Delete Articles by Date - Clean up Step 3 data for re-running
 * 
 * This script deletes all articles and related data for a specific date,
 * allowing you to re-run Step 3 (insert-articles) and Step 4 (check-duplicates)
 * 
 * Usage:
 *   npx tsx delete-articles-by-date.ts --date 2025-10-08
 *   npx tsx delete-articles-by-date.ts --date 2025-10-08 --force  # Skip confirmation
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

if (!date) {
  console.error('❌ Error: --date argument is required')
  console.error('   Usage: npx tsx delete-articles-by-date.ts --date 2025-10-08')
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

function getArticleCountsForDate(db: Database.Database, targetDate: string): TableCount[] {
  const tables = [
    { table: 'articles', query: `SELECT COUNT(*) as count FROM articles WHERE DATE(created_at) = ?` },
    { table: 'article_cves', query: `SELECT COUNT(*) as count FROM article_cves WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_entities', query: `SELECT COUNT(*) as count FROM article_entities WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_tags', query: `SELECT COUNT(*) as count FROM article_tags WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_sources', query: `SELECT COUNT(*) as count FROM article_sources WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_events', query: `SELECT COUNT(*) as count FROM article_events WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_mitre_techniques', query: `SELECT COUNT(*) as count FROM article_mitre_techniques WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'article_impact_scope', query: `SELECT COUNT(*) as count FROM article_impact_scope WHERE article_id IN (SELECT id FROM articles WHERE DATE(created_at) = ?)` },
    { table: 'publications', query: `SELECT COUNT(*) as count FROM publications WHERE pub_date = ?` },
  ]
  
  return tables.map(({ table, query }) => {
    try {
      const result = db.prepare(query).get(targetDate) as { count: number }
      return { table, count: result.count }
    } catch (error) {
      return { table, count: 0 }
    }
  })
}

function deleteArticlesForDate(db: Database.Database, targetDate: string): void {
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
      'article_impact_scope',
      'article_updates',
      'article_update_sources',
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
    
    // Delete publication for this date
    try {
      const pubDeleted = db.prepare('DELETE FROM publications WHERE pub_date = ?').run(targetDate)
      if (pubDeleted.changes > 0) {
        console.log(`   ✅ Deleted ${pubDeleted.changes} publication(s)`)
      }
    } catch (error) {
      // Publications table might not exist
    }
  })
  
  transaction()
}

async function main() {
  console.log('🗑️  Delete Articles by Date\n')
  console.log('=' .repeat(60))
  console.log(`\n📅 Target Date: ${date}\n`)
  
  // TypeScript safety: date is guaranteed to be string after validation above
  const targetDate: string = date!
  
  // Open database
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  
  // Show what will be deleted
  console.log('📊 DATA TO BE DELETED:\n')
  const counts = getArticleCountsForDate(db, targetDate)
  
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
  console.log('   You can re-run Step 3 and 4 after deletion.\n')
  
  if (force) {
    console.log('🔧 Force mode enabled, skipping confirmation...\n')
    deleteArticlesForDate(db, targetDate)
    console.log('\n✅ Deletion complete!\n')
    console.log('🎯 NEXT STEPS:\n')
    console.log(`   1. Run Step 3: npx tsx scripts/content-generation-v2/insert-articles.ts --date ${targetDate}`)
    console.log(`   2. Run Step 4: npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date ${targetDate}\n`)
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
    
    deleteArticlesForDate(db, targetDate)
    
    console.log('\n✅ Deletion complete!\n')
    console.log('🎯 NEXT STEPS:\n')
    console.log(`   1. Run Step 3: npx tsx scripts/content-generation-v2/insert-articles.ts --date ${targetDate}`)
    console.log(`   2. Run Step 4: npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date ${targetDate}\n`)
    
    rl.close()
    db.close()
  })
}

main()
