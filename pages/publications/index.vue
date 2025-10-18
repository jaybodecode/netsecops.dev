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
          <NuxtLink to="/articles" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-purple-500/50 text-purple-300 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
            <Icon name="heroicons:document-text-20-solid" class="w-4 h-4" />
            Articles
          </NuxtLink>
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
        <NuxtLink to="/articles" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/90 border-2 border-purple-500/50 text-purple-300 rounded-lg font-bold uppercase tracking-wider text-sm hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-all backdrop-blur-sm">
          <Icon name="heroicons:document-text-20-solid" class="w-4 h-4" />
          Articles
        </NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          Threat Intelligence Publications
        </h1>
        <p class="text-xl text-cyan-300/80">
          Curated collections of cybersecurity intelligence, weekly digests, and special reports
        </p>
      </div>

      <!-- Publication Type Filters -->
      <!-- Commented out until we have more publication types beyond daily -->
      <!--
      <div v-if="publications && publications.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          :class="[
            'relative overflow-hidden bg-gray-900 border-2 rounded-lg p-4 text-center transition-all group',
            selectedTypes.includes('weekly')
              ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105'
              : 'border-gray-700 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105'
          ]"
          @click="toggleType('weekly')"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          <div class="relative z-10">
            <div class="text-3xl font-black text-cyan-500">{{ weeklyDigestCount }}</div>
            <div class="text-sm text-gray-400 uppercase tracking-wider font-bold">Weekly Digest</div>
            <div v-if="selectedTypes.includes('weekly')" class="text-xs text-cyan-500 font-medium mt-1">● ACTIVE</div>
          </div>
        </button>
        
        <button
          :class="[
            'relative overflow-hidden bg-gray-900 border-2 rounded-lg p-4 text-center transition-all group',
            selectedTypes.includes('daily')
              ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-105'
              : 'border-gray-700 hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-105'
          ]"
          @click="toggleType('daily')"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          <div class="relative z-10">
            <div class="text-3xl font-black text-purple-500">{{ dailyDigestCount }}</div>
            <div class="text-sm text-gray-400 uppercase tracking-wider font-bold">Daily Digest</div>
            <div v-if="selectedTypes.includes('daily')" class="text-xs text-purple-500 font-medium mt-1">● ACTIVE</div>
          </div>
        </button>
        
        <button
          :class="[
            'relative overflow-hidden bg-gray-900 border-2 rounded-lg p-4 text-center transition-all group',
            selectedTypes.includes('special-report')
              ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-105'
              : 'border-gray-700 hover:border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:scale-105'
          ]"
          @click="toggleType('special-report')"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          <div class="relative z-10">
            <div class="text-3xl font-black text-pink-500">{{ specialReportCount }}</div>
            <div class="text-sm text-gray-400 uppercase tracking-wider font-bold">Special Reports</div>
            <div v-if="selectedTypes.includes('special-report')" class="text-xs text-pink-500 font-medium mt-1">● ACTIVE</div>
          </div>
        </button>
      </div>
      -->

      <!-- Loading State -->
      <div v-if="pending" class="space-y-6">
        <!-- Skeleton Publications -->
        <div v-for="i in 2" :key="i" class="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 animate-pulse">
          <div class="h-8 bg-gray-800 rounded w-3/4 mb-3"/>
          <div class="h-4 bg-gray-800 rounded w-1/2 mb-4"/>
          <div class="h-4 bg-gray-800 rounded w-full mb-2"/>
          <div class="h-4 bg-gray-800 rounded w-full"/>
        </div>
      </div>

      <!-- Publications List -->
      <div v-else-if="publications && publications.length > 0" class="space-y-6">
        <div
          v-for="(publication, idx) in sortedPublications"
          :key="publication.id"
          class="relative overflow-hidden bg-gray-900 border-2 border-cyan-500/30 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.25)] transition-all group"
        >
          <NuxtLink :to="`/publications/${publication.slug}`" class="block" @click="markPublicationAsRead(publication.id)">
            <div class="flex items-stretch relative overflow-hidden">
              <!-- Publication Content -->
              <div class="w-full p-6 z-10 relative md:flex-1 md:min-w-0">
                <!-- Title Row -->
                <div class="mb-2">
                  <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 hover:from-pink-400 hover:to-cyan-400 transition-all">
                    {{ publication.title }}
                  </h2>
                </div>

                <p class="text-gray-400 mb-4 line-clamp-3">
                  {{ publication.summary }}
                </p>

                <!-- Metadata -->
                <div class="flex flex-wrap gap-4 text-sm text-cyan-400/80">
                  <div class="flex items-center">
                    <Icon name="heroicons:calendar-20-solid" class="w-4 h-4 mr-1" />
                    {{ formatDate(publication.pub_date || publication.publishedAt) }}
                  </div>
                  <div class="flex items-center">
                    <Icon name="heroicons:document-text-20-solid" class="w-4 h-4 mr-1" />
                    {{ publication.articleCount }} article{{ publication.articleCount > 1 ? 's' : '' }}
                    <span v-if="publication.statusCounts && (publication.statusCounts.new > 0 || publication.statusCounts.updated > 0)" class="ml-2 text-xs text-gray-400">
                      (<template v-if="publication.statusCounts.new > 0">{{ publication.statusCounts.new }} new</template><template v-if="publication.statusCounts.new > 0 && publication.statusCounts.updated > 0">, </template><template v-if="publication.statusCounts.updated > 0">{{ publication.statusCounts.updated }} updated</template>)
                    </span>
                  </div>
                  <div v-if="publication.severityBreakdown" class="flex items-center gap-2">
                    <Icon name="heroicons:shield-exclamation-20-solid" class="w-4 h-4 mr-1" />
                    <span v-if="publication.severityBreakdown.critical > 0" class="text-red-400">
                      {{ publication.severityBreakdown.critical }} Critical
                    </span>
                    <span v-if="publication.severityBreakdown.high > 0" class="text-orange-400">
                      {{ publication.severityBreakdown.high }} High
                    </span>
                  </div>
                </div>

                <!-- Categories Preview -->
                <div v-if="publication.categories && publication.categories.length > 0" class="mt-3 flex flex-wrap gap-2">
                  <span
                    v-for="category in publication.categories.slice(0, 5)"
                    :key="category"
                    class="px-2 py-1 bg-gray-800 border border-cyan-500/30 text-cyan-300 rounded text-xs font-medium hover:border-cyan-500/60 transition-colors"
                  >
                    {{ category }}
                  </span>
                  <span
                    v-if="publication.categories.length > 5"
                    class="px-2 py-1 text-gray-500 text-xs"
                  >
                    +{{ publication.categories.length - 5 }} more
                  </span>
                </div>
              </div>

              <!-- Right Side: Publication Image with Category Badge -->
              <div class="absolute inset-0 md:relative md:w-64 md:flex-shrink-0">
                <!-- Publication Featured Image -->
                <div class="absolute inset-0">
                  <NuxtImg
                    :src="getCategoryImageForPublication(publication)"
                    :alt="publication.title"
                    preset="categoryBg"
                    loading="lazy"
                    class="w-full h-full object-cover opacity-20 md:opacity-60"
                    style="mask: linear-gradient(to right, transparent 0%, black 12%); -webkit-mask: linear-gradient(to right, transparent 0%, black 12%);"
                    @error="(e: any) => { if (e?.target) e.target.src = '/images/categories/other.png' }"
                  />
                </div>

                <!-- Badges Container (overlay on image) -->
                <div class="relative z-10 p-4 flex flex-col justify-between h-full">
                  <!-- READ Badge (top right) -->
                  <div class="flex justify-end">
                    <div
                      v-if="isPublicationRead(publication.id)"
                      class="px-2 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.3)] backdrop-blur-sm"
                    >
                      <Icon name="heroicons:check-circle-20-solid" class="w-4 h-4" />
                    </div>
                  </div>
                  
                  <!-- Type Badge (bottom right) -->
                  <div class="flex justify-end">
                    <span
                      :class="[
                        'px-3 py-1.5 border-2 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm',
                        getTypeBadgeClass(publication.type)
                      ]"
                    >
                      {{ getTypeLabel(publication.type) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

    <!-- Empty State -->
      <div v-else class="text-center py-16">
        <Icon name="heroicons:book-open-20-solid" class="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 class="text-2xl font-bold mb-2 text-gray-300">No Publications Found</h2>
        <p class="text-gray-400 mb-6">
          There are no threat intelligence publications available yet.
        </p>
        <CyberButton as="NuxtLink" to="/articles" variant="cyan" size="md">
          <Icon name="heroicons:document-text-20-solid" class="w-5 h-5 mr-2" />
          Read Advisories
        </CyberButton>
      </div>
    </div>

    <!-- Footer -->
    <CyberFooter 
      :stats="{ 
        total: publications?.length || 0 
      }" 
    />
  </div>
</template>

<script setup lang="ts">
import { getCategoryImageUrl } from '~/utils/images';
import type { PublicationMetadata } from '~/types/cyber';
import type { ArticleCategory } from '~/types/cyber';

definePageMeta({
  layout: 'cyber',
});

// Fetch publications using JSON-based composable
const { data: publicationsData, pending } = usePublicationsIndex();

// Safe accessor
const publications = computed(() => publicationsData.value?.publications || []);

// Filter state - match actual schema types
type PublicationType = 'weekly' | 'daily' | 'special-report' | 'monthly';
const selectedTypes = ref<PublicationType[]>([]);

// Read publications tracking - localStorage (client-side only)
const STORAGE_KEY = 'readPublications';
const readPublications = ref<Record<string, boolean>>({});

// Load read publications from localStorage
const loadReadPublications = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      readPublications.value = JSON.parse(stored);
    }
  } catch {
    // Silent error handling for localStorage
  }
};

