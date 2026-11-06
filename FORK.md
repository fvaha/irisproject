# Fork notes — vahid.im

This repository is a fork of [Urdemonlord/irisproject](https://github.com/Urdemonlord/irisproject),
maintained for the self-hosted mail stack at **vahid.im**. Upstream stays the source of truth for
features and fixes; this fork carries only deployment-specific changes.

Upstream remote:

```bash
git remote add upstream https://github.com/Urdemonlord/irisproject.git
git fetch upstream && git merge upstream/main      # or: git rebase upstream/main
```

## What differs from upstream

| Area | Change | Files |
|---|---|---|
| Branding | Wordmark and page titles are `vahid.im — Webmail`; the IRIS eye mark is replaced by an envelope mark with a "V" flap | `apps/web/src/main.ts`, `apps/web/src/site.ts`, `apps/web/index.html` |
| Assets | New favicon, app icons, apple-touch-icon and 1200×630 OG image in the vahid.im palette (`#B83232` on `#16130F`) | `apps/web/public/*` |
| Links | Every legal/footer link points at `https://vahid.im`; footer reads `© <year> vahid.im` | `apps/web/src/site.ts`, `apps/web/{404,privacy,terms}/…` |
| Temporary inboxes | **Disabled** — no login-page teaser, no sidebar entry, no mascots. The API routes remain in the code but the feature is not reachable from the UI, and the deployment sets `TEMP_INBOX_DOMAIN=` empty so creation returns 403 | `apps/web/src/main.ts`, `apps/web/src/styles.css` |
| Language | Login tagline and cookie notice are in Serbian | `apps/web/src/main.ts`, `apps/web/src/site.ts` |

Nothing else is patched: mail handling, JMAP client, auth, CSRF and the mail-body origin
separation are untouched, so upstream security fixes apply cleanly.

## Keeping the diff small

Branding lives in a handful of strings and assets. **Do not** reformat or restructure files while
touching them — every unrelated reformat turns the next `git merge upstream/main` into a conflict.

## Licence

Unchanged: dual MIT / Apache-2.0, see `LICENSE-MIT` and `LICENSE-APACHE`. Upstream copyright
notices are kept in every modified file.
