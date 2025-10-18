<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">

    <!-- Cyberpunk Header -->
    <CyberHeader>
      <!-- Desktop buttons - inside header -->
      <div class="hidden md:block">
        <div class="absolute top-16 left-4 z-20">
          <NuxtLink to="/" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-cyan-500/50 text-cyan-400 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
            <Icon name="heroicons:home-20-solid" class="w-4 h-4" />
            Home
          </NuxtLink>
        </div>
        
        <div class="absolute top-16 right-4 z-20">
          <button @click="showEmailModal = true" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-purple-500/50 text-purple-300 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
            <Icon name="heroicons:envelope-20-solid" class="w-4 h-4" />
            Email Subscribe
          </button>
        </div>
      </div>
    </CyberHeader>

    <!-- Mobile Navigation (Outside Header) -->
    <div class="md:hidden px-4 py-4 bg-gray-950 border-b border-gray-800">
      <div class="flex justify-between items-center max-w-6xl mx-auto gap-4">
        <NuxtLink to="/" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-cyan-500/50 text-cyan-400 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
          <Icon name="heroicons:home-20-solid" class="w-4 h-4" />
          Home
        </NuxtLink>
        <button @click="showEmailModal = true" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-purple-500/50 text-purple-300 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
          <Icon name="heroicons:envelope-20-solid" class="w-4 h-4" />
          Email Subscribe
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          RSS Feed Subscriptions
        </h1>
        <p class="text-xl text-cyan-300/80">
          Stay updated with cybersecurity threat intelligence
        </p>
      </div>

        <!-- What is RSS Section -->
        <section class="mt-8">
          <div class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-6">
            <div class="flex items-center gap-3 mb-4">
              <Icon name="heroicons:rss-20-solid" class="w-8 h-8 text-cyan-400" />
              <h2 class="text-2xl font-bold text-cyan-400">What is RSS?</h2>
            </div>
            <p class="text-gray-300 text-lg leading-relaxed mb-4">
              RSS (Really Simple Syndication) allows you to receive automatic updates 
              whenever new content is published. Use an RSS reader like Feedly, Inoreader, 
              or NetNewsWire to subscribe to our feeds and get instant notifications about 
              cybersecurity threats, vulnerabilities, and intelligence reports.
            </p>
            <div class="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
              <p class="text-sm text-gray-300 leading-relaxed m-0">
                <strong class="text-cyan-400">Note:</strong> RSS feeds are static XML files that update daily by 9:30 AM CST. 
                Please configure your RSS client to fetch once per day after 9:30 AM.<br/>
                <strong class="text-yellow-400">Clients polling hourly or more frequently will have their IP addresses blocked.</strong> 
                Thank you for being considerate of our server resources!
              </p>
            </div>
          </div>
        </section>

        <!-- Main Feeds Section -->
        <section class="mt-8">
          <div class="flex items-center gap-3 mb-4">
            <Icon name="heroicons:newspaper-20-solid" class="w-7 h-7 text-cyan-400" />
            <h2 class="text-2xl font-bold text-cyan-400">Main Feeds</h2>
          </div>
          
          <div class="space-y-4">
            <!-- All Publications Feed -->
            <CyberCard>
              <div class="p-6">
                <div class="flex items-center gap-3 mb-4">
                  <Icon name="heroicons:document-text-20-solid" class="w-6 h-6 text-cyan-400" />
                  <h3 class="text-xl font-bold text-white">All Publications</h3>
                  <CyberBadge>Updated Daily</CyberBadge>
                </div>
                <p class="text-gray-300 mb-4">
                  Latest 5 publications: daily digests, weekly roundups, monthly reports, and special reports
                </p>
              <div class="flex gap-3 mb-3">
                <input 
                  type="text" 
                  readonly 
                  :value="baseUrl + '/rss/all.xml'"
                  @click="selectInput"
                  class="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded font-mono text-sm text-gray-300 cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <CyberButton @click="copyFeedUrl('/rss/all.xml')">
                  {{ copiedFeed === '/rss/all.xml' ? '✓ Copied' : 'Copy' }}
                </CyberButton>
              </div>
                <div v-if="metadata" class="flex gap-6 text-sm text-gray-400">
                  <span>{{ metadata.feeds.all.item_count }} items in feed</span>
                  <span>Updated: {{ formatDate(metadata.feeds.all.last_updated) }}</span>
                </div>
              </div>
            </CyberCard>

            <!-- All Articles Feed -->
            <CyberCard>
              <div class="p-6">
                <div class="flex items-center gap-3 mb-4">
                  <Icon name="heroicons:document-duplicate-20-solid" class="w-6 h-6 text-purple-400" />
                  <h3 class="text-xl font-bold text-white">All Articles</h3>
                  <div class="flex gap-2">
                    <CyberBadge>New</CyberBadge>
                    <CyberBadge variant="warning">Updated</CyberBadge>
                  </div>
                </div>
                <p class="text-gray-300 mb-4">
                  All articles including newly published and recently updated threat intelligence reports
                </p>
                <div class="flex gap-3 mb-3">
                  <input 
                    type="text" 
                    readonly 
                    :value="baseUrl + '/rss/updates.xml'"
                    @click="selectInput"
                    class="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded font-mono text-sm text-gray-300 cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <CyberButton @click="copyFeedUrl('/rss/updates.xml')">
                    {{ copiedFeed === '/rss/updates.xml' ? '✓ Copied' : 'Copy' }}
                  </CyberButton>
                </div>
                <div v-if="metadata" class="flex gap-6 text-sm text-gray-400">
                  <span>{{ metadata.feeds.updates.item_count }} items in last feed</span>
                  <span>Updated: {{ formatDate(metadata.feeds.updates.last_updated) }}</span>
                </div>
              </div>
            </CyberCard>
          </div>
        </section>

        <!-- Category Feeds Section -->
        <section class="mt-8">
          <div class="flex items-center gap-3 mb-3">
            <Icon name="heroicons:folder-open-20-solid" class="w-7 h-7 text-cyan-400" />
            <h2 class="text-2xl font-bold text-cyan-400">Category-Specific Feeds</h2>
          </div>
          <p class="text-gray-400 mb-4">Subscribe to specific threat categories relevant to your interests</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CyberCard 
              v-for="category in categoryFeeds" 
              :key="category.slug"
            >
              <div class="p-5">
                <div class="flex items-center gap-3 mb-3">
                  <Icon name="heroicons:tag-20-solid" class="w-6 h-6 text-purple-400" />
                  <h3 class="text-lg font-bold text-white">{{ category.title }}</h3>
                </div>
                <p class="text-gray-300 text-sm mb-4">{{ category.description }}</p>
                <div class="flex gap-3 mb-3">
                  <input 
                    type="text" 
                    readonly 
                    :value="baseUrl + category.url"
                    @click="selectInput"
                    class="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded font-mono text-xs text-gray-300 cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <CyberButton @click="copyFeedUrl(category.url)" size="sm">
                    {{ copiedFeed === category.url ? '✓' : 'Copy' }}
                  </CyberButton>
                </div>
              </div>
            </CyberCard>
          </div>
        </section>

        <!-- How to Subscribe Section -->
        <section class="mt-8">
          <div class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-6">
            <div class="flex items-center gap-3 mb-4">
              <Icon name="heroicons:book-open-20-solid" class="w-8 h-8 text-cyan-400" />
              <h2 class="text-2xl font-bold text-cyan-400">How to Subscribe</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Step 1 -->
              <div class="flex gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">Choose an RSS Reader</h3>
                  <ul class="space-y-1 text-sm text-gray-300">
                    <li><a href="https://feedly.com" target="_blank" rel="noopener" class="text-cyan-400 hover:underline">Feedly</a> (Web, iOS, Android)</li>
                    <li><a href="https://www.inoreader.com" target="_blank" rel="noopener" class="text-cyan-400 hover:underline">Inoreader</a> (Web, iOS, Android)</li>
                    <li><a href="https://netnewswire.com" target="_blank" rel="noopener" class="text-cyan-400 hover:underline">NetNewsWire</a> (macOS, iOS)</li>
                    <li><a href="https://reederapp.com" target="_blank" rel="noopener" class="text-cyan-400 hover:underline">Reeder</a> (macOS, iOS)</li>
                  </ul>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="flex gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">Copy Feed URL</h3>
                  <p class="text-sm text-gray-300">
                    Click the "Copy" button next to any feed above to copy its URL to your clipboard
                  </p>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="flex gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">Add to Your Reader</h3>
                  <p class="text-sm text-gray-300">
                    Paste the URL into your RSS reader's "Add Feed" or "Subscribe" function
                  </p>
                </div>
              </div>

              <!-- Step 4 -->
              <div class="flex gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">Stay Updated</h3>
                  <p class="text-sm text-gray-300">
                    Your reader will automatically check for new content and notify you of updates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- FAQ Section -->
        <section class="mt-8 mb-8">
          <div class="bg-gray-900/50 rounded-lg border border-purple-500/20 p-6">
            <div class="flex items-center gap-3 mb-4">
              <Icon name="heroicons:question-mark-circle-20-solid" class="w-8 h-8 text-cyan-400" />
              <h2 class="text-2xl font-bold text-cyan-400">Frequently Asked Questions</h2>
            </div>
            
            <div class="space-y-4">
              <details class="group">
                <summary class="cursor-pointer font-semibold text-white hover:text-cyan-400 transition-colors py-3 border-b border-gray-700 flex items-center justify-between">
                  <span>How often are feeds updated?</span>
                  <Icon name="heroicons:chevron-down-20-solid" class="w-5 h-5 text-cyan-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div class="py-4 text-gray-300 leading-relaxed">
                  <p class="mb-3">
                    <strong class="text-white">All feeds update before 9:30 AM CST, 7 days per week</strong>
                  </p>
                  <p class="text-sm">
                    <strong class="text-white">All Publications</strong> includes:<br>
                    • Daily digests (published 7 days/week)<br>
                    • Weekly roundups<br>
                    • Monthly reports<br>
                    • Special reports
                  </p>
                </div>
              </details>
              
              <details class="group">
                <summary class="cursor-pointer font-semibold text-white hover:text-cyan-400 transition-colors py-3 border-b border-gray-700 flex items-center justify-between">
                  <span>Can I subscribe to multiple feeds?</span>
                  <Icon name="heroicons:chevron-down-20-solid" class="w-5 h-5 text-cyan-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div class="py-4 text-gray-300 leading-relaxed">
                  <p>
                    Yes! You can subscribe to as many feeds as you like. We recommend subscribing to 
                    "All Articles" for complete coverage of all threat intelligence, plus any specific category feeds 
                    that match your particular interests.
                  </p>
                </div>
              </details>
              
              <details class="group">
                <summary class="cursor-pointer font-semibold text-white hover:text-cyan-400 transition-colors py-3 border-b border-gray-700 flex items-center justify-between">
                  <span>What's the difference between publications and articles?</span>
                  <Icon name="heroicons:chevron-down-20-solid" class="w-5 h-5 text-cyan-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div class="py-4 text-gray-300 leading-relaxed">
                  <p>
                    <strong class="text-white">Publications</strong> are curated collections (like daily digests or weekly roundups) 
                    that group multiple related articles. <strong class="text-white">Articles</strong> are individual threat intelligence 
                    reports. The "All Publications" feed shows our curated collections, while the "All Articles" feed shows 
                    individual articles tagged as NEW or UPDATED.
                  </p>
                </div>
              </details>
              
              <details class="group">
                <summary class="cursor-pointer font-semibold text-white hover:text-cyan-400 transition-colors py-3 border-b border-gray-700 flex items-center justify-between">
                  <span>How are NEW and UPDATED articles distinguished?</span>
                  <Icon name="heroicons:chevron-down-20-solid" class="w-5 h-5 text-cyan-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div class="py-4 text-gray-300 leading-relaxed">
                  <p>
                    In the "All Articles" feed, each article is tagged as either <strong class="text-white">NEW</strong> (freshly published) 
                    or <strong class="text-white">UPDATED</strong> (existing article with new information). Updated articles will have 
                    "[UPDATED]" in the title and include details about what changed, such as new IOCs, additional victims, or 
                    mitigation details.
                  </p>
                </div>
              </details>

              <details class="group">
                <summary class="cursor-pointer font-semibold text-white hover:text-cyan-400 transition-colors py-3 border-b border-gray-700 flex items-center justify-between">
                  <span>Are RSS feeds free?</span>
                  <Icon name="heroicons:chevron-down-20-solid" class="w-5 h-5 text-cyan-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div class="py-4 text-gray-300 leading-relaxed">
                  <p>
                    Yes! All our RSS feeds are completely free. No registration, no email required. 
                    Just copy the feed URL and add it to your RSS reader.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </section>

    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="showToast" class="toast">
        ✓ Feed URL copied to clipboard!
      </div>
    </Transition>

    </div>

    <!-- Footer -->
    <CyberFooter />

    <!-- Email Subscribe Modal -->
    <EmailSubscribeModal v-model="showEmailModal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Extend Window interface for Google Tag Manager dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}

