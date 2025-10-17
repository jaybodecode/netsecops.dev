# Robots.txt Configuration Documentation

> **Purpose:** Documentation for the strategic robots.txt configuration used on CyberNetSec.io

---

## 📋 Overview

Our robots.txt is configured to maximize visibility from legitimate search engines and AI assistants while protecting against pure data scrapers and resource-wasting bots.

**Location:** Generated at `.output/public/robots.txt` during build  
**Source:** Configured in `nuxt.config.ts` using `@nuxtjs/seo` module  
**Strategy:** Allow traffic-generating bots, block scraper-only bots

---

## 🤖 Bot Categories

### ✅ ALLOWED: Search Engines

These bots send the most valuable traffic:

| Bot | Description | Why Allowed |
|-----|-------------|-------------|
| `Googlebot` | Google Search crawler | Primary search traffic source |
| `Googlebot-Image` | Google Images crawler | Image search visibility |
| `Bingbot` | Microsoft Bing crawler | Secondary search traffic |

**Access:** Can crawl all public pages except internal files (`/_nuxt/`, `/__sitemap__/`, `/api/`, `/_ipx/`)

---

### ✅ ALLOWED: AI Search Bots (Citation-Based)

These AI bots can cite sources and send qualified traffic:

| Bot | Company | Why Allowed |
|-----|---------|-------------|
| `GPTBot` | OpenAI | ChatGPT search can cite and link to articles |
| `ChatGPT-User` | OpenAI | User queries that reference sources |
| `PerplexityBot` | Perplexity AI | Always cites sources with links |
| `Claude-Web` | Anthropic | Claude web search with citations |
| `anthropic-ai` | Anthropic | General Anthropic crawler |

**Benefits:**
- Users asking AI about cybersecurity threats get linked to our content
- Builds authority as a cited source
- Generates qualified traffic from specific queries
- Similar to being in Google search results

**Access:** Can index `/articles/`, `/publications/`, and homepage. Blocked from internal files.

---

### ✅ ALLOWED: SEO Tools

We use these tools for analytics and monitoring:

| Bot | Tool | Purpose |
|-----|------|---------|
| `SemrushBot` | Semrush/SEranking | SEO analytics, keyword tracking |
| `AhrefsBot` | Ahrefs | Backlink analysis, competitor research |
| `MJ12bot` | Majestic SEO | Link intelligence, SEO metrics |

**Why Allowed:**
- We actively use SEranking.com and Ahrefs for SEO monitoring
- These tools provide valuable insights about our site performance
- Need crawler access to provide accurate data

**Access:** Can crawl content pages. Blocked from internal files and optimization endpoints.

---

### 🚫 BLOCKED: Pure Data Scrapers

These bots only scrape data without providing any benefit:

| Bot | Company | Why Blocked |
|-----|---------|-------------|
| `CCBot` | Common Crawl | Pure data scraping for datasets (no user queries) |
| `Bytespider` | ByteDance/TikTok | Unlikely to send cybersecurity traffic |
| `Diffbot` | Diffbot | Generic web scraper |
| `DotBot` | OpenSiteExplorer | Unnecessary SEO crawler |
| `BLEXBot` | BLEXBot | Aggressive crawler, no benefit |

**Why Blocked:**
- No traffic generation
- No citation/linking back
- Consumes bandwidth without value
- May train competing AI models
- Used for competitive intelligence without providing data back

**Access:** Completely blocked (`Disallow: /`)

---

## 🛡️ Protected Paths

All bots (even allowed ones) are blocked from these internal paths:

| Path | Description | Why Protected |
|------|-------------|---------------|
| `/_nuxt/` | Nuxt.js build artifacts | Internal JavaScript/CSS bundles |
| `/__sitemap__/` | Sitemap styling assets | Internal sitemap resources |
| `/api/` | API endpoints | Backend functionality (if added) |
| `/_ipx/` | Image optimization cache | Dynamic image processing endpoints |
| `/test.vue` | Test page | Development/testing page |
| `/font-demo.vue` | Font demo page | Development/demo page |

---

## 📊 Strategic Decisions

### Why Allow AI Bots?

**The New Search Paradigm:**
- In 2025, users increasingly ask AI assistants instead of traditional search
- AI tools like ChatGPT, Perplexity, and Claude now cite sources and provide links
- Similar to how Google became essential in the 2000s, AI search is essential now

**Traffic Benefits:**
- Users asking "latest ransomware threats" → AI links to our articles
- Qualified visitors who specifically want our content
- Builds authority as a cited cybersecurity source

**The Risk We Accept:**
- AI models may summarize our content (but they also cite us)
- Content may be used for training (but generates brand awareness)
- Similar to Google indexing - necessary for discoverability

### Why Allow SEO Tool Bots?

**Analytics Value:**
- We actively pay for SEranking.com and Ahrefs subscriptions
- These tools need crawler access to provide accurate data
- Essential for monitoring SEO performance and competitors

