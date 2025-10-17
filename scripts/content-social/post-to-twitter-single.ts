#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';
import { TwitterApi } from 'twitter-api-v2';
import { Command } from 'commander';
import 'dotenv/config';

// Tweet data structure
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

// Configuration defaults
const DEFAULT_SOURCE = './tmp/twitter/tweets.json';
const BASE_URL = 'https://cyber.netsecops.io/articles';
const IMAGE_DIR = './public/images/og-image'; // Generated OG images (used by all platforms)
const FALLBACK_IMAGE_DIR = './public/images/categories'; // Fallback to category images
const DEFAULT_DELAY_SECONDS = 10;
const TWITTER_URL_LENGTH = 23; // Twitter counts all URLs as 23 chars (t.co)

// Parse command line arguments with Commander
const program = new Command();

program
  .name('post-to-twitter-single')
  .description('Post individual article tweets to Twitter/X with OG metadata support')
  .version('2.0.0')
  .option('--dry-run', 'validate and preview tweets without posting')
  .option('--test', 'post first tweet only (for testing)')
  .option('-l, --limit <number>', 'post only first N tweets', parseInt)
  .option('-r, --range <range>', 'post tweets from START to END (format: "3" or "3-5")')
  .option('-d, --delay <seconds>', 'seconds between tweets', parseInt, DEFAULT_DELAY_SECONDS)
  .option('-s, --source <file>', 'source tweets JSON file', DEFAULT_SOURCE)
  .option('--upload-image', 'upload image directly (default: use OG metadata)')
  .addHelpText('after', `
Examples:
  $ npx tsx post-to-twitter-single.ts --dry-run
  $ npx tsx post-to-twitter-single.ts --test
  $ npx tsx post-to-twitter-single.ts --range 3       # Post only tweet #3
  $ npx tsx post-to-twitter-single.ts --range 3-3     # Post only tweet #3
  $ npx tsx post-to-twitter-single.ts --range 4-5     # Post tweets #4-5
  $ npx tsx post-to-twitter-single.ts --range 6-      # Post from #6 to end
  $ npx tsx post-to-twitter-single.ts --limit 10      # Post first 10 tweets
  `)
  .parse(process.argv);

const options = program.opts();

// Extract options with proper types
const isDryRun = options.dryRun as boolean || false;
const isTest = options.test as boolean || false;
const uploadImage = options.uploadImage as boolean || false;
const limit = options.limit as number | undefined;
const delaySeconds = options.delay as number;
const sourceFile = options.source as string;

// Parse range option
let rangeStart: number | undefined;
let rangeEnd: number | undefined;
if (options.range) {
  const rangeValue = options.range as string;
  
  // Support formats: "3", "3-3", "4-5", "6-"
  if (rangeValue.includes('-')) {
    const parts = rangeValue.split('-');
    const start = parts[0];
    const end = parts[1];
    
    if (start) {
      rangeStart = parseInt(start, 10);
    }
    if (end && end.trim()) {
      rangeEnd = parseInt(end, 10);
    }
    // If format is "6-", rangeEnd stays undefined (to end)
  } else {
    // Single number: "3" means tweet #3 only
    rangeStart = parseInt(rangeValue, 10);
    rangeEnd = rangeStart;
  }
}


/**
 * Load tweets from JSON file
 */