// SEO Meta Tags - handled by composable
usePageSeo({
  title: 'RSS Feed Subscriptions',
  description: 'Subscribe to CyberNetSec RSS feeds for real-time cybersecurity threat intelligence, CVE alerts, ransomware tracking, data breach notifications, and daily security digests. Updated before 9:30 AM CST daily.',
  type: 'WebPage',
  keywords: [
    'RSS feeds',
    'cybersecurity RSS',
    'threat intelligence feeds',
    'security alerts RSS',
    'vulnerability updates',
    'cybersecurity news feed',
    'infosec RSS',
    'cyber threat feed',
    'security advisories RSS',
    'CVE RSS feed',
    'malware feed',
    'ransomware alerts',
    'data breach notifications',
    'CISA alerts RSS',
    'Feedly cybersecurity',
    'Inoreader security feeds'
  ],
})

// Breadcrumbs for SEO
useBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'RSS Feeds', url: '/rss' },
])

interface FeedMetadata {
  generated_at: string
  feeds: {
    all: {
      title: string
      description: string
      url: string
      full_url: string
      item_count: number
      last_updated: string
      update_frequency: string
    }
    updates: {
      title: string
      description: string
      url: string
      full_url: string
      item_count: number
      last_updated: string
      update_frequency: string
    }
    categories: Array<{
      slug: string
      title: string
      description: string
      url: string
      full_url: string
      item_count: number
      article_count: number
      last_updated: string
      icon: string
    }>
  }
  statistics: {
    total_feeds: number
    total_articles: number
    total_publications: number
    categories_count: number
    last_pipeline_run: string
  }
}

