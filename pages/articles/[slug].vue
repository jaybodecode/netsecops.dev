<script setup lang="ts">
import { marked } from 'marked'

// Get route parameter
const route = useRoute()
const router = useRouter()
const articleSlug = route.params.slug as string

// Fetch article data with transformation using slug
const { data: article, pending, error } = await useArticleBySlug(articleSlug)

// Fetch all articles for navigation
const { data: articlesData } = await useArticlesIndex()
const allArticles = computed(() => articlesData.value?.articles || [])

// Find current article index and get next/prev
const currentArticleIndex = computed(() => {
  if (!article.value || !allArticles.value.length) return -1
  return allArticles.value.findIndex(a => a.slug === articleSlug)
})

const previousArticle = computed(() => {
  if (currentArticleIndex.value > 0) {
    return allArticles.value[currentArticleIndex.value - 1]
  }
  return null
})

const nextArticle = computed(() => {
  if (currentArticleIndex.value >= 0 && currentArticleIndex.value < allArticles.value.length - 1) {
    return allArticles.value[currentArticleIndex.value + 1]
  }
  return null
})

// Navigate to article and scroll to top
const navigateToArticle = (slug: string | undefined) => {
  if (!slug) return
  router.push(`/articles/${slug}`)
  // Scroll after navigation
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

// Mark article as read in localStorage (client-side only)
const markArticleAsRead = () => {
  if (typeof window === 'undefined' || !articleSlug || !article.value?.id) return
  
  try {
    const STORAGE_KEY = 'readArticles'
    const stored = localStorage.getItem(STORAGE_KEY)
    const readArticles: Record<string, boolean> = stored ? JSON.parse(stored) : {}
    
    // Mark this article as read with timestamp - use article ID for storage consistency
    readArticles[article.value.id] = true
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readArticles))
  } catch {
    // Silent error handling for localStorage
  }
}

// Mark as read when article loads
watch(article, (newArticle) => {
  if (newArticle) {
    markArticleAsRead()
  }
}, { immediate: true })

// Navigation functions
const goBack = () => {
  router.push('/articles')
}

const goHome = () => {
  router.push('/')
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Print function
const printArticle = () => {
  window.print()
}

// Social sharing functions
const shareOnTwitter = () => {
  if (!article.value) return
  // Use twitter_post field which is pre-optimized with emojis, hashtags, and character limits
  const text = encodeURIComponent(article.value.twitter_post || article.value.headline || '')
  const url = encodeURIComponent(window.location.href)
  // Don't add hashtags if twitter_post already has them
  const hasHashtags = article.value.twitter_post?.includes('#')
  const tweetUrl = hasHashtags 
    ? `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    : `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=cybersecurity,infosec`
  window.open(tweetUrl, '_blank', 'width=550,height=420')
}

const shareOnLinkedIn = () => {
  if (!article.value) return
  const url = encodeURIComponent(window.location.href)
  // LinkedIn's sharing API will automatically pull OG tags for preview
  // The headline, meta_description, and banner.png will be displayed
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=550,height=420')
}

// Utility functions
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    // Always treat as UTC date (YYYY-MM-DD)
    // If dateString is only YYYY-MM-DD, append 'T12:00:00Z' to avoid timezone issues
    let iso = dateString;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      iso = dateString + 'T12:00:00Z';
    }
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

const formatDateCompact = (dateString: string | undefined) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear().toString().slice(-2)
    return `${month}${day}'${year}`
  } catch {
    return 'N/A'
  }
}

const extractDomain = (url: string) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return ''
  }
}

const getSeverityBadgeVariant = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'critical'
    case 'high': return 'high'
    case 'medium': return 'medium'
    case 'low': return 'low'
    default: return 'info'
  }
}

// Helper to get severity from CVEs if available
const getArticleSeverity = (article: any): string | null => {
  // Check if article has CVEs with severity information
  if (article?.cves && Array.isArray(article.cves) && article.cves.length > 0) {
    // Look for the highest severity in CVEs
    const severities = article.cves
      .map((cve: any) => {
        if (typeof cve === 'object' && cve.severity) {
          return cve.severity
        }
        return null
      })
      .filter(Boolean)
    
    // Return highest severity found
    if (severities.includes('critical')) return 'critical'
    if (severities.includes('high')) return 'high'
    if (severities.includes('medium')) return 'medium'
    if (severities.includes('low')) return 'low'
  }
  return null
}

// Computed properties
const severityGradient = computed(() => {
  const severity = getArticleSeverity(article.value)
  if (!severity) return 'from-gray-900 to-gray-800'
  
  switch (severity.toLowerCase()) {
    case 'critical': return 'from-red-900 to-red-800'
    case 'high': return 'from-orange-900 to-orange-800'
    case 'medium': return 'from-yellow-900 to-yellow-800'
    case 'low': return 'from-green-900 to-green-800'
    default: return 'from-gray-900 to-gray-800'
  }
})


// Markdown rendering (used for Full Report card)
const renderMarkdown = (content: string) => {
  return marked(content || '')
}

// Export Markdown function for Full Report
const exportMarkdown = () => {
  if (!article.value?.full_report) return
  const markdown = article.value.full_report
  const filename = `${article.value.slug || 'full-report'}.md`
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// CVE helper functions
const getCveId = (cve: string | { id: string; cvss_score?: number; severity?: string }) => {
  return typeof cve === 'string' ? cve : cve.id
}

const getCveDetailsUrl = (cveId: string) => {
  return `https://www.cvedetails.com/cve/${cveId}/`
}

const getCveOrgUrl = (cveId: string) => {
  return `https://www.cve.org/CVERecord?id=${cveId}`
}

// Handle error states
if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Article not found'
  })
}

// SEO Meta Tags - handled by composable
useArticleSeo(article.value)

// Page meta
definePageMeta({
  layout: 'cyber',
})
</script>

