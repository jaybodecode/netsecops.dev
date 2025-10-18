/**
 * Content Generation V2 - Structured News Generator
 * 
 * Takes raw search results from database and generates structured JSON output
 * using Vertex AI with structured output mode.
 * 
 * Input: raw_search table (unstructured text from grounded search)
 * Output: Structured JSON files in tmp/ directory
 * Future: Will save to structured_news table (not yet created)
 */

import 'dotenv/config';
import { Command } from 'commander';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getRawSearch, saveStructuredNews } from './database/schema.js';
import { callVertex } from './ai/vertex.js';
import { CyberAdvisorySchema, type CyberAdvisoryType } from './news-structured-schema.js';

interface CLIOptions {
  date: string;
  logtodb: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('news-structured')
    .description('Generate structured JSON from raw search results')
    .requiredOption('--date <date>', 'Publication date in YYYY-MM-DD format (must exist in raw_search table)')
    .option('--logtodb', 'Save structured output to database (structured_news table)')
    .helpOption('-h, --help', 'Display help information')
    .addHelpText('after', `
Examples:
  npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-07
  npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-14 --logtodb

Input:
  Reads raw search text from raw_search table for specified date (9am CST = 15:00 UTC)
  
Output:
  - Structured JSON saved to tmp/news-structured_<date>_<timestamp>.json
  - Optionally saved to database if --logtodb flag is used
`)
    .parse(process.argv);
  
  const options = program.opts();
  
  return {
    date: options.date as string,
    logtodb: !!options.logtodb,
  };
}

/**
 * Build prompt for structured output generation
 */
function buildPrompt(rawText: string, pubDate: string): string {
  return `You are a cybersecurity analyst tasked with structuring raw news search results into a comprehensive publication.

RAW SEARCH RESULTS (from ${pubDate}):
${rawText}

INSTRUCTIONS:
1. Analyze the raw search results above
2. Extract and structure ALL articles mentioned
3. For each article, provide:
   - Create a URL-friendly slug from the title
   - Write a compelling headline and title
   - Create a comprehensive summary
   - Generate a full Markdown threat report with sections:
     * Executive Summary
     * Threat Overview
     * Technical Analysis (with MITRE ATT&CK mappings)
     * Impact Assessment
     * IOCs (if available)
     * Detection & Response
     * Mitigation Recommendations
   - Create a Twitter post (under 280 characters with emojis and hashtags)
   - Write SEO meta description
   - Classify with 1-3 categories (most prominent FIRST)
   - Determine severity level
   - Extract all entities (companies, threat actors, malware, products, etc.)
   - List CVEs with details if mentioned
   - Include source URLs
   - Identify MITRE ATT&CK techniques (T#### format) - extract from articles AND generate based on your knowledge
   - Generate MITRE ATT&CK mitigations (M#### format) - use your expert knowledge to recommend defenses
   - Create chronological event timeline if applicable
   - Add impact scope details
   - Generate relevant tags

4. Create a publication-level summary:
   - Write a catchy headline covering the most prominent stories
   - Provide an overall summary of the cybersecurity situation
   - Set pub_date to ${pubDate}
   - Count total articles
   - Set generated_at to current timestamp

5. Return the complete structured publication with all articles

IMPORTANT:
- Be thorough and detailed in the full_report sections
- Use proper Markdown formatting (see examples above)
- Extract ALL available information from the raw search results
- Ensure Twitter posts are under 280 characters
- List categories with most prominent FIRST
- Include source URLs for all articles
- Identify MITRE ATT&CK techniques (T#### format): extract from articles AND generate based on attack TTPs
- Generate MITRE ATT&CK mitigations (M#### format): use your expert knowledge to recommend appropriate defenses
- Map mitigations to D3FEND techniques using the embedded lookup table in the schema
- Format technical content (IPs, domains, file paths, CVEs) with inline code backticks
- Use code blocks for any exploit code, detection rules, or configuration examples
`;
}

