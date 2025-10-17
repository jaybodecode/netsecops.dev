/**
 * Social Media Publishing - Database Query Helpers
 * 
 * Reusable functions to query publications and articles from the V2 pipeline database.
 * No LLM calls needed - all content already exists in database.
 */

import { getDB } from '../../content-generation-v2/database/index.js';
import { 
  getPublicationByDate, 
  getAllPublications
} from '../../content-generation-v2/database/schema-publications.js';
import type { Publication } from '../../content-generation-v2/database/schema-publications.js';
import { 
  getArticlesByPublication
} from '../../content-generation-v2/database/schema-published-articles.js';
import type { PublishedArticle } from '../../content-generation-v2/database/schema-published-articles.js';

export interface PublicationWithArticles {
  publication: Publication;
  articles: ArticleWithTwitterPost[];
}

export interface ArticleWithTwitterPost extends PublishedArticle {
  twitter_post?: string;
}

/**
 * Get latest publication with all articles
 * 
 * @returns Latest publication with articles (including twitter_post), or null if none found
 */
export function getLatestPublication(): PublicationWithArticles | null {
  const publications = getAllPublications(1);
  if (publications.length === 0) {
    console.log('❌ No publications found in database');
    return null;
  }
  
  const publication = publications[0];
  if (!publication) {
    console.log('❌ No publications found in database');
    return null;
  }
  
  // Get articles with twitter_post from articles table
  const articles = getArticlesWithTwitterPost(publication.id);
  
  if (articles.length === 0) {
    console.log(`⚠️  Publication ${publication.id} has no articles`);
    return null;
  }
  
  return { publication, articles };
}

/**
 * Get publication for specific date
 * 
 * @param date - Publication date (YYYY-MM-DD format)
 * @returns Publication with articles (including twitter_post), or null if not found
 */
export function getPublicationForDate(date: string): PublicationWithArticles | null {
  const publication = getPublicationByDate(date);
  if (!publication) {
    console.log(`❌ No publication found for date: ${date}`);
    return null;
  }
  
  // Get articles with twitter_post from articles table
  const articles = getArticlesWithTwitterPost(publication.id);
  
  if (articles.length === 0) {
    console.log(`⚠️  Publication ${publication.id} has no articles`);
    return null;
  }
  
  return { publication, articles };
}

/**
 * Get articles with twitter_post field from articles table
 * Joins published_articles with articles to get twitter_post
 */
function getArticlesWithTwitterPost(publicationId: string): ArticleWithTwitterPost[] {
  const db = getDB();
  
  const stmt = db.prepare(`
    SELECT 
      pa.*,
      a.twitter_post
    FROM published_articles pa
    LEFT JOIN articles a ON pa.id = a.id
    WHERE pa.publication_id = ?
    ORDER BY pa.position
  `);
  
  return stmt.all(publicationId) as ArticleWithTwitterPost[];
}

/**
 * Get top N articles from publication (by position)
 * 
 * @param publication - Publication with articles
 * @param limit - Number of articles to return (default: 5)
 * @returns Top N articles sorted by position
 */
export function getTopArticles(
  publication: PublicationWithArticles,
  limit: number = 5
): PublishedArticle[] {
  return publication.articles
    .sort((a, b) => a.position - b.position)
    .slice(0, limit);
}

/**
 * Get articles by severity
 * 
 * NOTE: Severity is not in published_articles table (normalized schema).
 * Need to query from articles_meta or structured_news.data JSON.
 * This is a placeholder for future enhancement.
 * 
 * @param publication - Publication with articles
 * @param severity - Severity level ('critical', 'high', 'medium', 'low')
 * @returns Filtered articles (currently returns all - TODO: implement)
 */
export function getArticlesBySeverity(
  publication: PublicationWithArticles,
  severity: 'critical' | 'high' | 'medium' | 'low'
): PublishedArticle[] {
  // TODO: Query severity from structured_news.data JSON or add to published_articles
  console.warn('⚠️  Severity filtering not yet implemented - returning all articles');
  return publication.articles;
}

/**
 * Check if publication was already posted to platform
 * 
 * @param platform - Platform name ('twitter', 'linkedin', 'medium')
 * @param publicationId - Publication ID
 * @param postType - Post type ('thread', 'digest', 'article')
 * @returns True if already posted, false otherwise
 */
export function hasBeenPosted(
  platform: string,
  publicationId: string,
  postType: string
): boolean {
  const db = getDB();
  
  // Check if social_posts table exists
  const tableExists = db.prepare(`
    SELECT COUNT(*) as count 
    FROM sqlite_master 
    WHERE type='table' AND name='social_posts'
  `).get() as { count: number };
  
  if (tableExists.count === 0) {
    // Table doesn't exist yet - assume not posted
    return false;
  }
  
  const result = db.prepare(`
    SELECT COUNT(*) as count 
    FROM social_posts 
    WHERE platform = ? AND publication_id = ? AND post_type = ?
  `).get(platform, publicationId, postType) as { count: number };
  
  return result.count > 0;
}

