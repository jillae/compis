
# RAG Knowledge Base Implementation Guide

## 📚 Overview

This guide covers the complete implementation of the RAG (Retrieval-Augmented Generation) knowledge base system for Vardagsstark/Arch Clinic in the Flow SaaS platform.

The RAG system enables the AI assistant (Voice AI and chat) to provide accurate, context-aware responses about clinic services, treatments, pricing, philosophy, and booking processes.

---

## 🏗️ Architecture

### Components

1. **Data Layer**
   - Prisma schema: `KnowledgeChunk` model
   - Postgres with pgvector extension
   - Vector similarity search (1536-dimensional embeddings)

2. **Processing Layer**
   - Web scraping: Extract data from vardagsstark.nu and Bokadirekt
   - Chunking: Split content into semantic chunks
   - Embeddings: Generate OpenAI embeddings (text-embedding-ada-002)

3. **Retrieval Layer**
   - Semantic search: Find relevant chunks using cosine similarity
   - Keyword fallback: Traditional keyword-based search
   - Context building: Format results for AI prompts

4. **API Layer**
   - `/api/rag/search` - General semantic search
   - `/api/rag/services` - Service-specific recommendations
   - Integration with `/api/voice/webhook` and `/api/corex/chat`

---

## 📦 What Was Implemented

### 1. Data Extraction ✅

**Source:** `/home/ubuntu/flow/rag-data/vardagsstark_knowledge_base.json`

**Extracted:**
- **32 services** (Smärta & Funktion, Mental Hälsa, Fettreduktion, Lymfdränage)
- **4 packages** (Emerald 10ggr, Behandling 60 min 10ggr, Ballancer 6ggr, etc.)
- **3 special offers** (Emerald prova på, Ballancer prova på, Duo-behandling)
- **Archmethod® philosophy** (Neurocentrerat, smärta som överlevnadsreflex, LLLT)
- **3 practitioners** (Sanna Holmgren, Katarina, Sarah)
- **Booking info** (Öppettider, kontakt, adress, process)
- **345+ customer reviews** (4.8/5 rating)

### 2. Code Structure ✅

```
lib/rag/
  ├── chunking.ts      # Convert raw data into semantic chunks
  ├── embeddings.ts    # Generate OpenAI embeddings
  └── retrieval.ts     # Semantic search and context retrieval

scripts/
  └── load-knowledge-base.ts  # Import JSON data into database

app/api/rag/
  ├── search/route.ts    # General semantic search endpoint
  └── services/route.ts  # Service recommendations endpoint

prisma/
  ├── schema.prisma                          # KnowledgeChunk model
  └── migrations/add_knowledge_base_rag.sql  # pgvector setup
```

### 3. Database Schema ✅

```prisma
model KnowledgeChunk {
  id          String   @id @default(cuid())
  clinicId    String
  content     String   @db.Text
  contentType String   // "service", "philosophy", "booking_info", etc.
  category    String?
  serviceName String?
  duration    Int?
  price       Float?
  embedding   Float[]  // Vector(1536) in Postgres
  keywords    String[]
  sourceUrl   String?
  createdAt   DateTime
  updatedAt   DateTime
}
```

---

## 🚀 Setup Instructions

### Step 1: Enable pgvector Extension

Run in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: Push Prisma Schema

```bash
cd /home/ubuntu/flow/nextjs_space
npx prisma db push
```

This creates the `knowledge_chunks` table.

### Step 3: Convert Embedding Column to Vector Type

Run in Supabase SQL Editor:

```sql
ALTER TABLE knowledge_chunks 
ALTER COLUMN embedding TYPE vector(1536) 
USING embedding::text::vector;

CREATE INDEX knowledge_chunks_embedding_idx 
ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Step 4: Update Arch Clinic ID in Load Script

Open `/home/ubuntu/flow/nextjs_space/scripts/load-knowledge-base.ts`:

```typescript
// Line 15: Update with actual Arch Clinic ID from database
const ARCH_CLINIC_ID = 'clz6d9w3y0000v3z8h9x4y2z1'; // ← CHANGE THIS
```

**To find Arch Clinic ID:**

```bash
cd /home/ubuntu/flow/nextjs_space
npx prisma studio
# Open Clinic table, find "Vardagsstark" or "Arch Clinic", copy ID
```

OR via SQL:

```sql
SELECT id, name FROM "Clinic" WHERE name ILIKE '%arch%' OR name ILIKE '%vardagsstark%';
```

### Step 5: Load Knowledge Base

```bash
cd /home/ubuntu/flow/nextjs_space
npx tsx scripts/load-knowledge-base.ts
```

**Expected output:**
```
🚀 Starting knowledge base import...
📦 Processing 32 services...
📦 Processing 4 packages...
📚 Processing philosophy...
📞 Processing booking info...
✅ Created 45 knowledge chunks

🧠 Generating embeddings...
   Processing batch 1/3...
   Processing batch 2/3...
   Processing batch 3/3...
