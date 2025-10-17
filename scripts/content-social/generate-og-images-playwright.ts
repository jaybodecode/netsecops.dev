#!/usr/bin/env npx tsx

/**
 * Generate OG Images using Playwright (Element Screenshot)
 * 
 * Uses Playwright to screenshot ONLY the OGImageCard component,
 * ensuring pixel-perfect capture without browser chrome or extra elements.
 * 
 * Benefits over Puppeteer:
 * - Screenshots specific elements (not full page)
 * - Better TypeScript support
 * - More reliable element waiting
 * - Faster execution
 * 
 * Prerequisites:
 * 1. Install Playwright: npm install -D @playwright/test
 * 2. Dev server running: npm run dev
 * 
 * Usage:
 *   npx tsx scripts/content-social/generate-og-images-playwright.ts [options]
 * 
 * Options:
 *   --source FILE        Source tweets JSON (default: tmp/twitter/tweets.json)
 *   --output DIR         Output directory (default: public/images/og-image)
 *   --test               Generate first image only for testing
 *   --slug SLUG          Generate specific article image only
 *   --url URL            Base URL (default: http://localhost:3000)
 *   --headed             Show browser window (for debugging)
 */

import fs from 'fs';
import path from 'path';
import { chromium, Page } from 'playwright';
import 'dotenv/config';

// Configuration
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 675;
const DEFAULT_BASE_URL = 'http://localhost:3000';

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

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  let sourceFile = 'tmp/twitter/tweets.json';
  let outputDir = 'public/images/og-image';
  let baseUrl = DEFAULT_BASE_URL;
  let testMode = false;
  let specificSlug: string | null = null;
  let headed = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      sourceFile = args[i + 1]!;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1]!;
    } else if (args[i] === '--url' && args[i + 1]) {
      baseUrl = args[i + 1]!;
    } else if (args[i] === '--test') {
      testMode = true;
    } else if (args[i] === '--slug' && args[i + 1]) {
      specificSlug = args[i + 1]!;
    } else if (args[i] === '--headed') {
      headed = true;
    }
  }

  // Validate source file
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  const tweets: Tweet[] = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
  console.log(`📊 Loaded ${tweets.length} tweets from ${sourceFile}\n`);

  // Filter tweets
  let tweetsToProcess = tweets;
  if (specificSlug) {
    tweetsToProcess = tweets.filter(t => t.slug === specificSlug);
    if (tweetsToProcess.length === 0) {
      console.error(`❌ No tweet found with slug: ${specificSlug}`);
      process.exit(1);
    }
  } else if (testMode) {
    tweetsToProcess = tweets.slice(0, 1);
    console.log('🧪 TEST MODE - Generating first image only\n');
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}\n`);
  }

  console.log(`🌐 Base URL: ${baseUrl}`);
  console.log(`📸 Will generate ${tweetsToProcess.length} images`);
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

    for (let i = 0; i < tweetsToProcess.length; i++) {
      const tweet = tweetsToProcess[i]!;
      const outputPath = path.join(outputDir, `${tweet.slug}.png`);

      console.log(`\n📝 [${i + 1}/${tweetsToProcess.length}] ${tweet.slug}`);
      console.log(`   Headline: ${tweet.headline}`);
      console.log(`   Severity: ${tweet.severity.toUpperCase()}`);
      console.log(`   Categories: ${tweet.categories.join(', ')}`);

      try {
        await generateImage(page, tweet.slug, baseUrl, outputPath);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`   ❌ Generation failed`);
      }

      // Small delay between images to avoid overwhelming the server
      if (i < tweetsToProcess.length - 1) {
        await page.waitForTimeout(200);
      }
    }

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '═'.repeat(60));
    console.log('📊 GENERATION COMPLETE');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully generated: ${successCount}/${tweetsToProcess.length}`);
    console.log(`❌ Failed:                 ${failCount}/${tweetsToProcess.length}`);
    console.log(`⏱️  Total time:             ${elapsed}s`);
    console.log(`⚡ Average per image:       ${(parseFloat(elapsed) / tweetsToProcess.length).toFixed(2)}s`);
    console.log(`📁 Output directory:       ${outputDir}`);
    console.log('═'.repeat(60));

    if (testMode) {
      console.log('\n💡 Next steps:');
      console.log('  - Review the generated image');
      console.log('  - Adjust styles in components/OGImageCard.vue');
      console.log('  - Refresh browser preview: http://localhost:3000/og-image/{slug}');
      console.log('  - Generate all: npx tsx scripts/content-social/generate-og-images-playwright.ts');
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
