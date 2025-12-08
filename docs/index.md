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

![Version](https://img.shields.io/badge/version-2.4.3-blue.svg)
![MCP](https://img.shields.io/badge/MCP-compatible-purple.svg)
![Pinecone](https://img.shields.io/badge/Pinecone-vector%20search-orange.svg)
![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-embeddings-0078D4.svg)
![npm](https://img.shields.io/npm/v/@jordnlvr/mendix-mcp-server.svg)

## About this project

This is a **Model Context Protocol (MCP) server** that supercharges AI assistants (GitHub Copilot, Claude, etc.) with deep Mendix expertise.

### Key Capabilities

| Capability           | Description                                                           |
| :------------------- | :-------------------------------------------------------------------- |
| **Deep Knowledge**   | 300+ curated entries on SDK patterns, best practices, troubleshooting |
| **Semantic Search**  | Azure OpenAI embeddings + Pinecone for meaning-based search           |
| **Self-Learning**    | Automatically saves discoveries to grow smarter                       |
| **Auto-Harvesting**  | Weekly crawls of docs.mendix.com for fresh content                    |
| **Project Analysis** | Analyzes your actual `.mpr` files                                     |
| **Beast Mode**       | Exhaustive research protocol for hard questions                       |

---

## Quick Example

```
User: @mendix-expert How do I iterate over a list in a microflow?

AI: Based on the knowledge base, here are the patterns:
    1. Loop activity with IterableList...
    2. Aggregate with ListOperation...
    [Comprehensive answer with code examples]
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Your AI Assistant                            │
│                  (Copilot, Claude, etc.)                           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ MCP Protocol
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Mendix Expert MCP Server                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Hybrid     │  │  Knowledge  │  │   Project   │                 │
│  │  Search     │  │  Harvester  │  │   Analyzer  │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│         │                │                                          │
│         ▼                ▼                                          │
│  ┌─────────────┐  ┌──────────────┐                                  │
│  │  Pinecone   │  │  Knowledge   │◄─── Self-Learning                │
│  │  (vectors)  │  │  Base (JSON) │                                  │
│  └─────────────┘  └──────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

<p align="center">
  <small>Last updated: {{ site.time | date: "%B %d, %Y" }}</small>
</p>
