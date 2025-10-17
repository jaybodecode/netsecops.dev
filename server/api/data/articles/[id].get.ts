// Server API route to serve individual article JSON files during prerendering
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({ statusCode: 400, message: 'Article ID required' })
  }
  
  // Read from public/data/articles directory
  const filePath = join(process.cwd(), 'public/data/articles', `${id}.json`)
  
  try {
    const data = await readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    throw createError({ statusCode: 404, message: `Article ${id} not found` })
  }
})
