---
title: "/quests: 13.1s to 3.3s on slow mobile"
description: Why nothing on our Next.js app was server-rendered, and the wallet, image and caching changes that cut mobile load time by 75%.
date: 2026-10-30
tags: [performance, nextjs, web-vitals]
---

Our quests page looked server-rendered. It wasn't. Every page shipped an empty shell behind a full-screen preloader, then built everything in the browser after downloading 1.7 MB of JavaScript. On a slow phone that meant a **13-second** wait for the main content.

## How I measured

All numbers below come from a local production preview of the Cloudflare Worker build, cold cache, against the same build of our `dev` branch as the baseline. Mobile used Chrome's slow 4G profile with 4x CPU throttling. Desktop is an average of 3 runs, mobile of 2, so treat them as directional rather than lab-grade.

| `/quests` | Before | After |
|---|---|---|
| LCP, mobile (slow 4G, 4x CPU) | 13.1 s | **3.3 s** |
| LCP, desktop | 607 ms | **92 ms** |
| JS transferred | 1,727 KB | 750 KB |
| Images loaded before scrolling | 2,421 KB | 324 KB |
| Requests | 145 | 87 |
| Requests on a warm reload | 86 | 15 |

## 1. Nothing was server-rendered, because of two providers

Two components at the root were quietly opting the whole app out of server rendering:

- **`AuthProvider` returned `null`** until the browser had fetched the wallet catalog, and a preloader covered the page until then.
- **`ThemeProvider` wrapped the app in an invisible div** until mount, then remounted the whole tree.

The fix was to make both render the same tree on the server and the client, and read browser-only values *after* mount: the auth cookie, the sidebar's saved width, the viewport, and toggles that used to come from `sessionStorage` during render. The subtle part was auth: `isLoading` stays true until the cookie has been read, so redirect logic never sees a fake logged-out user and bounces them.

A `useSearchParams` call near the top also pushed prerendered pages back to client rendering. Moving it into a small Suspense-isolated leaf fixed that.

## 2. Wallet SDKs loaded on every page

We support many wallets across EVM, Solana and Sui, and every page shipped every SDK. Now:

- the wallet config starts with only the injected connector;
- MetaMask SDK, Coinbase and WalletConnect load **only when picked**, or when the user's saved state says they used one last time, so returning users still reconnect;
- custom wallet adapters start loading on **sign-in intent** (hover, focus or touch on a sign-in button) and load **in parallel**: 3.6 s for the cold wallet list on slow 4G, against 5.2 s one after another;
- adapters are kept across modal opens, because rebuilding them leaked wallet-discovery event listeners.

Wallet SDK hosts contacted on page load went from 3–4 to **zero**. `ethers` was removed entirely in favour of `personal_sign` through viem.

A follow-up moved the sign-in message builder and mobile-only Solana SDKs out of the wallet list's critical path. The modal now waits on 354 KB instead of 628 KB (gzip):

| From "Sign in" click to first wallet row | Before | After |
|---|---|---|
| Fast 4G | 1.5 s | 0.6 s |
| Slow 4G | 5.4 s | 2.0 s |

## 3. Media and caching

- The first five spotlight covers load eagerly at high priority; the rest wait.
- Preview videos mount only on first hover.
- A pixel font moved from a render-blocking Google Fonts `@import` to self-hosted `@font-face`.
- A 206 KB SVG icon became a 17 KB WebP.
- Static assets got proper immutable cache headers. On Cloudflare Workers, Next.js `headers()` config is ignored for static assets, so this needed a `_headers` file.

## The one I had to undo

I also routed images through Cloudflare's image optimizer with an edge cache. Two weeks later it started returning 500s once we passed the free-tier transformation limit, and quest icons disappeared. I removed it and moved resizing to upload time instead: avatars are stored already resized to WebP. Optimizing at write time, once, beats optimizing at read time, forever.

## What's left

The largest chunk on every page is still our own contracts package (~665 KB decoded). It's CommonJS without a `sideEffects` flag, so nothing tree-shakes. Fixing it means republishing that package, which is next.

## Lessons

1. Check whether you're actually server-rendering. One provider returning `null` can silently opt out your whole app.
2. Load code on intent, not on page load. Hover and focus give you a few hundred milliseconds for free.
3. Prefer doing expensive work once at write time over on every read.
