/**
 * Page SEO Composable
 * Handles all meta tags and JSON-LD structured data for static and index pages
 * 
 * Features:
 * - Populates og:title for Facebook/LinkedIn
 * - Keeps twitter:title empty (by design - image contains title)
 * - Adds twitter:site and twitter:creator
 * - Generates WebPage/CollectionPage/ItemList JSON-LD for Google rich results
 * - Adds descriptive alt text for all images
 */

interface PageSeoConfig {
  title: string
  description: string
  type?: 'WebPage' | 'CollectionPage' | 'ItemList'
  image?: string
  canonical?: string
  keywords?: string[]
}

export function usePageSeo(config: PageSeoConfig) {
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()

  // Build canonical URL
  const canonicalUrl = config.canonical || `${runtimeConfig.public.siteUrl}${route.path}`

  // Use provided image or default banner
  const ogImageUrl = config.image || `${runtimeConfig.public.siteUrl}/images/branding/banner.png`

  // Generate descriptive alt text
  const imageAltText = `${config.title} - CyberNetSec.io`

  // Default keywords if not provided
  const keywords = config.keywords || [
    'cybersecurity',
    'threat intelligence',
    'security news',
    'vulnerability reports',
    'cyber threats',
  ]

  // Set all meta tags
  useSeoMeta({
    // Basic meta
    title: `${config.title} | CyberNetSec.io`,
    description: config.description,
    keywords: keywords.join(', '),
    author: 'CyberNetSec.io',
    robots: 'index, follow, max-image-preview:large',

    // Open Graph (Facebook, LinkedIn)
    ogTitle: config.title, // ✅ POPULATED for Facebook/LinkedIn
    ogDescription: config.description,
    ogType: 'website',
    ogUrl: canonicalUrl,
    ogSiteName: 'CyberNetSec.io',
    ogImage: ogImageUrl,
    ogImageWidth: '1200',
    ogImageHeight: '675',
    ogImageAlt: imageAltText,
    ogLocale: 'en_US',

    // Twitter Card
    twitterCard: 'summary_large_image',
    twitterSite: '@CyberNetSec',
    twitterCreator: '@CyberNetSec',
    twitterTitle: '', // ✅ EMPTY by design - image contains title
    twitterDescription: config.description,
    twitterImage: ogImageUrl,
    twitterImageAlt: imageAltText,
  })

  // Determine schema type
  const schemaType = config.type || 'WebPage'

  // Base schema properties
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: config.title,
    description: config.description,
    url: canonicalUrl,
    image: ogImageUrl,
    publisher: {
      '@type': 'Organization',
      name: 'CyberNetSec.io',
      url: runtimeConfig.public.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${runtimeConfig.public.siteUrl}/logo.png`,
      },
    },
  }

  // Add schema-specific properties
  let schema: any = baseSchema
  if (schemaType === 'CollectionPage') {
    schema = {
      ...baseSchema,
      mainEntity: {
        '@type': 'ItemList',
        name: config.title,
        description: config.description,
      },
    }
  }

  // Generate JSON-LD structured data
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
        innerHTML: JSON.stringify(schema),
      },
    ],
  })
}
