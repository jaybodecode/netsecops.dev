<script setup lang="ts">
import { marked } from 'marked'

// Configure marked for rendering
const renderer = new marked.Renderer()
const originalLink = renderer.link.bind(renderer)
renderer.link = function(token: any) {
  const html = originalLink(token)
  return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ')
}
marked.setOptions({ renderer })

interface D3FENDTechnique {
  id: string
  name: string
  url: string
}

interface D3FENDCountermeasure {
  technique_id: string
  technique_name: string
  url: string
  mitre_mitigation_id?: string
  recommendation: string
}

interface Props {
  countermeasures: D3FENDCountermeasure[]
}

const props = defineProps<Props>()

// Render markdown recommendation
const renderMarkdown = (content: string) => {
  return marked(content || '')
}
</script>

<template>
  <div v-if="countermeasures && countermeasures.length > 0" class="mb-8">
    <CyberCard variant="success">
      <div class="p-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center text-green-400">
          <Icon name="heroicons:shield-check-20-solid" class="w-6 h-6 mr-2" />
          D3FEND Defensive Countermeasures
        </h3>
        
        <div class="space-y-6">
          <div 
            v-for="(countermeasure, index) in countermeasures" 
            :key="`d3fend-${index}`"
            class="bg-gray-900/50 border border-green-500/30 rounded-lg p-5 hover:border-green-500/50 transition-all"
          >
            <!-- Header with D3FEND ID and MITRE Mitigation -->
            <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div class="flex-1">
                <!-- D3FEND Technique -->
                <a 
                  :href="countermeasure.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 group"
                >
                  <h4 class="text-lg font-semibold text-green-400 group-hover:text-green-300 transition-colors">
                    {{ countermeasure.technique_name }}
                  </h4>
                  <Icon name="heroicons:arrow-top-right-on-square-20-solid" class="w-4 h-4 text-green-400 opacity-60 group-hover:opacity-100" />
                </a>
                
                <!-- D3FEND ID Badge -->
                <div class="flex items-center gap-2 mt-2">
                  <a 
                    :href="countermeasure.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CyberBadge 
                      variant="success"
                      size="sm"
                      class="font-mono hover:opacity-80 transition-opacity"
                    >
                      {{ countermeasure.technique_id }}
                    </CyberBadge>
                  </a>
                  
                  <!-- MITRE Mitigation Mapping -->
                  <span 
                    v-if="countermeasure.mitre_mitigation_id" 
                    class="flex items-center gap-1 text-xs text-gray-400"
                  >
                    <Icon name="heroicons:arrow-right-20-solid" class="w-3 h-3" />
                    <span>Maps to MITRE</span>
                    <a 
                      :href="`https://attack.mitre.org/mitigations/${countermeasure.mitre_mitigation_id}/`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="hover:text-blue-400 transition-colors"
                    >
                      <CyberBadge 
                        variant="info"
                        size="sm"
                        class="font-mono hover:opacity-80 transition-opacity"
                      >
                        {{ countermeasure.mitre_mitigation_id }}
                      </CyberBadge>
                    </a>
                  </span>
                </div>
              </div>
              
              <!-- D3FEND Link Badge -->
              <a 
                :href="countermeasure.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 hover:border-green-500 text-xs font-semibold transition-all"
                title="View on D3FEND"
              >
                <Icon name="heroicons:book-open-20-solid" class="w-3 h-3" />
                D3FEND
              </a>
            </div>
            
            <!-- Recommendation Content (Markdown) -->
            <div class="cyber-prose-d3fend mt-4 text-sm">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="renderMarkdown(countermeasure.recommendation)" />
            </div>
          </div>
        </div>
      </div>
    </CyberCard>
  </div>
</template>

<style scoped>
/* D3FEND-specific prose styling */
.cyber-prose-d3fend :deep(h1),
.cyber-prose-d3fend :deep(h2),
.cyber-prose-d3fend :deep(h3),
.cyber-prose-d3fend :deep(h4) {
  @apply text-base font-semibold mt-3 mb-2 text-green-400;
}

.cyber-prose-d3fend :deep(p) {
  @apply mb-3 leading-relaxed text-gray-300;
}

.cyber-prose-d3fend :deep(strong) {
  @apply text-green-400 font-semibold;
}

.cyber-prose-d3fend :deep(ul),
.cyber-prose-d3fend :deep(ol) {
  @apply list-disc mb-3 text-gray-300 space-y-1 pl-5;
}

.cyber-prose-d3fend :deep(li) {
  @apply mb-1;
}

.cyber-prose-d3fend :deep(a) {
  @apply text-green-400 hover:text-green-300 hover:underline transition-colors;
}

.cyber-prose-d3fend :deep(code) {
  @apply bg-gray-800 border border-green-500/30 px-1.5 py-0.5 rounded text-xs text-green-400 font-mono;
}
</style>
