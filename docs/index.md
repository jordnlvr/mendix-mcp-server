---
layout: default
title: Home
nav_order: 1
description: 'A self-learning, auto-researching AI assistant for Mendix development'
permalink: /
---

# Mendix Expert MCP Server

{: .fs-9 }

A self-learning, auto-researching AI assistant that gives your AI deep Mendix expertise and grows smarter with every interaction.
{: .fs-6 .fw-300 }

[Get Started](./getting-started.md){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/jordnlvr/mendix-mcp-server){: .btn .fs-5 .mb-4 .mb-md-0 }

---

![Version](https://img.shields.io/badge/version-3.5.1-blue.svg)
![MCP](https://img.shields.io/badge/MCP-compatible-purple.svg)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)
![Pinecone](https://img.shields.io/badge/Pinecone-253%20vectors-orange.svg)
![OpenAI](https://img.shields.io/badge/OpenAI-embeddings-412991.svg)
![npm](https://img.shields.io/npm/v/@jordnlvr/mendix-mcp-server.svg)

## About this project

This is a **Model Context Protocol (MCP) server** that supercharges AI assistants (GitHub Copilot, Claude, ChatGPT, n8n, etc.) with deep Mendix expertise. **As of v3.5.1, ALL clients participate in universal self-learning.**

### Key Capabilities

| Capability                  | Description                                                     |
| :-------------------------- | :-------------------------------------------------------------- |
| **Universal Self-Learning** | ALL clients (Copilot, Claude, ChatGPT, n8n) get quality signals |
| **REST /learn API**         | ChatGPT and automation tools can add knowledge via HTTP         |
| **Supabase Storage**        | 242+ entries in PostgreSQL - survives Railway restarts          |
| **Semantic Search**         | 253 vectors in Pinecone (OpenAI embeddings, 1536 dims)          |
| **Quality Assessment**      | Every search returns `answerQuality` and `beastModeNeeded`      |
| **Project Analysis**        | Analyzes your actual `.mpr` files (local MCP only)              |
| **Beast Mode**              | Exhaustive 5-tier research protocol for hard questions          |
| **Auto-Deploy**             | Push to GitHub → Railway deploys automatically                  |

---

## Quick Example

```
User: @mendix-expert How do I iterate over a list in a microflow?

AI: [Searches knowledge base]
    Answer Quality: strong | Web Search Recommended: No

    Based on the knowledge base, here are the patterns:
    1. Loop activity with IterableList...
    2. Aggregate with ListOperation...
    [Comprehensive answer with code examples]
```

---

## Architecture Overview (v3.5.1)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI CLIENTS                                   │
│  GitHub Copilot │ Claude Desktop │ ChatGPT │ n8n │ Make │ Zapier   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ MCP (stdio) or REST (HTTP)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Mendix Expert MCP Server v3.5.1                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Hybrid     │  │  Quality    │  │   Project   │                 │
│  │  Search     │  │ Assessment  │  │   Analyzer  │                 │
│  │             │  │  (v3.5.1)   │  │ (local only)│                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│         │                │                                          │
│         ▼                ▼                                          │
│  ┌─────────────┐  ┌──────────────┐                                  │
│  │  Pinecone   │  │   Supabase   │◄─── Self-Learning                │
│  │ 253 vectors │  │  PostgreSQL  │     (all clients)                │
│  │  1536 dims  │  │ 242+ entries │                                  │
│  └─────────────┘  └──────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (auto-deploy)
┌─────────────────────────────────────────────────────────────────────┐
│  Railway Cloud: https://mendix-mcp-server-production.up.railway.app │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What's New in v3.5.1

- 🌍 **Universal Self-Learning** - ALL clients get quality signals and can add knowledge
- 🧠 **REST /learn endpoint** - ChatGPT and automation can store discoveries
- 📊 **Quality Assessment** - Every search returns `answerQuality` and `beastModeNeeded`
- 🗄️ **Supabase-first storage** - 242+ entries in PostgreSQL
- 🔮 **253 vectors in Pinecone** - OpenAI text-embedding-3-small (1536 dims)
- 🚀 **Auto-deploy** - Push to GitHub → Railway deploys automatically

---

<p align="center">
  <small>Last updated: {{ site.time | date: "%B %d, %Y" }}</small>
</p>
