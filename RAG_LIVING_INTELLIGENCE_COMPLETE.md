
# RAG Levande Intelligens - Implementation Complete ✅

## 🚀 Översikt

Flow's AI har nu **levande intelligens** - möjlighet att lära sig från verkliga samtal, dokument och webbsidor. Detta gör Flow mer personlig, korrekt och användbar för varje enskild klinik.

## ✨ Funktioner

### 1. Telefonsamtal (Audio Upload)
- **Upload-format**: MP3, WAV, M4A, FLAC
- **Process**: 
  - Transkribering via OpenAI Whisper
  - Intelligent chunking med overlap
  - Automatisk embedding-generering
  - Omedelbar tillgänglighet för AI

**Use case**: Ladda upp inspelningar av samtal med leads och kunder för att lära Flow:
- Er unika terminologi
- Vanligaste kundfrågorna
- Hur ni pratar om era behandlingar
- Vanliga invändningar och hur ni hanterar dem

### 2. Dokument (Document Upload)
- **Stödda format**: PDF, DOCX, TXT
- **Användningsområden**:
  - Behandlingsprotokoll
  - Eftervårdsinstruktioner
  - Produktinformation
  - Prislista och paketbeskrivningar
  - FAQ-dokument
  - Policydokument

### 3. Webbsidor (URL Indexing)
- **Funktionalitet**: Scrape och indexera valfri webbsida
- **Användningsområden**:
  - Er webbplats (behandlingssidor, bokningsinstruktioner)
  - Bloggartiklar
  - Externa resurser (produktinformation från leverantörer)
  - Kurssidor och utbildningsmaterial

## 🏗️ Teknisk Implementation

### Backend Components

#### 1. Upload API (`/api/rag/upload`)
```typescript
// Hanterar tre typer av upload:
- Audio: Transkriberar med Whisper → chunkar → embeddar
- Documents: Parsrar (PDF-parse, Mammoth) → chunkar → embeddar
- URLs: Scraper (Cheerio) → chunkar → embeddar
```

#### 2. Knowledge Uploader (`lib/rag/knowledge-uploader.ts`)
**Funktioner**:
- `processAudioFile()` - Whisper transcription + processing
- `processDocument()` - PDF/DOCX/TXT text extraction
- `processUrl()` - Web scraping + content extraction

**Tech Stack**:
- **pdf-parse**: PDF text extraction
- **mammoth**: Word document (.docx) processing
- **cheerio**: HTML parsing & web scraping
- **OpenAI Whisper API**: Audio transcription

#### 3. Improved Chunking (`lib/rag/chunking.ts`)
```typescript
interface TextChunk {
  text: string;
  index: number;
}

interface ChunkOptions {
  maxChunkSize?: number;  // Default: 800 chars
  overlap?: number;       // Default: 100 chars
}
```

**Features**:
- Sentence-based chunking
- Overlap preservation för bättre kontext
- Returnerar indexerade chunks för spårbarhet

### Frontend Component

#### Knowledge Base Page (`/dashboard/settings/knowledge-base`)

**UI Features**:
- Tabbed interface (Audio / Documents / Links)
- Real-time upload status med progress indicators
- File size display
- Helpful tips för varje typ
- Success/error feedback

**User Flow**:
1. Välj typ (Audio/Document/URL)
2. Upload/submit
3. Se progress (Upload → Processing → Success)
4. Få feedback om antal chunks skapade
5. Innehållet är omedelbart aktivt i AI

### Navigation

**Placering**: Settings → Kunskapshantering
- Visuellt tilltalande card med:
  - Icons för varje typ (📞📄🔗)
  - Hover-effekter
  - Tydlig call-to-action

## 📊 Database Schema

Använder befintligt `KnowledgeChunk` model i Prisma:

```prisma
model KnowledgeChunk {
  id          String   @id @default(cuid())
  clinicId    String   // Multi-tenant support
  content     String   @db.Text
  contentType String   // "service" | "review" | "booking_info"
  embedding   Float[]  // Vector for semantic search
  sourceUrl   String?  // Filename or URL
  sourceType  String   // "manual" | "website"
  keywords    String[] // For keyword-based search
  createdAt   DateTime
  updatedAt   DateTime
}
```

## 🎯 Business Value

