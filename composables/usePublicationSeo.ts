/**
 * Publication SEO Composable
 * Handles all meta tags and JSON-LD structured data for publication detail pages
 * 
 * Features:
 * - Populates og:title for Facebook/LinkedIn
 * - Keeps twitter:title empty (by design - image contains title)
 * - Adds twitter:site and twitter:creator
 * - Generates Report/TechArticle JSON-LD for Google rich results
 * - Adds descriptive alt text for all images
 */

import type { CyberPublication } from '~/types/cyber'

export function usePublicationSeo(publication: CyberPublication | null | undefined) {
  // Early return if no publication
  if (!publication) {
    return
  }

  const config = useRuntimeConfig()
  const route = useRoute()

  // Get publication slug from route or generate from pub_id
  const slug = route.params.slug as string || publication.slug || publication.pub_id

  // Build canonical URL
  const canonicalUrl = `${config.public.siteUrl}/publications/${slug}`

  // Build OG image URL (absolute) - try generated card first
  const ogImageUrl = `${config.public.siteUrl}/images/og-image/${slug}.png`

  // Generate descriptive alt text
  const imageAltText = `${publication.headline} - Cybersecurity publication`

  // Format dates for structured data
  const publishedDate = publication.pub_date 
    ? new Date(publication.pub_date).toISOString()
    : publication.generated_at || new Date().toISOString()

  // Publication type label for description
  const typeLabels: Record<string, string> = {
    'daily': 'Daily Cybersecurity Digest',
    'weekly': 'Weekly Cybersecurity Digest',
    'monthly': 'Monthly Cybersecurity Roundup',
    'special-report': 'Special Cybersecurity Report',
  }
  const typeLabel = typeLabels[publication.type || 'daily'] || 'Cybersecurity Publication'

  // Generate keywords from publication metadata
  const keywords = [
    'cybersecurity digest',
    'threat intelligence',
    'security briefing',
    ...(publication.type ? [publication.type.replace('-', ' ')] : []),
    'vulnerability report',
    'cyber threats',
  ].filter(Boolean).slice(0, 10)

  // Set all meta tags
  useSeoMeta({
    // Basic meta
    title: `${publication.headline} | CyberNetSec.io`,
    description: publication.summary,
    keywords: keywords.join(', '),
    author: 'CyberNetSec.io',
    robots: 'index, follow, max-image-preview:large',

    // Open Graph (Facebook, LinkedIn)
    ogTitle: publication.headline, // ✅ POPULATED for Facebook/LinkedIn
    ogDescription: publication.summary,
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
    articleModifiedTime: publishedDate,
    articleAuthor: ['CyberNetSec.io'],
    articleSection: publication.type || 'Cybersecurity',
    articleTag: keywords,

    // Twitter Card
    twitterCard: 'summary_large_image',
    twitterSite: '@CyberNetSec',
    twitterCreator: '@CyberNetSec',
    twitterTitle: '', // ✅ EMPTY by design - image contains title
    twitterDescription: publication.summary,
    twitterImage: ogImageUrl,
    twitterImageAlt: imageAltText,
  })

  // Generate Report JSON-LD structured data
  // Using 'Report' schema for publications/digests
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
          '@type': 'Report',
          headline: publication.headline,
          abstract: publication.summary,
          image: ogImageUrl,
          datePublished: publishedDate,
          dateModified: publishedDate,
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
          description: publication.summary,
          genre: typeLabel,
          keywords: keywords.join(', '),
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
          },
          // Additional report-specific fields
          reportNumber: publication.pub_id,
          numberOfPages: publication.articles?.length || publication.total_articles || 0,
        }),
      },
    ],
  })
}
