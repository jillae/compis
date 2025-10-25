
-- RAG Knowledge Base Migration
-- Enable pgvector extension and create knowledge_chunks table
-- Run this SQL in Supabase SQL Editor

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create knowledge_chunks table (will be created by Prisma, but we add vector column manually)
-- First run: npx prisma db push
-- Then run this SQL to convert embedding column to vector type:

ALTER TABLE knowledge_chunks 
ALTER COLUMN embedding TYPE vector(1536) 
USING embedding::text::vector;

-- 3. Create vector similarity search index
-- This speeds up semantic search queries
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Create function for semantic search (helper)
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding vector(1536),
  match_clinic_id text,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id text,
  content text,
  "contentType" text,
  category text,
  "serviceName" text,
  duration int,
  price float,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.content,
    knowledge_chunks."contentType",
    knowledge_chunks.category,
    knowledge_chunks."serviceName",
    knowledge_chunks.duration,
    knowledge_chunks.price,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks
  WHERE knowledge_chunks."clinicId" = match_clinic_id
    AND 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Verify installation
SELECT 
  extname, 
  extversion 
FROM pg_extension 
WHERE extname = 'vector';

-- Should return: vector | 0.5.1 (or similar version)

-- 6. Test query (after data is loaded)
-- SELECT * FROM search_knowledge_chunks(
--   '[0.1,0.2,...]'::vector(1536),  -- Your query embedding
--   'clinic_id_here',
--   0.5,
--   5
-- );

COMMENT ON TABLE knowledge_chunks IS 'RAG knowledge base for AI assistant - stores embeddings for semantic search';
COMMENT ON COLUMN knowledge_chunks.embedding IS 'OpenAI text-embedding-ada-002 vector (1536 dimensions)';
COMMENT ON COLUMN knowledge_chunks."contentType" IS 'Type: service, philosophy, booking_info, review, package, offer';
