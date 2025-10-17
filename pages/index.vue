<template>
  <!-- Cyber Theme Landing Page with Parallax Background -->
  <div class="min-h-screen bg-gray-950 text-gray-100 relative">
    <!-- Parallax Fixed Background Banner - Behind Everything -->
    <div class="parallax-bg">
      <NuxtImg
        src="/images/branding/banner.jpg"
        alt="CyberNetSec.io - Cybersecurity Intelligence Hub"
        format="webp"
        quality="70"
        width="2816"
        height="1536"
        sizes="sm:640px md:1024px lg:1920px xl:2816px"
        loading="eager"
        fetchpriority="high"
        placeholder
        class="w-full h-full object-cover"
      />
      <!-- Ghosted Dark Overlay -->
      <div class="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/85 to-gray-950/95"></div>
    </div>

    <!-- All Content - Floats Over Background -->
    <div class="relative z-10">
      <!-- Hero Title Section (replaces CyberHeader) -->
      <div class="container mx-auto px-4 pt-16 pb-8 max-w-6xl text-center">
        <div class="flex items-center justify-center gap-4 mb-4">
          <Icon 
            name="heroicons:shield-check-20-solid" 
            class="w-16 h-16 text-cyan-400 neon-flicker-icon" 
            style="filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.5));"
          />
          <h1 class="text-4xl md:text-5xl font-black tracking-tight neon-flicker-title mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            <span>
              CyberNetSec.io
            </span>
          </h1>
        </div> 
        <p 
          class="text-3xl font-bold text-cyan-300 tracking-wide uppercase neon-flicker-subtitle" 
          style="text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);"
        >
          Your Cybersecurity Intelligence Hub
        </p>
        <div class="mt-4 h-1 w-32 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full mx-auto neon-flicker-line"/>
        
        <!-- Action Buttons -->
                <div class="flex flex-wrap justify-center gap-4 mt-8">
          <NuxtLink to="/articles">
            <button 
              class="inline-flex items-center gap-2 px-6 py-3 
                     bg-cyan-500/10 
                     border-2 border-cyan-500 
                     text-cyan-400 font-bold text-lg rounded-lg uppercase
                     hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-300
                     hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]
                     hover:scale-105
                     transition-all duration-200
                     shadow-[0_0_10px_rgba(34,211,238,0.3)]"
            >
              <Icon 
                name="heroicons:document-text-20-solid" 
                class="w-6 h-6"
              />
              <span>Browse Articles</span>
            </button>
          </NuxtLink>
          <NuxtLink to="/publications">
            <button 
              class="inline-flex items-center gap-2 px-6 py-3 
                     bg-purple-500/10 
                     border-2 border-purple-500 
                     text-purple-400 font-bold text-lg rounded-lg uppercase
                     hover:bg-purple-500/20 hover:border-purple-400 hover:text-purple-300
                     hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]
                     hover:scale-105
                     transition-all duration-200
                     shadow-[0_0_10px_rgba(168,85,247,0.3)]"
            >
              <Icon 
                name="heroicons:newspaper-20-solid" 
                class="w-6 h-6"
              />
              <span>Daily Digests</span>
            </button>
          </NuxtLink>
          <button 
            @click="showEmailModal = true"
            class="inline-flex items-center gap-2 px-6 py-3 
                   bg-pink-500/10 
                   border-2 border-pink-500 
                   text-pink-400 font-bold text-lg rounded-lg uppercase
                   hover:bg-pink-500/20 hover:border-pink-400 hover:text-pink-300
                   hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]
                   hover:scale-105
                   transition-all duration-200
                   shadow-[0_0_10px_rgba(236,72,153,0.3)]"
          >
            <Icon 
              name="heroicons:envelope-20-solid" 
              class="w-6 h-6"
            />
            <span>Subscribe Now</span>
          </button>
          <NuxtLink to="/rss">
            <button 
              class="inline-flex items-center gap-2 px-6 py-3 
                     bg-cyan-500/10 
                     border-2 border-cyan-500 
                     text-cyan-400 font-bold text-lg rounded-lg uppercase
                     hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-300
                     hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]
                     hover:scale-105
                     transition-all duration-200
                     shadow-[0_0_10px_rgba(34,211,238,0.3)]"
            >
              <Icon 
                name="heroicons:rss-20-solid" 
                class="w-6 h-6"
              />
              <span>RSS Feeds</span>
            </button>
          </NuxtLink>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8 max-w-6xl">

      <!-- Top Row: About and Intelligence Summary -->
      <div class="grid lg:grid-cols-2 gap-8 mb-8">
        <!-- About Section -->
        <CyberCard variant="purple" class="h-fit">
          <div class="p-6">
            <div class="text-center mb-6">
              <Icon name="heroicons:shield-check-20-solid" class="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                About Cyber Security Advisory
              </h2>
              <p class="text-gray-300">
                Timely, reliable, and cited sources for daily cybersecurity threat intelligence, vulnerability reports, and security advisories worldwide.
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div class="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 text-center hover:border-cyan-500/60 transition-colors">
                <div class="text-2xl font-black text-cyan-400 mb-1">24/7</div>
                <div class="text-xs text-gray-400 uppercase tracking-wider">Monitoring</div>
              </div>
              <div class="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 text-center hover:border-purple-500/60 transition-colors">
                <div class="text-2xl font-black text-purple-400 mb-1">Daily</div>
                <div class="text-xs text-gray-400 uppercase tracking-wider">Digests</div>
              </div>
              <div class="bg-gray-800/50 border border-pink-500/30 rounded-lg p-4 text-center hover:border-pink-500/60 transition-colors">
                <div class="text-2xl font-black text-pink-400 mb-1">Global</div>
                <div class="text-xs text-gray-400 uppercase tracking-wider">Coverage</div>
              </div>
            </div>
          </div>
        </CyberCard>

        <!-- Intelligence Summary -->
        <CyberCard variant="green" class="h-fit">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-4">
              <Icon name="heroicons:chart-bar-20-solid" class="w-6 h-6 text-green-400" />
              <h3 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
                Intelligence Summary
              </h3>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-green-500/20">
                <span class="text-sm text-gray-300">Active Threats</span>
                <span class="text-lg font-black text-green-400">127</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-yellow-500/20">
                <span class="text-sm text-gray-300">CVEs This Week</span>
                <span class="text-lg font-black text-yellow-400">42</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-red-500/20">
                <span class="text-sm text-gray-300">Critical Alerts</span>
                <span class="text-lg font-black text-red-400">8</span>
              </div>
            </div>
            <div class="mt-6">
              <NuxtLink to="/publications">
                <CyberButton variant="secondary" size="sm" label="View Publications" />
              </NuxtLink>
            </div>
          </div>
        </CyberCard>
      </div>

      <!-- Second Row: Recent Updates, Latest Intelligence, and Threat Level -->
      <div class="grid lg:grid-cols-2 gap-8 mb-8">
        <!-- Recent Updates Widget -->
        <div class="space-y-8">
          <CyberRecentUpdates />
          <!-- <CyberThreatLevel /> -->
        </div>
        
        <!-- Latest Intelligence Section -->
        <CyberCard variant="cyan" class="h-fit">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-4">
              <Icon name="heroicons:document-text-20-solid" class="w-6 h-6 text-cyan-400" />
              <h2 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Latest Intelligence
              </h2>
            </div>
            <p class="text-gray-300 mb-4 text-sm">
              Top 5 latest <span class="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold uppercase">CRITICAL</span> security advisories
            </p>
            
            <!-- Loading State -->
            <div v-if="articlesLoading" class="space-y-3">
              <div v-for="i in 5" :key="i" class="p-3 bg-gray-800/50 rounded-lg border border-gray-700 animate-pulse">
                <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"/>
                <div class="h-3 bg-gray-700 rounded w-1/2"/>
              </div>
            </div>
            
            <!-- Latest Critical Articles -->
            <div v-else-if="latestCriticals && latestCriticals.length > 0" class="space-y-3">
              <NuxtLink 
                v-for="article in latestCriticals" 
                :key="article.id"
                :to="`/articles/${article.slug || article.id}`"
                class="block group"
              >
                <div class="p-3 bg-gray-800/50 rounded-lg border border-red-500/20 hover:border-red-500/60 hover:bg-gray-800/80 transition-all">
                  <div class="flex items-start gap-2 mb-2">
                    <div class="w-2 h-2 bg-red-400 rounded-full animate-pulse mt-1.5 flex-shrink-0"/>
                    <span class="text-sm text-gray-200 font-semibold line-clamp-2 group-hover:text-cyan-400 transition-colors">
                      {{ article.headline }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 flex-wrap text-xs ml-4">
                    <div class="flex items-center gap-1 text-gray-500">
                      <Icon name="heroicons:calendar-20-solid" class="w-3 h-3" />
                      <span>{{ formatDate(article.createdAt) }}</span>
                    </div>
                    <!-- Categories -->
                    <div v-if="article.categories && article.categories.length > 0" class="flex items-center gap-1 flex-wrap">
                      <span
                        v-for="category in article.categories"
                        :key="category"
                        class="px-2 py-0.5 bg-orange-500/20 border border-orange-500/50 text-orange-300 rounded text-xs font-semibold uppercase"
                      >
                        {{ category }}
                      </span>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>
            
            <!-- Empty State -->
            <div v-else class="text-center py-8 text-gray-500">
              <Icon name="heroicons:document-text-20-solid" class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p class="text-sm">No critical articles available</p>
            </div>
          </div>
        </CyberCard>
      </div>
    </div>

    <!-- Footer Removed - Landing page doesn't need footer -->
    </div><!-- End of relative z-10 wrapper -->
  
    <!-- Email Subscription Modal Component -->
    <EmailSubscribeModal v-model="showEmailModal" />
  </div><!-- End of main page wrapper -->
</template>

<script setup lang="ts">
import type { ArticleMetadata } from '~/composables/useArticles'

// Email subscription modal state
const showEmailModal = ref(false)

// Open subscribe modal directly
const openSubscribeModal = () => {
  showEmailModal.value = true
}

// Lazy load non-critical components to reduce main-thread work
const CyberThreatLevel = defineAsyncComponent(() => import('~/components/CyberThreatLevel.vue'))
const CyberRecentUpdates = defineAsyncComponent(() => import('~/components/CyberRecentUpdates.vue'))

// Fetch articles index for Latest Intelligence
const { data: articlesData, pending: articlesLoading } = useArticlesIndex()

// Get latest 5 critical articles
const latestCriticals = computed(() => {
  if (!articlesData.value?.articles) return []
  
  return articlesData.value.articles
    .filter((article: ArticleMetadata) => article.severity === 'critical')
    .sort((a: ArticleMetadata, b: ArticleMetadata) => {
      // Sort by createdAt (publish date) in descending order (newest first)
      const aDate = new Date(a.createdAt).getTime()
      const bDate = new Date(b.createdAt).getTime()
      return bDate - aDate
    })
    .slice(0, 5)
})

// Format date helper
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

definePageMeta({
  layout: 'cyber',
});

// SEO Meta Tags - handled by composable
usePageSeo({
  title: 'Cyber Security Advisory',
  description: 'Timely, reliable, and cited sources for daily cybersecurity threat intelligence, vulnerability reports, and security advisories.',
  type: 'WebPage',
  keywords: ['cybersecurity', 'threat intelligence', 'vulnerability reports', 'security advisories', 'CVE database', 'cyber threats'],
});
</script>

<style scoped>
/* Parallax Fixed Background - Fixed rendering without GPU acceleration */
.parallax-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
  /* Removed will-change to prevent scroll artifacts */
  transform: translateZ(0); /* Force fixed layer */
  backface-visibility: hidden; /* Reduce flicker */
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Neon Flicker Animation - Cyberpunk Style */
@keyframes neonFlicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    opacity: 1;
    filter: brightness(1);
  }
  20%, 24%, 55% {
    opacity: 0.85;
    filter: brightness(0.8);
  }
  22% {
    opacity: 0.7;
    filter: brightness(0.6);
  }
}

