# AGENT.md — Klinik Flow (compis)

> Denna fil läses av alla AI-agenter (ADA, CA, Copilot etc.) innan de börjar jobba i repot.
> Uppdatera den när arkitekturen eller reglerna ändras.

## Projekt

- **Namn:** Klinik Flow (KlinikFlow)
- **Repo:** `jillae/compis`
- **Prod URL:** https://compis-rust.vercel.app (→ goto.klinikflow.app)
- **Deploy:** Vercel auto-deploy från `main`
- **Databas:** Supabase (PostgreSQL)
- **Stack:** Next.js (App Router) · TypeScript · Tailwind · Supabase · Prisma

## Mappstruktur

```
nextjs_space/          ← Huvudappen (Next.js)
  app/                 ← App Router pages & API routes
  lib/                 ← Utilities, integrations, helpers
  components/          ← React-komponenter
  prisma/              ← Schema & migrations
supabase/              ← Edge functions, migrations
rag-data/              ← RAG/kunskapsbas-data
src/                   ← Legacy/support-kod
```

## Integrationer

| Integration | Plats i kod | Notering |
|---|---|---|
| Bokadirekt API | `lib/integrations/bokadirekt/` | Rate limit 10 req/min, X-API-KEY header |
| Meta/Facebook | `app/api/webhooks/meta/` | Leads + Ads |
| 46elks (SMS) | `app/api/sms/` | Subaccounts per klinik |
| Fortnox | `lib/integrations/fortnox/` | Bank + fakturering |
| Nordea Open Banking | `lib/integrations/nordea/` | Sandbox |
| Whisper (STT) | `lib/integrations/whisper/` | Voice/transkription |

## Regler för alla agenter

### Branch-konvention

- `main` = produktion (auto-deploy till Vercel)
- `ca/<uppgift>` = Perplexity Computer Agent-arbete
- `ada/<uppgift>` = Abacus Deep Agent-arbete
- Alla ändringar → PR till `main` (eller direct push om enkel fix i ADA)

### Kodstandarder

1. **TypeScript strict** — inga `any` utan motivering
2. **Ingen hårdkodning av secrets** — använd env vars
3. **Prisma-migrationer:** kör `npx prisma migrate dev` lokalt, committa migration-filen
4. **Lint:** `npm run lint` ska passera innan push
5. **Build:** `npm run build` ska passera (Vercel bygger på varje push)

### Vad du INTE ska göra

- Ändra `.abacus.donotdelete` (behövs för ADA-koppling)
- Refaktorera utanför scope (fråga först)
- Byta Supabase-projekt eller Vercel-koppling
- Skriva om auth-flödet utan explicit godkännande
- Lägga till nya npm-dependencies utan motivering

### PR-leveransformat (krav vid CA-arbete)

Varje PR ska innehålla:
1. **Vad som ändrats** (3–8 bullets)
2. **Hur man testar** (kommandon + testscenario)
3. **Risker/regressioner** (vad kan gå sönder)
4. **DB/migration impact** (ja/nej + instruktion)
5. **Env vars** (nya/ändrade nycklar)
