# Twitter/X Social Posting Strategy

**Status**: Planning  
**Last Updated**: October 16, 2025

---

## Platform Requirements

### API Access
- **API**: Twitter/X API v2
- **Authentication**: OAuth 2.0 (App-only or User context)
- **Required Credentials**:
  - API Key
  - API Secret Key
  - Access Token
  - Access Token Secret
  - Bearer Token (for v2)

### Rate Limits
- **Tweet creation**: 300 tweets per 3-hour window (user context)
- **Thread posting**: Counts as individual tweets
- **Recommended**: Space posts 1-2 minutes apart to avoid rate limits

---

## Platform Constraints

### Text Limits
- **Character limit**: 280 characters per tweet
- **URLs**: Auto-shortened to 23 characters (t.co links)
- **Images**: Up to 4 images per tweet
- **Thread**: No limit on number of tweets in thread

### Supported Content
- ✅ Text (280 chars)
- ✅ Images (PNG, JPEG, GIF, WebP - max 5MB)
- ✅ Links (auto-preview with card)
- ✅ Hashtags (recommended: 1-2 per tweet)
- ✅ Mentions (@username)
- ✅ Emojis
- ❌ Markdown formatting (plain text only)

### Best Practices
- **Hashtags**: 1-2 per tweet (3+ decreases engagement)
- **Mentions**: Use sparingly (can be seen as spam)
- **Links**: Place at end of tweet
- **Threads**: Keep to 3-5 tweets max for engagement
- **Timing**: Post during peak hours (9-11 AM, 6-9 PM EST)

---

## Our Posting Strategy

### What We'll Post

**Option 1: Daily Summary Thread** (Recommended)
```
Tweet 1: Publication headline + summary (thread intro)
Tweet 2-6: Top 5 articles (one per tweet)
Tweet 7: Link to full publication on website
```

**Option 2: Individual Article Tweets**
```
Single tweet per article:
- Article headline
- Key takeaway (from summary)
- Link to article
- 1-2 hashtags
```

**Option 3: Hybrid Approach**
```
Daily thread for critical/high severity articles only
Individual tweets for medium/low severity throughout the day
```

### Recommended Approach: **Option 1 - Daily Summary Thread**

**Why?**
- Higher engagement (people follow threads)
- Establishes daily cadence
- Showcases variety of coverage
- Easier to automate

---

## Database Fields We'll Use

### From `publications` table:
```typescript
{
  headline: string,      // Thread intro headline
  summary: string,       // Brief overview (we'll truncate to ~200 chars)
  pub_date: string,      // For "Today's Threat Report: Oct 16, 2025"
  article_count: number  // "5 critical threats today"
}
```

### From `published_articles` table:
```typescript
{
  headline: string,      // Article title (truncate to fit)
  summary: string,       // Use first 150-200 chars
  slug: string,          // Build URL: https://cybernetsec.io/articles/{slug}
  position: number       // Order in thread (top 5 only)
}
```

### Available but NOT using (already in article data):
- ❌ `twitter_post` - This was in the old structured_news JSON schema
- ❌ `full_report` - Too long for Twitter

**NOTE**: Need to check if `twitter_post` field is available in published_articles. If not in normalized schema, we'll generate on-the-fly from headline + summary.

---

## Thread Format Template

### Tweet 1: Intro (280 char limit)
```
🚨 Today's Cyber Threat Report - {pub_date}

{publication.summary (truncated to ~180 chars)}

Top {article_count} threats below 🧵👇

#CyberSecurity #ThreatIntel
```

### Tweets 2-6: Articles (280 char limit each)
```
{position}/5: {article.headline (truncated to ~150 chars)}

{article.summary (first sentence, ~100 chars)}

🔗 {website_url}/articles/{slug}

#{category} #CyberSecurity
```

### Tweet 7: Closing
```
📰 Read the full report with sources, CVEs, and MITRE ATT&CK mappings:

🔗 {website_url}/publications/{pub_slug}

Stay safe out there! 🛡️

#CyberSecurity #InfoSec #ThreatIntel
```

