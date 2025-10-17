# Medium Social Publishing Strategy

**Status**: Planning  
**Last Updated**: October 16, 2025

---

## Platform Requirements

### API Access
- **API**: Medium API v1
- **Authentication**: Self-issued access token OR OAuth 2.0
- **Required Credentials**:
  - Integration Token (from Medium settings)
  - User ID (obtained via API)

### Access Levels
- **Free Account**: Can publish articles
- **Medium Partner Program**: Monetization options
- **Publication**: Can create/join publications for multi-author blogs

### Important Notes
- ✅ Medium API is simple and doesn't require approval
- ✅ Just need to generate integration token from settings
- ⚠️ Limited API features (no analytics, no image upload via API)
- 💡 Alternative: Medium also has RSS import feature

---

## Platform Constraints

### Content Format
- **Format**: Full HTML or Markdown
- **Length**: No hard limit (recommend 400-2,000 words)
- **Images**: Markdown image URLs (must be hosted externally)
- **Code blocks**: Supported with syntax highlighting
- **Embeds**: Twitter, YouTube, GitHub Gists

### Supported Content
- ✅ **Markdown** (full support)
- ✅ **HTML** (full support)
- ✅ **Images** (via external URLs)
- ✅ **Code blocks** (```language)
- ✅ **Headers** (H1-H6)
- ✅ **Lists** (ordered, unordered)
- ✅ **Block quotes**
- ✅ **Links**
- ✅ **Tables** (basic)
- ❌ **Direct image upload** (must host images on CDN/website)

### Article Metadata
- **Title**: Required
- **Tags**: Up to 5 tags
- **Canonical URL**: Points to original source (important!)
- **License**: All rights reserved, public domain, CC licenses
- **Publish status**: 'public', 'draft', 'unlisted'

### Best Practices
- **Length**: 400-2,000 words (7-8 min read) performs best
- **Images**: Use hero image + 2-3 inline images
- **Headers**: Break content into scannable sections
- **Lists**: Bullet points increase readability
- **Links**: Link to sources (builds credibility)
- **Tags**: Use all 5 tags (helps discovery)
- **Canonical URL**: Always set to your website (prevents SEO penalties)
- **Reading time**: 5-10 minute articles get best engagement

---

## Our Publishing Strategy

### What We'll Publish

**Option 1: Daily Digest Article** (Recommended)
```
Single comprehensive article:
- Title: "Daily Cyber Threat Report - {date}"
- Intro: 2-3 paragraph overview
- Sections: One section per article (top 5)
- Each section: Headline, summary, key details
- Conclusion: Links to full reports
- Call-to-action: Subscribe on website
```

**Option 2: Individual Deep-Dive Articles**
```
One article per critical threat:
- Full article content (1,000-2,000 words)
- Detailed analysis
- Technical breakdown
- Recommendations
- Sources and references
```

**Option 3: Weekly Roundup**
```
Weekly comprehensive report:
- Week's top 10 threats
- Trend analysis
- Statistics and insights
- Forward-looking predictions
```

### Recommended Approach: **Option 2 - Individual Deep-Dive Articles**

**Why Medium is different from Twitter/LinkedIn**:
- Medium audience wants depth, not summaries
- Longer content (1,000+ words) performs better
- Perfect for publishing `full_report` field from database
- Can include technical details, CVEs, MITRE ATT&CK
- Better for SEO and thought leadership
- Each article becomes a permanent resource

**Posting Cadence**:
- **Daily**: 1-2 critical articles (severity: critical/high)
- **Weekly**: 5-10 articles total
- **Not recommended**: Daily digest (too short for Medium)

---

## Database Fields We'll Use

### From `published_articles` table:
```typescript
{
  headline: string,          // Article title (H1)
  summary: string,           // Article subtitle (Medium supports this)
  full_report: string,       // MAIN CONTENT (1,000-2,500 words) ⭐
  slug: string,              // For canonical URL
  original_pub_date: string, // Publication date
  
  // Optional enrichment:
  // category: string[],     // Convert to Medium tags
  // severity: string,       // Show in intro
  // cves: CVE[],           // List in "Technical Details" section
  // entities: Entity[],    // List threat actors, malware, etc.
  // sources: Source[],     // Include as references section
}
```

### Key Insight:
- ✅ **We already have perfect Medium content**: The `full_report` field!
- ✅ **1,000-2,500 words**: Ideal Medium length
- ✅ **Structured**: Can add sections for CVEs, MITRE, sources
- ❌ **No LLM needed**: Content already generated

---

## Article Template (Markdown)

### Structure:
```markdown
# {article.headline}

## {article.summary}

---

{article.full_report}

---

## Technical Details

### CVEs Referenced
{cve_list}

### MITRE ATT&CK Techniques
{mitre_techniques_list}

### Affected Products/Vendors
{entities: products and companies}

---

## Sources

{sources_list with links}

---

## About This Report

This analysis is part of our Daily Cyber Threat Report for {pub_date}.

📰 Read the full report: [Daily Threat Report - {pub_date}]({canonical_url})

🔔 Subscribe for daily threat intelligence: [{website_url}]({website_url})

---

*Originally published at [{website_url}]({canonical_url})*
```

### Example Article:

```markdown
# Cl0p Ransomware Gang Exploits Critical Oracle E-Business Suite Zero-Day

## Mass extortion campaign targets enterprise Oracle deployments with CVE-2025-61882

---

The Cl0p ransomware gang has launched a widespread extortion campaign exploiting a critical zero-day vulnerability (CVE-2025-61882, CVSS 9.8) in Oracle E-Business Suite. The vulnerability allows unauthenticated remote code execution, enabling attackers to deploy ransomware and exfiltrate sensitive data.

Security researchers first observed exploitation attempts on October 5, 2025, targeting large enterprises across financial services, healthcare, and manufacturing sectors. Oracle released emergency patches on October 6, but many organizations remain vulnerable due to complex patching processes for EBS environments.

[... rest of full_report content ...]

---

## Technical Details

### CVEs Referenced
- **CVE-2025-61882** (CVSS 9.8, Critical) - Oracle E-Business Suite RCE
  - Added to CISA KEV catalog
  - Active exploitation confirmed
  - Emergency patch available

### MITRE ATT&CK Techniques
- **T1190** - Exploit Public-Facing Application (Initial Access)
- **T1486** - Data Encrypted for Impact (Impact)
- **T1567** - Exfiltration Over Web Service (Exfiltration)

### Affected Products/Vendors
- Oracle E-Business Suite (versions 12.1, 12.2)
- Oracle Database (backend)

### Organizations Impacted
- Citibank (confirmed)
- 15+ Fortune 500 companies (unconfirmed)

---

## Sources

1. [BleepingComputer - Cl0p exploits Oracle zero-day](https://www.bleepingcomputer.com/...)
2. [Oracle Security Alert - CVE-2025-61882](https://www.oracle.com/security-alerts/...)
3. [CISA KEV Catalog - CVE-2025-61882](https://www.cisa.gov/known-exploited-vulnerabilities)

---

## About This Report

This analysis is part of our Daily Cyber Threat Report for October 9, 2025.

📰 Read the full report: [Daily Threat Report - Oct 9, 2025](https://cybernetsec.io/publications/daily-threat-report-2025-10-09)

🔔 Subscribe for daily threat intelligence: [cybernetsec.io](https://cybernetsec.io)

---

*Originally published at [cybernetsec.io/articles/clop-exploits-critical-oracle-ebs-zero-day](https://cybernetsec.io/articles/clop-exploits-critical-oracle-ebs-zero-day)*
```

---

## Formatting Functions Needed

```typescript
// Convert article to Medium markdown
function formatForMedium(article: Article, publication: Publication): string {
  const sections = [];
  
  // Title and subtitle
  sections.push(`# ${article.headline}\n`);
  sections.push(`## ${article.summary}\n`);
  sections.push('---\n');
  
  // Main content (full_report)
  sections.push(article.full_report);
  sections.push('\n---\n');
  
  // Technical details section
  if (article.cves?.length > 0) {
    sections.push('## Technical Details\n\n');
    sections.push('### CVEs Referenced\n');
    article.cves.forEach(cve => {
      sections.push(`- **${cve.id}** (CVSS ${cve.cvss_score}, ${cve.severity})\n`);
      if (cve.kev) sections.push('  - Added to CISA KEV catalog\n');
    });
    sections.push('\n');
  }
  
  // MITRE ATT&CK section
  if (article.mitre_techniques?.length > 0) {
    sections.push('### MITRE ATT&CK Techniques\n');
    article.mitre_techniques.forEach(tech => {
      sections.push(`- **${tech.id}** - ${tech.name} (${tech.tactic})\n`);
    });
    sections.push('\n');
  }
  
  // Entities section
  if (article.entities?.length > 0) {
    const products = article.entities.filter(e => e.type === 'product');
    const companies = article.entities.filter(e => e.type === 'company');
    
    if (products.length > 0) {
      sections.push('### Affected Products\n');
      products.forEach(p => sections.push(`- ${p.name}\n`));
      sections.push('\n');
    }
    
    if (companies.length > 0) {
      sections.push('### Organizations Impacted\n');
      companies.forEach(c => sections.push(`- ${c.name}\n`));
      sections.push('\n');
    }
  }
  
  sections.push('---\n\n');
  
  // Sources section
  if (article.sources?.length > 0) {
    sections.push('## Sources\n\n');
    article.sources.forEach((source, idx) => {
      sections.push(`${idx + 1}. [${source.title || source.website}](${source.url})\n`);
    });
    sections.push('\n---\n\n');
  }
  
  // About section
  const articleUrl = `${process.env.WEBSITE_BASE_URL}/articles/${article.slug}`;
  const pubUrl = `${process.env.WEBSITE_BASE_URL}/publications/${publication.slug}`;
  
  sections.push('## About This Report\n\n');
  sections.push(`This analysis is part of our Daily Cyber Threat Report for ${publication.pub_date}.\n\n`);
  sections.push(`📰 Read the full report: [Daily Threat Report - ${publication.pub_date}](${pubUrl})\n\n`);
  sections.push(`🔔 Subscribe for daily threat intelligence: [cybernetsec.io](${process.env.WEBSITE_BASE_URL})\n\n`);
  sections.push('---\n\n');
  sections.push(`*Originally published at [${articleUrl}](${articleUrl})*\n`);
  
  return sections.join('');
}

// Convert category to Medium tags (max 5)
function getMedianTags(article: Article): string[] {
  const tags = [];
  
  // Always include base tags
  tags.push('cybersecurity', 'threat-intelligence');
  
  // Add category-based tags
  if (article.category?.includes('Ransomware')) tags.push('ransomware');
  if (article.category?.includes('Data Breach')) tags.push('data-breach');
  if (article.category?.includes('Vulnerability')) tags.push('vulnerability');
  
  // Add severity-based tag
  if (article.severity === 'critical') tags.push('critical-alert');
  
  // Limit to 5 tags
  return tags.slice(0, 5);
}
```

---

## Environment Variables Needed

```bash
# .env
MEDIUM_INTEGRATION_TOKEN=your_integration_token
MEDIUM_USER_ID=your_user_id  # Obtained via API

# Optional: Publish to Medium Publication (not personal)
MEDIUM_PUBLICATION_ID=your_publication_id

# Website base URL for canonical links
WEBSITE_BASE_URL=https://cybernetsec.io
```

---

## NPM Packages

### Option 1: `medium-sdk` (Recommended)
```bash
npm install medium-sdk
```

**Usage**:
```typescript
import MediumSDK from 'medium-sdk';

const client = new MediumSDK({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET'
});

// Set integration token
client.setAccessToken(process.env.MEDIUM_INTEGRATION_TOKEN!);

// Get user ID
const user = await client.getUser();

// Create post
await client.createPost({
  userId: user.data.id,
  title: 'Article Title',
  contentFormat: 'markdown',
  content: markdownContent,
  tags: ['cybersecurity', 'threat-intelligence'],
  publishStatus: 'public',
  canonicalUrl: 'https://cybernetsec.io/articles/slug',
  license: 'all-rights-reserved'
});
```

### Option 2: Direct API calls with `fetch`
```typescript
async function postToMedium(article: {
  title: string;
  content: string;
  tags: string[];
  canonicalUrl: string;
}) {
  // Get user ID
  const userResponse = await fetch('https://api.medium.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${process.env.MEDIUM_INTEGRATION_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  const user = await userResponse.json();
  
  // Create post
  const postResponse = await fetch(`https://api.medium.com/v1/users/${user.data.id}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MEDIUM_INTEGRATION_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: article.title,
      contentFormat: 'markdown',
      content: article.content,
      tags: article.tags,
      canonicalUrl: article.canonicalUrl,
      publishStatus: 'public',
      license: 'all-rights-reserved'
    })
  });
  
  return postResponse.json();
}
```

---

## Implementation Plan

### Phase 1: API Setup
- [ ] Create Medium account (if needed)
- [ ] Generate integration token from settings
- [ ] Get user ID via API
- [ ] (Optional) Create/join Medium Publication

### Phase 2: Data Retrieval
- [ ] Reuse `lib/db.ts` from Twitter/LinkedIn
- [ ] Add function to get critical/high severity articles
- [ ] Query full_report, cves, entities, sources

### Phase 3: Formatting
- [ ] Create `lib/formatters.ts` with Medium markdown formatting
- [ ] Implement technical details sections
- [ ] Test markdown rendering
- [ ] Validate canonical URLs

### Phase 4: API Integration
- [ ] Install `medium-sdk` or implement direct API
- [ ] Set up authentication
- [ ] Create `post-to-medium.ts` script
- [ ] Test with draft posts first

### Phase 5: Image Handling (Future)
- [ ] Host images on website CDN
- [ ] Update markdown to reference hosted images
- [ ] Test image rendering on Medium

### Phase 6: Automation
- [ ] Add command-line arguments
- [ ] Add error handling and retries
- [ ] Filter by severity (critical/high only)
- [ ] Create scheduling (1-2 posts/day)

---

## Command-Line Interface

```bash
# Publish latest critical article
npx tsx scripts/content-social/post-to-medium.ts

# Publish specific article by ID
npx tsx scripts/content-social/post-to-medium.ts --article-id <uuid>

# Publish all critical articles from latest publication
npx tsx scripts/content-social/post-to-medium.ts --date 2025-10-16 --severity critical

# Dry run (generate markdown without publishing)
npx tsx scripts/content-social/post-to-medium.ts --dry-run

# Publish as draft (for review)
npx tsx scripts/content-social/post-to-medium.ts --draft

# Publish to Medium Publication (not personal)
npx tsx scripts/content-social/post-to-medium.ts --publication

# Force republish
npx tsx scripts/content-social/post-to-medium.ts --article-id <uuid> --force
```

---

## Success Metrics

### What to Track:
- ✅ Articles published per week
- ✅ Views per article
- ✅ Reads (% who scroll to end)
- ✅ Reading time
- ✅ Claps (Medium's "like" feature)
- ✅ Highlights (text users highlight)
- ✅ Responses (comments)
- ✅ Followers gained

### Medium Stats API:
Medium provides limited analytics:
- Views, reads, read ratio
- Total reading time
- No API access to analytics (manual only)

### Store in Database:
```sql
-- Extend social_posts table
INSERT INTO social_posts (
  platform,
  publication_id,
  article_id,
  post_type,
  post_id,        -- Medium post ID
  post_url,       -- Medium post URL
  posted_at
) VALUES (
  'medium',
  'pub-2025-10-09',
  'article-uuid',
  'article',
  'medium-post-id',
  'https://medium.com/@username/article-slug',
  '2025-10-16T10:00:00Z'
);
```

---

## Posting Schedule Recommendations

### Daily Posting (Critical/High only):
```
10:00 AM EST - Post 1st critical article
  └─ Mid-morning reading time

3:00 PM EST - Post 2nd critical article (if available)
  └─ Afternoon break reading time
```

### Weekly Cadence:
- **Mon-Fri**: 1-2 articles/day (5-10/week total)
- **Weekends**: No posting (Medium audience less active)
- **Filter**: Only severity = critical or high
- **Goal**: Quality over quantity

### Avoid:
- ❌ Posting more than 2/day (spam risk)
- ❌ Posting low-severity articles (dilutes value)
- ❌ Posting daily digests (too short for Medium)

---

## Canonical URL Strategy

### Critical for SEO:
```typescript
// Always set canonical URL to YOUR website
const canonicalUrl = `https://cybernetsec.io/articles/${article.slug}`;

await client.createPost({
  // ...
  canonicalUrl: canonicalUrl,  // Points to YOUR site as original
  license: 'all-rights-reserved'
});
```

**Why this matters**:
- Medium posts won't compete with your website in Google
- Your website remains the "original source"
- Medium drives traffic TO your site
- No duplicate content penalties

---

## Medium Publications (Optional)

### What is a Publication?
- Multi-author blog on Medium
- Custom branding and domain
- Can submit posts for editorial review
- Better for building brand vs personal profile

### Creating a Publication:
1. Go to Medium settings → Publications
2. Create new publication: "CybernetSec Threat Intelligence"
3. Set branding (logo, description, colors)
4. Get publication ID from API

### Posting to Publication:
```typescript
// Get publication ID
const pubs = await client.getPublications(userId);
const pubId = pubs.data[0].id;

// Post to publication
await client.createPostInPublication({
  publicationId: pubId,
  title: 'Article Title',
  content: markdownContent,
  // ... same as before
});
```

**Recommended**: Start with personal profile, upgrade to publication later if needed.

---

## Content Reuse Strategy

### Medium is PERFECT for:
- ✅ Repurposing existing `full_report` content
- ✅ Building thought leadership
- ✅ SEO backlinks to your website
- ✅ Reaching Medium's cybersecurity audience
- ✅ Long-form technical deep dives

### Cross-Platform Content Flow:
```
Database (full_report)
    ├─ Twitter: Headline + snippet (thread)
    ├─ LinkedIn: Summary + bullet points (digest)
    └─ Medium: Full article (deep dive) ⭐ MOST VALUABLE
```

Each platform gets appropriate depth for its audience.

---

## Next Steps

1. ✅ Document requirements (this file)
2. ⏳ Get Medium integration token
3. ⏳ Implement `lib/formatters.ts` for Medium
4. ⏳ Implement `post-to-medium.ts`
5. ⏳ Test with draft posts
6. ⏳ Publish first critical article
7. ⏳ Monitor engagement and iterate

---

**Questions to Resolve**:
1. ❓ Personal profile or create Publication? (Start with personal)
2. ❓ Post all articles or only critical/high? (Only critical/high - quality focus)
3. ❓ Daily posting limit? (1-2/day max)
4. ❓ Should we include images? (Phase 2 - host images on website CDN)

**Decision Needed**:
- Confirm article template and markdown structure
- Approve technical details sections (CVEs, MITRE, sources)
- Determine severity filter (critical only vs critical+high)
- Set posting cadence (1/day vs 2/day)
