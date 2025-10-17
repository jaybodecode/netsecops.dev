#!/usr/bin/env npx tsx

/**
 * Twitter Post Debug Script
 * 
 * Purpose: Debug Twitter API rate limit issues by showing detailed request/response info
 * 
 * This script:
 * 1. Loads the exact tweet data from tweets.json
 * 2. Constructs the exact payload that would be sent to Twitter
 * 3. Shows detailed response headers (including rate limit info)
 * 4. Provides diagnostic information about why posts are failing
 * 
 * Usage:
 *   npx tsx scripts/content-social/twitter-post-debug.ts -r 9
 *   npx tsx scripts/content-social/twitter-post-debug.ts --check-limits
 */

import fs from 'fs';
import { TwitterApi } from 'twitter-api-v2';
import { Command } from 'commander';
import 'dotenv/config';

// Configuration
const DEFAULT_SOURCE = './tmp/twitter/tweets.json';
const BASE_URL = 'https://cyber.netsecops.io/articles';
const TWITTER_URL_LENGTH = 23;

interface Tweet {
  slug: string;
  headline: string;
  tweet_text: string;
  categories: string[];
  primary_category: string;
  image_filename: string;
  severity: string;
  is_update: boolean;
  char_count?: number;
}

// Parse command line arguments
const program = new Command();

program
  .name('twitter-post-debug')
  .description('Debug Twitter API posting issues with detailed diagnostics')
  .version('1.0.0')
  .option('-r, --range <range>', 'tweet number to debug (e.g., "9")')
  .option('--check-limits', 'check current rate limit status without posting')
  .option('--dry-run', 'show what would be posted without actually posting')
  .option('-s, --source <file>', 'source tweets JSON file', DEFAULT_SOURCE)
  .parse(process.argv);

const options = program.opts();
const sourceFile = options.source as string;
const checkLimits = options.checkLimits as boolean || false;
const isDryRun = options.dryRun as boolean || false;

// Parse range
let tweetIndex: number | undefined;
if (options.range) {
  const rangeValue = options.range as string;
  tweetIndex = parseInt(rangeValue, 10) - 1; // Convert to 0-indexed
}

/**
 * Build tweet content exactly as the main script does
 */
function buildTweetContent(tweet: Tweet): {
  fullText: string;
  prefix: string;
  url: string;
  actualChars: number;
  twitterChars: number;
} {
  const prefix = tweet.is_update ? '📢 UPDATE:' : '🚨 BREAKING:';
  const url = `${BASE_URL}/${tweet.slug}`;
  const fullText = `${prefix} ${tweet.tweet_text}\n\n${url}`;
  
  const twitterChars = prefix.length + 1 + tweet.tweet_text.length + 2 + TWITTER_URL_LENGTH;
  
  return {
    fullText,
    prefix,
    url,
    actualChars: fullText.length,
    twitterChars
  };
}

/**
 * Display detailed rate limit information
 */
function displayRateLimits(headers: any) {
  console.log('\n' + '═'.repeat(80));
  console.log('📊 TWITTER API RATE LIMIT INFORMATION');
  console.log('═'.repeat(80));
  
  // Extract rate limit headers
  const limit = headers['x-rate-limit-limit'];
  const remaining = headers['x-rate-limit-remaining'];
  const reset = headers['x-rate-limit-reset'];
  
  if (limit !== undefined) {
    console.log(`Rate Limit:     ${limit} requests per window`);
  }
  
  if (remaining !== undefined) {
    console.log(`Remaining:      ${remaining} requests`);
    
    if (parseInt(remaining) === 0) {
      console.log('⚠️  WARNING: No requests remaining! You are rate limited.');
    } else if (parseInt(remaining) < 5) {
      console.log(`⚠️  WARNING: Only ${remaining} requests remaining!`);
    }
  }
  
  if (reset !== undefined) {
    const resetTime = new Date(parseInt(reset) * 1000);
    const now = new Date();
    const waitMinutes = Math.ceil((resetTime.getTime() - now.getTime()) / 60000);
    
    console.log(`Reset Time:     ${resetTime.toLocaleString()}`);
    console.log(`Wait Time:      ${waitMinutes} minutes`);
    
    if (waitMinutes > 0) {
      console.log(`\n💡 Rate limit will reset in ${waitMinutes} minutes`);
      console.log(`   You can retry after: ${resetTime.toLocaleTimeString()}`);
    }
  }
  
  // Show all response headers for debugging
  console.log('\n📋 ALL RESPONSE HEADERS:');
  console.log('─'.repeat(80));
  Object.keys(headers).forEach(key => {
    if (key.toLowerCase().includes('rate') || 
        key.toLowerCase().includes('limit') || 
        key.toLowerCase().includes('retry')) {
      console.log(`  ${key}: ${headers[key]}`);
    }
  });
  
  console.log('═'.repeat(80) + '\n');
}

/**
 * Check current rate limits without posting
 */