/**
 * Main function
 */
async function main() {
  console.log('🏗️  Structured News Generator');
  console.log('━'.repeat(70));
  
  // Parse arguments
  const { date, logtodb } = parseArgs();
  
  // Convert date to pub_date timestamp (9am CST = 15:00 UTC)
  const pubDateTime = `${date}T15:00:00.000Z`;
  
  console.log(`📅 Date: ${date}`);
  console.log(`🔍 Looking up raw search: ${pubDateTime}`);
  console.log();
  
  // Get raw search data from database
  const rawSearchRecord = getRawSearch(pubDateTime);
  
  if (!rawSearchRecord) {
    console.error(`❌ No raw search data found for ${pubDateTime}`);
    console.error(`   Run search-news.ts first with --logtodb flag`);
    process.exit(1);
  }
  
  console.log(`✅ Found raw search data (${rawSearchRecord.data.length.toLocaleString()} chars)`);
  console.log(`   Generated: ${rawSearchRecord.generated_at}`);
  console.log();
  
  // Build prompt
  const prompt = buildPrompt(rawSearchRecord.data, date);
  
  console.log('🤖 Calling Vertex AI for structured output...');
  console.log(`   Model: gemini-2.5-pro`);
  console.log(`   Mode: Structured output with Zod schema`);
  console.log();
  
  // Call Vertex AI with structured output
  const result = await callVertex(prompt, {
    model: 'gemini-2.5-pro',
    temperature: 0.5,
    maxTokens: 65535,
    schema: CyberAdvisorySchema,  // Enable structured output with Zod schema
  });
  
  // Show usage
  if (result.usage) {
    console.log(`📊 Token usage:`);
    console.log(`   Input: ${result.usage.inputTokens.toLocaleString()}`);
    console.log(`   Output: ${result.usage.outputTokens.toLocaleString()}`);
    console.log(`   Total: ${result.usage.totalTokens.toLocaleString()}`);
    console.log();
  }
  
  // With structured output, result.content is already parsed object
  const structured = result.content as CyberAdvisoryType;
  
  // Generate proper UUIDs (LLM often generates dummy/duplicate UUIDs)
  structured.pub_id = randomUUID();
  structured.articles.forEach(article => {
    article.id = randomUUID();
    // Set pub_date to the search date (not LLM-generated)
    article.pub_date = date;
  });
  
  console.log(`✅ Structured output received`);
  console.log(`   Articles: ${structured.total_articles}`);
  console.log(`   Generated pub_id: ${structured.pub_id}`);
  console.log();
  
  // Save to tmp/ directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `news-structured_${date}_${timestamp}.json`;
  const tmpDir = join(process.cwd(), 'tmp');
  
  mkdirSync(tmpDir, { recursive: true });
  
  const outputPath = join(tmpDir, filename);
  writeFileSync(outputPath, JSON.stringify(structured, null, 2), 'utf-8');
  
  console.log(`✅ Structured output saved to: ${outputPath}`);
  
  // Save to database if --logtodb flag is set
  if (logtodb) {
    console.log();
    console.log('💾 Saving to database...');
    
    try {
      saveStructuredNews({
        pubDate: pubDateTime,
        data: structured
      });
      
      console.log(`✅ Saved to structured_news table`);
    } catch (error: any) {
      console.error(`❌ Database save failed: ${error.message}`);
      console.error(`   File output was successful - continuing...`);
    }
  }
  
  console.log();
  
  // Show preview
  console.log(`📄 Preview:`);
  console.log('─'.repeat(70));
  console.log(`Publication ID: ${structured.pub_id}`);
  console.log(`Headline: ${structured.headline}`);
  console.log(`Articles: ${structured.total_articles}`);
  console.log(`Date Range: ${structured.date_range}`);
  console.log('─'.repeat(70));
  
  console.log();
  console.log('✅ Done!');
}

// Run
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
