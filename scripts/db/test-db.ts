#!/usr/bin/env tsx
/**
 * Database Test Script
 * 
 * Purpose: Test database operations and entity-based filtering
 * Usage: tsx scripts/db/test-db.ts
 */

import { 
  initDatabase,
  upsertArticle,
  upsertEntity,
  upsertCVE,
  upsertMITRETechnique,
  linkArticleToCVE,
  linkArticleToEntity,
  linkArticleToMITRE,
  findCandidateArticlesByEntities,
  getDatabaseStats,
  startPipelineRun,
  updatePipelineRun,
  getRecentPipelineRuns,
  closeDatabase,
  transaction
} from '../content-generation/lib/db-client'

async function main() {
  console.log('🧪 Testing CyberSec Content Database...\n')

  try {
    const db = initDatabase()

    // Test 1: Insert sample articles
    console.log('📝 Test 1: Inserting sample articles...')
    
    transaction(db, () => {
      // Article 1: Microsoft Exchange vulnerability
      upsertArticle(db, {
        article_id: 'article-2025-10-13-001',
        slug: 'microsoft-exchange-zero-day',
        headline: 'Critical Zero-Day in Microsoft Exchange',
        title: 'Microsoft Exchange Server Zero-Day Vulnerability Exploited in the Wild',
        summary: 'APT29 exploiting CVE-2025-1234 in Microsoft Exchange Server',
        category: 'vulnerabilities',
        severity: 'critical',
        fingerprint: 'abc123'
      })

      // Article 2: Related Exchange vulnerability
      upsertArticle(db, {
        article_id: 'article-2025-10-13-002',
        slug: 'exchange-patch-released',
        headline: 'Microsoft Releases Emergency Patch',
        title: 'Emergency Patch Released for Exchange Server',
        summary: 'Microsoft released emergency patch for CVE-2025-1234',
        category: 'vulnerabilities',
        severity: 'high',
        fingerprint: 'def456'
      })

      // Article 3: Different topic (Chrome)
      upsertArticle(db, {
        article_id: 'article-2025-10-13-003',
        slug: 'chrome-update',
        headline: 'Chrome Security Update',
        title: 'Google Chrome Security Update Addresses Multiple Vulnerabilities',
        summary: 'Google patches CVE-2025-5678 in Chrome browser',
        category: 'vulnerabilities',
        severity: 'medium',
        fingerprint: 'ghi789'
      })
    })
    
    console.log('✅ Inserted 3 articles\n')

    // Test 2: Insert entities and create relationships
    console.log('📝 Test 2: Inserting entities and relationships...')
    
    transaction(db, () => {
      // CVEs
      upsertCVE(db, { cve_id: 'CVE-2025-1234', cvss_score: 9.8, severity: 'critical', kev: 1 })
      upsertCVE(db, { cve_id: 'CVE-2025-5678', cvss_score: 7.5, severity: 'high', kev: 0 })

      // Entities
      const microsoftId = upsertEntity(db, { 
        entity_name: 'Microsoft', 
        entity_type: 'vendor',
        stix_type: 'identity'
      })
      
      const apt29Id = upsertEntity(db, { 
        entity_name: 'APT29', 
        entity_type: 'threat_actor',
        stix_type: 'threat-actor'
      })
      
      const exchangeId = upsertEntity(db, { 
        entity_name: 'Exchange Server', 
        entity_type: 'product',
        stix_type: 'identity'
      })

      const googleId = upsertEntity(db, { 
        entity_name: 'Google', 
        entity_type: 'vendor',
        stix_type: 'identity'
      })

      const chromeId = upsertEntity(db, { 
        entity_name: 'Chrome', 
        entity_type: 'product',
        stix_type: 'identity'
      })

      // MITRE techniques
      upsertMITRETechnique(db, {
        technique_id: 'T1059',
        technique_name: 'Command and Scripting Interpreter',
        tactic: 'Execution'
      })

      // Link Article 1 to entities
      linkArticleToCVE(db, 'article-2025-10-13-001', 'CVE-2025-1234')
      linkArticleToEntity(db, 'article-2025-10-13-001', microsoftId)
      linkArticleToEntity(db, 'article-2025-10-13-001', apt29Id)
      linkArticleToEntity(db, 'article-2025-10-13-001', exchangeId)
      linkArticleToMITRE(db, 'article-2025-10-13-001', 'T1059')

      // Link Article 2 to entities (shares CVE and Microsoft with Article 1)
      linkArticleToCVE(db, 'article-2025-10-13-002', 'CVE-2025-1234')
      linkArticleToEntity(db, 'article-2025-10-13-002', microsoftId)
      linkArticleToEntity(db, 'article-2025-10-13-002', exchangeId)

      // Link Article 3 to different entities
      linkArticleToCVE(db, 'article-2025-10-13-003', 'CVE-2025-5678')
      linkArticleToEntity(db, 'article-2025-10-13-003', googleId)
      linkArticleToEntity(db, 'article-2025-10-13-003', chromeId)
    })
    
    console.log('✅ Created entity relationships\n')

    // Test 3: Entity-based similarity filtering
    console.log('📝 Test 3: Testing entity-based filtering...\n')
    
    // Scenario 1: New article about Microsoft Exchange (should find Article 1 & 2)
    console.log('Scenario 1: New article shares CVE-2025-1234 and Microsoft')
    const candidates1 = findCandidateArticlesByEntities(
      db,
      ['CVE-2025-1234'],
      ['Microsoft', 'Exchange Server']
    )
    console.log(`   Found ${candidates1.length} candidate articles:`)
    candidates1.forEach(c => {
      console.log(`   - ${c.article_id}: "${c.headline}" (score: ${c.match_score})`)
    })
    console.log()

    // Scenario 2: New article about APT29 only (should find Article 1)
    console.log('Scenario 2: New article mentions APT29')
    const candidates2 = findCandidateArticlesByEntities(
      db,
      [],
      ['APT29']
    )
    console.log(`   Found ${candidates2.length} candidate articles:`)
    candidates2.forEach(c => {
      console.log(`   - ${c.article_id}: "${c.headline}" (score: ${c.match_score})`)
    })
    console.log()

    // Scenario 3: New article about Chrome (should find Article 3)
    console.log('Scenario 3: New article about Google Chrome')
    const candidates3 = findCandidateArticlesByEntities(
      db,
      ['CVE-2025-5678'],
      ['Google', 'Chrome']
    )
    console.log(`   Found ${candidates3.length} candidate articles:`)
    candidates3.forEach(c => {
      console.log(`   - ${c.article_id}: "${c.headline}" (score: ${c.match_score})`)
    })
    console.log()

    // Scenario 4: Completely new topic (should find nothing)
    console.log('Scenario 4: New article about unrelated topic (Cisco)')
    const candidates4 = findCandidateArticlesByEntities(
      db,
      ['CVE-2025-9999'],
      ['Cisco', 'IOS']
    )
    console.log(`   Found ${candidates4.length} candidate articles`)
    console.log()

    // Test 4: Pipeline run tracking
    console.log('📝 Test 4: Testing pipeline run tracking...')
    
    const runId = startPipelineRun(db, 'test')
    console.log(`   Started pipeline run: ${runId}`)
    
    updatePipelineRun(db, runId, {
      status: 'completed',
      articles_generated: 3,
      articles_new: 3,
      articles_updated: 0,
      articles_skipped: 0,
      tokens_input: 10000,
      tokens_output: 5000,
      cost_usd: 0.025
    })
    console.log('   Updated pipeline run status')
    
    const recentRuns = getRecentPipelineRuns(db, 5)
    console.log(`   Recent runs: ${recentRuns.length}`)
    console.log()

    // Test 5: Show final stats
    console.log('📊 Final Database Stats:')
    const stats = getDatabaseStats(db)
    console.log(`   Articles: ${stats.articles}`)
    console.log(`   Entities: ${stats.entities}`)
    console.log(`   CVEs: ${stats.cves}`)
    console.log(`   MITRE Techniques: ${stats.mitre_techniques}`)
    console.log(`   Publications: ${stats.publications}`)
    console.log(`   Pipeline Runs: ${stats.pipeline_runs}`)
    console.log()

    closeDatabase(db)
    
    console.log('✅ All tests passed!')
    console.log('\n🎉 Database is working correctly!')
    console.log('   Ready for Phase 2: Unified Publication Generation\n')

  } catch (error) {
    console.error('❌ Test failed:')
    console.error(error)
    process.exit(1)
  }
}

// Run tests
main()
