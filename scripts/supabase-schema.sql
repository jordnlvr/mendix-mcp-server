-- Supabase Schema for Mendix Expert MCP Server
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main knowledge table
CREATE TABLE IF NOT EXISTS knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core fields
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    
    -- Metadata
    source TEXT,                          -- Where this knowledge came from
    source_url TEXT,                      -- URL if from web
    mendix_version TEXT,                  -- e.g., "10.x", "11.0"
    tags TEXT[] DEFAULT '{}',             -- Array of tags for filtering
    
    -- Quality & Learning
    quality_score DECIMAL(3,2) DEFAULT 0.5,  -- 0.00 to 1.00
    usage_count INTEGER DEFAULT 0,           -- How often this entry is returned
    last_used_at TIMESTAMP WITH TIME ZONE,
    learned_from TEXT,                       -- 'manual', 'beast_mode', 'harvest', 'user'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicates
    content_hash TEXT UNIQUE              -- MD5 hash of title+content for dedup
);

-- Indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_quality ON knowledge(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage ON knowledge(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_knowledge_fts ON knowledge 
    USING GIN(to_tsvector('english', title || ' ' || content));

-- Analytics table for tracking usage patterns
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,             -- 'search', 'query', 'learn', 'harvest'
    query TEXT,                           -- What was searched
    results_count INTEGER,
    knowledge_ids UUID[],                 -- Which entries were returned
    source TEXT,                          -- 'local_mcp', 'railway', 'chatgpt'
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at DESC);

-- Harvest log for tracking auto-harvests
CREATE TABLE IF NOT EXISTS harvest_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,                 -- 'releaseNotes', 'studioProGuide', etc.
    entries_added INTEGER DEFAULT 0,
    entries_updated INTEGER DEFAULT 0,
    entries_skipped INTEGER DEFAULT 0,
    duration_ms INTEGER,
    status TEXT DEFAULT 'completed',      -- 'completed', 'failed', 'partial'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge gaps reported by users
CREATE TABLE IF NOT EXISTS knowledge_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    description TEXT,
    query_that_failed TEXT,
    priority TEXT DEFAULT 'medium',       -- 'low', 'medium', 'high'
    status TEXT DEFAULT 'open',           -- 'open', 'researching', 'resolved'
    resolved_knowledge_id UUID REFERENCES knowledge(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS knowledge_updated_at ON knowledge;
CREATE TRIGGER knowledge_updated_at
    BEFORE UPDATE ON knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function for full-text search
CREATE OR REPLACE FUNCTION search_knowledge(search_query TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    quality_score DECIMAL,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id,
        k.title,
        k.content,
        k.category,
        k.quality_score,
        ts_rank(to_tsvector('english', k.title || ' ' || k.content), plainto_tsquery('english', search_query)) as rank
    FROM knowledge k
    WHERE to_tsvector('english', k.title || ' ' || k.content) @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC, k.quality_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (optional but recommended)
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the API)
CREATE POLICY "Allow public read" ON knowledge FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON knowledge FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON knowledge FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON analytics FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON harvest_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON harvest_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON knowledge_gaps FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON knowledge_gaps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON knowledge_gaps FOR UPDATE USING (true);

-- Grant permissions
GRANT ALL ON knowledge TO anon, authenticated;
GRANT ALL ON analytics TO anon, authenticated;
GRANT ALL ON harvest_log TO anon, authenticated;
GRANT ALL ON knowledge_gaps TO anon, authenticated;
