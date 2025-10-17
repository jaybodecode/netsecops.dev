<template>
  <div class="threat-level-compact">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4">
      <Icon name="heroicons:shield-exclamation-20-solid" class="w-6 h-6 text-green-400" />
      <h2 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
        Current Threat Level
      </h2>
    </div>

    <!-- Threat Level Display -->
    <div v-if="threatData" class="threat-content">
      <!-- Main Level Badge -->
      <div 
        class="level-badge-container"
        :style="{ 
          borderColor: getLevelColor(),
          boxShadow: `0 0 20px ${getLevelColor()}40, inset 0 0 20px ${getLevelColor()}20`
        }"
      >
        <div 
          class="level-badge"
          :style="{ 
            backgroundColor: getLevelColor(),
            boxShadow: `0 0 30px ${getLevelColor()}, 0 0 60px ${getLevelColor()}80`
          }"
        >
          {{ threatData.levelName.toUpperCase() }}
        </div>
      </div>

      <!-- Compact Legend - Just colored squares -->
      <div class="compact-legend">
        <div 
          v-for="(levelInfo, levelKey) in threatData.levels" 
          :key="levelKey"
          class="legend-square"
          :class="{ active: levelKey === threatData.level }"
          :style="{ 
            backgroundColor: levelInfo.color,
            boxShadow: levelKey === threatData.level ? `0 0 15px ${levelInfo.color}` : 'none'
          }"
          :title="levelInfo.name"
        />
      </div>

      <!-- Metadata -->
      <div class="compact-meta">
        <p class="meta-date">
          <Icon name="heroicons:clock-20-solid" class="inline w-3 h-3 mr-1" />
          Last Updated: {{ formatDate(threatData.lastUpdated) }}
        </p>
      </div>

      <!-- Attribution -->
      <div class="compact-attribution">
        <p class="attribution-text">
          <Icon name="heroicons:signal-20-solid" class="inline w-3 h-3 mr-1 text-cyan-400" />
          Data provided by 
          <a 
            href="https://isc.sans.edu/" 
            target="_blank" 
            rel="noopener noreferrer"
            class="attribution-link"
          >
            SANS Internet Storm Center
          </a>
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-compact">
      <div class="loading-spinner"></div>
      <p class="loading-text">
        <span class="loading-dots">Loading</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ThreatLevel {
  name: string
  color: string
  description: string
}

interface ThreatData {
  level: string
  levelName: string
  description: string
  lastUpdated: string
  lastChecked: string
  source: string
  sourceUrl: string
  apiUrl: string
  infoconUrl: string
  levels: Record<string, ThreatLevel>
}

const threatData = ref<ThreatData | null>(null)

const fetchThreatLevel = async () => {
  try {
    const response = await fetch('/data/threat-level.json')
    if (!response.ok) {
      throw new Error('Failed to fetch threat level data')
    }
    threatData.value = await response.json()
  } catch {
    // Silent error handling - threat level will remain null
  }
}

const getLevelColor = () => {
  if (!threatData.value) return '#00ff00'
  return threatData.value.levels[threatData.value.level]?.color || '#00ff00'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

onMounted(() => {
  fetchThreatLevel()
})
</script>

<style scoped>
.threat-level-compact {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(236, 72, 153, 0.05) 100%);
  border: 2px solid rgba(34, 211, 238, 0.4);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Animated border effect */
.threat-level-compact::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 2px;
  background: linear-gradient(45deg, 
    rgba(34, 211, 238, 0.4),
    rgba(168, 85, 247, 0.4),
    rgba(236, 72, 153, 0.4),
    rgba(34, 211, 238, 0.4)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: borderGlow 4s linear infinite;
  pointer-events: none;
}

@keyframes borderGlow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.threat-level-compact:hover {
  border-color: rgba(34, 211, 238, 0.6);
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
}

/* Header */
.compact-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #22d3ee;
  filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.6));
}

.neon-pulse {
  animation: neonPulse 2s ease-in-out infinite;
}

@keyframes neonPulse {
  0%, 100% { 
    filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.6));
    opacity: 1;
  }
  50% { 
    filter: drop-shadow(0 0 15px rgba(34, 211, 238, 0.9));
    opacity: 0.8;
  }
}

