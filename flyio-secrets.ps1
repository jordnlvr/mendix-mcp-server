# Fly.io Secrets Setup - PowerShell Version
# Run this AFTER 'flyctl launch'

Write-Host "🔐 Setting up secrets on Fly.io..." -ForegroundColor Cyan

# Supabase (your 242+ learned entries!)
Write-Host "`n📦 Supabase..." -ForegroundColor Yellow
flyctl secrets set SUPABASE_URL="${SUPABASE_URL}"
flyctl secrets set SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
flyctl secrets set SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}"

# Pinecone (your 253 vector embeddings!)
Write-Host "`n🔍 Pinecone..." -ForegroundColor Yellow
flyctl secrets set PINECONE_API_KEY="${PINECONE_API_KEY}"
flyctl secrets set PINECONE_INDEX="${PINECONE_INDEX}"
flyctl secrets set PINECONE_ENVIRONMENT="${PINECONE_ENVIRONMENT}"

# Azure OpenAI
Write-Host "`n🧠 Azure OpenAI..." -ForegroundColor Yellow
flyctl secrets set AZURE_OPENAI_API_KEY="${AZURE_OPENAI_API_KEY}"
flyctl secrets set AZURE_OPENAI_ENDPOINT="${AZURE_OPENAI_ENDPOINT}"
flyctl secrets set AZURE_OPENAI_EMBEDDING_DEPLOYMENT="${AZURE_OPENAI_EMBEDDING_DEPLOYMENT}"
flyctl secrets set AZURE_OPENAI_API_VERSION="${AZURE_OPENAI_API_VERSION}"

# OpenAI fallback
Write-Host "`n🤖 OpenAI fallback..." -ForegroundColor Yellow
flyctl secrets set OPENAI_API_KEY="${OPENAI_API_KEY}"

# Harvest
Write-Host "`n📚 Harvest settings..." -ForegroundColor Yellow
flyctl secrets set HARVEST_INTERVAL_DAYS="${HARVEST_INTERVAL_DAYS}"
flyctl secrets set HARVEST_AUTO_RUN="${HARVEST_AUTO_RUN}"

Write-Host "`n✅ All secrets configured!" -ForegroundColor Green
Write-Host "Ready to deploy with: flyctl deploy" -ForegroundColor Cyan
