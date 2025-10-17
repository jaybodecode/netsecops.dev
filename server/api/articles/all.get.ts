import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { CyberArticle } from '~/types/cyber'
import type { ArticleMetadata } from '~/composables/useArticles'

export default defineEventHandler(async (event) => {
  try {
    // Path to articles directory
    const articlesDir = join(process.cwd(), 'public/data/articles')
    
    // Get all article files
    const files = await readdir(articlesDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    const articles: ArticleMetadata[] = []
    
    // Read and transform each article
    for (const file of jsonFiles) {
      try {
        const filePath = join(articlesDir, file)
        const content = await readFile(filePath, 'utf-8')
        const article: CyberArticle = JSON.parse(content)
        
        // Transform CyberArticle to ArticleMetadata for listings
        const metadata: ArticleMetadata = {
          id: article.id,
          slug: article.slug,
          title: article.title,
          headline: article.headline,
          publishedAt: article.extract_datetime,
          excerpt: article.summary,
          tags: article.tags || [],
          categories: Array.isArray(article.category) ? article.category : (article.category ? [article.category] : []),
          readingTime: article.reading_time_minutes || 5,
          imageUrl: article.featured_image_url,
          // Map severity from tags if available
          severity: article.tags?.find(tag => ['low', 'medium', 'high', 'critical'].includes(tag.toLowerCase())),
          // Map author from sources if available
          author: article.sources && article.sources.length > 0 ? {
            name: article.sources[0]?.title || 'Security Team',
            role: 'Security Analyst'
          } : {
            name: 'CyberNet Security',
            role: 'Security Team'
          }
        }
        
        articles.push(metadata)
      } catch (error) {
        console.warn(`Failed to parse article file: ${file}`, error)
        continue
      }
    }
    
    // Sort articles by published date (newest first)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    
    return articles
    
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read articles'
    })
  }
})