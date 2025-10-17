# Twitter Post Debug Guide

## Overview

The `twitter-post-debug.ts` script is designed to help diagnose Twitter API posting issues by providing detailed diagnostic information, including:

- Exact payload being sent to Twitter
- Detailed response headers (including rate limit information)
- Specific error codes and their meanings
- Actionable recommendations for fixing issues

## Purpose

This script was created to debug rate limit issues (429 errors) that can occur even when posting volume seems low. It helps identify:

1. **Rate limit exhaustion** - Twitter API v2 has complex rate limits
2. **Authentication issues** - Missing or invalid credentials
3. **Duplicate tweets** - Posting identical content too quickly
4. **API response headers** - Hidden rate limit information

## Usage

### 1. Debug a Specific Tweet

Test posting a specific tweet from your `tweets.json` file:

```bash
npx tsx scripts/content-social/twitter-post-debug.ts -r 9
```

This will:
- Load tweet #9 from `tmp/twitter/tweets.json`
- Show exact tweet content and payload
- Attempt to post to Twitter
- Display detailed error information if it fails
- Show rate limit headers from the response

### 2. Check Current Rate Limits

Check your current rate limit status without posting:

```bash
npx tsx scripts/content-social/twitter-post-debug.ts --check-limits
```

This shows:
- Current rate limits for all Twitter API endpoints
- Remaining requests available
- When rate limits will reset
- Which endpoints are currently rate limited

### 3. Dry Run Mode

Preview what would be posted without actually posting:

```bash
npx tsx scripts/content-social/twitter-post-debug.ts -r 9 --dry-run
```

## Understanding Twitter Rate Limits

### API v2 Tweet Posting Limits

Twitter has multiple overlapping rate limits:

1. **App-level limits** (per application):
   - 50 tweets per 15 minutes
   - Resets every 15 minutes

2. **User-level limits** (per authenticated user):
   - ~300 tweets per day
   - ~2400 tweets per month

3. **Rate limit applies to**:
   - Successful posts
   - Failed posts (still count!)
   - Duplicate attempts

### Why You Got a 429 Error

Common causes:

1. **Failed attempts count** - Each failed post attempt counts against your rate limit
2. **Multiple retry attempts** - Retrying immediately can exhaust limits
3. **Other scripts** - Other tools or scripts using the same API credentials
4. **Monthly volume** - Approaching monthly limits even if daily limits are fine

## What the Debug Script Shows

### When Posting Fails (429 Error)

```
❌ ERROR DETAILS
═══════════════════════════════════════════════════════════
Error Type:    ApiResponseError
Error Code:    429
Error Message: Request failed with code 429

📊 TWITTER API RATE LIMIT INFORMATION
═══════════════════════════════════════════════════════════
Rate Limit:     50 requests per window
Remaining:      0 requests
Reset Time:     10/17/2025, 3:45:00 PM
Wait Time:      12 minutes

💡 Rate limit will reset in 12 minutes
   You can retry after: 3:45:00 PM
```

### Key Information Revealed

1. **Remaining Requests**: Shows exactly how many requests you have left
2. **Reset Time**: Exact time when limits reset
3. **Wait Time**: How many minutes until you can post again
4. **All Headers**: Shows hidden rate limit headers Twitter returns

## Common Issues and Solutions

### Issue 1: Rate Limit Exceeded (429)

**Symptoms:**
- Error code 429
- "Rate limit exceeded" message
- Remaining requests = 0

**Solutions:**
1. Wait for rate limit window to reset (check reset time)
2. Spread posts over longer time periods
3. Check if other scripts are using same credentials
4. Verify you're not hitting monthly limits

**Command to check:**
```bash
npx tsx scripts/content-social/twitter-post-debug.ts --check-limits
```

### Issue 2: Duplicate Tweet (187)

**Symptoms:**
- Error code 187
- "Status is a duplicate" message

**Solutions:**
1. Tweet was already posted
2. Wait before posting identical content
3. Modify tweet text slightly

### Issue 3: Permission Error (403)

**Symptoms:**
- Error code 403
- "Forbidden" message

**Solutions:**
1. Check API credentials in `.env` file
2. Verify app has read+write permissions in Twitter Developer Portal
3. Regenerate access tokens if needed

### Issue 4: Authentication Error (401)

**Symptoms:**
- Error code 401
- "Unauthorized" message

**Solutions:**
1. Verify all credentials in `.env`:
   - TWITTER_API_KEY
   - TWITTER_API_SECRET
   - TWITTER_ACCESS_TOKEN
   - TWITTER_ACCESS_SECRET
2. Regenerate credentials in Twitter Developer Portal

## Troubleshooting Workflow

### Step 1: Check Current Rate Limits

```bash
npx tsx scripts/content-social/twitter-post-debug.ts --check-limits
```

Look for:
- Endpoints with 0 remaining requests
- Reset times in the past (should reset automatically)
- Endpoints that are rate limited

### Step 2: Debug Specific Tweet

