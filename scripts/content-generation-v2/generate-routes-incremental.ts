#!/usr/bin/env tsx

/**
 * Incremental Route Generator
 * 
 * Generates HTML files for new/updated article and publication routes
 * without requiring a full Nuxt rebuild.
 * 
 * This script:
 * 1. Scans all articles/publications in public/data
 * 2. Checks which routes are missing in .output/public
 * 3. Generates minimal HTML files for new routes
 * 4. Preserves existing routes and assets
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/generate-routes-incremental.ts [output-dir]
 *   npx tsx scripts/content-generation-v2/generate-routes-incremental.ts .output/public
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration
const DATA_DIR = 'public/data';
const DEFAULT_OUTPUT_DIR = '.output/public';

interface Article {
  slug: string;
  id: string;
  title: string;
  headline?: string;
  excerpt?: string;
  publishedAt: string;
  tags?: string[];
  categories?: string[];
}

interface Publication {
  slug: string;
  id: string;
  title: string;
  description?: string;
  publishedAt: string;
  type?: string;
}

/**
 * Generate minimal HTML for a route
 * This creates a shell HTML that will be hydrated by Nuxt on the client
 */
function generateRouteHtml(route: string, title: string, description?: string): string {
  const siteUrl = 'https://cyber.netsecops.io';
  const fullUrl = `${siteUrl}${route}`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - CyberNetSec.io</title>
  <meta name="description" content="${description || 'Cybersecurity Threat Intelligence Platform'}">
  
  <!-- Open Graph / Social Media -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description || 'Cybersecurity Threat Intelligence Platform'}">
  <meta property="og:site_name" content="CyberNetSec.io">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${fullUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description || 'Cybersecurity Threat Intelligence Platform'}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${fullUrl}">
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  
  <!-- Nuxt will inject styles here -->
  <link rel="stylesheet" href="/_nuxt/entry.css">
</head>
<body>
  <div id="__nuxt">
    <!-- Nuxt app will hydrate here -->
    <div>Loading...</div>
  </div>
  
  <!-- Nuxt will inject scripts here -->
  <script type="module" src="/_nuxt/entry.js"></script>
</body>
</html>`;
}

/**
 * Scan articles and return list of slugs
 */
async function getArticleSlugs(): Promise<Article[]> {
  const articlesDir = path.join(DATA_DIR, 'articles');
  
  try {
    const files = await fs.readdir(articlesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const articles: Article[] = [];
    
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(articlesDir, file), 'utf-8');
        const article = JSON.parse(content) as Article;
        
        if (article.slug) {
          articles.push(article);
        }
      } catch (err) {
        console.warn(`⚠️  Failed to parse ${file}:`, err);
      }
    }
    
    return articles;
  } catch (err) {
    console.error('❌ Failed to read articles:', err);
    return [];
  }
}

/**
 * Scan publications and return list of slugs
 */
async function getPublicationSlugs(): Promise<Publication[]> {
  const pubsDir = path.join(DATA_DIR, 'publications');
  
  try {
    const files = await fs.readdir(pubsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const publications: Publication[] = [];
    
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(pubsDir, file), 'utf-8');
        const publication = JSON.parse(content) as Publication;
        
        if (publication.slug) {
          publications.push(publication);
        }
      } catch (err) {
        console.warn(`⚠️  Failed to parse ${file}:`, err);
      }
    }
    
    return publications;
  } catch (err) {
    console.error('❌ Failed to read publications:', err);
    return [];
  }
}

/**
 * Check if a route exists in output directory
 */
async function routeExists(outputDir: string, route: string): Promise<boolean> {
  const routePath = path.join(outputDir, route, 'index.html');
  
  try {
    await fs.access(routePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate route HTML file
 */
async function generateRoute(
  outputDir: string,
  route: string,
  title: string,
  description?: string
): Promise<void> {
  const routeDir = path.join(outputDir, route);
  const htmlPath = path.join(routeDir, 'index.html');
  
  // Create directory
  await fs.mkdir(routeDir, { recursive: true });
  
  // Generate and write HTML
  const html = generateRouteHtml(route, title, description);
  await fs.writeFile(htmlPath, html, 'utf-8');
}

/**
 * Main function
 */
async function main() {
  console.log('⚡ Incremental Route Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Parse arguments
  const outputDir = process.argv[2] || DEFAULT_OUTPUT_DIR;
  
  console.log(`Output directory: ${outputDir}`);
  
  // Verify output directory exists
  try {
    await fs.access(outputDir);
  } catch {
    console.error(`❌ Output directory not found: ${outputDir}`);
    console.error('Run full build first: npm run generate');
    process.exit(1);
  }
  
  // Get all articles and publications
  console.log('\n📖 Scanning content...');
  const articles = await getArticleSlugs();
  const publications = await getPublicationSlugs();
  
  console.log(`  Articles: ${articles.length}`);
  console.log(`  Publications: ${publications.length}`);
  
  // Track new routes
  let newArticleRoutes = 0;
  let newPublicationRoutes = 0;
  
  // Generate missing article routes
  console.log('\n📝 Checking article routes...');
  for (const article of articles) {
    const route = `/articles/${article.slug}`;
    const exists = await routeExists(outputDir, route);
    
    if (!exists) {
      await generateRoute(
        outputDir,
        route,
        article.title || article.headline || 'Article',
        article.excerpt
      );
      console.log(`  ✅ Generated: ${route}`);
      newArticleRoutes++;
    }
  }
  
  // Generate missing publication routes
  console.log('\n📰 Checking publication routes...');
  for (const publication of publications) {
    const route = `/publications/${publication.slug}`;
    const exists = await routeExists(outputDir, route);
    
    if (!exists) {
      await generateRoute(
        outputDir,
        route,
        publication.title || 'Publication',
        publication.description
      );
      console.log(`  ✅ Generated: ${route}`);
      newPublicationRoutes++;
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`  New article routes: ${newArticleRoutes}`);
  console.log(`  New publication routes: ${newPublicationRoutes}`);
  console.log(`  Total new routes: ${newArticleRoutes + newPublicationRoutes}`);
  
  if (newArticleRoutes === 0 && newPublicationRoutes === 0) {
    console.log('\n✅ All routes already exist - no new routes generated');
  } else {
    console.log('\n✅ Incremental route generation completed');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
}
