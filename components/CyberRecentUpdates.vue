<template>
  <CyberCard variant="orange" class="h-fit">
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <Icon name="heroicons:arrow-path-20-solid" class="w-6 h-6 text-yellow-400 spinning-icon" />
        <h2 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
          Recent Updates
        </h2>
      </div>
      <p class="text-gray-300 mb-4 text-sm">
        Latest updated security articles
      </p>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="p-3 bg-gray-800/50 rounded-lg border border-gray-700 animate-pulse">
          <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"/>
          <div class="h-3 bg-gray-700 rounded w-1/2"/>
        </div>
      </div>

      <!-- Recent Updates List -->
      <div v-else-if="updatedArticles.length > 0" class="space-y-3">
        <NuxtLink 
          v-for="article in updatedArticles" 
          :key="article.slug"
          :to="`/articles/${article.slug}`"
          class="block group"
        >
          <div class="p-3 bg-gray-800/50 rounded-lg border border-yellow-500/20 hover:border-yellow-500/60 hover:bg-gray-800/80 transition-all">
            <div class="flex items-start gap-2 mb-2">
              <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mt-1.5 flex-shrink-0"/>
              <span class="text-sm text-gray-200 font-semibold line-clamp-2 group-hover:text-yellow-400 transition-colors">
                {{ article.updateTitle || article.originalHeadline }}
              </span>
            </div>
            <div class="flex items-center gap-2 flex-wrap text-xs ml-4">
              <div class="flex items-center gap-1 text-gray-500">
                <Icon name="heroicons:clock-20-solid" class="w-3 h-3" />
                <span>{{ formatDate(article.updatedAt || '') }}</span>
              </div>
              
              <span 
                v-if="article.severity"
                :class="[
                  'px-2 py-0.5 rounded text-xs font-bold uppercase',
                  article.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  article.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  article.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  article.severity === 'low' ? 'bg-green-500/20 text-green-400' :
                  'bg-blue-500/20 text-blue-400'
                ]"
              >
                {{ article.severity }}
              </span>
              
              <!-- CVEs -->
              <div v-if="article.cves && article.cves.length > 0" class="flex items-center gap-1 flex-wrap">
                <span
                  v-for="cve in article.cves.slice(0, 2)"
                  :key="cve"
                  class="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-300 rounded text-xs font-mono font-semibold"
                >
                  {{ cve }}
                </span>
                <span 
                  v-if="article.cves.length > 2" 
                  class="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs"
                >
                  +{{ article.cves.length - 2 }}
                </span>
              </div>
              
              <!-- Categories -->
              <div v-if="article.categories && article.categories.length > 0" class="flex items-center gap-1 flex-wrap">
                <span
                  v-for="category in article.categories.slice(0, 2)"
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
        <p class="text-sm">No recent updates</p>
      </div>
    </div>
  </CyberCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface RecentArticle {
  slug: string
  originalHeadline: string
  updateTitle: string
  updateSummary: string
  severity: string
  publishedAt: string
  updatedAt: string
  categories: string[]
  tags: string[]
  cves?: string[]
  malware?: string[]
}

interface RecentUpdates {
  lastUpdated: string
  runDate: string
  articles: {
    updated: RecentArticle[]
  }
}

const updates = ref<RecentUpdates | null>(null)
const loading = ref(true)

// Computed property to get the updated articles
const updatedArticles = computed(() => {
  return updates.value?.articles?.updated || []
})

const fetchRecentUpdates = async () => {
  try {
    const response = await fetch('/data/last-updates.json')
    if (!response.ok) {
      throw new Error('Failed to fetch recent updates')
    }
    updates.value = await response.json()
  } catch (error) {
    console.error('Error fetching recent updates:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    
    // Normalize both dates to UTC midnight for accurate day comparison
    const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    
    const diffMs = nowUTC - dateUTC
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC'  // Use UTC to match the stored date
      })
    }
  } catch {
    return 'N/A'
  }
}

onMounted(() => {
  fetchRecentUpdates()
})
</script>

<style scoped>
.spinning-icon {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
