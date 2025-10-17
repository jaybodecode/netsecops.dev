<template>
  <!-- Cyberpunk Button Component for CyberNetSec.io -->
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'relative overflow-hidden rounded-lg transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-wider',
      sizeClass,
      buttonClasses,
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      customClass
    ]"
    @click="handleClick"
  >
    <!-- Background gradient effect -->
    <div 
      v-if="!disabled"
      :class="[
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity',
        gradientClass
      ]"
    />
    
    <!-- Content -->
    <div class="relative z-10 flex items-center gap-2">
      <Icon v-if="icon" :name="icon" :class="iconSizeClass" />
      <slot>{{ label }}</slot>
    </div>
  </button>
</template>

<script setup lang="ts">
/**
 * CyberButton - Cyberpunk-styled button component for CyberNetSec.io
 * Reusable button with neon effects and hover animations
 */

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'cyan' | 'purple' | 'pink';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  icon?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  customClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  label: '',
  icon: '',
  type: 'button',
  disabled: false,
  customClass: '',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

// Size classes
const sizeClass = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return sizes[props.size];
});

const iconSizeClass = computed(() => {
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  return sizes[props.size];
});

// Button classes based on variant
const buttonClasses = computed(() => {
  const variants = {
    primary: 'bg-gray-900 border-2 border-cyan-500/30 text-cyan-400 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-105',
    secondary: 'bg-gray-900 border-2 border-purple-500/30 text-purple-400 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-105',
    danger: 'bg-gray-900 border-2 border-red-500/30 text-red-400 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105',
    success: 'bg-gray-900 border-2 border-green-500/30 text-green-400 hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:scale-105',
    cyan: 'bg-gray-900 border-2 border-cyan-500/30 text-cyan-400 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-105',
    purple: 'bg-gray-900 border-2 border-purple-500/30 text-purple-400 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-105',
    pink: 'bg-gray-900 border-2 border-pink-500/30 text-pink-400 hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:scale-105',
  };
  return variants[props.variant];
});

const gradientClass = computed(() => {
  const variants = {
    primary: 'bg-gradient-to-br from-cyan-500/10 to-transparent',
    secondary: 'bg-gradient-to-br from-purple-500/10 to-transparent',
    danger: 'bg-gradient-to-br from-red-500/10 to-transparent',
    success: 'bg-gradient-to-br from-green-500/10 to-transparent',
    cyan: 'bg-gradient-to-br from-cyan-500/10 to-transparent',
    purple: 'bg-gradient-to-br from-purple-500/10 to-transparent',
    pink: 'bg-gradient-to-br from-pink-500/10 to-transparent',
  };
  return variants[props.variant];
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>
