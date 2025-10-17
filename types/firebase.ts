// Firebase data types for Social-Poster

export interface SiteMetadata {
  siteId: string;
  domain: string;
  title: string;
  description: string;
  author: string;
  language: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  seo: {
    keywords: string[];
    ogImage?: string;
  };
  social: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  contact: {
    email?: string;
    phone?: string;
  };
  githubRepo?: string; // GitHub repository for publishing (e.g., "owner/repo")
  navigation: NavigationItem[];
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  owner: string;
}

export interface NavigationItem {
  name: string;
  url: string;
  external?: boolean;
}

export interface SitePage {
  pageId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  meta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
  author: string;
}

export interface SitePost {
  postId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  meta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: string;
}

export interface SiteAsset {
  assetId: string;
  filename: string;
  originalName: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'other';
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface SiteConfig {
  key: string;
  value: string | number | boolean | object | unknown[];
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  updatedAt: Date;
  updatedBy: string;
}

// Firestore collection structure:
// sites/{siteId}/metadata (single document)
// sites/{siteId}/pages (collection of pages)
// sites/{siteId}/posts (collection of blog posts)
// sites/{siteId}/assets (collection of uploaded files)
// sites/{siteId}/config (collection of site configuration)