---

## Character Budget Breakdown

### Tweet 1 (Intro):
- Emoji + "Today's Cyber Threat Report - ": ~35 chars
- Date (Oct 16, 2025): ~13 chars
- Publication summary: **~180 chars** (truncate if needed)
- "Top X threats below 🧵👇": ~25 chars
- Hashtags: ~30 chars
- **Total**: ~283 chars ⚠️ (need to shorten summary to 175)

### Tweets 2-6 (Articles):
- Position indicator "1/5: ": ~5 chars
- Article headline: **~150 chars** (truncate if needed)
- Article summary (1 sentence): **~100 chars**
- URL placeholder: ~23 chars (t.co)
- Emoji + spacing: ~5 chars
- Hashtags (2): ~30 chars
- **Total**: ~313 chars ⚠️ (need optimization)

**Revised Article Tweet Budget**:
```
Position: 5 chars
Headline: 120 chars (truncate with "...")
Summary: 80 chars (first sentence, truncate with "...")
URL: 25 chars
Spacing/emoji: 10 chars
Hashtags: 30 chars
-----------
Total: 270 chars ✅
```

---

## Truncation Strategy

### Priority Order (keep most important):
1. **URL** - Always include (required for traffic)
2. **Headline** - Core message (truncate at word boundary + "...")
3. **Category hashtag** - Helps discoverability
4. **Summary** - Add if space allows
5. **Extra hashtags** - Drop if needed

### Truncation Functions Needed:
```typescript
// Truncate at word boundary, add ellipsis
function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  
  const truncated = text.slice(0, maxChars - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return truncated.slice(0, lastSpace) + '...';
}

// Calculate actual tweet length (accounts for URLs)
function calculateTweetLength(text: string): number {
  // Twitter counts URLs as 23 chars regardless of actual length
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex) || [];
  
  let length = text.length;
  urls.forEach(url => {
    length = length - url.length + 23;
  });
  
  return length;
}
```

---

## Environment Variables Needed

```bash
# .env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# Website base URL for links
WEBSITE_BASE_URL=https://cybernetsec.io
```

---

## NPM Packages

### Option 1: `twitter-api-v2` (Recommended)
```bash
npm install twitter-api-v2
```

**Pros**:
- Full v2 API support
- TypeScript types included
- Active maintenance
- Thread posting built-in

**Usage**:
```typescript
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

// Post thread
await client.v2.tweetThread([
  'Tweet 1 text',
  'Tweet 2 text',
  'Tweet 3 text',
]);
```

### Option 2: Direct API calls with `fetch`
**Pros**: No dependencies  
**Cons**: More boilerplate, manual OAuth signing

---

## Implementation Plan

### Phase 1: Data Retrieval
- [x] Understand database schema
- [ ] Create `lib/db.ts` with query functions
- [ ] Test data retrieval for latest publication

### Phase 2: Formatting
- [ ] Create `lib/formatters.ts` with Twitter formatting
- [ ] Implement truncation functions
- [ ] Test tweet length calculations
- [ ] Validate against 280 char limit

### Phase 3: API Integration
- [ ] Install `twitter-api-v2`
- [ ] Set up authentication
- [ ] Create `post-to-twitter.ts` script
- [ ] Test with test account

### Phase 4: Automation
- [ ] Add command-line arguments (--date, --dry-run)
- [ ] Add error handling and retries
- [ ] Create scheduling (cron or GitHub Actions)
- [ ] Monitor rate limits

---

## Command-Line Interface

```bash
# Post latest publication as thread
npx tsx scripts/content-social/post-to-twitter.ts

# Post specific date
npx tsx scripts/content-social/post-to-twitter.ts --date 2025-10-16

# Dry run (show tweets without posting)
npx tsx scripts/content-social/post-to-twitter.ts --dry-run

# Post top 3 articles only
npx tsx scripts/content-social/post-to-twitter.ts --limit 3

# Force repost (even if already posted today)
npx tsx scripts/content-social/post-to-twitter.ts --force
```

