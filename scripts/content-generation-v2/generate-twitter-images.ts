#!/usr/bin/env npx tsx

/**
 * Generate OG Images using Playwright (Element Screenshot)
 * 
 * Queries database for article slugs by date and uses Playwright to screenshot
 * ONLY the OGImageCard Vue component for each article.
 * 
 * Benefits:
 * - Direct database integration (no intermediate JSON files)
 * - Screenshots actual Vue component (pixel-perfect)
 * - Supports multiple dates in one run
 * - Better TypeScript support
 * - Faster execution than Puppeteer
 * 
 * Prerequisites:
 * 1. Install Playwright: npm install -D @playwright/test
 * 2. Dev server running: npm run dev
 * 3. Database populated: Run pipeline Steps 1-5 first
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/generate-twitter-images.ts [options]
 * 
 * Options:
 *   -d, --date <dates>   Comma-separated dates (YYYY-MM-DD) - queries database
 *                        Example: --date 2025-10-18 or --date 2025-10-18,2025-10-17
 *   -s, --slug <slug>    Generate image for specific article slug
 *   -t, --test           Generate test image using hardcoded slug (saves as test.png)
 *   -o, --output <dir>   Output directory (default: public/images/og-image)
 *   -u, --url <url>      Base URL of dev server (default: http://localhost:3000)
 *   --headed             Show browser window for debugging
 * 
 * Examples:
 *   # Generate images for today's articles
 *   npx tsx scripts/content-generation-v2/generate-twitter-images.ts --date 2025-10-18
 * 
 *   # Generate images for multiple dates
 *   npx tsx scripts/content-generation-v2/generate-twitter-images.ts --date 2025-10-18,2025-10-17,2025-10-16
 * 
 *   # Test mode (always uses same hardcoded slug)
 *   npx tsx scripts/content-generation-v2/generate-twitter-images.ts --test
 * 
 *   # Specific article
 *   npx tsx scripts/content-generation-v2/generate-twitter-images.ts --slug my-article-slug
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import { Command } from 'commander';
import Database from 'better-sqlite3';
import 'dotenv/config';

// Configuration
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 675;
const DEFAULT_BASE_URL = 'http://localhost:3000';
const TEST_SLUG = 'ai-risk-disclosures-surge-among-sp-500-companies-report'; // Hardcoded test slug
const DB_PATH = 'logs/content-generation-v2.db';

interface Tweet {
  slug: string;
  headline: string;
  tweet_text: string;
  categories: string[];
  primary_category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  is_update: boolean;
}

/**
 * Query database for article slugs by date(s)
 */
