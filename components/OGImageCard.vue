<template>
  <!-- Exact 1200x675 card with data-testid for screenshot targeting -->
  <div 
    class="og-image-card w-[1200px] h-[675px] bg-gray-950 overflow-hidden relative flex items-center justify-center"
    data-testid="og-image-card"
  >
    <!-- Cyber grid background -->
    <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px); background-size: 50px 50px;"/>
    
    <!-- Main card (matches article index style) -->
    <div class="relative overflow-hidden bg-gray-900 border-2 border-purple-500/50 rounded-lg shadow-[0_0_25px_rgba(168,85,247,0.25)] w-[1140px] h-[615px]">
      <!-- Severity Corner Ribbon - Diagonal clip at top-right corner -->
      <!-- Larger container and wider ribbon to accommodate "CRITICAL" text -->
      <div class="absolute top-0 right-0 z-20 overflow-hidden" style="width: 280px; height: 280px;">
        <!-- CRITICAL -->
        <div 
          v-if="article.severity === 'critical'"
          class="absolute bg-red-600/95 border-4 border-red-400"
          style="
            top: 60px;
            right: -80px;
            width: 380px;
            transform: rotate(45deg);
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.3);
          "
        >
          <div class="py-4 text-center">
            <span class="text-white text-3xl font-black uppercase tracking-[0.3em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              CRITICAL
            </span>
          </div>
        </div>
        
        <!-- HIGH -->
        <div 
          v-else-if="article.severity === 'high'"
          class="absolute bg-orange-600/95 border-4 border-orange-400"
          style="
            top: 60px;
            right: -80px;
            width: 380px;
            transform: rotate(45deg);
            box-shadow: 0 0 30px rgba(249, 115, 22, 0.8), 0 0 60px rgba(249, 115, 22, 0.5), inset 0 0 20px rgba(249, 115, 22, 0.3);
          "
        >
          <div class="py-4 text-center">
            <span class="text-white text-3xl font-black uppercase tracking-[0.3em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              HIGH
            </span>
          </div>
        </div>
        
        <!-- MEDIUM/LOW -->
        <div 
          v-else-if="['medium', 'low'].includes(article.severity || '')"
          class="absolute bg-yellow-600/95 border-4 border-yellow-400"
          style="
            top: 60px;
            right: -80px;
            width: 380px;
            transform: rotate(45deg);
            box-shadow: 0 0 30px rgba(234, 179, 8, 0.8), 0 0 60px rgba(234, 179, 8, 0.5), inset 0 0 20px rgba(234, 179, 8, 0.3);
          "
        >
          <div class="py-4 text-center">
            <span class="text-white text-3xl font-black uppercase tracking-[0.3em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {{ article.severity?.toUpperCase() }}
            </span>
          </div>
        </div>
        
        <!-- INFO -->
        <div 
          v-else-if="article.severity === 'informational'"
          class="absolute bg-blue-600/95 border-4 border-blue-400"
          style="
            top: 60px;
            right: -80px;
            width: 380px;
            transform: rotate(45deg);
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.3);
          "
        >
          <div class="py-4 text-center">
            <span class="text-white text-3xl font-black uppercase tracking-[0.3em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              INFO
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-stretch relative overflow-hidden h-full">
        
        <!-- Article Content -->
        <div class="flex-1 p-8 z-10 relative flex flex-col justify-center" style="margin-top: -4.5rem;">
          <!-- Title + Severity + Categories -->
          <div class="space-y-8">
            <!-- Title Row -->
            <div class="flex items-start gap-6">
              <h2 class="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 leading-[1.1] line-clamp-4" style="margin-top: 2px; max-width: 70%;">
                {{ article.headline }}
              </h2>
            </div>
            
            <!-- Category Badges (Moved down one row, max-width 75%) -->
            <div v-if="article.categories && article.categories.length > 0" class="flex flex-wrap items-center gap-4 max-w-[75%]">
              <div
                v-for="category in article.categories.slice(0, 3)"
                :key="category"
                class="px-8 py-4 bg-orange-500/20 border-4 border-orange-500 text-orange-300 rounded-xl text-3xl font-black uppercase tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.5)]"
              >
                {{ category }}
              </div>
            </div>
          </div>

          <!-- Bottom Section: Logo Only - Slightly moved up for Twitter banner -->
          <div class="absolute bottom-16 right-8">
            <!-- CyberNetSec.io Logo/Brand (bottom right - VERTICAL LAYOUT) -->
            <div class="flex flex-col items-center gap-3">
              <!-- Shield Icon (ABOVE logo, 2x BIGGER) -->
              <div class="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl border-2 border-cyan-400/80 shadow-[0_0_30px_rgba(34,211,238,0.9),0_0_60px_rgba(168,85,247,0.6),0_0_90px_rgba(236,72,153,0.3)]">
                <Icon name="heroicons:shield-check-20-solid" class="w-24 h-24 text-white" />
              </div>
              <!-- Brand Text -->
              <div class="flex flex-col items-center text-center">
                <div class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 font-black text-4xl leading-tight">
                  CyberNetSec<span class="text-pink-400">.io</span>
                </div>
                <div class="text-cyan-400/80 text-xl font-bold tracking-wider mt-1">
                  THREAT INTELLIGENCE
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Category Image -->
        <div class="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none">
          <img
            :src="getArticleImageUrl(article.categories)"
            :alt="article.headline"
            class="w-full h-full object-cover opacity-40"
            style="mask: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.7) 30%, black 45%); -webkit-mask: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.7) 30%, black 45%);"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getArticleImageUrl } from '~/utils/images';

interface Props {
  article: {
    headline: string;
    title?: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    categories: string[];
    createdAt: string;
    tags?: string[];
    tweet_text?: string;
  };
  entities?: string[];
}

const props = defineProps<Props>();

// Format date helper
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

// Extract entities from tweet text or tags
const entities = computed(() => {
  const extracted: string[] = [];
  
  // From tweet text (hashtags)
  if (props.article.tweet_text) {
    const hashtags = props.article.tweet_text.match(/#\w+/g);
    if (hashtags) {
      extracted.push(...hashtags);
    }
  }
  
  // From tags (fallback)
  if (props.article.tags && extracted.length < 5) {
    extracted.push(...props.article.tags.slice(0, 8 - extracted.length));
  }
  
  // From custom entities prop
  if (props.entities) {
    extracted.push(...props.entities.filter(e => !extracted.includes(e)));
  }
  
  return extracted.slice(0, 8); // Max 8 entities
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
