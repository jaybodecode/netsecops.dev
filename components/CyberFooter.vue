<template>
  <!-- Cyberpunk Footer Component for CyberNetSec.io -->
  <footer class="relative bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 text-gray-100 border-t-2 border-purple-500/30 overflow-hidden">
    <!-- Animated background grid -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0 cyber-grid-bg"/>
    </div>

    <!-- Top glow line -->
    <div class="cyber-glow-line-top"/>

    <div class="container mx-auto px-4 py-12 max-w-6xl relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_0.9fr_0.85fr_1fr] gap-8 mb-8">
        <!-- Branding Section -->
        <div class="space-y-4">
          <h3 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            {{ brandingTitle }}
          </h3>
          <p class="text-gray-400 text-sm">
            {{ brandingDescription }}
          </p>
          
          <!-- Social Links -->
          <!-- <div class="flex gap-3">
            <a 
              v-for="social in socialLinks" 
              :key="social.name"
              :href="social.url" 
              :aria-label="social.name"
              :class="[
                'w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center transition-all',
                social.borderClass,
                social.hoverClass
              ]"
            >
              <Icon :name="social.icon" :class="['w-5 h-5', social.colorClass]" />
            </a>
          </div> -->
        </div>

        <!-- Quick Links -->
        <div class="space-y-4">
          <h4 class="text-sm font-black uppercase tracking-wider text-purple-400">
            {{ quickLinksTitle }}
          </h4>
          <ul class="space-y-2">
            <li v-for="link in quickLinks" :key="link.label">
              <NuxtLink 
                v-if="link.to"
                :to="link.to" 
                class="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 group"
              >
                <span class="w-1 h-1 rounded-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                {{ link.label }}
              </NuxtLink>
              <a 
                v-else
                :href="link.href || '#'" 
                class="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 group"
              >
                <span class="w-1 h-1 rounded-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                {{ link.label }}
              </a>
            </li>
            
            <!-- Clear Read Items Button (only on articles/publications pages) -->
            <li v-if="showClearReadItems">
              <button
                @click="clearAllReadItems"
                class="text-green-400 hover:text-green-500 text-sm transition-colors flex items-center gap-2 group w-full text-left"
              >
                <span class="w-1 h-1 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                Clear Read Items
              </button>
            </li>
          </ul>
        </div>

        <!-- Subscribe Section -->
        <div class="space-y-4">
          <h4 class="text-sm font-black uppercase tracking-wider text-purple-400">
            Subscribe
          </h4>
          <ul class="space-y-2">
            <li>
              <button
                @click="showEmailModal = true"
                class="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 group w-full text-left"
              >
                <span class="w-1 h-1 rounded-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                Email Subscribe
              </button>
            </li>
            <li>
              <NuxtLink 
                to="/rss" 
                class="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 group"
              >
                <span class="w-1 h-1 rounded-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                RSS Feed Lists
              </NuxtLink>
            </li>
            <li>
              <span class="text-gray-400 text-sm flex items-center gap-2 group cursor-not-allowed">
                <span class="w-1 h-1 rounded-full bg-gray-600"/>
                <span class="flex items-center gap-2">
                  Taxii 2.1 Server
                  <span class="text-xs text-gray-500 italic">(Soon!)</span>
                </span>
              </span>
            </li>
          </ul>
        </div>

        <!-- SANS Threat Level Monitor -->
        <div class="space-y-4">
          <h4 class="text-sm font-black uppercase tracking-wider text-purple-400">
            {{ statsTitle }}
          </h4>
          
          <!-- SANS Threat Level Display - Compact Version -->
          <div 
            v-if="threatData"
            :class="[
              'p-3 rounded-lg border transition-all duration-300',
              'bg-gray-800/50'
            ]"
            :style="{ borderColor: getLevelColor() }"
          >
            <!-- Compact Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <Icon name="heroicons:shield-exclamation-20-solid" class="w-4 h-4 text-purple-400" />
                <span class="text-xs font-semibold text-gray-400">THREAT LEVEL</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="heroicons:shield-check-20-solid" class="w-4 h-4" :style="{ color: getLevelColor() }" />
                <span class="text-lg font-black uppercase" :style="{ color: getLevelColor() }">
                  {{ threatData.level }}
                </span>
              </div>
            </div>
            
            <!-- Compact Info -->
            <div class="space-y-1">
              <p class="text-xs font-medium text-gray-300">
                {{ threatData.levelName }}
              </p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">{{ formattedThreatDate }}</span>
                <a 
                  href="https://isc.sans.edu/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="text-xs text-gray-600 hover:text-cyan-400 transition-colors"
                >
                  SANS ISC
                </a>
              </div>
            </div>
          </div>
          
          <!-- Loading State - Compact -->
          <div v-else class="p-3 rounded-lg border border-gray-700 bg-gray-800/50">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">THREAT LEVEL</span>
              <span class="text-xs text-gray-500">Loading...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-8 border-t border-purple-500/20">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-500">
            © {{ currentYear }} {{ copyrightText }}
          </p>
          <div class="flex gap-6 text-xs text-gray-500">
            <NuxtLink 
              v-for="link in legalLinks" 
              :key="link.label"
              :to="link.href || '#'" 
              class="hover:text-cyan-400 transition-colors"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom glow line -->
    <div class="cyber-glow-line-bottom"/>

    <!-- Email Subscription Modal Component -->
    <EmailSubscribeModal v-model="showEmailModal" />
  </footer>
