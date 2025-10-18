#!/usr/bin/env npx tsx

/**
 * Generate Dynamic Twitter Card Images
 * 
 * Creates beautiful, branded OG images for all platforms (Twitter, LinkedIn, Facebook, Google).
 * Uses Puppeteer to render Tailwind-styled HTML templates to PNG.
 * 
 * Image Specs:
 * - Size: 1200×675px (16:9 aspect ratio - optimal for all platforms)
 * - Format: PNG
 * - Max file size: 5MB (we're well under)
 * 
 * Usage:
 *   npx tsx scripts/content-social/generate-twitter-images.ts [options]
 * 
 * Options:
 *   --source FILE        Source tweets JSON (default: tmp/twitter/tweets.json)
 *   --output DIR         Output directory (default: public/images/og-image)
 *   --test               Generate first image only for testing
 *   --slug SLUG          Generate specific article image only
 *   --template NAME      Template to use (default: gradient-card)
 */

import fs from 'fs';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import 'dotenv/config';

// Twitter image specifications
const TWITTER_IMAGE_WIDTH = 1200;
const TWITTER_IMAGE_HEIGHT = 675;
const DEVICE_SCALE_FACTOR = 2; // 2x for retina quality

interface Tweet {
  slug: string;
  headline: string;
  tweet_text: string;
  categories: string[];
  primary_category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  is_update: boolean;
}

interface ImageConfig {
  headline: string;
  categories: string[];
  primaryCategory: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  entities: string[];
  isUpdate: boolean;
  date: string;
}

// Category icons/emojis
const CATEGORY_ICONS: Record<string, string> = {
  'Ransomware': '🔐',
  'Malware': '🦠',
  'Vulnerability': '⚠️',
  'Data Breach': '💥',
  'Phishing': '🎣',
  'Cyberattack': '⚔️',
  'Threat Actor': '🎭',
  'Cloud Security': '☁️',
  'Industrial Control Systems': '🏭',
  'Policy and Compliance': '📋',
  'Patch Management': '🔧',
  'Security Operations': '🛡️',
  'Incident Response': '🚨',
  'Supply Chain Attack': '🔗',
  'Zero Day': '0️⃣',
  'Other': '📌',
};

// Severity color schemes
const SEVERITY_COLORS = {
  critical: {
    gradient: 'from-red-600 via-red-700 to-red-900',
    accent: 'text-red-100',
    badge: 'bg-red-500/30 border-red-300/50',
  },
  high: {
    gradient: 'from-orange-500 via-orange-600 to-orange-800',
    accent: 'text-orange-100',
    badge: 'bg-orange-500/30 border-orange-300/50',
  },
  medium: {
    gradient: 'from-yellow-500 via-yellow-600 to-yellow-800',
    accent: 'text-yellow-100',
    badge: 'bg-yellow-500/30 border-yellow-300/50',
  },
  low: {
    gradient: 'from-blue-500 via-blue-600 to-blue-800',
    accent: 'text-blue-100',
    badge: 'bg-blue-500/30 border-blue-300/50',
  },
  informational: {
    gradient: 'from-slate-600 via-slate-700 to-slate-900',
    accent: 'text-slate-100',
    badge: 'bg-slate-500/30 border-slate-300/50',
  },
};

/**
 * Generate HTML template for Twitter card
 */
