/**
 * Article SEO Composable
 * Handles all meta tags and JSON-LD structured data for article detail pages
 * 
 * Features:
 * - Populates og:title for Facebook/LinkedIn
 * - Keeps twitter:title empty (by design - image contains title)
 * - Adds twitter:site and twitter:creator
 * - Generates NewsArticle JSON-LD for Google rich results
 * - Adds descriptive alt text for all images
 */

import type { CyberArticle } from '~/types/cyber'

export function useArticleSeo(article: CyberArticle | null | undefined) {
  // Early return if no article
  if (!article) {
    return
  }

  const config = useRuntimeConfig()
  const route = useRoute()

  // Build canonical URL
  const canonicalUrl = `${config.public.siteUrl}/articles/${article.slug}`

  // Build OG image URL (absolute)
  const ogImageUrl = `${config.public.siteUrl}/images/og-image/${article.slug}.png`

  // Generate descriptive alt text
  const imageAltText = `${article.headline} - Cybersecurity threat analysis`

  // Format dates for structured data
  const publishedDate = article.pub_date 
    ? new Date(article.pub_date).toISOString()
    : article.createdAt || new Date().toISOString()

  const modifiedDate = article.updatedAt 
    ? new Date(article.updatedAt).toISOString()
    : publishedDate

  // Build enhanced keywords from multiple sources (SEARCH-FRIENDLY ONLY)
  const keywordArray = [
    // 1. Original editorial keywords
    ...(article.keywords || []),
    
    // 2. Entity names (threat actors, malware, companies, products)
    ...(article.entities?.map(e => e.name) || []),
    
    // 3. CVE identifiers (high search volume)
    ...(article.cves?.map(cve => typeof cve === 'string' ? cve : cve.id) || []),
    
    // 4. Source brand names (enables "Unit 42 malware" searches)
    ...(article.sources?.map(s => s.friendly_name).filter(Boolean) || []),
    
    // 5. Industries & countries
    ...(article.impact_scope?.industries_affected || []),
    ...(article.impact_scope?.countries_affected || []),
    
    // 6. Category & severity
    article.category?.[0],
    article.severity,
  ].filter(Boolean)

  // Deduplicate and cap at 40 keywords to avoid keyword stuffing
  const enhancedKeywords = [...new Set(keywordArray)]
    .slice(0, 40)
    .join(', ')

  // Set all meta tags
  useSeoMeta({
    // Basic meta
    title: `${article.headline} | CyberNetSec.io`,
    description: article.meta_description,
    keywords: enhancedKeywords,
    author: 'CyberNetSec.io',
    robots: 'index, follow, max-image-preview:large',

    // Open Graph (Facebook, LinkedIn)
    ogTitle: article.headline, // ✅ POPULATED for Facebook/LinkedIn
    ogDescription: article.og_description || article.meta_description,
    ogType: 'article',
    ogUrl: canonicalUrl,
    ogSiteName: 'CyberNetSec.io',
    ogImage: ogImageUrl,
    ogImageWidth: '1200',
    ogImageHeight: '675',
    ogImageAlt: imageAltText,
    ogLocale: 'en_US',

    // Article metadata
    articlePublishedTime: publishedDate,
    articleModifiedTime: modifiedDate,
    articleAuthor: ['CyberNetSec.io'],
    articleSection: article.category?.[0] || 'Cybersecurity',
    articleTag: article.tags || [],

    // Twitter Card
    twitterCard: 'summary_large_image',
    twitterSite: '@CyberNetSec',
    twitterCreator: '@CyberNetSec',
    twitterTitle: '', // ✅ EMPTY by design - image contains title
    twitterDescription: article.og_description || article.meta_description,
    twitterImage: ogImageUrl,
    twitterImageAlt: imageAltText,
  })

  // Generate NewsArticle JSON-LD structured data
  useHead({
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl,
      },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: article.headline,
          alternativeHeadline: article.title,
          image: ogImageUrl,
          datePublished: publishedDate,
          dateModified: modifiedDate,
          author: {
            '@type': 'Organization',
            name: 'CyberNetSec.io',
            url: config.public.siteUrl,
          },
          publisher: {
            '@type': 'Organization',
            name: 'CyberNetSec.io',
            url: config.public.siteUrl,
            logo: {
              '@type': 'ImageObject',
              url: `${config.public.siteUrl}/logo.png`,
            },
          },
          description: article.meta_description,
          articleSection: article.category?.[0] || 'Cybersecurity',
          keywords: enhancedKeywords,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
          },
        }),
      },
    ],
  })
}
