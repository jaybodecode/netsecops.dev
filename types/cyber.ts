// Firebase Types for Cybersecurity Advisory Platform
// Combines SEO best practices with cybersecurity-specific metadata

// ===== Schema Constraints (Legacy - Deprecated) =====
// NOTE: These are no longer actively used with the current data structure
// Kept for backward compatibility only

export const SCHEMA_CONSTRAINTS = {
  // Legacy constraints - use actual data structure validation instead
  deprecated: true,
} as const;

// ===== Content Formats =====

export interface MarkdownContent {
  format: 'markdown'
  markdown: string
}

export interface JSONContent {
  format: 'json'
  json: ContentBlock[]
}

export interface HTMLContent {
  format: 'html'
  html: string
}

export type PostContent = MarkdownContent | JSONContent | HTMLContent

export interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'image' | 'code' | 'quote' | 'list' | 'table' | 'alert' | 'cve' | 'timeline' | 'divider'
  
  // Heading
  level?: 1 | 2 | 3 | 4 | 5 | 6
  text?: string
  
  // Paragraph
  content?: string                    // Markdown-style inline formatting
  
  // Image
  src?: string
  alt?: string
  caption?: string
  width?: number
  height?: number
  
  // Code block
  language?: string
  code?: string
  
  // Quote
  quote?: string
  cite?: string
  author?: string
  
  // List
  items?: string[]
  ordered?: boolean
  
  // Table
  headers?: string[]
  rows?: string[][]
  
  // Alert (for important security notices)
  alertType?: 'info' | 'warning' | 'danger' | 'success' | 'critical'
  alertTitle?: string
  alertContent?: string
  
  // CVE Block (cybersecurity-specific)
  cveId?: string
  cvss?: number
  severity?: 'critical' | 'high' | 'medium' | 'low'
  affectedProducts?: string[]
  description?: string
  
  // Timeline Block (for security events)
  timeline?: Array<{
    date: string
    time?: string
    event: string
    location?: string
  }>
  
  // Styling
  className?: string
  styles?: Record<string, string>
}

// ===== SEO & Social Media =====

export interface SEOMetadata {
  // Basic SEO
  /**
   * SEO title optimized for search engines
   * @minLength 40
   * @maxLength 60
   * @ideal 55
   */
  title: string
  
  /**
   * Meta description for search results
   * @minLength 120
   * @maxLength 160
   * @ideal 155
   */
  description: string
  
  /**
   * SEO keywords (3-10 keywords recommended)
   * @minItems 3
   * @maxItems 10
   * @ideal 5
   */
  keywords: string[]
  
  canonicalUrl?: string              // Canonical URL override
  robots?: string                    // Default: "index, follow"
  
  // Open Graph (Facebook, LinkedIn, etc.)
  ogType: 'article' | 'website'
  
  /**
   * Open Graph title
   * @minLength 40
   * @maxLength 90
   * @ideal 70
   */
  ogTitle: string
  
  /**
   * Open Graph description
   * @minLength 120
   * @maxLength 200
   * @ideal 160
   */
  ogDescription: string
  
  ogImage: string                    // URL to OG image (1200x630px)
  ogImageAlt?: string
  ogUrl: string
  ogSiteName: string
  
  // Twitter Card
  twitterCard: 'summary' | 'summary_large_image'
  
  /**
   * Twitter card title
   * @minLength 40
   * @maxLength 70
   * @ideal 60
   */
  twitterTitle: string
  
  /**
   * Twitter card description
   * @minLength 120
   * @maxLength 200
   * @ideal 160
   */
  twitterDescription: string
  twitterImage: string               // URL to Twitter image (1200x628px)
  twitterImageAlt?: string
  twitterSite?: string               // @handle for site
  twitterCreator?: string            // @handle for author
  
  // Article-specific metadata
  article?: {
    publishedTime: string            // ISO 8601 timestamp
    modifiedTime?: string            // ISO 8601 timestamp
    author: string | string[]
    section: string                  // Category/section
    tags: string[]
  }
  
  // Schema.org structured data
  schema: {
    headline: string
    alternativeHeadline?: string
    image: string | string[]
    datePublished: string            // ISO 8601
    dateModified?: string            // ISO 8601
    author: {
      '@type'?: 'Person' | 'Organization'
      name: string
      url?: string
      image?: string
    }
    publisher?: {
      '@type'?: 'Organization'
      name: string
      logo: string
      url?: string
    }
    wordCount?: number
    timeRequired?: string            // ISO 8601 duration (e.g., "PT5M")
    inLanguage?: string              // e.g., "en-US"
    keywords?: string[]
  }
}

