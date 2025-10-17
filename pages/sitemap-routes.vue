<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <!-- This page enables Nuxt to discover all dynamic routes for static generation -->
    <!-- It also serves as a comprehensive sitemap for SEO and user navigation -->
     
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6 text-cyan-400">Site Map</h1>
      <p class="text-gray-300 mb-8">
        Comprehensive index of all cybersecurity intelligence content and resources.
      </p>
      
      <!-- Article Routes -->
      <div v-if="articles" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 text-purple-400 flex items-center">
          <Icon name="heroicons:document-text-20-solid" class="w-6 h-6 mr-2" />
          Security Articles
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          <article v-for="article in articles.articles" :key="article.id" class="border border-gray-800 rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
            <NuxtLink 
              :to="`/articles/${article.slug}`"
              class="block"
            >
              <h3 class="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold mb-2">
                {{ article.headline }}
              </h3>
              <p class="text-gray-400 text-sm mb-2">{{ article.excerpt }}</p>
              <div class="flex items-center text-xs text-gray-500">
                <span>{{ formatDate(article.updatedAt) }}</span>
                <span class="mx-2">•</span>
                <span>{{ article.readingTime }} min read</span>
              </div>
            </NuxtLink>
          </article>
        </div>
      </div>
      
      <!-- Publication Routes -->
      <div v-if="publications" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 text-purple-400 flex items-center">
          <Icon name="heroicons:newspaper-20-solid" class="w-6 h-6 mr-2" />
          Intelligence Publications
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          <article v-for="publication in publications.publications" :key="publication.id" class="border border-gray-800 rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
            <NuxtLink 
              :to="`/publications/${publication.slug}`"
              class="block"
            >
              <h3 class="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold mb-2">
                {{ publication.title }}
              </h3>
              <p class="text-gray-400 text-sm mb-2">{{ publication.summary }}</p>
              <div class="flex items-center text-xs text-gray-500">
                <span>{{ formatDate(publication.publishedAt) }}</span>
                <span class="mx-2">•</span>
                <span>{{ publication.articleCount }} articles</span>
              </div>
            </NuxtLink>
          </article>
        </div>
      </div>
      
      <!-- Main Navigation -->
      <div class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 text-purple-400 flex items-center">
          <Icon name="heroicons:squares-2x2-20-solid" class="w-6 h-6 mr-2" />
          Main Sections
        </h2>
        <div class="grid md:grid-cols-3 gap-4">
          <NuxtLink to="/" class="border border-gray-800 rounded-lg p-4 hover:border-cyan-500/50 transition-colors block">
            <h3 class="text-cyan-400 font-semibold mb-2">Home</h3>
            <p class="text-gray-400 text-sm">Latest cybersecurity threats and intelligence</p>
          </NuxtLink>
          <NuxtLink to="/articles" class="border border-gray-800 rounded-lg p-4 hover:border-cyan-500/50 transition-colors block">
            <h3 class="text-cyan-400 font-semibold mb-2">Articles</h3>
            <p class="text-gray-400 text-sm">In-depth security analysis and reports</p>
          </NuxtLink>
          <NuxtLink to="/publications" class="border border-gray-800 rounded-lg p-4 hover:border-cyan-500/50 transition-colors block">
            <h3 class="text-cyan-400 font-semibold mb-2">Publications</h3>
            <p class="text-gray-400 text-sm">Curated threat intelligence briefings</p>
          </NuxtLink>
        </div>
      </div>
      
      <!-- Legal & Info Pages -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4 text-gray-400">Legal & Information</h2>
        <div class="flex flex-wrap gap-4 text-sm">
          <NuxtLink to="/privacy-policy" class="text-cyan-400 hover:text-cyan-300">Privacy Policy</NuxtLink>
          <NuxtLink to="/terms-of-service" class="text-cyan-400 hover:text-cyan-300">Terms of Service</NuxtLink>
          <NuxtLink to="/disclaimer" class="text-cyan-400 hover:text-cyan-300">Disclaimer</NuxtLink>
        </div>
      </div>
      
      <!-- Hidden Development Links (for route discovery only) -->
      <div class="hidden">
        <NuxtLink to="/font-demo">Font Demo</NuxtLink>
        <NuxtLink to="/test">Test</NuxtLink>
      </div>
    </div>
    
    <!-- Footer -->
    <CyberFooter />
  </div>
</template>

<script setup lang="ts">
// Fetch all articles and publications for route discovery
const { data: articles } = await useArticlesIndex()
const { data: publications } = await usePublicationsIndex()

// Format date helper
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return 'N/A'
  }
}

// SEO configuration
useSeoMeta({
  title: 'Site Map - CyberNetSec.io',
  description: 'Comprehensive index of cybersecurity intelligence articles, publications, and resources from CyberNetSec.io.',
  ogTitle: 'Site Map - CyberNetSec.io',
  ogDescription: 'Browse all cybersecurity articles, threat intelligence publications, and resources.',
  robots: 'index, follow' // This page should be indexed as a sitemap
})

definePageMeta({
  layout: 'cyber',
})
</script>