function loadTweets(): Tweet[] {
  try {
    const content = fs.readFileSync(sourceFile, 'utf-8');
    const tweets = JSON.parse(content);
    
    // Apply range filter (takes precedence over limit)
    if (rangeStart !== undefined) {
      const start = rangeStart - 1; // Convert to 0-indexed
      const end = rangeEnd !== undefined ? rangeEnd : tweets.length; // If no end, go to end of array
      return tweets.slice(start, end);
    }
    
    // Apply limit filter
    if (limit) {
      return tweets.slice(0, limit);
    }
    
    return tweets;
  } catch (error) {
    console.error(`❌ Failed to load tweets from ${sourceFile}`);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Validate and locate image file
 * 
 * For OG metadata mode (default):
 *   - Validates OG image exists in directory (public/images/og-image/{slug}.png)
 *   - Does NOT upload image (Twitter fetches from article page OG tags)
 *   - Errors if image missing (no fallback)
 * 
 * For upload mode (--upload_image flag):
 *   - Validates image exists for direct upload
 *   - Errors if image missing (no fallback)
 */
function validateImage(tweet: Tweet, requireUpload: boolean): { valid: boolean; path: string; error?: string } {
  // Both modes require the OG image to exist
  const ogImagePath = path.join(IMAGE_DIR, `${tweet.slug}.png`);
  const ogImageExists = fs.existsSync(ogImagePath);
  
  if (!ogImageExists) {
    return {
      valid: false,
      path: ogImagePath,
      error: `OG image not found: ${ogImagePath}`
    };
  }
  
  // If uploading, we'll use this path
  // If using OG metadata, Twitter fetches from article page
  return {
    valid: true,
    path: ogImagePath
  };
}

/**
 * Build complete tweet content with prefix and URL
 * 
 * Note: Twitter counts all URLs as 23 characters (t.co shortened length)
 * regardless of actual URL length
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
  
  // Calculate what Twitter counts
  // Prefix + space + tweet_text + 2 newlines + URL (always counted as 23)
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
 * Validate tweet meets requirements
 */
function validateTweet(tweet: Tweet, index: number): { valid: boolean; errors: string[] } {
  const { twitterChars } = buildTweetContent(tweet);
  const imageValidation = validateImage(tweet, uploadImage);
  
  const errors: string[] = [];
  
  // Check character limit (what Twitter actually counts)
  if (twitterChars > 280) {
    errors.push(`Twitter character count ${twitterChars} exceeds 280 limit`);
  }
  
  // CRITICAL: Check OG image exists (required for BOTH modes)
  // - OG metadata mode: Twitter fetches from article page, but image must exist
  // - Upload mode: Image will be uploaded, must exist
  if (!imageValidation.valid) {
    errors.push(imageValidation.error || `Image not found: ${imageValidation.path}`);
  }
  
  // Check URL is valid
  const { url } = buildTweetContent(tweet);
  if (!url.startsWith('https://')) {
    errors.push(`Invalid URL format: ${url}`);
  }
  
  const isValid = errors.length === 0;
  
  // Display validation results
  if (isValid) {
    console.log(`✅ Tweet #${index + 1}: VALID (${twitterChars}/280 chars) - OG image exists`);
  } else {
    console.log(`❌ Tweet #${index + 1}: INVALID`);
    errors.forEach(err => console.log(`   - ${err}`));
  }
  
  return { valid: isValid, errors };
}

/**
 * Display tweet preview
 */
function previewTweet(tweet: Tweet, index: number): void {
  const { fullText, twitterChars, actualChars, url } = buildTweetContent(tweet);
  const imageValidation = validateImage(tweet, uploadImage);
  
  console.log('\n' + '═'.repeat(80));
  console.log(`📝 TWEET #${index + 1} PREVIEW`);
  console.log('═'.repeat(80));
  console.log(`Slug:         ${tweet.slug}`);
  console.log(`Headline:     ${tweet.headline}`);
  console.log(`Categories:   ${tweet.categories.join(', ')}`);
  console.log(`Primary:      ${tweet.primary_category}`);
  console.log(`Severity:     ${tweet.severity}`);
  console.log(`Is Update:    ${tweet.is_update}`);
  
  if (uploadImage) {
    console.log(`Image Mode:   Upload image directly`);
    console.log(`Local Image:  ${imageValidation.path}`);
    console.log(`Image Status: ${imageValidation.valid ? '✅ Exists' : '❌ Missing'}`);
  } else {
    console.log(`Image Mode:   OG metadata (Twitter Card)`);
    const ogImageUrl = `${BASE_URL.replace('/articles', '')}/images/og-image/${tweet.slug}.png`;
    console.log(`Local Image:  ${imageValidation.path}`);
    console.log(`Image Status: ${imageValidation.valid ? '✅ Exists' : '❌ Missing'}`);
    console.log(`Public URL:   ${ogImageUrl}`);
    console.log('');
    console.log('🎴 Twitter Card Metadata (fetched by Twitter from article page):');
    console.log('─'.repeat(80));
    console.log(`  twitter:card        = "summary_large_image"`);
    console.log(`  twitter:title       = "${tweet.headline}"`);
    console.log(`  twitter:description = "${tweet.tweet_text.substring(0, 200)}${tweet.tweet_text.length > 200 ? '...' : ''}"`);
    console.log(`  twitter:image       = "${ogImageUrl}"`);
    console.log(`  twitter:image:alt   = ""`);
    console.log(`  og:url              = "${url}"`);
    console.log(`  og:type             = "article"`);
    console.log('─'.repeat(80));
    console.log('💡 Benefits: Click image → goes to article page (traffic to your site!)');
    console.log('💡 Note: Image is NOT uploaded - Twitter fetches it from article page OG tags');
  }
  
  console.log('');
  console.log(`URL:          ${url}`);
  console.log(`Actual chars: ${actualChars}`);
  console.log(`Twitter chars: ${twitterChars}/280 (URL counted as ${TWITTER_URL_LENGTH})`);
  console.log('─'.repeat(80));
  console.log('FULL TWEET CONTENT:');
  console.log('─'.repeat(80));
  console.log(fullText);
  console.log('═'.repeat(80) + '\n');
}

/**
 * Post tweet to Twitter (with or without image upload)
 */
async function postTweet(
  client: TwitterApi,
  tweet: Tweet,
  index: number
): Promise<{ success: boolean; tweetId?: string; error?: any }> {
  const { fullText, twitterChars } = buildTweetContent(tweet);
  
  console.log(`\n🐦 Posting tweet #${index + 1}...`);
  
  try {
    let result;
    
    if (uploadImage) {
      // LEGACY MODE: Upload image directly with tweet
      const { path: imagePath } = validateImage(tweet, true);
      const mediaId = await client.v1.uploadMedia(imagePath);
      
      result = await client.v2.tweet({
        text: fullText,
        media: { media_ids: [mediaId] }
      });
      
      console.log(`✅ Tweet #${index + 1} posted successfully! (${twitterChars}/280 chars)`);
      console.log(`   Tweet ID: ${result.data.id}`);
      console.log(`   Image: ${imagePath} (uploaded)`);
    } else {
      // NEW DEFAULT MODE: Let Twitter Card (OG metadata) handle the image
      result = await client.v2.tweet({
        text: fullText
      });
      
      console.log(`✅ Tweet #${index + 1} posted successfully! (${twitterChars}/280 chars)`);
      console.log(`   Tweet ID: ${result.data.id}`);
      console.log(`   OG Image: Will be fetched by Twitter from article page`);
      console.log(`   Article: ${BASE_URL}/${tweet.slug}`);
    }
    
    console.log(`   URL: https://twitter.com/i/web/status/${result.data.id}`);
    
    return {
      success: true,
      tweetId: result.data.id
    };
  } catch (error: any) {
    console.error(`❌ Failed to post tweet #${index + 1}`);
    console.error(`   Error: ${error.message || error}`);
    
    if (error.code === 403) {
      console.error('   ⚠️  Permission error - check API credentials and app permissions');
    } else if (error.code === 429) {
      console.error('   ⚠️  Rate limit exceeded - wait before retrying');
    } else if (error.code === 187) {
      console.error('   ⚠️  Duplicate tweet - already posted');
    }
    
    return {
      success: false,
      error
    };
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🐦 Twitter Single-Post Publisher\n');
  
  // Load tweets
  const tweets = loadTweets();
  
  // Show what we loaded
  if (rangeStart !== undefined) {
    const endDisplay = rangeEnd !== undefined ? rangeEnd : 'end';
    console.log(`📊 Loaded ${tweets.length} tweets from ${sourceFile} (range: ${rangeStart}-${endDisplay})\n`);
  } else if (limit) {
    console.log(`📊 Loaded ${tweets.length} tweets from ${sourceFile} (limit: ${limit})\n`);
  } else {
    console.log(`📊 Loaded ${tweets.length} tweets from ${sourceFile}\n`);
  }
  
  // Determine mode
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - Validating tweets without posting\n');
  } else if (isTest) {
    console.log('🧪 TEST MODE - Will post first tweet only\n');
  } else {
    console.log(`🚀 LIVE MODE - Will post ${tweets.length} tweets with ${delaySeconds}s delays\n`);
  }
  
  // Show image mode
  if (uploadImage) {
    console.log('📸 IMAGE MODE: Upload images directly with tweets\n');
  } else {
    console.log('🎴 IMAGE MODE: Use OG metadata (Twitter Card) - images fetched from article pages\n');
  }
  
  // Validate all tweets
  console.log('Validating tweets...\n');
  let validCount = 0;
  let invalidCount = 0;
  const validationResults: Array<{ valid: boolean; errors: string[] }> = [];
  
  for (let i = 0; i < tweets.length; i++) {
    const tweet = tweets[i];
    if (!tweet) continue;
    const result = validateTweet(tweet, i);
    validationResults.push(result);
    if (result.valid) validCount++;
    else invalidCount++;
  }
  
  console.log(`\n📊 Validation Summary: ${validCount} valid, ${invalidCount} invalid\n`);
  
  if (invalidCount > 0 && !isDryRun) {
    console.error('❌ Cannot proceed with invalid tweets. Please fix errors above or use --dry-run.');
    process.exit(1);
  }
  
  // Dry run: show previews and exit
  if (isDryRun) {
    console.log('\n📋 TWEET PREVIEWS:\n');
    tweets.forEach((tweet, index) => {
      if (tweet && validationResults[index]?.valid) {
        previewTweet(tweet, index);
      }
    });
    console.log('✅ Dry run complete. All valid tweets are ready to post.');
    console.log('\nNext steps:');
    console.log('  - Test first tweet:  npx tsx scripts/content-social/post-to-twitter-single.ts --test');
    console.log('  - Post all tweets:   npx tsx scripts/content-social/post-to-twitter-single.ts');
    return;
  }
  
  // Check environment variables
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET ||
      !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
    console.error('❌ Missing Twitter API credentials in .env:');
    console.error('   TWITTER_API_KEY');
    console.error('   TWITTER_API_SECRET');
    console.error('   TWITTER_ACCESS_TOKEN');
    console.error('   TWITTER_ACCESS_SECRET');
    console.error('\nSee: scripts/content-social/SETUP-TWITTER.md');
    process.exit(1);
  }
  
  // Initialize Twitter client
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });
  
  // Test mode: post first tweet only
  if (isTest) {
    console.log('🧪 Posting first tweet for testing...\n');
    const firstTweet = tweets[0];
    if (!firstTweet) {
      console.error('❌ No tweets found');
      process.exit(1);
    }
    
    if (!validationResults[0]?.valid) {
      console.error('❌ First tweet is invalid, cannot test');
      process.exit(1);
    }
    
    previewTweet(firstTweet, 0);
    
    const result = await postTweet(client, firstTweet, 0);
    
    if (result.success) {
      console.log('\n✅ Test tweet posted successfully!');
      console.log('\nPlease verify the tweet on Twitter and then:');
      console.log('  - Post remaining tweets: npx tsx scripts/content-social/post-to-twitter-single.ts');
      console.log(`  - Or delete test tweet and adjust content`);
    } else {
      console.error('\n❌ Test tweet failed. Please check the error above.');
      process.exit(1);
    }
    return;
  }
  
  // Live mode: post all tweets
  console.log(`🚀 Posting ${tweets.length} tweets...\n`);
  
  let successCount = 0;
  let failCount = 0;
  const results: Array<{ index: number; success: boolean; tweetId?: string }> = [];
  
  for (let i = 0; i < tweets.length; i++) {
    const tweet = tweets[i];
    if (!tweet) continue;
    
    // Skip invalid tweets
    if (!validationResults[i]?.valid) {
      console.log(`⏭️  Skipping invalid tweet #${i + 1}\n`);
      failCount++;
      continue;
    }
    
    previewTweet(tweet, i);
    
    const result = await postTweet(client, tweet, i);
    
    results.push({
      index: i,
      success: result.success,
      tweetId: result.tweetId
    });
    
    if (result.success) {
      successCount++;
    } else {
      failCount++;
      console.log('\n⚠️  Continuing with remaining tweets...\n');
    }
    
    // Delay between tweets (except for last one)
    if (i < tweets.length - 1) {
      console.log(`⏳ Waiting ${delaySeconds} seconds before next tweet...\n`);
      await sleep(delaySeconds * 1000);
    }
  }
  
  // Final summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 POSTING COMPLETE');
  console.log('═'.repeat(80));
  console.log(`✅ Successfully posted: ${successCount}/${tweets.length}`);
  console.log(`❌ Failed:             ${failCount}/${tweets.length}`);
  console.log('═'.repeat(80));
  
  // Show successful tweet URLs
  if (successCount > 0) {
    console.log('\n📎 Posted Tweets:');
    results
      .filter(r => r.success && r.tweetId)
      .forEach(r => {
        console.log(`   #${r.index + 1}: https://twitter.com/i/web/status/${r.tweetId}`);
      });
  }
  
  console.log('');
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:');
  console.error(error);
  process.exit(1);
});