✅ Embeddings generated

💾 Inserting into database...
   Inserted 45/45...

✅ Knowledge base import complete!
   ✓ Inserted: 45
   ✗ Failed: 0
```

**Note:** Embedding generation takes ~2-3 minutes due to OpenAI API rate limits.

---

## 🧪 Testing

### Test 1: Semantic Search API

```bash
curl -X POST https://goto.klinikflow.app/api/rag/search \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "query": "Jag har ont i axeln, vad kan ni hjälpa med?",
    "topK": 5
  }'
```

**Expected response:**
```json
{
  "query": "Jag har ont i axeln, vad kan ni hjälpa med?",
  "results": [
    {
      "content": "Behandling: Axel/Skuldra 30 min\n...",
      "contentType": "service",
      "serviceName": "Axel/Skuldra 30 min",
      "duration": 30,
      "price": 750,
      "similarity": 0.87
    },
    ...
  ],
  "contextPrompt": "Relevant information från kunskapsbasen:\n\n1. Behandling: Axel/Skuldra 30 min\n...",
  "count": 5
}
```

### Test 2: Service Recommendations

```bash
curl -X POST https://goto.klinikflow.app/api/rag/services \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "query": "Vad kostar Emerald fettreduktion?",
    "maxResults": 3
  }'
```

**Expected response:**
```json
{
  "query": "Vad kostar Emerald fettreduktion?",
  "recommendations": [
    {
      "content": "Behandling: Emerald 70 min\nKategori: Kost, Stress & Övervikt\nPris: 2495 kr\n...",
      "contentType": "service",
      "serviceName": "Emerald 70 min",
      "duration": 70,
      "price": 2495,
      "similarity": 0.92
    },
    ...
  ],
  "count": 3
}
```

### Test 3: Voice AI Integration

Call the phone number: **+46766866273**

Test queries:
1. "Jag har ont i ryggen, vad kostar det?"
2. "Vad är Archmethod?"
3. "Hur bokar jag tid?"
4. "Har ni klippkort för Emerald?"

**Expected behavior:**
- AI should retrieve relevant knowledge chunks
- Provide accurate pricing and duration
- Explain Archmethod® when asked
- Recommend starting with a consultation

---

## 🔗 Integration with Voice AI

### Update Voice Webhook

Edit `/home/ubuntu/flow/nextjs_space/app/api/voice/webhook/route.ts`:

```typescript
import { retrieveContext, buildContextPrompt } from '@/lib/rag/retrieval';

// In the conversation handler, before calling GPT-4:
const ragContext = await retrieveContext(
  userMessage,
  clinic.id,
  5 // topK results
);

const contextPrompt = buildContextPrompt(ragContext);

// Add to system prompt:
const systemPrompt = `
Du är en AI-assistent för ${clinic.name}.

${contextPrompt}

Använd informationen ovan för att svara på kundens frågor om behandlingar, priser och bokning.
Om du inte hittar information i kunskapsbasen, säg "Jag behöver kolla upp det, kan jag ta ditt telefonnummer så ringer vi tillbaka?"
`;
```

### Update Chat Widget

Edit `/home/ubuntu/flow/nextjs_space/app/api/corex/chat/route.ts`:

```typescript
import { retrieveContext, buildContextPrompt } from '@/lib/rag/retrieval';

// Before generating AI response:
const ragContext = await retrieveContext(
  userMessage,
  session.user.clinicId,
  5
);

const contextPrompt = buildContextPrompt(ragContext);

