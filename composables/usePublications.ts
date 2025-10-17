// Composables for publications data fetching (pure JSON)

import type { Publication, PublicationMetadata } from '~/types/cyber';

/**
 * Publications Index Structure
 */
export interface PublicationsIndex {
  publications: PublicationMetadata[];
  totalCount: number;
  lastUpdated: string;
}

/**
 * Fetch Publications Index
 * Returns list of all publication metadata for listing pages
 */
export function usePublicationsIndex() {
  return useAsyncData<PublicationsIndex>(
    'publications-index',
    async () => {
      // During SSR/prerender, use API route (reads from filesystem)
      // On client in static mode, fetch directly from /data/ directory
      if (import.meta.server) {
        return await $fetch('/api/data/publications-index')
      } else {
        // Client-side: fetch from static file
        return await $fetch('/data/publications-index.json')
      }
    },
    {
      transform: (data) => ({
        publications: data.publications || [],
        totalCount: data.totalCount || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      }),
      getCachedData: (key) => {
        return useNuxtData(key).data.value
      }
    }
  );
}

/**
 * Fetch Single Publication by Slug
 * Returns full publication with embedded article metadata
 * 
 * NOTE: Publication filenames match slugs exactly
 * Filename pattern: {slug}.json (e.g., daily-cybersecurity-briefing-2025-10-15.json)
 */
export function usePublication(slug: string) {
  return useAsyncData<Publication>(
    `publication-${slug}`,
    async () => {
      // Determine the correct endpoint based on environment
      const endpoint = import.meta.server
        ? `/api/data/publications/${slug}`
        : `/data/publications/${slug}.json`;
      
      // Fetch the full publication directly by slug (files are named by slug)
      return await $fetch<Publication>(endpoint);
    }
  );
}
