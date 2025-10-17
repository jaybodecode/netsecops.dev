/**
 * Social Media Publishing - Platform-Specific Formatters
 * 
 * Format publication/article content for different social platforms.
 */

import type { PublicationWithArticles, ArticleWithTwitterPost } from './db.js';
import type { PublishedArticle } from '../../content-generation-v2/database/schema-published-articles.js';
import { 
  truncateText, 
  getFirstSentence, 
  formatDateShort,
  positionEmoji,
  calculateTweetLength
} from './truncate.js';

const WEBSITE_BASE_URL = process.env.WEBSITE_BASE_URL || 'https://cybernetsec.io';

/**
 * Twitter/X Thread Formatter
 * 
 * Format: 7 tweets
 *  1. Intro (publication headline + summary)
 *  2-6. Top 5 articles (one per tweet)
 *  7. Closing (link to full report)
 */
export interface TwitterThread {
  tweets: string[];
  metadata: {
    publication_id: string;
    pub_date: string;
    article_count: number;
  };
}

/**
 * Format publication as Twitter thread
 * 
 * @param data - Publication with articles
 * @param articleLimit - Number of articles to include (default: 5)
 * @returns Twitter thread object
 */
export function formatTwitterThread(
  data: PublicationWithArticles,
  articleLimit: number = 5
): TwitterThread {
  const { publication, articles } = data;
  const tweets: string[] = [];
  
  // Sort articles by position, take top N
  const topArticles = articles
    .sort((a, b) => a.position - b.position)
    .slice(0, articleLimit);
  
  // Tweet 1: Intro
  const introTweet = buildIntroTweet(publication, topArticles.length);
  tweets.push(introTweet);
  
  // Tweets 2-6: Articles
  topArticles.forEach((article, idx) => {
    const articleTweet = buildArticleTweet(article, idx + 1, topArticles.length);
    tweets.push(articleTweet);
  });
  
  // Tweet 7: Closing
  const closingTweet = buildClosingTweet(publication);
  tweets.push(closingTweet);
  
  return {
    tweets,
    metadata: {
      publication_id: publication.id,
      pub_date: publication.pub_date,
      article_count: topArticles.length
    }
  };
}

/**
 * Build intro tweet (Tweet 1)
 * 
 * Format:
 * 🚨 Today's Cyber Threat Report - {date}
 * 
 * {summary (truncated)}
 * 
 * Top {N} threats below 🧵👇
 * 
 * #CyberSecurity #ThreatIntel
 */
function buildIntroTweet(publication: any, articleCount: number): string {
  const date = formatDateShort(publication.pub_date);
  const header = `🚨 Today's Cyber Threat Report - ${date}`;
  const footer = `Top ${articleCount} threats below 🧵👇`;
  const hashtags = '#CyberSecurity #ThreatIntel';
  
  // Calculate available space for summary
  const fixedLength = header.length + footer.length + hashtags.length + 6; // 6 for newlines
  const maxSummaryLength = 280 - fixedLength;
  
  const summary = truncateText(publication.summary, maxSummaryLength);
  
  return `${header}\n\n${summary}\n\n${footer}\n\n${hashtags}`;
}

/**
 * Build article tweet (Tweets 2-6)
 * 
 * Uses pre-generated twitter_post from database (LLM-generated, already optimized for Twitter)
 * 
 * Format:
 * {position}/{total}: {twitter_post (truncated to fit)}
 * 
 * 🔗 {url}
 */
function buildArticleTweet(article: ArticleWithTwitterPost, position: number, total: number): string {
  const positionText = `${position}/${total}:`;
  const url = `${WEBSITE_BASE_URL}/articles/${article.slug}`;
  
  let content = article.twitter_post?.trim() || article.headline;
  let tweet = `${positionText} ${content}\n\n🔗 ${url}`;
  
  // Truncate if needed (progressively reduce by 10% each iteration)
  let iterations = 0;
  const initialLength = calculateTweetLength(tweet);
  console.log(`🔧 Tweet ${position} initial: ${initialLength} chars`);
  
  while (calculateTweetLength(tweet) > 280 && iterations < 20) {
    const currentLength = calculateTweetLength(tweet);
    console.log(`   Iteration ${iterations + 1}: ${currentLength} chars, reducing...`);
    const newLength = Math.floor(content.length * 0.9);
    content = truncateText(content, newLength);
    tweet = `${positionText} ${content}\n\n🔗 ${url}`;
    iterations++;
  }
  
  if (iterations > 0) {
    console.log(`   ✅ Final: ${calculateTweetLength(tweet)} chars after ${iterations} iterations`);
  }
  
  return tweet;
}

/**
 * Build closing tweet (Tweet 7)
 * 
 * Format:
 * 📰 Read the full report with sources, CVEs, and MITRE ATT&CK mappings:
 * 
 * 🔗 {url}
 * 
 * Stay safe out there! 🛡️
 * 
 * #CyberSecurity #InfoSec #ThreatIntel
 */
function buildClosingTweet(publication: any): string {
  const pubSlug = publication.slug || `daily-threat-report-${publication.pub_date}`;
  const url = `${WEBSITE_BASE_URL}/publications/${pubSlug}`;
  
  const text = `📰 Read the full report with sources, CVEs, and MITRE ATT&CK mappings:\n\n🔗 ${url}\n\nStay safe out there! 🛡️\n\n#CyberSecurity #InfoSec #ThreatIntel`;
  
  return text;
}

/**
 * Validate thread tweets (all must be ≤280 chars)
 * 
 * @param thread - Twitter thread
 * @returns True if all tweets valid, false otherwise
 */
export function validateTwitterThread(thread: TwitterThread): boolean {
  let valid = true;
  
  thread.tweets.forEach((tweet, idx) => {
    if (tweet.length > 280) {
      console.error(`❌ Tweet ${idx + 1} is too long: ${tweet.length} chars`);
      console.error(`   Content: ${tweet.slice(0, 100)}...`);
      valid = false;
    }
  });
  
  return valid;
}

/**
 * Preview thread in console
 * 
 * @param thread - Twitter thread
 */
export function previewTwitterThread(thread: TwitterThread): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 TWITTER THREAD PREVIEW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  thread.tweets.forEach((tweet, idx) => {
    console.log(`Tweet ${idx + 1}/${thread.tweets.length} (${tweet.length} chars):`);
    console.log('┌─────────────────────────────────────────────────┐');
    console.log(tweet.split('\n').map(line => `│ ${line.padEnd(49)} │`).join('\n'));
    console.log('└─────────────────────────────────────────────────┘\n');
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Publication: ${thread.metadata.publication_id}`);
  console.log(`Date: ${thread.metadata.pub_date}`);
  console.log(`Articles: ${thread.metadata.article_count}`);
  console.log(`Total tweets: ${thread.tweets.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
