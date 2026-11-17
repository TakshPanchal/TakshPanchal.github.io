---
title: Fighting a reward-farming bot army
description: What happened when bots found our reward endpoints, why the obvious fix was wrong, and how we kept real users unblocked.
date: 2026-07-25
tags: [security, cloudflare, incident]
---

Superboard pays users for completing quests. That makes it a target: if a bot can complete a quest, a bot farm can complete it ten thousand times. In June 2026 one did.

## What it looked like

The first signal was cost: our asset CDN bill spiked as bots hammered it, and digging into that showed organised reward farming. Over the next days the API started returning **504s on 20–30% of requests**. The instinct was to scale, so we went from 2 to 6 API machines. The error rate didn't move.

That was the clue. When I split the 504s by protocol, **100% of them came from malformed connections**. Real HTTP/2 and HTTP/3 traffic had zero 504s. The "outage" was bots holding sockets open badly, not our API falling over. Scaling had been the wrong fix, and it cost money.

> Before you scale, find out *who* is failing. An error rate is an average over very different clients.

## Layer 1: block where bots live

Most of the farm ran from datacenter and hosting networks, not homes or phones. I combined a public bad-ASN list with the networks we saw attacking us, roughly **737 hosting networks (ASNs)**, and put it into Cloudflare's firewall.

The API got a hard block from day one. That locked out real VPN users, so I narrowed it. On the website, the first rule only showed a challenge, and headless browsers solved it: we logged **801K challenge bypasses**. Switching the website to a hard block on **33 hand-vetted pure-hosting networks** took bypasses to **zero within two minutes** (991 blocks, 0 bypasses). The API uses the same 33. The broader list stays a challenge on the website, since that's where real people on odd networks show up.

## Layer 2: rate limits where the money is

The plan only gave us two rate-limit rules, so I spent them carefully:

- a tight limit with a long block on the reward-collect and claim endpoints, the only ones worth farming
- a loose backstop across the rest of the API

## Layer 3: close the side door

A cache at the edge is useless if bots can go around it. Our asset CDN sat on CloudFront behind Cloudflare, and bots were hitting CloudFront directly, skipping the cache and running up the bill. I locked it with an AWS WAF allowlist so it only accepts Cloudflare's IP ranges.

## The part nobody talks about: false positives

Every rule blocked someone real. Alongside the blocking, I fixed:

- **~3,256 legitimate VPN users a day** who couldn't log in, because a few consumer VPN providers were in the hosting list
- **~1.8K real requests a day** blocked by hotlink protection, 91% from Indian consumer ISPs
- users behind carrier NAT (thousands of phones sharing one IP) tripping the login rate limit, fixed first in the app and then in the edge rules

Most of these fixes came from reading the firewall logs, not from complaints. Most blocked users don't complain; they just leave.

## Inside the app

The edge stops volume. The app stops cleverness. We added campaign disqualification to strip sybil wallets from leaderboards, a blacklist that locks a user's wallets and social accounts together, and per-user limits on expensive verifications.

## What I'd tell someone facing this

1. Segment your errors before you scale anything.
2. Challenges slow down humans more than modern bots. Block what you're sure of; challenge only what you're not.
3. Budget time for false positives. They are most of the work.