const baseUrl = 'https://cyber.netsecops.io'
const copiedFeed = ref<string | null>(null)
const showToast = ref(false)
const showEmailModal = ref(false)

// Static category feeds - these URLs don't change
const categoryFeeds = [
  { slug: 'threat-actor', title: 'Threat Actor', description: 'Latest threat actor threat intelligence', url: '/rss/categories/threat-actor.xml' },
  { slug: 'data-breach', title: 'Data Breach', description: 'Latest data breach threat intelligence', url: '/rss/categories/data-breach.xml' },
  { slug: 'vulnerability', title: 'Vulnerability', description: 'Latest vulnerability threat intelligence', url: '/rss/categories/vulnerability.xml' },
  { slug: 'ransomware', title: 'Ransomware', description: 'Latest ransomware threat intelligence', url: '/rss/categories/ransomware.xml' },
  { slug: 'cloud-security', title: 'Cloud Security', description: 'Latest cloud security threat intelligence', url: '/rss/categories/cloud-security.xml' },
  { slug: 'supply-chain-attack', title: 'Supply Chain Attack', description: 'Latest supply chain attack threat intelligence', url: '/rss/categories/supply-chain-attack.xml' },
  { slug: 'malware', title: 'Malware', description: 'Latest malware threat intelligence', url: '/rss/categories/malware.xml' },
  { slug: 'phishing', title: 'Phishing', description: 'Latest phishing threat intelligence', url: '/rss/categories/phishing.xml' },
  { slug: 'zero-day', title: 'Zero-Day', description: 'Latest zero-day threat intelligence', url: '/rss/categories/zero-day.xml' },
  { slug: 'apt', title: 'APT', description: 'Latest advanced persistent threat intelligence', url: '/rss/categories/apt.xml' },
  { slug: 'ddos', title: 'DDoS', description: 'Latest DDoS attack threat intelligence', url: '/rss/categories/ddos.xml' },
  { slug: 'insider-threat', title: 'Insider Threat', description: 'Latest insider threat intelligence', url: '/rss/categories/insider-threat.xml' },
  { slug: 'iot-security', title: 'IoT Security', description: 'Latest IoT security threat intelligence', url: '/rss/categories/iot-security.xml' },
]

