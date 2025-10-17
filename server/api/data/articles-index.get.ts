// Server API route to serve articles-index.json during prerendering
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  // Read from public/data directory
  const filePath = join(process.cwd(), 'public/data/articles-index.json')
  const data = await readFile(filePath, 'utf-8')
  return JSON.parse(data)
})
