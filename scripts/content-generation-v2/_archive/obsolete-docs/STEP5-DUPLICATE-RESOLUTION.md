# Step 5: Duplicate Resolution & Publication Generation

**Status**: Foundation Complete ✅  
**Date**: October 14, 2025  
**Pipeline Stage**: Final publication assembly with LLM-based duplicate resolution

---

## Overview

Step 5 is the final stage of the Content Generation V2 pipeline. It takes structured articles from Step 2, applies duplicate detection results from Step 4, and uses Gemini 2.5 Flash to make editorial decisions about BORDERLINE cases.

### Process Flow

```
Step 2 (structured_news) 
    → Step 4 (check-duplicates.ts)
        → Step 5a (resolve-duplicates.ts) [LLM decision]
            → Step 5b (generate-publication.ts) [Final assembly]
```

---

## Components Created

### 1. **duplicate-resolution-schema.ts** ✅
Zod schemas for structured LLM output.

**Key Schemas:**
- `DuplicateResolutionSchema` - Decision enum (NEW/UPDATE/SKIP) with reasoning
- `ArticleUpdateSchema` - Structure for UPDATE entries
- `PublicationMetadataSchema` - For rewriting pub headline/summary

**Decision Types:**
- **NEW**: Significant new information, deserves separate article
- **UPDATE**: New developments on same story, add to existing article
- **SKIP**: No meaningful new information, exclude from publication

**Confidence Levels:**
- **high**: >80% certain (auto-resolve eligible)
- **medium**: 50-80% certain (recommend review)
- **low**: <50% certain (requires human review)

### 2. **resolve-duplicates.ts** ✅
LLM-based resolution for BORDERLINE duplicate cases.

**Features:**
- Loads articles from structured_news table
- Calls check-duplicates.ts logic for similarity scoring
- Uses Gemini 2.5 Flash to compare full_report texts
- Returns structured decisions with reasoning

**Model Config:**
- **Model**: `gemini-2.5-flash`
- **Temperature**: 0.3 (consistent decisions)
- **Max Tokens**: 2048
- **Structured Output**: Yes (Zod schema)

**CLI Usage:**
```bash
# Resolve duplicates for specific date
npx tsx scripts/content-generation-v2/resolve-duplicates.ts --date 2025-10-09

# Single article
npx tsx scripts/content-generation-v2/resolve-duplicates.ts --article-id <uuid>

# Custom BORDERLINE range
npx tsx scripts/content-generation-v2/resolve-duplicates.ts \
  --date 2025-10-09 \
  --borderline-min 0.40 \
  --borderline-max 0.65
```

### 3. **check-duplicates.ts Updates** ✅
Exported functions and types for reuse:
- `export interface ArticleData`
- `export interface SimilarityResult`
- `export function getArticleData()`
- `export function checkArticle()`
- `export function calculateSimilarity()`

---

## Decision Logic

### LLM Prompt Structure

The LLM receives:
1. **Similarity score** (0.35-0.70 BORDERLINE range)
2. **Original article**: Published earlier, full text + metadata
3. **Candidate article**: Being evaluated, full text + metadata
4. **Decision criteria**: Guidelines for NEW/UPDATE/SKIP

### Decision Criteria

#### Choose NEW if:
- Substantially different angle or story
- Different victims, campaigns, or attack vectors
- Distinct technical analysis or implications
- Overlap is coincidental (same CVE but different contexts)
- Readers benefit from seeing both articles

#### Choose UPDATE if:
- New developments on the same story
- Adds new technical details, patches, mitigation
- Updates victim count, attribution, impact
- Clearly a continuation/follow-up
- Same campaign/incident tracked over time

#### Choose SKIP if:
- No meaningful new information
- Merely rephrases existing coverage
- Only difference is writing style or source
- Would create redundancy without value
- Would confuse readers rather than inform

---

## Publication Assembly (TODO)

### Step 5b: generate-publication.ts

