---
title: "Before Superboard: LLM pipelines at Searce and Samagra"
description: Async LLM extraction, ML pipelines and open-source work that shaped how I build backends.
date: 2024-12-01
tags: [python, llm, ml, celery]
draft: true
---

<!-- TODO(Taksh): fill in the real details. This post stays hidden until you set draft: false. -->

## Searce: making LLM extraction 3x faster

- The problem: synchronous calls to an LLM endpoint for document extraction were slow and kept hitting rate limits.
- The fix: an async service on **Celery and Redis** that queued extractions and respected the endpoint's rate limits. Result: **3x faster** extraction.
- Also: parallelized the ML extraction APIs (**6x faster**), and built a continuous training and deployment pipeline so clients could retrain on their own data.
- TODO: what documents, volume per day, how retries and rate-limit backoff worked, what broke.

## Samagra: training automation

- TODO: which project, what the pipeline did (Django, Transformers, Celery), what you contributed, outcome.

## Open source

- [juspay/hyperswitch](https://github.com/juspay/hyperswitch/pull/4398): added iDEAL and Giropay support to the Multisafepay connector, in Rust.
- [pyprobml](https://github.com/probml/pyprobml/pulls?q=author%3ATakshPanchal): helped port NumPy code to JAX.
