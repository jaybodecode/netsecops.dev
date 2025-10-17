<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Global cache control to prevent stale content from browser cache
// Users coming from email links will always get fresh content
useHead({
  meta: [
    // Tell browsers to always check with server before using cached version
    { 'http-equiv': 'Cache-Control', content: 'public, max-age=600, must-revalidate' },
  ],
})
</script>
