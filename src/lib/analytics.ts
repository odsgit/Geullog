declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
    clarity: ((...args: unknown[]) => void) & { q?: unknown[][] }
  }
}

function loadGoogleAnalytics(measurementId: string) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId)
}

function loadClarity(projectId: string) {
  const clarityStub: Window['clarity'] = (...args: unknown[]) => {
    ;(clarityStub.q = clarityStub.q || []).push(args)
  }
  window.clarity = window.clarity || clarityStub

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.clarity.ms/tag/${projectId}`
  const firstScript = document.getElementsByTagName('script')[0]
  firstScript.parentNode?.insertBefore(script, firstScript)
}

// Only loads in production builds so local/dev usage doesn't pollute analytics.
export function initAnalytics() {
  if (!import.meta.env.PROD) return

  const gaId = import.meta.env.GA_MEASUREMENT_ID
  if (gaId) loadGoogleAnalytics(gaId)

  const clarityId = import.meta.env.CLARITY_PROJECT_ID
  if (clarityId) loadClarity(clarityId)
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params)
}
