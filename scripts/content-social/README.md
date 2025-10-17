# Social Media Publishing System

**Status**: Planning Phase  
**Last Updated**: October 16, 2025

---

## Overview

Automated social media publishing system for cybersecurity threat intelligence content. Leverages existing database content (no additional LLM calls needed) to post to Twitter/X, LinkedIn, and Medium.

---

## Architecture

```
Database (V2 Pipeline)
    │
    ├─ publications table (daily reports)
    └─ published_articles table (individual articles)
         │
         ├─ headline, summary (all platforms)
         ├─ full_report (Medium deep dives)
         └─ metadata (CVEs, MITRE, entities, sources)

         ↓

   Content Formatters
    │
    ├─ Twitter: Thread format (7 tweets)
    ├─ LinkedIn: Digest format (1,500 chars)
    └─ Medium: Article format (1,000-2,500 words)

         ↓

    Social APIs
    │
    ├─ Twitter API v2 (thread posting)
    ├─ LinkedIn Marketing API (digest posting)
    └─ Medium API v1 (article publishing)
```

---

## Platform Strategy

| Platform | Format | Length | Content Type | Posting Frequency |
|----------|--------|--------|--------------|-------------------|
| **Twitter/X** | Thread | 280 chars × 7 | Headlines + snippets | 1x/day (7 AM EST) |
| **LinkedIn** | Single Post | 1,500 chars | Summary + bullet list | 1x/day (7 AM EST) |
| **Medium** | Article | 1,000-2,500 words | Full deep dive | 1-2x/day (critical only) |

### Content Depth Hierarchy:
```
Twitter   → Quick updates, breaking news (AWARENESS)
LinkedIn  → Daily digest, business impact (ENGAGEMENT)  
Medium    → Technical deep dives, analysis (AUTHORITY)
```

---

## Documentation

### Platform-Specific Guides:
- **[TWITTER-X.md](./TWITTER-X.md)** - Thread format, 280 char limits, rate limits
- **[TWITTER-OG-METADATA-GUIDE.md](./TWITTER-OG-METADATA-GUIDE.md)** - ⭐ NEW: OG metadata benefits and setup
- **[LINKEDIN.md](./LINKEDIN.md)** - Digest format, 3,000 char limits, professional tone
- **[MEDIUM.md](./MEDIUM.md)** - Article format, markdown, canonical URLs

### Each guide includes:
- ✅ API requirements and authentication
- ✅ Platform constraints and limits
- ✅ Content format and templates
- ✅ Database fields mapping
- ✅ Formatting functions
- ✅ Environment variables
- ✅ NPM packages
- ✅ Implementation plan
- ✅ Success metrics

---

## Directory Structure

```
scripts/content-social/
├── README.md                 # This file (overview)
├── TWITTER-X.md              # Twitter/X requirements
├── LINKEDIN.md               # LinkedIn requirements
├── MEDIUM.md                 # Medium requirements
│
├── lib/                      # Shared utilities
│   ├── db.ts                 # Database query helpers
│   ├── formatters.ts         # Platform-specific formatters
│   ├── truncate.ts           # Text truncation utilities
│   └── tracking.ts           # Post tracking (social_posts table)
│
├── post-to-twitter.ts        # Twitter thread posting
├── post-to-linkedin.ts       # LinkedIn digest posting
├── post-to-medium.ts         # Medium article publishing
│
└── post-all.ts               # Unified posting (all platforms)
```

---

## Key Design Principles

### 1. **Database as Single Source of Truth**
- ✅ All content already in `publications` and `published_articles` tables
- ✅ No LLM calls needed for social posting
- ✅ Reuse `full_report`, `headline`, `summary` fields
- ✅ Platform formatters adapt existing content

### 2. **Platform-Specific Formatting**
- ✅ Each platform has unique constraints and audience
- ✅ Same content, different presentation
- ✅ Formatters in `lib/formatters.ts` handle differences

### 3. **No Content Duplication**
- ✅ Twitter: Headlines + snippets (awareness layer)
- ✅ LinkedIn: Summaries + business context (engagement layer)
- ✅ Medium: Full articles (authority layer)
- ✅ Each platform serves different purpose

### 4. **Canonical URLs**
- ✅ All posts link back to `cybernetsec.io`
- ✅ Medium articles use canonical URL (prevents SEO penalties)
- ✅ Social drives traffic TO website

### 5. **Quality Over Quantity**
- ✅ Twitter: Daily thread (top 5 articles)
- ✅ LinkedIn: Daily digest (top 5 articles)
- ✅ Medium: Critical articles only (1-2/day)
- ✅ No spam, no low-value content

---

## Environment Variables

```bash
# .env

# Website
WEBSITE_BASE_URL=https://cybernetsec.io

# Twitter/X
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_ORGANIZATION_ID=your_company_page_id  # Optional

# Medium
MEDIUM_INTEGRATION_TOKEN=your_integration_token
MEDIUM_USER_ID=your_user_id
MEDIUM_PUBLICATION_ID=your_publication_id  # Optional
```