/**
 * Record successful post to social platform
 * 
 * @param platform - Platform name ('twitter', 'linkedin', 'medium')
 * @param publicationId - Publication ID (for threads/digests)
 * @param postType - Post type ('thread', 'digest', 'article')
 * @param postId - Platform-specific post ID
 * @param postUrl - Direct link to post
 * @param articleId - Article ID (optional, for individual article posts)
 */
export function recordPost(
  platform: string,
  publicationId: string | null,
  postType: string,
  postId: string,
  postUrl: string,
  articleId?: string | null
): void {
  const db = getDB();
  
  // Ensure social_posts table exists
  initSocialPostsTable();
  
  try {
    db.prepare(`
      INSERT INTO social_posts (
        platform, publication_id, article_id, post_type, post_id, post_url, posted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      platform,
      publicationId,
      articleId || null,
      postType,
      postId,
      postUrl,
      new Date().toISOString()
    );
    
    console.log(`✅ Recorded ${platform} post: ${postUrl}`);
  } catch (error) {
    console.error(`❌ Failed to record post:`, error);
    throw error;
  }
}

/**
 * Initialize social_posts table (if not exists)
 */
export function initSocialPostsTable(): void {
  const db = getDB();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      publication_id TEXT,
      article_id TEXT,
      post_type TEXT NOT NULL,
      post_id TEXT NOT NULL,
      post_url TEXT NOT NULL,
      posted_at TEXT NOT NULL,
      engagement_metrics TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (publication_id) REFERENCES publications(id),
      FOREIGN KEY (article_id) REFERENCES published_articles(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_social_posts_platform 
      ON social_posts(platform);
    
    CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at 
      ON social_posts(posted_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_social_posts_publication 
      ON social_posts(publication_id);
    
    CREATE INDEX IF NOT EXISTS idx_social_posts_article 
      ON social_posts(article_id);
  `);
}

/**
 * Get all posts for a platform (recent first)
 * 
 * @param platform - Platform name ('twitter', 'linkedin', 'medium')
 * @param limit - Number of posts to return (default: 10)
 * @returns Array of post records
 */
export function getRecentPosts(platform: string, limit: number = 10) {
  const db = getDB();
  
  const tableExists = db.prepare(`
    SELECT COUNT(*) as count 
    FROM sqlite_master 
    WHERE type='table' AND name='social_posts'
  `).get() as { count: number };
  
  if (tableExists.count === 0) {
    return [];
  }
  
  return db.prepare(`
    SELECT * FROM social_posts
    WHERE platform = ?
    ORDER BY posted_at DESC
    LIMIT ?
  `).all(platform, limit);
}

/**
 * CLI tool - Show latest publication info
 * Run: npx tsx scripts/content-social/lib/db.ts --show-latest
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--show-latest')) {
    const data = getLatestPublication();
    
    if (data) {
      console.log('\n📰 Latest Publication:\n');
      console.log(`ID: ${data.publication.id}`);
      console.log(`Date: ${data.publication.pub_date}`);
      console.log(`Headline: ${data.publication.headline}`);
      console.log(`Summary: ${data.publication.summary}`);
      console.log(`Articles: ${data.articles.length}\n`);
      
      console.log('📄 Articles:\n');
      data.articles.forEach((article, idx) => {
        console.log(`${idx + 1}. [${article.position}] ${article.headline}`);
        console.log(`   Slug: ${article.slug}`);
        console.log(`   Summary: ${article.summary.slice(0, 100)}...`);
        console.log('');
      });
    }
  } else if (args.includes('--date')) {
    const dateIndex = args.indexOf('--date');
    const date = args[dateIndex + 1];
    
    if (!date) {
      console.error('❌ --date requires a date argument (YYYY-MM-DD)');
      process.exit(1);
    }
    
    const data = getPublicationForDate(date);
    
    if (data) {
      console.log(`\n📰 Publication for ${date}:\n`);
      console.log(`ID: ${data.publication.id}`);
      console.log(`Headline: ${data.publication.headline}`);
      console.log(`Articles: ${data.articles.length}\n`);
    }
  } else if (args.includes('--recent-posts')) {
    const platformIndex = args.indexOf('--platform');
    const platform = platformIndex >= 0 ? args[platformIndex + 1] || 'twitter' : 'twitter';
    
    console.log(`\n📱 Recent ${platform} posts:\n`);
    
    const posts = getRecentPosts(platform, 5);
    
    if (posts.length === 0) {
      console.log('No posts found');
    } else {
      posts.forEach((post: any) => {
        console.log(`${post.posted_at}: ${post.post_type}`);
        console.log(`  ${post.post_url}\n`);
      });
    }
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/content-social/lib/db.ts --show-latest');
    console.log('  npx tsx scripts/content-social/lib/db.ts --date YYYY-MM-DD');
    console.log('  npx tsx scripts/content-social/lib/db.ts --recent-posts [--platform twitter]');
  }
}