// Load feed metadata
const { data: metadata } = await useFetch<FeedMetadata>('/rss/metadata.json')

const copyFeedUrl = async (url: string) => {
  const fullUrl = baseUrl + url
  
  // Track RSS feed copy in Google Tag Manager
  if (process.client && window.dataLayer) {
    const feedName = url.split('/').pop()?.replace('.xml', '') || 'unknown'
    const feedType = url.includes('/categories/') ? 'category' : 'main'
    
    window.dataLayer.push({
      event: 'rss_feed_copy',
      feed_url: url,
      feed_name: feedName,
      feed_type: feedType,
      full_url: fullUrl
    })
  }
  
  try {
    await navigator.clipboard.writeText(fullUrl)
    copiedFeed.value = url
    showToast.value = true
    
    // Reset after 2 seconds
    setTimeout(() => {
      copiedFeed.value = null
    }, 2000)
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  } catch (error) {
    console.error('Failed to copy:', error)
    alert('Feed URL: ' + fullUrl)
  }
}

const selectInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.select()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, rgb(6 182 212) 0%, rgb(168 85 247) 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 10px 40px rgba(6, 182, 212, 0.3);
  z-index: 1000;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  transform: translateY(100px);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(100px);
  opacity: 0;
}

@media (max-width: 768px) {
  .toast {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
  }
}
</style>