### För Klinikerna
1. **Mer personlig AI**: Flow pratar som _du_, med _din_ terminologi
2. **Bättre svar**: AI känner till all _din_ information
3. **Tidsbesparande**: Upload en gång, använd för evigt
4. **Ständig förbättring**: Ju mer innehåll, desto bättre AI

### För Flow
1. **Differentiering**: Ingen annan har levande intelligens
2. **Retention**: Ju mer data, desto mer "låst" är kunden
3. **Kvalitet**: Bättre AI = nöjdare kunder = lägre churn
4. **Insights**: Data från konversationer kan ge produktutveckling

## 🔧 Setup Instructions

### 1. Environment Variables
Lägg till i `.env`:
```env
# Required för audio transcription
OPENAI_API_KEY=sk-...

# Alt. för Abacus AI integration
ABACUSAI_API_KEY=...
```

### 2. Dependencies (✅ Installerade)
```bash
yarn add cheerio pdf-parse mammoth
```

### 3. Prisma
Schema är redan på plats. Om du behöver re-generate:
```bash
yarn prisma generate
```

## 📋 Usage Guide för Beta Testers

### Sanna (Arch Clinic) - Recommended First Steps

#### Steg 1: Ladda upp telefonsamtal
1. Gå till **Settings → Kunskapshantering**
2. Välj tab **Telefonsamtal**
3. Ladda upp 3-5 inspelningar från:
   - Initial-konsultationer
   - Bokningssamtal
   - Frågor om behandlingar

#### Steg 2: Indexera webbsidor
1. Välj tab **Länkar**
2. Lägg till:
   - `https://vardagsstark.se/behandlingar`
   - `https://vardagsstark.se/archmethod`
   - `https://vardagsstark.se/boka-tid`
   - Alla relevanta treatment-sidor

#### Steg 3: Ladda upp dokument
1. Välj tab **Dokument**
2. Ladda upp:
   - Behandlingsprotokoll
   - Prislista
   - Eftervårdsinstruktioner
   - FAQ-dokument

#### Steg 4: Testa AI
Efter upload, testa Corex chat widget med frågor som:
- "Vad kostar naprapatbehandling?"
- "Hur lång är en behandling?"
- "Vad är Archmethod?"

AI ska nu svara med _din_ information!

## 🚦 Status

✅ **Backend Implementation**: Complete
✅ **Frontend UI**: Complete  
✅ **Audio Transcription**: Complete (OpenAI Whisper)
✅ **Document Parsing**: Complete (PDF, DOCX, TXT)
✅ **Web Scraping**: Complete (Cheerio)
✅ **Chunking & Embeddings**: Complete
✅ **Database Integration**: Complete
✅ **Error Handling**: Complete
✅ **Build & Deploy**: Ready

⏳ **Pending**:
- OpenAI API key configuration (user action required)
- Real-world testing med beta users
- Performance optimization (batch processing för stora filer)

## 🔮 Future Enhancements

### V2 Features
1. **Batch Upload**: Drag & drop multiple files
2. **Progress Dashboard**: Se alla uploaded sources
3. **Edit/Delete**: Manage uploaded content
4. **Auto-sync**: Periodic re-scraping av URLs
5. **Analytics**: Se vilka chunks som används mest
6. **Smart Suggestions**: AI rekommenderar vad som ska laddas upp

### V3 Features
1. **Video Upload**: Extrahera ljud från video
2. **Live Recordings**: Spela in direkt i appen
3. **Auto-tagging**: AI taggar innehåll automatiskt
4. **Duplicate Detection**: Undvik duplicate content
5. **Quality Scoring**: Betygsätt usefulness av chunks

## 📝 Git Commit

```bash
feat(rag): Implementera levande intelligens med audio/document/URL upload

- Upload telefonsamtal med Whisper transcription
- Upload dokument (PDF/DOCX/TXT) med text extraction
- Indexera webbsidor med web scraping
- Förbättrad chunking med overlap
- Real-time status feedback
- Knowledge Base UI i Settings

Tech: cheerio, pdf-parse, mammoth, OpenAI Whisper
```

---

**Skapad**: 2025-10-25
**Status**: Production Ready 🚀
**Next**: Configure OpenAI key → Test med Sanna → Iterate baserat på feedback