---

## Success Metrics

### What to Track:
- ✅ Posts per day (should be 1 thread/day)
- ✅ Engagement rate (likes, retweets, replies)
- ✅ Click-through rate (link clicks to website)
- ✅ Follower growth
- ✅ Error rate (failed posts)

### Where to Store:
```sql
-- New table: social_posts
CREATE TABLE social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,              -- 'twitter', 'linkedin', 'medium'
  publication_id TEXT,                 -- Links to publications
  article_id TEXT,                     -- Links to published_articles (if single)
  post_type TEXT NOT NULL,             -- 'thread', 'single', 'retweet'
  post_id TEXT NOT NULL,               -- Twitter tweet ID
  posted_at TEXT NOT NULL,
  engagement_metrics TEXT,             -- JSON: { likes, retweets, replies, clicks }
  
  FOREIGN KEY (publication_id) REFERENCES publications(id),
  FOREIGN KEY (article_id) REFERENCES published_articles(id)
);
```

---

## Next Steps

1. ✅ Document requirements (this file)
2. ⏳ Create LinkedIn.md
3. ⏳ Create Medium.md
4. ⏳ Implement `lib/db.ts`
5. ⏳ Implement `lib/formatters.ts` for Twitter
6. ⏳ Implement `post-to-twitter.ts`

---

**Questions to Resolve**:
1. ❓ Do we have `twitter_post` field in `published_articles` or only in old `structured_news.data` JSON?
2. ❓ Should we post automatically (cron) or manually trigger?
3. ❓ Do we want to track social engagement metrics in database?
4. ❓ Should we include publication headline + summary, or just dive into articles?

**Decision Needed**:
- Confirm thread format (7 tweets: intro + 5 articles + closing)
- Approve character budget allocation
- Choose npm package (`twitter-api-v2` recommended)

---

## UPDATES - Oct 16, 2025

### ✅ FINAL IMPLEMENTATION:

1. **Format**: Individual standalone tweets (NOT threads)
   - Each article = separate tweet with URL
   - Better discoverability (each tweet ranks independently)
   - Every tweet drives traffic (not just thread starter)
   - More shareable