<template>
  <!-- Cyber Theme Article -->
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <!-- Sticky Navigation Header -->
    <div class="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-cyan-500/30 shadow-lg shadow-cyan-500/10 transition-all duration-300">
      <div class="container mx-auto px-4 max-w-4xl py-3">
        <div class="flex items-center justify-between gap-3">
          <!-- Print and Home Buttons (Left) -->
          <div class="flex items-center gap-2">
            <CyberButton
              variant="secondary"
              size="sm"
              @click="printArticle"
              class="no-print"
              title="Print article or save as PDF"
            >
              <Icon name="heroicons:printer-20-solid" class="w-4 h-4 mr-1" />
              <span class="hidden sm:inline">Print</span>
            </CyberButton>
            
            <CyberButton
              variant="primary"
              size="sm"
              @click="goHome"
              class="no-print"
            >
              <Icon name="heroicons:home-20-solid" class="w-4 h-4 mr-1" />
              <span class="hidden sm:inline">Home</span>
            </CyberButton>
          </div>
          
          <!-- Article Title (truncated) - Hidden on mobile -->
          <div v-if="article" class="flex-1 min-w-0 mx-4 hidden md:block">
            <div class="flex items-center gap-3">
              <CyberBadge 
                v-if="article.article_type"
                variant="info"
                size="sm"
                class="font-semibold flex-shrink-0"
                title="Article Type"
              >
                {{ article.article_type }}
              </CyberBadge>
              <h1 class="text-sm font-semibold text-cyan-400 truncate">
                {{ article.headline }}
              </h1>
            </div>
          </div>
           
          <!-- Back Button (Right) -->
          <div class="flex items-center ml-auto">
            <CyberButton
              variant="secondary"
              size="sm"
              @click="goBack"
              class="no-print"
            >
              <Icon name="heroicons:arrow-left-20-solid" class="w-4 h-4 mr-1" />
              <span class="hidden sm:inline">Articles</span>
            </CyberButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Article Loaded -->
    <div v-if="article">
      <!-- Hero Section with Dynamic Gradient -->
      <div 
        :class="[
          'relative overflow-hidden',
          severityGradient
        ]"
      >
        <!-- Animated Grid Background -->
        <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px); background-size: 50px 50px; animation: gridMove 20s linear infinite;"/>
        
        <!-- Glitch Overlay Effect -->
        <div class="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-500/5 to-purple-500/5 animate-pulse"/>
        
        <!-- Featured Image Overlay (if available) -->
        <div v-if="article.featured_image_url" class="absolute inset-0 opacity-20">
          <NuxtImg
            :src="article.featured_image_url"
            :alt="article.headline"
            class="w-full h-full object-cover"
            loading="eager"
          />
          <div class="absolute inset-0 bg-gradient-to-br from-gray-950 to-gray-900 opacity-70"/>
        </div>
        

        
        <!-- Content -->
        <div class="container mx-auto px-4 max-w-4xl py-12 relative z-10">
          <!-- Title with Navigation Arrows -->
          <div class="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 mb-4">
            <!-- Navigation Arrows Row (Mobile) -->
            <div class="flex justify-between md:hidden">
              <!-- Previous Article Button -->
              <button
                v-if="previousArticle"
                @click="navigateToArticle(previousArticle.slug)"
                class="flex-shrink-0 p-2 bg-gray-800/50 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/50 rounded-lg transition-all duration-200"
                :title="previousArticle.headline"
              >
                <Icon name="heroicons:arrow-left-20-solid" class="w-5 h-5 text-cyan-400" />
              </button>
              <div v-else class="flex-shrink-0 w-9" />

              <!-- Next Article Button -->
              <button
                v-if="nextArticle"
                @click="navigateToArticle(nextArticle.slug)"
                class="flex-shrink-0 p-2 bg-gray-800/50 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/50 rounded-lg transition-all duration-200"
                :title="nextArticle.headline"
              >
                <Icon name="heroicons:arrow-right-20-solid" class="w-5 h-5 text-cyan-400" />
              </button>
              <div v-else class="flex-shrink-0 w-9" />
            </div>

            <!-- Title Row -->
            <div class="flex items-start gap-4">
              <!-- Previous Article Button (Desktop) -->
              <button
                v-if="previousArticle"
                @click="navigateToArticle(previousArticle.slug)"
                class="hidden md:flex flex-shrink-0 p-2 bg-gray-800/50 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/50 rounded-lg transition-all duration-200 mt-2"
                :title="previousArticle.headline"
              >
                <Icon name="heroicons:arrow-left-20-solid" class="w-5 h-5 text-cyan-400" />
              </button>
              <div v-else class="hidden md:flex flex-shrink-0 w-9" />

              <!-- Title -->
              <h1 class="flex-1 text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 leading-tight">
                {{ article.headline }}
              </h1>

              <!-- Next Article Button (Desktop) -->
              <button
                v-if="nextArticle"
                @click="navigateToArticle(nextArticle.slug)"
                class="hidden md:flex flex-shrink-0 p-2 bg-gray-800/50 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/50 rounded-lg transition-all duration-200 mt-2"
                :title="nextArticle.headline"
              >
                <Icon name="heroicons:arrow-right-20-solid" class="w-5 h-5 text-cyan-400" />
              </button>
              <div v-else class="hidden md:flex flex-shrink-0 w-9" />
            </div>
          </div>
          
          <!-- Subtitle/Title -->
          <h2 v-if="article.subtitle || article.title" class="text-xl md:text-2xl font-semibold mb-6 text-cyan-300/90 leading-relaxed">
            {{ article.subtitle || article.title }}
          </h2>
          
          <!-- Severity (left) with metadata, and Categories (right) in one row -->
          <div class="mb-4 flex items-center justify-between gap-4 flex-wrap">
            <!-- Left: Severity + Metadata -->
            <div class="flex items-center gap-3 flex-wrap">
              <CyberBadge 
                v-if="article.severity"
                :variant="getSeverityBadgeVariant(article.severity)"
                size="md"
                class="flex items-center gap-1 font-semibold"
              >
                <Icon name="heroicons:shield-exclamation-20-solid" class="w-4 h-4" />
                {{ article.severity.toUpperCase() }}
              </CyberBadge>

              <CyberBadge 
                v-if="article.updates && article.updates.length > 0"
                variant="warning"
                size="md"
                class="font-semibold animate-pulse"
                title="This article has been updated"
              >
                <Icon name="heroicons:arrow-path-20-solid" class="w-4 h-4 mr-1" />
                UPDATED
              </CyberBadge>

              <!-- Date and Reading Time -->
              <div class="flex items-center gap-3 text-sm text-cyan-400/80">
                <div class="flex items-center gap-1">
                  <Icon name="heroicons:calendar-20-solid" class="w-4 h-4" />
                  <span>{{ formatDate(article.pub_date) }}</span>
                </div>
                <div v-if="article.updates && article.updates.length > 0" class="flex items-center gap-1 text-yellow-400/90 font-semibold">
                  <Icon name="heroicons:arrow-path-20-solid" class="w-4 h-4" />
                  <span>{{ formatDate(article.updates[article.updates.length - 1]?.datetime || article.pub_date) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Icon name="heroicons:clock-20-solid" class="w-4 h-4" />
                  <span>{{ article.reading_time_minutes }}m read</span>
                </div>
              </div>
            </div>

            <!-- Right: Categories -->
            <div class="flex items-center gap-2 flex-wrap justify-start md:justify-end">
              <CyberBadge 
                v-for="(cat, index) in article.category"
                :key="`hero-category-${index}`"
                variant="purple"
                size="md"
                class="font-semibold"
              >
                {{ cat }}
              </CyberBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Impact Scope (from new schema) - TOP OF PAGE -->
      <div v-if="article.impact_scope && ((article.impact_scope.companies_affected && article.impact_scope.companies_affected.length > 0) || article.impact_scope.people_affected_estimate)" class="container mx-auto px-4 max-w-4xl mb-8">
        <CyberCard variant="warning">
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-4 flex items-center text-orange-400">
              <Icon name="heroicons:exclamation-triangle-20-solid" class="w-6 h-6 mr-2" />
              Impact Scope
            </h3>
            
            <div class="space-y-4">
              <!-- People Affected Estimate -->
              <div v-if="article.impact_scope.people_affected_estimate">
                <h4 class="text-sm font-semibold text-gray-400 mb-2">People Affected</h4>
                <div class="bg-gray-900/50 border border-orange-500/30 rounded-lg p-3">
                  <p class="text-gray-300 text-lg font-semibold">
                    {{ article.impact_scope.people_affected_estimate }}
                  </p>
                </div>
              </div>

              <!-- Companies Affected -->
              <div v-if="article.impact_scope.companies_affected && article.impact_scope.companies_affected.length > 0">
                <h4 class="text-sm font-semibold text-gray-400 mb-2">Affected Companies</h4>
                <div class="flex flex-wrap gap-2">
                  <CyberBadge 
                    v-for="company in article.impact_scope.companies_affected" 
                    :key="company"
                    variant="warning"
                    size="md"
                  >
                    {{ company }}
                  </CyberBadge>
                </div>
              </div>

              <!-- Industries Affected -->
              <div v-if="article.impact_scope.industries_affected && article.impact_scope.industries_affected.length > 0">
                <h4 class="text-sm font-semibold text-gray-400 mb-2">Industries Affected</h4>
                <div class="flex flex-wrap gap-2">
                  <CyberBadge 
                    v-for="industry in article.impact_scope.industries_affected" 
                    :key="industry"
                    variant="warning"
                    size="sm"
                  >
                    {{ industry }}
                  </CyberBadge>
                </div>
              </div>

              <!-- Geographic Scope -->
              <div v-if="article.impact_scope.countries_affected && article.impact_scope.countries_affected.length > 0">
                <h4 class="text-sm font-semibold text-gray-400 mb-2">Geographic Impact</h4>
                <div class="flex items-center gap-2 flex-wrap">
                  <CyberBadge 
                    v-for="country in article.impact_scope.countries_affected" 
                    :key="country"
                    variant="warning"
                    size="sm"
                  >
                    {{ country }}
                  </CyberBadge>
                  <span v-if="article.impact_scope.geographic_scope" class="text-xs text-gray-400 capitalize">
                    ({{ article.impact_scope.geographic_scope }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CyberCard>
      </div>

      <!-- Article Content -->
      <div class="container mx-auto px-4 py-12 max-w-4xl">
        <!-- Tags (Full Width Row) -->
        <div v-if="article.tags && article.tags.length > 0" class="mb-8 no-print">
          <CyberCard variant="purple">
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center text-purple-400">
                <Icon name="heroicons:tag-20-solid" class="w-6 h-6 mr-2" />
                Tags
              </h3>
              <div class="flex flex-wrap gap-2">
                <CyberBadge 
                  v-for="tag in article.tags" 
                  :key="tag"
                  variant="purple"
                  size="sm"
                >
                  {{ tag }}
                </CyberBadge>
              </div>
            </div>
          </CyberCard>
        </div>

        <!-- Related Entities (Full Width Row) -->
        <div v-if="article.entities && article.entities.length > 0" class="mb-8 no-print">
          <CyberCard variant="purple">
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center text-purple-400">
                <Icon name="heroicons:building-office-20-solid" class="w-6 h-6 mr-2" />
                Related Entities<span v-if="article.updates && article.updates.length > 0" class="text-xs font-normal text-gray-400 ml-2">(initial)</span>
              </h3>
              
              <!-- Group entities by type for better organization -->
              <div class="space-y-4">
                  <!-- Threat Actors -->
                  <div v-if="article.entities.filter(e => e.type === 'threat_actor').length > 0">
                    <h4 class="text-xs font-semibold text-red-400 mb-2 flex items-center">
                      <Icon name="heroicons:shield-exclamation-20-solid" class="w-3 h-3 mr-1" />
                      Threat Actors
                    </h4>
                    <div class="flex flex-wrap gap-1">
                      <CyberBadge
                        v-for="entity in article.entities.filter(e => e.type === 'threat_actor')"
                        :key="entity.name"
                        variant="danger"
                        size="sm"
                      >
                        {{ entity.name }}
                      </CyberBadge>
                    </div>
                  </div>

                  <!-- Organizations & Vendors -->
                  <div v-if="article.entities.filter(e => ['vendor', 'security_organization', 'government_agency'].includes(e.type)).length > 0">
                    <h4 class="text-xs font-semibold text-blue-400 mb-2 flex items-center">
                      <Icon name="heroicons:building-office-2-20-solid" class="w-3 h-3 mr-1" />
                      Organizations
                    </h4>
                    <div class="flex flex-wrap gap-1">
                      <CyberBadge
                        v-for="entity in article.entities.filter(e => ['vendor', 'security_organization', 'government_agency'].includes(e.type))"
                        :key="entity.name"
                        variant="info"
                        size="sm"
                      >
                        {{ entity.name }}
                      </CyberBadge>
                    </div>
                  </div>

                  <!-- Products & Technologies -->
                  <div v-if="article.entities.filter(e => ['product', 'technology', 'tool'].includes(e.type)).length > 0">
                    <h4 class="text-xs font-semibold text-cyan-400 mb-2 flex items-center">
                      <Icon name="heroicons:cpu-chip-20-solid" class="w-3 h-3 mr-1" />
                      Products & Tech
                    </h4>
                    <div class="flex flex-wrap gap-1">
                      <CyberBadge
                        v-for="entity in article.entities.filter(e => ['product', 'technology', 'tool'].includes(e.type))"
                        :key="entity.name"
                        variant="cyan"
                        size="sm"
                      >
                        {{ entity.name }}
                      </CyberBadge>
                    </div>
                  </div>

                  <!-- Other Entities -->
                  <div v-if="article.entities.filter(e => !['threat_actor', 'vendor', 'security_organization', 'government_agency', 'product', 'technology', 'tool'].includes(e.type)).length > 0">
                    <h4 class="text-xs font-semibold text-gray-400 mb-2 flex items-center">
                      <Icon name="heroicons:tag-20-solid" class="w-3 h-3 mr-1" />
                      Other
                    </h4>
                    <div class="flex flex-wrap gap-1">
                      <CyberBadge
                        v-for="entity in article.entities.filter(e => !['threat_actor', 'vendor', 'security_organization', 'government_agency', 'product', 'technology', 'tool'].includes(e.type))"
                        :key="entity.name"
                        variant="secondary"
                        size="sm"
                      >
                        {{ entity.name }}
                      </CyberBadge>
                    </div>
                  </div>
                </div>
              </div>
            </CyberCard>
          </div>

        <!-- Threat Classification & Confidence -->
        <div v-if="article.threat_type || article.confidence" class="mb-8">
          <CyberCard variant="purple">
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center text-purple-400">
                <Icon name="heroicons:shield-check-20-solid" class="w-6 h-6 mr-2" />
                Threat Classification
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Threat Type -->
                <div v-if="article.threat_type">
                  <h4 class="text-sm font-semibold text-gray-400 mb-2">Threat Type</h4>
                  <CyberBadge 
                    variant="danger"
                    size="md"
                  >
                    {{ article.threat_type }}
                  </CyberBadge>
                </div>

                <!-- Confidence Level -->
                <div v-if="article.confidence">
                  <h4 class="text-sm font-semibold text-gray-400 mb-2">Attribution Confidence</h4>
                  <CyberBadge 
                    :variant="article.confidence === 'confirmed' ? 'success' : article.confidence === 'likely' ? 'info' : 'warning'"
                    size="md"
                    class="capitalize"
                  >
                    {{ article.confidence }}
                  </CyberBadge>
                </div>
              </div>
            </div>
          </CyberCard>
        </div>

        <!-- NEW: Events Timeline (from new schema) -->
        <div v-if="article.events && article.events.length > 0" class="mb-8">
          <h3 class="text-2xl font-bold mb-6 flex items-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            <Icon name="heroicons:clock-20-solid" class="w-6 h-6 mr-2 text-cyan-400" />
            Timeline of Events
          </h3>
          <div class="space-y-4">
            <div v-for="(event, index) in article.events" :key="index" class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-10 h-10 bg-cyan-500 border-2 border-cyan-400 rounded-full flex items-center justify-center text-gray-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  {{ index + 1 }}
                </div>
                <div v-if="index < article.events.length - 1" class="w-0.5 flex-1 bg-cyan-500/30 my-2"/>
              </div>
              <div class="flex-1 pb-8">
                <div class="text-sm text-cyan-400/80 mb-1">
                  {{ formatDate(event.datetime) }}
                </div>
                <div class="font-medium text-gray-200">
                  {{ event.summary }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- NEW: Article Updates Section (from new schema) -->
        <div v-if="article.updates && article.updates.length > 0" class="mb-8">
          <h3 class="text-2xl font-bold mb-6 flex items-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
            <Icon name="heroicons:arrow-path-20-solid" class="w-6 h-6 mr-2 text-orange-400" />
            Article Updates
          </h3>
          
          <div class="space-y-4">
            <CyberCard 
              v-for="(update, index) in article.updates" 
              :key="`update-${index}`"
              :variant="update.severity_change === 'increased' ? 'danger' : update.severity_change === 'decreased' ? 'green' : 'warning'"
            >
              <div class="p-6">
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h4 v-if="update.title" class="text-lg font-semibold text-gray-100">
                        {{ update.title }}
                      </h4>
                      <CyberBadge 
                        v-if="update.severity_change && update.severity_change !== 'unchanged'"
                        :variant="update.severity_change === 'increased' ? 'danger' : 'success'"
                        size="sm"
                        class="flex items-center gap-1"
                      >
                        <Icon 
                          :name="update.severity_change === 'increased' ? 'heroicons:arrow-trending-up-20-solid' : 'heroicons:arrow-trending-down-20-solid'" 
                          class="w-3 h-3" 
                        />
                        Severity {{ update.severity_change }}
                      </CyberBadge>
                    </div>
                    <div v-if="update.datetime" class="text-sm text-cyan-400/80 mb-3 flex items-center">
                      <Icon name="heroicons:calendar-20-solid" class="w-4 h-4 mr-2" />
                      {{ formatDate(update.datetime) }}
                    </div>
                  </div>
                </div>

                <div v-if="update.summary" class="mb-4">
                  <p class="text-gray-300 font-medium">{{ update.summary }}</p>
                </div>

                <div v-if="update.content" class="mb-4">
                  <div class="cyber-prose">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div v-html="renderMarkdown(update.content)"/>
                  </div>
                </div>

                <!-- Update Events Timeline -->
                <div v-if="update.events && update.events.length > 0" class="mb-4">
                  <h5 class="text-sm font-semibold text-gray-400 mb-2">New Events:</h5>
                  <div class="space-y-2">
                    <div 
                      v-for="(event, eventIndex) in update.events" 
                      :key="`update-${index}-event-${eventIndex}`"
                      class="flex gap-2 text-sm bg-gray-900/50 p-3 rounded"
                    >
                      <Icon name="heroicons:clock-20-solid" class="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div class="text-cyan-400/80">{{ formatDate(event.datetime) }}</div>
                        <div class="text-gray-300">{{ event.summary }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Update Sources -->
                <div v-if="update.sources && update.sources.length > 0" class="mt-4 pt-4 border-t border-gray-700">
                  <h5 class="text-sm font-semibold text-gray-400 mb-2">Update Sources:</h5>
                  <div class="space-y-2">
                    <div 
                      v-for="source in update.sources" 
                      :key="source.source_id"
                      class="text-sm"
                    >
                      <span class="text-gray-400">{{ source.root_url || extractDomain(source.url) }}</span>
                      <span class="text-gray-500 mx-2">•</span>
                      <a 
                        :href="source.url" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {{ source.title }}
                      </a>
                      <span v-if="source.source_date" class="text-gray-500 ml-2">• {{ source.source_date }}</span>
                    </div>
                  </div>
                </div>

                <!-- Update New Entities -->
                <div v-if="update.new_entities && update.new_entities.length > 0" class="mt-4">
                  <h5 class="text-sm font-semibold text-gray-400 mb-2">New Entities Identified:</h5>
                  <div class="flex flex-wrap gap-2">
                    <CyberBadge 
                      v-for="entity in update.new_entities" 
                      :key="entity.name"
                      variant="purple"
                      size="sm"
                    >
                      {{ entity.name }}
                    </CyberBadge>
                  </div>
                </div>

                <!-- Update New CVEs -->
                <div v-if="update.new_cves && update.new_cves.length > 0" class="mt-4">
                  <h5 class="text-sm font-semibold text-gray-400 mb-2">New CVEs:</h5>
                  <div class="flex flex-wrap gap-2">
                    <CyberBadge 
                      v-for="cve in update.new_cves" 
                      :key="typeof cve === 'string' ? cve : cve.id"
                      variant="danger"
                      size="sm"
                      class="font-mono"
                    >
                      {{ typeof cve === 'string' ? cve : cve.id }}
                    </CyberBadge>
                  </div>
                </div>
              </div>
            </CyberCard>
          </div>
        </div>

        <!-- CVEs Section -->
        <div v-if="article.cves && article.cves.length > 0" class="mb-8 no-print">
          <CyberCard variant="danger">
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center text-red-400">
                <Icon name="heroicons:bug-ant-20-solid" class="w-6 h-6 mr-2" />
                CVE Identifiers
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div 
                  v-for="(cve, index) in article.cves" 
                  :key="index"
                  class="bg-gray-900/50 border border-red-500/30 rounded-lg p-4 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
                >
                  <!-- Simple CVE string format -->
                  <div v-if="typeof cve === 'string'">
                    <div class="flex items-center justify-between gap-3 mb-3">
                      <span class="inline-flex items-center px-3 py-1.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-mono font-bold text-base">
                        {{ cve }}
                      </span>
                    </div>
                    <!-- External Links -->
                    <div class="flex flex-wrap gap-2">
                      <a 
                        :href="getCveDetailsUrl(cve)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-cyan-500/30 text-cyan-400 hover:border-cyan-500 text-xs transition-all"
                        title="View on CVE Details"
                      >
                        <Icon name="heroicons:arrow-top-right-on-square-20-solid" class="w-3 h-3" />
                        CVEDetails.com
                      </a>
                      <a 
                        :href="getCveOrgUrl(cve)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-purple-500/30 text-purple-400 hover:border-purple-500 text-xs transition-all"
                        title="View on CVE.org"
                      >
                        <Icon name="heroicons:arrow-top-right-on-square-20-solid" class="w-3 h-3" />
                        CVE.org
                      </a>
                    </div>
                  </div>
                  
                  <!-- Full CVE object with metadata -->
                  <div v-else>
                    <!-- Row 1: CVE ID -->
                    <div class="mb-2">
                      <span class="inline-flex items-center px-3 py-1.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-mono font-bold text-base">
                        {{ cve.id }}
                      </span>
                    </div>
                    
                    <!-- Row 2: Severity and CVSS Score -->
                    <div class="flex items-center gap-2 mb-2">
                      <span 
                        v-if="cve.severity"
                        :class="[
                          'px-2 py-1 rounded text-xs font-semibold',
                          cve.severity.toLowerCase() === 'critical' ? 'bg-red-500/20 border border-red-500/30 text-red-300' :
                          cve.severity.toLowerCase() === 'high' ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300' :
                          cve.severity.toLowerCase() === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300' :
                          'bg-green-500/20 border border-green-500/30 text-green-300'
                        ]"
                      >
                        {{ cve.severity.toUpperCase() }}
                      </span>
                      <div v-if="cve.cvss_score" class="flex items-center gap-1">
                        <span class="text-xs text-gray-400">CVSS:</span>
                        <span class="text-xl font-black text-red-400">{{ cve.cvss_score }}</span>
                      </div>
                    </div>
                    
                    <!-- Row 3: KVE Badge (if applicable) -->
                    <div v-if="cve.kve" class="mb-3">
                      <span class="inline-flex items-center px-2 py-1 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                        <Icon name="heroicons:shield-exclamation-20-solid" class="w-3 h-3 mr-1" />
                        KVE
                      </span>
                    </div>
                    
                    <!-- External Links -->
                    <div class="flex flex-wrap gap-2">
                      <a 
                        :href="getCveDetailsUrl(cve.id)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-cyan-500/30 text-cyan-400 hover:border-cyan-500 text-xs transition-all"
                        title="View on CVE Details"
                      >
                        <Icon name="heroicons:arrow-top-right-on-square-20-solid" class="w-3 h-3" />
                        CVEDetails.com
                      </a>
                      <a 
                        :href="getCveOrgUrl(cve.id)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-purple-500/30 text-purple-400 hover:border-purple-500 text-xs transition-all"
                        title="View on CVE.org"
                      >
                        <Icon name="heroicons:arrow-top-right-on-square-20-solid" class="w-3 h-3" />
                        CVE.org
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Note: CVSS fields not in new schema yet - for future implementation -->
              <!-- 
              <div v-if="article.cvssScore" class="mt-4 pt-4 border-t border-red-500/30">
                <div class="flex items-center gap-4">
                  <span class="text-gray-400">CVSS Score:</span>
                  <span class="text-3xl font-black text-red-400">{{ article.cvssScore }}</span>
                  <span class="text-sm text-gray-500">(v{{ article.cvssVersion || '3.1' }})</span>
                </div>
                
                <div v-if="article.cvssBreakdown" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div v-for="(value, key) in article.cvssBreakdown" :key="key" class="text-sm">
                    <span class="text-gray-500">{{ key }}:</span>
                    <span class="text-cyan-400 font-semibold ml-2">{{ value }}</span>
                  </div>
                </div>
              </div>
              -->
            </div>
          </CyberCard>
        </div>

        <!-- Note: Affected Versions not in new schema yet - for future implementation -->
        <!--
        <div v-if="article.affectedVersions && article.affectedVersions.length > 0" class="mb-8">
          <CyberCard variant="orange">
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center text-orange-400">
                <Icon name="heroicons:exclamation-triangle-20-solid" class="w-6 h-6 mr-2" />
                Affected Versions
              </h3>
              <ul class="space-y-2">
                <li v-for="(version, index) in article.affectedVersions" :key="index" class="flex items-start gap-2">
                  <Icon name="heroicons:chevron-right-20-solid" class="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-300">{{ version }}</span>
                </li>
              </ul>
            </div>
          </CyberCard>
        </div>
        -->

        <!-- Note: IOCs not in new schema yet - for future implementation -->
        <!--
        <div v-if="article.iocs && (article.iocs.ips?.length || article.iocs.domains?.length || article.iocs.fileHashes?.length)" class="mb-8">
          <CyberCard variant="purple">
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center text-purple-400">
                <Icon name="heroicons:fingerprint-20-solid" class="w-6 h-6 mr-2" />
                Indicators of Compromise (IOCs)
              </h3>
              
              <div v-if="article.iocs.ips && article.iocs.ips.length > 0" class="mb-4">
                <h4 class="font-semibold text-sm text-gray-400 mb-2">Malicious IP Addresses:</h4>
                <div class="flex flex-wrap gap-2">
                  <CyberBadge 
                    v-for="ip in article.iocs.ips" 
                    :key="ip"
                    variant="danger"
                    size="sm"
                    class="font-mono"
                  >
                    {{ ip }}
                  </CyberBadge>
                </div>
              </div>
              
              <div v-if="article.iocs.domains && article.iocs.domains.length > 0" class="mb-4">
                <h4 class="font-semibold text-sm text-gray-400 mb-2">Malicious Domains:</h4>
                <div class="flex flex-wrap gap-2">
                  <CyberBadge 
                    v-for="domain in article.iocs.domains" 
                    :key="domain"
                    variant="danger"
                    size="sm"
                    class="font-mono"
                  >
                    {{ domain }}
                  </CyberBadge>
                </div>
              </div>
              
              <div v-if="article.iocs.fileHashes && article.iocs.fileHashes.length > 0" class="mb-4">
                <h4 class="font-semibold text-sm text-gray-400 mb-2">File Hashes:</h4>
                <div class="space-y-2">
                  <div 
                    v-for="hash in article.iocs.fileHashes" 
                    :key="hash"
                    class="bg-gray-800 border border-purple-500/30 rounded px-3 py-2 text-xs font-mono text-purple-300 break-all"
                  >
                    {{ hash }}
                  </div>
                </div>
              </div>
            </div>
          </CyberCard>
        </div>
        -->

        <!-- Note: Legacy timeline section - replaced by Events Timeline above -->
        <!--
        <div v-if="article.timeline && article.timeline.length > 0" class="mb-8">
          <h3 class="text-2xl font-bold mb-6 flex items-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            <Icon name="heroicons:clock-20-solid" class="w-6 h-6 mr-2 text-cyan-400" />
            Timeline
          </h3>
          <div class="space-y-4">
            <div v-for="(event, index) in article.timeline" :key="index" class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-10 h-10 bg-cyan-500 border-2 border-cyan-400 rounded-full flex items-center justify-center text-gray-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  {{ index + 1 }}
                </div>
                <div v-if="index < article.timeline.length - 1" class="w-0.5 flex-1 bg-cyan-500/30 my-2"/>
              </div>
              <div class="flex-1 pb-8">
                <div class="text-sm text-cyan-400/80 mb-1">
                  {{ formatDate(event.date) }}
                </div>
                <div class="font-medium text-gray-200">
                  {{ event.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
        -->

        <!-- MITRE ATT&CK Framework -->
        <div v-if="article.mitre_techniques && article.mitre_techniques.length > 0" class="mb-8 no-print">
          <CyberCard variant="info">
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center text-blue-400">
                <Icon name="heroicons:shield-check-20-solid" class="w-6 h-6 mr-2" />
                MITRE ATT&CK Framework
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <a 
                  v-for="technique in article.mitre_techniques" 
                  :key="technique.id"
                  :href="`https://attack.mitre.org/techniques/${technique.id.replace('.', '/')}/`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="bg-gray-900/50 border border-blue-500/30 rounded-lg p-4 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all group"
                >
                  <div class="flex items-start justify-between gap-2 mb-3">
                    <div class="flex items-center gap-2 flex-wrap flex-1">
                      <span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-mono font-semibold">
                        {{ technique.id }}
                      </span>
                      <span class="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                        {{ technique.tactic }}
                      </span>
                    </div>
                    <!-- External link icon -->
                    <Icon name="heroicons:arrow-top-right-on-square-20-solid" class="w-5 h-5 text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <h4 class="text-gray-100 font-medium text-sm group-hover:text-blue-300 transition-colors">{{ technique.name }}</h4>
                </a>
              </div>
            </div>
          </CyberCard>
        </div>

        <!-- Note: Threat Actor not in new schema yet - for future implementation -->
        <!--
        <div v-if="article.threatActor" class="mb-8">
          <CyberCard variant="danger">
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center text-red-400">
                <Icon name="heroicons:user-group-20-solid" class="w-6 h-6 mr-2" />
                Threat Actor Profile
              </h3>
              
              <div class="space-y-3">
                <div v-if="article.threatActor.name">
                  <span class="text-gray-400">Name:</span>
                  <span class="text-red-400 font-semibold ml-2">{{ article.threatActor.name }}</span>
                </div>
                
                <div v-if="article.threatActor.aliases && article.threatActor.aliases.length > 0">
                  <span class="text-gray-400">Also known as:</span>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <CyberBadge 
                      v-for="alias in article.threatActor.aliases" 
                      :key="alias"
                      variant="danger"
                      size="sm"
                    >
                      {{ alias }}
                    </CyberBadge>
                  </div>
                </div>
                
                <div v-if="article.threatActor.attribution">
                  <span class="text-gray-400">Attribution:</span>
                  <span class="text-cyan-300 ml-2">{{ article.threatActor.attribution }}</span>
                </div>
                
                <div v-if="article.threatActor.motivation">
                  <span class="text-gray-400">Motivation:</span>
                  <span class="text-gray-300 ml-2">{{ article.threatActor.motivation }}</span>
                </div>
              </div>
            </div>
          </CyberCard>
        </div>
        -->

        <!-- Full Report (NEW: from new schema) -->
        <div v-if="article.full_report">
          <CyberCard variant="info" class="mb-8 relative">
            <div class="p-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-semibold text-blue-400 flex items-center">
                  <Icon name="heroicons:document-text-20-solid" class="w-5 h-5 mr-2" />
                  Full Report<span v-if="article.updates && article.updates.length > 0" class="text-sm font-normal text-gray-400 ml-2">(when first published)</span>
                </h3>
                <CyberButton
                  variant="primary"
                  size="sm"
                  class="absolute top-4 right-4 z-10"
                  @click="exportMarkdown"
                  title="Export Markdown"
                >
                  <Icon name="heroicons:arrow-down-tray-20-solid" class="w-4 h-4 mr-1" />
                  Export Markdown
                </CyberButton>
              </div>
              <div class="cyber-prose">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-html="renderMarkdown(article.full_report)"/>
              </div>
            </div>
          </CyberCard>
        </div>

        <!-- Sources & References (from new schema) -->
        <div v-if="article.sources && article.sources.length > 0" class="mb-8">
          <CyberCard variant="info">
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center text-blue-400">
                <Icon name="heroicons:link-20-solid" class="w-6 h-6 mr-2" />
                Sources & References<span v-if="article.updates && article.updates.length > 0" class="text-sm font-normal text-gray-400 ml-2">(when first published)</span>
              </h3>
              <div class="space-y-3">
                <div 
                  v-for="(source, idx) in article.sources" 
                  :key="source.source_id || `source-${idx}`"
                  class="bg-gray-800 border border-blue-500/30 rounded-lg p-4"
                >
                  <a 
                    :href="source.url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-blue-400 hover:text-blue-300 font-semibold hover:underline flex items-center gap-2"
                  >
                    {{ source.title }}
                    <Icon name="heroicons:arrow-top-right-on-square-20-solid" class="w-4 h-4 flex-shrink-0" />
                  </a>
                  <div class="text-sm text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{{ source.website || source.root_url || extractDomain(source.url) }}</span>
                    <span v-if="source.date" class="flex items-center gap-1">
                      <span>•</span>
                      <Icon name="heroicons:calendar-20-solid" class="w-3 h-3" />
                      <span>{{ formatDate(source.date) }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CyberCard>
        </div>

        <!-- Social Sharing Buttons -->
        <div class="border-t-2 border-gray-800 pt-8 mt-12 mb-8">
          <div class="relative">
            <!-- Animated glow effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl animate-pulse" />
            
            <div class="relative bg-gray-900 border-2 border-purple-500/30 rounded-lg p-6 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <h3 class="text-xl font-bold mb-2 text-center">
                <span class="inline-block animate-bounce text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                  📢 Share This Article
                </span>
              </h3>
              <p class="text-sm text-gray-400 text-center mb-4">Help others stay informed about cybersecurity threats</p>
              
              <div class="flex justify-center gap-4">
                <!-- Share on X (Twitter) -->
                <CyberButton
                  variant="secondary"
                  size="md"
                  @click="shareOnTwitter"
                  class="flex items-center gap-2 animate-pulse hover:animate-none"
                >
                  <Icon name="simple-icons:x" class="w-5 h-5" />
                  Share on X
                </CyberButton>
                
                <!-- Share on LinkedIn - COMMENTED OUT (not enabled yet) -->
                <!--
                <CyberButton
                  variant="primary"
                  size="md"
                  @click="shareOnLinkedIn"
                  class="flex items-center gap-2 animate-pulse hover:animate-none"
                >
                  <Icon name="simple-icons:linkedin" class="w-5 h-5" />
                  Share on LinkedIn
                </CyberButton>
                -->
              </div>
            </div>
          </div>
        </div>

        <!-- Article Navigation (Previous/Next) -->
        <div v-if="previousArticle || nextArticle" class="border-t-2 border-gray-800 pt-8 mt-8 mb-8">
          <div class="bg-gray-900 border-2 border-cyan-500/30 rounded-lg p-6 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <h3 class="text-lg font-semibold mb-4 text-center text-cyan-400">Continue Reading</h3>
            
            <div class="flex items-center justify-center gap-4">
              <!-- Previous Article -->
              <NuxtLink
                v-if="previousArticle"
                :to="`/articles/${previousArticle.slug}`"
                @click.prevent="navigateToArticle(previousArticle.slug)"
                class="inline-flex items-center justify-center gap-2 px-4 py-2 
                       bg-gray-800/50 hover:bg-cyan-500/10 
                       border border-cyan-500/30 hover:border-cyan-400/50
                       rounded-lg font-medium text-sm text-gray-100
                       transition-all duration-200 cursor-pointer"
              >
                <Icon name="heroicons:arrow-left-20-solid" class="w-4 h-4" />
                Previous
              </NuxtLink>
              
              <!-- Back to Articles List -->
              <NuxtLink
                to="/articles"
                class="inline-flex items-center justify-center gap-2 px-4 py-2 
                       bg-purple-500/20 hover:bg-purple-500/30 
                       border border-purple-500/50 hover:border-purple-400/70
                       rounded-lg font-medium text-sm text-gray-100
                       transition-all duration-200 cursor-pointer"
              >
                <Icon name="heroicons:squares-2x2-20-solid" class="w-4 h-4" />
                All
              </NuxtLink>
              
              <!-- Next Article -->
              <NuxtLink
                v-if="nextArticle"
                :to="`/articles/${nextArticle.slug}`"
                @click.prevent="navigateToArticle(nextArticle.slug)"
                class="inline-flex items-center justify-center gap-2 px-4 py-2 
                       bg-gray-800/50 hover:bg-cyan-500/10 
                       border border-cyan-500/30 hover:border-cyan-400/50
                       rounded-lg font-medium text-sm text-gray-100
                       transition-all duration-200 cursor-pointer"
              >
                Next
                <Icon name="heroicons:arrow-right-20-solid" class="w-4 h-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="pending" class="container mx-auto px-4 py-12 text-center min-h-screen flex items-center justify-center">
      <div>
        <Icon name="heroicons:arrow-path-20-solid" class="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
        <p class="text-gray-400">Loading article...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto px-4 py-12 text-center min-h-screen flex items-center justify-center">
      <div>
        <Icon name="heroicons:exclamation-circle-20-solid" class="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 class="text-2xl font-bold mb-2 text-gray-300">Article Not Found</h2>
        <p class="text-gray-400 mb-4">{{ error.message || 'The article you are looking for does not exist.' }}</p>
        <CyberButton
          variant="cyan"
          size="lg"
          @click="goHome"
        >
          Return to Home
        </CyberButton>
      </div>
    </div>

    <!-- Cyber Footer -->
    <CyberFooter />
  </div>
</template>

<style scoped>
/* Line clamp utility for truncating text */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Cyber-themed prose styling */
.cyber-prose :deep(h1) {
  @apply text-3xl font-bold mt-8 mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400;
}

.cyber-prose :deep(h2) {
  @apply text-2xl font-bold mt-6 mb-3 text-cyan-400;
}

.cyber-prose :deep(h3) {
  @apply text-xl font-semibold mt-4 mb-2 text-purple-400;
}

.cyber-prose :deep(p) {
  @apply mb-4 leading-relaxed text-gray-300;
}

.cyber-prose :deep(ol) {
  @apply list-decimal mb-4 text-gray-300 space-y-3 pl-6;
}

.cyber-prose :deep(ol li) {
  @apply mb-3;
}

.cyber-prose :deep(ul) {
  @apply list-disc mb-4 text-gray-300 space-y-1 pl-6;
}

.cyber-prose :deep(ul li) {
  @apply mb-1;
}

.cyber-prose :deep(ol li ul) {
  @apply mt-2 mb-2 ml-0 space-y-1;
}

.cyber-prose :deep(ul li ul) {
  @apply mt-1 mb-1 ml-0 space-y-1;
}

.cyber-prose :deep(a) {
  @apply text-cyan-400 hover:text-cyan-300 hover:underline transition-colors;
}

.cyber-prose :deep(code) {
  @apply bg-gray-800 border border-cyan-500/30 px-2 py-0.5 rounded text-sm text-cyan-400 font-mono;
}

.cyber-prose :deep(pre) {
  @apply bg-gray-800 border border-cyan-500/30 p-4 rounded-lg overflow-x-auto mb-4 shadow-lg shadow-cyan-500/10;
}

.cyber-prose :deep(pre code) {
  @apply bg-transparent border-0 p-0 text-gray-300;
}

.cyber-prose :deep(blockquote) {
  @apply border-l-4 border-purple-500 pl-4 italic text-gray-400 my-4;
}

.cyber-prose :deep(strong) {
  @apply text-cyan-400 font-bold;
}

.cyber-prose :deep(em) {
  @apply text-purple-400;
}

.cyber-prose :deep(table) {
  @apply w-full border-collapse mb-4;
}

.cyber-prose :deep(th) {
  @apply bg-gray-800 border border-cyan-500/30 px-4 py-2 text-left text-cyan-400 font-semibold;
}

.cyber-prose :deep(td) {
  @apply border border-gray-700 px-4 py-2 text-gray-300;
}

.cyber-prose :deep(hr) {
  @apply border-gray-800 my-6;
}

/* Animated grid background */
@keyframes gridMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

/* ============================================
   PRINT STYLES - Optimized for Print/PDF
   ============================================ */
@media print {
  /* Hide non-essential elements - HIGHEST PRIORITY */
  .no-print {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    overflow: hidden !important;
  }
  
  footer,
  button,
  .animate-pulse,
  .animate-bounce,
  nav,
  .border-t-2,
  .shadow-lg,
  .backdrop-blur-md,
  svg {
    display: none !important;
  }

  /* Show simplified sticky header for print */
  .sticky {
    display: block !important;
    position: static !important;
    background: white !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0.5rem 0 !important;
  }

  /* Hide article title in sticky header */
  .sticky h1,
  .sticky .text-sm.font-semibold {
    display: none !important;
  }

  /* Show only date and print source */
  .sticky .text-xs.text-gray-400 {
    display: block !important;
    color: #666 !important;
    font-size: 10pt !important;
  }

  .sticky .text-xs.text-gray-400::after {
    content: " - Printed from: CyberNetSec.io - https://cyber.netsecops.io";
    font-weight: normal;
  }

  /* Hide navigation buttons in sticky header */
  .sticky .flex.items-center.gap-2 {
    display: none !important;
  }

  /* Reset page styles for print */
  body {
    background: white !important;
    color: black !important;
  }

  /* Main container adjustments */
  .min-h-screen {
    min-height: auto !important;
  }

  /* Hero section - simplify for print */
  .relative.overflow-hidden {
    background: white !important;
    border: none !important;
    padding: 1rem 0 !important;
  }

  /* Hide decorative backgrounds */
  .absolute.inset-0 {
    display: none !important;
  }

  /* Article title */
  h1 {
    color: #000 !important;
    background: none !important;
    -webkit-background-clip: unset !important;
    background-clip: unset !important;
    -webkit-text-fill-color: unset !important;
    page-break-after: avoid;
  }

  h2, h3, h4, h5, h6 {
    color: #000 !important;
    background: none !important;
    -webkit-background-clip: unset !important;
    background-clip: unset !important;
    -webkit-text-fill-color: unset !important;
    page-break-after: avoid;
  }

  /* Regular text */
  p, li, span, div {
    color: #333 !important;
  }

  /* Cards - clean minimal look */
  .bg-gray-900, .bg-gray-800, .bg-gray-950 {
    background: white !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0.5rem !important;
  }

  /* Badges - remove borders, keep text */
  .inline-flex, .flex {
    border: none !important;
    background: transparent !important;
    color: #000 !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  /* Badge separators - add commas between badges */
  .flex-wrap.gap-2 > *:not(:last-child)::after {
    content: ", ";
  }

  /* Hide section labels for Full Report, but keep content */
  h3:has(.heroicons\\:document-text-20-solid) {
    display: none !important;
  }

  /* Hide "Sources & References" label but keep the sources */
  h3:has(.heroicons\\:link-20-solid) {
    display: none !important;
  }

  /* Links - show URLs after external links only */
  a {
    color: #000 !important;
    text-decoration: none !important;
  }

  a[href^="http"]:after {
    content: " (" attr(href) ")";
    font-size: 0.75em;
    color: #666;
    word-break: break-all;
  }

  /* Don't show URLs for internal navigation */
  a[href^="/"]:after,
  a[href^="#"]:after {
    content: "";
  }

  /* Code blocks */
  code, pre {
    background: #f9f9f9 !important;
    border: 1px solid #ddd !important;
    color: #000 !important;
    page-break-inside: avoid;
  }

  /* Tables */
  table {
    border-collapse: collapse !important;
    page-break-inside: avoid;
  }

  th, td {
    border: 1px solid #ccc !important;
    background: white !important;
    color: #000 !important;
    padding: 0.5rem !important;
  }

  /* Avoid breaking inside these elements */
  .cyber-prose, .space-y-4, .space-y-3 {
    page-break-inside: avoid;
  }

  /* Timeline elements - simplified */
  .w-10.h-10 {
    border: 1px solid #666 !important;
    background: white !important;
    color: #000 !important;
    box-shadow: none !important;
  }

  /* Remove all shadows, glows, and borders */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* Card borders - remove completely */
  .rounded-lg, .rounded {
    border: none !important;
  }

  /* Ensure proper spacing */
  .container {
    max-width: 100% !important;
    padding: 0 1rem !important;
  }

  /* Page breaks */
  h1, h2, h3 {
    page-break-after: avoid;
  }

  img {
    page-break-inside: avoid;
    max-width: 100% !important;
  }

  /* Remove animations and transitions */
  * {
    animation: none !important;
    transition: none !important;
  }

  /* Section spacing */
  .mb-8 {
    margin-bottom: 1rem !important;
  }

  /* Grid layouts - simplify to single column */
  .grid {
    display: block !important;
  }

  /* Icons - hide decorative icons */
  svg {
    display: none !important;
  }
}
</style>
