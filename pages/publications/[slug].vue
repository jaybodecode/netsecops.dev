<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <!-- Publication Hero -->
    <div v-if="publication" class="relative overflow-hidden bg-gradient-to-br from-cyan-950 via-purple-950 to-gray-950">
      <!-- Animated Grid Background -->
      <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px); background-size: 50px 50px; animation: gridMove 20s linear infinite;"/>
      
      <!-- Navigation Buttons -->
      <div class="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b-2 border-cyan-500/30">
        <div class="container mx-auto px-4 max-w-6xl py-3">
          <div class="flex items-center justify-between gap-3">
            <CyberButton variant="secondary" size="sm" @click="goBack">
              <Icon name="heroicons:arrow-left-20-solid" class="w-4 h-4 mr-2" />
              Back
            </CyberButton>
            <CyberButton variant="secondary" size="sm" @click="goHome">
              <Icon name="heroicons:home-20-solid" class="w-4 h-4 mr-2" />
              Home
            </CyberButton>
          </div>
        </div>
      </div>
      
      <!-- Publication Header -->
      <div class="container mx-auto px-4 max-w-6xl py-16 relative z-10">
        <div class="flex items-center gap-3 mb-6 flex-wrap">
          <CyberBadge variant="info" size="lg" class="flex items-center gap-2">
            <Icon name="heroicons:book-open-20-solid" class="w-5 h-5" />
            {{ getPublicationTypeLabel(publication) }}
          </CyberBadge>
        </div>
        
        <h1 class="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          {{ publication.headline }}
        </h1>
        
        <h2 class="text-xl md:text-2xl font-semibold mb-6 text-cyan-300/90">
          {{ publication.title }}
        </h2>
        
        <!-- Metadata -->
        <div class="flex flex-wrap gap-6 text-sm text-cyan-400/80">
          <div class="flex items-center">
            <Icon name="heroicons:calendar-20-solid" class="w-4 h-4 mr-2" />
            {{ formatDate(publication.publishedAt) }}
          </div>
          <div class="flex items-center">
            <Icon name="heroicons:document-text-20-solid" class="w-4 h-4 mr-2" />
            {{ publicationArticles.length }} article{{ publicationArticles.length > 1 ? 's' : '' }}
          </div>
          <div class="flex items-center">
            <Icon name="heroicons:clock-20-solid" class="w-4 h-4 mr-2" />
            {{ Math.max(10, publicationArticles.length * 3) }} min read
          </div>
        </div>
      </div>
    </div>

    <!-- Publication Content -->
    <div v-if="publication" class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Summary Box -->
      <CyberCard variant="cyan" class="mb-8">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-cyan-400 mb-3 flex items-center">
            <Icon name="heroicons:information-circle-20-solid" class="w-5 h-5 mr-2" />
            Summary
          </h3>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="cyber-prose-small" v-html="renderMarkdown(publication.summary)"/>
        </div>
      </CyberCard>

      <!-- Category Filters (copied from articles/index.vue) -->
      <div v-if="availableCategories.length > 0" class="mb-8">
        <div class="bg-gray-900 border-2 border-purple-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="heroicons:funnel-20-solid" class="w-5 h-5 text-purple-400" />
            <h4 class="font-bold text-purple-300 uppercase tracking-wider text-sm">Filter by Category</h4>
            <span v-if="selectedCategories.length > 0" class="ml-auto text-sm text-cyan-400">
              Showing {{ filteredArticles.length }} of {{ publicationArticles.length }}
            </span>
          </div>

          <!-- Active Filters -->
          <div v-if="selectedCategories.length > 0" class="mb-3 flex flex-wrap gap-2">
            <span class="text-xs font-bold text-purple-400 uppercase tracking-wider">Active:</span>
            <button
              v-for="category in selectedCategories"
              :key="'chip-' + category"
              class="px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 group bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:border-purple-500 hover:shadow-[0_0_10px_rgba(168,85,247,0.4)] uppercase tracking-wider"
              @click="toggleCategory(category)"
            >
              {{ category }}
              <span class="ml-1 text-xs opacity-60">({{ getCategoryCount(category) }})</span>
              <Icon name="heroicons:x-mark-20-solid" class="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
            <button
              v-if="selectedCategories.length > 1"
              class="px-3 py-1.5 rounded text-xs font-bold bg-gray-800 border border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all flex items-center gap-1 uppercase tracking-wider"
              @click="clearAllCategories"
            >
              <Icon name="heroicons:x-circle-20-solid" class="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>
          
          <!-- Category Selection Buttons -->
          <div v-if="unselectedCategories.length > 0" class="flex flex-wrap gap-2">
            <!-- Show All Button -->
            <button
              v-if="selectedCategories.length > 0"
              class="px-3 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 bg-gray-800 border border-cyan-500/30 text-cyan-400 hover:border-cyan-500 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:scale-105 uppercase tracking-wider"
              @click="clearAllCategories"
            >
              <Icon name="heroicons:squares-2x2-20-solid" class="w-4 h-4" />
              Show All
              <span class="ml-1 text-xs opacity-75">({{ publicationArticles.length }})</span>
            </button>

            <!-- Unselected Category Buttons -->
            <button
              v-for="category in unselectedCategories"
              :key="category"
              class="px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-300 hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:scale-105"
              @click="toggleCategory(category)"
            >
              {{ category }}
              <span class="ml-1 text-xs opacity-75">({{ getCategoryCount(category) }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Articles List (copied from articles/index.vue style) -->
      <div class="space-y-6">
        <div
          v-for="article in filteredArticles"
          :key="article.id"
          class="relative overflow-hidden bg-gray-900 border-2 border-purple-500/30 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] transition-all group"
        >
          <NuxtLink :to="`/articles/${article.slug || article.id}`" class="block" @click="markArticleAsRead(article.id)">
            <div class="flex items-stretch relative overflow-hidden">
              <!-- Article Content -->
              <div class="flex-1 min-w-0 p-6 z-10 relative">
                <!-- Title Row with Severity Badge -->
                <div class="flex items-start gap-3 mb-2">
                  <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 hover:from-pink-400 hover:to-cyan-400 transition-all flex-1">
                    {{ article.headline }}
                  </h2>
                  
                  <!-- Severity Badge -->
                  <span
                    v-if="article.severity === 'critical'"
                    class="flex-shrink-0 mt-1 px-3 py-1 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  >
                    CRITICAL
                  </span>
                  <span
                    v-else-if="article.severity === 'high'"
                    class="flex-shrink-0 mt-1 px-3 py-1 bg-orange-500/20 border-2 border-orange-500 text-orange-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                  >
                    HIGH
                  </span>
                  <span
                    v-else-if="['medium', 'low'].includes(article.severity || '')"
                    class="flex-shrink-0 mt-1 px-3 py-1 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                  >
                    {{ article.severity?.toUpperCase() }}
                  </span>
                  <span
                    v-else-if="article.severity === 'informational'"
                    class="flex-shrink-0 mt-1 px-3 py-1 bg-blue-500/20 border-2 border-blue-500 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  >
                    INFORMATIONAL
                  </span>
                </div>
                
                <h3 class="text-lg text-gray-300 mb-3 font-semibold">
                  {{ article.title }}
                </h3>

                <p class="text-gray-400 mb-4 line-clamp-2">
                  {{ article.excerpt }}
                </p>

                <!-- Metadata -->
                <div class="flex flex-wrap gap-4 text-sm text-cyan-400/80">
                  <div class="flex items-center">
                    <Icon name="heroicons:calendar-20-solid" class="w-4 h-4 mr-1" />
                    {{ formatDate(article.publishedAt) }}
                  </div>
                  <div class="flex items-center">
                    <Icon name="heroicons:clock-20-solid" class="w-4 h-4 mr-1" />
                    {{ article.readingTime }} min read
                  </div>
                  <div v-if="article.author" class="flex items-center">
                    <Icon name="heroicons:user-circle-20-solid" class="w-4 h-4 mr-1" />
                    {{ article.author.name }}
                  </div>
                </div>

                <!-- Tags Preview -->
                <div v-if="article.tags && article.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
                  <span
                    v-for="tag in article.tags.slice(0, 5)"
                    :key="tag"
                    class="px-2 py-1 bg-gray-800 border border-purple-500/30 text-purple-300 rounded text-xs font-medium hover:border-purple-500/60 transition-colors"
                  >
                    {{ tag }}
                  </span>
                  <span
                    v-if="article.tags.length > 5"
                    class="px-2 py-1 text-gray-500 text-xs"
                  >
                    +{{ article.tags.length - 5 }} more
                  </span>
                </div>
              </div>

              <!-- Right Side: Category Image with Badges -->
              <div class="relative w-64 flex-shrink-0">
                <!-- Category Image -->
                <div class="absolute inset-0">
                  <NuxtImg
                    :src="getArticleImageUrl(article.categories)"
                    :alt="article.headline"
                    loading="lazy"
                    class="w-full h-full object-cover opacity-60"
                    style="mask: linear-gradient(to right, transparent 0%, black 12%); -webkit-mask: linear-gradient(to right, transparent 0%, black 12%);"
                    @error="handleImageError"
                  />
                </div>

                <!-- Badges Container -->
                <div class="relative z-10 p-4 flex flex-col h-full">
                  <!-- READ Badge -->
                  <div
                    v-if="isArticleRead(article.id)"
                    class="px-3 py-1.5 bg-green-500/20 border border-green-500/50 text-green-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.3)] backdrop-blur-sm self-end"
                  >
                    <Icon name="heroicons:check-circle-20-solid" class="w-4 h-4" />
                    READ
                  </div>
                  
                  <!-- Category Badges -->
                  <div v-if="article.categories && article.categories.length > 0" class="flex flex-row items-center gap-1 justify-end mt-auto">
                    <div
                      v-for="category in article.categories"
                      :key="category"
                      class="px-2 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm whitespace-nowrap"
                    >
                      {{ category }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Social Sharing Buttons -->
      <SocialShareButtons 
        v-if="publication"
        :content="publication" 
        contentType="publication" 
      />
    </div>

    <!-- Loading State -->
    <div v-else-if="pending" class="container mx-auto px-4 py-12 text-center min-h-screen flex items-center justify-center">
      <div>
        <Icon name="heroicons:arrow-path-20-solid" class="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
        <p class="text-gray-400">Loading publication...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto px-4 py-12 text-center min-h-screen flex items-center justify-center">
      <div>
        <Icon name="heroicons:exclamation-circle-20-solid" class="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 class="text-2xl font-bold mb-2 text-gray-300">Publication Not Found</h2>
        <p class="text-gray-400 mb-4">{{ error.message || 'The publication you are looking for does not exist.' }}</p>
        <CyberButton variant="cyan" size="lg" @click="goHome">
          Return to Home
        </CyberButton>
      </div>
    </div>

    <!-- Footer -->
    <CyberFooter />
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked';
import { getArticleImageUrl } from '~/utils/images';
import type { ArticleMetadata } from '~/composables/useArticles';

const route = useRoute();
const router = useRouter();
const publicationSlug = route.params.slug as string;

// Fetch publication data
const { data: rawPublication, pending: pubPending, error: pubError } = usePublication(publicationSlug);

// localStorage keys (shared with articles page)
const CATEGORIES_STORAGE_KEY = 'selectedCategories';
const STORAGE_KEY = 'readArticles';

// Category filtering state
const selectedCategories = ref<string[]>([]);
const readArticles = ref<Record<string, boolean>>({});

// Load from localStorage
const loadSelectedCategories = () => {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (stored) {
      selectedCategories.value = JSON.parse(stored);
    }
  } catch {
    // Silent error
  }
};

const saveSelectedCategories = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(selectedCategories.value));
  } catch {
    // Silent error
  }
};