// ===== Social Media Content =====

export interface SocialMediaContent {
  // Twitter/X
  twitter: {
    /**
     * Twitter-style post (max 233 chars to leave room for link)
     * Can replace words with emojis as long as still readable
     * 
     * Structure:
     * - Post text with inline @mentions
     * - Hashtags at end of post
     * 
     * Hashtags: 2-3 hashtags based on article, likely to be searched for on Twitter
     * Mentions: Official company accounts, vendors, major orgs (not bad actors or malware)
     *           Limit to top 2-5 mentions, can be inline
     * 
     * @minLength 100
     * @maxLength 233
     * @ideal 200
     * @example "🚨 GAGAKICK ransomware targets @healthcare systems. @FBI & @CISAgov warn of critical threats. #Ransomware #CyberSecurity #Healthcare"
     */
    post: string
    
    /**
     * Twitter hashtags (2-3 top hashtags)
     * @minItems 2
     * @maxItems 3
     * @ideal 3
     */
    hashtags: string[]
    
    /**
     * Twitter @mentions (2-5 max, official accounts only)
     * @minItems 0
     * @maxItems 5
     * @ideal 3
     */
    mentions: string[]
  }
  
  // LinkedIn
  linkedin: {
    /**
     * LinkedIn post (150-250 chars, max 250)
     * Professional tone with industry context
     * 
     * Structure:
     * - Post text with inline @mentions
     * - Hashtags at end of post
     * 
     * Hashtags: 2-3 top hashtags likely to be searched on LinkedIn
     * Mentions: Official company accounts, vendors, major orgs (not bad actors)
     *           Limit to top 2-5 mentions, can be inline
     * 
     * @minLength 150
     * @maxLength 250
     * @ideal 200
     * @example "Healthcare organizations face new GAGAKICK ransomware threats. FBI and CISA recommend immediate action. #Cybersecurity #Healthcare #ThreatIntel"
     */
    post: string
    
    /**
     * LinkedIn hashtags (2-3 top hashtags)
     * @minItems 2
     * @maxItems 3
     * @ideal 3
     */
    hashtags: string[]
    
    /**
     * LinkedIn @mentions (2-5 max, official accounts only)
     * @minItems 0
     * @maxItems 5
     * @ideal 3
     */
    mentions: string[]
  }
  
  // Facebook (optional)
  facebook?: {
    /**
     * Facebook post text
     * @minLength 100
     * @maxLength 300
     * @ideal 200
     */
    post: string
    hashtags?: string[]
  }
}

// ===== Display Data =====

// Article categories - aligned with LLM schema (news-structured-schema.ts)
export type ArticleCategory = 
  | 'Ransomware'
  | 'Malware'
  | 'Threat Actor'
  | 'Vulnerability'
  | 'Data Breach'
  | 'Phishing'
  | 'Supply Chain Attack'
  | 'Cyberattack'
  | 'Industrial Control Systems'
  | 'Cloud Security'
  | 'Mobile Security'
  | 'IoT Security'
  | 'Patch Management'
  | 'Threat Intelligence'
  | 'Incident Response'
  | 'Security Operations'
  | 'Policy and Compliance'
  | 'Regulatory'
  | 'Other';

export interface DisplayMetadata {
  /**
   * Display title for UI
   * @minLength 30
   * @maxLength 120
   * @ideal 80
   */
  title: string
  
  /**
   * Optional subtitle
   * @minLength 30
   * @maxLength 200
   * @ideal 150
   */
  subtitle?: string
  
  /**
   * Short summary for cards and previews
   * @minLength 100
   * @maxLength 200
   * @ideal 160
   */
  excerpt: string
  
  featuredImage?: string             // Hero image URL
  featuredImageAlt?: string
  featuredImageCaption?: string
  
  /**
   * Article categories (1-3 categories maximum)
   * Must match ArticleCategory enum values
   * @minItems 1
   * @maxItems 3
   * @ideal 2
   */
  categories: [ArticleCategory] | [ArticleCategory, ArticleCategory] | [ArticleCategory, ArticleCategory, ArticleCategory]
  
