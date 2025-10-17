# LinkedIn Social Posting Strategy

**Status**: Planning  
**Last Updated**: October 16, 2025

---

## Platform Requirements

### API Access
- **API**: LinkedIn Marketing API v2
- **Authentication**: OAuth 2.0
- **Required Credentials**:
  - Client ID
  - Client Secret
  - Access Token (requires user authorization)
  - Organization/Company Page ID (for posting as company)

### Access Levels
- **Personal Profile**: Can post to personal feed
- **Company Page**: Requires admin access + separate OAuth flow
- **Rate Limits**: 100 posts per day (per user/org)

### Important Notes
- ⚠️ LinkedIn API access requires application review/approval
- ⚠️ "Marketing Developer Platform" access required for posting
- ⚠️ May take 5-10 business days for approval
- Alternative: Use LinkedIn's built-in scheduling (no API needed)

---

## Platform Constraints

### Text Limits
- **Character limit**: 3,000 characters per post
- **First 3 lines**: ~140 chars visible before "see more" (critical for hook)
- **Hashtags**: Max 3 recommended (up to 5 technically)
- **Links**: Full URLs visible (not shortened)

### Supported Content
- ✅ Text (3,000 chars - very generous)
- ✅ Images (up to 9 images per post)
- ✅ Links (with rich preview card)
- ✅ Documents (PDFs, PowerPoint, etc.)
- ✅ Videos (up to 10 minutes)
- ✅ Articles (LinkedIn native articles - separate feature)
- ✅ Polls (up to 4 options)
- ✅ **Formatting**: Line breaks, but NO markdown

### Best Practices
- **Hook**: First 2 lines (<140 chars) must grab attention
- **Formatting**: Use line breaks for readability (not walls of text)
- **Hashtags**: 3-5 relevant hashtags at the end
- **Links**: Add at bottom (preview card auto-generated)
- **CTAs**: "Read more", "Learn more", "Share your thoughts"
- **Timing**: Best engagement: Tue-Thu, 7-8 AM or 12-1 PM EST
- **Length**: 1,300-2,000 chars gets best engagement (not max length)

---

## Our Posting Strategy

### What We'll Post

**Option 1: Daily Digest Post** (Recommended)
```
Single comprehensive post:
- Publication headline + date
- Brief intro (2-3 sentences)
- Numbered list of top 5 articles (bullet points)
- Call-to-action (read full report)
- Link to publication page
- Hashtags
```

**Option 2: Individual Article Posts**
```
One post per critical article:
- Article headline
- Summary (200-400 words)
- Key takeaways (bullet points)
- Link to article
- Hashtags
```

**Option 3: Weekly Roundup**
```
Weekly post (Friday):
- Week's highlights
- Top 5 most critical threats
- Statistics (X CVEs, Y incidents)
- Link to all publications
```

### Recommended Approach: **Option 1 - Daily Digest Post**

**Why LinkedIn is different from Twitter**:
- Professional audience wants substance, not soundbites
- Longer content performs well (1,300-2,000 chars sweet spot)
- Can fit all 5-10 articles in single post (no threading needed)
- Daily cadence builds credibility

---

## Database Fields We'll Use

### From `publications` table:
```typescript
{
  headline: string,      // Main post headline
  summary: string,       // 2-3 sentence intro
  pub_date: string,      // "Daily Threat Report - October 16, 2025"
  article_count: number  // "10 critical threats today"
}
```

### From `published_articles` table:
```typescript
{
  headline: string,      // Article title (full, no truncation needed)
  summary: string,       // Use first 100-150 chars for preview
  slug: string,          // Build URL: https://cybernetsec.io/articles/{slug}
  position: number,      // Order in list (all 10 or top 5)
  
  // Optional enrichment (if we want more detail):
  // severity: string,   // Show severity badges
  // category: string[], // Show categories
}
```

---

## Post Format Template

### Daily Digest Post (1,500-2,000 chars)

```
🚨 Daily Cyber Threat Report - {pub_date}

{publication.summary (2-3 sentences, ~200 chars)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Today's Top Threats:

1️⃣ {article1.headline}
   {article1.summary (first sentence, ~100 chars)}

2️⃣ {article2.headline}
   {article2.summary (first sentence, ~100 chars)}

3️⃣ {article3.headline}
   {article3.summary (first sentence, ~100 chars)}

4️⃣ {article4.headline}
   {article4.summary (first sentence, ~100 chars)}

5️⃣ {article5.headline}
   {article5.summary (first sentence, ~100 chars)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📰 Read the full report with detailed analysis, CVE details, MITRE ATT&CK mappings, and sources:

🔗 {website_url}/publications/{pub_slug}

Stay informed. Stay secure. 🛡️

#CyberSecurity #ThreatIntelligence #InfoSec #CyberThreats #SecurityNews
```

