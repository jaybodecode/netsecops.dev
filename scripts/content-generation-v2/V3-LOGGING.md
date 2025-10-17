# V3 Pipeline Execution Logging

**Status**: ✅ Production Ready  
**Created**: 2024-10-15  
**Purpose**: Centralized execution tracking for all V3 pipeline scripts

---

## Overview

The V3 logging system provides comprehensive execution tracking for all pipeline scripts, storing detailed information about each run including:

- ✅ **Execution Status**: SUCCESS, FAILED, SKIPPED, or STARTED
- 📊 **Operation Counts**: Articles inserted, duplicates detected, publications generated
- ⏱️ **Performance Metrics**: Execution time tracking
- ❌ **Error Tracking**: Full error messages and stack traces
- 🔍 **Audit Trail**: Complete history of all pipeline executions

This replaces scattered log files with a **queryable SQLite database** for better monitoring, debugging, and reporting.

---

## Database Schema

### Table: `pipeline_execution_log`

```sql
CREATE TABLE pipeline_execution_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  script_name TEXT NOT NULL,
  date_processed TEXT NOT NULL,        -- YYYY-MM-DD or 'ALL'
  status TEXT NOT NULL,                 -- STARTED | SUCCESS | FAILED | SKIPPED
  started_at TEXT NOT NULL,             -- ISO timestamp
  completed_at TEXT,                    -- ISO timestamp
  execution_time_ms INTEGER,
  
  -- Operation counts
  articles_inserted INTEGER,
  articles_new INTEGER,
  articles_skip_fts5 INTEGER,
  articles_skip_update INTEGER,
  articles_published INTEGER,
  articles_regenerated INTEGER,
  llm_calls INTEGER,
  
  -- Error tracking
  error_message TEXT,
  error_stack TEXT,
  
  -- Additional context (JSON)
  metadata TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX idx_pipeline_log_date_script ON pipeline_execution_log(date_processed, script_name);
CREATE INDEX idx_pipeline_log_status ON pipeline_execution_log(status);
CREATE INDEX idx_pipeline_log_started ON pipeline_execution_log(started_at DESC);
```

---

## Architecture

### Components

1. **`schema-pipeline-logs.ts`** - Database schema and table creation
2. **`pipeline-logger.ts`** - Reusable logging utility class
3. **`view-pipeline-logs.ts`** - Query tool for viewing execution history
4. **Script Integration** - All pipeline scripts use PipelineLogger

### Logger Lifecycle

```typescript
import { createPipelineLogger } from './utils/pipeline-logger.js';
import { ensureInitialized } from './database/index.js';

// 1. Initialize database and logger
ensureInitialized();
const db = getDB();
const logger = createPipelineLogger(db);

// 2. Log start
logger.logStart({
  scriptName: 'insert-articles',
  dateProcessed: '2025-10-07',
  metadata: { isDryRun: false },
});

// 3a. Log success with counts
logger.logSuccess({
  articlesInserted: 10,
  metadata: { publicationId: 'pub_123' },
});

// 3b. OR log error
logger.logError({ 
  error: new Error('Database connection failed') 
});

// 3c. OR log skip
logger.logSkip('No structured news found for date');
```

---

## Usage Examples

### View Recent Logs

```bash
# Show last 10 executions
npx tsx view-pipeline-logs.ts

# Show last 50 executions
npx tsx view-pipeline-logs.ts --limit 50
```

### Filter by Date

```bash
# Show all executions for specific date
npx tsx view-pipeline-logs.ts --date 2025-10-07

# Show today's executions only
npx tsx view-pipeline-logs.ts --today
```

### Filter by Script

```bash
# Show check-duplicates-v3 executions
npx tsx view-pipeline-logs.ts --script check-duplicates-v3

# Show insert-articles executions
npx tsx view-pipeline-logs.ts --script insert-articles
```

### Filter by Status

```bash
# Show only failures
npx tsx view-pipeline-logs.ts --status FAILED

# Show only successful runs
npx tsx view-pipeline-logs.ts --status SUCCESS

# Show skipped executions
npx tsx view-pipeline-logs.ts --status SKIPPED
```

