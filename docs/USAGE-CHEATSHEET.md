# Mendix Expert - Usage Cheat Sheet

## Cloud API URL

```
https://mendix-mcp-server-production.up.railway.app
```

---

## ChatGPT Custom GPT - Example Prompts

### 🔍 Knowledge Searches

| Prompt                                  | What It Does                             |
| --------------------------------------- | ---------------------------------------- |
| "How do I create a microflow with SDK?" | Searches for SDK microflow patterns      |
| "Entity creation best practices"        | Gets domain model guidance               |
| "Pluggable widget development guide"    | Returns widget development knowledge     |
| "Studio Pro extension development"      | C# extension patterns for Studio Pro 11+ |
| "Error handling in microflows"          | Best practices for error handling        |

### 🎯 Best Practice Requests

| Prompt                              | What It Does                    |
| ----------------------------------- | ------------------------------- |
| "Best practice for security rules"  | Security configuration guidance |
| "Best practice for performance"     | Optimization recommendations    |
| "Best practice for API integration" | REST/OData patterns             |
| "Best practice for large data"      | Pagination, batching strategies |

### 🔥 Beast Mode (Deep Research)

| Prompt                               | What It Does                             |
| ------------------------------------ | ---------------------------------------- |
| "Use beast mode to research [topic]" | Gets exhaustive 5-tier research protocol |
| "Show me the research protocol"      | Returns Beast Mode instructions          |
| "Research SDK authentication"        | Triggers deep research mode              |

### 📊 Status & Info

| Prompt                         | What It Does                   |
| ------------------------------ | ------------------------------ |
| "Show status"                  | Server status and capabilities |
| "Health check"                 | API health status              |
| "Show analytics"               | Usage stats and popular topics |
| "What are the popular topics?" | Most searched topics           |
| "Harvest status"               | Auto-harvesting schedule       |
| "Latest updates?"              | Recent knowledge additions     |

### 🎨 Theme Analysis

| Prompt                             | What It Does                    |
| ---------------------------------- | ------------------------------- |
| "How do I analyze a Mendix theme?" | Theme analysis guidance         |
| "Theme best practices"             | Styling recommendations         |
| "Design properties guide"          | Widget design property patterns |

### 🧩 Studio Pro Extensions

| Prompt                                    | What It Does               |
| ----------------------------------------- | -------------------------- |
| "How do I create a Studio Pro extension?" | C# extension quick start   |
| "Extension manifest format"               | JSON manifest structure    |
| "MenuExtension example"                   | Menu extension code sample |
| "DockablePaneExtension guide"             | Dockable pane patterns     |

---

## Power User Tips

### Combine Topics

- "Best practices for microflow error handling AND logging"
- "SDK patterns for creating entities with associations"

### Ask for Code

- "Show me code for creating a microflow with SDK"
- "Give me a working example of entity creation"

### Request Specifics

- "What SDK version supports [feature]?"
- "Show me the exact API for [method]"

### Follow Up

- "Tell me more about that"
- "Show me an example"
- "What are the common mistakes?"

---

## Quick Reference - API Endpoints

If you're building integrations:

| Endpoint          | Method | Use For                                      |
| ----------------- | ------ | -------------------------------------------- |
| `/health`         | GET    | Health check                                 |
| `/status`         | GET    | Full status with capabilities                |
| `/search`         | POST   | Hybrid search (body: `{"query": "..."}`)     |
| `/query`          | POST   | Knowledge query (body: `{"topic": "..."}`)   |
| `/best-practice`  | POST   | Best practices (body: `{"scenario": "..."}`) |
| `/beast-mode`     | GET    | Research protocol                            |
| `/analytics`      | GET    | Usage statistics                             |
| `/harvest-status` | GET    | Harvest schedule                             |
| `/dashboard`      | GET    | Visual analytics (HTML)                      |

---

## Example Conversations

### Example 1: SDK Development

```
You: How do I create a microflow with the Mendix Model SDK?
GPT: [Returns detailed SDK patterns with code examples]

You: Show me error handling for that
GPT: [Returns try/catch patterns and common pitfalls]

You: What are the common mistakes?
GPT: [Returns troubleshooting knowledge]
```

### Example 2: Best Practices

```
You: Best practice for large data handling in Mendix
GPT: [Returns pagination, batching, XPath optimization tips]

You: How do I implement pagination?
GPT: [Returns specific implementation patterns]
```

### Example 3: Research Mode

```
You: Use beast mode to research custom widget state management
GPT: [Returns exhaustive research protocol with 5 tiers of sources]
```

---

## Troubleshooting

### "I don't have information about that"

Try rephrasing or use beast mode:

- "Use beast mode to research [your topic]"

### Generic responses

Be more specific:

- Instead of "widgets" → "pluggable widget development in Mendix 10"

### Need latest info

Ask about harvest:

- "When was the knowledge last updated?"
- "Harvest status"

---

_Cloud URL: https://mendix-mcp-server-production.up.railway.app_