**No Downside:**
- Minimal bandwidth impact (crawl less frequently than search engines)
- Data helps us improve our site
- Industry standard to allow these bots

### Why Block Pure Scrapers?

**Zero Value:**
- CCBot scrapes for datasets, never sends traffic
- Bytespider unlikely to send cybersecurity-focused traffic
- Generic scrapers consume resources without benefit

**Content Protection:**
- Prevent bulk downloading of threat intelligence
- Reduce risk of competing content aggregators
- Protect intellectual property

---

## 🔧 Technical Implementation

### Configuration Location

The robots.txt is configured in `nuxt.config.ts`:

```typescript
robots: {
  enabled: true,
  groups: [
    // Bot group configurations
  ],
  sitemap: [
    'https://cyber.netsecops.io/sitemap.xml'
  ],
}
```

### Build Process

1. Configuration defined in `nuxt.config.ts`
2. `@nuxtjs/seo` module processes configuration during build
3. Robots.txt generated at `.output/public/robots.txt`
4. Deployed to production with static site

### Updating Configuration

To modify bot access:

1. Edit the `robots:` section in `nuxt.config.ts`
2. Run `npm run generate` to rebuild
3. Deploy updated `.output/public/` directory

---

## 📈 Expected Impact

### Traffic Sources We'll Get:

✅ **Google Search** - Primary organic traffic  
✅ **Bing Search** - Secondary search traffic  
✅ **AI Assistants** - ChatGPT, Perplexity, Claude citations  
✅ **SEO Tools** - Analytics and monitoring data

### What We're Blocking:

🚫 **Data Scrapers** - No bulk content theft  
🚫 **Training Bots** - Limited AI training without citation  
🚫 **Competitive Intel** - Reduced scraping by competitors  
🚫 **Bad Actors** - Aggressive crawlers

---

## 🔍 Monitoring & Validation

### Check Current Robots.txt

```bash
# View generated robots.txt
cat .output/public/robots.txt

# Check online (after deployment)
curl https://cyber.netsecops.io/robots.txt
```

### Validate Configuration

Test your robots.txt using:
- [Google Search Console Robots Testing Tool](https://search.google.com/search-console/robots-txt-tester)
- [Bing Webmaster Tools Robots.txt Tester](https://www.bing.com/webmasters/robotstxttester)

### Monitor Bot Activity

After deployment, monitor in analytics:
- Which bots are accessing your site
- Bandwidth usage by user agent
- AI bot citation rates (if trackable)

---

## 🤔 Alternative Configurations

### Option A: More Restrictive (Block All AI)

If you want to block AI completely:

```typescript
{
  userAgent: ['GPTBot', 'ChatGPT-User', 'Claude-Web', 'PerplexityBot'],
  disallow: ['/'],
}
```

**Trade-off:** Lose potential AI traffic and citations

### Option B: More Permissive (Allow Everything)

To maximize distribution:

```typescript
{
  userAgent: ['*'],
  disallow: ['/_nuxt/', '/__sitemap__/', '/api/'],
}
```

**Trade-off:** More bandwidth usage, potential content scraping

### Option C: Current (Balanced - RECOMMENDED)

Strategic approach:
- Allow traffic-generating bots (search, AI search, SEO tools)
- Block pure scrapers
- Protect internal files

---

## 📚 References

### Standards & Documentation

- [Robots.txt Specification](https://www.robotstxt.org/)
- [Google Robots.txt Guidelines](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Nuxt SEO Module Documentation](https://nuxtseo.com/robots/getting-started/introduction)

### Industry Best Practices

- [AI Bot Blocking Debate (2024-2025)](https://searchengineland.com/ai-bot-blocking-debate)
- [SEO Tool Crawler Management](https://moz.com/blog/crawler-management)

---

## 🔄 Maintenance

### Regular Reviews

Review this configuration:
- **Quarterly:** Check if new beneficial bots have emerged
- **After AI Updates:** When AI tools add citation features
- **Performance:** If bandwidth/costs become a concern

### Adding New Bots

When new legitimate bots appear:
1. Research if they send traffic or just scrape
2. Test their citation behavior
3. Update `nuxt.config.ts` accordingly
4. Rebuild and deploy

### Blocking New Scrapers

If aggressive crawlers appear in logs:
1. Identify user agent
2. Add to blocked list in `nuxt.config.ts`
3. Rebuild and deploy

---

## ✅ Summary

**Current Strategy: Balanced & Strategic**

- ✅ Search engines can fully index us
- ✅ AI assistants can cite and link to us
- ✅ Our SEO tools can analyze us
- 🚫 Pure scrapers are blocked
- 🛡️ Internal files are protected

This configuration maximizes legitimate traffic while protecting our cybersecurity content and infrastructure.

---

**Last Updated:** October 12, 2025  
**Maintained By:** Site Operations  
**Questions?** Review this doc or check `nuxt.config.ts` configuration
