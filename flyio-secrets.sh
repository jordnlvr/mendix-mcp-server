# Fly.io Environment Secrets Setup Script
# Run these commands after 'flyctl launch'

# Supabase (REQUIRED - your 242+ entries are here!)
flyctl secrets set SUPABASE_URL="https://uqiricziudqmwuyaeisj.supabase.co"
flyctl secrets set SUPABASE_ANON_KEY="sb_publishable_6tnU0im9Oe__yZwx0IgzWg_K0-Hd9SC"
flyctl secrets set SUPABASE_SERVICE_KEY="sb_secret_XJqkztf0SrVyMKKsgs5Bnw_0ZE-ukJ1"

# Pinecone (REQUIRED - your 253 vectors are here!)
flyctl secrets set PINECONE_API_KEY="pcsk_2dmfsN_KFZA8HxuzoLL3cEA1sbRbzR5oLTmEKvbwMsFGMLLyNzxSEPL5n3d6ZNfDGvG8de"
flyctl secrets set PINECONE_INDEX="mendix-knowledge"
flyctl secrets set PINECONE_ENVIRONMENT="us-east-1"

# Azure OpenAI (for embeddings - REQUIRED)
flyctl secrets set AZURE_OPENAI_API_KEY="YOUR_AZURE_KEY_HERE"
flyctl secrets set AZURE_OPENAI_ENDPOINT="https://YOUR_ENDPOINT.openai.azure.com"
flyctl secrets set AZURE_OPENAI_EMBEDDING_DEPLOYMENT="embed3s"
flyctl secrets set AZURE_OPENAI_API_VERSION="2024-12-01-preview"

# OpenAI (fallback)
flyctl secrets set OPENAI_API_KEY="YOUR_OPENAI_KEY_HERE"

# Harvest settings
flyctl secrets set HARVEST_INTERVAL_DAYS="7"
flyctl secrets set HARVEST_AUTO_RUN="true"

echo "✅ All secrets set! Ready to deploy."
