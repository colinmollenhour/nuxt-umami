# Nuxt Umami

[![License](https://img.shields.io/npm/l/nuxt-umami?style=flat-square)](https://github.com/ijkml/nuxt-umami/blob/main/LICENSE)

Integrate [**Umami Analytics**](https://umami.is/) into your Nuxt websites/applications.

---

## Fork: colinmollenhour/nuxt-umami

This fork adds several bug fixes and improvements on top of the upstream
[ijkml/nuxt-umami](https://github.com/ijkml/nuxt-umami) v3.2.1.
Use this if you need:

- Distinct user ID support in `umIdentify` for authenticated SaaS users (Umami v2.18.0+)
- Accurate geo-location when using `proxy: 'cloak'` on Netlify/Vercel
- Fixed duplicate pageview tracking with nested `<NuxtPage>` layouts
- True runtime env var support — change Umami endpoint/ID at server start without rebuilding

### Install this fork

Install from the release tarball (the only supported method — `dist/` is not committed to git):

```sh
pnpm add https://github.com/colinmollenhour/nuxt-umami/releases/download/v3.4.0/nuxt-umami-v3.4.0.tgz
# or
npm install https://github.com/colinmollenhour/nuxt-umami/releases/download/v3.4.0/nuxt-umami-v3.4.0.tgz
# or
yarn add https://github.com/colinmollenhour/nuxt-umami/releases/download/v3.4.0/nuxt-umami-v3.4.0.tgz
```

> **Note:** Because this fork is not published to npm, `npx nuxi module add` will not
> work. Register the module manually as shown below.

### Configure

Add to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-umami'],
  umami: {
    host: 'https://your-umami-instance.example.com',
    id: 'your-website-id',
    autoTrack: true,
    // proxy: 'cloak',       // hide your Umami endpoint from the browser
    // useDirective: true,   // enable v-umami directive
    // ignoreLocalhost: true,
    // domains: ['mysite.com'],
  },
});
```

The `host` and `id` values above are build-time defaults. To override them at server start
without rebuilding, use the environment variables described below.

Full configuration reference: [umami.nuxt.dev/api/configuration](https://umami.nuxt.dev/api/configuration)

### Environment variables

Config values are stored in Nuxt `runtimeConfig` and can be overridden at **server start**
(no rebuild required) using these env vars:

```sh
# proxy: false or proxy: 'direct'  (public — included in client bundle)
NUXT_PUBLIC_UMAMI_WEBSITE=your-website-id
NUXT_PUBLIC_UMAMI_ENDPOINT=https://your-umami-instance.example.com/api/send

# proxy: 'cloak'  (server-only — never exposed to the client)
NUXT_UMAMI_WEBSITE=your-website-id
NUXT_UMAMI_ENDPOINT=https://your-umami-instance.example.com/api/send

# Optional — overrides the tag at runtime (all proxy modes)
NUXT_PUBLIC_UMAMI_TAG=my-tag
```

> Note: `NUXT_PUBLIC_UMAMI_ENDPOINT` is the fully-resolved endpoint URL including the
> path (e.g. `/api/send`). It corresponds to `host` + `customEndpoint` from the module
> options, not `host` alone.

### Usage

All composables are auto-imported. See [umami.nuxt.dev/api/usage](https://umami.nuxt.dev/api/usage) for the full API.

```ts
// Track a page view (called automatically if autoTrack: true)
umTrackView();

// Track a named event with optional data
umTrackEvent('signup-click', { plan: 'pro' });

// Identify an authenticated user (SaaS portal use case)
umIdentify('[email protected]');
umIdentify('[email protected]', { plan: 'pro', company: 'Acme' });

// Track revenue
umTrackRevenue('subscription', 49, 'USD');
```

### Fork changes vs upstream v3.2.1

| Change | Description |
|--------|-------------|
| SPA referral attribution | `?ref=` param was sent on every page, not just the landing page |
| Duplicate pageview | Nested `<NuxtPage>` caused double-tracking per navigation |
| `umIdentify` distinct ID | Added `(id)` and `(id, data)` signatures; ID auto-included in all subsequent events |
| Cloak proxy geo-location | `X-Forwarded-For` now forwarded so Umami sees the real client IP |
| Event name length | Names over 50 chars are warned and pre-truncated to match Umami's server limit |
| Currency normalization | `umTrackRevenue` now always emits uppercase currency codes |
| Nuxt v4 peer deps | `@nuxt/kit`/`@nuxt/schema` ranges broadened to `>=3.15.4` |
| Runtime config typing | `runtimeConfig.umami` is now properly typed via module augmentation |
| Structured logging | Module setup uses `useLogger` from `@nuxt/kit` instead of `console.warn` |
| Proxy validator | Body key-count check removed; forward-compatible with Umami API additions |
| Runtime env vars | Config moved to Nuxt `runtimeConfig`; `NUXT_PUBLIC_UMAMI_*` / `NUXT_UMAMI_*` override at server start, not build time |

---

## Prompt for AI assistants

Use this prompt when setting up this module in a new project:

---

> Install the `colinmollenhour/nuxt-umami` fork of the nuxt-umami module. This is a
> fork of [ijkml/nuxt-umami](https://github.com/ijkml/nuxt-umami) with additional bug
> fixes; the full API and configuration docs are at https://umami.nuxt.dev/ but
> installation differs from the official docs.
>
> **Install from the release tarball** (the only supported method — `npx nuxi module add`
> and `github:` installs do not work for this fork):
> ```sh
> pnpm add https://github.com/colinmollenhour/nuxt-umami/releases/download/v3.4.0/nuxt-umami-v3.4.0.tgz
> ```
>
> **Register in `nuxt.config.ts`:**
> ```ts
> export default defineNuxtConfig({
>   modules: ['nuxt-umami'],
>   umami: {
>     host: 'https://your-umami-instance.example.com',
>     id: 'your-website-id',
>     autoTrack: true,
>     proxy: 'cloak',
>   },
> });
> ```
>
> **Environment variables** — these override the `host`/`id` values above at server start
> (no rebuild needed). Use the set that matches your `proxy` setting:
> ```sh
> # proxy: 'cloak'  (server-only — never exposed to the client)
> NUXT_UMAMI_WEBSITE=your-website-id
> NUXT_UMAMI_ENDPOINT=https://your-umami-instance.example.com/api/send
>
> # proxy: false (default) or proxy: 'direct'  (public — in client bundle)
> NUXT_PUBLIC_UMAMI_WEBSITE=your-website-id
> NUXT_PUBLIC_UMAMI_ENDPOINT=https://your-umami-instance.example.com/api/send
> ```
>
> **Auto-imported composables** (no imports needed in `<script setup>`):
> - `umTrackView(path?, referrer?)` — track a page view
> - `umTrackEvent(name, data?)` — track a named event; `name` max 50 chars
> - `umIdentify(userId)` / `umIdentify(userId, data)` / `umIdentify(data)` — identify
>   the current user; the ID persists across all subsequent events in the session
> - `umTrackRevenue(name, amount, currency?)` — track a revenue event
>
> **Directive** (enable with `useDirective: true` in config):
> ```html
> <button v-umami="'cta-click'">Get started</button>
> ```
>
> Full config and usage docs: https://umami.nuxt.dev/api/configuration and
> https://umami.nuxt.dev/api/usage

---

<hr />

MIT License ©2022-PRESENT [ML](https://github.com/ijkml/)