### Combined Filters

```bash
# Show failed insert-articles runs for Oct 7
npx tsx view-pipeline-logs.ts --date 2025-10-07 --script insert-articles --status FAILED

# Show today's successful check-duplicates runs
npx tsx view-pipeline-logs.ts --today --script check-duplicates-v3 --status SUCCESS
```

### Summary Statistics

```bash
# Show overall pipeline statistics
npx tsx view-pipeline-logs.ts --summary
```

**Output includes**:
- Total executions by status
- Success/failure rates by script
- Average execution times
- Recent failures with error messages
- Execution counts by date

---

## Logged Scripts

All key V3 pipeline scripts now include execution logging:

| Script | Key Metrics Logged |
|--------|-------------------|
| **insert-articles.ts** | `articles_inserted` |
| **check-duplicates-v3.ts** | `articles_new`, `articles_skip_fts5`, `articles_skip_update`, `llm_calls` |
| **generate-publication.ts** | `articles_published` |
| **generate-publication-json.ts** | `articles_published` |
| **generate-article-json.ts** | `articles_published` |
| **regenerate-updated-articles.ts** | `articles_regenerated` |
| **generate-indexes.ts** | Publication/article counts |
| **generate-rss.ts** | Feed generation counts |

---

## Log Output Examples

### Success Log

```
[1] ✅ insert-articles - 2025-10-07
    Status: SUCCESS
    Started: Oct 15, 02:30:45 AM
    Completed: Oct 15, 02:30:48 AM
    Duration: 3.24s
    Counts: inserted:10
```

### Duplicate Detection Log

```
[2] ✅ check-duplicates-v3 - 2025-10-07
    Status: SUCCESS
    Started: Oct 15, 02:31:00 AM
    Completed: Oct 15, 02:31:45 AM
    Duration: 45.12s
    Counts: new:6, skip-fts5:3, skip-update:1, llm:2
```

### Skipped Execution

```
[3] ⏭️  insert-articles - 2025-10-15
    Status: SKIPPED
    Started: Oct 15, 04:28:04 AM
    Completed: Oct 15, 04:28:04 AM
    Duration: 3ms
    Reason: No structured news found for 2025-10-15
```

### Failed Execution

```
[4] ❌ generate-publication - 2025-10-11
    Status: FAILED
    Started: Oct 15, 01:15:30 AM
    Completed: Oct 15, 01:15:31 AM
    Duration: 1.2s
    Error: NOT NULL constraint failed: published_articles.original_pub_date
```

---

## Direct SQL Queries

For advanced analysis, query the database directly:

### Find All Failures

```bash
sqlite3 logs/content-generation-v2.db "
SELECT 
  script_name,
  date_processed,
  datetime(started_at) as started,
  error_message
FROM pipeline_execution_log
WHERE status = 'FAILED'
ORDER BY started_at DESC
LIMIT 10;
"
```

### Pipeline Success Rate by Date

```bash
sqlite3 logs/content-generation-v2.db "
SELECT 
  date_processed,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successes,
  ROUND(100.0 * SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM pipeline_execution_log
WHERE date_processed != 'ALL'
GROUP BY date_processed
ORDER BY date_processed DESC
LIMIT 10;
"
```

### Average Execution Time by Script

```bash
sqlite3 logs/content-generation-v2.db "
SELECT 
  script_name,
  COUNT(*) as executions,
  ROUND(AVG(execution_time_ms), 2) as avg_ms,
  ROUND(AVG(execution_time_ms) / 1000.0, 2) as avg_seconds
FROM pipeline_execution_log
WHERE execution_time_ms IS NOT NULL
GROUP BY script_name
ORDER BY avg_ms DESC;
"
```

### LLM Call Statistics

```bash
sqlite3 logs/content-generation-v2.db "
SELECT 
  date_processed,
  SUM(llm_calls) as total_llm_calls,
  SUM(articles_new) as new_articles,
  SUM(articles_skip_update) as updates_created
FROM pipeline_execution_log
WHERE script_name = 'check-duplicates-v3'
  AND status = 'SUCCESS'
GROUP BY date_processed
ORDER BY date_processed DESC;
"
```

