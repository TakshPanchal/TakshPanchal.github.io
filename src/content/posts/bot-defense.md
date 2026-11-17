---
title: Fighting a reward-farming bot army
description: What happened when bots found our reward endpoints, why the obvious fix was wrong, and how we kept real users unblocked.
date: 2026-07-15
tags: [security, cloudflare, incident]
---

Superboard pays users for completing quests. That makes it a target: if a bot can complete a quest, a bot farm can complete it ten thousand times. In mid-2026 one did.

## What it looked like

The first signal wasn't fraud. It was an alert saying our API was returning **504s on 20–30% of requests**. The instinct was to scale, so we went from 2 to 6 API machines. The error rate didn't move.

That was the clue. When I split the 504s by protocol, **100% of them came from malformed connections**. Real HTTP/2 and HTTP/3 traffic had zero 504s. Real users were fine; the "outage" was bots holding sockets open badly. Scaling had been the wrong fix, and it cost money.

> Before you scale, find out *who* is failing. An error rate is an average over very different clients.

## Layer 1: block where bots live

Most of the farm ran from datacenter and hosting networks, not homes or phones. I built a list of roughly **737 hosting networks (ASNs)** and put it into Cloudflare's firewall.

The first version showed browsers a challenge instead of blocking. That didn't hold: headless browsers solved it, and we logged **801K challenge bypasses** on one host. Switching the API to a hard block on a hand-vetted subset of pure-hosting networks took bypasses to **zero** within minutes. The website kept the softer challenge, since that's where real people on odd networks show up.

## Layer 2: rate limits where the money is

The plan only gave us two rate-limit rules, so I spent them carefully:

- a tight limit with a long block on the reward-collect and claim endpoints, the only ones worth farming
- a loose backstop across the rest of the API

## Layer 3: close the side door

A firewall at the edge is useless if bots can reach the origin directly. I locked the origin with an AWS WAF allowlist so it only accepts Cloudflare's IP ranges.

## The part nobody talks about: false positives

Every rule blocked someone real. Over the following weeks I fixed:

- **~3,256 legitimate VPN users a day** who couldn't log in, because a few consumer VPN providers were in the hosting list
- **~1.8K real requests a day** blocked by hotlink protection, 91% from Indian mobile ISPs
- users behind carrier NAT (thousands of phones sharing one IP) tripping the login rate limit

Each fix came from reading the firewall logs, not from complaints. Most blocked users don't complain; they just leave.

## Inside the app

The edge stops volume. The app stops cleverness: campaign disqualification to strip sybil wallets from leaderboards, a blacklist that locks a user's wallets and social accounts together, and per-user limits on expensive verifications.

## What I'd tell someone facing this

1. Segment your errors before you scale anything.
2. Challenges slow down humans more than modern bots. Block what you're sure of; challenge only what you're not.
3. Budget time for false positives. They are most of the work.