```bash
npx tsx scripts/content-social/twitter-post-debug.ts -r 9 --dry-run
```

Verify:
- Tweet content is correct
- Character count is under 280
- URL is formatted properly
- No obvious issues with content

### Step 3: Attempt Actual Post

```bash
npx tsx scripts/content-social/twitter-post-debug.ts -r 9
```

Review:
- Exact error code and message
- Rate limit headers
- Wait times
- Diagnostic recommendations

### Step 4: Wait for Rate Limit Reset

If rate limited:
1. Note the reset time from the error output
2. Wait until after that time
3. Retry the post

## Understanding the Output

### Successful Post

```
═══════════════════════════════════════════════════════════
🐛 DEBUG POST - TWEET #9
═══════════════════════════════════════════════════════════
Slug:          sonicwall-breach-escalates-100-percent-cloud-backups-stolen
Headline:      SonicWall Breach Worse Than Feared: 100% of Cloud Backups Stolen
Primary Cat:   Data Breach
Severity:      high
Is Update:     false
Twitter Chars: 276/280

📦 EXACT API PAYLOAD:
{
  "text": "🚨 BREAKING: #SonicWall revises breach: 100% of MySonicWall..."
}

🚀 Attempting to post to Twitter...

✅ SUCCESS! Tweet posted successfully!
   Tweet ID: 1234567890
   URL: https://twitter.com/i/web/status/1234567890
```

### Failed Post with Rate Limit Info

```
❌ FAILED to post tweet

═══════════════════════════════════════════════════════════
❌ ERROR DETAILS
═══════════════════════════════════════════════════════════
Error Code:    429
Error Message: Request failed with code 429

📊 Rate Limit Info from Error:
   Limit:     50
   Remaining: 0
   Reset:     10/17/2025, 3:45:00 PM
   Wait:      12 minutes

💡 DIAGNOSTIC INFORMATION:
⚠️  ERROR 429: RATE LIMIT EXCEEDED

Possible causes:
  1. Too many tweets posted in short time window
  2. Twitter API v2 limits: 50 tweets per 15 minutes (app-level)
  3. Daily tweet limits: ~300 tweets per day (user-level)
  4. Rate limit may apply to failed attempts too

Solutions:
  1. Wait for rate limit window to reset (see reset time above)
  2. Check monthly tweet volume in Twitter Developer Portal
  3. Verify app authentication tier (Free vs Pro)
  4. Consider spreading posts over longer time periods
```

## Tips for Avoiding Rate Limits

### 1. Monitor Rate Limits Regularly

Check limits before running batch posts:
```bash
npx tsx scripts/content-social/twitter-post-debug.ts --check-limits
```

### 2. Implement Delays Between Posts

Use the delay flag in the main script:
```bash
npx tsx scripts/content-social/post-to-twitter-single.ts --delay 60
```

### 3. Batch Posts Intelligently

Instead of posting all at once:
- Post 10-15 tweets
- Wait 15+ minutes
- Post next batch

### 4. Track Failed Attempts

Failed attempts count against rate limits. If a post fails:
- Don't retry immediately
- Fix the issue first
- Wait for rate limit to reset

### 5. Use Test Mode First

Test with single tweet before batch posting:
```bash
npx tsx scripts/content-social/post-to-twitter-single.ts --test
```

## Related Documentation

- Main posting script: `scripts/content-social/post-to-twitter-single.ts`
- Twitter setup guide: `scripts/content-social/SETUP-TWITTER.md`
- Twitter Developer Portal: https://developer.twitter.com/
- Twitter API v2 Rate Limits: https://developer.twitter.com/en/docs/twitter-api/rate-limits

## When to Use This Script

Use `twitter-post-debug.ts` when:

1. ✅ Getting 429 (rate limit) errors
2. ✅ Posts failing unexpectedly
3. ✅ Need to check current rate limit status
4. ✅ Want to see exact API payload and response
5. ✅ Debugging authentication issues
6. ✅ Need detailed error diagnostics

Use the main `post-to-twitter-single.ts` for:

1. ✅ Normal posting operations
2. ✅ Batch posting multiple tweets
3. ✅ Production posting workflows

## Example Workflow: Investigating 429 Error

```bash
# 1. Check what happened
npx tsx scripts/content-social/twitter-post-debug.ts -r 9

# Output shows: "Remaining: 0 requests, Reset: 3:45 PM (12 minutes)"

# 2. Check overall rate limit status
npx tsx scripts/content-social/twitter-post-debug.ts --check-limits

# Output shows all endpoints and their limits

# 3. Wait for reset time (3:45 PM)

# 4. After 3:45 PM, retry
npx tsx scripts/content-social/twitter-post-debug.ts -r 9

# Output: "✅ SUCCESS! Tweet posted successfully!"
```

## Notes

- This script uses the exact same payload as the main posting script
- Rate limit information comes directly from Twitter's response headers
- The script does NOT modify or store any data
- All diagnostic information is displayed to console only
- Safe to run multiple times - dry run mode doesn't count against limits
