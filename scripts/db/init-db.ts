#!/usr/bin/env tsx
/**
 * Database Initialization Script
 * 
 * Purpose: Initialize SQLite database with schema and verify setup
 * Usage: tsx scripts/db/init-db.ts
 */

import { 
  initDatabase, 
  initSchema, 
  isDatabaseInitialized,
  getDatabaseStats,
  closeDatabase 
} from '../content-generation/lib/db-client'

async function main() {
  console.log('🔧 Initializing CyberSec Content Database...\n')

  try {
    // Step 1: Initialize database connection
    console.log('📁 Opening database connection...')
    const db = initDatabase()
    console.log('✅ Database connection established')
    console.log(`   Location: logs/content-generation.db\n`)

    // Step 2: Check if already initialized
    const isInitialized = isDatabaseInitialized(db)
    
    if (isInitialized) {
      console.log('⚠️  Database already initialized')
      console.log('   Tables already exist. Use --force to reinitialize.\n')
      
      // Show stats
      const stats = getDatabaseStats(db)
      console.log('📊 Current Database Stats:')
      console.log(`   Articles: ${stats.articles}`)
      console.log(`   Entities: ${stats.entities}`)
      console.log(`   CVEs: ${stats.cves}`)
      console.log(`   MITRE Techniques: ${stats.mitre_techniques}`)
      console.log(`   Publications: ${stats.publications}`)
      console.log(`   Pipeline Runs: ${stats.pipeline_runs}\n`)
      
      closeDatabase(db)
      return
    }

    // Step 3: Initialize schema
    console.log('🏗️  Creating database schema...')
    initSchema(db)
    console.log('✅ Schema created successfully\n')

    // Step 4: Verify tables created
    console.log('🔍 Verifying database structure...')
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all()

    console.log(`✅ Created ${tables.length} tables:`)
    tables.forEach((table) => {
      console.log(`   - ${table.name}`)
    })
    console.log()

    // Step 5: Verify indexes created
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()

    console.log(`✅ Created ${indexes.length} indexes:`)
    indexes.forEach((index) => {
      console.log(`   - ${index.name}`)
    })
    console.log()

    // Step 6: Show stats
    const stats = getDatabaseStats(db)
    console.log('📊 Initial Database Stats:')
    console.log(`   Articles: ${stats.articles}`)
    console.log(`   Entities: ${stats.entities}`)
    console.log(`   CVEs: ${stats.cves}`)
    console.log(`   MITRE Techniques: ${stats.mitre_techniques}`)
    console.log(`   Publications: ${stats.publications}`)
    console.log(`   Pipeline Runs: ${stats.pipeline_runs}\n`)

    // Step 7: Close connection
    closeDatabase(db)
    
    console.log('✅ Database initialization complete!')
    console.log('   Ready to use for content pipeline.\n')

  } catch (error) {
    console.error('❌ Database initialization failed:')
    console.error(error)
    process.exit(1)
  }
}

// Run initialization
main()