  /**
   * Tags for filtering and search
   * @minItems 3
   * @maxItems 15
   * @ideal 8
   */
  tags?: string[]
  
  readingTime?: number               // Minutes (auto-calculated if not set)
}

// ===== Author =====

/**
 * Author information for article bylines and attribution
 * Used to establish trust signals and provide author credentials
 */
export interface Author {
  id: string                         // Unique author identifier (e.g., "cybernetsec-team")
  name: string                       // Full name
  email?: string                     // Contact email
  avatar?: string                    // Avatar URL or path
  bio?: string                       // Short biography (2-4 sentences about expertise and background)
  role?: string                      // Job title or role (e.g., "Security Analyst", "Threat Intelligence Researcher")
  expertise?: string[]               // Areas of expertise (e.g., ["Malware Analysis", "Incident Response"])
  social?: {
    twitter?: string                 // Twitter @handle
    linkedin?: string                // LinkedIn profile URL
    github?: string                  // GitHub username
    website?: string                 // Personal or professional website
  }
}

// ===== Source Reference =====

export interface SourceReference {
  sourceId: string                   // URL-encoded hash for key
  url: string                        // Full source URL
  title: string                      // Source title
  rootUrl: string                    // Root domain
  sourceDate?: string                // ISO 8601 or MM/DD/YYYY
  order?: number                     // Display order in article
}

export interface CyberSource {
  // Core Identity
  sourceId: string                   // URL-encoded hash
  siteId: string
  
  // Source Info
  url: string
  rootUrl: string
  title: string
  sourceDate?: string                // ISO 8601 or MM/DD/YYYY
  author?: string
  publisher?: string
  
  // Credibility
  credibility?: {
    score?: number                   // 0-10
    verified?: boolean
    reputation?: 'high' | 'medium' | 'low'
  }
  
  // Usage tracking
  usageCount?: number
  lastUsed?: Date
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// ===== Cybersecurity Metadata =====

export interface CybersecurityMetadata {
  /**
   * Entities mentioned (companies, vendors, products, CVEs)
   * @minItems 1
   * @maxItems 50
   * @ideal 10
   */
  entities: string[]
  
  /**
   * Cybersecurity tags (ransomware, phishing, MITRE tactics)
   * @minItems 3
   * @maxItems 30
   * @ideal 12
   */
  tags: string[]
  
  /**
   * Events timeline (1-20 events recommended)
   * @minItems 1
   * @maxItems 20
   * @ideal 5
   */
  events: Array<{
    /**
     * Event description
     * @minLength 20
     * @maxLength 300
     * @ideal 150
     */
    description: string
    date?: string                    // ISO 8601 or specific date mentioned
    time?: string                    // Specific time if mentioned
    location?: string                // Location if mentioned
  }>
  
  // Threat intelligence
  threats?: {
    cves?: string[]                  // CVE IDs (e.g., CVE-2025-12345)
    malware?: string[]               // Malware families
    tactics?: string[]               // MITRE ATT&CK tactics
    techniques?: string[]            // MITRE ATT&CK techniques
    threatActors?: string[]          // APT groups (if publicly disclosed)
  }
  
  // Severity assessment
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'informational'
  impactScore?: number               // 0-10
  cvss?: number                      // CVSS score if applicable
}

// ===== Multimedia =====

export interface MultimediaContent {
  // Featured/Hero Image
  featuredImage?: string
  featuredImageAlt?: string
  featuredImagePrompt?: string       // AI generation prompt
  
  // Additional Images
  images?: Array<{
    url: string
    alt: string
    caption?: string
    prompt?: string                  // AI generation prompt
    width?: number
    height?: number
  }>
  
  // Generated HTML (for static site)
  htmlFilePath?: string              // Path to generated HTML file
  
  // Videos (optional - for future)
  videos?: Array<{
    url: string
    type: 'twitter' | 'youtube' | 'local'
    thumbnail?: string
    duration?: number                // Seconds
    prompt?: string                  // AI generation prompt
  }>
  
  // Twitter-specific video
  twitterVideo?: string              // Path to Twitter video file
  
  // Video generation
  videoList?: string[]               // List of video paths used for article
  videoPrompt?: string               // Prompt for video generation
  videoFile?: string                 // Path to generated video file
  