### Alternative Format: Critical Threat Focus

```
⚠️ CRITICAL: {article.headline}

{article.summary (full 300-500 chars)}

🔍 Key Details:
• Severity: {severity}
• Affected: {companies/products}
• CVE: {cve_ids}
• MITRE: {top_3_techniques}

🛡️ Impact:
{impact_scope (2-3 sentences)}

📖 Full analysis with sources and recommendations:
🔗 {website_url}/articles/{slug}

Part of today's Daily Threat Report ({pub_date}):
🔗 {website_url}/publications/{pub_slug}

#CyberSecurity #ThreatIntelligence #CriticalAlert #{category}
```

---

## Character Budget Breakdown

### Daily Digest Format:
- Header (emoji + title + date): ~60 chars
- Publication summary: ~200 chars
- Separator line: ~45 chars
- "Today's Top Threats:" header: ~25 chars
- 5 articles × ~150 chars each: ~750 chars
- Separator line: ~45 chars
- Closing CTA: ~150 chars
- URL: ~60 chars
- Hashtags: ~80 chars
- Line breaks and spacing: ~85 chars
- **Total**: ~1,500 chars ✅ (well under 3,000 limit)

### Critical Article Format:
- Header: ~80 chars
- Summary: ~500 chars
- Key details section: ~200 chars
- Impact section: ~200 chars
- CTAs and URLs: ~150 chars
- Hashtags: ~80 chars
- Line breaks: ~40 chars
- **Total**: ~1,250 chars ✅

---

## Formatting Functions Needed

```typescript
// Format article list item for LinkedIn
function formatArticleItem(article: Article, position: number): string {
  const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][position - 1];
  
  // Get first sentence of summary (up to 100 chars)
  const summaryPreview = getFirstSentence(article.summary, 100);
  
  return `${emoji} ${article.headline}\n   ${summaryPreview}\n`;
}

// Get first sentence, truncate if needed
function getFirstSentence(text: string, maxChars: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const firstSentence = sentences[0].trim();
  
  if (firstSentence.length <= maxChars) return firstSentence;
  
  // Truncate at word boundary
  const truncated = firstSentence.slice(0, maxChars - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace) + '...';
}

// Create separator line
function separator(char: string = '━', length: number = 43): string {
  return char.repeat(length);
}
```

---

## Environment Variables Needed

```bash
# .env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_ORGANIZATION_ID=your_company_page_id  # If posting as company

# Website base URL for links
WEBSITE_BASE_URL=https://cybernetsec.io

# Optional: Personal vs Company posting
LINKEDIN_POST_AS=personal  # or 'company'
```

---

## NPM Packages

### Option 1: `linkedin-api-client` (Recommended for basic posting)
```bash
npm install linkedin-api-client
```

**Pros**: Simple, focused on posting
**Cons**: Less feature-rich

### Option 2: `node-linkedin` (Comprehensive)
```bash
npm install node-linkedin
```

**Pros**: Full LinkedIn API coverage
**Cons**: Heavier, more complex

### Option 3: Direct API calls with `fetch`
```typescript
// Post to LinkedIn using fetch
async function postToLinkedIn(text: string, url?: string) {
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: `urn:li:person:${personId}`, // or organization
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'ARTICLE',
          media: url ? [{
            status: 'READY',
            originalUrl: url
          }] : []
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    })
  });
  
  return response.json();
}
```

---

## Implementation Plan

### Phase 1: API Setup & Authentication
- [ ] Apply for LinkedIn Marketing Developer Platform access
- [ ] Create LinkedIn app
- [ ] Complete OAuth 2.0 flow
- [ ] Get access token and organization ID

### Phase 2: Data Retrieval
- [ ] Reuse `lib/db.ts` from Twitter implementation
- [ ] Create LinkedIn-specific queries (if needed)

### Phase 3: Formatting
- [ ] Create `lib/formatters.ts` with LinkedIn formatting
- [ ] Implement article list formatting
- [ ] Test character counts
- [ ] Validate against 3,000 char limit

