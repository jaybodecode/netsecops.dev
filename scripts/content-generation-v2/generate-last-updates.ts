#!/usr/bin/env node
/**
 * Generate Last Updates Summary File
 * 
 * Creates public/last-updates.json with:
 * - Latest publication info
 * - Recently updated articles
 * - Updated pages (for email notifications)
 * 
 * Used by email notification system to check what changed since last run
 * 
 * Usa  console.log('\n✅ Last updates summary generated!\n');
  console.log('📧 Email notification systems can now check:');
  console.log(`   ${outputFile}\n`);
  console.log('Example use cases:');
  console.log('   - Notify subscribers of new publications');
  console.log('   - Alert users following specific articles that were updated');
  console.log('   - Send page-specific update notifications');
  console.log('\n💡 API endpoint: /data/last-updates.json');  npx tsx generate-last-updates.ts
 *   npx tsx generate-last-updates.ts --days 7
 */

import 'dotenv/config';
import { Command } from 'commander';
import { getDB, ensureInitialized } from './database/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

interface CLIOptions {
  days: number;
  output: string;
}

interface LastUpdatesOutput {
  lastUpdated: string;           // ISO timestamp when this file was generated
  runDate: string;                // YYYY-MM-DD of this run
  publications: Array<{
    slug: string;
    type: string;                 // publication-daily | publication-weekly | publication-monthly
    headline: string;
    articleCount: number;
    articles: Array<{
      slug: string;
      headline: string;
      summary: string;
      categories: string[];
      tags: string[];
      severity: string;
      isUpdate: boolean;
      publishedAt: string;        // ISO timestamp
      updatedAt?: string;         // ISO timestamp if updated
      cves?: string[];
      malware?: string[];
    }>;
  }>;
  articles: {
    updated: Array<{
      slug: string;
      originalHeadline: string;
      updateTitle: string;
      updateSummary: string;
      categories: string[];
      tags: string[];
      cves?: string[];
      malware?: string[];
      severity: string;
      publishedAt: string;
      updatedAt: string;
    }>;
  };
  pages: {
    updated: string[];            // List of page slugs that were updated
  };
}

function parseArgs(): CLIOptions {
  const program = new Command();
  
  program
    .name('generate-last-updates')
    .description('Generate last-updates.json summary file')
    .version('1.0.0')
    .option('-d, --days <number>', 'Include publications/updates from last N days', '1')
    .option('-o, --output <path>', 'Output file path', 'public/data/last-updates.json')
    .parse(process.argv);
  
  const options = program.opts();
  
  return {
    days: parseInt(options.days, 10),
    output: options.output,
  };
}

function getLatestPublications(db: any, days: number): any[] {
  const stmt = db.prepare(`
    SELECT 
      p.id as pub_id,
      p.slug,
      'publication-daily' as type,
      p.headline,
      p.pub_date,
      p.article_count,
      p.created_at
    FROM publications p
    WHERE DATE(p.pub_date) >= DATE('now', '-' || ? || ' days')
    ORDER BY p.pub_date DESC
    LIMIT 5
  `);
  
  return stmt.all(days);
}

function getPublicationArticles(db: any, pubDate: string): any[] {
  // Get articles for this publication date
  const stmt = db.prepare(`
    SELECT 
      a.id,
      a.slug,
      a.headline,
      a.summary,
      a.severity,
      a.category,
      a.pub_date,
      a.created_at,
      a.updated_at
    FROM articles a
    WHERE a.pub_date = ?
    ORDER BY a.severity DESC, a.headline ASC
  `);
  
  const articles = stmt.all(pubDate);
  
  // Get tags, CVEs, malware for each article
  return articles.map((article: any) => {
    const tags = db.prepare('SELECT DISTINCT tag FROM article_tags WHERE article_id = ?').all(article.id).map((r: any) => r.tag);
    const cves = db.prepare('SELECT cve_id FROM article_cves WHERE article_id = ?').all(article.id).map((r: any) => r.cve_id);
    const malware = db.prepare('SELECT entity_name FROM article_entities WHERE article_id = ? AND entity_type = ?').all(article.id, 'malware').map((r: any) => r.entity_name);
    
    // Parse category if it's a JSON string
    let categories: string[] = [];
    if (article.category) {
      try {
        const parsed = JSON.parse(article.category);
        categories = Array.isArray(parsed) ? parsed : [article.category];
      } catch {
        categories = [article.category];
      }
    }
    
    return {
      slug: article.slug,
      headline: article.headline,
      summary: article.summary,
      categories,
      tags: tags.length > 0 ? tags : [],
      severity: article.severity || 'informational',
      isUpdate: article.updated_at && article.updated_at !== article.created_at,
      publishedAt: new Date(article.created_at).toISOString(),
      updatedAt: article.updated_at && article.updated_at !== article.created_at 
        ? new Date(article.updated_at).toISOString() 
        : undefined,
      cves: cves.length > 0 ? cves : undefined,
      malware: malware.length > 0 ? malware : undefined,
    };
  });
}

