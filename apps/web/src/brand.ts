// Brand config: one shape for product name, tagline, links, logo and theme.
//
// Defaults come from the build (VITE_BRAND_* / VITE_SITE_URL, see vite.config.ts).
// A deployment can override any of them at runtime without rebuilding the bundle
// by serving a JSON document at /branding.json, e.g.
//
//   { "name": "Acme Mail", "tagline": "Mail that stays yours.",
//     "product": "webmail", "url": "https://mail.acme.com",
//     "contactEmail": "postmaster@acme.com", "themeColor": "#0F62FE",
//     "logoUrl": "/acme-logo.svg", "faviconUrl": "/acme-favicon.svg" }
//
// Missing, empty or invalid values fall back to the defaults; a missing
// /branding.json (404) just means "defaults". Static pages (privacy, terms,
// 404) pick the same values up through the data-brand-* attributes that
// applyBrand() fills in.

const env = import.meta.env

export type BrandLink = { label: string; href: string }

export type Brand = {
  name: string
  tagline: string
  product: string
  url: string
  contactEmail: string
  contactAddress: string
  themeColor: string
  logoUrl: string
  faviconUrl: string
  links: BrandLink[]
}

export const DEFAULT_BRAND: Brand = {
  name: env.VITE_BRAND_NAME || 'IRIS',
  tagline: env.VITE_BRAND_TAGLINE || 'Every message finds its way.',
  product: env.VITE_BRAND_PRODUCT || 'webmail',
  url: (env.VITE_SITE_URL || '').replace(/\/$/, ''),
  contactEmail: env.VITE_CONTACT_EMAIL || '',
  contactAddress: env.VITE_CONTACT_ADDRESS || '',
  themeColor: env.VITE_BRAND_THEME_COLOR || '#B83232',
  logoUrl: '',
  faviconUrl: '',
  links: [],
}

export let BRAND: Brand = { ...DEFAULT_BRAND }

const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v.trim() : fallback)

function merge(raw: unknown): Brand {
  const j = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const links = Array.isArray(j.links)
    ? j.links
        .filter((l): l is BrandLink => !!l && typeof l === 'object' && typeof (l as BrandLink).label === 'string' && typeof (l as BrandLink).href === 'string')
        .map((l) => ({ label: l.label, href: l.href }))
    : DEFAULT_BRAND.links
  return {
    name: str(j.name, DEFAULT_BRAND.name),
    tagline: str(j.tagline, DEFAULT_BRAND.tagline),
    product: str(j.product, DEFAULT_BRAND.product),
    url: str(j.url, DEFAULT_BRAND.url).replace(/\/$/, ''),
    contactEmail: str(j.contactEmail, DEFAULT_BRAND.contactEmail),
    contactAddress: str(j.contactAddress, DEFAULT_BRAND.contactAddress),
    themeColor: str(j.themeColor, DEFAULT_BRAND.themeColor),
    logoUrl: str(j.logoUrl, DEFAULT_BRAND.logoUrl),
    faviconUrl: str(j.faviconUrl, DEFAULT_BRAND.faviconUrl),
    links,
  }
}

/** Host shown to the user (login footer, "sign in with your X mailbox"). */
export function brandHost(): string {
  if (BRAND.url) {
    try { return new URL(BRAND.url).host } catch { /* unusable url — fall through */ }
  }
  return location.hostname
}

function setMeta(selector: string, attr: string, value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

/** URL of the manifest with the deployment's name and colours baked in. */
function brandManifest(): string {
  const manifest = {
    name: `${BRAND.name} ${BRAND.product}`,
    short_name: BRAND.name,
    description: `${BRAND.product} for ${brandHost()}.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F7F2',
    theme_color: BRAND.themeColor,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  return URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }))
}

/** Rewrites the branding of whatever document is loaded. Runs once per page. */
function applyBrand() {
  // theme colour + PWA manifest
  setMeta('meta[name="theme-color"]', 'content', BRAND.themeColor)
  const manifest = document.head.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (manifest) manifest.href = brandManifest()

  // icon overrides
  if (BRAND.faviconUrl) {
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"],link[rel="apple-touch-icon"]').forEach((l) => { l.href = BRAND.faviconUrl })
  }

  // social cards
  setMeta('meta[property="og:site_name"]', 'content', BRAND.name)
  setMeta('meta[property="og:image:alt"]', 'content', `${BRAND.name} ${BRAND.product}`)
  setMeta('meta[name="twitter:image:alt"]', 'content', `${BRAND.name} ${BRAND.product}`)

  // Static pages: swap the build-time name for the deployment's.
  if (document.body.dataset.page && BRAND.name !== DEFAULT_BRAND.name) {
    document.title = document.title.split(DEFAULT_BRAND.name).join(BRAND.name)
    setMeta('meta[property="og:title"]', 'content', document.title)
  }

  // Markup hooks shared with the static pages.
  document.querySelectorAll<HTMLElement>('[data-brand-name]').forEach((el) => { el.textContent = BRAND.name })
  document.querySelectorAll<HTMLAnchorElement>('[data-brand-url]').forEach((el) => { if (BRAND.url) el.href = BRAND.url })
  document.querySelectorAll<HTMLAnchorElement>('[data-brand-link]').forEach((el) => { el.setAttribute('aria-label', `${BRAND.name} — home`) })
  document.querySelectorAll<HTMLElement>('[data-brand-logo]').forEach((slot) => {
    if (!BRAND.logoUrl) return
    const img = document.createElement('img')
    img.src = BRAND.logoUrl
    img.alt = ''
    img.className = 'brand-logo'
    slot.replaceChildren(img)
  })
}

let started: Promise<void> | null = null

/** Load /branding.json (if any), then apply it. Safe to call more than once. */
export function initBrand(): Promise<void> {
  started ??= (async () => {
    try {
      const res = await fetch('/branding.json', { cache: 'no-store', credentials: 'same-origin' })
      if (res.ok) BRAND = merge(await res.json().catch(() => null))
    } catch { /* offline or blocked — defaults are fine */ }
    applyBrand()
  })()
  return started
}
