# Fork notes: RustMailStack / white-label webmail

This repository is a fork of [Urdemonlord/irisproject](https://github.com/Urdemonlord/irisproject).
Upstream stays the source of truth for features and fixes; this fork carries only what the
RustMailStack package needs: **runtime branding** instead of a hardcoded identity.

Upstream remote:

```bash
git remote add upstream https://github.com/Urdemonlord/irisproject.git
git fetch upstream && git merge upstream/main      # or: git rebase upstream/main
```

## What differs from upstream

| Area | Change | Files |
|---|---|---|
| Branding | Product name, tagline, logo, theme colour, contact details and footer links are read at runtime from `/branding.json`; defaults are `IRIS`. Nothing is hardcoded per deployment any more | `apps/web/src/brand.ts`, `apps/web/src/site.ts`, `apps/web/src/main.ts` |
| Static pages | Privacy, Terms and 404 carry `data-brand-*` hooks that `brand.ts` fills in after the same fetch | `apps/web/{404,privacy,terms}/…`, `apps/web/src/legal.ts` |
| Assets | Upstream icons and OG image (neutral); a deployment overrides them with `logoUrl` / `faviconUrl` in `branding.json` | `apps/web/public/*` |

Everything else (mail handling, JMAP client, auth, CSRF, the mail-body origin separation, temporary
inboxes, admin dashboard) is upstream code, so upstream fixes apply cleanly.

Branding schema and deployment notes: [`docs/branding.md`](docs/branding.md).

## Keeping the diff small

The whole fork diff is `brand.ts` plus the `data-brand-*`/`BRAND.*` call sites. **Do not**
reformat or restructure files while touching them. Every unrelated reformat turns the next
`git merge upstream/main` into a conflict. New branding needs go into `brand.ts` and
`branding.json`, never into ad-hoc strings.

## Releases

The RustMailStack package pins a tag of this repository (`IRIS_REF` in `versions.env`).
Tagging `vX.Y.Z` here is what makes a new webmail version shippable:

```bash
git merge upstream/main && git push origin main
git tag v0.2.0 && git push origin v0.2.0
```

## Licence

Unchanged: dual MIT / Apache-2.0, see `LICENSE-MIT` and `LICENSE-APACHE`. Upstream copyright
notices are kept in every modified file.