.header-title {
  font-size: 0.875rem;
  font-weight: 900;
  background: linear-gradient(90deg, #22d3ee, #a855f7, #ec4899, #22d3ee);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  animation: gradientShift 3s linear infinite;
  position: relative;
}

@keyframes gradientShift {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

/* Glitch effect for title */
.glitch-text {
  position: relative;
  display: inline-block;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: inherit;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glitch-text::before {
  animation: glitchTop 3s infinite;
  clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
  background: linear-gradient(90deg, #22d3ee, #a855f7, #ec4899, #22d3ee);
}

.glitch-text::after {
  animation: glitchBottom 2.5s infinite;
  clip-path: polygon(0 67%, 100% 67%, 100% 100%, 0 100%);
  background: linear-gradient(90deg, #22d3ee, #a855f7, #ec4899, #22d3ee);
}

@keyframes glitchTop {
  0%, 92%, 100% { transform: translate(0); }
  94% { transform: translate(2px, -2px); }
  96% { transform: translate(-2px, 1px); }
  98% { transform: translate(1px, 1px); }
}

@keyframes glitchBottom {
  0%, 94%, 100% { transform: translate(0); }
  95% { transform: translate(-2px, 2px); }
  97% { transform: translate(2px, -1px); }
  99% { transform: translate(-1px, -1px); }
}/* Threat Content */
.threat-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

/* Level Badge */
.level-badge-container {
  display: inline-block;
  margin: 0 auto;
  padding: 1rem;
  border: 3px solid;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.level-badge-container::before {
  content: '';
  position: absolute;
  inset: -50%;
  background: conic-gradient(from 0deg, transparent, currentColor, transparent);
  animation: rotate 4s linear infinite;
  opacity: 0.1;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

.level-badge-container:hover {
  transform: scale(1.05);
}

.level-badge {
  font-size: 1.75rem;
  font-weight: 900;
  color: #000;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  text-shadow: 0 0 10px currentColor, 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 3px;
  position: relative;
  z-index: 1;
  animation: levelPulse 2s ease-in-out infinite;
}

@keyframes levelPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

/* Compact Legend - Just squares */
.compact-legend {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 0;
  border-top: 1px solid rgba(34, 211, 238, 0.2);
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
}

.legend-square {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid rgba(34, 211, 238, 0.3);
  opacity: 0.3;
  transition: all 0.3s ease;
  cursor: help;
  position: relative;
}

.legend-square::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 6px;
  background: inherit;
  filter: blur(4px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.legend-square.active {
  opacity: 1;
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.15);
  animation: activeSquare 2s ease-in-out infinite;
}

.legend-square.active::before {
  opacity: 0.6;
}

@keyframes activeSquare {
  0%, 100% { transform: scale(1.15); }
  50% { transform: scale(1.25); }
}

.legend-square:hover {
  opacity: 0.8;
  transform: scale(1.2);
  border-color: rgba(255, 255, 255, 0.6);
}

/* Metadata */
.compact-meta {
  padding-top: 0.5rem;
}

.meta-date {
  font-size: 0.75rem;
  color: #22d3ee;
  font-style: italic;
  margin: 0;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
}

/* Attribution */
.compact-attribution {
  padding-top: 1rem;
  border-top: 1px solid rgba(34, 211, 238, 0.2);
}

.attribution-text {
  font-size: 0.75rem;
  color: #6ee7b7;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.attribution-link {
  color: #22d3ee;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s ease;
  text-shadow: 0 0 5px rgba(34, 211, 238, 0.3);
}

.attribution-link:hover {
  color: #a855f7;
  text-shadow: 0 0 12px rgba(168, 85, 247, 0.6);
  text-decoration: underline;
}

/* Loading State */
.loading-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(34, 211, 238, 0.2);
  border-top-color: #22d3ee;
  border-right-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 0.875rem;
  color: #22d3ee;
  margin: 0;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
}

.loading-dots::after {
  content: '...';
  animation: loadingDots 1.5s steps(4, end) infinite;
}

@keyframes loadingDots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .threat-level-compact::before,
  .neon-pulse,
  .header-title,
  .glitch-text::before,
  .glitch-text::after,
  .level-badge-container::before,
  .level-badge,
  .legend-square.active,
  .loading-spinner {
    animation: none !important;
  }
  
  .legend-square:hover,
  .level-badge-container:hover {
    transform: none !important;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .threat-level-compact {
    padding: 1rem;
  }

  .header-title {
    font-size: 0.75rem;
    letter-spacing: 1.5px;
  }

  .header-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .level-badge {
    font-size: 1.5rem;
    padding: 0.4rem 1rem;
    letter-spacing: 2px;
  }

  .legend-square {
    width: 24px;
    height: 24px;
  }
}
</style>
