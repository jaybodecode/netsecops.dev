<template>
  <!-- Email Subscription Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="relative w-full max-w-2xl bg-gray-900 border-2 border-cyan-500/50 rounded-lg shadow-[0_0_50px_rgba(34,211,238,0.3)] overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-cyan-500/30 p-4 flex items-center justify-between">
            <h3 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Subscribe to Daily Publications
            </h3>
            <button
              @click="closeModal"
              class="w-8 h-8 rounded-lg bg-gray-800 border border-red-500/50 text-red-400 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center"
              aria-label="Close modal"
            >
              <Icon name="heroicons:x-mark-20-solid" class="w-5 h-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 pb-0">
            <p class="text-gray-400 text-sm mb-4">
              Stay updated with the latest cybersecurity news, threat intelligence, and vulnerability reports delivered to your inbox. One click unsubscribe anytime!
            </p>
            
            <!-- Iframe Container - Cropped to hide white padding -->
            <div class="relative rounded-lg overflow-hidden border border-cyan-500/30 -mx-6 -mb-6 bg-[#2D3E50]" style="height: 500px;">
              <!-- Iframe wrapper with aggressive horizontal negative margins to fully crop side padding -->
              <div class="relative z-10 h-full" style="margin-left: -20px; margin-right: -20px; width: calc(100% + 40px);">
                <iframe
                  src="https://cdn.forms-content-1.sg-form.com/e9af25ca-a9b0-11f0-a826-8aacaaabfff9"
                  class="w-full h-full border-0"
                  title="Email Subscription Form"
                  style="color-scheme: dark;"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * EmailSubscribeModal - Reusable email subscription modal component
 * Used by both the landing page and footer
 */

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}
</style>
