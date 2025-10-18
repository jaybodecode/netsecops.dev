# Content Generation V2 - LLM Guide

> **Note**: This document is maintained by the LLM assistant to provide context for future conversations and codebase understanding. Last updated: 2025-10-15

## Overview

Content Generation V2 is a **complete rewrite** of the original content generation system, built with simplicity and maintainability as core principles. The system generates structured cybersecurity news articles from Google Search results using Vertex AI.

### Recent Updates (October 2025)

**Timestamp Fixes:**
- ✅ **Removed `extract_datetime` from LLM schema** - LLMs generate incorrect/dummy timestamps
- ✅ **All timestamps use 9am CST (15:00 UTC)** - Consistent timezone handling
- ✅ **Fixed update array ordering** - Most recent update is always `array[length-1]`
- ✅ **Fixed `updatedAt` logic** - Initially matches `createdAt`, then reflects most recent update

See "Timestamp Handling" section below for details.

### Key Differences from V1
- ✅ **Simpler architecture** - No complex orchestration layers
- ✅ **Separate schema files** - Database schemas organized by purpose
- ✅ **Centralized AI client** - Single vertex.ts handles all LLM calls
- ✅ **Automatic cost tracking** - All API calls logged to database
- ✅ **Structured output** - Uses Genkit's native schema validation
- ✅ **No database complexity in types** - Clean TypeScript interfaces

## Architecture

```
scripts/content-generation-v2/
├── database/
│   ├── index.ts                    # DB singleton (better-sqlite3, WAL mode)
│   ├── schema.ts                   # Main orchestrator (exports all schemas)
│   ├── schema-api-calls.ts         # API cost tracking table
│   ├── schema-raw-search.ts        # Raw LLM search results storage
│   └── schema-structured-news.ts   # Structured article publications
├── ai/
│   └── vertex.ts                   # Centralized Vertex AI client
├── search-news.ts                  # Grounded search script (Google Search)
├── news-structured.ts              # Convert raw search → structured JSON
└── news-structured-schema.ts       # Zod schemas for structured output
```

### Database: `logs/content-generation-v2.db`

**Tables:**
1. **api_calls** - Tracks all Vertex AI calls with token usage and costs
2. **raw_search** - Stores unstructured search results (UNIQUE on pub_date)
3. **structured_news** - Stores structured publications with metadata

## Core Components

### 1. Database Layer (`database/`)

**Philosophy**: Separate schema files for organization, main schema.ts re-exports everything.

#### `database/index.ts`
- Singleton pattern for database connection
- WAL mode enabled for better concurrency
- Location: `logs/content-generation-v2.db`

#### `database/schema.ts`
- Orchestrator that imports and initializes all sub-schemas
- Re-exports all types and functions for convenience
- Call `initSchema()` once to create all tables

#### `database/schema-api-calls.ts`
- **Purpose**: Automatic cost tracking for all LLM calls
- **Key Functions**:
  - `logAPICall()` - Save API call metadata
  - `getAPIStats()` - Query cost statistics
- **Used by**: `ai/vertex.ts` automatically logs every call

#### `database/schema-raw-search.ts`
- **Purpose**: Store raw unstructured search results
- **Key Interface**: `RawSearchRecord` - typed return from database
- **Key Feature**: UNIQUE constraint on `pub_date` with INSERT OR REPLACE
- **Functions**:
  - `saveRawSearch()` - Store raw text (overwrites if exists)
  - `getRawSearch()` - Get raw text by date
  - `getAllRawSearches()` - List all with sizes

#### `database/schema-structured-news.ts`
- **Purpose**: Store structured publications with denormalized fields
- **Key Feature**: Stores full JSON + quick-access fields (pub_id, headline, total_articles)
- **Functions**:
  - `saveStructuredNews()` - Store publication (overwrites if exists)
  - `getStructuredNews()` - Get parsed publication object
  - `getStructuredNewsRecord()` - Get with metadata
  - `hasStructuredNews()` - Check existence
  - `deleteStructuredNews()` - Remove for regeneration

### 2. AI Layer (`ai/`)

#### `ai/vertex.ts`
**The central hub for all LLM interactions.**