// Save read publications to localStorage 
const saveReadPublications = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readPublications.value));
  } catch {
    // Silent error handling for localStorage
  }
};

// Mark a publication as read
const markPublicationAsRead = (publicationId: string) => {
  if (!readPublications.value[publicationId]) {
    readPublications.value[publicationId] = true;
    saveReadPublications();
  }
};

// Check if a publication has been read
const isPublicationRead = (publicationId: string): boolean => {
  return !!readPublications.value[publicationId];
};

// Load read publications on mount (client-side only)
onMounted(() => {
  loadReadPublications();
});

// Sort publications by date (newest first) and apply filters
const sortedPublications = computed(() => {
  if (!publications.value || publications.value.length === 0) return [];

  let filtered = [...publications.value];

  // Apply type filter if any selected
  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter((pub: PublicationMetadata) => selectedTypes.value.includes(pub.type));
  }

  const sorted = filtered.sort((a: PublicationMetadata, b: PublicationMetadata) => {
    const aDate = new Date(a.pub_date || a.publishedAt).getTime();
    const bDate = new Date(b.pub_date || b.publishedAt).getTime();
    return bDate - aDate;
  });
  return sorted;
});

// Count publications by type
const weeklyDigestCount = computed(() => 
  publications.value.filter((pub: PublicationMetadata) => pub.type === 'weekly').length
);