### Complete Pipeline Run Analysis

```bash
sqlite3 logs/content-generation-v2.db "
SELECT 
  date_processed,
  GROUP_CONCAT(script_name || ':' || status) as pipeline_status,
  COUNT(*) as steps_completed
FROM pipeline_execution_log
WHERE date_processed = '2025-10-07'
GROUP BY date_processed;
"
```

---

## Benefits

### 1. **Debugging**
- Quickly identify which step failed in a pipeline run
- See exact error messages without searching log files
- Track execution patterns to identify recurring issues

### 2. **Monitoring**
- Real-time view of pipeline health
- Success/failure rates by script and date
- Performance tracking (execution times)

### 3. **Auditing**
- Complete history of all pipeline executions
- Who ran what, when, and with what result
- Metadata tracking for additional context

### 4. **Reporting**
- Generate reports on pipeline performance
- Track LLM usage over time
- Identify bottlenecks in the pipeline

### 5. **Alerting** (Future)
- Could trigger notifications on failures
- Alert on unusual execution times
- Monitor for skipped days

---

## Integration with Existing Tools

### API Call Logs (Already Exists)

The **`api_calls`** table tracks LLM API usage:
- Model used
- Token counts (input/output)
- Cost per call
- Timestamp

View with:
```bash
npx tsx view-logs.ts
npx tsx view-logs.ts --script check-duplicates-v3
npx tsx view-logs.ts --today
```

### Execution Logs (NEW)

The **`pipeline_execution_log`** table tracks script execution:
- Status (SUCCESS/FAILED/SKIPPED)
- Counts (articles, duplicates, etc.)
- Execution time
- Error details

View with:
```bash
npx tsx view-pipeline-logs.ts
npx tsx view-pipeline-logs.ts --summary
npx tsx view-pipeline-logs.ts --status FAILED
```

**Together**, these provide complete observability:
1. **What ran?** → pipeline_execution_log
2. **How much did it cost?** → api_calls
3. **Why did it fail?** → pipeline_execution_log (error_message)

---

## Metadata Field

The `metadata` field stores additional context as JSON. Common uses:

### Insert Articles
```json
{
  "isDryRun": false,
  "publicationId": "pub_20251007",
  "articleIds": ["e1c2a3b4-...", "e4a5b6c7-..."]
}
```

### Check Duplicates
```json
{
  "lookbackDays": 30,
  "isDryRun": false,
  "mode": "date",
  "skipLlm": 2,
  "totalProcessed": 10
}
```

### Skipped Execution
```json
{
  "skip_reason": "No structured news found for 2025-10-13"
}
```

Query metadata:
```bash
sqlite3 logs/content-generation-v2.db "
SELECT 
  script_name,
  date_processed,
  json_extract(metadata, '$.skip_reason') as reason
FROM pipeline_execution_log
WHERE status = 'SKIPPED'
  AND metadata IS NOT NULL
ORDER BY started_at DESC
LIMIT 5;
"
```

---

## Performance Considerations

### Minimal Overhead
- **INSERT** on start: ~1-2ms
- **UPDATE** on completion: ~1-2ms
- **Total overhead**: 2-4ms per script execution

### Database Size
- ~500 bytes per log entry
- 1000 executions ≈ 500KB
- 10,000 executions ≈ 5MB
- **Negligible storage impact**

### Query Performance
With indexes:
- Date + Script lookup: <1ms
- Status filter: <1ms
- Recent logs (LIMIT 50): <1ms

---

## Best Practices

### 1. Always Log Start First
```typescript
// ✅ Correct
logger.logStart({ scriptName: 'my-script', dateProcessed: '2025-10-07' });
// ... do work ...
logger.logSuccess({ articlesInserted: 10 });

// ❌ Wrong - will throw error
logger.logSuccess({ articlesInserted: 10 }); // Error: Must call logStart() first
```

### 2. Handle Errors Properly
```typescript
try {
  logger.logStart({ scriptName: 'my-script', dateProcessed: date });
  // ... do work ...
  logger.logSuccess({ articlesInserted: count });
} catch (error: any) {
  logger.logError({ error });
  throw error; // Re-throw if needed
}
```

