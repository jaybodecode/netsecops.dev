<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-8 text-cyan-400">🔤 Font Comparison - Choose Your Style</h1>
      
      <p class="text-gray-400 mb-8">
        Click a font name to copy the config code. All fonts load from Google Fonts (optimized by @nuxt/fonts).
      </p>

      <!-- JetBrains Mono -->
      <div class="mb-12 p-6 bg-gray-900 rounded-lg border border-cyan-500/20">
        <button 
          class="text-2xl font-bold mb-2 text-cyan-400 hover:text-cyan-300 cursor-pointer"
          @click="copyConfig('JetBrains Mono')"
        >
          1. JetBrains Mono ⭐ (Recommended)
        </button>
        <div style="font-family: 'JetBrains Mono', monospace;">
          <h2 class="text-3xl font-bold mb-4">🚨 Critical CVE-2025-1234 Remote Code Execution</h2>
          <p class="text-lg mb-2">A critical vulnerability has been discovered affecting millions of systems worldwide.</p>
          <p class="text-sm text-gray-400">Body text: The quick brown fox jumps over the lazy dog. 0123456789</p>
          <code class="text-green-400">const exploit = () => { return "Clean, modern, great for code" };</code>
        </div>
        <p class="text-xs text-gray-500 mt-4">
          ✅ Modern • ✅ Excellent readability • ✅ Great for technical content • ✅ Free
        </p>
      </div>

      <!-- Fira Code -->
      <div class="mb-12 p-6 bg-gray-900 rounded-lg border border-purple-500/20">
        <button 
          class="text-2xl font-bold mb-2 text-purple-400 hover:text-purple-300 cursor-pointer"
          @click="copyConfig('Fira Code')"
        >
          2. Fira Code
        </button>
        <div style="font-family: 'Fira Code', monospace;">
          <h2 class="text-3xl font-bold mb-4">🚨 Critical CVE-2025-1234 Remote Code Execution</h2>
          <p class="text-lg mb-2">A critical vulnerability has been discovered affecting millions of systems worldwide.</p>
          <p class="text-sm text-gray-400">Body text: The quick brown fox jumps over the lazy dog. 0123456789</p>
          <code class="text-green-400">const exploit = () => { return "Developer favorite with ligatures" };</code>
        </div>
        <p class="text-xs text-gray-500 mt-4">
          ✅ Ligatures • ✅ Hacker aesthetic • ✅ Very popular • ✅ Free
        </p>
      </div>

      <!-- IBM Plex Mono -->
      <div class="mb-12 p-6 bg-gray-900 rounded-lg border border-blue-500/20">
        <button 
          class="text-2xl font-bold mb-2 text-blue-400 hover:text-blue-300 cursor-pointer"
          @click="copyConfig('IBM Plex Mono')"
        >
          3. IBM Plex Mono
        </button>
        <div style="font-family: 'IBM Plex Mono', monospace;">
          <h2 class="text-3xl font-bold mb-4">🚨 Critical CVE-2025-1234 Remote Code Execution</h2>
          <p class="text-lg mb-2">A critical vulnerability has been discovered affecting millions of systems worldwide.</p>
          <p class="text-sm text-gray-400">Body text: The quick brown fox jumps over the lazy dog. 0123456789</p>
          <code class="text-green-400">const exploit = () => { return "Professional corporate tech" };</code>
        </div>
        <p class="text-xs text-gray-500 mt-4">
          ✅ Professional • ✅ Corporate feel • ✅ Clean • ✅ Free
        </p>
      </div>

      <!-- Space Mono -->
      <div class="mb-12 p-6 bg-gray-900 rounded-lg border border-pink-500/20">
        <button 
          class="text-2xl font-bold mb-2 text-pink-400 hover:text-pink-300 cursor-pointer"
          @click="copyConfig('Space Mono')"
        >
          4. Space Mono
        </button>
        <div style="font-family: 'Space Mono', monospace;">
          <h2 class="text-3xl font-bold mb-4">🚨 Critical CVE-2025-1234 Remote Code Execution</h2>
          <p class="text-lg mb-2">A critical vulnerability has been discovered affecting millions of systems worldwide.</p>
          <p class="text-sm text-gray-400">Body text: The quick brown fox jumps over the lazy dog. 0123456789</p>
          <code class="text-green-400">const exploit = () => { return "Retro cyberpunk vibes" };</code>
        </div>
        <p class="text-xs text-gray-500 mt-4">
          ✅ Retro-futuristic • ✅ Unique • ✅ Cyberpunk aesthetic • ✅ Free
        </p>
      </div>

      <!-- Courier Prime -->
      <div class="mb-12 p-6 bg-gray-900 rounded-lg border border-orange-500/20">
        <button 
          class="text-2xl font-bold mb-2 text-orange-400 hover:text-orange-300 cursor-pointer"
          @click="copyConfig('Courier Prime')"
        >
          5. Courier Prime
        </button>
        <div style="font-family: 'Courier Prime', monospace;">
          <h2 class="text-3xl font-bold mb-4">🚨 Critical CVE-2025-1234 Remote Code Execution</h2>
          <p class="text-lg mb-2">A critical vulnerability has been discovered affecting millions of systems worldwide.</p>
          <p class="text-sm text-gray-400">Body text: The quick brown fox jumps over the lazy dog. 0123456789</p>
          <code class="text-green-400">const exploit = () => { return "Classic typewriter modernized" };</code>
        </div>
        <p class="text-xs text-gray-500 mt-4">
          ✅ Classic Courier feel • ✅ Better than system Courier • ✅ Nostalgic • ✅ Free
        </p>
      </div>

      <!-- System Fonts (Current) -->
      <div class="mb-12 p-6 bg-gray-900 rounded-lg border border-green-500/20">
        <button 
          class="text-2xl font-bold mb-2 text-green-400 hover:text-green-300 cursor-pointer"
          @click="copyConfig('System Fonts')"
        >
          6. System Fonts (Current - Fastest!)
        </button>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <h2 class="text-3xl font-bold mb-4">🚨 Critical CVE-2025-1234 Remote Code Execution</h2>
          <p class="text-lg mb-2">A critical vulnerability has been discovered affecting millions of systems worldwide.</p>
          <p class="text-sm text-gray-400">Body text: The quick brown fox jumps over the lazy dog. 0123456789</p>
          <code class="text-green-400 font-mono">const exploit = () => { return "Zero download, instant render" };</code>
        </div>
        <p class="text-xs text-gray-500 mt-4">
          ✅ Zero latency • ✅ No downloads • ✅ Best Lighthouse score • ✅ Always available
        </p>
      </div>

      <!-- Copied notification -->
      <div 
        v-if="copied" 
        class="fixed bottom-8 right-8 bg-cyan-500 text-gray-900 px-6 py-3 rounded-lg font-bold shadow-lg"
      >
        ✅ Config copied to clipboard!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const copied = ref(false)

function copyConfig(fontName: string) {
  let config = ''
  
  if (fontName === 'System Fonts') {
    config = `// No @nuxt/fonts needed - just use in Tailwind:
// tailwind.config.js
fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  mono: ['ui-monospace', 'Courier New', 'monospace']
}`
  } else {
    config = `// nuxt.config.ts
fonts: {
  families: [
    { name: '${fontName}', provider: 'google' }
  ]
}

// Then use in CSS/Tailwind:
font-family: '${fontName}', monospace;`
  }
  
  navigator.clipboard.writeText(config)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// Load all fonts for demo
useHead({
  link: [
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap' },
  ]
})
</script>
