import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug parameter is required'
    })
  }

  try {
    // Path to articles directory
    const articlesDir = join(process.cwd(), 'public/data/articles')
    
    // Get all article files
    const files = await readdir(articlesDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    // Search through each file to find matching slug
    for (const file of jsonFiles) {
      try {
        const filePath = join(articlesDir, file)
        const content = await readFile(filePath, 'utf-8')
        const article = JSON.parse(content)
        
        // Check if this article has the matching slug
        if (article.slug === slug) {
          return article
        }
      } catch (error) {
        // Skip invalid JSON files
        console.warn(`Failed to parse article file: ${file}`, error)
        continue
      }
    }
    
    // No article found with this slug
    throw createError({
      statusCode: 404,
      statusMessage: `Article with slug "${slug}" not found`
    })
    
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise, it's a file system error
    console.error('Error searching for article by slug:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while searching for article'
    })
  }
})