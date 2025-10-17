#!/usr/bin/env node
/**
 * Consolidate Individual Tweet JSON Files into Master tweets.json
 * 
 * This script reads all individual tweet JSON files (output-*.json) from
 * tmp/twitter/outputs/ and combines them into a single tweets.json array.
 * 
 * This is the pattern we'll use when pulling from database - one article
 * at a time to conserve LLM tokens, then consolidate into final JSON.
 * 
 * Usage:
 *   npx tsx scripts/content-social/consolidate-tweets.ts
 *   npx tsx scripts/content-social/consolidate-tweets.ts --input tmp/twitter/outputs --output tmp/twitter/tweets.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

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

interface ConsolidationStats {
  total: number;
  underLimit: number;
  overLimit: number;
  avgChars: number;
  maxChars: number;
  minChars: number;
  hashtagCounts: Record<number, number>;
}

const TWITTER_CHAR_LIMIT = 280;
const PREFIX_LENGTH = 13; // "🚨 BREAKING: " (13 chars)
const SPACE_AFTER_PREFIX = 1; // Space between prefix and tweet text
const URL_LENGTH = 23; // Twitter's t.co shortened URL length
const NEWLINE_LENGTH = 2; // \n\n before URL

function calculateTwitterChars(tweetText: string): number {
  return PREFIX_LENGTH + SPACE_AFTER_PREFIX + tweetText.length + NEWLINE_LENGTH + URL_LENGTH;
}

function countHashtags(text: string): number {
  const matches = text.match(/#\w+/g);
  return matches ? matches.length : 0;
}

function consolidateTweets(inputDir: string, outputFile: string): void {
  console.log('📦 Tweet Consolidation Script\n');
  console.log(`📂 Input directory: ${inputDir}`);
  console.log(`📄 Output file: ${outputFile}\n`);

  // Read all JSON files from input directory
  const files = readdirSync(inputDir)
    .filter(f => f.match(/^output-\d+\.json$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)![0]);
      const numB = parseInt(b.match(/\d+/)![0]);
      return numA - numB;
    });

  if (files.length === 0) {
    console.error('❌ No output-*.json files found in', inputDir);
    process.exit(1);
  }

  console.log(`📋 Found ${files.length} tweet files\n`);

  // Load and validate each tweet
  const tweets: Tweet[] = [];
  const stats: ConsolidationStats = {
    total: 0,
    underLimit: 0,
    overLimit: 0,
    avgChars: 0,
    maxChars: 0,
    minChars: Infinity,
    hashtagCounts: {},
  };

  let totalChars = 0;

  files.forEach((file, index) => {
    const filePath = join(inputDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const tweet: Tweet = JSON.parse(content);

    // Calculate Twitter character count
    const twitterChars = calculateTwitterChars(tweet.tweet_text);
    const isOverLimit = twitterChars > TWITTER_CHAR_LIMIT;

    // Update stats
    stats.total++;
    totalChars += tweet.tweet_text.length;
    stats.maxChars = Math.max(stats.maxChars, tweet.tweet_text.length);
    stats.minChars = Math.min(stats.minChars, tweet.tweet_text.length);

    if (isOverLimit) {
      stats.overLimit++;
    } else {
      stats.underLimit++;
    }

    // Count hashtags
    const hashtagCount = countHashtags(tweet.tweet_text);
    stats.hashtagCounts[hashtagCount] = (stats.hashtagCounts[hashtagCount] || 0) + 1;

    // Update char_count in tweet object
    tweet.char_count = tweet.tweet_text.length;

    // Log each tweet
    const status = isOverLimit ? '❌ OVER' : '✅';
    const overBy = isOverLimit ? ` (over by ${twitterChars - TWITTER_CHAR_LIMIT})` : '';
    console.log(
      `${status} Tweet #${index + 1}: ${tweet.tweet_text.length} chars → TOTAL: ${twitterChars}${overBy}`
    );

    tweets.push(tweet);
  });

  stats.avgChars = Math.round(totalChars / stats.total);

  // Write consolidated JSON
  const outputJSON = JSON.stringify(tweets, null, 2);
  writeFileSync(outputFile, outputJSON, 'utf-8');

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CONSOLIDATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ Total tweets: ${stats.total}`);
  console.log(`✅ Under 280 limit: ${stats.underLimit}`);
  console.log(`❌ Over 280 limit: ${stats.overLimit}\n`);

  console.log('📏 Character Stats:');
  console.log(`   • Average: ${stats.avgChars} chars`);
  console.log(`   • Min: ${stats.minChars} chars`);
  console.log(`   • Max: ${stats.maxChars} chars\n`);

  console.log('🏷️  Hashtag Distribution:');
  Object.entries(stats.hashtagCounts)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([count, tweets]) => {
      console.log(`   • ${count} hashtags: ${tweets} tweets`);
    });

  console.log(`\n✅ Consolidated ${stats.total} tweets to ${outputFile}\n`);

  if (stats.overLimit > 0) {
    console.log('⚠️  WARNING: Some tweets exceed 280 character limit!');
    console.log('   Run the posting script with --dry-run to see which ones need trimming.\n');
    process.exit(1);
  } else {
    console.log('🎉 All tweets are within character limits!\n');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let inputDir = 'tmp/twitter/outputs';
let outputFile = 'tmp/twitter/tweets.json';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--input' && args[i + 1]) {
    inputDir = args[i + 1]!;
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputFile = args[i + 1]!;
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Tweet Consolidation Script

Combines individual tweet JSON files into a single master file.
This mirrors the pattern we'll use when pulling from database.

Usage:
  npx tsx scripts/content-social/consolidate-tweets.ts [options]

Options:
  --input DIR     Input directory with output-*.json files (default: tmp/twitter/outputs)
  --output FILE   Output consolidated JSON file (default: tmp/twitter/tweets.json)
  --help, -h      Show this help message

Example:
  npx tsx scripts/content-social/consolidate-tweets.ts
  npx tsx scripts/content-social/consolidate-tweets.ts --input tmp/twitter/outputs --output tmp/twitter/tweets.json
`);
    process.exit(0);
  }
}

// Run consolidation
consolidateTweets(inputDir, outputFile);