**Process:**
1. Load all articles for target date from structured_news
2. Run duplicate detection + resolution
3. Classify each article:
   - **Similarity < 0.35**: Publish as NEW (no LLM call needed)
   - **Similarity 0.35-0.70**: Call LLM for resolution (BORDERLINE)
   - **Similarity ≥ 0.70**: Direct UPDATE (no LLM call needed)

4. **Handle NEW articles**: Include normally in publication
5. **Handle UPDATE articles**:
   - Keep original article ID and slug
   - Add update entry to `articles` array:
     ```typescript
     {
       update_date: "2025-10-09",
       update_headline: "Oracle Releases Emergency Patch",
       update_summary: "Oracle has released...",
       sources: [...]
     }
     ```
6. **Handle SKIP articles**:
   - Collect all remaining articles (after skips)
   - Call LLM to regenerate:
     - Publication headline
     - Publication summary
     - Publication slug (optional)

### Update Schema Structure

For UPDATE articles, the publication contains:
```json
{
  "id": "original-article-id",
  "slug": "original-slug-name",
  "headline": "Original Headline",
  "summary": "Original summary...",
  "full_report": "Original full report...",
  "updates": [
    {
      "update_date": "2025-10-09",
      "update_headline": "New Development Title",
      "update_summary": "What changed...",
      "sources": [...]
    }
  ],
  "sources": [...original sources...]
}
```

### SKIP Handling

When articles are skipped:
1. Remove from final publication
2. If 1+ articles skipped, regenerate publication metadata:
   - New headline covering remaining articles
   - New summary covering remaining articles
   - Optional: New slug if headline changed significantly

**LLM Call:**
```typescript
// Input: All remaining article headlines + summaries
// Output: New publication headline + summary
// Model: gemini-2.5-flash
// Temperature: 0.7 (creative headlines)
```

---

## Cost Analysis

### Per Article Resolution

**Scenario**: Compare 2 articles (5K chars each)

**Gemini 2.5 Flash:**
- Input: ~2,500 tokens (both articles + prompt)
- Output: ~300 tokens (decision + reasoning)
- Cost: ~$0.0002 per comparison

**Daily Publication** (10 articles, 3 BORDERLINE):
- Total comparisons: 3
- Total cost: ~$0.0006
- Monthly (30 days): ~$0.018

### Publication Rewrite (SKIP cases)

**Scenario**: Regenerate headline/summary (2 articles skipped, 8 remaining)

**Input:**
- 8 article headlines + summaries: ~1,500 tokens
- Prompt: ~200 tokens
- **Total Input**: ~1,700 tokens

**Output:**
- New headline: ~20 tokens
- New summary: ~100 tokens
- **Total Output**: ~120 tokens

**Cost**: ~$0.0001 per rewrite

**Monthly** (assuming 10 rewrites): ~$0.001

---

## Performance Targets

### Resolution Speed
- **Per comparison**: <3 seconds (Gemini 2.5 Flash)
- **Daily publication** (10 articles, 3 BORDERLINE): <10 seconds
- **Batch processing**: Parallel LLM calls where possible

### Accuracy Goals
- **High confidence decisions**: >90% accuracy (validated against human review)
- **Medium confidence**: >75% accuracy
- **Low confidence**: Flagged for human review (no auto-apply)

---

## Integration Points

### From Step 2 (news-structured.ts)
- **Table**: `structured_news`
- **Data**: Full publication JSON with all articles
- **Fields**: `pub_date`, `data` (JSON), `headline`, `total_articles`

### From Step 4 (check-duplicates.ts)
- **Functions**: `getArticleData()`, `checkArticle()`, `calculateSimilarity()`
- **Similarity**: 6-dimensional weighted Jaccard (CVE 45%, Text 20%, Entities 35%)
- **Thresholds**: NEW (<0.35), BORDERLINE (0.35-0.70), UPDATE (≥0.70)

### To Publication System
- **Format**: CyberPublication JSON (matches existing schema)
- **Output**: Final deduplicated publication with UPDATE entries
- **Updates**: Embedded in article objects, not separate entries

---

## Validation Test Case

### Cl0p Oracle Articles (Oct 7 & Oct 9)

