---
title: "One build, many regions: launching Superboard in Korea"
description: Serving a Korean site from the same Next.js build as the global one, without giving up static rendering.
date: 2026-07-14
tags: [architecture, nextjs, i18n]
---

In mid-2026 we launched `korea.superboard.xyz`: Korean UI, Korean content, Kakao login, and its own waitlist. The tempting shortcut was a separate app or a Korea branch. I didn't want two codebases drifting apart, so the goal was **one codebase, one build, many regions**.

## Region is a channel, not a deployment

The backend already scoped content by a **channel**. The frontend's job is to work out which region a request belongs to and pass it along as an `x-sb-region` header. On the server, the API keeps the channel in request-scoped context and filters queries and cache keys by it, so Korean and global content never mix.

## Step 1: route by host

Edge middleware resolves the region from the host name:

- `korea.superboard.xyz` → region `korea`, request stamped with `x-sb-region: korea`
- anything unknown (`www`, the apex, `localhost`) → `global`
- a `-dev` or `-staging` suffix is stripped, so dev hosts map to the same region

All of it comes from one **region registry**: label, locale, backend channel, canonical origin, and a waitlist flag per region. Adding a market is meant to be one new row plus one translation file.

## Step 2: keep it static

This was the hard constraint. Reading the host header inside a page forces Next.js into **dynamic rendering** and skips the route cache, so every request would hit the server.

The fix was to make region a **build-time route parameter**: the whole app tree moved under an `app/[region]/` segment. Middleware rewrites `korea.superboard.xyz/quests` to `/korea/quests` internally, while public URLs stay clean. Server components read the region from the route param instead of the request, so pages stay statically renderable. The global region is prerendered; Korean pages render on demand and are then cached.

## Step 3: send Korean visitors to the right place, once

A first-time visitor to the global site gets a **307 redirect** to the Korean site if their browser asks for Korean (`Accept-Language: ko`) or Cloudflare places them in Korea (`cf-ipcountry: KR`). A one-year cookie guards against loops, and the redirect never fires on the Korean host itself, on preview hosts, or for API routes. Crawlers don't send those signals, so search engines index the global site normally.

One dependency surprised me: the country header only exists if Cloudflare sits in front of the app. Until we put Cloudflare in front of our host, the redirect ran on language alone.

## Step 4: translate without breaking the build

UI strings moved to `next-intl` in five waves (app shell, quest flow, profile, campaigns and loops, games), with a full Korean catalog of roughly 900 keys. A test script checks **key parity** between English and Korean, so a missing translation is caught before release instead of showing a raw key to users.

Smaller details that mattered:

- `og:locale` is set per region, so Korean share previews stay Korean
- canonical and Open Graph URLs resolve against the Korean origin, not the global one
- a Korean font loads only for the `ko` locale, with a minimum weight so CJK text doesn't render thin

## Step 5: ship behind switches

- a **waitlist kill switch** per region, so the Korean site could run as a waitlist and flip to the full app with a config change, not a code change
- **flag-gated Basic Auth** on the Korean host, so we could test it in production before opening it
- **Kakao OAuth** alongside our existing social logins

## What I'd do again

1. Treat region as data (a registry row), not as code paths sprinkled through the app.
2. Protect static rendering on purpose. It's easy to lose with one header read.
3. Make translations a contract with a parity check, not a runtime hope.
