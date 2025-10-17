#!/usr/bin/env npx tsx

/**
 * Post to Twitter/X
 * 
 * Posts daily threat report as a thread to Twitter/X.
 * Uses existing database content (no LLM calls needed).
 * 
 * Usage:
 *   npx tsx scripts/content-social/post-to-twitter.ts [options]
 * 
 * Options:
 *   --date YYYY-MM-DD    Post specific date (default: latest)
 *   --dry-run            Preview thread without posting
 *   --limit N            Number of articles to include (default: 5)
 *   --force              Force repost even if already posted
 */

import { TwitterApi } from 'twitter-api-v2';
import {
  getLatestPublication,
  getPublicationForDate,
  hasBeenPosted,
  recordPost,
  initSocialPostsTable
} from './lib/db.js';
import {
  formatTwitterThread,
  validateTwitterThread,
  previewTwitterThread
} from './lib/formatters.js';

// Parse command-line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

const dateIndex = args.indexOf('--date');
const date = dateIndex >= 0 ? args[dateIndex + 1] : null;

const limitIndex = args.indexOf('--limit');
const limitArg = limitIndex >= 0 ? args[limitIndex + 1] : undefined;
const articleLimit = limitArg ? parseInt(limitArg, 10) : 5;

/**
 * Main function
 */
async function main() {
  console.log('\n🐦 Twitter/X Thread Poster\n');
  
  // 1. Get publication data
  console.log('📰 Fetching publication data...');
  const data = date ? getPublicationForDate(date) : getLatestPublication();
  
  if (!data) {
    console.error('❌ No publication found');
    process.exit(1);
  }
  
  console.log(`✅ Found publication: ${data.publication.id}`);
  console.log(`   Date: ${data.publication.pub_date}`);
  console.log(`   Articles: ${data.articles.length}\n`);
  
  // 2. Check if already posted (unless --force)
  if (!force) {
    const alreadyPosted = hasBeenPosted('twitter', data.publication.id, 'thread');
    
    if (alreadyPosted) {
      console.log('⚠️  Already posted to Twitter (use --force to repost)');
      process.exit(0);
    }
  }
  
  // 3. Format thread
  console.log('🔧 Formatting thread...');
  const thread = formatTwitterThread(data, articleLimit);
  
  // 4. Validate thread
  console.log('✅ Validating thread...');
  const valid = validateTwitterThread(thread);
  
  if (!valid) {
    console.error('❌ Thread validation failed (tweets too long)');
    process.exit(1);
  }
  
  console.log(`✅ Thread valid (${thread.tweets.length} tweets)\n`);
  
  // 5. Preview thread
  previewTwitterThread(thread);
  
  // 6. Dry run - exit here
  if (dryRun) {
    console.log('✅ Dry run complete - no tweets posted\n');
    process.exit(0);
  }
  
  // 7. Check environment variables
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET ||
      !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
    console.error('❌ Missing Twitter API credentials in .env:');
    console.error('   TWITTER_API_KEY');
    console.error('   TWITTER_API_SECRET');
    console.error('   TWITTER_ACCESS_TOKEN');
    console.error('   TWITTER_ACCESS_SECRET');
    process.exit(1);
  }
  
  // 8. Post thread
  console.log('🚀 Posting thread to Twitter...\n');
  
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
    
    // Post thread
    const result = await client.v2.tweetThread(thread.tweets);
    
    console.log('✅ Thread posted successfully!\n');
    
    // Get thread URL (first tweet)
    const firstTweetId = result[0].data.id;
    const tweetUrl = `https://twitter.com/i/web/status/${firstTweetId}`;
    
    console.log(`🔗 Thread URL: ${tweetUrl}\n`);
    
    // 9. Record post
    initSocialPostsTable();
    recordPost(
      'twitter',
      data.publication.id,
      'thread',
      firstTweetId,
      tweetUrl
    );
    
    console.log('✅ Post recorded in database\n');
    
    // 10. Display engagement stats (future)
    console.log('📊 Engagement tracking: Coming soon\n');
    
  } catch (error: any) {
    console.error('❌ Failed to post thread:');
    console.error(error.message || error);
    
    if (error.code === 403) {
      console.error('\n⚠️  Permission error - check API credentials and app permissions');
    } else if (error.code === 429) {
      console.error('\n⚠️  Rate limit exceeded - wait before retrying');
    }
    
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('❌ Unexpected error:');
  console.error(error);
  process.exit(1);
});
