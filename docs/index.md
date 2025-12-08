---
layout: default
title: Home
---

<p align="center">
  <img src="https://img.shields.io/badge/version-2.4.2-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/MCP-compatible-purple.svg" alt="MCP Compatible">
  <img src="https://img.shields.io/badge/Pinecone-vector%20search-orange.svg" alt="Vector Search">
  <img src="https://img.shields.io/badge/Azure%20OpenAI-embeddings-0078D4.svg" alt="Azure OpenAI">
</p>

# 🧠 Mendix Expert MCP Server

> **A self-learning, auto-researching AI assistant that gives your AI deep Mendix expertise and grows smarter with every interaction.**

## What Is This?

This is a **Model Context Protocol (MCP) server** that supercharges AI assistants (GitHub Copilot, Claude, etc.) with:

| Capability | Description |
|------------|-------------|
| 🔍 **Deep Knowledge** | 300+ curated entries on SDK patterns, best practices, troubleshooting |
| 🔮 **Semantic Search** | Azure OpenAI embeddings + Pinecone for meaning-based search |
| 🧠 **Self-Learning** | Automatically saves discoveries to grow smarter |
| 🌾 **Auto-Harvesting** | Weekly crawls of docs.mendix.com for fresh content |
| 📊 **Project Analysis** | Analyzes your actual `.mpr` files |
| 🔥 **Beast Mode** | Exhaustive research protocol for hard questions |

## Quick Example

```
User: @mendix-expert How do I iterate over a list in a microflow?

AI: Based on the knowledge base, here are the patterns:
    1. Loop activity with IterableList...
    2. Aggregate with ListOperation...
    [Comprehensive answer with code examples]
```

## How It Works

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
│  │             │  │             │  │             │                 │
│  │ ┌─────────┐ │  │ Weekly      │  │ .mpr files  │                 │
│  │ │Keyword  │ │  │ crawls      │  │ analysis    │                 │
│  │ │40%      │ │  │ docs.mx.com │  │             │                 │
│  │ └─────────┘ │  └──────┬──────┘  └─────────────┘                 │
│  │ ┌─────────┐ │         │                                          │
│  │ │Vector   │ │         │                                          │
│  │ │60%      │ │         ▼                                          │
│  │ └─────────┘ │  ┌──────────────┐                                  │
│  └──────┬──────┘  │  Knowledge   │                                  │
│         │         │  Base (JSON) │◄─── Self-Learning                │
│         │         │  300+ entries│                                  │
│         ▼         └──────────────┘                                  │
│  ┌─────────────┐                                                    │
│  │  Pinecone   │  Azure OpenAI embeddings                          │
│  │  (vectors)  │  1536 dimensions                                  │
│  └─────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Navigation

- **[Getting Started](getting-started)** - Installation and setup
- **[Architecture](architecture)** - How everything fits together
- **[Tools Reference](tools)** - All available MCP tools
- **[Knowledge Base](knowledge-base)** - What's in the brain
- **[Self-Learning](self-learning)** - How it grows smarter
- **[Beast Mode](beast-mode)** - Exhaustive research protocol
- **[Maintenance](maintenance)** - Keeping it current

---

<p align="center">
  <em>Last updated: {{ site.time | date: "%B %d, %Y" }}</em>
</p>