  // Audio (optional - for future TTS)
  audio?: {
    ttsText?: string                 // Text for TTS generation
    audioFile?: string               // Path to audio file
    duration?: number                // Seconds
    voice?: string                   // Voice ID/name used
  }
}

// ===== Analytics =====

export interface ContentAnalytics {
  views?: number
  uniqueViews?: number
  shares?: number
  likes?: number
  comments?: number
  lastViewedAt?: Date
  popularityScore?: number           // Computed score for trending
}

// ===== MAIN INTERFACES =====

// ===== 1. Article (Individual Cybersecurity Article) =====

/**
 * Entity mentioned in an article (companies, vendors, products, threat actors, etc.)
 */
export interface ArticleEntity {
  name: string
  type: 'vendor' | 'threat_actor' | 'technology' | 'product' | 'government_agency' | 'company' | 'malware' | 'tool' | 'security_organization' | 'other'
  url?: string  // Optional URL reference for the entity (e.g., MITRE ATT&CK link, company website)
}

/**
 * Timeline event within an article
 */
export interface ArticleEvent {
  datetime: string  // ISO 8601 format
  summary: string
}

/**
 * Source reference for an article
 */
export interface ArticleSource {
  url: string                        // Full source URL
  title: string                      // Article title from source
  friendly_name?: string             // Friendly brand name (e.g., "Unit 42", "The Hacker News")
  website?: string                   // Source domain (e.g., "bleepingcomputer.com") - for backward compatibility
  date?: string                      // Publication date in ISO format (YYYY-MM-DD)
  source_date?: string               // Legacy field - Format: MM/DD/YYYY (for backward compatibility)
  source_id?: string                 // Optional source ID
  root_url?: string                  // Optional root URL (for backward compatibility)
}

/**
 * CVE details (rich object)
 */
export interface CyberCVE {
  id: string
  description?: string
  cvss_score?: number
  cvss_version?: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
  kev?: boolean
}

/**
 * Article update entry
 * Tracks changes/updates made to an existing article
 * Each update is a self-contained news story with its own timeline events
 * 
 * UI Rendering:
 * - Original article has its own timeline (article.events)
 * - Updates section renders separately below original timeline
 * - Each update shows: title, summary, update_date, events, sources
 * - Multiple updates stack chronologically
 */
export interface ArticleUpdate {
  update_id: string                  // Unique ID for this update (e.g., "upd_abc123")
  update_date: string                // ISO 8601 timestamp of when this update was published/discovered
  datetime?: string                  // Alternative timestamp field (for backward compatibility)
  title: string                      // Headline for this update (e.g., "Oracle Releases Emergency Patch")
  summary: string                    // What changed/was added in this update (detailed summary)
  content?: string                   // Detailed update content (markdown format)
  
  // Timeline events specific to this update only
  // Kept separate from main article.events array
  // UI will render in "Updates" section, not mixed with original timeline
  events?: ArticleEvent[]            // Timeline events for this specific update
  
  // New threat intelligence discovered in this update
  new_entities?: ArticleEntity[]     // New entities mentioned in this update
  new_cves?: (string | CyberCVE)[]   // New CVEs added in this update (can be IDs or objects)
  
  // Attribution
  sources: ArticleSource[]           // Sources for this specific update (required)
  
  // Severity change indicator
  severity_change?: 'increased' | 'decreased' | 'unchanged'
  
  // Optional: categorization for this update
  update_type?: 'patch' | 'advisory' | 'incident' | 'analysis' | 'threat_intel' | 'other'
}

/**
 * Impact scope - geographic and industry impact data
 */
export interface ImpactScope {
  geographic_scope?: 'global' | 'regional' | 'national' | 'local'
  countries_affected?: string[]
  industries_affected?: string[]
  companies_affected?: string[]
  people_affected_estimate?: string
  governments_affected?: string[]
  other_affected?: string[]
}

/**
 * Individual cybersecurity article
 * Based on actual JSON structure found in /public/data/articles/
 */
export interface CyberArticle {
  // Core Identity
  id: string
  slug: string
  
  // Headlines & Titles
  headline: string                   // Short, punchy headline for cards/social
  title: string                      // Full descriptive article title
  subtitle?: string                  // Optional subtitle
  
  // Content & Summaries
  summary: string                    // Detailed summary (plain text)
  full_report?: string               // Complete analysis (text format)
  
  // Social Media Posts (ready-to-publish)
  twitter_post: string
  linkedin_post?: string             // LinkedIn-specific post
  
