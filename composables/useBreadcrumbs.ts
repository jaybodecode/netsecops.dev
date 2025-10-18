/**
 * Breadcrumbs Composable
 * Generates BreadcrumbList JSON-LD structured data for SEO
 * 
 * Usage:
 * useBreadcrumbs([
 *   { name: 'Home', url: '/' },
 *   { name: 'Articles', url: '/articles' },
 *   { name: 'Article Title', url: '/articles/slug' }
 * ])
 * 
 * Features:
 * - Generates BreadcrumbList schema for Google rich results
 * - Supports multiple breadcrumb levels
 * - Automatic position numbering
 * - Absolute URLs for all items
 */

interface BreadcrumbItem {
  name: string
  url: string
}

export function useBreadcrumbs(items: BreadcrumbItem[]) {
  const runtimeConfig = useRuntimeConfig()
  const baseUrl = runtimeConfig.public.siteUrl

  // Build breadcrumb list items with absolute URLs
  const breadcrumbItems = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
  }))

  // Generate BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  // Add to page head
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(breadcrumbSchema),
      },
    ],
  })
}