function querySlugsFromDatabase(dates: string[]): string[] {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database not found: ${DB_PATH}`);
    console.error('   Make sure pipeline Steps 1-5 have been run first.\n');
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });
  const slugs: string[] = [];

  for (const date of dates) {
    console.log(`📅 Querying database for NEW articles on ${date}...`);
    
    const rows = db.prepare(`
      SELECT slug
      FROM articles
      WHERE date(created_at) = ?
        AND resolution = 'NEW'
      ORDER BY created_at DESC
    `).all(date) as Array<{ slug: string }>;

    const dateSlugs = rows.map(r => r.slug);
    slugs.push(...dateSlugs);
    
    console.log(`   Found ${dateSlugs.length} NEW articles`);
  }

  db.close();

  if (slugs.length === 0) {
    console.error(`\n❌ No NEW articles found for the specified date(s): ${dates.join(', ')}`);
    console.error('   Possible causes:');
    console.error('   - Date(s) have not been processed yet (run pipeline Steps 1-5)');
    console.error('   - All articles were marked as duplicates (SKIP-FTS5/SKIP-LLM)');
    console.error('   - Date format is incorrect (use YYYY-MM-DD)\n');
    process.exit(1);
  }

  console.log(`\n✅ Total: ${slugs.length} articles to process\n`);
  return slugs;
}

/**
 * Generate single image by screenshotting OGImageCard element
 */
async function generateImage(
  page: Page,
  slug: string,
  baseUrl: string,
  outputPath: string
): Promise<void> {
  try {
    // Navigate to Vue preview page
    const url = `${baseUrl}/og-image/${slug}`;
    console.log(`  📸 Loading: ${url}`);
    
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for the OG image card to be ready
    const cardLocator = page.locator('[data-testid="og-image-card"]');
    await cardLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Wait a bit for animations/fonts to settle
    await page.waitForTimeout(500);

    // Screenshot ONLY the card element (not the whole page)
    await cardLocator.screenshot({
      path: outputPath,
      type: 'png',
      // Playwright auto-detects element size, but we can verify:
      // The card is exactly 1200x675 in the component
    });

    // Verify file was created
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`  ✅ ${path.basename(outputPath)} (${sizeKB} KB)`);
  } catch (error: any) {
    console.error(`  ❌ Failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🎨 OG Image Generator (Playwright Element Screenshot)\n');

  // Setup commander
  const program = new Command();
  
  program
    .name('generate-twitter-images')
    .description('Generate OG images for articles using Playwright')
    .option('-d, --date <dates>', 'Comma-separated list of dates (YYYY-MM-DD) to query from database')
    .option('-s, --slug <slug>', 'Generate image for a specific article slug')
    .option('-t, --test', 'Generate test image using hardcoded test slug (saves as test.png)')
    .option('-o, --output <dir>', 'Output directory', 'public/images/og-image')
    .option('-u, --url <url>', 'Base URL of dev server', DEFAULT_BASE_URL)
    .option('--headed', 'Show browser window (for debugging)', false)
    .parse(process.argv);

  const options = program.opts();
  
  const outputDir = options.output;
  const baseUrl = options.url;
  const headed = options.headed;
  const testMode = options.test;
  const specificSlug = options.slug;
  const dateParam = options.date;

  // Determine which slugs to process
  let slugsToProcess: string[] = [];
  let isTestMode = false;

  if (testMode) {
    // Test mode: use hardcoded test slug
    slugsToProcess = [TEST_SLUG];
    isTestMode = true;
    console.log(`🧪 TEST MODE - Using hardcoded test slug: ${TEST_SLUG}\n`);
  } else if (specificSlug) {
    // Single specific slug
    slugsToProcess = [specificSlug];
    console.log(`� Generating image for specific slug: ${specificSlug}\n`);
  } else if (dateParam) {
    // Query database for slugs by date(s)
    const dates = dateParam.split(',').map((d: string) => d.trim());
    
    // Validate date formats
    for (const date of dates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.error(`❌ Invalid date format: ${date}`);
        console.error('   Expected format: YYYY-MM-DD\n');
        process.exit(1);
      }
    }
    
    slugsToProcess = querySlugsFromDatabase(dates);
  } else {
    console.error('❌ Error: Must specify one of:');
    console.error('   --date YYYY-MM-DD[,YYYY-MM-DD...]  (query database by date)');
    console.error('   --slug SLUG                         (specific article)');
    console.error('   --test                              (test mode)\n');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}\n`);
  }

  console.log(`🌐 Base URL: ${baseUrl}`);
  console.log(`📸 Will generate ${slugsToProcess.length} images`);
  console.log(`👁️  Headless: ${!headed}\n`);

  // Launch browser
  console.log('🚀 Launching Playwright (Chromium)...\n');
  const startTime = Date.now();
  
  const browser = await chromium.launch({
    headless: !headed,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, // Large viewport (card is 1200x675)
    deviceScaleFactor: 2, // 2x for retina quality
  });

  const page = await context.newPage();

  try {
    // Generate images
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < slugsToProcess.length; i++) {
      const slug = slugsToProcess[i]!;
      
      // In test mode, save as test.png instead of {slug}.png
      const filename = isTestMode ? 'test.png' : `${slug}.png`;
      const outputPath = path.join(outputDir, filename);

      console.log(`\n📝 [${i + 1}/${slugsToProcess.length}] ${slug}`);
      if (isTestMode) {
        console.log(`   📁 Output: ${filename} (test mode)`);
      }

      try {
        await generateImage(page, slug, baseUrl, outputPath);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`   ❌ Generation failed`);
      }

      // Small delay between images to avoid overwhelming the server
      if (i < slugsToProcess.length - 1) {
        await page.waitForTimeout(200);
      }
    }

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '═'.repeat(60));
    console.log('📊 GENERATION COMPLETE');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully generated: ${successCount}/${slugsToProcess.length}`);
    console.log(`❌ Failed:                 ${failCount}/${slugsToProcess.length}`);
    console.log(`⏱️  Total time:             ${elapsed}s`);
    console.log(`⚡ Average per image:       ${(parseFloat(elapsed) / slugsToProcess.length).toFixed(2)}s`);
    console.log(`📁 Output directory:       ${outputDir}`);
    console.log('═'.repeat(60));

    if (isTestMode) {
      console.log('\n💡 Next steps:');
      console.log('  - Review the generated test.png image');
      console.log('  - Adjust styles in components/OGImageCard.vue if needed');
      console.log(`  - Preview in browser: ${baseUrl}/og-image/${TEST_SLUG}`);
      console.log('\n  Generate images for specific date(s):');
      console.log('    npx tsx scripts/content-generation-v2/generate-twitter-images.ts --date 2025-10-18');
      console.log('    npx tsx scripts/content-generation-v2/generate-twitter-images.ts --date 2025-10-18,2025-10-17');
    }
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:');
  console.error(error);
  process.exit(1);
});
