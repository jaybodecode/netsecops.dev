# RSS Feed System - As-Built Documentation

**Domain:** https://cyber.netsecops.io  
**Last Updated:** October 13, 2025  
**Status:** ✅ Production Ready

---

## Overview

Complete RSS 2.0 feed system providing cybersecurity threat intelligence via RSS readers. Includes publication feeds, article feeds, and category-specific feeds with UTM tracking for Google Analytics.

---

## System Architecture

### Feed Generation Pipeline

```
Step 8: Generate RSS Feeds (run-pipeline.ts)
    ↓
scripts/content-generation/cli/generate-rss-feeds.ts
    ↓
Reads: logs/content-generation.db (SQLite)
    ↓
Generates:
    - public/rss/all.xml (All Publications Feed)
    - public/rss/updates.xml (All Articles Feed)
    - public/rss/categories/*.xml (Category Feeds)
    - public/rss/metadata.json (Feed Information)
```

### Database Schema Used

```sql
-- Publications Table
CREATE TABLE publications (
  pub_id INTEGER PRIMARY KEY,
  slug TEXT,
  pub_type TEXT,  -- daily, weekly, monthly, special
  headline TEXT,
  summary TEXT,
  created_at TEXT,
  entity_id INTEGER
);

-- Articles Table
CREATE TABLE articles (
  article_id INTEGER PRIMARY KEY,
  slug TEXT,
  headline TEXT,
  summary TEXT,
  category TEXT,  -- JSON array: ["Data Breach","Ransomware"]
  severity TEXT,  -- critical, high, medium, low
  created_at TEXT,
  updated_at TEXT,
  entity_id INTEGER
);

-- Publication Articles (Many-to-Many)
CREATE TABLE publication_articles (
  pub_id INTEGER,
  article_id INTEGER
);

-- Entities (Sources)
CREATE TABLE entities (
  entity_id INTEGER PRIMARY KEY,
  entity_name TEXT
);

-- Article CVEs
CREATE TABLE article_cves (
  article_id INTEGER,
  cve_id INTEGER
);

-- Article Entities (Related Threat Actors, etc.)
CREATE TABLE article_entities (
  article_id INTEGER,
  entity_id INTEGER
);
```

---

## RSS Feeds Specification

### 1. All Publications Feed
**URL:** https://cyber.netsecops.io/rss/all.xml  
**File:** `public/rss/all.xml`  
**Purpose:** Latest publications (daily digests, weekly roundups, monthly reports, special editions)

**Content:**
- Last 5 publications (any type)
- Ordered by publication date (newest first)
- Includes publication type as category

**Item Format:**
```xml
<item>
  <title>Daily Digest - October 11, 2025</title>
  <link>https://cyber.netsecops.io/publications/daily-2025-10-11?utm_source=rss&utm_medium=feed&utm_campaign=all_publications</link>
  <description><![CDATA[Latest cybersecurity threat intelligence...]]></description>
  <pubDate>Fri, 11 Oct 2025 09:30:00 GMT</pubDate>
  <guid isPermaLink="true">https://cyber.netsecops.io/publications/daily-2025-10-11?utm_source=rss&utm_medium=feed&utm_campaign=all_publications</guid>
  <category>daily</category>
</item>
```

**Current Stats:**
- 4 publications in feed
- Types: daily, weekly, monthly, special

---

### 2. All Articles Feed (Updates Feed)
**URL:** https://cyber.netsecops.io/rss/updates.xml  
**File:** `public/rss/updates.xml`  
**Purpose:** All articles including newly published and recently updated

**Content:**
- Last 20 articles (both NEW and UPDATED)
- Ordered by update date (most recent first)
- Articles with NEW or UPDATED tags