</template>

<script setup lang="ts">
/**
 * CyberFooter - Cyberpunk-styled footer component for SANS ISC
 * Reusable footer with branding, links, and SANS threat level monitor
 */

import { computed, ref, onMounted } from 'vue';

// Check if we're on articles or publications pages (index or slug pages)
const route = useRoute();
const showClearReadItems = computed(() => {
  return route.path.startsWith('/articles') || route.path.startsWith('/publications');
});

// Email subscription modal state
const showEmailModal = ref(false);

// Clear all read items from localStorage
const clearAllReadItems = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear read articles
    localStorage.removeItem('readArticles');
    // Clear read publications
    localStorage.removeItem('readPublications');
    
    // Reload the page to reflect changes
    window.location.reload();
  } catch (error) {
    console.error('Failed to clear read items:', error);
  }
};

interface ThreatLevel {
  name: string;
  color: string;
  description: string;
}

interface ThreatData {
  level: string;
  levelName: string;
  description: string;
  lastUpdated: string;
  lastChecked: string;
  source: string;
  sourceUrl: string;
  apiUrl: string;
  infoconUrl: string;
  levels: Record<string, ThreatLevel>;
}

// Threat level data
const threatData = ref<ThreatData | null>(null);

// Fetch threat level on mount
const fetchThreatLevel = async () => {
  try {
    const response = await fetch('/data/threat-level.json');
    if (!response.ok) {
      throw new Error('Failed to fetch threat level data');
    }
    threatData.value = await response.json();
  } catch {
    // Silent error handling - threat level will remain null
  }
};

onMounted(() => {
  fetchThreatLevel();
  
  // Listen for open-email-modal event from other components
  if (typeof window !== 'undefined') {
    window.addEventListener('open-email-modal', () => {
      showEmailModal.value = true;
    });
  }
});

// Get level color
const getLevelColor = () => {
  if (!threatData.value) return '#00ff00';
  return threatData.value.levels[threatData.value.level]?.color || '#00ff00';
};

// Format the threat level last updated date
const formattedThreatDate = computed(() => {
  if (!threatData.value?.lastUpdated) return 'N/A';
  
  const date = new Date(threatData.value.lastUpdated);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const updateDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Check if it's today
  if (updateDate.getTime() === today.getTime()) {
    return 'Today';
  }
  
  // Check if it's yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (updateDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  // Format as date (e.g., "Oct 10, 2025")
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
});

interface SocialLink {
  name: string;
  url: string;
  icon: string;
  colorClass: string;
  borderClass: string;
  hoverClass: string;
}

interface QuickLink {
  label: string;
  to?: string;
  href?: string;
}

interface LegalLink {
  label: string;
  href?: string;
}

interface Props {
  siteId?: string;
  brandingTitle?: string;
  brandingDescription?: string;
  quickLinksTitle?: string;
  statsTitle?: string;
  copyrightText?: string;
  socialLinks?: SocialLink[];
  quickLinks?: QuickLink[];
  legalLinks?: LegalLink[];
}

const props = withDefaults(defineProps<Props>(), {
  siteId: '',
  brandingTitle: 'CyberNetSec.io',
  brandingDescription: 'Timely, reliable, and cited sources for daily cybersecurity threat intelligence, vulnerability reports, and security advisories.',
  quickLinksTitle: 'Quick Links',
  quickLinks: () => [],
  statsTitle: 'Threat Level',
  copyrightText: 'CyberNetSec.io. All rights reserved.',
  socialLinks: () => [
    {
      name: 'Twitter',
      url: 'https://twitter.com/NetSecIO',
      icon: 'ri:twitter-x-fill',
      colorClass: 'text-cyan-400',
      borderClass: 'border border-cyan-500/30',
      hoverClass: 'hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    },
    {
      name: 'GitHub',
      url: '#',
      icon: 'mdi:github',
      colorClass: 'text-purple-400',
      borderClass: 'border border-purple-500/30',
      hoverClass: 'hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    },
    {
      name: 'LinkedIn',
      url: '#',
      icon: 'mdi:linkedin',
      colorClass: 'text-pink-400',
      borderClass: 'border border-pink-500/30',
      hoverClass: 'hover:border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]',
    },
  ],
  legalLinks: () => [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
});

// Compute current year
const currentYear = new Date().getFullYear();

// Compute articles link based on siteId
const articlesLink = computed(() => 
  props.siteId ? `/site/${props.siteId}/articles` : '/articles'
);

// Compute quick links with dynamic articles link
const quickLinks = computed<QuickLink[]>(() => {
  if (props.quickLinks && props.quickLinks.length > 0) {
    return props.quickLinks;
  }
  
  return [
    { label: 'Home', to: '/' },
    { label: 'Advisories', to: articlesLink.value },
    { label: 'Publications', to: '/publications' },
  ];
});
</script>

<style scoped>
.cyber-grid-bg {
  background-image: linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px);
  background-size: 50px 50px;
}

.cyber-glow-line-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgb(6 182 212), transparent);
  opacity: 0.5;
}

.cyber-glow-line-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgb(168 85 247), transparent);
  opacity: 0.3;
}
</style>
