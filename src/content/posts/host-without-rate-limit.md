---
title: Rate-limiting a host that never tells you its limit
description: A fix for unbounded concurrency, a convincing chart that turned out to be wrong, and the measurement lesson I keep coming back to.
date: 2026-08-22
tags: [backend, reliability, observability]
---

Superboard verifies on-chain quest tasks by asking block explorers what a wallet did. Most of those explorers run Blockscout, and our client paces itself by reading the `x-ratelimit-remaining` and `x-ratelimit-reset` headers each host sends back.

In August 2026 one quest loop became our **#1 source of failed verifications**, 4.3x the next one: **3,380 failures across 408 users** in a week, about 1,430 of them plain "something went wrong" errors from the explorer behind a partner chain.

## The bug: pacing that fails open

Our limiter only created a budget for a host once it had seen both rate-limit headers. This explorer sent neither. No `x-ratelimit-*`, no `retry-after`, and when overloaded it answered with 500/502/503 instead of 429.

So the code path was:

```ts
const budget = hostBudgets.get(host)
if (!budget) return 0 // no budget learned: never wait
```

No headers, no budget, no throttle, ever. Our concurrency against that host was bounded only by how many users happened to verify at once, and a daily quest loop bunches users into the same hours.

## The fix: a slot cap for hosts that declare nothing

I added `withHostSlot`, a small per-host FIFO semaphore around each request attempt:

```ts
const response = await withHostSlot(this.budgetKeyFor(chain), () =>
  instance.get<T>(url, { timeout }),
)
```

The details that mattered:

- **Only for hosts with no declared limit.** Hosts that send headers are already paced; capping them would waste a paid API's allowance.
- **2 in-flight requests per host per process**, so 4 across our two machines. A probe during a bad window failed 9/10 at 5-way concurrency and 1/20 at 1–4 way.
- **Release in `try/finally` around one call**, not acquire in a request interceptor and release in a response interceptor. A leaked slot shrinks a host's capacity forever, and the error path is exactly where leaks happen.
- **One slot per attempt**, so retry backoff doesn't sit on a slot.

Four tests, written failing first: the cap holds under concurrency, header-declared hosts stay uncapped, a throwing request releases its slot, and slots are per host.

## The chart that convinced me

The PR made a strong case. I bucketed production logs into 5-minute windows and the failure rate climbed with our own request rate:

| Our requests / 5 min | Failures per request |
|---|---|
| 5.7 | 2.8% |
| 18 | 2.9% |
| 31 | 4.3% |
| 58 | 6.6% |

A sick upstream fails at a flat rate. A rising rate is the signature of a host *you* are overloading. Case closed, I thought, and it merged.

## The chart was wrong

The next day I re-checked it and found the problem. My "requests" were **log lines** for that chain, and the log stream also contains the retry warnings and error lines. More failures produced more log lines, which inflated the denominator, which manufactured the correlation.

Re-run with a clean denominator (completed `/verify` requests with their status codes), the relationship **inverted**: the quietest buckets failed most (10.8%) and the busiest least (2.8%). By hour of day it was flat noise.

Direct probing showed the real cause. The explorer had **episodic degradation windows lasting minutes** where it returned 500 on anything, even a zero-cost status endpoint called one request at a time. The error body came from the origin, not the CDN, and the instance reported it was still backfilling old blocks against the same database it served from. The failures were the host's own schedule, not our load.

I wrote that retraction into our notes the same day. The slot cap stayed, because sending unbounded concurrency to a host that declared no limit is wrong regardless, but I stopped expecting it to fix the failures.

## What actually fixed it

If the upstream can't be relied on, stop depending on it for the hot path. That led to a small **reorg-safe indexer** for that chain: it follows blocks a safe distance behind the tip, stores block hashes, rewinds to the common ancestor on a reorg, and writes idempotently. It runs in shadow mode next to the explorer so we can compare answers before trusting it.

We also added a 30-second negative cache per task execution, so a user mashing "verify" doesn't re-run the full provider lookup each time.

## Lessons

1. **Pacing logic must fail closed.** "No information" should mean "be careful", not "go as fast as you can".
2. **When you correlate failures with load, the denominator must not contain the failures.** Count requests, not log lines.
3. **Interleave your probes.** Running sequential tests before concurrent ones lets drifting host health look like a concurrency effect.
4. **Write the retraction down.** Being wrong in a PR description is fine. Leaving it as the official story isn't.
