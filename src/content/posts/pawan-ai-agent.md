---
title: Building an AI agent people can trust with production
description: Pawan lets our team run campaigns from Slack in plain English. The interesting part is everything that stops it from doing damage.
date: 2026-11-16
tags: [ai, agents, python, reliability]
---

Running a campaign on Superboard used to mean clicking through an admin console: find the quest, change the dates, check the rewards, publish. I built **Pawan**, a Slack agent, so the team can just ask:

> @pawan extend the quest in this campaign by a week and show me what changes

The model part was easy. Making it safe to point at production was the real work.

## Rule 1: the model never makes a live change

Pawan can read, plan, and create **unpublished drafts**. For anything live (publishing, pausing, extending, changing config) it asks the server for a preview and posts an **approval card** with the before and after.

When a human clicks Approve, the change runs **without another model call**. The model prepares; a person decides. Sensitive operations like rewards and distributions need a *different* authorized approver than the requester. Pawan never signs blockchain transactions.

## Rule 2: the server is the source of truth

Pawan has no database access to Superboard. It talks to a dedicated Agent API using contracts generated from the API's OpenAPI spec, and checks every response against them. Validation, previews, reward caps and permissions all live on the server, so a confused model can't skip them.

## Rule 3: unknown is not success

If a write might have reached the server but the result is unclear (a timeout, a crash), Pawan records it as **unknown** and never retries it automatically. A duplicated reward is worse than a slow one. Writes are idempotent and state survives restarts.

## Rule 4: retrieved text is data

Campaign descriptions and example configs come from users. Pawan treats them as data, never as instructions, so text in a quest can't tell the agent what to do.

## Testing an agent

Unit tests aren't enough for something that decides what to do. Pawan has:

- **518 tests**, including end-to-end runs driven through Slack events
- a **44-scenario eval suite** against the real model: multi-turn chats, approval clicks, and injected faults, with a fake Slack, a fake API and a throwaway database
- a pass bar of **95%** per scenario, and a scenario fails outright if safety evidence is missing

## Stack

Python 3.13, Slack Bolt in Socket Mode, the AI SDK for Python with Claude (a fast model by default, falling back to a stronger one on stalls), its own Postgres, and OpenTelemetry traces with message content stripped. It runs on one small Fly.io machine.

## What I learned

The agent is mostly not AI. It's approval flows, idempotency, contracts and evals around a model. That's also why the team trusts it.