**Key Features**:
- ✅ Automatic cost tracking to database
- ✅ Proper pricing calculations (Flash vs Pro, grounded vs standard)
- ✅ Structured output support via Genkit
- ✅ 10-minute timeout configuration (undici Agent)
- ✅ Script name detection from stack trace

**Critical Setup**:
```typescript
import { setGlobalDispatcher, Agent } from 'undici';

// IMPORTANT: 10-minute timeout for large LLM requests
setGlobalDispatcher(new Agent({
  headersTimeout: 600000,
  bodyTimeout: 600000,
}));
```

**Functions**:

1. **`callVertex(prompt, options)`**
   - For article generation with optional structured output
   - Pass `schema: ZodSchema` for structured output
   - Returns `{ content, usage }` where content is parsed object if schema provided
   - Automatically logs to api_calls table

2. **`callGroundedSearch(prompt, options)`**
   - For Google Search grounded results
   - Adds `googleSearchRetrieval: {}` to config
   - Different pricing: $0.35/1k requests + output tokens
   - Used by `search-news.ts`

**Pricing (as of Oct 2024)**:
- Flash: $0.075/1M input, $0.30/1M output
- Pro: $1.25/1M input, $5.00/1M output
- Grounded: $0.35/1k requests + output tokens

### 3. Scripts

#### `search-news.ts`
**Purpose**: Use Google Search grounded generation to find latest cybersecurity news.

**Key Concepts**:
- **Time Windows**: 24-hour windows ending at 9am CST (15:00 UTC)
- **Timeframe Calculation**: `--timeframe=7daysago` means the window ending 7 days ago at 9am CST
- **Model**: gemini-2.5-pro (better for complex search)
- **Output**: tmp/ files + optional database storage

**Usage**:
```bash
# Search for news from 7 days ago (9am CST window)
npx tsx scripts/content-generation-v2/search-news.ts -c 10 --timeframe=7daysago

# With database logging
npx tsx scripts/content-generation-v2/search-news.ts -c 10 --timeframe=7daysago --logtodb

# Parallel execution for multiple days
nohup npx tsx search-news.ts --timeframe=7daysago --logtodb > logs/day7.log 2>&1 &
nohup npx tsx search-news.ts --timeframe=6daysago --logtodb > logs/day6.log 2>&1 &
```

**Environment Required**:
- `GCP_PROJECT_ID` or `GCLOUD_PROJECT`
- `GCLOUD_LOCATION` (default: us-central1)
- Loaded via `import 'dotenv/config'`

#### `news-structured.ts`
**Purpose**: Convert raw search text into fully structured articles with metadata.

**Key Concepts**:
- **Input**: Raw text from `raw_search` table
- **Process**: Vertex AI with Genkit structured output (Zod schema enforcement)
- **Output**: Structured JSON + optional database storage
- **Model**: gemini-2.5-pro (better for complex schemas)

**CRITICAL**: Uses structured output, NOT JSON parsing!
```typescript
const result = await callVertex(prompt, {
  model: 'gemini-2.5-pro',
  temperature: 0.7,
  maxTokens: 65535,
  schema: CyberAdvisorySchema,  // LLM automatically follows schema
});

// result.content is already a parsed object!
const structured = result.content as CyberAdvisoryType;
```

**Usage**:
```bash
# Generate structured output for a date
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-07

# With database logging
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-07 --logtodb
```

**Cost**: ~$0.11-0.14 per date (about 30k tokens)

#### `news-structured-schema.ts`
**Purpose**: Define Zod schemas for structured output validation.

**IMPORTANT NOTES**:
1. **LLM sees the schema**: Genkit passes the schema to the LLM, which follows it automatically
2. **Descriptions matter**: The `.describe()` text guides the LLM's output
3. **Plain text, no Markdown**: All content fields use plain text
4. **Templates in descriptions**: `full_report` field contains embedded templates for 5 article types
5. **Category order matters**: First category is primary (used for visual representation)

**Key Schemas**:
- `SourceSchema` - Article source references (url, title, website, date)
- `EntitySchema` - Named entities (companies, threat actors, products, etc.)
- `CVESchema` - Vulnerability details with CVSS scores
- `MITRETechniqueSchema` - ATT&CK mappings
- `ImpactScopeSchema` - Geographic/industry impact
- `ArticleSchema` - Complete article (summary + full_report + metadata)
- `CyberAdvisorySchema` - Publication wrapper (contains articles array)