  // SEO & Meta
  meta_description: string
  keywords?: string[]                // SEO keywords
  
  // Open Graph / Social Media
  og_title?: string                  // Open Graph title
  og_description?: string            // Open Graph description
  og_image?: string                  // Open Graph image URL
  twitter_card_type?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitter_image?: string             // Twitter card image URL
  
  // Images
  featured_image_url?: string        // Featured/hero image URL
  featured_image_alt?: string        // Alt text for featured image
  
  // Categorization & Tags
  category: ArticleCategory[]        // Array of categories
  tags: string[]                     // General tags
  
  // Threat Classification
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'informational'
  threat_type?: string               // Type of threat
  confidence?: 'confirmed' | 'likely' | 'suspected'  // Attribution confidence
  
  // Cybersecurity-Specific Data
  events: ArticleEvent[]             // Timeline of events
  cves: (string | CyberCVE)[]        // CVE IDs or CVE objects with details
  entities: ArticleEntity[]          // Mentioned entities
  mitre_techniques?: Array<{         // MITRE ATT&CK techniques
    id: string
    name: string
    tactic: string
  }>
  mitre_mitigations?: MITREMitigation[]  // MITRE ATT&CK mitigations (NEW)
  d3fend_countermeasures?: D3FENDCountermeasure[]  // D3FEND defensive countermeasures (NEW)
  // Sources & References
  sources: ArticleSource[]
  
  // Industry & Geographic Scope
  impact_scope?: ImpactScope         // Optional impact scope data
  
  // Author & Byline
  author?: Author                    // Article author information for byline
  
  // Metadata
  article_type: 'NewsArticle' | 'TechArticle' | 'Report' | 'Analysis' | 'Advisory' | 'Unknown'
  reading_time_minutes: number
  extract_datetime: string           // ISO 8601 timestamp - content extraction time
  pub_date?: string                  // Publication date (YYYY-MM-DD format)
  
  // Timestamps (for compatibility)
  createdAt?: string                 // Creation timestamp
  updatedAt?: string                 // Last update timestamp
  
  // Update History
  updates?: ArticleUpdate[]          // Array of updates made to this article
  
