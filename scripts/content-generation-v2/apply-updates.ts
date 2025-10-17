/**
 * Apply Updates Module - V3
 * 
 * Part of Content Generation V3 framework.
 * Handles creating article_updates entries and appending to articles.updates JSON
 * when articles are marked as SKIP-UPDATE.
 * 
 * This module:
 * 1. Creates entry in article_updates table (for analytics/audit)
 * 2. Appends update object to articles.updates JSON array (primary storage)
 * 3. Links sources in article_update_sources
 * 4. Increments updateCount on original article
 * 
 * Usage:
 *   import { applyUpdate } from './apply-updates.js';
 *   
 *   const updateId = applyUpdate(db, {
 *     originalArticleId: 'abc123...',
 *     updateArticleId: 'def456...',
 *     updateObject: {
 *       datetime: '2025-10-14T12:00:00Z',
 *       summary: 'New victims identified',
 *       content: 'Additional organizations affected by the campaign...',
 *       sources: [
 *         { url: 'https://example.com/article', title: 'New Report' }
 *       ],
 *       severity_change: 'increased'
 *     }
 *   });
 */

import type { Database } from 'better-sqlite3';

interface ApplyUpdateParams {
  originalArticleId: string;
  updateArticleId: string;
  updateObject: {
    datetime: string;
    summary: string;
    content: string;
    sources: Array<{ url: string; title: string }>;
    severity_change: 'increased' | 'decreased' | 'unchanged';
  };
}

/**
 * Apply an update to an existing article
 * 
 * Creates entry in article_updates table, appends to articles.updates JSON array,
 * and increments updateCount on the original article.
 * 
 * @param db Database instance
 * @param params Update parameters with nested updateObject
 * @returns Update ID if successful, null if failed
 */
export function applyUpdate(
  db: Database,
  params: ApplyUpdateParams
): number | null {
  const {
    originalArticleId,
    updateArticleId,
    updateObject
  } = params;
  
  const {
    datetime,
    summary,
    content,
    sources,
    severity_change
  } = updateObject;
  
  try {
    // Start transaction
    db.prepare('BEGIN').run();
    
    // 1. Insert into article_updates (for analytics/audit trail)
    const updateResult = db.prepare(`
      INSERT INTO article_updates (
        article_id,
        datetime,
        summary,
        content,
        severity_change
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      originalArticleId,
      datetime,
      summary,
      content,
      severity_change
    );
    
    const updateId = updateResult.lastInsertRowid as number;
    
    // 2. Append to articles.updates JSON array (primary storage for website)
    const currentArticle = db.prepare(`
      SELECT updates
      FROM articles
      WHERE id = ?
    `).get(originalArticleId) as { updates: string } | undefined;
    
    // Parse current updates array (default to empty array)
    const currentUpdates = currentArticle?.updates 
      ? JSON.parse(currentArticle.updates) as Array<any>
      : [];
    
    // Append new update object
    currentUpdates.push(updateObject);
    
    // Save back to database (also update the updated_at timestamp to the full ISO datetime)
    db.prepare(`
      UPDATE articles
      SET updates = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(currentUpdates),
      datetime,  // Use full ISO timestamp, not just date
      originalArticleId
    );
    
    // 3. Link sources in article_update_sources (for backwards compatibility)
    for (const source of sources) {
      db.prepare(`
        INSERT INTO article_update_sources (
          update_id,
          article_id,
          url,
          title,
          website,
          date
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        updateId,
        updateArticleId,
        source.url || 'unknown',
        source.title || 'Source not available',
        '', // website - extract from URL if needed
        datetime
      );
    }
    
    // 4. Increment updateCount on original article
    db.prepare(`
      UPDATE articles
      SET updateCount = COALESCE(updateCount, 0) + 1,
          isUpdate = 1
      WHERE id = ?
    `).run(originalArticleId);
    
    // Commit transaction
    db.prepare('COMMIT').run();
    
    return updateId;
  } catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('❌ Failed to apply update:', error);
    return null;
  }
}

/**
 * Get all updates for an article
 * 
 * @param db Database instance
 * @param articleId Article ID
 * @returns Array of updates with source information
 */
export function getArticleUpdates(
  db: Database,
  articleId: string
): Array<{
  id: number;
  datetime: string;
  summary: string;
  content: string;
  severity_change: string;
  sources: Array<{
    article_id: string;
    url: string;
    title: string;
    website: string;
    date: string;
  }>;
}> {
  const updates = db.prepare(`
    SELECT 
      id,
      datetime,
      summary,
      content,
      severity_change
    FROM article_updates
    WHERE article_id = ?
    ORDER BY datetime DESC
  `).all(articleId) as Array<{
    id: number;
    datetime: string;
    summary: string;
    content: string;
    severity_change: string;
  }>;
  
  // Get sources for each update
  return updates.map(update => {
    const sources = db.prepare(`
      SELECT 
        article_id,
        url,
        title,
        website,
        date
      FROM article_update_sources
      WHERE update_id = ?
    `).all(update.id) as Array<{
      article_id: string;
      url: string;
      title: string;
      website: string;
      date: string;
    }>;
    
    return {
      ...update,
      sources
    };
  });
}

/**
 * Get all articles that have received updates
 * 
 * @param db Database instance
 * @returns Array of articles with their update counts
 */
export function getArticlesWithUpdates(
  db: Database
): Array<{
  id: string;
  slug: string;
  headline: string;
  updateCount: number;
  latestUpdate: string;
}> {
  return db.prepare(`
    SELECT 
      a.id,
      a.slug,
      a.headline,
      a.updateCount,
      MAX(u.datetime) as latestUpdate
    FROM articles a
    JOIN article_updates u ON a.id = u.article_id
    WHERE a.updateCount > 0
    GROUP BY a.id, a.slug, a.headline, a.updateCount
    ORDER BY latestUpdate DESC
  `).all() as Array<{
    id: string;
    slug: string;
    headline: string;
    updateCount: number;
    latestUpdate: string;
  }>;
}

/**
 * Check if updateCount and isUpdate fields exist, add if missing
 */
export function ensureUpdateFields(db: Database): void {
  try {
    // Check if updateCount column exists
    const hasUpdateCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM pragma_table_info('articles')
      WHERE name = 'updateCount'
    `).get() as { count: number };
    
    if (hasUpdateCount.count === 0) {
      console.log('📝 Adding updateCount column to articles table...');
      db.prepare(`
        ALTER TABLE articles
        ADD COLUMN updateCount INTEGER DEFAULT 0
      `).run();
    }
    
    // Check if isUpdate column exists
    const hasIsUpdate = db.prepare(`
      SELECT COUNT(*) as count
      FROM pragma_table_info('articles')
      WHERE name = 'isUpdate'
    `).get() as { count: number };
    
    if (hasIsUpdate.count === 0) {
      console.log('📝 Adding isUpdate column to articles table...');
      db.prepare(`
        ALTER TABLE articles
        ADD COLUMN isUpdate INTEGER DEFAULT 0
      `).run();
    }
  } catch (error) {
    console.error('❌ Failed to ensure update fields:', error);
    throw error;
  }
}
