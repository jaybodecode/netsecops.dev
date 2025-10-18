/**
 * Lazy load Google Tag Manager to avoid blocking main thread
 * Only loads after user interaction or 5 seconds, whichever comes first
 */

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const gtmId = config.public.gtmId as string
  if (!gtmId) {
    return
  }

  // Use GTM ID from runtime config (GTM-NDQRG373)
  const actualGtmId = gtmId

  let isLoaded = false

  const loadGTM = () => {
    if (isLoaded) return
    isLoaded = true

    // Load GTM container script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${actualGtmId}`

    script.onload = () => {
    //  console.log('GTM container loaded lazily ✓')
    }

    document.head.appendChild(script)

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || []

    // Add noscript fallback (required for GTM)
    const noscript = document.createElement('noscript')
    const iframe = document.createElement('iframe')
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${actualGtmId}`
    iframe.height = '0'
    iframe.width = '0'
    iframe.style.display = 'none'
    iframe.style.visibility = 'hidden'
    noscript.appendChild(iframe)

    // Insert noscript at the beginning of body
    document.body.insertBefore(noscript, document.body.firstChild)

    // Clean up event listeners
    removeEventListeners()
  }

  const removeEventListeners = () => {
    window.removeEventListener('scroll', loadGTM)
    window.removeEventListener('mousemove', loadGTM)
    window.removeEventListener('touchstart', loadGTM)
    window.removeEventListener('click', loadGTM)
  }

  // Load GTM on first user interaction
  window.addEventListener('scroll', loadGTM, { once: true, passive: true })
  window.addEventListener('mousemove', loadGTM, { once: true, passive: true })
  window.addEventListener('touchstart', loadGTM, { once: true, passive: true })
  window.addEventListener('click', loadGTM, { once: true, passive: true })

  // Fallback: Load after 5 seconds if no interaction
  setTimeout(loadGTM, 5000)
})