#!/usr/bin/env node
/**
 * Google Indexing API Script
 * 
 * Submits URLs to Google for indexing using the Indexing API.
 * Requires service account credentials with Owner access in Search Console.
 * 
 * Service Account: search-indexing-api@techmadportal.iam.gserviceaccount.com
 * Credentials: ../../.creds/techmadportal-ade779568e47.json
 * Required Scope: https://www.googleapis.com/auth/indexing
 * 
 * Usage:
 *   npx tsx submit-google-index.ts update <url>
 *   npx tsx submit-google-index.ts delete <url>
 *   npx tsx submit-google-index.ts status <url>
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CREDENTIALS_PATH = resolve(__dirname, '../../.creds/techmadportal-ade779568e47.json');
const SCOPES = ['https://www.googleapis.com/auth/indexing'];
const INDEXING_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const METADATA_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications/metadata';

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
}

/**
 * Load service account credentials from JSON file
 */
function loadCredentials(): ServiceAccountCredentials {
  try {
    const credentialsJson = readFileSync(CREDENTIALS_PATH, 'utf-8');
    return JSON.parse(credentialsJson) as ServiceAccountCredentials;
  } catch (error) {
    console.error('❌ Failed to load credentials from:', CREDENTIALS_PATH);
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Create a JWT (JSON Web Token) for Google OAuth 2.0 authentication
 */
function createJWT(credentials: ServiceAccountCredentials): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: SCOPES.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, // Token expires in 1 hour
    iat: now,
  };

  // Base64url encode
  const base64url = (data: string | Buffer) => {
    const base64 = typeof data === 'string' 
      ? Buffer.from(data).toString('base64')
      : data.toString('base64');
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Sign with private key
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(signatureInput)
    .sign(credentials.private_key);
  
  const encodedSignature = base64url(signature);

  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Exchange JWT for an access token
 */
async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const jwt = createJWT(credentials);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Submit URL update notification to Google
 */
async function notifyUrlUpdate(url: string, accessToken: string): Promise<void> {
  console.log(`\n📤 Submitting URL_UPDATED notification for: ${url}`);

  const response = await fetch(INDEXING_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      url: url,
      type: 'URL_UPDATED',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log('✅ Success! Response:');
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Submit URL deletion notification to Google
 */
async function notifyUrlDeleted(url: string, accessToken: string): Promise<void> {
  console.log(`\n🗑️  Submitting URL_DELETED notification for: ${url}`);

  const response = await fetch(INDEXING_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      url: url,
      type: 'URL_DELETED',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log('✅ Success! Response:');
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Get notification status/metadata for a URL
 */
async function getNotificationStatus(url: string, accessToken: string): Promise<void> {
  console.log(`\n🔍 Getting notification metadata for: ${url}`);

  const queryUrl = `${METADATA_API_ENDPOINT}?url=${encodeURIComponent(url)}`;

  const response = await fetch(queryUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log('✅ Metadata retrieved:');
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage:');
    console.error('  npx tsx submit-google-index.ts update <url>  - Notify Google of new/updated URL');
    console.error('  npx tsx submit-google-index.ts delete <url>  - Notify Google of deleted URL');
    console.error('  npx tsx submit-google-index.ts status <url>  - Get notification status for URL');
    console.error('\nExample:');
    console.error('  npx tsx submit-google-index.ts update https://cybernetsec.io/article/some-article');
    process.exit(1);
  }

  const action = args[0];
  const url = args[1];

  if (!action || !url) {
    console.error('❌ Missing required arguments');
    process.exit(1);
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    console.error('❌ Invalid URL:', url);
    process.exit(1);
  }

  try {
    // Load credentials
    console.log('🔑 Loading service account credentials...');
    const credentials = loadCredentials();
    console.log(`   Service Account: ${credentials.client_email}`);

    // Get access token
    console.log('🔐 Authenticating with Google OAuth 2.0...');
    const accessToken = await getAccessToken(credentials);
    console.log('✅ Authentication successful!');

    // Execute requested action
    switch (action.toLowerCase()) {
      case 'update':
        await notifyUrlUpdate(url, accessToken);
        break;
      case 'delete':
        await notifyUrlDeleted(url, accessToken);
        break;
      case 'status':
        await getNotificationStatus(url, accessToken);
        break;
      default:
        console.error(`❌ Unknown action: ${action}`);
        console.error('Valid actions: update, delete, status');
        process.exit(1);
    }

    console.log('\n✅ Operation completed successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if executed directly (ES module check)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}

export { notifyUrlUpdate, notifyUrlDeleted, getNotificationStatus };
