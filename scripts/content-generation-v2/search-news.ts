#!/usr/bin/env node
/**
 * Content Generation V2 - News Search
 * 
 * Simple grounded search for cybersecurity news.
 * Outputs raw results to tmp/ directory.
 * 
 * Usage:
 *   npx tsx search-news.ts --timeframe=today
 *   npx tsx search-news.ts --timeframe=1dayago
 *   npx tsx search-news.ts --timeframe=5daysago
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import { callGroundedSearch } from './ai/index.js';
import { saveRawSearch } from './database/schema.js';

// Parse CLI args
function parseArgs() {
  const program = new Command();
  
  program
    .name('search-news')
    .description('Search for cybersecurity news using Google Search grounding')
    .version('2.0.0')
    .option('-d, --date <date>', 'Explicit publication date (YYYY-MM-DD) - searches 24hrs ending at 9am CST on this date')
    .option('-t, --timeframe <timeframe>', 'Timeframe for search (today, yesterday, 2daysago, 5daysago)', 'today')
    .option('-c, --count <number>', 'Number of articles to find (1-10)', '10')
    .option('--logtodb', 'Save raw search results to database')
    .option('--prompt-only', 'Print the prompt and exit without calling API')
    .addHelpText('after', `
Examples:
  $ npx tsx search-news.ts --date 2025-10-15
  Search for articles published Oct 15 (24 hours ending at 9am CST Oct 15)

  $ npx tsx search-news.ts
  Search for 3 articles from today (24 hours ending at most recent 9am CST)

  $ npx tsx search-news.ts -t yesterday -c 5
  Search for 5 articles from yesterday (24 hours ending at 9am CST yesterday)

  $ npx tsx search-news.ts --timeframe=2daysago --count=10
  Search for 10 articles from 2 days ago

  $ npx tsx search-news.ts --date 2025-10-12 --logtodb
  Search for Oct 12 articles and save to database

Date format:
  --date YYYY-MM-DD   Explicitly set publication date (searches 24hrs ending at 9am CST on that date)
                      This is RECOMMENDED to avoid confusion with timezone adjustments

Timeframe formats (relative to most recent 9am CST):
  today           24 hours ending at most recent 9am CST
  yesterday       24 hours ending at previous day's 9am CST
  2daysago        24 hours ending at 9am CST 2 days before most recent cutoff
  5daysago        24 hours ending at 9am CST 5 days before most recent cutoff

Options:
  --logtodb       Save complete raw search results to database for replay/debugging

Output:
  Results saved to tmp/search-news_<timeframe>_<timestamp>.txt
  If --logtodb: Also saved to database raw_search table
`)
    .parse(process.argv);
  
  const options = program.opts();
  
  return {
    date: options.date as string | undefined,
    timeframe: options.timeframe as string,
    count: parseInt(options.count as string, 10),
    logtodb: options.logtodb === true,
    promptOnly: options.promptOnly === true,
  };
}

// Convert timeframe to days back
function parseDaysBack(timeframe: string): number {
  if (timeframe === 'today') return 0;
  if (timeframe === 'yesterday') return 1;
  
  const match = timeframe.match(/^(\d+)daysago$/);
  if (match && match[1]) return parseInt(match[1], 10);
  
  console.warn(`Unknown timeframe: ${timeframe}, using today`);
  return 0;
}

// Calculate 24-hour search window ending at 9am CST on target day
function getSearchWindow(daysBack: number): { start: Date; end: Date; startISO: string; endISO: string } {
  // 9am CST = 15:00 UTC (3pm UTC)
  const now = new Date();
  
  // Start with today at 9am CST
  const todayAt9amCST = new Date();
  todayAt9amCST.setUTCHours(15, 0, 0, 0); // Set to 9am CST (3pm UTC)
  
  // If current time is before today's 9am CST, we haven't reached today's cutoff yet
  // So "today" means yesterday's 9am for our purposes
  let adjustedDaysBack = daysBack;
  if (now < todayAt9amCST) {
    adjustedDaysBack += 1; // Push back one more day
  }
  
  // Calculate the target end date (9am CST on the target day)
  const searchEnd = new Date();
  searchEnd.setDate(searchEnd.getDate() - adjustedDaysBack);
  searchEnd.setUTCHours(15, 0, 0, 0); // Set to 9am CST (3pm UTC)
  
  // Search window is 24 hours before 9am CST
  const searchStart = new Date(searchEnd.getTime() - (24 * 60 * 60 * 1000));
  
  return {
    start: searchStart,
    end: searchEnd,
    startISO: searchStart.toISOString(),
    endISO: searchEnd.toISOString(),
  };
}

// Calculate 24-hour search window ending at 9am CST on explicit date
function getSearchWindowFromDate(dateStr: string): { start: Date; end: Date; startISO: string; endISO: string } {
  // Parse YYYY-MM-DD format
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
  }
  
  const [, year, month, day] = match;
  
  // Create date at 9am CST (15:00 UTC) on the specified date
  const searchEnd = new Date(`${year}-${month}-${day}T15:00:00.000Z`);
  
  if (isNaN(searchEnd.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  
  // Search window is 24 hours before 9am CST
  const searchStart = new Date(searchEnd.getTime() - (24 * 60 * 60 * 1000));
  
  return {
    start: searchStart,
    end: searchEnd,
    startISO: searchStart.toISOString(),
    endISO: searchEnd.toISOString(),
  };
}

// Build the search prompt
function buildPrompt(searchWindow: { start: Date; end: Date; startISO: string; endISO: string }, count: number, dateLabel: string): string {
  const dateStr = dateLabel;
  const timeDesc = 'specified date';
  
  return `You are searching for the top ${count} most significant cybersecurity news stories. Your task is to find articles that were PUBLISHED between ${searchWindow.startISO} and ${searchWindow.endISO}, then extract comprehensive information from those sources.

════════════════════════════════════════════════════════════════════════════════
📅 CRITICAL PUBLICATION DATE REQUIREMENTS
════════════════════════════════════════════════════════════════════════════════

ONLY include articles where the ARTICLE PUBLICATION DATE falls between:
   • START: ${searchWindow.startISO}
   • END: ${searchWindow.endISO}
   • This is a 24-hour window ending at 9am CST on ${timeDesc} (${dateStr})

IMPORTANT CLARIFICATIONS:
   • The article itself must be published within this time window
   • The event being discussed may be older (ongoing incidents, follow-up coverage)
   • DO NOT include articles published AFTER ${searchWindow.endISO} that discuss earlier events
   • DO NOT include articles published BEFORE ${searchWindow.startISO}
   • Every source URL you cite MUST have a publication date within this window

VERIFICATION CHECKLIST (before including any source):
   1. Verify the article's PUBLICATION DATE is within ${searchWindow.startISO} to ${searchWindow.endISO}
   2. The article may discuss older events, but the ARTICLE ITSELF must be published in this window
   3. If an article about an event is published AFTER ${searchWindow.endISO}, DO NOT include it
   4. Double-check that EVERY source date listed falls within the required time window

════════════════════════════════════════════════════════════════════════════════
🔍 SEARCH SCOPE - CYBERSECURITY TOPICS
════════════════════════════════════════════════════════════════════════════════

Search for cybersecurity news articles and security coverage published within the time window, covering topics in these categories:

• Ransomware attacks
• Data breaches
• Zero-day vulnerabilities
• APT campaigns
• CVE disclosures
• Security advisories
• Malware analysis
• Phishing campaigns
• Supply chain attacks
• Cloud security incidents
• Critical patches
• Threat intelligence
• Incident response
• Security operations
• Policy and compliance updates
• Regulatory announcements and enforcement actions

════════════════════════════════════════════════════════════════════════════════
📋 CONTENT GUIDELINES BY STORY TYPE
════════════════════════════════════════════════════════════════════════════════

For threats/incidents/vulnerabilities, prioritize extracting:
• Complete technical details (CVE IDs, CVSS scores, affected versions)
• Attack vectors, exploit mechanisms, and indicators of compromise
• Real-world exploitation examples and victim profiles
• Threat actor TTPs, motivations, and attribution details
• Step-by-step timeline from discovery through response
• Detailed mitigation steps and security recommendations

For policy/compliance/regulatory news, prioritize extracting:
• Full details of new regulations, policies, or compliance requirements
• Organizations, industries, and jurisdictions affected
• Implementation deadlines and enforcement timelines
• Penalties for non-compliance and enforcement actions taken
• Industry response and compliance implications

════════════════════════════════════════════════════════════════════════════════
⚠️ ARTICLE GROUPING RULES
════════════════════════════════════════════════════════════════════════════════

• Each article MUST be about a DIFFERENT cybersecurity topic/story
• If multiple sources cover the SAME event/topic, GROUP them into ONE article
• Return exactly ${count} distinct, non-duplicate articles

════════════════════════════════════════════════════════════════════════════════
📝 OUTPUT FORMAT - FOR EACH STORY
════════════════════════════════════════════════════════════════════════════════

TITLE: [Short title, max 100 chars]

SUMMARY: [Brief summary, max 300 chars]

FULL_ARTICLE: [Comprehensive narrative article - see detailed requirements below]

ENTITIES (only include if applicable):
- Threat Actors: [List if mentioned]
- Malware: [List if mentioned]
- Tools: [List if mentioned]
- Infrastructure: [List if mentioned]
- Affected Organizations: [List if mentioned]
- Affected Products and version: [List if mentioned]
- CVE IDs: [List if mentioned] [score] [KEV true/false]
- Industries: [List if mentioned]
- Geographies / countries / regions: [List if mentioned]

SOURCE REFERENCES (Minimum 2 per story):
  URL: [Real article URL - NOT vertexaisearch.cloud.google.com]
  Title: [Article title]
  Website: [Domain name]
  Date: [MM/DD/YYYY - MUST be between ${searchWindow.startISO.split('T')[0]} and ${searchWindow.endISO.split('T')[0]}]

════════════════════════════════════════════════════════════════════════════════
📰 FULL_ARTICLE REQUIREMENTS - COMPREHENSIVE INFORMATION EXTRACTION
════════════════════════════════════════════════════════════════════════════════

⚠️ EXTRACTION PRINCIPLES:
• Extract EVERY factual detail, data point, quote, and technical specification mentioned across ALL sources
• Synthesize information from multiple sources into a coherent narrative WITHOUT duplicating content
• If sources provide different details about the same event, include ALL unique information
• Do NOT omit technical details, numbers, names, dates, or specific facts present in sources
• Do NOT repeat the same fact multiple times - state each unique piece of information once
• Capture verbatim quotes from executives, researchers, or officials when provided
• Include specific examples, case studies, or real-world scenarios mentioned in sources

⚠️ WRITING STYLE:
• Write naturally and coherently - do NOT use bullet points or lists in the article body
• Synthesize all details into flowing paragraphs that read like investigative journalism
• Create a narrative that connects all the facts logically

⚠️ ESSENTIAL CONTENT TO EXTRACT (when available in sources):

WHO IS AFFECTED:
Extract specific organization names, industries, products with version numbers, user counts, geographic regions

TECHNICAL DETAILS:
Extract complete CVE IDs with CVSS scores, attack vectors with technical mechanisms, exploit code details, IOCs (IPs, domains, file hashes), affected system components, vulnerability types, exploit complexity

TIMELINE:
Extract specific dates/times for discovery, first exploitation, disclosure, patch release, public announcement, ongoing status

IMPACT ASSESSMENT:
Extract precise data volumes stolen, number of records/users affected, financial losses, downtime duration, system availability impact, business disruption specifics

THREAT INTELLIGENCE:
Extract threat actor names/aliases, group affiliations, known TTPs, motivation indicators, previous campaigns, attribution confidence level, infrastructure details (C2 servers, domains)

RESPONSE ACTIONS:
Extract specific patch versions, KB numbers, mitigation commands, configuration changes, security controls recommended, incident response timeline, law enforcement involvement

EXPERT COMMENTARY:
Extract direct quotes from CISOs, security researchers, company statements, expert commentary on significance, industry reaction details

CONTEXT & IMPLICATIONS:
Extract related past incidents with dates, industry-wide trends, regulatory implications, long-term strategic concerns, lessons learned

QUANTITATIVE DATA:
Extract exact numbers for affected systems, exploit attempts, detection rates, remediation timelines, costs, penalties

ORGANIZATIONAL RESPONSES:
Extract company statements, remediation plans, customer notifications, transparency reports, leadership changes

════════════════════════════════════════════════════════════════════════════════
✅ FINAL CHECKLIST
════════════════════════════════════════════════════════════════════════════════

Before submitting your response, verify:
□ Exactly ${count} distinct articles (each about a different cybersecurity event)
□ Each article has TITLE, SUMMARY, FULL_ARTICLE, ENTITIES, and SOURCE REFERENCES
□ FULL_ARTICLE is written in flowing paragraphs (no bullet points)
□ Every source date is between ${searchWindow.startISO.split('T')[0]} and ${searchWindow.endISO.split('T')[0]}
□ All factual details from sources are included without duplication
□ Each article synthesizes information from multiple sources when available`;
}

// Main function
async function main() {
  console.log('🔍 Content Generation V2 - News Search\n');
  
  const { date, timeframe, count, logtodb, promptOnly } = parseArgs();
  
  // Determine search window
  let searchWindow;
  let displayLabel;
  
  if (date) {
    // Use explicit date
    searchWindow = getSearchWindowFromDate(date);
    displayLabel = date;
    console.log(`📅 Explicit date: ${date}`);
  } else {
    // Use relative timeframe
    const daysBack = parseDaysBack(timeframe);
    searchWindow = getSearchWindow(daysBack);
    displayLabel = timeframe;
    console.log(`📅 Searching for news: ${timeframe}`);
  }
  
  console.log(`📊 Articles to find: ${count}`);
  console.log(`⏰ Search window:`);
  console.log(`   Start: ${searchWindow.startISO}`);
  console.log(`   End:   ${searchWindow.endISO}`);
  console.log(`   (24 hours ending at 9am CST)`);
  if (logtodb) {
    console.log(`💾 Database logging: ENABLED`);
  }
  console.log();
  
  // Build prompt
  const prompt = buildPrompt(searchWindow, count, displayLabel);
  
  // If prompt-only mode, print and exit
  if (promptOnly) {
    console.log('📋 PROMPT (--prompt-only mode):');
    console.log('═'.repeat(70));
    console.log(prompt);
    console.log('═'.repeat(70));
    console.log('\n✅ Prompt printed. Exiting without API call.');
    return;
  }
  
  console.log('🤖 Calling Vertex AI with Google Search grounding...\n');
  
  // Call grounded search
  const result = await callGroundedSearch(prompt, {
    model: 'gemini-2.5-pro',
    maxTokens: 65535,
  });
  
  // Show usage
  if (result.usage) {
    console.log(`\n📊 Token usage:`);
    console.log(`   Input: ${result.usage.inputTokens.toLocaleString()}`);
    console.log(`   Output: ${result.usage.outputTokens.toLocaleString()}`);
    console.log(`   Total: ${result.usage.totalTokens.toLocaleString()}`);
  }
  
  // Save to tmp/
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `search-news_${date || timeframe}_${timestamp}.txt`;
  const tmpDir = join(process.cwd(), 'tmp');
  
  mkdirSync(tmpDir, { recursive: true });
  
  const outputPath = join(tmpDir, filename);
  writeFileSync(outputPath, result.content, 'utf-8');
  
  console.log(`\n✅ Results saved to: ${outputPath}`);
  
  // Save to database if requested
  if (logtodb) {
    try {
      // Save as UTC timestamp (9am CST = 15:00 UTC)
      const pubDateUtc = searchWindow.endISO; // Already in ISO 8601 UTC format
      const id = saveRawSearch({
        pubDate: pubDateUtc,
        data: result.content,
      });
      console.log(`💾 Saved to database: raw_search table (id: ${id}, pub_date: ${pubDateUtc})`);
    } catch (error: any) {
      console.error(`❌ Failed to save to database: ${error.message}`);
    }
  }
  
  console.log(`\n📄 Preview (first 500 chars):`);
  console.log('─'.repeat(70));
  console.log(result.content.substring(0, 500) + '...');
  console.log('─'.repeat(70));
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