**Item Format:**
```xml
<item>
  <title>[UPDATED] Clop Exploits Critical Oracle EBS Zero-Day (CVE-2025-61882)</title>
  <link>https://cyber.netsecops.io/articles/clop-exploits-critical-oracle-ebs-zero-day-cve-2025-61882?utm_source=rss&utm_medium=feed&utm_campaign=all_articles</link>
  <description><![CDATA[<p><strong>Update:</strong> Article has been updated with new information.</p>]]></description>
  <pubDate>Fri, 11 Oct 2025 14:23:00 GMT</pubDate>
  <guid isPermaLink="false">article:clop-exploits-critical-oracle-ebs-zero-day-cve-2025-61882:update:1</guid>
  <category>Data Breach</category>
  <category>Ransomware</category>
  <category>UPDATED</category>
</item>
```

**Categories:**
- `NEW` - Articles published within last 24 hours
- `UPDATED` - Articles updated after initial publication
- Plus content categories (Data Breach, Ransomware, etc.)

**Current Stats:**
- 7 articles in feed
- Mix of NEW and UPDATED articles

---

### 3. Category-Specific Feeds
**URL Pattern:** https://cyber.netsecops.io/rss/categories/{category-slug}.xml  
**Directory:** `public/rss/categories/`  
**Purpose:** Articles filtered by specific threat category

**Available Categories:**

| Category | File | Articles | UTM Campaign |
|----------|------|----------|--------------|
| Data Breach | `data-breach.xml` | 4 | `data-breach` |
| Threat Actor | `threat-actor.xml` | 4 | `threat-actor` |
| Ransomware | `ransomware.xml` | 3 | `ransomware` |
| Supply Chain Attack | `supply-chain-attack.xml` | 2 | `supply-chain-attack` |
| Vulnerability | `vulnerability.xml` | 2 | `vulnerability` |
| Cloud Security | `cloud-security.xml` | 1 | `cloud-security` |
| Cyberattack | `cyberattack.xml` | 1 | `cyberattack` |
| Industrial Control Systems | `industrial-control-systems.xml` | 1 | `industrial-control-systems` |

**Content:**
- Last 20 articles in that category
- Ordered by update date
- Includes all article categories (not just primary)

**Item Format:**
```xml
<item>
  <title>Clop Exploits Critical Oracle EBS Zero-Day (CVE-2025-61882)</title>
  <link>https://cyber.netsecops.io/articles/clop-exploits-critical-oracle-ebs-zero-day-cve-2025-61882?utm_source=rss&utm_medium=feed&utm_campaign=data-breach</link>
  <description><![CDATA[Enterprise databases compromised via unpatched vulnerability...]]></description>
  <pubDate>Fri, 11 Oct 2025 14:23:00 GMT</pubDate>
  <guid isPermaLink="true">https://cyber.netsecops.io/articles/clop-exploits-critical-oracle-ebs-zero-day-cve-2025-61882</guid>
  <category>Data Breach</category>
  <category>Ransomware</category>
</item>
```

**Note:** Categories are automatically detected from database. New categories create new feeds automatically.

---

## UTM Tracking Implementation

### Purpose
Track RSS feed traffic in Google Analytics 4 to understand:
- Which feeds drive most traffic
- Which articles are most popular from RSS readers
- User engagement from RSS vs other sources
- Category feed performance

### UTM Parameter Structure

All article/publication links include three UTM parameters:

```
?utm_source=rss&utm_medium=feed&utm_campaign={campaign_name}
```

### Campaign Naming Convention

| Feed Type | Campaign Value | Example |
|-----------|---------------|---------|
| All Publications | `all_publications` | `utm_campaign=all_publications` |
| All Articles | `all_articles` | `utm_campaign=all_articles` |
| Category Feeds | `{category-slug}` | `utm_campaign=data-breach` |

### Implementation Details

**File:** `scripts/content-generation/cli/generate-rss-feeds.ts`

**Lines 149-150:** All Publications Feed
```typescript
link: `${BASE_URL}/publications/${pub.slug}?utm_source=rss&utm_medium=feed&utm_campaign=all_publications`,
guid: `${BASE_URL}/publications/${pub.slug}?utm_source=rss&utm_medium=feed&utm_campaign=all_publications`,
```