  // === Fields to be Populated Later (NOT by LLM) ===
  // publication_date?: string        // When this advisory should be published (ISO format) - will be filled in later
  // deprecated?: boolean             // Mark as deprecated (default false)
}

// ===== 2. Publication (Daily/Weekly Digest) =====

/**
 * Publication metadata for listings (simplified)
 * Based on actual JSON structure found in publications-index.json
 */
export interface PublicationMetadata {
  id: string
  slug?: string                      // URL-friendly slug (optional)
  title: string
  headline?: string                  // Optional headline
  publishedAt: string                // ISO 8601 timestamp or YYYY-MM-DD (legacy field)
  pub_date?: string                  // Publication date (YYYY-MM-DD) - preferred field
  type: 'daily' | 'weekly' | 'monthly' | 'special-report'
  articleCount: number
  summary: string                    // Summary/excerpt text
  excerpt?: string                   // Alias for summary
  tags?: string[]                    // Optional tags
  categories: string[]               // Array of category strings
  author?: {                         // Optional author info
    name: string
    role?: string
  }
  readingTime?: number               // Optional reading time
  severityBreakdown?: {              // Severity counts for articles
    critical: number
    high: number
    medium: number
    low: number
    informational: number
  }
  statusCounts?: {                   // Article status counts
    new: number
    updated: number
  }
}

/**
 * MITRE ATT&CK technique reference
 * Based on MITRETechniqueSchema from publication-unified-zod.ts
 */
export interface MITRETechnique {
  id: string                         // MITRE ATT&CK technique ID (e.g., T1059.001)
  name: string                       // Friendly name (e.g., 'PowerShell')
  tactic?: string                    // Associated MITRE tactic (e.g., 'Execution')
}

/**
 * D3FEND Technique (used within MITRE Mitigation)
 */
export interface D3FENDTechnique {
  id: string                         // D3FEND Technique ID (e.g., D3-MFA, D3-NTA)
  name: string                       // D3FEND Technique name (e.g., 'Multi-factor Authentication')
  url: string                        // D3FEND URL
}

/**
 * MITRE ATT&CK Mitigation
 */
export interface MITREMitigation {
  id: string                         // MITRE Mitigation ID (e.g., M1047, M1032)
  name: string                       // Mitigation name (e.g., 'Audit', 'Multi-factor Authentication')
  domain?: 'enterprise' | 'ics' | 'mobile'  // MITRE domain
  description?: string               // Optional description of how mitigation applies
  d3fend_techniques?: D3FENDTechnique[]  // Optional mapped D3FEND techniques
}

/**
 * D3FEND Countermeasure - Defensive technique with detailed recommendation
 */
export interface D3FENDCountermeasure {
  technique_id: string               // D3FEND technique ID (e.g., D3-PH, D3-NTA)
  technique_name: string             // D3FEND technique name
  url: string                        // D3FEND technique URL
  mitre_mitigation_id?: string       // Optional MITRE Mitigation ID mapping
  recommendation: string             // Detailed tactical recommendation (200-400 words, Markdown)
}

/**
 * Entity mentioned in an article
 * Based on EntitySchema from publication-unified-zod.ts
 */
export interface Entity {
  name: string                       // Entity name
  type: 'vendor' | 'company' | 'product' | 'malware' | 'threat_actor' | 'person' | 'government_agency' | 'security_organization' | 'technology' | 'other'
}

/**
 * CVE details with optional metadata
 * Based on CVESchema from publication-unified-zod.ts
 */
export interface CVE {
  id: string                         // CVE identifier (CVE-YYYY-NNNNN)
  cvss_score?: number                // CVSS score (0-10)
  cvss_version?: string              // CVSS version (e.g., '3.1')
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'none'
  kev?: boolean                      // CISA Known Exploited Vulnerability
}

/**
 * Source reference
 * Based on SourceSchema from publication-unified-zod.ts
 */
export interface Source {
  url: string                        // Source URL
  title: string                      // Source title
  friendly_name?: string             // Friendly brand/publication name (e.g., "The Hacker News", "Unit 42")
  website?: string                   // Source domain (e.g., "bleepingcomputer.com") - backward compatibility
  date?: string                      // Publication date (YYYY-MM-DD)
}

/**
 * Timeline event
 * Based on EventSchema from publication-unified-zod.ts
 */
export interface Event {
  datetime: string                   // ISO 8601 format
  summary: string                    // Event description
}

/**
 * Article as it appears within a publication
 * Based on ArticleSchema from publication-unified-zod.ts
 * This is the full article structure with all fields
 */
export interface ArticleInPublication {
  // Core Identity
  id: string                         // UUID v4 identifier
  slug: string                       // URL-friendly slug
  
  // Headlines & Content
  headline: string                   // Concise headline
  title: string                      // Full descriptive title
  summary: string                    // Summary of key points
  full_report: string                // Comprehensive Markdown report
  
  // Social Media
  twitter_post: string               // Twitter post (under 280 chars)
  
  // SEO
  meta_description: string           // SEO meta description
  
  // Classification
  category: ArticleCategory[]        // 1-3 categories (most prominent first)
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational'
  
  // Structured Data
  entities: Entity[]                 // Named entities
  cves: CVE[]                        // CVE details
  sources: Source[]                  // Source references
  events: Event[]                    // Timeline events
  mitre_techniques: MITRETechnique[] // MITRE ATT&CK techniques
  mitre_mitigations?: MITREMitigation[]  // MITRE ATT&CK mitigations (NEW)
  d3fend_countermeasures?: D3FENDCountermeasure[]  // D3FEND defensive countermeasures (NEW)
  // Impact & Tags
  impact_scope?: ImpactScope         // Impact scope data
  tags: string[]                     // Cybersecurity tags
  
  // Schema.org & SEO
  article_type?: 'NewsArticle' | 'TechArticle' | 'Report' | 'Analysis' | 'Advisory'
  keywords?: string[]                // SEO keywords
  reading_time_minutes?: number      // Estimated reading time
  
  // Metadata
  pub_date?: string                  // Original publication date (YYYY-MM-DD)
  extract_datetime: string           // Extraction timestamp (ISO 8601)
  
  // Optional fields for UI rendering
  createdAt?: string                 // Alias for extract_datetime
  readingTime?: number               // Alias for reading_time_minutes
  excerpt?: string                   // Alias for summary
  isUpdate?: boolean                 // Whether this is an update
  cvssScore?: number                 // Highest CVSS score from CVEs
  cvssVersion?: string               // CVSS version
}

/**
 * Full publication with embedded articles
 * Based on publication-unified-zod.ts schema (CyberAdvisorySchema)
 * Used for individual publication JSON files in /public/data/publications/
 */
export interface CyberPublication {
  // Core Identity
  pub_id: string                     // UUID v4 identifier
  slug?: string                      // Optional slug (added by system)
  
