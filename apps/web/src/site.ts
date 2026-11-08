// Site-wide concerns shared by the app and the static pages:
// per-page meta tags, cookie consent, opt-in analytics and the footer.

import { BRAND } from './brand'

const env = import.meta.env

// Deployment values: build-time env first, runtime /branding.json (brand.ts)
// on top. Accessors, not constants — the brand loads after this module.
export const SITE = {
  get url() { return (BRAND.url || env.VITE_SITE_URL || location.origin).replace(/\/$/, '') },
  get contactEmail() { return BRAND.contactEmail || env.VITE_CONTACT_EMAIL || '' },
  get contactAddress() { return BRAND.contactAddress || env.VITE_CONTACT_ADDRESS || '' },
  // Umami: script URL + website ID. Analytics stays off unless both are set.
  analyticsSrc: env.VITE_ANALYTICS_SRC || '',
  analyticsWebsiteId: env.VITE_ANALYTICS_WEBSITE_ID || '',
  // Separate origin that serves HTML mail bodies under one-time token
  // URLs. Empty = the app renders mail in a same-origin srcdoc iframe.
  mailContentOrigin: env.VITE_MAIL_CONTENT_ORIGIN || '',
  // Cloudflare Turnstile site key for the login widget. Empty = no
  // widget; the server only requires a token while
  // TURNSTILE_SECRET_KEY is set (see apps/api/src/turnstile.rs).
  // Build-time only: changing it needs a web rebuild.
  turnstileSiteKey: env.VITE_TURNSTILE_SITE_KEY || '',
}
const analyticsConfigured = !!(SITE.analyticsSrc && SITE.analyticsWebsiteId)

// ---------- meta ----------
function meta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    const [, tag, key, name] = selector.match(/^(\w+)\[(\w+)="([^"]+)"\]$/)!
    el = document.createElement(tag)
    el.setAttribute(key, name)
    document.head.append(el)
  }
  el.setAttribute(attr, value)
}

let currentPath = location.pathname
export function setPage(p: { title: string; description: string; path?: string; noindex?: boolean }) {
  const title = p.title === BRAND.name ? `${BRAND.name} — ${BRAND.tagline}` : `${p.title} · ${BRAND.name}`
  const url = SITE.url + (p.path ?? '/')
  document.title = title
  meta('meta[name="description"]', 'content', p.description)
  meta('meta[name="robots"]', 'content', p.noindex ? 'noindex, nofollow' : 'index, follow')
  meta('link[rel="canonical"]', 'href', url)
  meta('meta[property="og:title"]', 'content', title)
  meta('meta[property="og:description"]', 'content', p.description)
  meta('meta[property="og:url"]', 'content', url)
  meta('meta[name="twitter:title"]', 'content', title)
  meta('meta[name="twitter:description"]', 'content', p.description)
  currentPath = p.path ?? '/'
  trackPageview(currentPath)
}

// ---------- consent + analytics ----------
type Consent = 'granted' | 'denied'
const CONSENT_KEY = 'iris_consent'
const readConsent = (): Consent | null => { try { return localStorage.getItem(CONSENT_KEY) as Consent | null } catch { return null } }
const writeConsent = (c: Consent) => { try { localStorage.setItem(CONSENT_KEY, c) } catch { /* private mode */ } }
const analyticsOn = () => analyticsConfigured && readConsent() === 'granted'

type UmamiPayload = Record<string, unknown>
declare global { interface Window { umami?: { track: (p?: (props: UmamiPayload) => UmamiPayload) => void } } }

let analyticsLoaded = false
let pending: string | null = null
const send = (path: string) => window.umami?.track((props) => ({ ...props, url: path, title: document.title }))

function loadAnalytics() {
  if (analyticsLoaded || !analyticsOn()) return
  analyticsLoaded = true
  const s = document.createElement('script')
  s.defer = true
  s.src = SITE.analyticsSrc
  s.dataset.websiteId = SITE.analyticsWebsiteId
  s.dataset.autoTrack = 'false' // we send page views ourselves, with the route only
  s.dataset.domains = new URL(SITE.url).hostname // ignore dev/preview hosts
  s.onload = () => { if (pending) send(pending); pending = null }
  document.head.append(s)
}

let lastTracked = ''
export function trackPageview(path: string) {
  // Only the route is sent — never message ids, addresses, tokens or the query string.
  if (!analyticsOn() || path === lastTracked) return
  lastTracked = path
  loadAnalytics()
  if (window.umami) send(path)
  else pending = path
}

export function showCookieBanner(force = false) {
  document.querySelector('.cookie-banner')?.remove()
  if (!force && readConsent()) return
  const hasAnalytics = analyticsConfigured
  const bar = document.createElement('section')
  bar.className = 'cookie-banner'
  bar.setAttribute('role', 'region')
  bar.setAttribute('aria-label', 'Cookie notice')
  bar.innerHTML = hasAnalytics
    ? `<p>${BRAND.name} uses the cookies needed to sign you in. With your consent we also count anonymous visits — never the content of your mail. <a href="/privacy/#cookies">Details</a></p>
       <div class="cookie-actions"><button type="button" class="btn btn-secondary" data-c="denied">Essential only</button><button type="button" class="btn btn-ink" data-c="granted">Allow analytics</button></div>`
    : `<p>${BRAND.name} uses only the cookies needed to sign you in and protect the forms. No tracking. <a href="/privacy/#cookies">Details</a></p>
       <div class="cookie-actions"><button type="button" class="btn btn-ink" data-c="denied">OK</button></div>`
  bar.addEventListener('click', (e) => {
    const c = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-c]')?.dataset.c as Consent | undefined
    if (!c) return
    writeConsent(c)
    bar.remove()
    if (c === 'granted') { loadAnalytics(); trackPageview(currentPath) }
  })
  document.body.append(bar)
}

export function initSite() {
  loadAnalytics()
  showCookieBanner()
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-cookie-settings]')) { e.preventDefault(); showCookieBanner(true) }
  })
}

// ---------- footer ----------
// Links come from branding.json (`links`); without it we show Privacy/Terms.
export function footerLinks(cls = 'site-footer') {
  const f = document.createElement('footer')
  f.className = cls
  const year = new Date().getFullYear()
  const links = BRAND.links.length
    ? BRAND.links
    : [{ label: 'Privacy', href: '/privacy/' }, { label: 'Terms', href: '/terms/' }]
  const nav = document.createElement('nav')
  nav.setAttribute('aria-label', 'Legal')
  const home = document.createElement('a')
  home.href = BRAND.url || '/'
  home.textContent = BRAND.name
  nav.append(home)
  if (SITE.contactEmail) {
    const contact = document.createElement('a')
    contact.href = `mailto:${SITE.contactEmail}`
    contact.textContent = 'Contact'
    nav.append(contact)
  }
  for (const l of links) {
    const a = document.createElement('a')
    a.href = l.href
    a.textContent = l.label
    nav.append(a)
  }
  const cookie = document.createElement('button')
  cookie.type = 'button'
  cookie.className = 'linklike'
  cookie.dataset.cookieSettings = ''
  cookie.textContent = 'Cookies'
  nav.append(cookie)
  const copy = document.createElement('span')
  copy.textContent = `© ${year} ${BRAND.name}`
  f.append(nav, copy)
  return f
}
