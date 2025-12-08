---
layout: default
title: Getting Started
---

# 🚀 Getting Started

## Prerequisites

- **Node.js 18+**
- **An MCP-compatible AI client** (VS Code with Copilot, Claude Desktop, etc.)
- **Optional:** Pinecone account (free tier) for semantic search
- **Optional:** Azure OpenAI or OpenAI API key for high-quality embeddings

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/jordnlvr/mendix-mcp-server.git
cd mendix-mcp-server
npm install
```

### 2. Configure Environment (Optional but Recommended)

Create a `.env` file for enhanced features:

```bash
# Vector Search (semantic understanding)
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=mendix-knowledge

# Embeddings - Azure OpenAI (fastest, recommended)
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=embed3s

# OR Standard OpenAI (fallback)
OPENAI_API_KEY=sk-your_key_here
```

**Without these keys:** The server works fine with keyword search only!

### 3. Connect Your AI Client

#### VS Code (GitHub Copilot)

Add to your VS Code `settings.json`:

```json
{
  "chat.mcp.servers": {
    "mendix-expert": {
      "type": "stdio",
      "command": "node",
      "args": ["C:/path/to/mendix-mcp-server/src/index.js"]
    }
  }
}
```

#### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mendix-expert": {
      "command": "node",
      "args": ["C:/path/to/mendix-mcp-server/src/index.js"]
    }
  }
}
```

### 4. Verify Installation

In your AI chat:

```
@mendix-expert hello
```

You should see a welcome message with server status.

## First Queries

Try these to see it in action:

```
@mendix-expert How do I create a microflow with the SDK?

@mendix-expert What's the best way to handle domain model associations?

@mendix-expert analyze_project project_path="D:/MyProject/MyApp.mpr"
```

## Enabling Semantic Search

If you configured Pinecone and OpenAI:

```
@mendix-expert vector_status
```

Should show:

- Status: `ready`
- Vectors: `300+`
- Embedding mode: `azure-openai` or `openai`

To re-index the knowledge base:

```
@mendix-expert reindex_vectors
```

## Next Steps

- [Explore the Architecture](architecture) - Understand how it works
- [Learn the Tools](tools) - See all available commands
- [Enable Beast Mode](beast-mode) - For hard research questions

---

[← Back to Home](/)