function getRecentlyUpdatedArticles(db: any, days: number): any[] {
  const stmt = db.prepare(`
    SELECT 
      a.id,
      a.slug,
      a.headline as original_headline,
      a.summary,
      a.severity,
      a.category,
      a.created_at,
      a.updated_at
    FROM articles a
    WHERE a.updated_at IS NOT NULL
      AND a.updated_at != a.created_at
      AND DATE(a.updated_at) >= DATE('now', '-' || ? || ' days')
    ORDER BY a.updated_at DESC
    LIMIT 20
  `);
  
  const articles = stmt.all(days);
  
  return articles.map((article: any) => {
    // Get latest update
    const latestUpdate = db.prepare('SELECT summary, datetime FROM article_updates WHERE article_id = ? ORDER BY datetime DESC LIMIT 1').get(article.id) as { summary: string; datetime: string } | undefined;
    
    // Get metadata
    const tags = db.prepare('SELECT DISTINCT tag FROM article_tags WHERE article_id = ?').all(article.id).map((r: any) => r.tag);
    const cves = db.prepare('SELECT cve_id FROM article_cves WHERE article_id = ?').all(article.id).map((r: any) => r.cve_id);
    const malware = db.prepare('SELECT entity_name FROM article_entities WHERE article_id = ? AND entity_type = ?').all(article.id, 'malware').map((r: any) => r.entity_name);
    
    // Parse category if it's a JSON string
    let categories: string[] = [];
    if (article.category) {
      try {
        const parsed = JSON.parse(article.category);
        categories = Array.isArray(parsed) ? parsed : [article.category];
      } catch {
        categories = [article.category];
      }
    }
    
    return {
      slug: article.slug,
      originalHeadline: article.original_headline,
      updateTitle: `Update: ${article.original_headline}`,
      updateSummary: latestUpdate?.summary || 'Article updated with new information.',
      categories,
      tags: tags.length > 0 ? tags : [],
      cves: cves.length > 0 ? cves : undefined,
      malware: malware.length > 0 ? malware : undefined,
      severity: article.severity || 'informational',
      publishedAt: new Date(article.created_at).toISOString(),
      updatedAt: new Date(article.updated_at).toISOString(),
    };
  });
}

function main() {
  console.log('📋 Generate Last Updates Summary\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const options = parseArgs();
  ensureInitialized();
  const db = getDB();
  
  console.log(`⚙️  Configuration:`);
  console.log(`   Lookback: ${options.days} days`);
  console.log(`   Output: ${options.output}\n`);
  
  // Get latest publications
  console.log('📰 Fetching latest publications...');
  const publications = getLatestPublications(db, options.days);
  console.log(`   Found ${publications.length} publication(s)\n`);
  
  // Get articles for each publication
  const publicationsWithArticles = publications.map(pub => {
    console.log(`   Loading articles for: ${pub.slug}`);
    const articles = getPublicationArticles(db, pub.pub_date);
    
    return {
      slug: pub.slug,
      type: pub.type || 'publication-daily',
      headline: pub.headline,
      articleCount: articles.length,
      articles,
    };
  });
  
  // Get recently updated articles
  console.log('\n🔄 Fetching recently updated articles...');
  const updatedArticles = getRecentlyUpdatedArticles(db, options.days);
  console.log(`   Found ${updatedArticles.length} updated article(s)\n`);
  
  // Build output
  const output: LastUpdatesOutput = {
    lastUpdated: new Date().toISOString(),
    runDate: new Date().toISOString().split('T')[0]!,
    publications: publicationsWithArticles,
    articles: {
      updated: updatedArticles,
    },
    pages: {
      updated: [], // Future: track page updates (categories, tags, etc.)
    },
  };
  
  // Write file
  console.log('💾 Writing output file...');
  const outputDir = dirname(options.output);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(options.output, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`   ✅ Written to: ${options.output}`);
  console.log(`   Size: ${(JSON.stringify(output).length / 1024).toFixed(2)} KB\n`);
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`   Publications: ${output.publications.length}`);
  console.log(`   Total articles: ${output.publications.reduce((sum, pub) => sum + pub.articleCount, 0)}`);
  console.log(`   Updated articles: ${output.articles.updated.length}`);
  console.log(`   Updated pages: ${output.pages.updated.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✅ Last updates summary generated!\n');
  console.log('📧 Email notification systems can now check:');
  console.log(`   ${options.output}\n`);
  console.log('Example use cases:');
  console.log('   - Notify subscribers of new publications');
  console.log('   - Alert users following specific articles that were updated');
  console.log('   - Send page-specific update notifications\n');
}

main();
