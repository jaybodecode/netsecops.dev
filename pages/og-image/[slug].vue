<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-8">
    <!-- Loading State -->
    <div v-if="pending" class="text-center">
      <Icon name="heroicons:arrow-path-20-solid" class="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
      <p class="text-gray-400">Loading article data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !articleData" class="text-center">
      <Icon name="heroicons:exclamation-circle-20-solid" class="w-12 h-12 mx-auto mb-4 text-red-500" />
      <h2 class="text-2xl font-bold mb-2 text-gray-300">Article Not Found</h2>
      <p class="text-gray-400 mb-4">{{ error?.message || 'The article data could not be loaded.' }}</p>
      <p class="text-sm text-gray-500">Slug: {{ slug }}</p>
    </div>

    <!-- OG Image Card Preview -->
    <div v-else class="space-y-6">
      <!-- Controls -->
      <div class="flex items-center justify-between gap-4 mb-4">
        <div class="text-cyan-400">
          <h1 class="text-2xl font-bold">OG Image Preview</h1>
          <p class="text-sm text-gray-400">{{ slug }}</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="refreshData"
            class="px-4 py-2 bg-cyan-500/20 border-2 border-cyan-500 text-cyan-300 rounded-lg font-bold hover:bg-cyan-500/30 transition-all"
          >
            <Icon name="heroicons:arrow-path-20-solid" class="w-4 h-4 inline mr-2" />
            Refresh
          </button>
          <NuxtLink
            :to="`/articles/${slug}`"
            class="px-4 py-2 bg-purple-500/20 border-2 border-purple-500 text-purple-300 rounded-lg font-bold hover:bg-purple-500/30 transition-all"
          >
            <Icon name="heroicons:eye-20-solid" class="w-4 h-4 inline mr-2" />
            View Article
          </NuxtLink>
        </div>
      </div>

      <!-- Frame showing exact 1200x675 size -->
      <div class="border-4 border-cyan-500/50 rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.3)] inline-block">
        <OGImageCard
          :article="articleData"
          :entities="extractedEntities"
        />
      </div>

      <!-- Info -->
      <div class="max-w-[1200px] bg-gray-900 border border-purple-500/30 rounded-lg p-4 text-sm">
        <div class="grid grid-cols-2 gap-4 text-gray-300">
          <div>
            <strong class="text-purple-400">Dimensions:</strong> 1200×675px (16:9)
          </div>
          <div>
            <strong class="text-purple-400">Severity:</strong> {{ articleData.severity?.toUpperCase() }}
          </div>
          <div>
            <strong class="text-purple-400">Categories:</strong> {{ articleData.categories?.join(', ') || 'None' }}
          </div>
          <div>
            <strong class="text-purple-400">Entities:</strong> {{ extractedEntities.length }} found
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;

// Fetch article data using the same composable as article detail page
const { data: article, pending, error } = await useArticleBySlug(slug);

// Map article to the format expected by OGImageCard
const articleData = computed(() => {
  if (!article.value) return null;
  
  return {
    headline: article.value.headline || article.value.title,
    title: article.value.title,
    severity: article.value.severity,
    categories: article.value.category || [],
    createdAt: article.value.createdAt,
    tags: article.value.category || [],
    tweet_text: article.value.twitter_post || article.value.headline,
  };
});

// Extract entities from tweet text or tags
const extractedEntities = computed(() => {
  if (!articleData.value) return [];
  
  const entities: string[] = [];
  
  // Extract hashtags from tweet text
  if (articleData.value.tweet_text) {
    const hashtags = articleData.value.tweet_text.match(/#\w+/g) || [];
    entities.push(...hashtags);
  }
  
  // Add tags if we need more entities
  if (articleData.value.tags && entities.length < 8) {
    entities.push(...articleData.value.tags.slice(0, 8 - entities.length));
  }
  
  return entities.slice(0, 8);
});

const refreshData = () => {
  // Reload page for SSG
  window.location.reload();
};

// SEO - hide from search engines
useSeoMeta({
  title: `OG Image Preview - ${slug}`,
  robots: 'noindex, nofollow',
});

definePageMeta({
  layout: 'cyber',
});
</script>