// Include in prompt to OpenAI/Abacus.AI
```

---

## 📊 Query Patterns Supported

The RAG system can intelligently answer:

### Service Inquiries
- "Jag har ont i axeln, vad kan ni hjälpa med?"
  → **Returns:** Axel/Skuldra 30 min (750 kr), Behandling 60 min (1125 kr)

- "Vad kostar Emerald fettreduktion?"
  → **Returns:** Emerald 70 min (2495 kr), Emerald 10ggr klippkort (21 295 kr)

- "Kan ni hjälpa vid stress och utmattning?"
  → **Returns:** Konsultation Stressreducering 90 min (1420 kr), Behandling Stress 30 min (750 kr)

### Philosophy Questions
- "Vad är Archmethod?"
  → **Returns:** Neurobaserad metod som optimerar hjärna/nervsystem för ökad funktion och minskad smärta

- "Hur behandlar ni smärta?"
  → **Returns:** Smärta är överlevnadsreflex, inte strukturellt fel. Vi behandlar orsaken till varför hjärnan aktiverar smärtsignaler.

### Booking Process
- "Hur bokar jag tid?"
  → **Returns:** Via Bokadirekt eller ring 023-125 25. Konsultation först rekommenderas för nya kunder.

- "Vilka öppettider har ni?"
  → **Returns:** Mån 09-20:30, Tis-Ons 08:30-20:30, Tor 08:30-17:30, Fre 08:30-14:00

### Package Deals
- "Har ni klippkort?"
  → **Returns:** Ja, Emerald 10ggr (få 12) för 21 295 kr, Behandling 60 min 10ggr för 10 239 kr, etc.

---

## 🎯 AI Behavior Guidelines

When integrating RAG with AI responses, ensure:

1. **Always recommend consultation first for new customers**
   ```
   "Jag rekommenderar att börja med en konsultation (60 min, 950 kr) 
   så vi kan förstå dina behov och skapa en individuell behandlingsplan."
   ```

2. **If unsure which treatment → suggest consultation**
   ```
   "Det finns flera behandlingar som kan hjälpa. Bäst är att börja 
   med en konsultation så vi kan hitta rätt lösning för just dig."
   ```

3. **Mention package deals for returning customers**
   ```
   "Om du planerar flera besök finns klippkort med rabatt, 
   t.ex. 10 behandlingar för priset av 9."
   ```

4. **Explain Archmethod® briefly when relevant**
   ```
   "Vi använder Archmethod®, en neurobaserad metod som fokuserar 
   på att optimera hjärna och nervsystem för ökad funktion."
   ```

5. **Be warm, professional, avoid medical diagnoses**
   ```
   "Vi fokuserar på funktion, inte diagnos. Målet är att hitta 
   orsaken till varför kroppen reagerar som den gör."
   ```

---

## 🔧 Maintenance

### Adding New Services

1. Update `/home/ubuntu/flow/rag-data/vardagsstark_knowledge_base.json`
2. Run `npx tsx scripts/load-knowledge-base.ts`
3. Script will clear old data and reload

### Updating Existing Services

Same as above - script clears and reloads entire knowledge base.

### Monitoring

Check database for chunk count:

```sql
SELECT 
  "contentType", 
  COUNT(*) 
FROM knowledge_chunks 
WHERE "clinicId" = 'YOUR_CLINIC_ID'
GROUP BY "contentType";
```

Expected output:
```
 contentType   | count 
---------------+-------
 service       |    32
 package       |     4
 philosophy    |     3
 booking_info  |     1
```

### Performance

- Vector search: ~50-100ms per query
- Keyword fallback: ~10-20ms per query
- Embedding generation: ~200ms per text (batched)

---

## 📈 Future Enhancements

1. **Multi-clinic Support**
   - Currently: Arch Clinic only
   - Future: Load knowledge bases for multiple clinics

2. **Auto-sync with Bokadirekt**
   - Periodically scrape Bokadirekt for price/service updates
   - Cron job: Weekly refresh

3. **Customer Reviews Integration**
   - Add reviews as knowledge chunks
   - Use for trust-building in AI responses

4. **Feedback Loop**
   - Track which chunks are most retrieved
   - Identify gaps in knowledge base

5. **Multi-language Support**
   - Currently: Swedish only
   - Future: English embeddings for international customers

---

## 🐛 Troubleshooting

### Issue: Vector search returns no results

**Cause:** pgvector extension not enabled or embedding column wrong type

**Solution:**
```sql
-- Verify pgvector
SELECT * FROM pg_extension WHERE extname = 'vector';

-- If empty, enable:
CREATE EXTENSION vector;

-- Verify embedding column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'knowledge_chunks' AND column_name = 'embedding';

-- Should show: vector
-- If shows: _float4 or _float8, run migration SQL again
```

### Issue: Embeddings generation fails

**Cause:** OpenAI API key missing or rate limit exceeded

**Solution:**
```bash
# Check env var
echo $OPENAI_API_KEY

# If empty, add to .env:
OPENAI_API_KEY=sk-...

# Rate limit: Script already includes 1s delays between batches
# If still failing, increase delay in load-knowledge-base.ts
```

### Issue: API returns 401 Unauthorized

**Cause:** Session/authentication required

**Solution:**
- Ensure user is logged in
- API routes use `getServerSession(authOptions)`
- Test with valid session cookie

---

## ✅ Checklist

- [ ] pgvector extension enabled in Supabase
- [ ] `npx prisma db push` completed successfully
- [ ] Embedding column converted to vector(1536)
- [ ] Vector search index created
- [ ] Arch Clinic ID updated in load script
- [ ] Knowledge base loaded (45 chunks)
- [ ] Tested `/api/rag/search` endpoint
- [ ] Tested `/api/rag/services` endpoint
- [ ] Integrated with Voice AI webhook
- [ ] Integrated with chat widget
- [ ] Tested end-to-end voice queries
- [ ] Updated jillae.md with instructions

---

## 📞 Support

If you encounter issues, check:

1. **Prisma Client:** Run `npx prisma generate` after schema changes
2. **Database connection:** Verify `DATABASE_URL` in `.env`
3. **OpenAI API:** Check quota and billing at platform.openai.com
4. **Logs:** Check `/api/rag/search` response for error messages

---

**Last Updated:** 2025-10-25  
**Version:** 1.0.0  
**Author:** DeepAgent RAG Implementation