### Phase 4: API Integration
- [ ] Choose npm package or direct API
- [ ] Set up authentication
- [ ] Create `post-to-linkedin.ts` script
- [ ] Test with personal profile first

### Phase 5: Company Page (Optional)
- [ ] Get admin access to company page
- [ ] Update OAuth flow for organization posting
- [ ] Test posting as company page

### Phase 6: Automation
- [ ] Add command-line arguments
- [ ] Add error handling and retries
- [ ] Create scheduling (separate from Twitter)
- [ ] Monitor rate limits (100 posts/day)

---

## Command-Line Interface

```bash
# Post latest publication
npx tsx scripts/content-social/post-to-linkedin.ts

# Post specific date
npx tsx scripts/content-social/post-to-linkedin.ts --date 2025-10-16

# Dry run (show post without publishing)
npx tsx scripts/content-social/post-to-linkedin.ts --dry-run

# Post as company page (requires setup)
npx tsx scripts/content-social/post-to-linkedin.ts --as-company

# Include all articles (default: top 5)
npx tsx scripts/content-social/post-to-linkedin.ts --all-articles

# Force repost
npx tsx scripts/content-social/post-to-linkedin.ts --force
```

---

## Success Metrics

### What to Track:
- ✅ Posts per week (recommend 5-7x/week for LinkedIn)
- ✅ Engagement rate (likes, comments, shares)
- ✅ Click-through rate (link clicks to website)
- ✅ Impressions and reach
- ✅ Follower growth
- ✅ Profile/page views

### LinkedIn Analytics API:
LinkedIn provides analytics for company pages:
- Impressions, clicks, engagement
- Follower demographics
- Viral reach vs organic reach

---

## Posting Schedule Recommendations

### Daily Digest (Mon-Fri):
```
7:00 AM EST - Post daily threat report
  ├─ Peak professional engagement time
  └─ People checking news before meetings
```

### Weekly Roundup (Friday):
```
12:00 PM EST - Post week-in-review
  ├─ Friday lunch break browsing
  └─ Sets tone for weekend security awareness
```

### Critical Alerts (As needed):
```
Immediate - Post breaking critical threats
  └─ Don't wait for daily digest if severity = critical
```

---

## Content Variations

### Standard Daily Post:
- Top 5 articles
- Professional tone
- Focus on business impact

### Weekly Roundup:
- Week's highlights
- Statistics and trends
- Forward-looking insights

### Critical Alert:
- Single article deep-dive
- Detailed analysis
- Actionable recommendations

### Thought Leadership (Optional):
- Analysis of trends across multiple publications
- Expert commentary
- Industry implications

---

## Key Differences: LinkedIn vs Twitter

| Aspect | Twitter | LinkedIn |
|--------|---------|----------|
| **Length** | 280 chars (thread) | 3,000 chars (single post) |
| **Format** | Thread of 7 tweets | Single comprehensive post |
| **Tone** | Casual, emoji-heavy | Professional, measured |
| **Content** | Headlines + snippets | Full summaries + analysis |
| **Hashtags** | 1-2 per tweet | 3-5 at end of post |
| **Links** | Shortened (t.co) | Full URLs with preview |
| **Posting** | 1x/day (thread) | 1x/day (digest) |
| **Engagement** | Retweets, replies | Shares, comments (deeper) |
| **Audience** | General tech/security | Business/enterprise focus |

---

## Next Steps

1. ✅ Document requirements (this file)
2. ⏳ Create Medium.md
3. ⏳ Apply for LinkedIn Marketing Developer Platform access
4. ⏳ Implement `lib/formatters.ts` for LinkedIn
5. ⏳ Implement `post-to-linkedin.ts`
6. ⏳ Test with personal profile
7. ⏳ Upgrade to company page posting

---

**Questions to Resolve**:
1. ❓ Should we post as personal profile or company page? (Company page recommended for brand)
2. ❓ Do we want to include all articles or just top 5? (Top 5 keeps post scannable)
3. ❓ Should we post weekends? (Recommend Mon-Fri only for LinkedIn)
4. ❓ Do we want separate "critical alert" posts? (Yes, for severity=critical)

**Decision Needed**:
- Confirm daily digest format
- Approve character budget and formatting
- Decide on posting schedule (daily vs selective)
- Determine if we need LinkedIn API approval or use alternative posting method