**Article Structure**:
```typescript
{
  summary: string;           // 150-300 words
  full_report: string;       // 1000-5000 words (plain text with templates)
  category: string[];        // 1-3 categories, PRIMARY FIRST
  severity: enum;            // critical/high/medium/low/informational
  entities: Entity[];        // Named entities
  cves: CVE[];              // Vulnerabilities
  sources: Source[];         // References
  mitre_techniques: MITRE[]; // ATT&CK mappings
  // ... plus 20+ other structured fields
}
```

**Article Structure**:
```typescript
{
  summary: string;           // 150-300 words
  full_report: string;       // 1000-5000 words (plain text with templates)
  category: string[];        // 1-3 categories, PRIMARY FIRST
  severity: enum;            // critical/high/medium/low/informational
  entities: Entity[];        // Named entities
  cves: CVE[];              // Vulnerabilities
  sources: Source[];         // References
  mitre_techniques: MITRE[]; // ATT&CK mappings
  // ... plus 20+ other structured fields
  // NOTE: extract_datetime removed (October 2025) - derived from pub_date instead
}
```

## Timestamp Handling (October 2025)

**Critical Changes**: All timestamps now use **9am CST (15:00 UTC)** for consistency.

### Why 9am CST?
- Avoids timezone display issues (midnight UTC displays as previous day in CST)
- Consistent with daily publication cutoff time
- Format: `YYYY-MM-DDTH15:00:00.000Z`

### Removed from LLM Schema
**`extract_datetime` field** - ❌ **REMOVED** from `ArticleSchema` in `news-structured-schema.ts`

**Reason**: LLMs generate incorrect/dummy timestamps that don't match article publication dates.

**Replacement**: Derived from `pub_date` field during database insertion:
```typescript
// insert-articles.ts
const extract_datetime = article.pub_date 
  ? `${article.pub_date}T15:00:00.000Z`  // 9am CST
  : targetDate;
```

### Timestamp Fields in Output JSON

#### `createdAt`
- Always set to 9am CST of article's publication date
- Format: `${pub_date}T15:00:00.000Z`
- Example: `"2025-10-15T15:00:00.000Z"` (9am CST on Oct 15)

#### `updatedAt`
- Initially matches `createdAt` when no updates exist
- When article receives update: set to update's `datetime` field
- Always reflects **most recent** update's datetime
- Access via: `updates[updates.length - 1].update_date`

### Update Array Ordering

**Critical**: Updates are **appended** to array, so:
- `updates[0]` = oldest update (Monday)
- `updates[length-1]` = newest update (Wednesday) ✅

```typescript
// Example progression:
// Day 1 (Monday): updates = []
// Day 2 (Tuesday): updates = [{ datetime: "2025-10-16T12:00:00Z", ... }]
// Day 3 (Wednesday): updates = [
//   { datetime: "2025-10-16T12:00:00Z", ... },  // [0] oldest
//   { datetime: "2025-10-17T14:30:00Z", ... }   // [1] newest ✅
// ]
```

### Scripts Affected by Timestamp Fixes

| Script | Change |
|--------|--------|
| `news-structured-schema.ts` | Removed `extract_datetime` field |
| `insert-articles.ts` | Derive `extract_datetime` from `pub_date` at 15:00 UTC |
| `generate-article-json.ts` | Use 9am CST for `createdAt`, access `updates[length-1]` |
| `generate-indexes.ts` | Use 9am CST for `createdAt`, access `updates[length-1]` |
| `generate-publication-json.ts` | Use 9am CST format for timestamps |
| `apply-updates.ts` | Store full ISO timestamp (not just date) |

**Article Categories** (19 total):
- Ransomware, Malware, Threat Actor, Vulnerability, Data Breach
- Phishing, Supply Chain Attack, Cyberattack
- Industrial Control Systems, Cloud Security, Mobile Security, IoT Security
- Patch Management, Threat Intelligence, Incident Response, Security Operations
- Policy and Compliance, Regulatory, Other

## Typical Workflow

### Day-by-Day Content Generation

1. **Collect Raw Search Data**:
```bash
# Run search for 7 days
for i in {1..7}; do
  nohup npx tsx search-news.ts --timeframe=${i}daysago --logtodb > logs/day${i}.log 2>&1 &
done
```