---

## Database Schema Extensions

### New Table: `social_posts`
Track what's been posted to avoid duplicates:

```sql
CREATE TABLE social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,              -- 'twitter', 'linkedin', 'medium'
  publication_id TEXT,                 -- Links to publications (for threads/digests)
  article_id TEXT,                     -- Links to published_articles (for individual)
  post_type TEXT NOT NULL,             -- 'thread', 'digest', 'article'
  post_id TEXT NOT NULL,               -- Platform-specific post ID
  post_url TEXT NOT NULL,              -- Direct link to post
  posted_at TEXT NOT NULL,             -- ISO 8601 timestamp
  engagement_metrics TEXT,             -- JSON: { likes, shares, clicks, etc. }
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (publication_id) REFERENCES publications(id),
  FOREIGN KEY (article_id) REFERENCES published_articles(id),
  UNIQUE(platform, publication_id, post_type),  -- Prevent duplicate posts
  UNIQUE(platform, article_id, post_type)
);

CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_social_posts_posted_at ON social_posts(posted_at DESC);
CREATE INDEX idx_social_posts_publication ON social_posts(publication_id);
CREATE INDEX idx_social_posts_article ON social_posts(article_id);
```

### Usage:
```typescript
// Check if already posted
const exists = db.prepare(`
  SELECT COUNT(*) as count 
  FROM social_posts 
  WHERE platform = ? AND publication_id = ? AND post_type = ?
