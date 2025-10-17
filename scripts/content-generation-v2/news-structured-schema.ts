/**
 * Content Generation V2 - Structured News Schema
 * 
 * Based on scripts/content-generation/schemas/publication-unified-zod.ts
 * Schema for structured output from raw news search results
 */

import { z } from 'genkit';

// Source reference schema
export const SourceSchema = z.object({
  url: z.string().describe("Source URL - full article URL"),
  title: z.string().describe("Source article title"),
  website: z.string().optional().describe("Optional: Source website name/domain (e.g., 'BleepingComputer', 'SecurityWeek')"),
  date: z.string().optional().describe("Optional: Original publication date from source in YYYY-MM-DD format if available")
});

// Event timeline schema
export const EventSchema = z.object({
  datetime: z.string().describe("The date and/or time of the event in ISO 8601 format"),
  summary: z.string().describe("A concise summary description of what happened in this event")
});

// MITRE ATT&CK technique schema
export const MITRETechniqueSchema = z.object({
  id: z.string().describe("MITRE ATT&CK technique ID (e.g., T1059.001, T1078.002)"),
  name: z.string().describe("Friendly name of the technique (e.g., 'PowerShell', 'Valid Accounts')"),
  tactic: z.string().optional().describe("Optional: Associated MITRE ATT&CK tactic if known (e.g., 'Execution', 'Privilege Escalation')")
});

// Impact scope schema
export const ImpactScopeSchema = z.object({
  geographic_scope: z.enum(['global', 'regional', 'national', 'local']).optional().describe("Optional: Overall geographic scope if mentioned"),
  countries_affected: z.array(z.string()).optional().describe("Optional: Specific countries mentioned as affected or targeted"),
  industries_affected: z.array(z.enum([
    'Healthcare', 
    'Finance', 
    'Energy', 
    'Government', 
    'Technology', 
    'Manufacturing', 
    'Retail', 
    'Education',
    'Transportation',
    'Telecommunications',
    'Critical Infrastructure',
    'Defense',
    'Legal Services',
    'Media and Entertainment',
    'Hospitality',
    'Other'
  ])).optional().describe("If applicable: Industries mentioned as affected or targeted. Select from provided options only."),
  companies_affected: z.array(z.string()).optional().describe("Optional: Specific companies or organizations mentioned as victims"),
  people_affected_estimate: z.string().optional().describe("Optional: Estimated number or range of individuals affected (e.g., '10,000+', '500-1000')"),
  governments_affected: z.array(z.string()).optional().describe("Optional: Specific government entities or agencies mentioned"),
  other_affected: z.array(z.string()).optional().describe("Optional: Any other significant affected parties")
});

// CVE vulnerability schema
export const CVESchema = z.object({
  id: z.string().describe("CVE identifier in format CVE-YYYY-NNNNN"),
  cvss_score: z.number().min(0).max(10).optional().describe("Optional: CVSS score (0-10) if available in the article"),
  cvss_version: z.string().optional().describe("Optional: CVSS version (e.g., '3.1', '2.0') if available"),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'none']).optional().describe("Optional: Severity level if mentioned in the article"),
  kev: z.boolean().optional().describe("Optional: True if mentioned as a Known Exploited Vulnerability (KEV) by CISA")
});

// Entity schema (companies, threat actors, products, etc.)
export const EntitySchema = z.object({
  name: z.string().describe("The specific name of the entity (e.g., 'Microsoft', 'APT29', 'Cobalt Strike', 'FBI')"),
  type: z.enum([
    'vendor',
    'company',
    'product',
    'malware',
    'threat_actor',
    'person',
    'government_agency',
    'security_organization',
    'technology',
    'other'
  ]).describe("The type/category of this entity")
});

