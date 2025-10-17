/**
 * Composables for fetching article data from JSON files
 * No Firebase dependency - pure static JSON fetching
 */

// Import types from our main schema
import type { CyberArticle } from '~/types/cyber'

/**
 * Lightweight article metadata for listings
 * Maps from ArticleSummary schema to UI-friendly format
 */
export interface ArticleMetadata {
  id: string
  slug?: string                      // SEO-friendly URL slug
  title: string
  headline: string
  createdAt: string                  // Article creation timestamp
  updatedAt: string                  // Article last updated timestamp
  severity?: string                  // critical | high | medium | low | informational
  article_type?: string              // NewsArticle | TechArticle | Report | Analysis | Advisory | Unknown
  excerpt: string                    // Short preview excerpt
  summary?: string                   // Full summary
  tags: string[]
  categories: string[]               // Article categories
  author?: {
    name: string
    role?: string
    avatar?: string
  }
  readingTime: number               // Reading time in minutes
  imageUrl?: string                 // Featured image URL
  isUpdate: boolean                 // True if article was updated
  cves?: string[]                   // CVE IDs
  cvssScore?: number                // Highest CVSS score
  cvssVersion?: string              // CVSS version
  threatActor?: {
    name: string
    aliases?: string[]
  }
  affectedSystems?: string[]        // Affected systems/products
  mitreAttack?: {
    tactics?: string[]
    techniques?: string[]
  }
}

export interface ArticlesIndex {
  articles: ArticleMetadata[]
  totalCount: number
  lastUpdated: string
}

// Use the main CyberArticle type from schema
export type Article = CyberArticle

/**
 * Fetch the articles index (metadata only)
 * Lightweight for listing pages
 * Note: articles-index.json uses the legacy format for UI compatibility
 */
export function useArticlesIndex() {
  return useAsyncData<ArticlesIndex>(
    'articles-index',
    async () => {
      // During SSR/prerender, use API route (reads from filesystem)
      // On client in static mode, fetch directly from /data/ directory
      if (import.meta.server) {
        return await $fetch('/api/data/articles-index')
      } else {
        // Client-side: fetch from static file
        return await $fetch('/data/articles-index.json')
      }
    },
    {
      transform: (data: ArticlesIndex) => ({
        articles: data.articles || [],
        totalCount: data.totalCount || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      }),
      getCachedData: (key: string) => {
        return useNuxtData(key).data.value
      }
    }
  )
}

/**
 * Fetch all articles dynamically from individual JSON files
 * Uses the new CyberArticle schema and transforms to UI-friendly format
 */
export function useAllArticles() {
  return useFetch<ArticleMetadata[]>('/api/articles/all', {
    key: 'all-articles',
    server: import.meta.dev, // Enable server-side caching in development
    getCachedData: (key: string) => {
      return useNuxtData(key).data.value
    }
  })
}

/**
 * UI-friendly article type (transformed from CyberArticle)
 */
export interface TransformedArticle extends CyberArticle {
  // Additional computed fields for UI
  publishedAt: string
  excerpt: string
  categories: string[]
  readingTime: number
  imageUrl?: string
  content: string
  severity?: string
  author?: {
    name: string
    role: string
  }
}

/**
 * Fetch a single article by slug (full content)
 * Uses $fetch to avoid Vue Router conflicts with static JSON files
 * 
 * NOTE: Article filenames match slugs exactly
 * Filename pattern: {slug}.json (e.g., chinese-apt-flax-typhoon-creates-persistent-backdoor-in-arcgis-servers.json)
 */
export function useArticleBySlug(slug: string) {
  return useAsyncData<CyberArticle>(
    `article-slug-${slug}`,
    async () => {
      // Determine the correct endpoint based on environment
      const endpoint = import.meta.server
        ? `/api/data/articles/${slug}`
        : `/data/articles/${slug}.json`;
      
      // Fetch the full article directly by slug (files are named by slug)
      const data = await $fetch<CyberArticle>(endpoint)
      
      // Return the article data as-is without transformation
      // The new schema already has all the fields we need
      return data
    }
  )
}

/**
 * Legacy function - kept for backward compatibility during transition
 * @deprecated Use useArticleBySlug instead for SEO-friendly URLs
 */
export function useArticle(id: string) {
  // For now, redirect to slug-based lookup
  // In most cases, if someone passes an ID, we'll treat it as a slug
  // This maintains compatibility while moving to slug-based routing
  return useArticleBySlug(id)
}
