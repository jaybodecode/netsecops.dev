# Database Read Interface

**Location**: `scripts/content-generation-v2/database/read-interface.ts`

## Overview

Clean, flexible query interface for extracting article data from the content generation database. Supports dynamic field selection and filtering by date, category, severity, and more.

## Features

- ✅ **Flexible field selection** - Request only the fields you need
- ✅ **Dynamic filtering** - By date, date range, category, severity, etc.
- ✅ **Clean JSON output** - Ready to save to disk or pipe to other scripts
- ✅ **CLI interface** - Easy to use from command line
- ✅ **TypeScript types** - Full type safety for all functions

## Key Functions

### `getArticlesByDate(date, fields?, limit?)`

Get articles by specific date with custom field selection.

```typescript
// Get slug and headline for articles on Oct 16
const articles = getArticlesByDate('2025-10-16', ['slug', 'headline']);

// Get full context for tweet generation (top 20)
const articles = getArticlesByDate('2025-10-16', 
  ['slug', 'headline', 'summary', 'full_report', 'category', 'severity'], 
  20
);
```

### `getArticles(filters, fields?)`

Get articles with flexible filtering and field selection.

```typescript
// Get critical vulnerabilities from last 2 days
const articles = getArticles({
  dateFrom: '2025-10-15',
  dateTo: '2025-10-16',
  severity: 'critical',
  category: 'Vulnerability'
}, ['slug', 'headline', 'summary']);
```

**Available Filters:**
- `date` - Specific date (YYYY-MM-DD)
- `dateFrom` / `dateTo` - Date range
- `category` - Category name (e.g., 'Ransomware', 'Vulnerability')
- `severity` - Severity level (critical, high, medium, low)
- `isUpdate` - Boolean flag for updates
- `limit` - Maximum number of results
- `offset` - Pagination offset
- `orderBy` - Field to sort by
- `orderDirection` - 'ASC' or 'DESC'

### `getArticleBySlug(slug, fields?)`

Get a single article by slug.

```typescript
const article = getArticleBySlug('microsoft-patch-tuesday', ['headline', 'summary']);
```

### `getArticleCount(filters)`

Get count of articles matching filters.

```typescript
const count = getArticleCount({ date: '2025-10-16', severity: 'critical' });
```

### `getArticlesForTwitter(date, limit?)`

Twitter-optimized query that returns all fields needed for tweet generation.

**Returns**: slug, headline, summary, full_report (first 2000 chars), category, severity, is_update

```typescript
const articles = getArticlesForTwitter('2025-10-16', 20);
```

### `exportArticlesToJSON(filters, fields, outputPath)`

Export articles directly to a JSON file.

```typescript
exportArticlesToJSON(
  { date: '2025-10-16', limit: 20 },
  ['slug', 'headline', 'summary'],
  'tmp/articles.json'
);
```

### `getAvailableDateRange()`

Get the earliest and latest dates in the database.

```typescript
const range = getAvailableDateRange();
// Returns: { earliest: '2025-10-01', latest: '2025-10-16' }
```

## Available Fields

### From `published_articles` table:
- `id` - Article ID
- `publication_id` - Parent publication ID
- `slug` - URL slug
- `headline` - Article headline
- `summary` - Article summary
- `full_report` - Full article text
- `position` - Position in publication
- `is_update` - Boolean update flag
- `original_pub_date` - Original publication date
- `created_at` - Creation timestamp

### From `articles` table (via JOIN):
- `category` - Article category (JSON array)
- `severity` - Severity level
- `twitter_post` - Pre-generated Twitter post
- `meta_description` - SEO description
- `article_type` - Article type
- `keywords` - Keywords (JSON array)
- `reading_time_minutes` - Estimated reading time
- `pub_date` - Publication date
- `resolution` - Resolution status
- `isUpdate` - Update flag
- `updateCount` - Number of updates
- `updates` - Update history (JSON)

## CLI Usage

### Export for Twitter

Export 20 articles from Oct 16 with all fields needed for tweet generation:

```bash
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --twitter --date 2025-10-16 --limit 20 \
  --export tmp/twitter/articles.json
```

### Get Specific Fields

Get only slug, headline, and summary:

```bash
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --date 2025-10-16 --fields slug,headline,summary
```

### Filter by Severity

Get only critical severity articles:

```bash
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --date 2025-10-16 --severity critical
```

### Filter by Category

Get only ransomware articles:

```bash
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --date 2025-10-16 --category Ransomware
```

### Export to JSON

Export filtered results to a file:

```bash
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --date 2025-10-16 --severity critical \
  --export tmp/critical-articles.json
```

### Check Available Dates

See the date range of articles in the database:

```bash
npx tsx scripts/content-generation-v2/database/read-interface.ts --date-range
```

**Output:**
```
📅 Available date range:
   Earliest: 2025-10-01
   Latest: 2025-10-16
```

### Help

Show all available options:

```bash
npx tsx scripts/content-generation-v2/database/read-interface.ts --help
```

## Example Workflows

### Twitter Feed Generation

```bash
# Step 1: Export articles with all needed fields
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --twitter --date 2025-10-16 --limit 20 \
  --export tmp/twitter/articles-raw.json

# Step 2: Process each article to generate tweets
# (Use LLM or custom script to read articles-raw.json)

# Step 3: Post tweets to Twitter
# (Use posting script with generated tweets)
```

### Content Analysis

```bash
# Get critical vulnerabilities
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --date 2025-10-16 --severity critical --category Vulnerability \
  --export tmp/critical-vulns.json

# Get ransomware attacks
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --date 2025-10-16 --category Ransomware \
  --export tmp/ransomware-attacks.json
```

### Date Range Queries

```bash
# Get all articles from last 7 days
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --dateFrom 2025-10-09 --dateTo 2025-10-16 \
  --export tmp/weekly-digest.json
```

## TypeScript Integration

```typescript
import { 
  getArticles, 
  getArticlesByDate,
  getArticlesForTwitter,
  exportArticlesToJSON 
} from './scripts/content-generation-v2/database/read-interface.js';

// Get today's articles
const todayArticles = getArticlesByDate('2025-10-16', ['slug', 'headline']);

// Filter critical articles
const criticalArticles = getArticles({
  date: '2025-10-16',
  severity: 'critical',
  limit: 10
}, ['slug', 'headline', 'summary']);

// Export for Twitter
exportArticlesToJSON(
  { date: '2025-10-16', limit: 20 },
  ['slug', 'headline', 'summary', 'full_report', 'category'],
  'tmp/twitter-feed.json'
);
```

## Testing

### Verify Installation

```bash
# Check date range
npx tsx scripts/content-generation-v2/database/read-interface.ts --date-range

# Get 3 sample articles
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --date 2025-10-16 --limit 3 --fields slug,headline
```

### Test Export

```bash
# Export and verify
npx tsx scripts/content-generation-v2/database/read-interface.ts \
  --twitter --date 2025-10-16 --limit 20 \
  --export tmp/test-export.json

# Check file
cat tmp/test-export.json | jq 'length'  # Should show 20
cat tmp/test-export.json | jq '.[0] | keys'  # Show available fields
```

## Performance Notes

- Queries use SQLite indexes where available
- JOIN between `published_articles` and `articles` is fast (indexed on slug)
- For large exports, consider using `limit` and `offset` for pagination
- The `--twitter` flag is optimized for social media workflows

## Future Enhancements

- [ ] Add support for entity filtering (by CVE, company, threat actor)
- [ ] Add text search capabilities
- [ ] Add caching for frequently accessed queries
- [ ] Add bulk export formats (CSV, Markdown)
- [ ] Add statistics and aggregation queries

## Related Files

- **Database connection**: `scripts/content-generation-v2/database/index.ts`
- **Schema definitions**: `scripts/content-generation-v2/database/schema-*.ts`
- **Social media lib**: `scripts/content-social/lib/db.ts`
