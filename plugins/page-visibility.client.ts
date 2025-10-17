/**
 * Page Visibility Plugin
 * 
 * Pauses all animations when the page is hidden (backgrounded tab)
 * to prevent GPU exhaustion and Chrome rendering issues.
 * 
 * This is critical for preventing:
 * - Chrome compositor thread lockups
 * - GPU memory exhaustion
 * - Browser-wide unresponsiveness
 * - Rendering artifacts
 */

export default defineNuxtPlugin(() => {
  if (process.client) {
    // Set initial visibility state
    const isVisible = !document.hidden;
    document.documentElement.setAttribute('data-page-visible', isVisible.toString());

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      document.documentElement.setAttribute('data-page-visible', visible.toString());
      
      // Optional: Log for debugging (can be removed in production)
      if (!visible) {
        console.debug('[Animation Control] Page hidden - animations paused');
      } else {
        console.debug('[Animation Control] Page visible - animations resumed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup (will run on plugin unmount, though rare in Nuxt)
    return {
      provide: {},
      hooks: {
        'app:unmounted': () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        },
      },
    };
  }
});
