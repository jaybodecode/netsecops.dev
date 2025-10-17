# Twitter/X Social Posting - Setup Guide

## Installation

### 1. Install NPM Package

```bash
npm install twitter-api-v2
```

This package provides:
- Full Twitter API v2 support
- TypeScript types included
- Thread posting built-in
- Active maintenance

### 2. Set Up Environment Variables

Add to your `.env` file:

```bash
# Twitter/X API Credentials
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here

# Website base URL (for links in tweets)
WEBSITE_BASE_URL=https://cybernetsec.io
```

### 3. Get Twitter API Credentials

#### Option A: Use Existing Twitter Developer Account
If you already have a Twitter Developer account:

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Select your app (or create new app)
3. Go to "Keys and tokens" tab
4. Copy credentials:
   - API Key → `TWITTER_API_KEY`
   - API Secret Key → `TWITTER_API_SECRET`
   - Access Token → `TWITTER_ACCESS_TOKEN`
   - Access Token Secret → `TWITTER_ACCESS_SECRET`

#### Option B: Create New Twitter Developer Account
If you don't have a Twitter Developer account:

1. **Apply for Twitter Developer Account**:
   - Go to https://developer.twitter.com/
   - Click "Sign up"
   - Fill out application (describe your use case: "Automated posting of cybersecurity threat intelligence")
   - Wait for approval (usually instant for basic access)

2. **Create an App**:
   - Go to https://developer.twitter.com/en/portal/dashboard
   - Click "Create App"
   - Name: "CybernetSec Social Poster"
   - Description: "Automated daily threat intelligence posting"

3. **Configure App Permissions**:
   - Go to app settings → "User authentication settings"
   - Enable OAuth 1.0a
   - App permissions: **Read and Write** (need write to post tweets)
   - Callback URL: `http://localhost:3000` (not used for app-only posting)
   - Website URL: `https://cybernetsec.io`

4. **Generate Tokens**:
   - Go to "Keys and tokens" tab
   - Click "Generate" for Access Token and Secret
   - Copy all 4 credentials to `.env`

### 4. Verify Setup

Test database connection and credentials:

```bash
# Test database query (should show latest publication)
npx tsx scripts/content-social/lib/db.ts --show-latest

# Test thread formatting (dry run - no API call)
npx tsx scripts/content-social/post-to-twitter.ts --dry-run
```

## Usage

### Basic Commands

```bash
# Post tweets using OG metadata (DEFAULT - recommended)
npx tsx scripts/content-social/post-to-twitter-single.ts

# Preview tweets without posting (dry run)
npx tsx scripts/content-social/post-to-twitter-single.ts --dry-run

# Test with first tweet only
npx tsx scripts/content-social/post-to-twitter-single.ts --test

# Post with uploaded images (legacy mode)
npx tsx scripts/content-social/post-to-twitter-single.ts --upload_image

# Post specific number of tweets
npx tsx scripts/content-social/post-to-twitter-single.ts --limit 5

# Custom delay between tweets (seconds)
npx tsx scripts/content-social/post-to-twitter-single.ts --delay 15

# Use custom source file
npx tsx scripts/content-social/post-to-twitter-single.ts --source custom-tweets.json
```

### Typical Workflow

```bash
# 1. Preview tweets (shows OG metadata mode by default)
npx tsx scripts/content-social/post-to-twitter-single.ts --dry-run

# 2. Test with first tweet
npx tsx scripts/content-social/post-to-twitter-single.ts --test

# 3. If looks good, post all tweets
npx tsx scripts/content-social/post-to-twitter-single.ts

# 4. Verify on Twitter - images should appear via Twitter Card
# Twitter will fetch the OG image from: https://cyber.netsecops.io/images/og-image/{slug}.png
```

### Image Modes

**DEFAULT (OG Metadata - Recommended):**
- No image upload required
- Twitter fetches image from article page's OG tags
- Image URL: `https://cyber.netsecops.io/images/og-image/{slug}.png`
- When users click image, they go to your article (better traffic!)
- Faster posting (no upload wait time)
- No 5MB image size limits

