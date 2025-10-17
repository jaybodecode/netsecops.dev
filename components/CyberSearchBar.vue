<template>
  <!-- Cyberpunk Search Bar Component for CyberNetSec.io -->
  <div 
    :class="[
      'bg-gray-900 border-2 border-cyan-500/30 rounded-lg p-4 transition-all',
      'shadow-[0_0_15px_rgba(34,211,238,0.15)]',
      'hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]',
      customClass
    ]"
  >
    <div class="flex items-center gap-3">
      <Icon name="heroicons:magnifying-glass-20-solid" class="w-5 h-5 text-cyan-400 flex-shrink-0" />
      <input
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        class="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 font-medium"
        @input="handleInput"
      />
      <button
        v-if="modelValue"
        class="p-1 hover:bg-cyan-500/20 rounded-full transition-colors flex-shrink-0"
        aria-label="Clear search"
        @click="handleClear"
      >
        <Icon name="heroicons:x-mark-20-solid" class="w-5 h-5 text-cyan-400 hover:text-cyan-300" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CyberSearchBar - Cyberpunk-styled search bar for CyberNetSec.io
 * Reusable search input with neon effects
 */

interface Props {
  modelValue: string;
  placeholder?: string;
  customClass?: string;
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Search articles by title, CVE, tags, or content...',
  customClass: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'clear': [];
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const handleClear = () => {
  emit('update:modelValue', '');
  emit('clear');
};
</script>