// Article schema - comprehensive structured output
export const ArticleSchema = z.object({
  // Core Identity
  id: z.string().describe("Article identifier (system will replace with UUID)"),
  slug: z.string().describe("URL-friendly slug based to be SEO optimsied and constructed as the most probable title to carry forware is story continues over more days (lowercase, hyphens, no special characters)"),

  // Headlines
  headline: z.string().describe("Catchy new Article headline title - keep it concise and impactful"),
  title: z.string().describe("Article title - appropriate for news story - highlight key entities and sources"),

  // Content
  summary: z.string().describe("Article summary highlighting key points and entities. Target 150-300 words. Include who, what, when, where, and impact."),
  
  full_report: z.string().describe(`Comprehensive article with all relevant details. Markdown Format. Guidlines below. Structure the content appropriately based on article category:


For Threat/Attack articles (Ransomware, Malware, Data Breach, Cyberattack):
  - Executive Summary: High-level overview for decision makers (100-200 words)
  - Threat Overview: What happened, who's affected, attack vector (200-400 words)
  - Technical Analysis: TTPs, MITRE ATT&CK mappings, technical indicators (300-600 words)
  - Impact Assessment: Business impact, affected parties, damage scope (200-400 words)
  - IOCs: List of indicators if available (IPs, domains, hashes, file paths)
  - Detection & Response: Detection methods, monitoring, incident response (200-400 words)
  - Mitigation: Patches, configuration changes, security recommendations (200-400 words)

For Vulnerability articles (CVE disclosures, Zero-days):
  - Executive Summary: CVE overview, severity, affected products (100-200 words)
  - Vulnerability Details: Technical description, attack vector, prerequisites (200-400 words)
  - Affected Systems: Products, versions, configurations impacted (150-300 words)
  - Exploitation Status: In-the-wild exploitation, PoC availability (150-300 words)
  - Detection Methods: How to identify vulnerable systems (200-300 words)
  - Remediation Steps: Patches, workarounds, mitigation controls (200-400 words)

For Policy/Compliance/Regulatory articles:
  - Executive Summary: New regulation/policy overview (100-200 words)
  - Regulatory Details: Full requirements, scope, jurisdictions (300-500 words)
  - Affected Organizations: Who must comply, industries, size thresholds (200-300 words)
  - Compliance Requirements: Specific obligations, technical controls (300-500 words)
  - Implementation Timeline: Deadlines, phases, milestones (150-250 words)
  - Enforcement & Penalties: Non-compliance consequences, enforcement actions (200-300 words)
  - Compliance Guidance: Steps to achieve compliance, best practices (200-400 words)

For Security Operations/Incident Response articles:
  - Executive Summary: Incident/operation overview (100-200 words)
  - Incident Timeline: Chronological events, key milestones (200-400 words)
  - Response Actions: What was done, by whom, when (300-500 words)
  - Technical Findings: Root cause, attack methods, scope (300-500 words)
  - Lessons Learned: Key takeaways, gaps identified (200-300 words)
  - Recommendations: Process improvements, tool enhancements (200-400 words)

For Critical Patches/Security Updates articles:
  - Executive Summary: Patch overview, urgency level (100-200 words)
  - Vulnerabilities Addressed: CVEs fixed, severity ratings (200-400 words)
  - Affected Products: Software, versions, platforms (150-300 words)
  - Patch Details: What's fixed, known issues, dependencies (200-400 words)
  - Deployment Priority: Risk-based prioritization guidance (150-250 words)
  - Installation Instructions: How to apply, testing recommendations (200-300 words)

Target total length: 1000-2500 words depending on article complexity and category.

MARKDOWN FORMATTING REQUIREMENTS:
- Use ## for section headers (Executive Summary, Threat Overview, etc.)
- Use ### for subsections
- Use **bold** for emphasis on critical terms (e.g., **CVE-2025-12345**, **critical vulnerability**)
- Use bullet lists (- item) for IOCs, affected products, recommendations
- Use numbered lists (1. step) for attack chains, mitigation steps, detection procedures
- Use inline code (\`backticks\`) for: technical terms, file paths, commands, registry keys, IP addresses, domains
- Use code blocks (\`\`\`language ... \`\`\`) for: exploit code, YARA rules, detection rules, configuration snippets
- Use > blockquotes for important warnings or quotes from researchers
- Use horizontal rules (---) to separate major sections
- Use tables (| header |) for: CVSS breakdowns, affected version matrices, comparison tables`),

  // Social Media
  // Social Media
  // TODO: Convert to array for Step 2.5 (generate-twitter-posts.ts)
  // Future: twitter_posts: z.array(z.string()).max(7)
  twitter_post: z.string().describe(`Generate Twitter thread content for this article (will be split into 2-7 tweets in Step 2.5).
    
    FUTURE ARCHITECTURE (Step 2.5 - Dedicated Twitter Generation Script):
    This will become an ARRAY of 2-7 individual tweets, each standing alone but part of a coherent thread.
    Script will prepend "🚨 BREAKING: " or "📢 UPDATE: " automatically based on article.isUpdate field.
    
    CURRENT TEMPORARY FORMAT (Single String - Simple):
    - Maximum 228 characters (reserves 15 chars for "🚨 BREAKING: " or "📢 UPDATE: " prefix)
    - Include 1-3 emojis (⚠️, ✅, 🔥, 🏭, etc.)
    - Include 2-3 hashtags focusing on NEW terms not in tweet text
    - Write in urgent, newsworthy style
    - Front-load key information
    - Target 215-228 chars
    
    FUTURE MULTI-TWEET REQUIREMENTS (When converted to array in Step 2.5):
    
    Structure:
    - Generate 2-7 tweets per article (based on story complexity)
    - Each tweet is 200-270 chars (leaves room for position markers if needed)
    - Each tweet must STAND ALONE (complete thought, actionable, searchable)
    - Thread tells coherent story but each tweet is independently valuable
    
    Hashtag Strategy (2-4 hashtags per tweet):
    - NEVER hashtag words already in the tweet text
    - Prioritize searchable terms: CVE IDs, product names, threat actor aliases, affected companies
    - Distribute hashtags across tweets (don't repeat same hashtags in every tweet)
    - Tweet 1: Primary entities (#CVE202512345, #Windows, #CISA)
    - Tweet 2: Technical/impact (#Healthcare, #Finance, #RCE)
    - Tweet 3+: Action/related (#PatchNow, #ThreatIntel, specific vendor names)
    
    Content Distribution Pattern:
    - Tweet 1: Hook + Core news (who, what, when) + 2-3 specific hashtags
    - Tweet 2: Technical details (how, CVEs, attack vectors) + 2-3 technical hashtags
    - Tweet 3: Impact (affected industries, severity, scale) + 2-3 impact hashtags
    - Tweet 4+: Mitigation/IOCs/details + 2-3 action hashtags
    - Final tweet: Link to full article (if not already included)
    
    Examples of GOOD standalone tweets in a thread:
    
    Thread about Microsoft Zero-Days:
    1. "Microsoft patches 4 actively exploited zero-days in October update! Privilege escalation & Secure Boot bypass found in wild. All Windows versions affected. #CVE202512345 #Windows"
    2. "Attackers chaining these flaws for SYSTEM-level access. No user interaction needed. CISA added to KEV catalog - federal agencies ordered to patch. #CISA #KEV"
    3. "Healthcare & finance sectors heavily targeted. 170+ total flaws fixed in Patch Tuesday. Critical updates available via Windows Update. #Healthcare #Finance"
    
    Thread about Ransomware Campaign:
    1. "Qilin ransomware hits 15+ organizations across US, France & Africa. Insurance, healthcare, and government sectors under siege. #Qilin #Ransomware"
    2. "Double extortion tactics: data encrypted + leaked on dark web. Leak site updated daily with new victims. Group using RaaS model. #DataBreach #DarkWeb"
    3. "Check for Cobalt Strike beacons, lateral movement via RDP. Known to abuse ProxyShell vulnerabilities for initial access. #CobaltStrike #ProxyShell"
    
    Key Principles:
    - Each tweet is quotable and shareable on its own
    - Hashtags add NEW search terms not in tweet text
    - Progressive detail: Hook → Technical → Impact → Action
    - Max 7 tweets (keep threads scannable)
    - Vary hashtags across tweets (maximize discovery)
    - Front-load most important info in each tweet
    
    CHARACTER COUNT: Target 215-228 chars per tweet to leave room for formatting.
  
    twitter:card        = "summary_large_image". ?? chars
    twitter:title       = "Article Headline"
    twitter:description = "Tweet text (first 200 chars)..."
    twitter:image       = "https://cyber.netsecops.io/images/og-image/slug.png"
    twitter:image:alt   = "Article Headline"
    og:url              = "https://cyber.netsecops.io/articles/slug"
    og:type             = "article"

    `),

  // SEO
  meta_description: z.string().describe("SEO meta description for this article"),

  // Classification
  category: z.array(z.enum([
    'Ransomware',
    'Malware',
    'Threat Actor',
    'Vulnerability',
    'Data Breach',
    'Phishing',
    'Supply Chain Attack',
    'Cyberattack',
    'Industrial Control Systems',
    'Cloud Security',
    'Mobile Security',
    'IoT Security',
    'Patch Management',
    'Threat Intelligence',
    'Incident Response',
    'Security Operations',
    'Policy and Compliance',
    'Regulatory',
    'Other'
  ])).min(1).max(3).describe("Select 1-3 categories that best describe this article. IMPORTANT: List the MOST PROMINENT/PRIMARY category FIRST, followed by secondary categories. The first category will be used for visual representations and primary classification."),

  severity: z.enum(['critical', 'high', 'medium', 'low', 'informational']).describe(`
    Determine severity based on impact and urgency:
    - CRITICAL: Zero-day exploits, active widespread attacks on critical infrastructure
    - HIGH: Ransomware campaigns, significant data breaches, active exploitation
    - MEDIUM: New malware discoveries, phishing campaigns, vulnerabilities with patches
    - LOW: Vulnerability disclosures with patches, minor incidents
    - INFORMATIONAL: Security research, best practices, general updates
  `),

  // Structured data arrays
  entities: z.array(EntitySchema).describe("Structured list of specific named entities mentioned in the article. Include companies, threat actors, malware, products, vendors, government agencies, and persons. Do NOT include CVE identifiers."),
  cves: z.array(CVESchema).describe("CVE details if mentioned in the article including score if available"),
  sources: z.array(SourceSchema).describe("List of source references"),

  // Events and MITRE
  events: z.array(EventSchema).describe("Chronological events if mentioned in the article"),
  mitre_techniques: z.array(MITRETechniqueSchema).describe("MITRE ATT&CK techniques if identifiable. Include 3-8 most relevant techniques"),

  // Impact and Tags
  impact_scope: ImpactScopeSchema.optional().describe("Optional: Comprehensive structured data about scope and scale of impact if available"),
  tags: z.array(z.string()).describe("List of cybersecurity-related terms. Do NOT include entity names."),

  // Schema.org & SEO
  article_type: z.enum(['NewsArticle', 'TechArticle', 'Report', 'Analysis', 'Advisory']).default('NewsArticle').describe("Schema.org article type. Default to 'NewsArticle' if not specified."),
  keywords: z.array(z.string()).optional().describe("Optional: Generate 5-10 SEO keywords if time permits"),
  reading_time_minutes: z.number().optional().describe("Optional: Estimated reading time based on full_report length (assume 200 words/min)"),

  // Metadata
  pub_date: z.string().optional().describe("Optional: The original publication date from the source article in YYYY-MM-DD format if explicitly mentioned")
});

// Publication schema - collection of articles
export const CyberAdvisorySchema = z.object({
  pub_id: z.string().describe("Publication identifier (system will replace with UUID)"),
  headline: z.string().describe("Catchy breaking news headline of most prominent articles"),
  summary: z.string().describe("Overall summary of the cybersecurity situation - reference the timeframe covered"),


  total_articles: z.number().describe("Total number of articles in this publication"),

  articles: z.array(ArticleSchema).describe("List of articles included in this advisory"),

  generated_at: z.string().describe("Timestamp when this publication was generated in ISO 8601 format"),

  date_range: z.string().describe("Date range covered by this publication (e.g., '2024-10-13')")
});

// TypeScript types
export type SourceType = z.infer<typeof SourceSchema>;
export type EventType = z.infer<typeof EventSchema>;
export type MITRETechniqueType = z.infer<typeof MITRETechniqueSchema>;
export type ImpactScopeType = z.infer<typeof ImpactScopeSchema>;
export type CVEType = z.infer<typeof CVESchema>;
export type EntityType = z.infer<typeof EntitySchema>;
export type ArticleType = z.infer<typeof ArticleSchema>;
export type CyberAdvisoryType = z.infer<typeof CyberAdvisorySchema>;
