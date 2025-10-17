<template>
  <!-- Cyberpunk Badge Component for Cyber-Netsec.io -->
  <span
    :class="[
      'px-3 py-1.5 rounded text-xs font-black flex items-center gap-1.5 whitespace-nowrap uppercase tracking-wider backdrop-blur-sm',
      badgeClasses,
      customClass
    ]"
  >
    <Icon v-if="icon" :name="icon" class="w-4 h-4" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
/**
 * CyberBadge - Cyberpunk-styled badge component for CyberNetSec.io
 * Reusable badge with neon effects for severity, status, and categories
 */

interface Props {
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'category' | 'cyan' | 'purple' | 'pink' | 'danger' | 'warning' | 'secondary';
  label?: string;
  icon?: string;
  customClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  label: '',
  icon: '',
  customClass: '',
});

// Compute badge classes based on variant
const badgeClasses = computed(() => {
  const variants = {
    critical: 'bg-red-500/30 border-2 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.6)]',
    high: 'bg-orange-500/30 border-2 border-orange-500 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.6)]',
    medium: 'bg-yellow-500/30 border-2 border-yellow-500 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.6)]',
    low: 'bg-blue-500/30 border-2 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
    info: 'bg-gray-500/30 border-2 border-gray-500 text-gray-300 shadow-[0_0_10px_rgba(107,114,128,0.5)]',
    success: 'bg-green-500/30 border-2 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.6)]',
    category: 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.8)]',
    cyan: 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.8)]',
    purple: 'bg-purple-500/30 border-2 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.6)]',
    pink: 'bg-pink-500/30 border-2 border-pink-500 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.6)]',
    danger: 'bg-red-500/30 border-2 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.6)]',
    warning: 'bg-orange-500/30 border-2 border-orange-500 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.6)]',
    secondary: 'bg-gray-500/30 border-2 border-gray-500 text-gray-300 shadow-[0_0_10px_rgba(107,114,128,0.5)]',
  };
  return variants[props.variant];
});
</script>