const loadReadArticles = () => {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      readArticles.value = JSON.parse(stored);
    }
  } catch {
    // Silent error
  }
};

const saveReadArticles = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readArticles.value));
  } catch {
    // Silent error
  }
};

// Load on mount
onMounted(() => {
  loadSelectedCategories();
  loadReadArticles();
});

// Transform publication data to match expected format
const publication = computed(() => {
  if (!rawPublication.value) return null;
  const raw = rawPublication.value as any;
  
  // Map new schema fields to expected format
  return {
    ...raw,
    headline: raw.headline || raw.title,  // headline is already in schema
    title: raw.headline || raw.title,      // Use headline as title
    summary: raw.summary,                  // summary is already correct
    publishedAt: raw.pub_date,             // pub_date -> publishedAt
    articles: raw.articles?.map((a: any) => a.id) || [],  // Extract IDs from article objects
  };
});

// Get articles for this publication
const publicationArticles = computed(() => {
  if (!rawPublication.value) return [];
  
  const raw = rawPublication.value as any;
  
  // Articles are already embedded as full objects in the new schema
  if (raw.articles && Array.isArray(raw.articles) && raw.articles.length > 0) {
    // Map fields to match ArticleMetadata interface
    return raw.articles
      .map((article: any) => ({
        ...article,
        excerpt: article.excerpt || article.summary,
        publishedAt: article.createdAt,
        readingTime: article.readingTime || article.reading_time_minutes || 3,
      }))
      .sort((a: any, b: any) => {
        const severityOrder: Record<string, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
          informational: 4,
        };
        const aSev = (a.severity || 'informational').toLowerCase();
        const bSev = (b.severity || 'informational').toLowerCase();
        return (severityOrder[aSev] ?? 4) - (severityOrder[bSev] ?? 4);
      });
  }
  
  return [];
});