  // Headlines & Content
  headline: string                   // Catchy breaking news headline
  summary: string                    // Overall summary of cybersecurity situation
  
  // Publication Date
  pub_date: string                   // Publication date (YYYY-MM-DD)
  
  // Article Data
  total_articles: number             // Total number of articles
  articles: ArticleInPublication[]   // Array of full article objects
  
  // Generation Metadata
  generated_at: string               // ISO 8601 timestamp when generated
  date_range: string                 // Date range covered (e.g., '2024-10-13')
  
  // Optional type field (added by system)
  type?: 'daily' | 'weekly' | 'monthly' | 'special-report'
  
  // Optional metadata (added by system)
  meta?: {
    total_articles: number
    new_articles: number
    updated_articles: number
    skipped_articles: number
    generated_at: string
  }
  
  // === Legacy Fields (for backward compatibility) ===
  title?: string                     // Alias for headline
  excerpt?: string                   // Alias for summary
  meta_description?: string          // SEO meta description
  og_description?: string            // Open Graph description
  og_title?: string                  // Open Graph title
  og_image?: string                  // Open Graph image
  featured_image_url?: string        // Featured image
  featured_image_alt?: string        // Image alt text
  keywords?: string[]                // SEO keywords
  linked_articles?: string[]         // Legacy: array of article IDs
  extract_datetime?: string          // Legacy: extraction timestamp
}

// ===== Legacy/Backward Compatibility - DEPRECATED =====
// These types are kept for reference only and should not be used for new code

export interface LegacySitePost {
  postId: string
  title: string
  slug: string
  content: string
  excerpt?: string
  category?: string
  tags?: string[]
  meta: {
    title?: string
    description?: string
    keywords?: string[]
  }
  status: 'draft' | 'published'
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  author: string
}

// ===== Site Metadata =====

export interface SiteMetadata {
  siteId: string
  domain: string
  title: string
  description: string
  author: string
  language: string
  seo: {
    keywords: string[]
    ogImage?: string
    twitterSite?: string             // @handle
  }
  social: {
    twitter?: string                 // @handle
    linkedin?: string                // Profile URL
    github?: string
    facebook?: string
    youtube?: string
  }
  contact: {
    email?: string
    phone?: string
    address?: string
  }
  analytics?: {
    googleAnalyticsId?: string       // GA4 measurement ID (G-XXXXXXXXXX)
    gtmId?: string                   // Google Tag Manager ID (GTM-XXXXXXX)
  }
  githubRepo?: string                // For publishing (owner/repo)
  customDomains?: string[]           // Alternative domains (CNAME targets)
  logoUrl?: string                   // Logo URL for admin interface display
  lastPublishedAt?: Date             // Last deployment timestamp
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
  owner: string
}

export interface NavigationItem {
  name: string
  url: string
  external?: boolean
  icon?: string
}

// ===== Pages (Static Pages) =====

export interface SitePage {
  pageId: string
  siteId: string
  title: string
  slug: string
  content: PostContent
  seo: SEOMetadata
  display: DisplayMetadata
  status: 'draft' | 'published'
  createdAt: Date
  updatedAt: Date
  author: Author
}

// ===== Assets =====

export interface SiteAsset {
  assetId: string
  siteId: string
  filename: string
  originalName: string
  url: string
  type: 'image' | 'document' | 'video' | 'audio' | 'other'
  mimeType: string
  size: number                       // Bytes
  width?: number                     // For images
  height?: number                    // For images
  alt?: string
  uploadedAt: Date
  uploadedBy: string
  tags?: string[]
}

// ===== Helper Types =====

export type PostStatus = 'draft' | 'published' | 'scheduled' | 'archived'
export type ContentFormat = 'markdown' | 'json' | 'html'
export type AssetType = 'image' | 'document' | 'video' | 'audio' | 'other'
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational'

// ===== Utility Functions =====

/**
 * Type guard to check if content is markdown
 */
export function isMarkdownContent(content: PostContent): content is MarkdownContent {
  return content.format === 'markdown'
}

/**
 * Type guard to check if content is JSON blocks
 */
export function isJSONContent(content: PostContent): content is JSONContent {
  return content.format === 'json'
}

/**
 * Type guard to check if content is HTML
 */
export function isHTMLContent(content: PostContent): content is HTMLContent {
  return content.format === 'html'
}

/**
 * Auto-detect content format
 */
export function detectContentFormat(content: string): ContentFormat {
  // Try JSON first
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed) && parsed[0]?.type) {
      return 'json'
    }
  } catch {
    // Not JSON
  }
  
  // Check for HTML
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return 'html'
  }
  
  // Default to markdown
  return 'markdown'
}

