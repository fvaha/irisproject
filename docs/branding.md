# Branding

The webmail is white-label. Everything a deployment shows as its own name,
wordmark, logo, theme colour and footer links comes from **`/branding.json`**,
served next to the app. No rebuild, no fork, no code change: edit the file and
reload the page.

## Where it lives

| Deployment | File | Served as |
|---|---|---|
| RustMailStack package | `/etc/iris/branding.json` | `/branding.json` (Caddy `handle /branding.json`) |
| Docker / manual install | `apps/web/dist/branding.json` | `/branding.json` |
| Nothing (file missing) | — | built-in defaults: `IRIS` |

The document is fetched once per page load with `cache: no-store`, so a reload
picks up edits immediately.

## Fields

Every field is optional. Empty or missing values keep the built-in default.

```json
{
  "name": "Acme Mail",
  "tagline": "Mail that stays yours.",
  "product": "webmail",
  "url": "https://mail.acme.com",
  "contactEmail": "postmaster@acme.com",
  "contactAddress": "Acme d.o.o., Ulica 1, 11000 Beograd",
  "themeColor": "#0F62FE",
  "logoUrl": "/acme-logo.svg",
  "faviconUrl": "/acme-favicon.svg",
  "links": [
    { "label": "Privacy", "href": "/privacy/" },
    { "label": "Terms", "href": "/terms/" },
    { "label": "Status", "href": "https://status.acme.com" }
  ]
}
```

| Field | Used for |
|---|---|
| `name` | wordmark, page titles (`Sign in · Acme Mail`), footer, cookie notice, 404/legal pages |
| `tagline` | document title on the sign-in page and the animated login tagline |
| `product` | the small label next to the wordmark (`webmail`), PWA name |
| `url` | canonical URL, Open Graph/canonical links, the footer's home link |
| `contactEmail` | contact link in the footer and on Privacy/Terms; `mailto:` |
| `contactAddress` | postal address block on Privacy/Terms (hidden when empty) |
| `themeColor` | `theme-color` meta and the PWA manifest |
| `logoUrl` | image that replaces the built-in envelope mark (SVG or PNG, square) |
| `faviconUrl` | overrides `favicon.ico`, `favicon.svg` and `apple-touch-icon` |
| `links` | footer legal links; default is Privacy + Terms |

## What is *not* brandable here

- **Server identity.** SMTP/IMAP banners, MX/SPF/DKIM/DMARC and TLS come from
  Stalwart, not the web UI.
- **The mail content itself.** Signatures, auto-replies and Sieve rules are
  per-user/per-server settings.
- **Strings of the app UI.** Those are English in the bundle; the brand name is
  interpolated into the copy that mentions the service.

## Defaults

Set at build time with `VITE_BRAND_NAME`, `VITE_BRAND_TAGLINE`,
`VITE_BRAND_PRODUCT`, `VITE_BRAND_THEME_COLOR`, `VITE_SITE_URL`,
`VITE_CONTACT_EMAIL`, `VITE_CONTACT_ADDRESS` (see `vite.config.ts`). Runtime
`/branding.json` wins over every one of them.