// Category filtering logic (from articles/index.vue)
const availableCategories = computed(() => {
  if (!publicationArticles.value.length) return [];
  const categories = new Set<string>();
  publicationArticles.value.forEach((article: any) => {
    if (article.categories && article.categories.length > 0) {
      article.categories.forEach((cat: string) => categories.add(cat));
    }
  });
  return Array.from(categories).sort();
});

const unselectedCategories = computed(() => {
  return availableCategories.value.filter(
    category => !selectedCategories.value.includes(category)
  );
});

const filteredArticles = computed(() => {
  if (!publicationArticles.value.length) return [];
  if (selectedCategories.value.length === 0) return publicationArticles.value;
  
  return publicationArticles.value.filter((article: any) => {
    if (!article.categories || !Array.isArray(article.categories)) return false;
    return article.categories.some((cat: string) => selectedCategories.value.includes(cat));
  });
});

const toggleCategory = (category: string) => {
  const index = selectedCategories.value.indexOf(category);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(category);
  }
  saveSelectedCategories();
};

const clearAllCategories = () => {
  selectedCategories.value = [];
  saveSelectedCategories();
};

const getCategoryCount = (category: string): number => {
  return publicationArticles.value.filter((a: any) => 
    a.categories && a.categories.includes(category)
  ).length;
};

