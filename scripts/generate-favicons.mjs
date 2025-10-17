#!/usr/bin/env node

/**
 * Generate high-quality favicon PNGs from SVG
 * Uses Chrome/Puppeteer for pixel-perfect rendering
 */

import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sizes = [16, 32, 48];
const svgPath = join(rootDir, 'public', 'favicon.svg');

async function generateFavicons() {
  try {
    console.log('🎨 Generating favicons from SVG...\n');
    
    // Read SVG file
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // For each size, create a canvas and render
    for (const size of sizes) {
      console.log(`⚙️  Generating ${size}x${size}...`);
      
      // Create canvas
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Create a data URL from SVG
      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
      
      try {
        // Load and draw image
        const img = await loadImage(svgDataUrl);
        ctx.drawImage(img, 0, 0, size, size);
        
        // Save PNG
        const outputPath = join(rootDir, 'public', `favicon-${size}.png`);
        const buffer = canvas.toBuffer('image/png', { compressionLevel: 9, filters: canvas.PNG_FILTER_NONE });
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`   ✅ Saved: public/favicon-${size}.png`);
      } catch (err) {
        console.error(`   ❌ Error rendering ${size}x${size}:`, err.message);
      }
    }
    
    console.log('\n✨ Favicon generation complete!');
    console.log('📋 Generated files:');
    sizes.forEach(size => {
      const path = `public/favicon-${size}.png`;
      const stats = fs.statSync(join(rootDir, path));
      console.log(`   - ${path} (${Math.round(stats.size / 1024)}KB)`);
    });
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
