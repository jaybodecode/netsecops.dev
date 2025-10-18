# Impact Scope Schema Enhancement

**Date:** October 17, 2025  
**Status:** Implemented

## Problem Statement

The `impact_scope` field was consistently under-populated because:
1. The field itself was marked as optional at the article level
2. All sub-fields were optional, leading to empty objects
3. Descriptions overlapped with the `entities[]` array
4. No clear guidance on when to use impact_scope vs entities

## Solution Implemented

### 1. Made `geographic_scope` Required

**Before:**
```typescript
geographic_scope: z.enum(['global', 'regional', 'national', 'local']).optional()
```

**After:**
```typescript
geographic_scope: z.enum(['global', 'regional', 'national', 'local']).describe("Geographic scope of impact...")
```

**Rationale:** Every incident has a geographic scope. Removing `.optional()` forces the LLM to always assess WHERE the impact occurs.

### 2. Made `impact_scope` Required at Article Level

**Before:**
```typescript
impact_scope: ImpactScopeSchema.optional()
```

**After:**
```typescript
impact_scope: ImpactScopeSchema.describe("Impact scope and scale assessment...")
```

**Result:** LLM must always populate this field with at minimum the geographic_scope.

### 3. Enhanced All Field Descriptions

#### Geographic Scope
- **Guidance:** Choose based on: Global (worldwide/multi-continent), Regional (specific region), National (specific country), Local (city/state)
- **Required:** Yes
- **Expected:** Always populated

#### Countries Affected
- **Guidance:** ONLY if explicitly mentioned. Use standard country names.
- **Required:** No
- **Clarification:** Don't infer - only include if articles specify

#### Industries Affected ⭐ **PRIORITIZED**
- **Guidance:** PRIORITIZE THIS - Select ALL applicable sectors. More important than individual companies.
- **Required:** No, but strongly encouraged
- **Key Change:** Emphasized sector-wide impact over individual entities

#### Companies Affected
- **Guidance:** ONLY for VICTIM/TARGET companies. Do NOT duplicate entities[].
- **Required:** No
- **Key Change:** Clear distinction from entities[] - only use for explicit victims

#### People Affected Estimate
- **Guidance:** Include if articles specify or can reasonably estimate
- **Required:** No
- **Examples:** '10,000+', '500-1000 users', 'millions of customers'

#### Governments Affected
- **Guidance:** ONLY for explicitly targeted/breached government entities. Do NOT duplicate entities[].
- **Required:** No
- **Key Change:** Clear distinction - use industries_affected=['Government'] for general targeting

#### Other Affected
- **Guidance:** Categorical groups not covered above (e.g., 'cloud service customers', 'OSS users')
- **Required:** No
- **Purpose:** Catch-all for non-entity groups

### 4. Comprehensive Article-Level Guidance

Added detailed description with:
- **Required fields** clearly marked
- **Critical distinctions** between entities[] and impact_scope
- **Prioritization** of fields (geographic → industries → scale → specific victims)
- **Four concrete examples** showing proper usage:
  1. Ransomware campaign (multi-sector)
  2. Product vulnerability (user-base wide)
  3. Nation-state attack (government targeted)
  4. Single company breach (specific victim)

## Expected Behavior Changes

### Before Enhancement
```json
{
  "impact_scope": null  // Field often omitted entirely
}
```

Or:

```json
{
  "impact_scope": {
    "companies_affected": ["Microsoft", "Google", "Amazon"],  // Duplicates entities[]
    "geographic_scope": null,
    "industries_affected": null
  }
}
```

### After Enhancement
```json
{
  "impact_scope": {
    "geographic_scope": "global",  // ✅ Always present
    "industries_affected": ["Healthcare", "Finance"],  // ✅ Prioritized
    "people_affected_estimate": "thousands affected across 50+ organizations",
    "companies_affected": null,  // ✅ Not duplicating entities[]
    "countries_affected": null,
    "governments_affected": null,
    "other_affected": null
  }
}
```

## Key Improvements

### 1. Reduced Duplication
- **Before:** Companies listed in both entities[] and impact_scope.companies_affected
- **After:** Clear guidance - entities[] for ALL mentions, impact_scope only for VICTIMS

### 2. Prioritized Sector Intelligence
- **Before:** Focus on individual company names
- **After:** "PRIORITIZE THIS" on industries_affected - sector-wide impact more valuable

### 3. Always-Present Geographic Context
- **Before:** geographic_scope often null
- **After:** Required field - must always assess WHERE

### 4. Better Scale Estimation
- **Before:** people_affected_estimate rarely used
- **After:** Clear examples and guidance on reasonable estimation

## Database Impact

**No schema changes required!** All fields remain optional in the database (`article_impact_scope` table). Changes are purely at the LLM prompt level to improve data quality.

Existing fields:
```sql
CREATE TABLE article_impact_scope (
  article_id TEXT PRIMARY KEY,
  geographic_scope TEXT,           -- Will now always be populated
  countries_affected TEXT,          -- JSON array, optional
  industries_affected TEXT,         -- JSON array, will be populated more often
  companies_affected TEXT,          -- JSON array, less duplication
  people_affected_estimate TEXT,    -- More consistent population
  governments_affected TEXT,        -- JSON array, less duplication
  other_affected TEXT              -- JSON array, optional
);
```

## Use Cases Enabled

### Dashboard: Sector Impact Analysis
```sql
-- Most targeted industries this month
SELECT 
  industry,
  COUNT(DISTINCT article_id) as incident_count
FROM article_impact_scope,
  json_each(industries_affected) as industry
WHERE geographic_scope IN ('global', 'regional')
GROUP BY industry
ORDER BY incident_count DESC;
```

### Dashboard: Geographic Heat Map
```sql
-- Incidents by geographic scope
SELECT 
  geographic_scope,
  COUNT(*) as count,
  GROUP_CONCAT(DISTINCT country) as countries
FROM article_impact_scope
LEFT JOIN json_each(countries_affected) as country
GROUP BY geographic_scope;
```

### Dashboard: Scale Estimation Trends
```sql
-- Articles with scale estimates
SELECT 
  article_id,
  people_affected_estimate,
  industries_affected
FROM article_impact_scope
WHERE people_affected_estimate IS NOT NULL
ORDER BY article_id DESC;
```

## Testing Checklist

- [ ] Generate new articles with enhanced schema
- [ ] Verify geographic_scope always populated
- [ ] Verify industries_affected populated when applicable
- [ ] Check no duplication between entities[] and companies_affected
- [ ] Verify people_affected_estimate includes reasonable estimates
- [ ] Confirm governments_affected only for explicit victims
- [ ] Check other_affected used for categorical groups

## Migration Notes

**No data migration needed!** This is a prompt enhancement only.

For existing data:
- Old articles will have sparse impact_scope data (expected)
- New articles will have richer, more consistent data
- Dashboard queries should handle null values gracefully

## Expected Improvement Metrics

**Before (estimated current state):**
- impact_scope populated: ~30% of articles
- geographic_scope populated: ~20% of articles
- industries_affected populated: ~25% of articles

**After (expected with enhancements):**
- impact_scope populated: ~95% of articles (required)
- geographic_scope populated: ~95% of articles (required field)
- industries_affected populated: ~70% of articles (prioritized)

---

**Status:** ✅ Schema updated, ready for testing with fresh generation
**Next:** Test with 2025-10-16 regeneration