async function checkRateLimitStatus(client: TwitterApi) {
  console.log('\n🔍 Checking current Twitter API rate limit status...\n');
  
  try {
    // Use v1 API to check rate limits
    const rateLimitStatus = await client.v1.get('application/rate_limit_status.json');
    
    console.log('═'.repeat(80));
    console.log('📊 RATE LIMIT STATUS');
    console.log('═'.repeat(80));
    
    // Check tweet posting endpoint
    const resources = rateLimitStatus.resources;
    
    if (resources.statuses) {
      console.log('\n🐦 Tweet Posting Limits:');
      console.log('─'.repeat(80));
      
      Object.keys(resources.statuses).forEach(endpoint => {
        const limit = resources.statuses[endpoint];
        console.log(`\nEndpoint: ${endpoint}`);
        console.log(`  Limit:     ${limit.limit} requests`);
        console.log(`  Remaining: ${limit.remaining} requests`);
        console.log(`  Reset:     ${new Date(limit.reset * 1000).toLocaleString()}`);
        
        if (limit.remaining === 0) {
          const waitMinutes = Math.ceil((limit.reset * 1000 - Date.now()) / 60000);
          console.log(`  ⚠️  RATE LIMITED - Wait ${waitMinutes} minutes`);
        }
      });
    }
    
    // Show app-level limits
    if (resources.application) {
      console.log('\n📱 Application Limits:');
      console.log('─'.repeat(80));
      
      Object.keys(resources.application).forEach(endpoint => {
        const limit = resources.application[endpoint];
        console.log(`\nEndpoint: ${endpoint}`);
        console.log(`  Limit:     ${limit.limit} requests`);
        console.log(`  Remaining: ${limit.remaining} requests`);
        console.log(`  Reset:     ${new Date(limit.reset * 1000).toLocaleString()}`);
      });
    }
    
    console.log('\n═'.repeat(80) + '\n');
    
  } catch (error: any) {
    console.error('❌ Failed to check rate limit status');
    console.error(`   Error: ${error.message || error}`);
    
    if (error.code === 429) {
      console.error('\n⚠️  You are currently rate limited!');
      console.error('   The rate limit check itself is rate limited.');
    }
  }
}

/**
 * Load specific tweet
 */
function loadTweet(index: number): Tweet | null {
  try {
    const content = fs.readFileSync(sourceFile, 'utf-8');
    const tweets = JSON.parse(content);
    
    if (index < 0 || index >= tweets.length) {
      console.error(`❌ Tweet index ${index + 1} out of range (1-${tweets.length})`);
      return null;
    }
    
    return tweets[index];
  } catch (error) {
    console.error(`❌ Failed to load tweets from ${sourceFile}`);
    console.error(error);
    return null;
  }
}

/**
 * Debug post tweet with detailed diagnostics
 */