2. **Generate Structured Articles**:
```bash
# For a specific date
npx tsx news-structured.ts --date 2025-10-07 --logtodb
```

3. **Query the Data**:
```bash
# Get all unique categories
cat tmp/news-structured_*.json | jq -r '.articles[].category[]' | sort | uniq -c

# Get articles by severity
cat tmp/news-structured_*.json | jq '.articles[] | select(.severity=="critical")'

# Get all CVEs discovered
cat tmp/news-structured_*.json | jq -r '.articles[].cves[].id' | sort -u
```

## Database Queries

### API Cost Tracking
```sql
-- Total costs by script
SELECT script_name, 
       SUM(total_tokens) as total_tokens,
       ROUND(SUM(cost_usd), 2) as total_cost
FROM api_calls
GROUP BY script_name;

-- Recent calls
SELECT script_name, model, call_type, 
       input_tokens, output_tokens, 
       ROUND(cost_usd, 4) as cost
FROM api_calls
ORDER BY called_at DESC
LIMIT 10;
```

### Content Analysis
```sql
-- All publications
SELECT pub_date, headline, total_articles, date_range
FROM structured_news
ORDER BY pub_date DESC;

-- Check what dates have data
SELECT pub_date FROM raw_search ORDER BY pub_date;
SELECT pub_date FROM structured_news ORDER BY pub_date;
```

### Using jq with JSON Files
```bash
# Get unique categories with counts
cat tmp/news-structured_*.json | jq -r '.articles[].category[]' | sort | uniq -c | sort -rn

# Get all threat actors mentioned
cat tmp/news-structured_*.json | jq -r '.articles[].entities[] | select(.type=="threat_actor") | .name' | sort -u

# Articles by severity
cat tmp/news-structured_*.json | jq '.articles[] | {slug, severity, category}'

# Get all MITRE techniques
cat tmp/news-structured_*.json | jq -r '.articles[].mitre_techniques[].id' | sort -u
```

## Common Issues & Solutions

### 1. `UND_ERR_HEADERS_TIMEOUT` Error
**Problem**: LLM requests timeout after 5 minutes (undici default).

**Solution**: Already fixed in `ai/vertex.ts`:
```typescript
import { setGlobalDispatcher, Agent } from 'undici';
setGlobalDispatcher(new Agent({
  headersTimeout: 600000,  // 10 minutes
  bodyTimeout: 600000,
}));
```

### 2. Environment Variables Not Loaded
**Problem**: `GCP_PROJECT_ID or GCLOUD_PROJECT environment variable required`

**Solution**: Add to top of script:
```typescript
import 'dotenv/config';
```

Check `.env` file has:
```
GCLOUD_PROJECT=your-project-id
GCP_PROJECT_ID=your-project-id
GCLOUD_LOCATION=us-central1
```

### 3. JSON Parsing Errors
**Problem**: Old approach tried to parse JSON from text responses.

**Solution**: Use structured output with schema:
```typescript
// ❌ OLD WAY (causes parsing errors)
const result = await callVertex(prompt, { model: 'gemini-2.5-pro' });
const parsed = JSON.parse(result.content); // Can fail!

// ✅ NEW WAY (automatic validation)
const result = await callVertex(prompt, {
  model: 'gemini-2.5-pro',
  schema: CyberAdvisorySchema,  // LLM follows schema
});
const structured = result.content; // Already parsed!
```

### 4. Database Locked Errors
**Problem**: Multiple processes trying to write simultaneously.

**Solution**: WAL mode is enabled by default in `database/index.ts`. For parallel writes, consider:
- Using separate terminal IDs for background processes
- Staggering start times slightly
- WAL mode handles most concurrent writes automatically

## Todo List (Future Enhancements)

Based on the project's todo list:

1. **✅ Define core TypeScript types** *(In Progress)*
   - Create clean types in `types/` folder
   - NO database complexity
   - Simple Article, Publication, SearchResult interfaces

2. **Create simple date utilities**
   - `parseTimeframe()` - Convert "7daysago" to dates
   - `formatDate()` - Consistent date formatting
   - `getDaysAgo()` - Calculate past dates

3. **Create slug generator**
   - Deterministic slug from title
   - No database lookups
   - SEO-optimized format