**Legacy (Upload Image):**
```bash
npx tsx scripts/content-social/post-to-twitter-single.ts --upload_image
```
- Uploads image directly with tweet
- When users click image, they see just the image (not your site)
- Slower (uploads take time)
- Subject to Twitter's image size limits

## Troubleshooting

### Error: "Missing Twitter API credentials"
- Check `.env` file has all 4 credentials
- Verify variable names match exactly (TWITTER_API_KEY, etc.)
- Try loading environment: `export $(cat .env | xargs)`

### Error: "Permission denied" (403)
- App permissions not set to "Read and Write"
- Regenerate Access Token after changing permissions
- Check API key is for correct Twitter account

### Error: "Rate limit exceeded" (429)
- Twitter limit: 300 tweets per 3-hour window
- Wait before retrying
- Thread counts as 7 tweets (intro + 5 articles + closing)

### Error: "No publication found"
- Run content pipeline first: `npx tsx scripts/content-generation-v2/generate-publication.ts`
- Check database has publications: `npx tsx scripts/content-social/lib/db.ts --show-latest`

### Error: "Tweet too long" (validation failed)
- Articles with very long headlines may not fit
- Try reducing article limit: `--limit 3`
- Report issue so we can improve truncation

## What Gets Posted

### Thread Structure (7 tweets):

**Tweet 1: Intro**
```
🚨 Today's Cyber Threat Report - Oct 16, 2025

[Publication summary...]

Top 5 threats below 🧵👇

#CyberSecurity #ThreatIntel
```

**Tweets 2-6: Articles** (one per tweet)
```
1/5: [Article headline...]

[First sentence of summary...]

🔗 https://cybernetsec.io/articles/article-slug

#CyberSecurity
```

**Tweet 7: Closing**
```
📰 Read the full report with sources, CVEs, and MITRE ATT&CK mappings:

🔗 https://cybernetsec.io/publications/daily-threat-report-2025-10-16

Stay safe out there! 🛡️

#CyberSecurity #InfoSec #ThreatIntel
```

## Database Tracking

All posts are tracked in `social_posts` table:

```sql
SELECT * FROM social_posts 
WHERE platform = 'twitter' 
ORDER BY posted_at DESC 
LIMIT 5;
```

Fields stored:
- `platform`: 'twitter'
- `publication_id`: Links to publication
- `post_type`: 'thread'
- `post_id`: First tweet ID
- `post_url`: Link to thread
- `posted_at`: Timestamp

This prevents duplicate posts (script checks before posting).

## Automation (Optional)

### GitHub Actions (Recommended)

Create `.github/workflows/social-twitter.yml`:

```yaml
name: Post to Twitter

on:
  schedule:
    # Run daily at 7:00 AM CST (13:00 UTC)
    - cron: '0 13 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  post-to-twitter:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Post to Twitter
        env:
          TWITTER_API_KEY: ${{ secrets.TWITTER_API_KEY }}
          TWITTER_API_SECRET: ${{ secrets.TWITTER_API_SECRET }}
          TWITTER_ACCESS_TOKEN: ${{ secrets.TWITTER_ACCESS_TOKEN }}
          TWITTER_ACCESS_SECRET: ${{ secrets.TWITTER_ACCESS_SECRET }}
          WEBSITE_BASE_URL: https://cybernetsec.io
        run: |
          npx tsx scripts/content-social/post-to-twitter.ts
```

**Setup**:
1. Add secrets to GitHub repo settings
2. Enable GitHub Actions
3. Will run daily automatically

### Cron (Server)

Add to crontab:

```bash
# Edit crontab
crontab -e

# Add daily posting at 7 AM CST
0 7 * * * cd /path/to/cybernetsec-io && npx tsx scripts/content-social/post-to-twitter.ts >> logs/twitter-posts.log 2>&1
```

## Next Steps

1. ✅ Install `twitter-api-v2` package
2. ✅ Set up Twitter Developer account and app
3. ✅ Configure environment variables
4. ✅ Test with dry run
5. ✅ Post first thread manually
6. ⏳ Set up automation (GitHub Actions or cron)
7. ⏳ Monitor engagement and iterate

## Questions?

- Check [TWITTER-X.md](./TWITTER-X.md) for detailed platform documentation
- Check [README.md](./README.md) for overall social media strategy
- Run `--dry-run` to preview before posting