`).get('twitter', 'pub-2025-10-16', 'thread');

if (exists.count > 0) {
  console.log('Already posted to Twitter today');
  return;
}

// After posting, record it
db.prepare(`
  INSERT INTO social_posts (platform, publication_id, post_type, post_id, post_url, posted_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run('twitter', 'pub-2025-10-16', 'thread', tweetId, tweetUrl, new Date().toISOString());
```

---

## Implementation Phases

### Phase 1: Core Infrastructure ✅ (Planning Complete)
- ✅ Platform requirements documented
- ✅ Content strategy defined
- ✅ Database schema designed
- ⏳ Next: Implement shared utilities

### Phase 2: Twitter/X Implementation
- [ ] `lib/db.ts` - Database query functions
- [ ] `lib/formatters.ts` - Twitter formatting
- [ ] `lib/truncate.ts` - Character truncation
- [ ] `post-to-twitter.ts` - Thread posting
- [ ] Test with dry-run mode
- [ ] Post first real thread

### Phase 3: LinkedIn Implementation
- [ ] `lib/formatters.ts` - LinkedIn formatting (add to existing)
- [ ] `post-to-linkedin.ts` - Digest posting
- [ ] Apply for LinkedIn API access (if needed)
- [ ] Test with dry-run mode
- [ ] Post first real digest

### Phase 4: Medium Implementation
- [ ] `lib/formatters.ts` - Medium markdown formatting (add to existing)
- [ ] `post-to-medium.ts` - Article publishing
- [ ] Get Medium integration token
- [ ] Test with draft posts
- [ ] Publish first real article

### Phase 5: Automation
- [ ] `post-all.ts` - Unified script for all platforms
- [ ] `lib/tracking.ts` - Post tracking utilities
- [ ] Error handling and retries
- [ ] GitHub Actions workflow (schedule)
- [ ] Monitoring and alerts

### Phase 6: Analytics
- [ ] Query social engagement metrics
- [ ] Build dashboard (optional)
- [ ] A/B test posting times
- [ ] Optimize content formats

---

## Command-Line Interface

### Individual Platform Scripts:
```bash
# Twitter/X
npx tsx scripts/content-social/post-to-twitter.ts [--date YYYY-MM-DD] [--dry-run]

# LinkedIn
npx tsx scripts/content-social/post-to-linkedin.ts [--date YYYY-MM-DD] [--dry-run]

# Medium
npx tsx scripts/content-social/post-to-medium.ts [--article-id UUID] [--severity critical] [--dry-run]
```

### Unified Script (Future):
```bash
# Post to all platforms
npx tsx scripts/content-social/post-all.ts [--date YYYY-MM-DD] [--dry-run]

# Post to specific platforms
npx tsx scripts/content-social/post-all.ts --platforms twitter,linkedin

# Skip already posted
npx tsx scripts/content-social/post-all.ts --skip-existing
```

---

## Daily Posting Workflow

### Automated Daily Schedule:
```
6:00 AM CST - Content pipeline runs (search → structure → index → detect → publish)
7:00 AM CST - Social posting runs (Twitter + LinkedIn threads)
10:00 AM CST - Medium post #1 (if critical articles available)
3:00 PM CST - Medium post #2 (if 2+ critical articles available)
```

### Manual Workflow (for testing):
```bash
# 1. Check latest publication
npx tsx scripts/content-social/lib/db.ts --show-latest

# 2. Preview social posts (dry-run)
npx tsx scripts/content-social/post-to-twitter.ts --dry-run
npx tsx scripts/content-social/post-to-linkedin.ts --dry-run
npx tsx scripts/content-social/post-to-medium.ts --severity critical --dry-run

# 3. Post to platforms
npx tsx scripts/content-social/post-to-twitter.ts
npx tsx scripts/content-social/post-to-linkedin.ts
npx tsx scripts/content-social/post-to-medium.ts --severity critical

# 4. Verify posts
# Check social_posts table for confirmation
```

---

## Success Metrics

### Per-Platform Metrics:
| Platform | Primary Metric | Secondary Metrics |
|----------|----------------|-------------------|
| **Twitter** | Impressions | Retweets, replies, profile clicks |
| **LinkedIn** | Click-through rate | Shares, comments, followers |
| **Medium** | Read ratio | Views, claps, highlights, followers |

### Overall Metrics:
- 🎯 Website traffic from social (Google Analytics)
- 🎯 Email signups from social referrals
- 🎯 Total social reach (combined followers)
- 🎯 Engagement rate (avg across platforms)

### Weekly Review:
```sql
-- Posts per platform (last 7 days)
SELECT 
  platform,
  COUNT(*) as posts,
  COUNT(DISTINCT DATE(posted_at)) as days_posted
FROM social_posts
WHERE posted_at >= datetime('now', '-7 days')
GROUP BY platform;

-- Top performing posts (if engagement tracked)
SELECT 
  platform,
  post_url,
  json_extract(engagement_metrics, '$.likes') as likes,
  json_extract(engagement_metrics, '$.shares') as shares,
  posted_at
FROM social_posts
WHERE posted_at >= datetime('now', '-7 days')
ORDER BY likes DESC
LIMIT 10;
```

---

## Best Practices

### Content:
- ✅ Use existing database content (no new LLM generation)
- ✅ Platform-appropriate formatting (thread vs digest vs article)
- ✅ Always link back to website (canonical source)
- ✅ Include relevant hashtags (platform-specific limits)

### Posting:
- ✅ Post during peak engagement hours (7-9 AM EST)
- ✅ Check for duplicates before posting (social_posts table)
- ✅ Use dry-run mode for testing
- ✅ Monitor rate limits (especially Twitter)

### Tracking:
- ✅ Record all posts in social_posts table
- ✅ Store platform post IDs for reference
- ✅ Track engagement metrics (when available)
- ✅ Review weekly performance

### Errors:
- ✅ Log all errors with context
- ✅ Retry failed posts (with backoff)
- ✅ Alert on repeated failures
- ✅ Graceful degradation (skip platform if down)

---

## FAQ

### Q: Do we need LLMs for social posting?
**A: No!** All content already exists in the database:
- `headline` → Twitter/LinkedIn headlines
- `summary` → Twitter/LinkedIn snippets
- `full_report` → Medium articles
- All generated during content pipeline

### Q: How do we avoid duplicate posts?
**A:** Track posts in `social_posts` table with unique constraint on `(platform, publication_id, post_type)`.

### Q: What if LinkedIn API access is delayed?
**A:** Can start with Twitter + Medium, add LinkedIn later. Or use LinkedIn's built-in scheduling manually.

### Q: Should we post ALL articles to Medium?
**A:** No! Only critical/high severity (1-2/day max). Medium favors quality over quantity.

### Q: Can we schedule posts in advance?
**A:** Yes! Most platforms support scheduled posting:
- Twitter: TweetDeck or API scheduling
- LinkedIn: Native scheduling
- Medium: Draft → schedule publish
Or use GitHub Actions cron for automated posting.

### Q: How do we handle images?
**A:** Phase 2 feature:
1. Host images on website CDN
2. Reference in social posts (Twitter, LinkedIn support images)
3. Embed in Medium markdown

---

## Next Actions

1. **Immediate**: Implement `lib/db.ts` and `lib/formatters.ts` (shared utilities)
2. **Week 1**: Complete Twitter implementation and test
3. **Week 2**: Complete LinkedIn implementation and test
4. **Week 3**: Complete Medium implementation and test
5. **Week 4**: Build unified `post-all.ts` and automation

---

## Questions for Decision

1. ❓ **Twitter handle**: Post from personal or brand account?
2. ❓ **LinkedIn**: Personal profile or company page? (need admin access for company)
3. ❓ **Medium**: Personal or create Publication?
4. ❓ **Posting time**: 7 AM EST daily, or adjust based on audience timezone?
5. ❓ **Medium filter**: Critical only, or critical + high severity?
6. ❓ **Automation**: GitHub Actions (free) or cron on server?

---

**Ready to start implementation!** Next step: Create `lib/db.ts` with database query functions.