function generateHTMLTemplate(config: ImageConfig): string {
  const colors = SEVERITY_COLORS[config.severity];
  const primaryIcon = CATEGORY_ICONS[config.primaryCategory] || '📌';
  
  // Truncate headline if too long (fit in 3 lines max)
  const headline = config.headline.length > 120 
    ? config.headline.substring(0, 117) + '...' 
    : config.headline;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  </style>
</head>
<body class="m-0 p-0 overflow-hidden bg-black">
  <!-- Main Container -->
  <div class="relative w-[1200px] h-[675px] bg-gradient-to-br ${colors.gradient} overflow-hidden">
    
    <!-- Background Pattern Overlay -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
    </div>

    <!-- Content Container -->
    <div class="relative z-10 h-full flex flex-col justify-between p-12">
      
      <!-- Header -->
      <div class="flex items-start justify-between">
        <!-- Brand -->
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-3xl border-2 border-white/30 shadow-xl">
            🛡️
          </div>
          <div class="text-white">
            <div class="text-2xl font-black tracking-tight">cyber.netsecops.io</div>
            <div class="text-lg font-semibold opacity-90">Cybersecurity Intelligence</div>
          </div>
        </div>

        <!-- Primary Category Badge -->
        <div class="flex items-center gap-3 bg-white/15 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-white/30 shadow-xl">
          <span class="text-4xl">${primaryIcon}</span>
          <span class="text-white text-xl font-bold">${config.primaryCategory}</span>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col justify-center py-8">
        <!-- Headline -->
        <h1 class="text-white text-6xl font-black leading-[1.15] mb-6 drop-shadow-2xl" style="text-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          ${headline}
        </h1>

        <!-- Entity Tags (Hashtags) -->
        ${config.entities.length > 0 ? `
          <div class="flex flex-wrap gap-3 mt-4">
            ${config.entities.slice(0, 6).map(entity => `
              <span class="bg-black/40 backdrop-blur-sm px-5 py-2.5 rounded-xl text-white text-xl font-bold border-2 border-white/20 shadow-lg">
                #${entity}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="flex items-end justify-between">
        <!-- Date & Type -->
        <div class="text-white">
          <div class="text-xl font-semibold opacity-90">${config.date}</div>
          ${config.isUpdate ? '<div class="text-lg font-bold text-yellow-300 mt-1">📢 UPDATE</div>' : ''}
        </div>

        <!-- Severity Badge -->
        <div class="flex items-center gap-4">
          ${config.categories.slice(1, 3).map(cat => {
            const icon = CATEGORY_ICONS[cat] || '📌';
            return `
              <span class="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-base font-semibold border border-white/20">
                ${icon} ${cat}
              </span>
            `;
          }).join('')}
          
          <div class="bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border-2 border-white/40 shadow-2xl">
            <div class="text-white text-3xl font-black uppercase tracking-wider">
              ${config.severity}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Extract entities (hashtags) from tweet text
 */
function extractEntities(tweetText: string): string[] {
  const hashtags = tweetText.match(/#\w+/g) || [];
  return hashtags
    .map(h => h.replace('#', ''))
    .filter(h => h.length > 2) // Filter out very short hashtags
    .slice(0, 6);
}

/**
 * Generate single image
 */
async function generateImage(
  browser: Browser,
  tweet: Tweet,
  outputPath: string
): Promise<void> {
  const page = await browser.newPage();

  try {
    // Set viewport to Twitter image size
    await page.setViewport({
      width: TWITTER_IMAGE_WIDTH,
      height: TWITTER_IMAGE_HEIGHT,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
    });

    // Build config
    const config: ImageConfig = {
      headline: tweet.headline,
      categories: tweet.categories,
      primaryCategory: tweet.primary_category,
      severity: tweet.severity,
      entities: extractEntities(tweet.tweet_text),
      isUpdate: tweet.is_update,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
    };

    // Generate and set HTML
    const html = generateHTMLTemplate(config);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: TWITTER_IMAGE_WIDTH,
        height: TWITTER_IMAGE_HEIGHT,
      },
    });

    console.log(`  ✅ ${path.basename(outputPath)}`);
  } finally {
    await page.close();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Twitter Image Generator\n');

  // Parse arguments
  const args = process.argv.slice(2);
  let sourceFile = 'tmp/twitter/tweets.json';
  let outputDir = 'public/images/og-image';
  let testMode = false;
  let specificSlug: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      sourceFile = args[i + 1]!;
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1]!;
      i++;
    } else if (args[i] === '--test') {
      testMode = true;
    } else if (args[i] === '--slug' && args[i + 1]) {
      specificSlug = args[i + 1]!;
      i++;
    }
  }

  // Load tweets
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
      console.error(`❌ Tweet with slug "${specificSlug}" not found`);
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

  // Launch browser once
  console.log('🚀 Launching browser...\n');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const startTime = Date.now();

  // Generate images
  console.log(`🎨 Generating ${tweetsToProcess.length} images...\n`);
  for (let i = 0; i < tweetsToProcess.length; i++) {
    const tweet = tweetsToProcess[i]!;
    const outputPath = path.join(outputDir, `${tweet.slug}.png`);
    
    process.stdout.write(`  [${i + 1}/${tweetsToProcess.length}] ${tweet.slug}... `);
    await generateImage(browser, tweet, outputPath);
  }

  await browser.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgTime = (parseFloat(elapsed) / tweetsToProcess.length).toFixed(1);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ GENERATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`  Total images: ${tweetsToProcess.length}`);
  console.log(`  Output directory: ${outputDir}`);
  console.log(`  Total time: ${elapsed}s`);
  console.log(`  Average time: ${avgTime}s per image\n`);

  if (testMode) {
    console.log('🧪 Test image generated. Check the output and then:');
    console.log(`   - Generate all: npx tsx scripts/content-social/generate-twitter-images.ts\n`);
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
