// Enhanced Firebase data types for Social-Poster with full SEO support
// Includes cybersecurity-specific structures for articles, publications, and sources

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
  type: 'heading' | 'paragraph' | 'image' | 'code' | 'quote' | 'list' | 'divider' | 'custom'
  
  // For headings
  level?: 1 | 2 | 3 | 4 | 5 | 6
  text?: string
  
  // For paragraphs
  content?: string
  
  // For images
  src?: string
  alt?: string
  caption?: string
  
  // For code blocks
  language?: string
  code?: string
  
  // For quotes
  quote?: string
  cite?: string
  
  // For lists
  items?: string[]
  ordered?: boolean
  
  // Custom component data
  component?: string
  props?: Record<string, unknown>
  
  // Styling
  className?: string
  styles?: Record<string, string>
}

// ===== SEO & Social Media =====

export interface SEOMetadata {
  // Basic SEO
  title: string                      // SEO title (50-60 chars ideal)
  description: string                // Meta description (150-160 chars ideal)
  keywords: string[]                 // SEO keywords
  canonicalUrl?: string              // Canonical URL override
  robots?: string                    // Default: "index, follow"
  
  // Open Graph (Facebook, LinkedIn)
  ogType: 'article' | 'website' | 'blog'
  ogTitle: string
  ogDescription: string
  ogImage: string                    // URL to OG image (1200x630px recommended)
  ogImageAlt?: string
  ogUrl: string
  ogSiteName: string
  
  // Twitter Card
  twitterCard: 'summary' | 'summary_large_image'
  twitterTitle: string
  twitterDescription: string
  twitterImage: string               // URL to Twitter image (1200x628px recommended)
  twitterImageAlt?: string
  twitterSite?: string               // @handle for site
  twitterCreator?: string            // @handle for author
  
  // Article-specific metadata (for blog posts)
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
      jobTitle?: string
      sameAs?: string[]              // Social media URLs
    }
    publisher?: {
      '@type'?: 'Organization'
      name: string
      logo: string
      url?: string
    }
    wordCount?: number
    timeRequired?: string            // ISO 8601 duration (e.g., "PT5M" for 5 minutes)
    inLanguage?: string              // e.g., "en-US"
    keywords?: string[]
    articleBody?: string             // Full text for search engines
  }
}

// ===== Display Data =====

export interface DisplayMetadata {
  title: string                      // Display title (can differ from SEO title)
  subtitle?: string                  // Optional subtitle
  excerpt: string                    // Short summary for listings (150-200 chars)
  featuredImage?: string             // Hero image URL
  featuredImageAlt?: string
  featuredImageCaption?: string
  category?: string                  // Primary category
  tags?: string[]                    // Tags for filtering/search
  readingTime?: number               // Estimated reading time in minutes
  backgroundColor?: string           // Custom background color
  textColor?: string                 // Custom text color
}

// ===== Author =====

export interface Author {
  id: string
  name: string
  email?: string
  avatar?: string
  bio?: string
  role?: string
  social?: {
    twitter?: string
    linkedin?: string
    github?: string
    website?: string
  }
}

// ===== Analytics =====

export interface PostAnalytics {
  views?: number
  uniqueViews?: number
  shares?: number
  likes?: number
  comments?: number
  lastViewedAt?: Date
  popularityScore?: number           // Computed score for trending
}

// ===== Main Blog Post Interface =====

export interface BlogPost {
  // Core identifiers
  postId: string
  siteId: string
  slug: string                       // URL-friendly slug
  
  // Content
  content: PostContent
  
  // SEO & Social Media (complete metadata in one place)
  seo: SEOMetadata
  
  // Display properties
  display: DisplayMetadata
  
  // Status & scheduling
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  publishedAt?: Date
  scheduledFor?: Date                // For scheduled publishing
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Author
  author: Author
  
  // Optional analytics
  analytics?: PostAnalytics
  
  // Version control (optional)
  version?: number
  previousVersionId?: string
}

// ===== Legacy Interfaces (for backward compatibility) =====

export interface SitePost {
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
  theme: {
    primary: string
    secondary: string
    accent: string
  }
  seo: {
    keywords: string[]
    ogImage?: string
    twitterSite?: string             // @handle for site
  }
  social: {
    linkedin?: string
    twitter?: string
    github?: string
    facebook?: string
    instagram?: string
    youtube?: string
  }
  contact: {
    email?: string
    phone?: string
    address?: string
  }
  githubRepo?: string                // GitHub repository for publishing (e.g., "owner/repo")
  navigation: NavigationItem[]
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

// ===== Pages (static pages like About, Contact) =====

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
  alt?: string                       // For images
  uploadedAt: Date
  uploadedBy: string
  tags?: string[]                    // For organization
}

// ===== Site Configuration =====

export interface SiteConfig {
  siteId: string
  key: string
  value: string | number | boolean | object | unknown[]
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  updatedAt: Date
  updatedBy: string
}

// ===== Firestore Collection Paths =====

/**
 * Firestore collection structure:
 * 
 * /sites/{siteId}
 *   - Site metadata document
 * 
 * /sites/{siteId}/posts/{postId}
 *   - Blog posts collection (BlogPost)
 * 
 * /sites/{siteId}/pages/{pageId}
 *   - Static pages collection (SitePage)
 * 
 * /sites/{siteId}/assets/{assetId}
 *   - Uploaded files collection (SiteAsset)
 * 
 * /sites/{siteId}/config/{configId}
 *   - Site configuration collection (SiteConfig)
 */

// ===== Helper Types =====

export type PostStatus = 'draft' | 'published' | 'scheduled' | 'archived'
export type ContentFormat = 'markdown' | 'json' | 'html'
export type AssetType = 'image' | 'document' | 'video' | 'audio' | 'other'

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
 * Calculate reading time from markdown or HTML content
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
