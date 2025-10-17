# Content Generation Pipeline Runner

## Overview

The `run-pipeline.ts` script orchestrates the complete content generation workflow, allowing you to run all steps or start from any specific step.

## Pipeline Steps

The pipeline consists of 7 sequential steps:

| Step | Name | Script | Description |
|------|------|--------|-------------|
| 1 | Search News | `search-news.ts` | Search for cybersecurity news articles |
| 2 | Generate Articles | `generate-publication-unified.ts` | Use LLM to generate structured articles |
| 3 | Filter & Classify | `filter-articles-entity.ts` | Entity fingerprinting and classification |
| 4 | LLM Comparison | `compare-articles-llm.ts` | Intelligent UPDATE/SKIP/NEW decisions |
| 5 | Save Articles | `save-articles-with-entities.ts` | Save articles to database and files |
| 6 | Save Publication | `save-publication.ts` | Save publication with NEW/UPDATE articles |
| 7 | Generate Indexes | `generate-indexes.ts` | Generate articles and publications indexes |

## Usage

### Basic Usage

```bash
# Run complete pipeline (Steps 1-7)
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=5daysago

# Start from Step 3 (if you already have Step 1-2 outputs)
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=5daysago --start=3

# Run specific step range
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=5daysago --start=5 --end=7

# Just regenerate indexes
npx tsx scripts/content-generation/cli/run-pipeline.ts --start=7 --end=7

# Dry run (preview what would execute)
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=5daysago --dry-run
```

### Options

- `--timeframe=TIME` - Timeframe for news search (default: `5daysago`)
  - Values: `today`, `yesterday`, `1daysago`, `2daysago`, etc.
- `--start=N` - Start from step N (default: 1)
- `--end=N` - End at step N (default: 7)
- `--dry-run` - Preview pipeline without executing
- `--verbose` or `-v` - Show detailed command output
- `--help` or `-h` - Show help message

## Common Workflows

### Fresh Pipeline Run

Start from scratch with new data:

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=5daysago
```

This will:
1. Search for news from 5 days ago
2. Generate structured articles using LLM
3. Classify articles (NEW/UPDATE/SKIP)
4. Use LLM for intelligent UPDATE decisions (if needed)
5. Save articles to database and files
6. Save publication metadata
7. Generate master indexes

### Resume from Step 3

If you already have search results and generated articles (Step 1-2 done):

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=5daysago --start=3
```

This is useful when:
- You've already run Steps 1-2 and want to continue
- You're testing classification/save logic
- You want to reprocess existing OUTPUT files

### Save & Index Only

If you want to re-save articles and regenerate indexes (maybe after manual edits to OUTPUT files):

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=5daysago --start=5 --end=7
```

### Regenerate Indexes Only

After making manual changes to article or publication files:

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts --start=7 --end=7
```

## How It Works

### Step Auto-Detection

The pipeline automatically finds the latest output files for each step:

- Step 2 looks for: `OUTPUT/search-news_*_{timeframe}_*.json`
- Step 3 looks for: `OUTPUT/publication-unified_*_{timeframe}_*.json`
- Step 4 looks for: `OUTPUT/*_{timeframe}_*_classified.json`
- Step 5 looks for: `OUTPUT/*_{timeframe}_*_llm-decided.json` or `*_classified.json`
- Step 6 looks for: `OUTPUT/*_{timeframe}_*_classified.json`

### Smart Step Skipping

- **Step 4 (LLM Comparison)** is automatically skipped if there are no `POTENTIAL_UPDATE` articles in the classified file
- This saves API costs when all articles are clearly NEW or SKIP

### Output Locations

After running the pipeline, your content will be in:

```
public/data/
├── articles/
│   ├── {slug}.json                 # Individual article files
│   └── ...
├── publications/
│   ├── daily-{date}.json           # Publication files
│   └── ...
├── articles-index.json             # Master articles index
└── publications-index.json         # Master publications index
```

## Examples

### Test with Dry Run

Preview what the pipeline would do:

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --timeframe=5daysago \
  --start=3 \
  --dry-run
```

Output will show all commands that would be executed without actually running them.

### Process Multiple Days

Process news from different days:

```bash
# Today's news
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=today

# Yesterday
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=yesterday

# Specific number of days ago
npx tsx scripts/content-generation/cli/run-pipeline.ts --timeframe=3daysago
```

### Debug with Verbose Output

See detailed output from each step:

```bash
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --timeframe=5daysago \
  --start=3 \
  --verbose
```

## Error Handling

If a step fails:
- The pipeline stops immediately
- An error message shows which step failed
- You can fix the issue and resume from that step using `--start`

Example:
```bash
# Step 4 failed, fix the issue, then resume from Step 4
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --timeframe=5daysago \
  --start=4
```

## Performance Notes

- **Step 1 (Search)**: ~5-10 seconds (depends on API)
- **Step 2 (Generate)**: ~30-60 seconds (LLM generation)
- **Step 3 (Filter)**: ~1-2 seconds (fingerprinting)
- **Step 4 (LLM Compare)**: ~10-30 seconds (only if POTENTIAL_UPDATE found)
- **Step 5 (Save Articles)**: ~1-2 seconds
- **Step 6 (Save Publication)**: ~1 second
- **Step 7 (Indexes)**: ~1 second

**Total time for fresh run**: ~1-2 minutes (depends on number of articles and LLM speed)

## Integration with Existing Scripts

The pipeline runner wraps existing scripts, so you can still run them individually:

```bash
# Individual script
npx tsx scripts/content-generation/cli/filter-articles-entity.ts \
  --input=OUTPUT/publication-unified_5daysago_*.json

# Or use pipeline
npx tsx scripts/content-generation/cli/run-pipeline.ts \
  --timeframe=5daysago \
  --start=3 \
  --end=3
```

Both approaches work - use the pipeline for automation, individual scripts for debugging.
