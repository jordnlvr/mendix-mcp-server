# Supabase Setup Guide

This guide explains how to set up Supabase for persistent knowledge storage with the Mendix Expert MCP Server.

## Why Supabase?

When running on Railway (or any cloud platform), the filesystem is **ephemeral** - files are lost on every container restart. This means:

- ❌ JSON-based knowledge doesn't persist
- ❌ Self-learning is lost after each deploy
- ❌ Harvested knowledge disappears

**Supabase solves this** by providing:

- ✅ Persistent PostgreSQL database
- ✅ Full-text search with indexes
- ✅ Real-time subscriptions (future feature)
- ✅ Free tier with 500MB database
- ✅ Shared across local and cloud instances

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click "New Project"
3. Choose a name (e.g., `mendix-knowledge`)
4. Set a database password (save this!)
5. Select a region close to your Railway deployment
6. Click "Create new project"

### 2. Get Your API Keys

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY` (keep this secret!)

### 3. Run the Database Schema

1. Go to SQL Editor in your Supabase dashboard
2. Open `scripts/supabase-schema.sql` from this repo
3. Paste the entire contents
4. Click "Run"

You should see success messages for creating tables, indexes, and policies.

### 4. Set Environment Variables

#### Local Development

Add to your `.env` file:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

#### Railway Deployment

1. Go to your Railway project → Variables
2. Add the same three variables

### 5. Migrate Existing Knowledge

Run the migration script to load your existing JSON knowledge into Supabase:

```bash
npm run migrate:supabase
```

This will:
- Read all JSON files from `knowledge/`
- Transform entries to the Supabase schema
- Insert with duplicate detection
- Show a summary of what was migrated

## Schema Overview

### Tables

| Table | Purpose |
|-------|---------|
| `knowledge_entries` | Main knowledge storage with full-text search |
| `learning_events` | Tracks what was learned and when |
| `analytics` | Usage tracking for popular queries |

### Key Features

- **Full-text search**: Uses PostgreSQL `tsvector` for fast, typo-tolerant search
- **Content hashing**: MD5 hash prevents duplicate entries
- **Quality scoring**: 0.0-1.0 score for prioritizing results
- **Tags**: JSONB array for flexible categorization
- **Timestamps**: Automatic `created_at` and `updated_at`

## How It Works

### Hybrid Storage Mode

The server uses a `HybridKnowledgeManager` that:

1. **Tries Supabase first** - Fast, indexed, persistent
2. **Falls back to JSON** - For local-only development
3. **Writes to both** - Keeps JSON as backup when possible

### Storage Priority

| Environment | Primary Storage | Backup |
|-------------|-----------------|--------|
| Railway (with Supabase) | Supabase | None (JSON resets) |
| Local (with Supabase) | Supabase | JSON files |
| Local (no Supabase) | JSON files | None |

### Self-Learning Flow

```
User adds knowledge → HybridManager → Supabase (cloud)
                                   → JSON (local backup)
                                   → Pinecone (vectors)
```

## Troubleshooting

### "Missing environment variables"

Make sure all three variables are set:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

### "Connection failed"

1. Check your Supabase project is active (not paused)
2. Verify the URL doesn't have a trailing slash
3. Ensure RLS policies are in place (run schema SQL)

### "Permission denied"

The schema includes Row Level Security (RLS) policies. If you get permission errors:

1. Make sure you ran the full schema SQL
2. Use `SUPABASE_SERVICE_KEY` for admin operations
3. Check the policies in Supabase → Authentication → Policies

### "Table not found"

Run the schema SQL in the Supabase SQL Editor:
1. Go to SQL Editor
2. Paste contents of `scripts/supabase-schema.sql`
3. Click "Run"

## Monitoring

### Check Knowledge Count

```bash
curl https://your-railway-url.up.railway.app/health
```

Response includes storage stats:
```json
{
  "status": "healthy",
  "storage": {
    "mode": "hybrid",
    "supabase": { "totalEntries": 1234 },
    "json": { "totalEntries": 1234 }
  }
}
```

### View in Supabase Dashboard

1. Go to Table Editor in Supabase
2. Select `knowledge_entries` to see all knowledge
3. Use the filter to search by category

### Check Learning Events

Query the `learning_events` table to see what's being learned:

```sql
SELECT * FROM learning_events 
ORDER BY learned_at DESC 
LIMIT 20;
```

## Cost

Supabase free tier includes:
- 500MB database storage
- Unlimited API requests
- 2 projects
- 7-day log retention

This is more than enough for the Mendix knowledge base (currently ~50MB).

## Next Steps

- [Railway Deployment Guide](RAILWAY-DEPLOYMENT.md)
- [ChatGPT Setup Guide](CHATGPT-CHEAT-SHEET.md)
- [API Documentation](../openapi.json)
