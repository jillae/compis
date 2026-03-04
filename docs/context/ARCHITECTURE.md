# Architecture — Klinik Flow

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes + Supabase Edge Functions
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **Auth:** Supabase Auth
- **Deploy:** Vercel (auto-deploy from `main`)
- **SMS:** 46elks
- **Email:** Unlayer editor + sending via integration
- **Booking:** Bokadirekt API
- **Accounting:** Fortnox API
- **Banking:** Nordea Open Banking (sandbox)
- **Ads:** Meta/Facebook Leads + Ads
- **Voice:** Whisper STT
- **AI/RAG:** Living Intelligence system

## Datamodell (förenklad)

Prisma-schema finns i `nextjs_space/prisma/schema.prisma`.

Viktiga modeller:
- `Organization` — klinik/tenant
- `User` — staff, admin, owner
- `Customer` — kund/patient
- `Booking` — bokning (synkad med Bokadirekt)
- `Lead` — lead (från Meta, manuellt, referral)
- `Campaign` — marknadsföringskampanj
- `Invoice` — faktura (Fortnox-synkad)
- `BokadirektWebhookLog` — logg för inkommande webhooks
- `IntegrationSyncLog` — synk-status per integration

## API-routes (viktiga)

```
app/api/
  cron/bokadirekt-sync/     ← Schemalagd Bokadirekt-synk
  webhooks/bokadirekt/      ← Inkommande webhooks
  webhooks/meta/            ← Meta Lead webhooks
  sms/                      ← 46elks SMS
  integrations/bokadirekt/  ← Manuell synk-trigger
```

## Beslut (ADR-light)

1. **Supabase > Firebase** — valt för PostgreSQL, Row Level Security, Edge Functions
2. **Prisma > raw SQL** — schema-first, migration-tracking, typsäkerhet
3. **Vercel > egen hosting** — zero-config deploy, preview URLs, cron stöd
4. **Multi-tenant via Organization** — varje klinik = en Organization med egna settings
5. **ADA som primary dev, CA som specialist** — kostnadskontroll + bästa av båda
