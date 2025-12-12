# Railway Deployment Guide

Deploy the Mendix Expert MCP Server to Railway for 24/7 cloud availability.

## Live Instance

The official instance is running at:

```
https://mendix-mcp-server-production.up.railway.app
```

---

## Deploy Your Own Instance

### Prerequisites

- [Railway account](https://railway.app/)
- GitHub repository with the code

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose `jordnlvr/mendix-mcp-server` (or your fork)

### Step 2: Configure Environment Variables

In Railway → Your Service → **Variables**, add:

| Variable | Required | Description |
|----------|----------|-------------|
| `PINECONE_API_KEY` | Yes | Your Pinecone API key |
| `PINECONE_INDEX` | Yes | Pinecone index name (e.g., `mendix-knowledge`) |
| `OPENAI_API_KEY` | Optional | For OpenAI embeddings (recommended) |
| `HARVEST_AUTO_RUN` | Optional | `true` to auto-harvest on startup |
| `HARVEST_INTERVAL_DAYS` | Optional | Days between harvests (default: 7) |

**Note:** `NODE_VERSION` is no longer needed - the `package.json` engines field handles this.

### Step 3: Verify Configuration

Railway will automatically:
- Detect Node.js project
- Use the `Procfile` to run `npm run rest` (REST API)
- Assign a public URL

### Step 4: Generate Public URL

1. Go to your service → **Settings** → **Networking**
2. Click **Generate Domain**
3. Your URL will be: `https://your-service-name.up.railway.app`

---

## Technical Details

### Why Procfile?

The MCP server has two modes:
- `npm start` → MCP stdio server (for local Claude/VS Code)
- `npm run rest` → REST API server (for HTTP access)

The `Procfile` tells Railway to run the REST API:

```
web: npm run rest
```

### Port Configuration

Your code should use `process.env.PORT`:

```javascript
const PORT = process.env.PORT || 5050;
```

Railway sets `PORT` automatically. Don't hardcode a port.

### Node.js Version

The `package.json` specifies Node 20+:

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

This is required because the `undici` dependency (used for fetch) needs the `File` global which only exists in Node 20+.

---

## Endpoints

All REST API endpoints are available at your Railway URL:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/status` | GET | Server status with capabilities |
| `/search` | POST | Hybrid search (keyword + vector) |
| `/query` | POST | Query knowledge base |
| `/best-practice` | POST | Get recommendations |
| `/analyze-theme` | POST | Analyze Mendix theme |
| `/dashboard` | GET | Visual analytics dashboard |
| `/beast-mode` | GET | Research protocol |
| `/harvest-status` | GET | Harvest schedule |
| `/openapi.json` | GET | OpenAPI spec for ChatGPT |

---

## Using with ChatGPT

1. Create a Custom GPT at chat.openai.com
2. Go to **Configure** → **Actions** → **Import from URL**
3. Enter: `https://YOUR-RAILWAY-URL.up.railway.app/openapi.json`
4. Save!

No ngrok, no local server, always available.

---

## Using with n8n

Add an HTTP Request node:

```
URL: https://YOUR-RAILWAY-URL.up.railway.app/search
Method: POST
Headers: Content-Type: application/json
Body: {"query": "your search"}
```

---

## Troubleshooting

### 502 Error

**Cause:** App crashed or not responding.

**Fix:**
1. Check logs: `railway logs -n 100`
2. Verify `Procfile` exists with `web: npm run rest`
3. Ensure `engines.node` is `>=20.0.0` in package.json

### "File is not defined" Error

**Cause:** Running on Node 18 (needs Node 20+).

**Fix:** Ensure `package.json` has:
```json
"engines": {
  "node": ">=20.0.0"
}
```

### App Starts Then Stops

**Cause:** Using stdio MCP server instead of REST.

**Fix:** Ensure `Procfile` contains `web: npm run rest`

---

## Railway CLI

For debugging, install the Railway CLI:

```bash
npm install -g @railway/cli
railway login
railway link  # in your project folder
railway logs -n 50
railway status
railway redeploy -y
```

---

## Cost

Railway offers:
- **Free tier:** 500 hours/month, $5 credit
- **Hobby:** $5/month for always-on
- **Pro:** Pay per usage

The Mendix Expert server is lightweight and fits easily in free tier.