**Lines 261:** All Articles Feed
```typescript
link: `${BASE_URL}/articles/${article.slug}?utm_source=rss&utm_medium=feed&utm_campaign=all_articles`,
```

**Lines 421:** Category Feeds
```typescript
link: `${BASE_URL}/articles/${article.slug}?utm_source=rss&utm_medium=feed&utm_campaign=${slug}`,
```

### Analytics Setup Required

**Google Tag Manager:**
- ✅ GA4 Configuration Tag (with Measurement ID)
- ✅ GA4 Page View Tag (fires on all pages)
- ℹ️ UTM parameters automatically captured by GA4

**See:** `GOOGLE-ANALYTICS-RSS-SETUP.md` for detailed setup instructions

---

## Feed Metadata

**File:** `public/rss/metadata.json`  
**Purpose:** Powers the RSS subscription page at `/rss`

**Structure:**
```json
{
  "generated_at": "2025-10-13T10:30:00.000Z",
  "feeds": {
    "all": {
      "title": "All Publications",
      "description": "Latest cybersecurity publications",
      "url": "/rss/all.xml",
      "full_url": "https://cyber.netsecops.io/rss/all.xml",
      "item_count": 4,
      "last_updated": "2025-10-13T10:30:00.000Z"
    },
    "updates": {
      "title": "All Articles",
      "description": "All articles including new and updated",
      "url": "/rss/updates.xml",
      "full_url": "https://cyber.netsecops.io/rss/updates.xml",
      "item_count": 7,
      "last_updated": "2025-10-13T10:30:00.000Z"
    },
    "categories": [
      {
        "name": "Data Breach",
        "slug": "data-breach",
        "article_count": 4,
        "url": "/rss/categories/data-breach.xml",
        "full_url": "https://cyber.netsecops.io/rss/categories/data-breach.xml",
        "last_updated": "2025-10-13T10:30:00.000Z"
      }
      // ... more categories
    ]
  }
}
```

---

## RSS Subscription Page

**File:** `pages/rss.vue`  
**URL:** https://cyber.netsecops.io/rss  
**Purpose:** User-facing page to discover and subscribe to feeds

**Features:**
- Feed discovery (all 3 feed types)
- Copy-to-clipboard functionality
- Feed statistics (item counts)
- Category feed listing
- FAQ section
- Heroicons UI (no emojis)
- Cyber theme layout integration

**Feed Statistics Display:**
- Publications: "4 items in last feed"
- All Articles: "7 items in last feed"
- Categories: "4 total articles, 4 in last feed"

**Update Schedule Notice:**
"Feeds update automatically before 9:30 AM CST, 7 days per week. These are static feeds that readers check periodically for updates."

---

## Update Schedule

**Frequency:** Daily, 7 days per week  
**Time:** Before 9:30 AM Central Standard Time (CST)  
**Automation:** Part of content generation pipeline (Step 8)

**Pipeline Integration:**
```typescript
// run-pipeline.ts
const STEP_FUNCTIONS = [
  // ... steps 1-7 ...
  { name: 'Generate RSS Feeds', fn: generateRSSFeeds, num: 8 }
]
```

**Command:**
```bash
npx tsx scripts/content-generation/cli/generate-rss-feeds.ts
```

---

## File Structure

```
public/rss/
├── all.xml                          # All Publications Feed
├── updates.xml                      # All Articles Feed
├── metadata.json                    # Feed Information
└── categories/
    ├── data-breach.xml              # Data Breach Articles
    ├── threat-actor.xml             # Threat Actor Articles
    ├── ransomware.xml               # Ransomware Articles
    ├── supply-chain-attack.xml      # Supply Chain Articles
    ├── vulnerability.xml            # Vulnerability Articles
    ├── cloud-security.xml           # Cloud Security Articles
    ├── cyberattack.xml              # Cyberattack Articles
    └── industrial-control-systems.xml # ICS Articles

pages/
└── rss.vue                          # Subscription Page

scripts/content-generation/cli/
└── generate-rss-feeds.ts            # Generation Script (598 lines)
```