@keyframes neonFlickerGlow {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    text-shadow: 
      0 0 20px rgba(34, 211, 238, 0.5),
      0 0 40px rgba(168, 85, 247, 0.3),
      0 0 60px rgba(236, 72, 153, 0.2);
  }
  20%, 24%, 55% {
    text-shadow: 
      0 0 15px rgba(34, 211, 238, 0.4),
      0 0 30px rgba(168, 85, 247, 0.2),
      0 0 45px rgba(236, 72, 153, 0.1);
  }
  22% {
    text-shadow: 
      0 0 10px rgba(34, 211, 238, 0.3),
      0 0 20px rgba(168, 85, 247, 0.15),
      0 0 30px rgba(236, 72, 153, 0.05);
  }
}

@keyframes neonFlickerIcon {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.5)) brightness(1);
  }
  20%, 24%, 55% {
    filter: drop-shadow(0 0 7px rgba(34, 211, 238, 0.4)) brightness(0.85);
  }
  22% {
    filter: drop-shadow(0 0 5px rgba(34, 211, 238, 0.3)) brightness(0.7);
  }
}

@keyframes neonFlickerLine {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    opacity: 1;
    box-shadow: 0 0 15px rgba(34, 211, 238, 0.5);
  }
  20%, 24%, 55% {
    opacity: 0.85;
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
  }
  22% {
    opacity: 0.7;
    box-shadow: 0 0 5px rgba(34, 211, 238, 0.3);
  }
}

/* Apply animations to title elements */
.neon-flicker-title {
  animation: neonFlicker 8s infinite;
}

.neon-flicker-title span {
  animation: neonFlickerGlow 8s infinite;
}

.neon-flicker-subtitle {
  animation: neonFlickerGlow 8s infinite 0.3s;
}

.neon-flicker-icon {
  animation: neonFlickerIcon 8s infinite 0.15s;
}

.neon-flicker-line {
  animation: neonFlickerLine 8s infinite 0.45s;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .neon-flicker-title,
  .neon-flicker-title span,
  .neon-flicker-subtitle,
  .neon-flicker-icon,
  .neon-flicker-line {
    animation: none !important;
  }
}
</style>
