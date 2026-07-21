# Deploying to Cloudflare Pages

Production URL: **https://developers.enterprisecrm.com**

## One-command publish (from Enterprise)

The recommended workflow runs from the **enterprise** monorepo and handles
spec generation, docs repo sync, build, and Cloudflare deploy:

```bash
cd ~/Home/Enterprise/enterprise
pnpm publish:api-docs
```

Requires Cloudflare credentials from **1Password** (Engineering → **Cloudflare API Token**),
via `modules/setup-1p.json`, or `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` in the environment.

Options:

| Flag | Effect |
| ---- | ------ |
| `--no-deploy` | Build and validate only |
| `--no-push` | Commit specs locally but skip `git push` to docs repo |
| `--no-commit` | Copy specs only; no git operations in docs repo |
| `--skip-generate` | Skip `generate:openapi` (use existing specs) |
| `--docs-repo <path>` | Override path to `enterprise-api-docs` |

Equivalent from `enterprise/modules`:

```bash
pnpm publish:api-docs
```

Legacy spec-only publish (no build/deploy):

```bash
pnpm run generate:openapi:publish
```

## Architecture (2026 static build)

The site uses a **static-first** build for fast first paint:

| Route | Delivery | First paint |
| ----- | -------- | ----------- |
| Guides (`/`, `/getting-started`, …) | Pre-rendered HTML at build time | Immediate |
| API Reference (`/api/sales`, …) | Static shell + lazy Scalar widget | Shell immediate, widget on demand |
| Search | Client-side (`/search-index.json`) | No server/edge function required |

Build output: **~86 files, ~6 MB** (was ~29,000 JS chunks / ~159 MB with the legacy Scalar SPA).

## Commands (docs repo only)

```bash
npm run build              # static site → dist/
npm run validate:dist      # smoke test paths
npm run deploy:production  # Cloudflare Pages → developers.enterprisecrm.com
```

## Local authoring (unchanged)

```bash
npm run preview            # Scalar live preview @ localhost:7970
npm run check-config       # validate scalar.config.json
```

`patch-preview.mjs` continues to inject favicon/CSS during Scalar preview rebuilds.

## Hosting

| URL | Platform | Status |
| --- | -------- | ------ |
| https://developers.enterprisecrm.com | **Cloudflare Pages** | Production |
| https://enterprise-api-docs-9s9.pages.dev | Cloudflare Pages | Deploy preview URL |

### Custom domain DNS (required)

`developers.enterprisecrm.com` must CNAME to the Pages project — **not** Netlify.

| Setting | Value |
| ------- | ----- |
| Type | `CNAME` |
| Name | `developers` |
| Target | `enterprise-api-docs-9s9.pages.dev` |
| Proxy | Proxied (orange cloud) |

If the CNAME still points at `enterprise-api-docs.netlify.app` while Cloudflare proxy is enabled, the dashboard shows **SSL cipher mismatch** / **522** errors because the edge connects to the wrong origin.

After updating DNS, wait for the Pages custom domain to reach **Active** (hostname + certificate validation) in **Workers & Pages → enterprise-api-docs → Custom domains**.

## GitHub Actions

`.github/workflows/deploy-cloudflare-pages.yml` deploys to Cloudflare Pages on pushes to `main` that touch docs/assets/scripts.

Secrets required:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Cloudflare Pages project

| Setting | Value |
| ------- | ----- |
| Project | `enterprise-api-docs` |
| Production branch | `production` |
| Output directory | `dist` |

## Legacy rollback

The previous Scalar Docs SPA build (~29k chunks) is preserved for emergency rollback:

```bash
npm run build:legacy
npm run deploy:production   # deploy legacy build to Cloudflare Pages
```

## Performance optimizations applied

1. **Static HTML guides** — no client-side boot required for guide pages
2. **Lazy API Reference** — Scalar widget loads only on `/api/*` routes
3. **Client-side search** — no `/multi_search` edge function dependency for the static build
4. **Loading shell** — themed spinner on API pages while Scalar loads
5. **System font stack** — no blocking external font fetch on guide pages
6. **No modulepreload storm** — legacy build preloaded 31 JS modules; static build has none
