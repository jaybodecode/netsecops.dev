#!/usr/bin/env npx tsx

/**
 * Check OG Tags Script
 * 
 * Uses Playwright to fetch a page and extract all meta tags from the <head>
 * This shows exactly what Twitter/social media crawlers see
 * 
 * Usage:
 *   npx tsx scripts/content-social/check-og-tags.ts <url>
 *   npx tsx scripts/content-social/check-og-tags.ts https://cyber.netsecops.io/articles/sonicwall-breach-escalates-100-percent-cloud-backups-stolen
 */

import { chromium } from 'playwright';

async function checkOGTags(url: string) {
  console.log('\n🔍 Fetching page with Playwright...');
  console.log(`URL: ${url}\n`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Extract all meta tags from the head
    const metaTags = await page.evaluate(() => {
      const tags: Array<{ name?: string; property?: string; content?: string; [key: string]: any }> = [];
      
      // Get all meta tags
      document.querySelectorAll('head meta').forEach((meta) => {
        const tag: any = {};
        
        // Get all attributes
        Array.from(meta.attributes).forEach(attr => {
          tag[attr.name] = attr.value;
        });
        
        tags.push(tag);
      });
      
      return tags;
    });
    
    // Also get the title
    const title = await page.title();
    
    console.log('═'.repeat(80));
    console.log('📋 PAGE TITLE');
    console.log('═'.repeat(80));
    console.log(title);
    console.log('');
    
    // Filter and display OG tags
    const ogTags = metaTags.filter(tag => tag.property?.startsWith('og:'));
    console.log('═'.repeat(80));
    console.log('🎴 OPEN GRAPH (OG) TAGS');
    console.log('═'.repeat(80));
    
    if (ogTags.length === 0) {
      console.log('⚠️  NO OG TAGS FOUND!');
    } else {
      ogTags.forEach(tag => {
        const property = tag.property || '';
        const content = tag.content || '(empty)';
        console.log(`${property.padEnd(30)} = "${content}"`);
      });
    }
    console.log('');
    
    // Filter and display Twitter tags
    const twitterTags = metaTags.filter(tag => tag.name?.startsWith('twitter:'));
    console.log('═'.repeat(80));
    console.log('🐦 TWITTER CARD TAGS');
    console.log('═'.repeat(80));
    
    if (twitterTags.length === 0) {
      console.log('⚠️  NO TWITTER TAGS FOUND!');
    } else {
      twitterTags.forEach(tag => {
        const name = tag.name || '';
        const content = tag.content || '(empty)';
        console.log(`${name.padEnd(30)} = "${content}"`);
      });
    }
    console.log('');
    
    // Check for critical missing tags
    console.log('═'.repeat(80));
    console.log('✅ VALIDATION');
    console.log('═'.repeat(80));
    
    const criticalOGTags = ['og:title', 'og:description', 'og:image', 'og:url'];
    const criticalTwitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
    
    let allGood = true;
    
    criticalOGTags.forEach(tagName => {
      const tag = ogTags.find(t => t.property === tagName);
      const hasContent = tag?.content && tag.content.trim().length > 0;
      
      if (!hasContent) {
        console.log(`❌ MISSING or EMPTY: ${tagName}`);
        allGood = false;
      } else {
        console.log(`✅ ${tagName}`);
      }
    });
    
    console.log('');
    
    criticalTwitterTags.forEach(tagName => {
      const tag = twitterTags.find(t => t.name === tagName);
      const hasContent = tag?.content && tag.content.trim().length > 0;
      
      if (!hasContent) {
        console.log(`❌ MISSING or EMPTY: ${tagName}`);
        allGood = false;
      } else {
        console.log(`✅ ${tagName}`);
      }
    });
    
    console.log('');
    console.log('═'.repeat(80));
    
    if (allGood) {
      console.log('✅ ALL CRITICAL TAGS PRESENT AND POPULATED');
    } else {
      console.log('⚠️  SOME CRITICAL TAGS ARE MISSING OR EMPTY');
      console.log('   This will cause Twitter Card to not display properly!');
    }
    
    console.log('═'.repeat(80));
    console.log('');
    
    // Show all other meta tags for reference
    console.log('═'.repeat(80));
    console.log('📄 ALL OTHER META TAGS');
    console.log('═'.repeat(80));
    
    const otherTags = metaTags.filter(tag => 
      !tag.property?.startsWith('og:') && 
      !tag.name?.startsWith('twitter:')
    );
    
    otherTags.forEach(tag => {
      const identifier = tag.name || tag.property || tag.charset || 'viewport';
      const content = tag.content || tag.charset || JSON.stringify(tag);
      console.log(`${identifier.padEnd(30)} = "${content.substring(0, 80)}${content.length > 80 ? '...' : ''}"`);
    });
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error fetching page:');
    console.error(error);
  } finally {
    await browser.close();
  }
}

// Main execution
const url = process.argv[2];

if (!url) {
  console.error('❌ Error: URL is required');
  console.error('');
  console.error('Usage:');
  console.error('  npx tsx scripts/content-social/check-og-tags.ts <url>');
  console.error('');
  console.error('Example:');
  console.error('  npx tsx scripts/content-social/check-og-tags.ts https://cyber.netsecops.io/articles/sonicwall-breach-escalates-100-percent-cloud-backups-stolen');
  process.exit(1);
}

checkOGTags(url).catch(error => {
  console.error('\n💥 Fatal error:');
  console.error(error);
  process.exit(1);
});