/**
 * Calculate reading time from content
 */
export function calculateReadingTime(content: PostContent): number {
  let text = ''
  
  if (isMarkdownContent(content)) {
    text = content.markdown
  } else if (isHTMLContent(content)) {
    text = content.html.replace(/<[^>]*>/g, '')
  } else if (isJSONContent(content)) {
    text = content.json
      .filter(block => block.type === 'paragraph' || block.type === 'heading')
      .map(block => block.content || block.text || '')
      .join(' ')
  }
  
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Create SEO-friendly excerpt from content
 */
export function generateExcerpt(content: PostContent, maxLength: number = 160): string {
  let text = ''
  
  if (isMarkdownContent(content)) {
    text = content.markdown.replace(/[#*_`]/g, '')
  } else if (isHTMLContent(content)) {
    text = content.html.replace(/<[^>]*>/g, '')
  } else if (isJSONContent(content)) {
    const firstParagraph = content.json.find(b => b.type === 'paragraph')
    text = firstParagraph?.content || ''
  }
  
  text = text.trim().substring(0, maxLength)
  
  // Break at last complete word
  if (text.length === maxLength) {
    text = text.substring(0, text.lastIndexOf(' '))
    text += '...'
  }
  
  return text
}

// ===== Firestore Collection Paths =====

/**
 * Firestore collection structure:
 * 
 * /sites/{siteId}
 *   - Site metadata document
 * 
 * /sites/{siteId}/publications/{publicationId}
 *   - Daily publications (CyberPublication)
 * 
 * /sites/{siteId}/articles/{articleId}
 *   - Individual articles (CyberArticle)
 * 
 * /sites/{siteId}/sources/{sourceId}
 *   - Source references (CyberSource)
 * 
 * /sites/{siteId}/pages/{pageId}
 *   - Static pages (SitePage)
 * 
 * /sites/{siteId}/assets/{assetId}
 *   - Uploaded files (SiteAsset)
 */

// ===== JSON-Based Types for Current Data Structure =====

/**
 * Article metadata structure (subset of full article)
 * Used within publications to avoid external lookups
 */
export interface ArticleMetadataInPublication {
  id: string;
  slug?: string;                    // Added for SEO-friendly URLs
  headline: string;
  title: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  excerpt: string;
  summary: string;
  tags: string[];
  
  /**
   * Article categories
   */
  categories: ArticleCategory[];
  
  author: {
    name: string;
    role?: string;
  };
  publishedAt: string;
  readingTime: number;
  imageUrl?: string;
  
  // Cyber-specific metadata (optional)
  cves?: string[];
  cvssScore?: number;
  cvssVersion?: string;
  threatActor?: {
    name: string;
    aliases?: string[];
  };
  affectedSystems?: string[];
  mitreAttack?: {
    tactics?: string[];
    techniques?: string[];
  };
}

/**
 * Full publication with embedded articles
 */
export interface Publication {
  id: string;
  headline: string;
  title: string;
  subtitle?: string;
  summary: string;
  publishedAt: string;
  type: 'weekly-digest' | 'daily-digest' | 'special-report' | 'monthly-roundup';
  tags: string[];
  
  /**
   * Publication categories
   */
  categories: ArticleCategory[];
  
  author: {
    name: string;
    role?: string;
    avatar?: string;
  };
  readingTime: number;
  imageUrl?: string;
  
  // Embedded articles (no external lookups needed)
  articles: ArticleMetadataInPublication[];
  
  // Publication-specific metadata
  publicationMeta?: {
    issueNumber?: number;
    volume?: number;
    year?: number;
    week?: number;
    month?: number;
  };
  
  // Optional introduction/conclusion content
  introduction?: string; // Markdown
  conclusion?: string;   // Markdown
  
  // Special report metadata
  regulatoryContext?: string[];
  industry?: string;
  region?: string;
}
