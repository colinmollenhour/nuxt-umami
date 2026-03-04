# Nuxt Umami

[![npm](https://img.shields.io/npm/v/nuxt-umami?style=flat-square)](https://www.npmjs.com/package/nuxt-umami/)
[![Downloads](https://img.shields.io/npm/dt/nuxt-umami.svg?style=flat-square)](https://www.npmjs.com/package/nuxt-umami)
[![License](https://img.shields.io/npm/l/nuxt-umami?style=flat-square)](https://github.com/ijkml/nuxt-umami/blob/main/LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-21262d?style=flat-square&logo=github&logoColor=db61a2)](https://github.com/sponsors/ijkml)

Integrate [**Umami Analytics**](https://umami.is/) into your Nuxt websites/applications.

## 🚀 Try it online

<a href="https://stackblitz.com/edit/nuxt-umami"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz"></a>

## ✨ Get started

Install and add to Nuxt with one command

```sh
npx nuxi module add nuxt-umami
```

## 📖 Config options, Usage, and FAQs

[Read the full documentation.](https://umami.nuxt.dev/)

---

## Fork: colinmollenhour/nuxt-umami

This fork adds several bug fixes and improvements on top of the upstream
[ijkml/nuxt-umami](https://github.com/ijkml/nuxt-umami) v3.2.1. See
[TODO.md](./TODO.md) for full details. Use this if you need:

- Distinct user ID support in `umIdentify` for authenticated SaaS users (Umami v2.18.0+)
- Accurate geo-location when using `proxy: 'cloak'` on Netlify/Vercel
- Fixed duplicate pageview tracking with nested `<NuxtPage>` layouts
- Nuxt v4 compatibility

### Install this fork

**pnpm**
```sh
pnpm add github:colinmollenhour/nuxt-umami#v3.3.0
```

**npm**
```sh
npm install github:colinmollenhour/nuxt-umami#v3.3.0
```

**yarn**
```sh
yarn add github:colinmollenhour/nuxt-umami#v3.3.0
```

Or pin to the release zip for reproducible installs:
```sh
pnpm add https://github.com/colinmollenhour/nuxt-umami/releases/download/v3.3.0/nuxt-umami-v3.3.0.zip
```

> **Note:** Because this fork is not published to npm, `npx nuxi module add` will not
> work. Register the module manually as shown below.

### Configure

Add to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-umami'],
  umami: {
    id: 'your-website-id',
    host: 'https://your-umami-instance.example.com',
    autoTrack: true,
    // proxy: 'cloak',       // hide your Umami endpoint from the browser
    // useDirective: true,   // enable v-umami directive
    // ignoreLocalhost: true,
    // domains: ['mysite.com'],
  },
});
```

Full configuration reference: [umami.nuxt.dev/api/configuration](https://umami.nuxt.dev/api/configuration)

### Usage

All composables are auto-imported. See [umami.nuxt.dev/api/usage](https://umami.nuxt.dev/api/usage) for the full API.

```ts
// Track a page view (called automatically if autoTrack: true)
umTrackView()

// Track a named event with optional data
umTrackEvent('signup-click', { plan: 'pro' })

// Identify an authenticated user (SaaS portal use case)
umIdentify('[email protected]')
umIdentify('[email protected]', { plan: 'pro', company: 'Acme' })

// Track revenue
umTrackRevenue('subscription', 49, 'USD')
```

### Fork changes vs upstream v3.2.1

| Fix | Description |
|-----|-------------|
| SPA referral attribution | `?ref=` param was sent on every page, not just the landing page |
| Duplicate pageview | Nested `<NuxtPage>` caused double-tracking per navigation |
| `umIdentify` distinct ID | Added `(id)` and `(id, data)` signatures; ID auto-included in all subsequent events |
| Cloak proxy geo-location | `X-Forwarded-For` now forwarded so Umami sees the real client IP |
| Event name length | Names over 50 chars are warned and pre-truncated to match Umami's server limit |
| Currency normalization | `umTrackRevenue` now always emits uppercase currency codes |
| Nuxt v4 peer deps | `@nuxt/kit`/`@nuxt/schema` ranges broadened to `>=3.15.4` |
| Runtime config typing | `runtimeConfig.umami` is now properly typed (was untyped `_proxyUmConfig`) |
| Structured logging | Module setup uses `useLogger` from `@nuxt/kit` instead of `console.warn` |
| Proxy validator | Body key-count check removed; forward-compatible with Umami API additions |

---

## Prompt for AI assistants

Use this prompt when setting up this module in a new project:

---

> Install the `colinmollenhour/nuxt-umami` fork of the nuxt-umami module. This is a
> fork of [ijkml/nuxt-umami](https://github.com/ijkml/nuxt-umami) with additional bug
> fixes; the full API and configuration docs are at https://umami.nuxt.dev/ but
> installation differs from the official docs.
>
> **Install:**
> ```sh
> pnpm add https://github.com/colinmollenhour/nuxt-umami/releases/download/v3.3.0/nuxt-umami-v3.3.0.zip
> ```
>
> **Register in `nuxt.config.ts`** (do NOT use `npx nuxi module add` — it only works for
> npm-published packages):
> ```ts
> export default defineNuxtConfig({
>   modules: ['nuxt-umami'],
>   umami: {
>     id: process.env.NUXT_UMAMI_ID,
>     host: process.env.NUXT_UMAMI_HOST,
>     autoTrack: true,
>     proxy: 'cloak',
>   },
> })
> ```
>
> **Environment variables** (add to `.env` and your deployment secrets):
> ```
> NUXT_UMAMI_ID=your-website-id
> NUXT_UMAMI_HOST=https://your-umami-instance.example.com
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
