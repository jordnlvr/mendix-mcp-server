# Fly.io Secrets Setup - PowerShell Version
# Run this AFTER 'flyctl launch'

Write-Host "🔐 Setting up secrets on Fly.io..." -ForegroundColor Cyan

# Supabase (your 242+ learned entries!)
Write-Host "`n📦 Supabase..." -ForegroundColor Yellow
flyctl secrets set SUPABASE_URL="https://uqiricziudqmwuyaeisj.supabase.co"
flyctl secrets set SUPABASE_ANON_KEY="sb_publishable_6tnU0im9Oe__yZwx0IgzWg_K0-Hd9SC"
flyctl secrets set SUPABASE_SERVICE_KEY="sb_secret_XJqkztf0SrVyMKKsgs5Bnw_0ZE-ukJ1"

# Pinecone (your 253 vector embeddings!)
Write-Host "`n🔍 Pinecone..." -ForegroundColor Yellow
flyctl secrets set PINECONE_API_KEY="pcsk_2dmfsN_KFZA8HxuzoLL3cEA1sbRbzR5oLTmEKvbwMsFGMLLyNzxSEPL5n3d6ZNfDGvG8de"
flyctl secrets set PINECONE_INDEX="mendix-knowledge"
flyctl secrets set PINECONE_ENVIRONMENT="us-east-1"

# Azure OpenAI
Write-Host "`n🧠 Azure OpenAI..." -ForegroundColor Yellow
flyctl secrets set AZURE_OPENAI_API_KEY="YOUR_AZURE_KEY_HERE"
flyctl secrets set AZURE_OPENAI_ENDPOINT="https://YOUR_ENDPOINT.openai.azure.com"
flyctl secrets set AZURE_OPENAI_EMBEDDING_DEPLOYMENT="embed3s"
flyctl secrets set AZURE_OPENAI_API_VERSION="2024-12-01-preview"

# OpenAI fallback
Write-Host "`n🤖 OpenAI fallback..." -ForegroundColor Yellow
flyctl secrets set OPENAI_API_KEY="YOUR_OPENAI_KEY_HERE"

# Harvest
Write-Host "`n📚 Harvest settings..." -ForegroundColor Yellow
flyctl secrets set HARVEST_INTERVAL_DAYS="7"
flyctl secrets set HARVEST_AUTO_RUN="true"

Write-Host "`n✅ All secrets configured!" -ForegroundColor Green
Write-Host "Ready to deploy with: flyctl deploy" -ForegroundColor Cyan
