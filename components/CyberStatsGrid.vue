<template>
  <!-- Cyberpunk Stats Grid Component for CyberNetSec.io -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <CyberButton
      v-for="stat in stats"
      :key="stat.id"
      :variant="stat.variant"
      :custom-class="`relative overflow-hidden rounded-lg p-4 text-center transition-all group ${
        isActive(stat.id) 
          ? `border-2 ${stat.activeBorder} ${stat.activeShadow} scale-105` 
          : `border-2 border-gray-700 hover:${stat.hoverBorder} hover:${stat.hoverShadow} hover:scale-105`
      }`"
      @click="handleStatClick(stat.id)"
    >
      <template #default>
        <div
:class="[
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity',
          stat.gradient
        ]"/>
        <div class="relative z-10">
          <div :class="['text-3xl font-black', stat.color]">{{ stat.value }}</div>
          <div class="text-sm text-gray-400 uppercase tracking-wider font-bold">{{ stat.label }}</div>
          <div v-if="isActive(stat.id)" :class="['text-xs font-medium mt-1', stat.color]">● ACTIVE</div>
        </div>
      </template>
    </CyberButton>
  </div>
</template>

<script setup lang="ts">
/**
 * CyberStatsGrid - Cyberpunk-styled statistics grid for CyberNetSec.io
 * Displays clickable stats with neon effects
 */

interface CyberStat {
  id: string;
  label: string;
  value: number;
  variant: 'primary' | 'danger' | 'success' | 'cyan';
  color: string;
  gradient: string;
  activeBorder: string;
  activeShadow: string;
  hoverBorder: string;
  hoverShadow: string;
}

interface Props {
  stats: CyberStat[];
  activeStatId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  statClick: [statId: string];
}>();

const isActive = (statId: string) => {
  return props.activeStatId === statId;
};

const handleStatClick = (statId: string) => {
  emit('statClick', statId);
};
</script>
