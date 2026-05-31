# Fly.io Environment Secrets Setup Script
# Run these commands after 'flyctl launch'

# Supabase (REQUIRED - your 242+ entries are here!)
flyctl secrets set SUPABASE_URL="${SUPABASE_URL}"
flyctl secrets set SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
flyctl secrets set SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}"

# Pinecone (REQUIRED - your 253 vectors are here!)
flyctl secrets set PINECONE_API_KEY="${PINECONE_API_KEY}"
flyctl secrets set PINECONE_INDEX="${PINECONE_INDEX}"
flyctl secrets set PINECONE_ENVIRONMENT="${PINECONE_ENVIRONMENT}"

# Azure OpenAI (for embeddings - REQUIRED)
flyctl secrets set AZURE_OPENAI_API_KEY="${AZURE_OPENAI_API_KEY}"
flyctl secrets set AZURE_OPENAI_ENDPOINT="${AZURE_OPENAI_ENDPOINT}"
flyctl secrets set AZURE_OPENAI_EMBEDDING_DEPLOYMENT="${AZURE_OPENAI_EMBEDDING_DEPLOYMENT}"
flyctl secrets set AZURE_OPENAI_API_VERSION="${AZURE_OPENAI_API_VERSION}"

# OpenAI (fallback)
flyctl secrets set OPENAI_API_KEY="${OPENAI_API_KEY}"

# Harvest settings
flyctl secrets set HARVEST_INTERVAL_DAYS="${HARVEST_INTERVAL_DAYS}"
flyctl secrets set HARVEST_AUTO_RUN="${HARVEST_AUTO_RUN}"

echo "✅ All secrets set! Ready to deploy."
