#!/usr/bin/env node
/**
 * Generate Threat Level JSON
 * 
 * Fetches current threat level from SANS Internet Storm Center API
 * and generates static public/data/threat-level.json file for UI widget
 * 
 * Usage:
 *   npx tsx scripts/content-generation-v2/generate-threat-level.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const SANS_API_URL = 'https://isc.sans.edu/api/infocon?json';
const OUTPUT_FILE = 'public/data/threat-level.json';

interface SANSResponse {
  status: 'green' | 'yellow' | 'orange' | 'red';
}

interface ThreatLevelData {
  level: string;
  levelName: string;
  description: string;
  lastUpdated: string;
  lastChecked: string;
  source: string;
  sourceUrl: string;
  apiUrl: string;
  infoconUrl: string;
  levels: {
    [key: string]: {
      name: string;
      color: string;
      description: string;
    };
  };
}

const THREAT_LEVELS = {
  green: {
    name: 'Low',
    color: '#00ff00',
    description: 'No known or minimal threat activity',
  },
  yellow: {
    name: 'Elevated',
    color: '#ffff00',
    description: 'Significant threat activity',
  },
  orange: {
    name: 'High',
    color: '#ff9900',
    description: 'Major threat activity',
  },
  red: {
    name: 'Severe',
    color: '#ff0000',
    description: 'Severe threat activity',
  },
};

async function fetchThreatLevel(): Promise<string> {
  try {
    console.log('🌐 Fetching threat level from SANS ISC...');
    console.log(`   URL: ${SANS_API_URL}`);
    
    const response = await fetch(SANS_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json() as SANSResponse;
    
    if (!data.status) {
      throw new Error('Invalid response: missing status field');
    }
    
    if (!['green', 'yellow', 'orange', 'red'].includes(data.status)) {
      throw new Error(`Invalid status value: ${data.status}`);
    }
    
    console.log(`   ✅ Current threat level: ${data.status.toUpperCase()}`);
    
    return data.status;
  } catch (error) {
    console.error('   ❌ Error fetching threat level:', error);
    console.log('   ⚠️  Falling back to GREEN (default safe level)');
    return 'green';
  }
}

function generateThreatLevelJSON(level: string): ThreatLevelData {
  const now = new Date().toISOString();
  const levelInfo = THREAT_LEVELS[level as keyof typeof THREAT_LEVELS];
  
  return {
    level,
    levelName: levelInfo.name,
    description: levelInfo.description,
    lastUpdated: now,
    lastChecked: now,
    source: 'SANS Internet Storm Center',
    sourceUrl: 'https://isc.sans.edu/',
    apiUrl: SANS_API_URL,
    infoconUrl: 'https://isc.sans.edu/infocon.html',
    levels: THREAT_LEVELS,
  };
}

async function main() {
  console.log('\n🚨 Generate Threat Level JSON\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Fetch current threat level
  const level = await fetchThreatLevel();
  
  // Generate JSON
  console.log('\n📝 Generating threat-level.json...');
  const data = generateThreatLevelJSON(level);
  
  // Ensure output directory exists
  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  
  // Write file
  writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2) + '\n');
  
  console.log(`   ✅ Written to: ${OUTPUT_FILE}`);
  console.log(`   📊 Level: ${data.levelName} (${level})`);
  console.log(`   🕐 Updated: ${data.lastUpdated}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Threat level data generated successfully!\n');
  console.log('📍 UI Widget can now read: /data/threat-level.json\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