### 3. Use Skip for Expected Non-Execution
```typescript
if (articles.length === 0) {
  logger.logSkip('No articles with resolution=NULL');
  return; // Exit gracefully
}
```

### 4. Include Relevant Metadata
```typescript
logger.logStart({
  scriptName: 'check-duplicates-v3',
  dateProcessed: date,
  metadata: {
    lookbackDays: 30,
    isDryRun: false,
    mode: 'date', // vs 'all'
  },
});
```

### 5. Log All Relevant Counts
```typescript
logger.logSuccess({
  articlesInserted: 10,
  articlesNew: 6,
  articlesSkipFts5: 3,
  articlesSkipUpdate: 1,
  llmCalls: 2,
  metadata: {
    totalProcessed: 10,
    skipLlm: 2,
  },
});
```

---

## Troubleshooting

### "Cannot find name 'logger'"

**Cause**: Logger not declared before usage  
**Fix**: Ensure logger is created before any log calls:
```typescript
const logger = createPipelineLogger(db);
logger.logStart({ ... });
```

### "Must call logStart() before logSuccess()"

**Cause**: Trying to log completion without starting  
**Fix**: Always call `logStart()` first:
```typescript
logger.logStart({ scriptName: 'my-script', dateProcessed: date });
// ... then later ...
logger.logSuccess({ ... });
```

### No Logs Appearing

**Cause**: Database not initialized  
**Fix**: Call `ensureInitialized()` before creating logger:
```typescript
import { ensureInitialized } from './database/index.js';

ensureInitialized(); // Creates table if needed
const db = getDB();
const logger = createPipelineLogger(db);
```

### Duplicate Entries

**Cause**: Multiple logger instances or logStart() called twice  
**Fix**: Create logger once per script execution:
```typescript
// ✅ Correct - one logger per execution
function main() {
  const logger = createPipelineLogger(db);
  logger.logStart({ ... });
  // ... work ...
  logger.logSuccess({ ... });
}

// ❌ Wrong - creates multiple loggers
function processArticle(article) {
  const logger = createPipelineLogger(db); // Don't do this in loop!
  logger.logStart({ ... });
}
```

---

## Future Enhancements

### Planned Features
1. **Dashboard UI**: Web interface for viewing logs
2. **Email Alerts**: Notify on failures
3. **Slack Integration**: Post pipeline status updates
4. **Metrics Export**: Prometheus/Grafana integration
5. **Log Rotation**: Archive old logs after N days
6. **Performance Alerts**: Warn on slow executions

### Potential Queries
- "Show me all days where duplicate detection took >60s"
- "Alert if insert-articles fails 3 times in a row"
- "Track LLM cost trends over time"
- "Find days with >5 SKIP-UPDATE decisions"

---

## Related Documentation

- **[V3-PIPELINE.md](./V3-PIPELINE.md)** - Complete pipeline execution guide
- **[FTS5-SIMILARITY-STRATEGY.md](./FTS5-SIMILARITY-STRATEGY.md)** - Duplicate detection algorithm
- **[V3-DATABASE-SCHEMA.md](./V3-DATABASE-SCHEMA.md)** - Database schema reference

---

## Summary

The V3 logging system provides:
- ✅ **Complete execution tracking** for all pipeline scripts
- 📊 **Queryable database** instead of scattered log files
- ⏱️ **Performance metrics** for identifying bottlenecks
- ❌ **Error tracking** with full stack traces
- 🔍 **Audit trail** for debugging and compliance

**Usage is simple**:
```bash
# View logs
npx tsx view-pipeline-logs.ts

# Show summary
npx tsx view-pipeline-logs.ts --summary

# Filter by date/script/status
npx tsx view-pipeline-logs.ts --date 2025-10-07 --status FAILED
```

All pipeline scripts automatically log execution details - no manual intervention required.

---

**Created**: 2024-10-15  
**Status**: ✅ Production Ready  
**Maintainer**: V3 Pipeline Team