async function debugPostTweet(client: TwitterApi, tweet: Tweet, index: number) {
  const { fullText, twitterChars, url } = buildTweetContent(tweet);
  
  console.log('\n' + '═'.repeat(80));
  console.log(`🐛 DEBUG POST - TWEET #${index + 1}`);
  console.log('═'.repeat(80));
  console.log(`Slug:          ${tweet.slug}`);
  console.log(`Headline:      ${tweet.headline}`);
  console.log(`Primary Cat:   ${tweet.primary_category}`);
  console.log(`Severity:      ${tweet.severity}`);
  console.log(`Is Update:     ${tweet.is_update}`);
  console.log(`Twitter Chars: ${twitterChars}/280`);
  console.log('─'.repeat(80));
  console.log('TWEET CONTENT:');
  console.log('─'.repeat(80));
  console.log(fullText);
  console.log('─'.repeat(80));
  
  // Show exact payload
  const payload = {
    text: fullText
  };
  
  console.log('\n📦 EXACT API PAYLOAD:');
  console.log('─'.repeat(80));
  console.log(JSON.stringify(payload, null, 2));
  console.log('─'.repeat(80));
  
  if (isDryRun) {
    console.log('\n🔍 DRY RUN MODE - Not posting to Twitter');
    console.log('═'.repeat(80) + '\n');
    return;
  }
  
  console.log('\n🚀 Attempting to post to Twitter...\n');
  
  try {
    // Post the tweet
    const result = await client.v2.tweet(payload);
    
    console.log('✅ SUCCESS! Tweet posted successfully!');
    console.log(`   Tweet ID: ${result.data.id}`);
    console.log(`   URL: https://twitter.com/i/web/status/${result.data.id}`);
    
    // Show raw response headers
    console.log('\n📋 RAW HTTP RESPONSE HEADERS:');
    console.log('─'.repeat(80));
    
    // Access internal response object to get headers
    const response = (result as any)._realData;
    if (response && response.headers) {
      Object.keys(response.headers).forEach(key => {
        console.log(`${key}: ${response.headers[key]}`);
      });
    } else {
      console.log('(Headers not available in response object)');
    }
    
    console.log('\n═'.repeat(80) + '\n');
    
  } catch (error: any) {
    console.log('❌ FAILED to post tweet\n');
    
    // Display error details
    console.log('═'.repeat(80));
    console.log('❌ ERROR DETAILS');
    console.log('═'.repeat(80));
    console.log(`Error Type:    ${error.constructor.name}`);
    console.log(`Error Code:    ${error.code || 'N/A'}`);
    console.log(`Error Message: ${error.message || 'Unknown error'}`);
    
    // Show raw HTTP response headers - THIS IS THE KEY DIAGNOSTIC INFO
    console.log('\n📋 RAW HTTP RESPONSE HEADERS:');
    console.log('─'.repeat(80));
    
    let headersFound = false;
    
    // Try multiple places where headers might be stored
    if (error.headers) {
      Object.keys(error.headers).forEach(key => {
        console.log(`${key}: ${error.headers[key]}`);
      });
      headersFound = true;
    } else if (error.response && error.response.headers) {
      Object.keys(error.response.headers).forEach(key => {
        console.log(`${key}: ${error.response.headers[key]}`);
      });
      headersFound = true;
    } else if (error.data && error.data.headers) {
      Object.keys(error.data.headers).forEach(key => {
        console.log(`${key}: ${error.data.headers[key]}`);
      });
      headersFound = true;
    }
    
    if (!headersFound) {
      console.log('(No headers found in error response)');
      console.log('\nAvailable error properties:');
      console.log(Object.keys(error).join(', '));
    }
    
    // Specific guidance based on error code
    console.log('\n💡 DIAGNOSTIC INFORMATION:');
    console.log('─'.repeat(80));
    
    if (error.code === 429) {
      console.log('⚠️  ERROR 429: RATE LIMIT EXCEEDED');
      console.log('');
      console.log('Possible causes:');
      console.log('  1. Too many tweets posted in short time window');
      console.log('  2. Twitter API v2 limits: 50 tweets per 15 minutes (app-level)');
      console.log('  3. Daily tweet limits: ~300 tweets per day (user-level)');
      console.log('  4. Rate limit may apply to failed attempts too');
      console.log('');
      console.log('Solutions:');
      console.log('  1. Wait for rate limit window to reset (see reset time above)');
      console.log('  2. Check monthly tweet volume in Twitter Developer Portal');
      console.log('  3. Verify app authentication tier (Free vs Pro)');
      console.log('  4. Consider spreading posts over longer time periods');
      
    } else if (error.code === 403) {
      console.log('⚠️  ERROR 403: FORBIDDEN');
      console.log('');
      console.log('Possible causes:');
      console.log('  1. Invalid API credentials');
      console.log('  2. App lacks required permissions (read+write access)');
      console.log('  3. Duplicate tweet (already posted)');
      console.log('  4. Tweet violates Twitter policies');
      console.log('');
      console.log('Solutions:');
      console.log('  1. Verify API credentials in .env file');
      console.log('  2. Check app permissions in Twitter Developer Portal');
      console.log('  3. Check if tweet was already posted');
      
    } else if (error.code === 187) {
      console.log('⚠️  ERROR 187: DUPLICATE STATUS');
      console.log('');
      console.log('This exact tweet has already been posted recently.');
      console.log('Twitter blocks posting identical content within a short timeframe.');
      
    } else {
      console.log(`⚠️  ERROR ${error.code || 'UNKNOWN'}`);
      console.log('');
      console.log('This is an unexpected error. Check error details above.');
    }
    
    console.log('═'.repeat(80) + '\n');
    
    // Exit with error code
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🐛 Twitter Post Debug Script\n');
  
  // Check environment variables
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET ||
      !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
    console.error('❌ Missing Twitter API credentials in .env:');
    console.error('   TWITTER_API_KEY');
    console.error('   TWITTER_API_SECRET');
    console.error('   TWITTER_ACCESS_TOKEN');
    console.error('   TWITTER_ACCESS_SECRET');
    process.exit(1);
  }
  
  // Initialize Twitter client
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });
  
  // Just check rate limits
  if (checkLimits) {
    await checkRateLimitStatus(client);
    return;
  }
  
  // Must provide a tweet index
  if (tweetIndex === undefined) {
    console.error('❌ Error: Must specify a tweet number with -r flag');
    console.error('   Example: npx tsx twitter-post-debug.ts -r 9');
    console.error('');
    console.error('   Or check rate limits: npx tsx twitter-post-debug.ts --check-limits');
    process.exit(1);
  }
  
  // Load the specific tweet
  const tweet = loadTweet(tweetIndex);
  if (!tweet) {
    process.exit(1);
  }
  
  console.log(`📊 Loaded tweet #${tweetIndex + 1} from ${sourceFile}\n`);
  
  // Debug post the tweet
  await debugPostTweet(client, tweet, tweetIndex);
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:');
  console.error(error);
  process.exit(1);
});
