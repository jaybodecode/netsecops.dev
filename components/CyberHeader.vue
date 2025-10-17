<template>
  <!-- Cyberpunk Header Component for CyberNetSec.io -->
  <div class="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 text-white py-16 overflow-hidden">
    <!-- Animated background grid -->
    <div class="absolute inset-0 opacity-10">
      <div 
        class="absolute inset-0" 
        style="background-image: linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px); background-size: 50px 50px;"
      />
    </div>
    
    <!-- Badge Background Image (Behind other overlays) -->
    <div v-if="showBadgeImage" class="absolute inset-0 opacity-15">
      <NuxtImg
        src="/images/branding/badge.jpg"
        alt="Cyber Security Badge"
        class="w-full h-full object-cover"
        style="object-position: center; transform: scale(1.0);"
        loading="eager"
        quality="80"
        format="webp"
        width="1920"
        height="400"
      />
    </div>
    
    <!-- Glitch effect overlay -->
    <div class="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-500 via-transparent to-pink-500 animate-pulse"/>
    
    <!-- Content -->
    <div class="container mx-auto px-4 max-w-6xl relative z-10">
      <div class="flex items-center justify-center gap-3 mb-3">
        <Icon 
          v-if="icon" 
          :name="icon" 
          class="w-12 h-12 text-cyan-400" 
          style="filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.5));"
        />
        <h1 class="text-5xl font-black tracking-tight">
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            {{ title }}
          </span>
        </h1>
      </div>
      <p 
        v-if="subtitle"
        class="text-2xl font-bold text-cyan-300 tracking-wide uppercase text-center" 
        style="text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);"
      >
        {{ subtitle }}
      </p>
      <div class="mt-2 h-1 w-32 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full mx-auto"/>
      
      <!-- Optional slot for custom header content -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CyberHeader - Cyberpunk-styled header component for CyberNetSec.io
 * Reusable header with neon effects, grid backgrounds, and glitch animations
 */

interface Props {
  title?: string;
  subtitle?: string;
  showBadgeImage?: boolean;
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'CyberNetSec.io',
  subtitle: 'Daily Cybersecurity Threat Briefings',
  showBadgeImage: true,
  icon: 'heroicons:shield-check-20-solid',
});
</script>