// Read articles tracking
const markArticleAsRead = (articleId: string) => {
  if (!readArticles.value[articleId]) {
    readArticles.value[articleId] = true;
    saveReadArticles();
  }
};

const isArticleRead = (articleId: string): boolean => {
  return !!readArticles.value[articleId];
};

// Image error handling
const handleImageError = (payload: string | Event) => {
  if (payload instanceof Event) {
    const target = payload.target as HTMLImageElement;
    if (target && target.src && !target.src.includes('/other.png')) {
      const originalSrc = target.src;
      if (originalSrc.includes('_ipx')) {
        const pathMatch = originalSrc.match(/_ipx\/[^/]+(.+)$/);
        if (pathMatch && pathMatch[1]) {
          target.src = pathMatch[1];
          return;
        }
      }
      target.src = '/images/categories/other.png';
    }
  }
};

const pending = computed(() => pubPending.value);
const error = computed(() => pubError.value);

// Navigation
const goBack = () => router.push('/publications');
const goHome = () => router.push('/');

// Helpers
const renderMarkdown = (markdown: string) => {
  if (!markdown) return '';
  return marked(markdown);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return 'N/A';
  }
};

// Get publication type label
const getPublicationTypeLabel = (pub: any) => {
  const raw = rawPublication.value as any;
  const type = raw?.type || 'daily';
  const labels: Record<string, string> = {
    'daily': 'Daily Digest',
    'weekly': 'Weekly Digest',
    'monthly': 'Monthly Roundup',
    'special-report': 'Special Report',
  };
  return labels[type] || 'Publication';
};

// SEO Meta Tags - handled by composable
watch(rawPublication, (newPub) => {
  if (newPub) {
    usePublicationSeo(newPub as any);
  }
}, { immediate: true });

definePageMeta({
  layout: 'cyber',
});
</script>

<style scoped>
.cyber-prose-small :deep(p) {
  @apply mb-3 leading-relaxed text-gray-300 text-sm;
}

.cyber-prose-small :deep(ul) {
  @apply list-disc list-inside mb-3 text-gray-300 text-sm space-y-1;
}

.cyber-prose-small :deep(strong) {
  @apply text-cyan-400 font-semibold;
}

@keyframes gridMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}
</style>
