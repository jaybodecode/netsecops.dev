<template>
  <!-- Cyberpunk Card Component for CyberNetSec.io -->
  <div
    :class="[
      'relative group bg-gray-900 rounded-lg overflow-hidden transition-all',
      borderClass,
      shadowClass,
      hoverClass,
      customClass
    ]"
  >
    <!-- Animated border glow effect -->
    <div 
      v-if="glowEffect"
      class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
    />
    
    <!-- Content -->
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CyberCard - Cyberpunk-styled card component for CyberNetSec.io
 * Reusable card with neon borders and glow effects
 */

interface Props {
  variant?: 'default' | 'purple' | 'cyan' | 'pink' | 'red' | 'orange' | 'green' | 'danger' | 'info' | 'warning';
  glowEffect?: boolean;
  customClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  glowEffect: true,
  customClass: '',
});

// Compute border, shadow, and hover classes based on variant
const borderClass = computed(() => {
  const variants = {
    default: 'border-2 border-purple-500/30',
    purple: 'border-2 border-purple-500/30',
    cyan: 'border-2 border-cyan-500/30',
    pink: 'border-2 border-pink-500/30',
    red: 'border-2 border-red-500/30',
    orange: 'border-2 border-orange-500/30',
    green: 'border-2 border-green-500/30',
    danger: 'border-2 border-red-500/30',
    info: 'border-2 border-blue-500/30',
    warning: 'border-2 border-orange-500/30',
  };
  return variants[props.variant];
});

const shadowClass = computed(() => {
  const variants = {
    default: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    purple: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    cyan: 'shadow-[0_0_15px_rgba(34,211,238,0.15)]',
    pink: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]',
    red: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    orange: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
    green: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]',
    danger: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    info: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    warning: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
  };
  return variants[props.variant];
});

const hoverClass = computed(() => {
  const variants = {
    default: 'hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    purple: 'hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    cyan: 'hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]',
    pink: 'hover:border-pink-500/60 hover:shadow-[0_0_25px_rgba(236,72,153,0.3)]',
    red: 'hover:border-red-500/60 hover:shadow-[0_0_25px_rgba(239,68,68,0.3)]',
    orange: 'hover:border-orange-500/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.3)]',
    green: 'hover:border-green-500/60 hover:shadow-[0_0_25px_rgba(34,197,94,0.3)]',
    danger: 'hover:border-red-500/60 hover:shadow-[0_0_25px_rgba(239,68,68,0.3)]',
    info: 'hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]',
    warning: 'hover:border-orange-500/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.3)]',
  };
  return variants[props.variant];
});
</script>
