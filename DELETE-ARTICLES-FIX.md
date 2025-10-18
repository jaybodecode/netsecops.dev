# Delete Articles by Date - Script Fix

**Date**: 2025-10-17  
**Status**: ✅ Complete

---

## Problem Summary

The `delete-articles-by-date.ts` script had several issues:

1. **❌ Deleted expensive Step 2 data by default** - Was deleting `structured_news` which costs money to regenerate
2. **❌ Missing tables** - Wasn't cleaning `article_update_sources` properly (FK relationship issue)
3. **❌ Missing publication cleanup** - Wasn't properly cleaning `publication_articles` and `published_articles`

## Solution

### 1. Added `--include-step2` Flag

**Default Behavior** (recommended):
```bash
npx tsx delete-articles-by-date.ts --date 2025-10-16
```
- ✅ Preserves `raw_search` (Step 1 - expensive search)
- ✅ Preserves `structured_news` (Step 2 - expensive LLM processing)
- ❌ Deletes `articles` + all related tables (Step 3)
- ❌ Deletes `publications` (Step 5)

**With Step 2 deletion** (rare - only for schema changes):
```bash
npx tsx delete-articles-by-date.ts --date 2025-10-16 --include-step2
```
- ✅ Preserves `raw_search` (Step 1)
- ❌ Deletes `structured_news` (Step 2)
- ❌ Deletes `articles` + all related tables (Step 3)
- ❌ Deletes `publications` (Step 5)

### 2. Fixed Table Coverage

**Now properly deletes all article-related tables:**
- `articles` (main table)
- `article_cves`
- `article_entities`
- `article_tags`
- `article_sources`
- `article_events`
- `article_mitre_techniques`
- `article_impact_scope`
- `article_iocs`
- `article_cyber_observables`
- `article_d3fend_countermeasures`
- `article_updates`
- `article_update_sources` ← **Fixed FK handling**
- `article_resolutions`
- `articles_meta`
- `articles_fts` (FTS5 index)

**Publication tables:**
- `publications`
- `publication_articles` ← **Now properly deleted**
- `published_articles` ← **Now properly deleted**

**Optional (with `--include-step2`):**
- `structured_news` (Step 2 data)

### 3. Improved FK Constraint Handling

**Fixed `article_update_sources` deletion:**
```typescript
// Old (BROKEN): Tried to delete by article_id (doesn't exist in table)
db.prepare(`DELETE FROM article_update_sources WHERE article_id IN (?)`).run(...)

// New (FIXED): Get update IDs first, then delete by update_id
const updateIds = db.prepare(`
  SELECT id FROM article_updates WHERE article_id IN (?)
`).all(...articleIds).map((row: any) => row.id)

db.prepare(`DELETE FROM article_update_sources WHERE update_id IN (?)`).run(...updateIds)
```

### 4. Better User Feedback

**Shows mode clearly:**
```
🔧 Mode: DELETE STEP 3 ONLY (preserves structured_news)
```

or

```
⚠️  Mode: DELETE STEP 2 + STEP 3 (includes structured_news)
```

**Provides contextual next steps:**
- Default mode: Shows Step 3 → Step 4 workflow
- With `--include-step2`: Shows Step 2 → Step 3 → Step 4 workflow

---

## Usage Examples

### Standard Workflow (Delete Step 3 only)

```bash
# Delete Step 3 data for 2025-10-16
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-16

# Re-run Step 3 (uses existing structured_news from Step 2)
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-16

# Re-run Step 4
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-16
```

### Schema Change Workflow (Delete Step 2 + Step 3)

Use this when you've changed the LLM schema and need to regenerate structured data:

```bash
# Delete Step 2 + Step 3 data
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-16 --include-step2

# Re-run Step 2 (expensive - uses Vertex AI)
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-16 --logtodb

# Re-run Step 3
npx tsx scripts/content-generation-v2/insert-articles.ts --date 2025-10-16

# Re-run Step 4
npx tsx scripts/content-generation-v2/check-duplicates-v3.ts --date 2025-10-16
```

### Force Mode (Skip Confirmation)

```bash
# Standard deletion (no confirmation prompt)
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-16 --force

# With Step 2 deletion (no confirmation prompt)
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-16 --force --include-step2
```

---

## When to Use Each Mode

### Use Default Mode When:
- Testing changes to duplicate detection logic (Step 4)
- Fixing source merging behavior
- Regenerating article JSON
- Testing publication generation (Step 5)
- No schema changes

### Use `--include-step2` Mode When:
- Changed LLM schema in `news-structured-schema.ts`
- Added new fields to articles (e.g., `mitre_mitigations`)
- Changed content generation prompts significantly
- Need to regenerate structured output from raw search

---

## Comparison with clean-database.ts

### clean-database.ts (Nuclear Option)
- Deletes ALL articles for ALL dates
- Preserves: `raw_search`, `api_calls`, `structured_news`
- Use when: Starting fresh, testing major changes

### delete-articles-by-date.ts (Surgical Option)
- Deletes articles for SINGLE date
- Preserves: Everything for other dates + `raw_search`, `api_calls`
- Optional: Preserve `structured_news` (default) or delete (with flag)
- Use when: Iterating on specific date, testing Step 3-4 changes

---

## Reference: Database Schema Coverage

All tables properly cleaned by `delete-articles-by-date.ts`:

| Table | Coverage | Notes |
|-------|----------|-------|
| `raw_search` | ✅ PRESERVE | Step 1 data (always preserved) |
| `structured_news` | ⚠️ OPTIONAL | Step 2 data (preserve by default, delete with `--include-step2`) |
| `articles` | ❌ DELETE | Step 3 main table |
| `article_cves` | ❌ DELETE | FK → articles |
| `article_entities` | ❌ DELETE | FK → articles |
| `article_tags` | ❌ DELETE | FK → articles |
| `article_sources` | ❌ DELETE | FK → articles |
| `article_events` | ❌ DELETE | FK → articles |
| `article_mitre_techniques` | ❌ DELETE | FK → articles |
| `article_impact_scope` | ❌ DELETE | FK → articles |
| `article_iocs` | ❌ DELETE | FK → articles |
| `article_cyber_observables` | ❌ DELETE | FK → articles |
| `article_d3fend_countermeasures` | ❌ DELETE | FK → articles |
| `article_updates` | ❌ DELETE | FK → articles |
| `article_update_sources` | ❌ DELETE | FK → article_updates (fixed) |
| `article_resolutions` | ❌ DELETE | FK → articles |
| `articles_meta` | ❌ DELETE | FK → articles |
| `articles_fts` | ❌ DELETE | FTS5 virtual table |
| `publications` | ❌ DELETE | Step 5 data |
| `publication_articles` | ❌ DELETE | FK → publications (fixed) |
| `published_articles` | ❌ DELETE | FK → publications (fixed) |
| `api_calls` | ✅ PRESERVE | Cost tracking (always preserved) |

---

## Testing

Verify the script works correctly:

```bash
# 1. Check current state
sqlite3 logs/content-generation-v2.db "SELECT COUNT(*) FROM articles WHERE DATE(created_at) = '2025-10-16'"

# 2. Run delete (dry run by canceling)
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-16
# Type "NO" to cancel and review counts

# 3. Verify structured_news is marked as "PRESERVED" by default

# 4. Test with --include-step2 flag
npx tsx scripts/content-generation-v2/delete-articles-by-date.ts --date 2025-10-16 --include-step2
# Verify structured_news is now in the deletion list
```
