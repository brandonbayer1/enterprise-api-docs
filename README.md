# Enterprise API Docs

> Proprietary API reference for the Enterprise platform.

**Production:** https://developers.enterprisecrm.com

[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1-green.svg)](./docs/api-reference/openapi.all-modules.json)

## Overview

This repository is the source of truth for the Enterprise API documentation:

- **1,236 API operations** across **20 modules**
- **Guides** — authentication, getting started, webhooks, and per-module overviews
- **API Reference** — interactive OpenAPI docs (Scalar API Reference widget)

## Project structure

```
enterprise-api-docs/
├── docs/
│   ├── api-reference/          # OpenAPI 3.1 specs (per module)
│   └── guides/                 # Markdown guide pages
├── assets/                     # Site CSS, search, favicons, theme helpers
├── scripts/
│   ├── build-static.mjs        # Production static site build
│   ├── build-legacy.mjs        # Legacy Scalar SPA build (rollback only)
│   └── validate-dist.mjs       # Post-build smoke tests
├── scalar.config.json          # Scalar Docs config (preview + route source)
├── patch-preview.mjs           # Keeps favicon/CSS injected during preview
├── DEPLOY_CLOUDFLARE.md        # Hosting & deployment details
└── README.md
```

## Local development (authoring)

Use Scalar's preview server to edit guides and validate navigation:

```bash
npm run preview
# equivalent to:
# npx @scalar/cli project preview & node patch-preview.mjs
```

Open **http://localhost:7970** — live reload on file changes.

Validate config:

```bash
npm run check-config
```

## Production build

The production site is a **static-first** build for fast first paint:

| Route | Delivery |
| ----- | -------- |
| `/`, `/getting-started`, guide pages | Pre-rendered HTML (~instant load) |
| `/api/*` | Static shell + lazy-loaded Scalar API Reference widget |

```bash
npm run build              # writes dist/ (86 files, ~6 MB)
npm run validate:dist      # smoke test (local serve or set VALIDATE_BASE_URL)
```

## Deployment

| Command | Target |
| ------- | ------ |
| `pnpm publish:api-docs` (from **enterprise** repo) | Generate specs → build → **Cloudflare Pages** |
| `npm run deploy:production` | **Cloudflare Pages** → `developers.enterprisecrm.com` |

See **[DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md)** for the full publish workflow, CI, and architecture.

### Where the site is hosted

| URL | Platform | Notes |
| --- | -------- | ----- |
| https://developers.enterprisecrm.com | Cloudflare Pages | **Production** |
| https://enterprise-api-docs-9s9.pages.dev | Cloudflare Pages | Deploy preview URL |

## Legacy Scalar SPA build

The previous production build bundled the full Scalar Docs SPA (~29,000 JS chunks, ~159 MB).
It caused multi-second white screens on first load. Kept for emergency rollback only:

```bash
npm run build:legacy
npm run deploy:production   # deploy legacy build to Cloudflare Pages
```

## Legal

Copyright © 2026 Enterprise Marketplace Ltd. All rights reserved.

Use is governed by the [Enterprise Master Services Agreement](https://enterprisecrm.com/legal/msa).
