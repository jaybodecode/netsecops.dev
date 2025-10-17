/**
 * Content Generation V2 - Database Schema (Main)
 * 
 * Central schema initialization - imports and initializes all sub-schemas
 */

import { initAPICallsSchema } from './schema-api-calls.js';
import { initRawSearchSchema } from './schema-raw-search.js';
import { initStructuredNewsSchema } from './schema-structured-news.js';
import { initArticleEntitySchema } from './schema-article-entities.js';
import { initArticleResolutionsSchema } from './schema-article-resolutions.js';
import { initPublicationsSchema } from './schema-publications.js';
import { initPublishedArticlesSchema } from './schema-published-articles.js';

/**
 * Initialize all database schemas
 */
export function initSchema(): void {
  initAPICallsSchema();
  initRawSearchSchema();
  initStructuredNewsSchema();
  initArticleEntitySchema();
  initArticleResolutionsSchema();
  initPublicationsSchema();
  initPublishedArticlesSchema();
  
  console.log('✅ Database schema initialized');
}

// Re-export all schema types and functions for convenience
export { 
  type APICallLog, 
  logAPICall, 
  getAPIStats 
} from './schema-api-calls.js';

export { 
  type RawSearchResult,
  type RawSearchRecord,
  saveRawSearch, 
  getRawSearch,
  getAllRawSearches
} from './schema-raw-search.js';

export {
  type StructuredNewsResult,
  type StructuredNewsRecord,
  saveStructuredNews,
  getStructuredNews,
  getStructuredNewsRecord,
  getStructuredNewsByDate,
  getAllStructuredNews,
  hasStructuredNews,
  deleteStructuredNews
} from './schema-structured-news.js';

export {
  type ArticleMetaForIndexing,
  type CVEForIndexing,
  type EntityForIndexing,
  type EntityIndexStats,
  INDEXED_ENTITY_TYPES,
  EXCLUDED_ENTITY_TYPES,
  shouldIndexEntityType,
  normalizeEntityType,
  insertArticleMeta,
  insertCVE,
  insertEntity,
  isArticleIndexed,
  getArticleMeta,
  getArticleCVEs,
  getArticleEntities,
  deleteArticleEntities,
  getEntityIndexStats
} from './schema-article-entities.js';

export {
  type ArticleResolution,
  saveArticleResolution,
  getResolutionsByDate,
  getResolutionByArticleId,
  getUpdatesToArticle,
  getResolutionStats,
  deleteResolutionsByDate
} from './schema-article-resolutions.js';

export {
  type Publication,
  createPublication,
  getPublication,
  getPublicationByDate,
  getPublicationBySlug,
  getAllPublications,
  hasPublication,
  deletePublication,
  updatePublicationArticleCount
} from './schema-publications.js';

export {
  type PublishedArticle,
  type PublicationArticle,
  type ArticleUpdate,
  createPublishedArticle,
  getPublishedArticle,
  getPublishedArticleBySlug,
  getArticlesByPublication,
  getAllPublishedArticles,
  linkArticleToPublication,
  createArticleUpdate,
  getArticleUpdates,
  getLastUpdateDate,
  hasPublishedArticle,
  deletePublishedArticle
} from './schema-published-articles.js';
