# Current State — Klinik Flow

> Uppdaterad: 2026-03-04
> Syfte: Ge AI-agenter snabb kontext utan att scanna hela repot.

## Status: MVP i produktion

Appen är live på `compis-rust.vercel.app` (→ goto.klinikflow.app).
Primärt mål: lansera för Arch Clinic och samla riktig feedback.

## Vad som är KLART

- ✅ Onboarding & Auth (Supabase Auth)
- ✅ Staff & Scheduling (Wave 9)
- ✅ Leads & Bookings
- ✅ Meta-integration (Facebook Leads + Ads)
- ✅ Report System med Loyalty, Freemium, A/B
- ✅ Bokadirekt API (sync services, staff, customers, bookings, sales)
- ✅ Bokadirekt cron sync (`app/api/cron/bokadirekt-sync/`)
- ✅ 46elks SMS med subaccounts per klinik
- ✅ Fortnox bank-integration
- ✅ Nordea sandbox
- ✅ RAG / Living Intelligence
- ✅ Voice/Whisper (STT)
- ✅ Unlayer email editor (Wave 7)
- ✅ Customer Intelligence (Wave 10-11)
- ✅ Referral Program
- ✅ Automated Marketing Triggers

## Vad som är PÅGÅENDE / NÄSTA

- 🔄 Stabilisering inför Arch Clinic pilot
- 🔄 Tier + seats licensing-modell (alla Marknadscentral-features konsoliderade i Flow)
- 🔄 Hålla credits-burn lågt

## Wave 5 — Nya Moduler (2026-03-07)

- ✅ **Marknadscentral** — Extern integration med API:er för status, kapacitet, insikter, kunder
- ✅ **UGC (User Generated Content)** — Kundrecensioner, testimonials, media-hantering
- ✅ **Digital Signage** — Väntrumsssärmar, info-tavlor, display-hantering

Alla tre moduler är licensbaserade (premium tier) och tillgängliga för INTERNAL, PROFESSIONAL, ENTERPRISE.

## Kända problem / tech debt

- `.env` finns i repo (bör flyttas till enbart Vercel env vars + .gitignore)
- Många WAVE-dokument (md+pdf) i repo-root — bör flyttas till `docs/waves/`
- Legacy `src/` mapp kvar
- `package-lock.json` i root + `nextjs_space/` — verifiera vilken som styr

## Agent-arbetsfördelning

| Agent | Roll | Status |
|---|---|---|
| ADA (Abacus Deep Agent) | Vardagsdrift, UI, buggar, deploy | AKTIV — äger `main` |
| CA (Perplexity Computer) | Tunga lyft, refactoring, nya integrationer | PÅ BEGÄRAN — jobbar i `ca/` branch |

## Leftovers / Backlog

- 🔜 Google Analytics (pilot-tracking för Arch Clinic)

## Leftovers / Backlog

- 🔜 Google Analytics (pilot-tracking för Arch Clinic)