4. **Build in-memory pipeline**
   - Process: fetch → transform → generate → save
   - No interim disk writes
   - Stream data through memory

5. **Create simple CLI runner**
   - Single CLI to orchestrate pipeline
   - Clear options for different modes
   - Progress reporting

## Testing & Validation

### Verify Database Tables
```bash
sqlite3 logs/content-generation-v2.db ".tables"
# Should show: api_calls, raw_search, structured_news
```

### Check Data Integrity
```bash
# Count records
sqlite3 logs/content-generation-v2.db "SELECT COUNT(*) FROM raw_search;"
sqlite3 logs/content-generation-v2.db "SELECT COUNT(*) FROM structured_news;"

# Verify dates match
sqlite3 logs/content-generation-v2.db "
  SELECT r.pub_date 
  FROM raw_search r 
  LEFT JOIN structured_news s ON r.pub_date = s.pub_date 
  WHERE s.pub_date IS NULL;
"
```

### Validate JSON Output
```bash
# Check JSON is valid
jq empty tmp/news-structured_*.json

# Validate schema compliance (articles have required fields)
jq '.articles[] | select(.id == null or .slug == null or .category == null)' tmp/news-structured_*.json
# Should return nothing if valid
```

## Performance Notes

### Token Usage
- **Raw search**: ~8-10k tokens (mostly output)
- **Structured generation**: ~30k tokens total (12k input, 20k output)
- **Cost per day**: ~$0.05 (search) + ~$0.11 (structure) = **~$0.16/day**

### Execution Time
- **Raw search**: 30-60 seconds
- **Structured generation**: 3-5 minutes (with 10-minute timeout)

### Parallel Execution
- Can run multiple search-news in parallel (different dates)
- Use background jobs with nohup and separate log files
- Each process gets unique terminal ID

## Schema Evolution

When updating `news-structured-schema.ts`:

1. **Test with one date first**: Don't regenerate all data immediately
2. **Version consideration**: Old JSON files won't match new schema
3. **Database migration**: Use `deleteStructuredNews()` and regenerate
4. **Cost impact**: Regenerating all data costs ~$0.11 per date

## Environment Setup

### Required Packages
```json
{
  "dependencies": {
    "genkit": "^x.x.x",
    "@genkit-ai/google-genai": "^x.x.x",
    "better-sqlite3": "^x.x.x",
    "commander": "^x.x.x",
    "dotenv": "^x.x.x",
    "undici": "^x.x.x",
    "zod": "^x.x.x"
  }
}
```

### GCP Setup
1. Create GCP project
2. Enable Vertex AI API
3. Set up authentication (service account or gcloud auth)
4. Configure `.env` with project ID

## Maintenance Notes

### Regular Maintenance
- Monitor `logs/content-generation-v2.db` size
- Archive old JSON files from `tmp/`
- Review API costs in `api_calls` table
- Vacuum database occasionally: `sqlite3 logs/content-generation-v2.db "VACUUM;"`

### Schema Changes
When adding new fields to Zod schemas:
1. Update `news-structured-schema.ts`
2. Update this LLM.md guide
3. Consider if database schema needs updates
4. Test with one date before batch regeneration

### Cost Monitoring
```sql
-- Daily cost summary
SELECT 
  DATE(called_at) as date,
  script_name,
  COUNT(*) as calls,
  ROUND(SUM(cost_usd), 2) as cost
FROM api_calls
GROUP BY DATE(called_at), script_name
ORDER BY date DESC;
```

---

## Quick Reference Commands

```bash
# Search for news (7 days ago)
npx tsx scripts/content-generation-v2/search-news.ts --timeframe=7daysago --logtodb

# Generate structured output
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-07 --logtodb

# Check database
sqlite3 logs/content-generation-v2.db -header -column "SELECT * FROM structured_news;"

# Query categories
cat tmp/news-structured_*.json | jq -r '.articles[].category[]' | sort | uniq -c | sort -rn

# Monitor costs
sqlite3 logs/content-generation-v2.db "SELECT script_name, ROUND(SUM(cost_usd), 2) FROM api_calls GROUP BY script_name;"
```

---

**Last Updated**: 2025-10-14  
**System Version**: Content Generation V2  
**Database Version**: Schema initialized with 3 tables (api_calls, raw_search, structured_news)
