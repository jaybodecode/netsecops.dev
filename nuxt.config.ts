import { fileURLToPath } from 'node:url'

const tailwindCssPath = fileURLToPath(new URL('./assets/css/tailwind.css', import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Development server configuration
  devServer: {
    port: 3000,
    host: 'localhost',
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/seo',
    '@nuxt/eslint',
  ],

  css: [tailwindCssPath],

  // Image optimization configuration
  image: {
    quality: 80,
    format: ['webp', 'png', 'jpg'],
    provider: process.env.NODE_ENV === 'development' ? 'none' : 'ipx',
    // Disable all image processing in development
    ...(process.env.NODE_ENV === 'development' && {
      provider: 'none',
      presets: {},
      modifiers: {},
    }),
    ipx: {
      maxAge: 60 * 60 * 24 * 365, // 1 year cache
    },
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    // Custom presets for different image types
    presets: {
      // Category background images - aggressive optimization for backgrounds
      // Usage: <NuxtImg src="..." preset="categoryBg" />
      // Target: ~100-150KB output (down from 600KB+)
      categoryBg: {
        modifiers: {
          format: 'webp',
          quality: 55,
          width: 1000,
          height: 600,
          fit: 'cover',
        },
      },
      // Publication background images
      publicationBg: {
        modifiers: {
          format: 'webp',
          quality: 55,
          width: 1000,
          height: 600,
          fit: 'cover',
        },
      },
    },
  },

  // Icon configuration
  icon: {
    serverBundle: {
      collections: ['heroicons', 'mdi']
    },
    clientBundle: {
      scan: true, // Only include icons actually used
      sizeLimitKb: 256, // Limit client bundle size
    }
  },

  // Color mode configuration
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },

  // SEO configuration
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://cyber.netsecops.io',
    name: 'CyberNetSec.io',
    description: 'Cybersecurity Threat Intelligence Platform - Daily vulnerability reports, security advisories, and threat briefings',
    defaultLocale: 'en',
  },

  // Robots.txt configuration
  robots: {
    enabled: true,
    // Allow all legitimate crawlers
    groups: [
      {
        userAgent: ['*'],
        disallow: [
          '/_nuxt/',      // Internal Nuxt build files
          '/__sitemap__/', // Sitemap styling assets
          '/api/',        // API endpoints (if added)
          '/_ipx/',       // Image optimization endpoints
          '/test.vue',    // Test page
          '/font-demo.vue', // Demo page
        ],
        allow: [
          '/articles/',
          '/publications/',
          '/images/',
          '/sitemap.xml',
          '/favicon.ico',
        ],
      },
      // Specific rules for Google
      {
        userAgent: ['Googlebot', 'Googlebot-Image'],
        disallow: ['/_nuxt/', '/__sitemap__/', '/api/'],
      },
      // Specific rules for Bing
      {
        userAgent: ['Bingbot'],
        disallow: ['/_nuxt/', '/__sitemap__/', '/api/'],
      },
      // Allow AI search bots that cite sources and send traffic
      {
        userAgent: [
          'GPTBot',           // OpenAI ChatGPT (cites sources)
          'ChatGPT-User',     // OpenAI user agent
          'PerplexityBot',    // Perplexity AI (always cites sources)
          'Claude-Web',       // Anthropic Claude web search
          'anthropic-ai',     // Anthropic general crawler
        ],
        disallow: ['/_nuxt/', '/__sitemap__/', '/api/', '/_ipx/'],
        allow: ['/articles/', '/publications/', '/'],
      },
      // Allow SEO tools - you use these for analytics
      {
        userAgent: [
          'SemrushBot',       // Semrush/SEranking
          'AhrefsBot',        // Ahrefs
          'MJ12bot',          // Majestic SEO
        ],
        disallow: ['/_nuxt/', '/__sitemap__/', '/api/', '/_ipx/'],
        allow: ['/articles/', '/publications/', '/'],
      },
      // Block pure training/scraping bots (no traffic benefit)
      {
        userAgent: [
          'CCBot',            // Common Crawl (pure data scraping)
          'Bytespider',       // ByteDance/TikTok (unlikely to send traffic)
          'Diffbot',          // General scraper
          'DotBot',           // SEO crawler (not needed)
          'BLEXBot',          // SEO crawler (not needed)
        ],
        disallow: ['/'],
      },
    ],
    sitemap: [
      'https://cyber.netsecops.io/sitemap.xml'
    ],
  },

  // App head configuration
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
      ],
      meta: [
        { name: 'google-site-verification', content: '5aMXiPRQLZm-cGiJq9dud-NZC31kDKBC3EI20nLV8pw' }
      ]
    }
  },

  // Static site generation configuration - explicit routes to avoid markdown link crawling issues  
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: false, // Disabled to avoid issues with external/broken links in markdown
      failOnError: false,
      routes: [
        '/',
        '/articles',
        '/publications', 
        '/privacy-policy',
        '/terms-of-service',
        '/disclaimer',
        '/sitemap.xml',
        '/sitemap-routes'
        // Article and publication routes will be added via hooks
      ]
    },
  },

  // Route rules for cache control headers
  routeRules: {
    // Homepage - cache for 10 min (GitHub Pages max), must revalidate for fresh content
    '/': { 
      headers: { 
        'Cache-Control': 'public, max-age=600, must-revalidate' 
      } 
    },
    
    // Article index pages - cache for 10 min, must revalidate
    '/articles': { 
      headers: { 
        'Cache-Control': 'public, max-age=600, must-revalidate' 
      } 
    },
    '/articles/**': { 
      headers: { 
        'Cache-Control': 'public, max-age=600, must-revalidate' 
      } 
    },
    
    // Publication index pages - cache for 10 min, must revalidate
    '/publications': { 
      headers: { 
        'Cache-Control': 'public, max-age=600, must-revalidate' 
      } 
    },
    '/publications/**': { 
      headers: { 
        'Cache-Control': 'public, max-age=600, must-revalidate' 
      } 
    },
    
    // Static legal pages - cache for 1 day (rarely change)
    '/privacy-policy': { 
      headers: { 
        'Cache-Control': 'public, max-age=86400, s-maxage=86400' 
      } 
    },
    '/terms-of-service': { 
      headers: { 
        'Cache-Control': 'public, max-age=86400, s-maxage=86400' 
      } 
    },
    '/disclaimer': { 
      headers: { 
        'Cache-Control': 'public, max-age=86400, s-maxage=86400' 
      } 
    },
    
    // Data files (JSON) - cache for 1 hour (content updated frequently)
    '/data/**': { 
      headers: { 
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' 
      } 
    },
    
    // Images - cache for 1 year (immutable, versioned via filename changes)
    '/images/**': { 
      headers: { 
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' 
      } 
    },
    
    // Static assets (CSS, JS) - cache for 1 year (immutable, versioned via build hash)
    '/_nuxt/**': { 
      headers: { 
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' 
      } 
    },
    
    // Sitemap - cache for 1 day
    '/sitemap.xml': { 
      headers: { 
        'Cache-Control': 'public, max-age=86400, s-maxage=86400' 
      } 
    },
    '/robots.txt': { 
      headers: { 
        'Cache-Control': 'public, max-age=86400, s-maxage=86400' 
      } 
    },
  },

  // Add hook to generate article routes dynamically
  hooks: {
    'nitro:config': async (nitroConfig) => {
      if (!nitroConfig.prerender) return
      
      const routes = Array.isArray(nitroConfig.prerender.routes) 
        ? [...nitroConfig.prerender.routes] 
        : []

      // Add article routes based on slugs
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        
        const articlesDir = path.join(process.cwd(), 'public/data/articles')
        const files = await fs.readdir(articlesDir)
        const jsonFiles = files.filter(file => file.endsWith('.json'))
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(articlesDir, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const article = JSON.parse(content)
            
            // Generate slug-based routes only for SEO-friendly URLs
            if (article.slug) {
              routes.push(`/articles/${article.slug}`)
            }
          } catch {
            console.warn(`Failed to parse article file: ${file}`)
          }
        }
      } catch (error) {
        console.warn('Failed to generate article routes:', error)
      }

      // Add publication routes if needed
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        
        const pubsDir = path.join(process.cwd(), 'public/data/publications')
        const files = await fs.readdir(pubsDir)
        const jsonFiles = files.filter(file => file.endsWith('.json'))
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(pubsDir, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const publication = JSON.parse(content)
            
            if (publication.slug) {
              routes.push(`/publications/${publication.slug}`)
            }
          } catch {
            console.warn(`Failed to parse publication file: ${file}`)
          }
        }
      } catch (error) {
        console.warn('Failed to generate publication routes:', error)
      }

      nitroConfig.prerender.routes = routes
    }
  },

  // Runtime config for public environment variables
  runtimeConfig: {
    public: {
      siteUrl: 'https://cyber.netsecops.io',
      gtmId: 'GTM-NDQRG373', // Updated to match gtag-lazy.client.ts
    },
  },
})