const dailyDigestCount = computed(() => 
  publications.value.filter((pub: PublicationMetadata) => pub.type === 'daily').length
);

const specialReportCount = computed(() => 
  publications.value.filter((pub: PublicationMetadata) => pub.type === 'special-report').length
);

// Filter functions
const toggleType = (type: PublicationType) => {
  const index = selectedTypes.value.indexOf(type);
  if (index > -1) {
    selectedTypes.value.splice(index, 1);
  } else {
    selectedTypes.value.push(type);
  }
};

// Get consistent category image for visual variety (deterministic based on publication ID)
const getCategoryImageForPublication = (publication: PublicationMetadata): string => {
  // Create a simple hash from the publication slug or id for consistency
  const seed = publication.slug || publication.id || publication.pub_date || publication.publishedAt;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const positiveHash = Math.abs(hash);
  
  // If publication has categories, pick one consistently
  if (publication.categories && publication.categories.length > 0) {
    const index = positiveHash % publication.categories.length;
    const category = publication.categories[index] as ArticleCategory;
    return getCategoryImageUrl(category);
  }
  
  // Fallback: consistently pick from common categories
  const fallbackCategories: ArticleCategory[] = [
    'Malware', 'Threat Actor', 'Vulnerability', 'Data Breach', 
    'Ransomware', 'Phishing', 'Cyberattack', 'Cloud Security'
  ];
  const index = positiveHash % fallbackCategories.length;
  return getCategoryImageUrl(fallbackCategories[index]!);
};

// Get type badge styling
const getTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'weekly':
      return 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]';
    case 'daily':
      return 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
    case 'special-report':
      return 'bg-pink-500/20 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]';
    case 'monthly':
      return 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
    default:
      return 'bg-gray-500/20 border-gray-500 text-gray-400';
  }
};

// Get type label
const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'weekly': 'Weekly Digest',
    'daily': 'Daily Digest',
    'special-report': 'Special Report',
    'monthly': 'Monthly Roundup',
  };
  return labels[type] || type;
};

// Format date helper
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    // Always treat as UTC date (YYYY-MM-DD)
    // If dateString is only YYYY-MM-DD, append 'T12:00:00Z' to avoid timezone issues
    let iso = dateString;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      iso = dateString + 'T12:00:00Z';
    }
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

// SEO Meta Tags - handled by composable
usePageSeo({
  title: 'Threat Intelligence Publications',
  description: 'Browse curated cybersecurity intelligence publications including weekly digests, daily updates, and special reports.',
  type: 'CollectionPage',
  keywords: ['cybersecurity publications', 'threat intelligence digest', 'security briefings', 'weekly digest', 'daily updates'],
});

// Breadcrumbs for SEO
useBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'Publications', url: '/publications' },
]);
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>