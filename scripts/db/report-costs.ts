#!/usr/bin/env tsx
/**
 * Cost Reporting Script
 * 
 * Purpose: Generate cost reports from the database
 * Usage: tsx scripts/db/report-costs.ts [--days 7] [--run-id 1]
 */

import { 
  initDatabase, 
  getCostSummary,
  getAPICallsForRun,
  closeDatabase 
} from '../content-generation/lib/db-client'

interface CostReportOptions {
  days?: number
  runId?: number
}

function parseArgs(): CostReportOptions {
  const args = process.argv.slice(2)
  const options: CostReportOptions = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
      options.days = parseInt(args[i + 1]!)
      i++
    } else if (args[i] === '--run-id' && args[i + 1]) {
      options.runId = parseInt(args[i + 1]!)
      i++
    }
  }

  return options
}

async function main() {
  const options = parseArgs()
  
  console.log('💰 CyberSec Content Pipeline - Cost Report\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const db = initDatabase()

  try {
    // Report 1: Overall Summary
    if (!options.runId) {
      console.log('📊 Overall Cost Summary')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      const days = options.days || 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().split('T')[0]
      
      const summary = getCostSummary(db, startDateStr)
      
      if (summary && summary.total_calls > 0) {
        console.log(`Period: Last ${days} days (since ${startDateStr})`)
        console.log(`Total API Calls: ${summary.total_calls.toLocaleString()}`)
        console.log(`Total Input Tokens: ${(summary.total_input_tokens || 0).toLocaleString()}`)
        console.log(`Total Output Tokens: ${(summary.total_output_tokens || 0).toLocaleString()}`)
        console.log(`Total Tokens: ${(summary.total_tokens || 0).toLocaleString()}`)
        console.log(`Total Cost: $${(summary.total_cost || 0).toFixed(4)}`)
        console.log(`Average Cost per Call: $${(summary.avg_cost_per_call || 0).toFixed(6)}`)
      } else {
        console.log(`No API calls found in the last ${days} days`)
      }
      console.log()
    }

    // Report 2: Cost by Provider
    if (!options.runId) {
      console.log('📊 Cost by API Provider')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      const byProvider = db.prepare(`
        SELECT * FROM v_cost_by_provider
      `).all()
      
      if (byProvider.length > 0) {
        console.log('Provider'.padEnd(20) + 'Calls'.padEnd(10) + 'Tokens'.padEnd(15) + 'Total Cost'.padEnd(15) + 'Avg/Call')
        console.log('─'.repeat(75))
        
        byProvider.forEach((row: any) => {
          console.log(
            row.api_provider.padEnd(20) +
            row.call_count.toString().padEnd(10) +
            (row.total_tokens || 0).toLocaleString().padEnd(15) +
            `$${(row.total_cost || 0).toFixed(4)}`.padEnd(15) +
            `$${(row.avg_cost_per_call || 0).toFixed(6)}`
          )
        })
      } else {
        console.log('No data available')
      }
      console.log()
    }

    // Report 3: Cost by Model
    if (!options.runId) {
      console.log('📊 Cost by Model')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      const byModel = db.prepare(`
        SELECT * FROM v_cost_by_model
      `).all()
      
      if (byModel.length > 0) {
        console.log('Model'.padEnd(30) + 'Calls'.padEnd(10) + 'Tokens'.padEnd(15) + 'Total Cost'.padEnd(15) + 'Avg/Call')
        console.log('─'.repeat(80))
        
        byModel.forEach((row: any) => {
          console.log(
            row.model_name.padEnd(30) +
            row.call_count.toString().padEnd(10) +
            (row.total_tokens || 0).toLocaleString().padEnd(15) +
            `$${(row.total_cost || 0).toFixed(4)}`.padEnd(15) +
            `$${(row.avg_cost_per_call || 0).toFixed(6)}`
          )
        })
      } else {
        console.log('No data available')
      }
      console.log()
    }

    // Report 4: Cost by Operation
    if (!options.runId) {
      console.log('📊 Cost by Operation Type')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      const byOperation = db.prepare(`
        SELECT * FROM v_cost_by_operation
      `).all()
      
      if (byOperation.length > 0) {
        console.log('Operation'.padEnd(25) + 'Calls'.padEnd(10) + 'Tokens'.padEnd(15) + 'Total Cost'.padEnd(15) + 'Avg/Call')
        console.log('─'.repeat(75))
        
        byOperation.forEach((row: any) => {
          console.log(
            row.operation.padEnd(25) +
            row.call_count.toString().padEnd(10) +
            (row.total_tokens || 0).toLocaleString().padEnd(15) +
            `$${(row.total_cost || 0).toFixed(4)}`.padEnd(15) +
            `$${(row.avg_cost_per_call || 0).toFixed(6)}`
          )
        })
      } else {
        console.log('No data available')
      }
      console.log()
    }

    // Report 5: Recent Pipeline Runs
    if (!options.runId) {
      console.log('📊 Recent Pipeline Runs')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      const recentRuns = db.prepare(`
        SELECT * FROM v_cost_by_run 
        ORDER BY started_at DESC 
        LIMIT 10
      `).all()
      
      if (recentRuns.length > 0) {
        console.log('Run ID'.padEnd(10) + 'Type'.padEnd(12) + 'Status'.padEnd(12) + 'Articles'.padEnd(10) + 'Cost'.padEnd(12) + '$/Article')
        console.log('─'.repeat(70))
        
        recentRuns.forEach((row: any) => {
          const costPerArticle = row.cost_per_article ? `$${row.cost_per_article}` : 'N/A'
          console.log(
            row.run_id.toString().padEnd(10) +
            row.run_type.padEnd(12) +
            row.status.padEnd(12) +
            row.articles_generated.toString().padEnd(10) +
            `$${(row.total_cost || 0).toFixed(4)}`.padEnd(12) +
            costPerArticle
          )
        })
      } else {
        console.log('No pipeline runs found')
      }
      console.log()
    }

    // Report 6: Specific Run Details
    if (options.runId) {
      console.log(`📊 API Calls for Run #${options.runId}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      const apiCalls = getAPICallsForRun(db, options.runId)
      
      if (apiCalls.length > 0) {
        console.log('#'.padEnd(5) + 'Provider'.padEnd(20) + 'Operation'.padEnd(25) + 'Status'.padEnd(10) + 'Tokens'.padEnd(12) + 'Cost')
        console.log('─'.repeat(80))
        
        apiCalls.forEach((call: any, index: number) => {
          console.log(
            (index + 1).toString().padEnd(5) +
            call.api_provider.padEnd(20) +
            call.operation.padEnd(25) +
            call.status.padEnd(10) +
            (call.tokens_total || 0).toLocaleString().padEnd(12) +
            `$${(call.cost_usd || 0).toFixed(6)}`
          )
        })
        
        const totalCost = apiCalls.reduce((sum: number, call: any) => sum + (call.cost_usd || 0), 0)
        const totalTokens = apiCalls.reduce((sum: number, call: any) => sum + (call.tokens_total || 0), 0)
        
        console.log('─'.repeat(80))
        console.log(`Total: ${apiCalls.length} calls, ${totalTokens.toLocaleString()} tokens, $${totalCost.toFixed(4)}`)
      } else {
        console.log(`No API calls found for run #${options.runId}`)
      }
      console.log()
    }

    // Report 7: Daily Costs
    if (!options.runId) {
      console.log('📊 Daily Cost Breakdown (Last 7 Days)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      const dailyCosts = db.prepare(`
        SELECT * FROM v_daily_costs 
        ORDER BY date DESC 
        LIMIT 7
      `).all()
      
      if (dailyCosts.length > 0) {
        console.log('Date'.padEnd(15) + 'Calls'.padEnd(10) + 'Runs'.padEnd(10) + 'Tokens'.padEnd(15) + 'Total Cost')
        console.log('─'.repeat(65))
        
        dailyCosts.forEach((row: any) => {
          console.log(
            row.date.padEnd(15) +
            row.total_calls.toString().padEnd(10) +
            row.pipeline_runs.toString().padEnd(10) +
            (row.total_tokens || 0).toLocaleString().padEnd(15) +
            `$${(row.total_cost || 0).toFixed(4)}`
          )
        })
      } else {
        console.log('No daily cost data available')
      }
      console.log()
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Cost report complete\n')

  } catch (error) {
    console.error('❌ Error generating cost report:')
    console.error(error)
    process.exit(1)
  } finally {
    closeDatabase(db)
  }
}

// Run report
main()