---

## RSS 2.0 Specification Compliance

**XML Version:** 1.0, UTF-8 encoding  
**RSS Version:** 2.0  
**Namespace:** Atom link for self-reference

**Required Elements (Present):**
- ✅ `<channel>` - Feed container
- ✅ `<title>` - Feed title
- ✅ `<link>` - Feed home page
- ✅ `<description>` - Feed description
- ✅ `<language>` - en-us
- ✅ `<lastBuildDate>` - Generation timestamp
- ✅ `<atom:link>` - Self-reference URL

**Item Elements (Present):**
- ✅ `<title>` - Article/publication title
- ✅ `<link>` - Article URL with UTM parameters
- ✅ `<description>` - CDATA-wrapped HTML description
- ✅ `<pubDate>` - RFC 822 date format
- ✅ `<guid>` - Unique identifier with isPermaLink attribute
- ✅ `<category>` - Multiple categories supported

**Optional Elements:**
- 🔲 `<image>` - Logo (placeholder in code, not currently used)
- 🔲 `<enclosure>` - Featured images (placeholder, not currently used)
- 🔲 `<source>` - Article source entity (in updated articles)
- 🔲 `<author>` - Publication author (in publications feed)

---

## Testing & Validation

### Manual Testing

**1. Verify Feed Generation:**
```bash
npx tsx scripts/content-generation/cli/generate-rss-feeds.ts
```

**2. Check UTM Parameters:**
```bash
grep "utm_source=rss" public/rss/all.xml
grep "utm_source=rss" public/rss/updates.xml
grep "utm_source=rss" public/rss/categories/*.xml
```

**3. Validate XML Structure:**
```bash
head -n 30 public/rss/all.xml
```

**4. Check Feed Counts:**
```bash
cat public/rss/metadata.json | jq '.feeds'
```

### RSS Validators

**Online Validators:**
- https://validator.w3.org/feed/ (W3C Feed Validator)
- https://www.feedvalidator.org/ (RSS Feed Validator)