2. **Character Budget**: Max 240 chars for tweet text
   - **Prefix**: `🚨 BREAKING: ` (13 chars) or `📢 UPDATE: ` (13 chars)
   - **Space**: 1 char after prefix
   - **Tweet text**: **MAX 240 chars** (to leave room for prefix + URL)
   - **Newlines**: 2 chars (\n\n before URL)
   - **URL**: 23 chars (Twitter's t.co shortening)
   - **Total formula**: `prefix(13) + space(1) + tweet_text(240) + newlines(2) + url(23) = 279 chars`
   - **Safety margin**: 1 char buffer

3. **Images**: Attach category images (1024x1024px)
   - Located: `public/images/categories/{category}.png`
   - Examples: ransomware.png, malware.png, vulnerability.png
   - Cost: 0 characters!

4. **Hashtag Strategy - INLINE HASHTAGS**:
   - ✅ **2-5 hashtags per tweet** (average ~3)
   - ✅ **Inline hashtags**: "#LinkPro rootkit" instead of "LinkPro... #LinkPro"
   - ✅ **Specific entities**: CVE IDs (#CVE202524990), companies (#Microsoft, #F5), threat actors (#Qilin, #FlaxTyphoon)
   - ✅ **NO generic hashtags at end**: Avoid #CyberSecurity #InfoSec #ThreatIntel (unless naturally in text)
   - ✅ **CVE format**: New/prominent CVEs use #CVE202559230 (no hyphens), older CVEs plain text CVE-2021-43226
   - **Why**: Saves 20-30 chars, more natural reading, better engagement

5. **Content Generation Strategy**:
   - **Process one article at a time** (conserves LLM tokens)
   - Use `summary` + first 2000 chars of `full_report` for context
   - LLM generates optimized tweet with full article context
   - Save each tweet to individual JSON file (output-1.json, output-2.json, etc.)
   - Consolidate all individual files into master tweets.json
   - **Tomorrow's pipeline**: Pull from database one-by-one, not all at once

6. **Character Validation**:
   - Calculate: `prefix_len + 1 + tweet_text.length + 2 + 23`
   - Must be ≤ 280 chars total
   - Run validation before consolidation
   - Trim tweets that exceed limit

### Scripts Created:

1. **`scripts/content-social/post-to-twitter-single.ts`**
   - Posts individual article tweets (one URL per tweet)
   - Flags: `--dry-run`, `--test`, `--limit N`, `--delay N`, `--source FILE`
   - Default source: `tmp/twitter/tweets.json`
   - Adds prefix based on `is_update` field
   - Uploads category image from `public/images/categories/{primary_category}.png`
   - 10-second delay between posts (configurable)

2. **`scripts/content-social/post-to-twitter-threads.ts`**
   - Posts daily digest threads (7 tweets: intro + 5 articles + closing)
   - Use for daily summary format
   - Different use case than single tweets

3. **`scripts/content-social/consolidate-tweets.ts`**
   - Reads all `tmp/twitter/outputs/output-*.json` files
   - Combines into master `tmp/twitter/tweets.json`
   - Validates character counts
   - Shows stats (avg, min, max chars, hashtag distribution)
   - **This is the pattern for database extraction tomorrow**

### Token-Efficient Processing Pattern:

**One-by-one approach** (saves tokens):
```bash
# For each article from database:
1. Read article N (slug, headline, summary, full_report[0:2000])
2. Generate optimized tweet with LLM
3. Save to tmp/twitter/outputs/output-N.json
4. Move to next article

# After all articles processed:
5. Run consolidate-tweets.ts to create master tweets.json
6. Run post-to-twitter-single.ts to post all tweets
```

**Why NOT load all at once**:
- 20 articles × 2500 chars = 50,000 tokens wasted
- LLM context window fills up quickly
- Slower processing, higher cost
- Can't resume if interrupted

### Example Optimized Tweet:

**Before** (old approach, 232 chars):
```
Stealthy new Linux rootkit 'LinkPro' discovered! 🐧 Uses eBPF to hide itself, activated by network "magic packet." 🪄 Kernel-level evasion tech. #LinkPro #eBPF #Rootkit #Linux #CyberSecurity #Malware #CloudSecurity
```

**After** (inline hashtags, specific entities, 217 chars):
```
New #LinkPro Linux rootkit uses #eBPF to hide from security tools & waits for 'magic packet' to activate. 🐧🪄 Found in #AWS breach via #CVE202423897 Jenkins vuln. Kernel-level stealth making detection nearly impossible.
```

**Improvements**:
- ✅ Inline hashtags (#LinkPro in sentence)
- ✅ Specific CVE ID (#CVE202423897)
- ✅ More context (Jenkins, AWS, stealth capabilities)
- ✅ Removed 3 redundant generic hashtags
- ✅ 15 chars saved, fits with prefix + URL

### Real-World Results (Oct 15-16, 2025 batch):

**20 tweets generated**:
- Character range: 187-275 chars (tweet text only)
- Hashtags: 2-5 per tweet (avg 2.9)
- All under 280 total after adding prefix + URL
- Top entities: #Microsoft (3 tweets), #CISA (2), #CVE202559230 (1), #Cl0p (1)

### Validation Checklist:

Before posting tweets:
1. ✅ Run `consolidate-tweets.ts` to create tweets.json
2. ✅ Check for tweets over 280 chars
3. ✅ Trim long tweets (remove filler, abbreviate, shorten phrases)
4. ✅ Re-consolidate after edits
5. ✅ Run `post-to-twitter-single.ts --dry-run` to preview
6. ✅ Test first tweet with `--test` flag
7. ✅ Post all tweets

---

**NEXT SESSION TODO**:
1. Pull articles from database one-by-one
2. Generate optimized tweets (conserve tokens)
3. Consolidate into tweets.json
4. Validate character counts
5. Post to Twitter with delays

````