**Expected Behavior:**
1. **Duplicate Detection**: Score 0.732 (UPDATE category)
2. **LLM Decision**: Not called (score ≥ 0.70, direct UPDATE)
3. **Final Publication**:
   - Oct 7 article: Original with UPDATE entry from Oct 9
   - Oct 9 article: Not included separately
   - Same ID/slug maintained from Oct 7

**Validation Steps:**
```bash
# 1. Index both articles
npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-07
npx tsx scripts/content-generation-v2/index-entities.ts --date 2025-10-09

# 2. Check duplicate detection
npx tsx scripts/content-generation-v2/check-duplicates.ts --date 2025-10-09

# 3. Resolve (should skip LLM, direct UPDATE)
npx tsx scripts/content-generation-v2/resolve-duplicates.ts --date 2025-10-09

# 4. Generate final publication
npx tsx scripts/content-generation-v2/generate-publication.ts --date 2025-10-09
```

**Expected Output:**
- Similarity: 0.732 ✅
- Classification: UPDATE ✅
- LLM called: No (>0.70 threshold)
- Final pub: 1 article with UPDATE entry ✅

---

## TODO: Remaining Work

### High Priority
1. ✅ **Duplicate resolution schema** - COMPLETE
2. ✅ **resolve-duplicates.ts** - COMPLETE (foundation)
3. 🔲 **generate-publication.ts** - Main assembly script
4. 🔲 **Publication rewrite logic** - For SKIP cases
5. 🔲 **Database schema** - Store resolution decisions
6. 🔲 **End-to-end test** - Cl0p validation case

### Medium Priority
7. 🔲 **Batch processing** - Parallel LLM calls
8. 🔲 **Confidence thresholds** - Auto-resolve high confidence
9. 🔲 **Human review UI** - Flag low confidence cases
10. 🔲 **Performance monitoring** - Track LLM accuracy

### Low Priority
11. 🔲 **Cost optimization** - Cache common comparisons
12. 🔲 **A/B testing** - Compare model versions
13. 🔲 **Fallback logic** - Handle LLM failures gracefully

---

## File Structure

```
scripts/content-generation-v2/
├── duplicate-resolution-schema.ts     ✅ Zod schemas for LLM output
├── resolve-duplicates.ts              ✅ LLM-based BORDERLINE resolution
├── generate-publication.ts            🔲 Final publication assembly
├── check-duplicates.ts                ✅ Similarity detection (updated)
├── news-structured.ts                 ✅ Step 2 structured output
├── ai/vertex.ts                       ✅ Gemini API client
└── database/
    ├── schema.ts                      ✅ Main schema
    ├── schema-structured-news.ts      ✅ Publications table
    └── schema-article-entities.ts     ✅ Fingerprint V2 tables
```

---

## Next Steps

### Immediate (Today)
1. Complete `generate-publication.ts` implementation
2. Add publication rewrite logic for SKIP cases
3. Test with Cl0p Oracle validation case

### This Week
4. Add database schema for storing resolution decisions
5. Implement batch processing for parallel LLM calls
6. Document end-to-end pipeline flow

### Next Week
7. Performance testing and optimization
8. Human review workflow for low confidence cases
9. Integration with existing publication system

---

## Success Criteria

### Must Have
- [x] Schema defined with NEW/UPDATE/SKIP enum
- [x] LLM comparison prompt written
- [x] resolve-duplicates.ts foundation complete
- [ ] generate-publication.ts working end-to-end
- [ ] Cl0p validation test passes
- [ ] UPDATE entries properly embedded in articles

### Should Have
- [ ] SKIP handling with publication rewrite
- [ ] Batch processing for efficiency
- [ ] Confidence-based auto-resolution
- [ ] Cost tracking and monitoring

### Nice to Have
- [ ] Human review UI integration
- [ ] A/B testing framework
- [ ] Performance analytics dashboard
- [ ] Fallback strategies for LLM failures

---

**Status**: Foundation complete, ready for publication assembly implementation
**Model**: Gemini 2.5 Flash (cost-effective, fast)
**Next**: Build generate-publication.ts with UPDATE/SKIP logic
