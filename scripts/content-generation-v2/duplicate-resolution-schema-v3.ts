/**
 * Content Generation V2 - Duplicate Resolution Schema
 * 
 * Step 5: LLM-based duplicate resolution for BORDERLINE cases
 * Uses Gemini 2.5 Flash with structured output to compare full_report texts
 * and decide whether to publish as NEW, UPDATE existing, or SKIP
 */

import { z } from 'genkit';

/**
 * Decision schema for duplicate resolution
 * 
 * NEW: Article brings significant new information worth a separate publication
 * UPDATE: Article updates existing story - keep same ID/slug, add update entry
 * SKIP: Article provides no new information - exclude from publication
 */
export const DuplicateResolutionSchema = z.object({
  decision: z.enum(['NEW', 'UPDATE', 'SKIP']).describe(`
    Classification decision:
    - NEW: This article provides significant new information, different angle, or distinct narrative that warrants a separate article
    - UPDATE: This article updates the existing story with new details, developments, or context - should be added as an update to the original article
    - SKIP: This article provides no meaningful new information beyond what's already covered - should be excluded from publication
  `),
  
  confidence: z.enum(['high', 'medium', 'low']).describe(`
    Confidence level in this decision:
    - high: Clear distinction between articles (>80% certain)
    - medium: Noticeable differences but some overlap (50-80% certain)
    - low: Close call, human review recommended (<50% certain)
  `),
  
  reasoning: z.string().describe(`
    Detailed explanation for this decision. Include:
    - Key similarities and differences between the articles
    - What new information (if any) the candidate article brings
    - Why this justifies the chosen classification
    - Specific examples from the text (CVEs, entities, technical details)
    Target: 2-4 sentences
  `),
  
  new_information: z.array(z.string()).optional().describe(`
    For NEW or UPDATE decisions: List specific new information the candidate article provides.
    Examples: "New CVE-2025-12345 disclosed", "Additional affected vendors: Acme Corp", "Root cause identified as memory corruption", "Patch released on Oct 10"
    Include 2-5 specific items. Leave empty for SKIP decisions.
  `),
  
  overlap_summary: z.string().optional().describe(`
    Brief summary of what information overlaps between the two articles.
    Focus on: shared CVEs, entities, technical details, timeline.
    Target: 1-2 sentences. Required for UPDATE and SKIP, optional for NEW.
  `)
});

/**
 * Batch resolution schema - for processing multiple articles at once
 */
export const BatchResolutionSchema = z.object({
  resolutions: z.array(z.object({
    candidate_article_id: z.string().describe("The UUID of the candidate article being evaluated"),
    original_article_id: z.string().describe("The UUID of the existing article it was compared against"),
    resolution: DuplicateResolutionSchema.describe("The resolution decision for this article pair")
  }))
});

// TypeScript types
export type DuplicateResolution = z.infer<typeof DuplicateResolutionSchema>;
export type BatchResolution = z.infer<typeof BatchResolutionSchema>;

/**
 * Update object schema - for SKIP-UPDATE decisions
 * This structure gets appended to articles.updates JSON array
 */
export const UpdateObjectSchema = z.object({
  severity_change: z.enum(['increased', 'decreased', 'unchanged', 'unknown']).describe(`
    How this update affects the severity/impact of the original incident.
    - increased: New victims, additional CVEs, escalated threat level
    - decreased: Patch released, threat mitigated, limited impact
    - unchanged: Additional details but same overall severity
    - unknown: Cannot determine or not applicable
    **CRITICAL: This field MUST have a value for UPDATE decisions.**
    Use "unknown" if you cannot determine the severity change.
  `),
  
  datetime: z.string().describe(`
    ISO 8601 datetime of this update (e.g., "2025-10-14T12:00:00Z").
    **CRITICAL: This field MUST have a value for UPDATE decisions.**
    Use best estimate if exact time unknown.
  `),
  
  summary: z.string().describe(`
    Brief 50-150 character summary of what changed.
    Examples: "New victims identified", "Patch released", "Additional CVEs disclosed"
    **CRITICAL: This field MUST have a value for UPDATE decisions.**
    Write "Additional details provided" if unsure.
  `),
  
  content: z.string().describe(`
    Detailed 200-800 character description of the new information.
    Write as standalone update that makes sense without re-reading full article.
    Focus on: what's new, what changed, technical details, impact.
    **CRITICAL: This field MUST have a value for UPDATE decisions.**
  `),
  
  sources: z.array(z.object({
    url: z.string().describe("**CRITICAL: you must provided this if decision is UPDTE.  Source URL from the NEW article. Extract actual URL from article sources. Use 'unknown' if unavailable.").optional(),
    title: z.string().describe("**CRITICAL: you must provided this if decision is UPDTE. Source title/headline from the NEW article. Extract actual title from article sources. Use 'Source not available' if unavailable.").optional()
  })).describe(`
    **CRITICAL: you must provided this if decision is UPDTE. Sources from the NEW article which is asscocited with the NEW.
  `)
}).optional()

export type UpdateObject = z.infer<typeof UpdateObjectSchema>;

/**
 * Complete duplicate resolution with optional update
 * Used for FTS5 borderline cases (-81 to -120 BM25 score)
 */
export const DuplicateResolutionWithUpdateSchema = z.object({
  decision: z.enum(['NEW', 'SKIP', 'UPDATE']).describe(`
    Classification decision (will be mapped to resolution values):
    - NEW: Completely different incident/story - publish as separate article
    - SKIP: Same incident with no new information - exclude from publication
    - UPDATE: Same incident with new developments - merge into existing article
    
    **CRITICAL: If you choose UPDATE, you MUST provide ALL fields in the update object:**
    datetime, summary, content, sources (array with at least 1 entry), and severity_change
  `),
  
  reasoning: z.string().describe(`
    Brief explanation (1-2 sentences) for this decision.
    Focus on: key differences or similarities, what makes this NEW/SKIP/UPDATE.
  `),
  
  update: UpdateObjectSchema.describe(`
    ****CRITICAL:  You MUST provide this object if decision is UPDATE.**
    Contains the update information to append to the original article.
    Leave undefined for NEW or SKIP decisions.
  `)
});

export type DuplicateResolutionWithUpdate = z.infer<typeof DuplicateResolutionWithUpdateSchema>;

/**
 * Legacy schema - kept for backwards compatibility
 */
export const ArticleUpdateSchema = z.object({
  update_date: z.string().describe("Date of this update in YYYY-MM-DD format"),
  update_headline: z.string().describe("Brief headline describing what's new in this update"),
  update_summary: z.string().describe("Summary of new information (100-200 words)"),
  sources: z.array(z.object({
    url: z.string(),
    title: z.string(),
    website: z.string().optional(),
    date: z.string().optional()
  })).describe("Source references for this update")
});

export type ArticleUpdate = z.infer<typeof ArticleUpdateSchema>;

/**
 * Publication regeneration schema - for rewriting publication metadata when articles are skipped
 */
export const PublicationMetadataSchema = z.object({
  headline: z.string().describe("New catchy publication headline covering all remaining articles"),
  summary: z.string().describe("New publication summary covering all remaining articles (200-300 words)"),
  slug: z.string().optional().describe("Optional: New URL slug if headline changed significantly")
});

export type PublicationMetadata = z.infer<typeof PublicationMetadataSchema>;
