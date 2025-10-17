# GTM4 RSS Feed Tracking

## Overview
All RSS feeds include comprehensive UTM parameters for Google Tag Manager 4 (GTM4) tracking. This enables detailed analytics on RSS subscriber behavior and feed performance.

## UTM Parameter Structure

### All Articles Feed (`/rss/updates.xml`)
Tracks both NEW and UPDATED articles with primary category and status.

**Parameters:**
- `utm_source=rss` - Traffic source
- `utm_medium=feed` - Medium type
- `utm_campaign=all_articles` - Campaign identifier
- `utm_content={new|updated}` - Article status
- `utm_term={primary-category}` - First category (e.g., vulnerability, data-breach)

**Example:**
```
https://cyber.netsecops.io/articles/oracle-zero-day-exploited-by-cl0p-in-massive-extortion-campaign?utm_source=rss&utm_medium=feed&utm_campaign=all_articles&utm_content=new&utm_term=vulnerability
```

### Category Feeds (`/rss/categories/*.xml`)
Tracks articles by specific category with severity level.

**Parameters:**
- `utm_source=rss` - Traffic source
- `utm_medium=feed` - Medium type
- `utm_campaign={category-slug}` - Category name (e.g., ransomware, data-breach)
- `utm_content=category-feed` - Feed type identifier
- `utm_term={severity}` - Threat severity (critical, high, medium, low)

**Example:**
```
https://cyber.netsecops.io/articles/scattered-lapsus-hunters-launches-extortion-site-targeting-39-companies?utm_source=rss&utm_medium=feed&utm_campaign=ransomware&utm_content=category-feed&utm_term=critical
```

### Publications Feed (`/rss/all.xml`)
Tracks daily/weekly publications with article count.

**Parameters:**
- `utm_source=rss` - Traffic source
- `utm_medium=feed` - Medium type
- `utm_campaign=all_publications` - Campaign identifier
- `utm_content={publication-type}` - Type (daily, weekly, etc.)
- `utm_term=articles-{count}` - Number of articles in publication

**Example:**
```
https://cyber.netsecops.io/publications/daily-2025-10-07?utm_source=rss&utm_medium=feed&utm_campaign=all_publications&utm_content=daily&utm_term=articles-10
```

## GTM4 Tracking Capabilities

### Available Dimensions
1. **Traffic Source**: All RSS traffic tagged with `utm_source=rss`
2. **Feed Type**: Identified by `utm_campaign` (all_articles, category-slug, all_publications)
3. **Content Type**: Via `utm_content` (new, updated, category-feed, daily)
4. **Article Metadata**: Via `utm_term` (category, severity, article-count)

### Suggested GA4 Events
- `rss_article_click` - User clicks article from RSS feed
- `rss_publication_click` - User clicks publication from RSS feed
- Custom dimensions for category, severity, status tracking

### Analytics Use Cases
1. **Feed Performance**: Which RSS feeds drive the most traffic?
2. **Category Interest**: Which threat categories get the most engagement?
3. **Severity Tracking**: Do users engage more with CRITICAL vs HIGH severity articles?
4. **Update Engagement**: Do users click on [UPDATED] articles more than new ones?
5. **Publication Size**: Does article count affect click-through rates?

## Implementation Notes

- All URL parameters are properly encoded using `URLSearchParams`
- GUID fields remain clean (no UTM parameters) for proper RSS reader identification
- UTM parameters only appear in `<link>` elements for click tracking
- Category feeds: Primary category from `utm_campaign`, severity from `utm_term`
- Updates feed: Article status from `utm_content`, primary category from `utm_term`

## Testing URLs

Test the tracking by subscribing to feeds and clicking articles:
- Updates: https://cyber.netsecops.io/rss/updates.xml
- Ransomware: https://cyber.netsecops.io/rss/categories/ransomware.xml
- Publications: https://cyber.netsecops.io/rss/all.xml

All clicks should appear in GA4 with full UTM context.
