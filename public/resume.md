# Taksh Panchal

Founding Engineer · Full-Stack & Infrastructure

- Email: taksh.career@gmail.com
- GitHub: https://github.com/takshpanchal
- LinkedIn: https://www.linkedin.com/in/takshpanchal
- PDF version: https://takshpanchal.github.io/resume.pdf

## Summary

Founding engineer with 3.5+ years of experience shipping production systems. Built and run Superboard.xyz end to end, serving 2.1M+ accounts. Comfortable owning a system from schema design to on-call, with equal care for cost, reliability and security.

## Experience

### Founding Engineer (Lead Engineer), [Superboard.xyz](https://superboard.xyz)

2025/03 – Present · Bengaluru, India

- Built the platform from zero as lead engineer on a small team, scaling to **2.1M+ accounts** and **8.46M+ user activities** across a NestJS/TypeScript API, a Next.js app, a partner console and background workers.
- Designed the core systems (campaigns, quests, leaderboards, rewards, and multi-chain and social verification), built to stay correct under concurrency and hold up during high-traffic launches.
- Owned infrastructure and DevOps end to end: led multiple cloud migrations (AWS to **Fly.io** and **Cloudflare**), CI/CD with per-PR previews, Go-based job scheduling and observability, and kept cutting cost across hosting, database and third-party APIs.
- Set the engineering direction on a small team: turned product goals into technical plans, reviewed code and owned decisions from architecture to release.

Technologies: TypeScript, NestJS, Next.js, PostgreSQL, Redis, BullMQ, Go, Cloudflare, Fly.io, AWS, OpenTelemetry, Solidity

### Software Engineer, [Searce Inc.](https://www.linkedin.com/company/searceinc)

2023/05 – 2025/02 · Pune, India

- Built document-extraction services that pull structured data from **shipping bills and insurance KYC documents** for clients in insurance and accounting software.
- Built an asynchronous LLM extraction service on **Gemini (Vertex AI)** with Celery and Redis that queues work within the model's rate limits, making extraction **3x faster** than synchronous calls.
- Parallelized the ML extraction APIs, cutting processing time **6x**, and moved extraction workloads onto AWS Lambda so they scale with load.
- Delivered a continuous training and deployment pipeline so clients could retrain the extractor on their own documents, and moved legacy document storage from Postgres to MinIO object storage.

Technologies: Python, Django, Celery, Redis, Gemini / Vertex AI, PostgreSQL, MinIO, GCP, AWS Lambda

### Android Developer Intern, [Orbitz IT Solution](https://www.linkedin.com/company/orbitz-it-solution)

2022/01 – 2022/04

- Built a field-sales tracking Android app (Java) with continuous background location tracking through a foreground service that survives reboots and OEM battery restrictions.
- Synced customer delivery status live through Firebase Realtime Database and captured on-delivery digital signatures in Firebase Storage, with Firebase Auth and Google Sign-In.

Technologies: Java, Android SDK, Firebase (Auth, Realtime DB, Storage)

## Projects

### [Pawan: AI Ops Agent for Superboard](https://takshpanchal.github.io/posts/pawan-ai-agent/)

Python, Claude API

- Slack agent that lets the team plan, draft and edit campaigns in plain English. Every live write needs a human approval, writes are idempotent, and the tools are designed to resist prompt injection.
- Backed by a **44-scenario LLM eval suite (≥95% pass bar)** and **518 tests**, with OpenTelemetry tracing and per-call cost tracking.

### [Online Chess Game](https://chess-frontend-fi8c.onrender.com)

Go, WebSockets, React, PostgreSQL

- Real-time multiplayer chess server in Go: room-based games over WebSockets with JWT auth, and goroutines and channels for per-game concurrency.

### [bun-dler](https://github.com/TakshPanchal/bun-dler)

Bun, JavaScript

- A toy JavaScript bundler: parses modules into ASTs with Babel, resolves the import/export dependency graph, and emits a single bundle.

## Open Source Contributions

- [Samagra](https://github.com/BharatSahAIyak/marker/pulls?q=is%3Apr+author%3ATakshPanchal) (Python, OpenCV, PyTorch): added table detection and parsing for Hindi PDFs to their PDF-to-Markdown pipeline (2 merged PRs); fine-tuned ColBERT retrieval models.
- [juspay/hyperswitch](https://github.com/juspay/hyperswitch/pull/4398) (Rust): added iDEAL and Giropay payment methods to the Multisafepay connector of an open-source payments switch.
- [keephq/keep](https://github.com/keephq/keep/pulls?q=is%3Apr+author%3ATakshPanchal+is%3Amerged) (Python, React): built the GitHub Workflows provider for an open-source alert-management platform (2 merged PRs).
- [probml/pyprobml](https://github.com/probml/pyprobml/pulls?q=is%3Apr+author%3ATakshPanchal+is%3Amerged) (JAX): ported figure notebooks for Kevin Murphy's Probabilistic ML books to JAX with LaTeX-styled plots (7 merged PRs).

## Education

B.Tech, Mechanical Engineering, [Sardar Vallabhbhai National Institute of Technology, Surat](https://www.svnit.ac.in). CGPA 8.2. 2019/07 – 2023/05, Surat, India.
