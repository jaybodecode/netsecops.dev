import { defineEventHandler } from 'h3'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const siteUrl = 'https://cyber.netsecops.io'
  
  const urls: Array<{
    loc: string
    lastmod?: string
    changefreq?: string
    priority?: number
  }> = []

  // Add static pages
  urls.push(
    { loc: '/', changefreq: 'hourly', priority: 1.0 },
    { loc: '/articles', changefreq: 'hourly', priority: 0.9 },
    { loc: '/publications', changefreq: 'daily', priority: 0.9 },
    { loc: '/privacy-policy', changefreq: 'monthly', priority: 0.3 },
    { loc: '/terms-of-service', changefreq: 'monthly', priority: 0.3 },
    { loc: '/disclaimer', changefreq: 'monthly', priority: 0.3 }
  )

  // Add article routes
  try {
    const articlesDir = join(process.cwd(), 'public/data/articles')
    const files = await readdir(articlesDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    for (const file of jsonFiles) {
      try {
        const filePath = join(articlesDir, file)
        const content = await readFile(filePath, 'utf-8')
        const article = JSON.parse(content)
        
        if (article.slug) {
          urls.push({
            loc: `/articles/${article.slug}`,
            lastmod: article.updatedAt || article.createdAt,
            changefreq: 'daily',
            priority: 0.8,
          })
        }
      } catch (err) {
        console.warn(`Failed to parse article file: ${file}`)
      }
    }
  } catch (error) {
    console.warn('Failed to read articles directory:', error)
  }

  // Add publication routes
  try {
    const pubsDir = join(process.cwd(), 'public/data/publications')
    const files = await readdir(pubsDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    for (const file of jsonFiles) {
      try {
        const filePath = join(pubsDir, file)
        const content = await readFile(filePath, 'utf-8')
        const publication = JSON.parse(content)
        
        if (publication.slug) {
          urls.push({
            loc: `/publications/${publication.slug}`,
            lastmod: publication.updatedAt || publication.pub_date,
            changefreq: 'weekly',
            priority: 0.7,
          })
        }
      } catch (err) {
        console.warn(`Failed to parse publication file: ${file}`)
      }
    }
  } catch (error) {
    console.warn('Failed to read publications directory:', error)
  }

  // Generate XML
  const urlEntries = urls
    .map((url) => {
      const loc = `${siteUrl}${url.loc}`
      const lastmod = url.lastmod ? `\n    <lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ''
      const changefreq = url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : ''
      const priority = url.priority !== undefined ? `\n    <priority>${url.priority}</priority>` : ''
      
      return `  <url>
    <loc>${loc}</loc>${lastmod}${changefreq}${priority}
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`

  event.node.res.setHeader('Content-Type', 'application/xml')
  return xml
})