**Test with RSS Readers:**
- Feedly (https://feedly.com)
- NetNewsWire (macOS/iOS)
- Inoreader (https://inoreader.com)
- Thunderbird RSS (Desktop)

---

## Maintenance

### Adding New Categories

**Automatic:** New categories detected from `articles.category` JSON arrays automatically generate new feeds.

**No Code Changes Needed:** Category detection is dynamic.

### Modifying Feed Limits

**File:** `generate-rss-feeds.ts`

**Publications Limit (Line ~128):**
```typescript
LIMIT 5  // Change to desired number
```

**Articles Limit (Line ~213, ~382):**
```typescript
LIMIT 20  // Change to desired number
```

### Changing Update Schedule

**File:** `run-pipeline.ts`

**Modify Cron/Scheduler:** Update deployment automation (GitHub Actions, cron job, etc.)

**Update Documentation:** 
- `pages/rss.vue` FAQ section
- `RSS-SYSTEM-DOCUMENTATION.md`

### Changing Domain

**File:** `generate-rss-feeds.ts` (Line 8)
```typescript
const BASE_URL = 'https://cyber.netsecops.io'
```

**File:** `pages/rss.vue` (Line 4)
```typescript
const baseUrl = 'https://cyber.netsecops.io'
```

**Then Regenerate:**
```bash
npx tsx scripts/content-generation/cli/generate-rss-feeds.ts
```

---

## Performance Considerations

### Static Files
- RSS feeds are static XML files (no server processing)
- Perfect for static site hosting (Netlify, Cloudflare Pages, etc.)
- CDN-friendly (highly cacheable)
- Fast delivery to RSS readers

### Generation Time
- ~2-5 seconds to generate all feeds
- Runs once per day (minimal resource usage)
- SQLite database read-only access

### Feed Size
- Publications feed: ~4 items = ~2-4 KB
- Articles feed: ~20 items = ~15-30 KB
- Category feeds: ~20 items each = ~15-30 KB
- Total: ~200-400 KB for all feeds

---

## Troubleshooting

### Feed Not Updating

**Check:**
1. Pipeline ran successfully (Step 8)
2. Database has recent data
3. Feed files generated with current timestamps
4. CDN cache cleared (if using CDN)

**Debug:**
```bash
# Check file timestamps
ls -lh public/rss/

# Check metadata timestamps
cat public/rss/metadata.json | jq '.generated_at'

# Manually regenerate
npx tsx scripts/content-generation/cli/generate-rss-feeds.ts
```

### Empty Feeds

**Possible Causes:**
- No publications/articles in database
- Database query returning no results
- Date filters too restrictive

**Debug:**
```bash
# Check database
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM publications;"
sqlite3 logs/content-generation.db "SELECT COUNT(*) FROM articles;"
```

### Categories Missing

**Check:**
- Articles have `category` column populated
- Category JSON is valid: `["Data Breach","Ransomware"]`
- Not empty array or null

**Debug:**
```bash
sqlite3 logs/content-generation.db "SELECT category FROM articles LIMIT 5;"
```

### Invalid XML

**Symptoms:**
- RSS readers reject feed
- Validator errors
- Parsing errors

**Common Causes:**
- Unescaped HTML in titles/descriptions
- Invalid UTF-8 characters
- Malformed XML structure

**Fix:**
- Use `escapeXML()` function for text content
- Use CDATA for HTML descriptions
- Validate with W3C Feed Validator

---

## Security Considerations

### Content Sanitization
- All text content escaped via `escapeXML()`
- HTML descriptions wrapped in CDATA
- No user-generated content in feeds

### HTTPS Only
- All URLs use HTTPS protocol
- Secure feed delivery
- UTM parameters are URL-encoded

### No Authentication
- Feeds are public (standard RSS behavior)
- No API keys or credentials required
- Static file serving only

---

## Future Enhancements

### Potential Improvements

**🔮 Email Subscriptions:**
- RSS-to-email service integration
- Mailchimp/SendGrid subscription forms
- Daily/weekly digest emails

**🔮 Feed Discovery:**
- Add `<link rel="alternate">` tags to HTML pages
- RSS autodiscovery in browsers
- Sitemap.xml inclusion

**🔮 Enhanced Content:**
- Featured images (enclosures)
- Full article content in feed
- Media attachments

**🔮 Podcast Feed:**
- Audio versions of articles
- iTunes podcast format
- MP3 enclosures

**🔮 JSON Feed:**
- JSON Feed 1.1 format
- Modern alternative to RSS/Atom
- Better structured data

**🔮 WebSub (PubSubHubbub):**
- Real-time feed updates
- Push notifications to subscribers
- Instant content delivery

---

## Support & Documentation

**Main Documentation:**
- `RSS-SYSTEM-DOCUMENTATION.md` (this file)
- `GOOGLE-ANALYTICS-RSS-SETUP.md` (analytics guide)

**Code Documentation:**
- Inline comments in `generate-rss-feeds.ts`
- TypeScript type definitions

**External Resources:**
- RSS 2.0 Spec: https://www.rssboard.org/rss-specification
- Atom Namespace: https://www.w3.org/2005/Atom
- W3C Feed Validator: https://validator.w3.org/feed/

---

## Change Log

### October 13, 2025 - v1.0 Production Release
- ✅ Initial RSS system implementation
- ✅ Three feed types: publications, articles, categories
- ✅ UTM tracking for Google Analytics
- ✅ RSS subscription page
- ✅ Metadata generation
- ✅ Pipeline integration (Step 8)
- ✅ Heroicons UI (removed emojis)
- ✅ 9:30 AM CST schedule
- ✅ Domain correction (cyber.netsecops.io)
- ✅ Feed statistics improvements
- ✅ Static feed notice

---

**System Status:** ✅ Production Ready  
**Last Generated:** October 13, 2025  
**Next Steps:** Deploy to production, monitor Google Analytics
