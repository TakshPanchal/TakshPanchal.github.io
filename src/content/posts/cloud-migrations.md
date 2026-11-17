---
title: Two cloud migrations in one year
description: Moving a production backend to Fly.io and a Next.js frontend to Cloudflare Workers, and what the cost work around them taught me.
date: 2026-10-30
tags: [infrastructure, cost, migration]
---

In 2026 I moved both halves of Superboard to new homes: the NestJS backend from Porter (on AWS) to Fly.io, and the Next.js frontend from AWS Amplify to Cloudflare Workers. Neither move was for fun. Both were about cost, control and visibility.

## Backend: Porter to Fly.io

The backend is more than an API. It has an always-on queue worker and six scheduled jobs (leaderboards, snapshots, transaction resolution, cleanup). The new layout on Fly:

- API and worker as separate apps, so a slow job can't starve requests
- scheduled jobs as **short-lived machines** started by a small Go scheduler, so they cost nothing between runs
- a **preview API for every pull request**, destroyed when the PR closes
- a self-hosted OpenTelemetry collector and log shipper sending traces and logs to one place

I wrote a cutover runbook first, rehearsed it on dev, then moved prod.

## Frontend: Amplify to Cloudflare Workers

Amplify was expensive mostly because of server-side rendering and image optimization. Before moving anything I attacked the cause:

| | Before | After cache rules |
|---|---|---|
| SSR requests / day | 1.2M | 276K |
| Outbound data | baseline | −96% |
| Render compute | baseline | −84% |

Then I moved to Workers using OpenNext, with R2 as the page cache. The cutover kept Amplify alive for a **14-day rollback window**, ran automated smoke tests from CI, and finished with zero exceptions. Projected hosting cost dropped by about half.

## The cost bugs hiding in plain sight

The biggest savings came from bugs, not migrations:

- **A restart loop ran a cron job 11 times per tick.** Our database bill went over its cap. Fixing the restart policy, and changing how the leaderboard view refreshed, shrank that view from **1,372 MB to 258 MB**.
- **The log pipeline was silently dropping ~98% of logs.** A batching bug meant 8.4M events sent, 139K stored. Nobody noticed because the dashboards still had *some* data.
- **"DB pool saturation" alerts weren't the database.** Synchronous trace export was freezing the Node event loop. I added an event-loop-lag metric so the next person sees the real cause.
- **CI runners on ARM** cost about a fifth as much per minute as the default.

## Lessons

1. Cut the load before you move it. Caching made the migration smaller and safer.
2. Always keep the old platform running until the new one has survived real traffic.
3. Check that your telemetry is complete before you trust it.
