

# LEFTOVERS - Kvarvarande Tasks

**Senast uppdaterat:** 2025-10-23 (Röstintegration & Handover)

## 🎉 SENASTE PROGRESS (2025-10-23)

### ✅ Röstintegration Handover-dokument (KLART!)
- ✅ **RÖST_INTEGRATION_HANDOVER.md** skapad och komplett
  - Full översikt av STT/TTS/Corex integration
  - Teknisk arkitektur och komponenter
  - Setup-instruktioner för KB Whisper
  - Alla credentials och API-konfigurationer dokumenterade
  - Kodstruktur och references
  - Troubleshooting guide
- ✅ **PDF-version** genererad
- ✅ **jillae.md** uppdaterad med röstintegration-info
- ✅ **Checkpoint** skapad: "Stable base with voice docs"

### ✅ Dokumentuppdateringar
- ✅ Alla credentials verifierade i handover-dokument
- ✅ API-konfigurationer kompletta (Bokadirekt, Resend, OpenAI, Meta, 46elks)
- ✅ Leftovers, Nästa Steg, Wave-docs uppdaterade

---

## 🎉 TIDIGARE PROGRESS (2025-10-22)

### ✅ AI Chat Återställning (1h)

**Problem:** Missförstånd om AI-integration  
**Status:** ✅ FIXAT - Corex återställd

**Vad som hände:**
1. Trodde Flow-appen behövde egen AI-agent
2. Skapade `/api/ai/chat`, `/api/ai/tts`, `/api/ai/stt` med IRAC + anti-hallucination
3. Uppdaterade `ai-chat-widget.tsx` och `lib/ai-assistant.ts`
4. Användaren klargjorde: **Flow = Corex** (inte egen agent)

**Återställning:**
- ✅ `ai-chat-widget.tsx` → `/api/corex/chat` endpoint
- ✅ `lib/ai-assistant.ts` → original settings
- ✅ Dead code borttaget (`/api/ai/*` routes raderade)
- ✅ Build + Deploy successful

**Deployment:**
- URL: https://goto.klinikflow.app
- Checkpoint: "Återställt AI-chat till Corex"
- Build: 189 routes, 0 errors

**Korrekt Implementation:**
- AI-chatten använder **Corex**
- Endpoint: `/api/corex/chat`
- Widget: `components/ai-chat-widget.tsx`

---

### ✅ SuperAdmin Pages Critical Fix (2h)

**Problem:** Application errors på SuperAdmin-sidor
- `/superadmin` - Dashboard kraschade
- `/superadmin/fortnox-config` - "client-side exception occurred"
- `/superadmin/ghl-config` - "client-side exception occurred"

**Root Causes & Fixes:**

1. **Database Schema Mismatch** ✅ FIXAT
   ```bash
   # Problem: Prisma schema hade fält som inte fanns i DB
   # Fix:
   cd /home/ubuntu/flow/nextjs_space
   npx prisma db push --skip-generate
   npx prisma generate
   
   # Result: 6 nya Fortnox-kolumner tilllagda
   ```

2. **Authorization - Sanna Återställd till ADMIN** ✅ KORRIGERAT
   ```typescript
   // Problem: Sanna hade ADMIN men behövde inte SUPER_ADMIN
   // Tillfällig Fix: Uppdaterade till SUPER_ADMIN för testing
   // Korrekt Fix: Återställd till ADMIN (2025-10-22 kväll)
   
   // För SuperAdmin-testing, använd Gilbert:
   // Email: gilbert@archacademy.se
   // Password: flow2024
   // Role: SUPER_ADMIN
   ```

3. **React Hook Bug** ✅ FIXAT
   ```typescript
   // File: /app/superadmin/fortnox-config/page.tsx
   // Line 63: Removed 'toast' from useEffect dependency array
   // This prevents potential re-render loops
   ```

**Deployment:**
- ✅ Build successful (189 routes, 0 errors)
- ✅ Deployed to flow-muij7a.abacusai.app
- ✅ Checkpoint: "Fixed SuperAdmin and Fortnox/GHL pages"

**Verification:**
```bash
# Test URLs efter cache clear:
https://goto.klinikflow.app/superadmin
https://goto.klinikflow.app/superadmin/fortnox-config
https://goto.klinikflow.app/superadmin/ghl-config

# Login (för SuperAdmin-testing):
Email: gilbert@archacademy.se
Password: flow2024
Role: SUPER_ADMIN
```

---

## 🎉 TIDIGARE PROGRESS (2025-10-21)

### ✅ System Deployment & Verification
- ✅ **Deployed:** goto.klinikflow.app (179 routes, production-ready)
- ✅ **Database:** Verified full recovery (5 users, 5 clinics, customers, bookings)
- ✅ **Meta Token:** Refreshed with new long-lived credential
- ✅ **Git Branch:** "flow-da" created and committed

### ✅ 46elks Subaccounts Integration (KLART! 2.5h)
- ✅ **Database schema:** elksSubaccountId, elksSubaccountKey, elksSubaccountSecret
- ✅ **Service layer:** lib/46elks/subaccount-service.ts med encryption
- ✅ **API endpoints:** /api/46elks/subaccounts (create, list, get)
- ✅ **SuperAdmin UI:** /superadmin/46elks-subaccounts med credentials viewer
- ✅ **Auto-creation:** Integrerad i signup flow (non-blocking)
- ✅ **Navigation:** Tillagd i SuperAdmin layout
- ✅ **Build test:** TypeScript + Production build OK
- 📄 **Dokumentation:** `46ELKS_SUBACCOUNTS_IMPLEMENTATION_COMPLETE.md`

### ⏳ New Features (In Progress)
- ⏳ **Fortnox Integration:** Planerad, credentials mottagna (4-5h)

---

## 📋 LEFTOVERS Analys

### Quick wins: ✅ KLART
- ✅ Navigation labels (korrekt struktur fanns redan)
- ✅ Footer conditional rendering (redan implementerad)
- ✅ Auth middleware (fungerar)

### Större tasks (4-8h var - KVARSTÅR):
1. **Customer Health Score System** (5.2)
   - Scoring algorithm (0-100)
   - Health alerts
   - Dashboard UI
   - **Estimerad tid:** 5-6 timmar

2. **Automated Marketing Triggers** (5.3)
   - Email templates
   - Trigger logic
   - Campaign dashboard
   - **Estimerad tid:** 6-8 timmar

3. **Competitor Analysis** (6.1)
   - Web scraping
   - Price monitoring
   - Feature comparison
   - **Estimerad tid:** 8-10 timmar

### Business Decisions (behöver stakeholder input):
- A/B Testing setup
- Referral Program design
- Freemium Tier pricing

---

## ✅ KLART - Task 1-5 (VECKA 1 Critical Security)

### Task 1: Superadmin Dashboard ✅
- ✅ Förbättrad SuperAdmin layout med proper navigation
- ✅ Sticky header
- ✅ ClinicSelector dropdown
- ✅ ViewingBanner för clinic impersonation

### Task 2: Clinic Selector & Impersonation ✅
- ✅ ClinicContext skapad för state management
- ✅ ClinicSelector dropdown implementerad
- ✅ ViewingBanner för att visa vilken klinik SA tittar på
- ✅ "Exit Clinic View" knapp

### Task 3: Role Switch with Dynamic Routing ✅
- ✅ RoleToggle redirectar nu korrekt:
  - SUPER_ADMIN → `/superadmin`
  - ADMIN & STAFF → `/dashboard`

### Task 4: Remove GoCardless, Create Billing ✅
- ✅ `/superadmin/gocardless/page.tsx` borttagen
- ✅ `/superadmin/billing/page.tsx` skapad med Plaid integration
- ✅ Navigation uppdaterad

### Task 5: Remove "Landningssida" från menyn ✅
- ✅ "Landningssida" link borttagen från HamburgerMenu
- ✅ Endast tillgänglig via direktlänk (/)

**Dokumentation:** Se `TASK_1_5_IMPLEMENTATION_SUMMARY.md`

---

## 🔴 PRIORITET 1: Kvarvarande Kritiska Tasks

### 1.1 Auth Middleware på /dashboard/* routes ✅
**Status:** KLART - Middleware fungerar korrekt!

**Vad vi fixade:**
- ✅ Verifierat att middleware.ts använder next-auth/jwt för auth-check
- ✅ Fixat konsistensbug: Dashboard layout redirectade till `/login` (fel) → ändrat till `/auth/login`
- ✅ Testat att alla /dashboard/* routes redirectar obehöriga användare till login
- ✅ Verifierat att publika routes (/, /pricing, /auth/*) fungerar utan auth

**Testresultat:**
```bash
# Skyddade routes (redirectar till login):
/dashboard → 307 redirect till /auth/login?callbackUrl=%2Fdashboard
/dashboard/simulator → 307 redirect till /auth/login?callbackUrl=%2Fdashboard%2Fsimulator
/dashboard/insights → 307 redirect till /auth/login?callbackUrl=%2Fdashboard%2Finsights
/superadmin → 307 redirect till /auth/login?callbackUrl=%2Fsuperadmin

# Publika routes (fungerar utan auth):
/ → 200 OK
/pricing → 200 OK
/auth/login → 200 OK
```

**Checkpoint:** `Auth middleware verified and fixed` (2025-10-19)

---

### 1.2 Footer conditional rendering ✅
**Status:** KLART - Footer har redan korrekt conditional rendering!

**Vad vi verifierade:**
- ✅ Footer använder `useSession()` från next-auth för auth-check
- ✅ Conditional rendering baserat på `isAuthenticated`

---

### 1.3 Onboarding upstream error ✅
**Status:** KLART - Onboarding fungerar korrekt! Upstream error var tillfälligt.

---

### 1.4 Onboarding Banner för Steg 2 ✅
**Status:** KLART - Implementerad 2025-10-19

---

### 1.5 Session Timeout Konfiguration ✅
**Status:** KLART - Implementerad 2025-10-19

---

## 🟠 PRIORITET 2: OpenAI Whisper Configuration UI ✅

### 2.1 Superadmin UI för OpenAI-konfiguration ✅
**Status:** KLART - Fullständig OpenAI Whisper-konfiguration implementerad!

**Vad vi skapade:**
- ✅ `/app/superadmin/stt-providers/[id]/page.tsx` - Edit page för providers
- ✅ `/components/superadmin/openai-whisper-config.tsx` - OpenAI-specifik konfigurationsform
- ✅ "Configure"-knapp i STTProviderManager (endast för OpenAI providers)

**Checkpoint:** `OpenAI Whisper config UI complete` (2025-10-19)

---

### 2.2 Test-funktion i Superadmin ✅
**Status:** KLART - Test-funktion fanns redan implementerad!

---

## 🟡 PRIORITET 3: Dynamic Pricing Intelligence ✅

### 3.1 Dynamic Pricing Toggle med Disclaimer ✅
**Status:** KLART - Redan fullständigt implementerad!

**Vad som finns:**
- ✅ Modal vid aktivering med 28-dagarsregel disclaimer
- ✅ Modal vid avaktivering med prisstabilitetspåminnelse
- ✅ Whitepaper popup med fullständig laglig information
- ✅ Database tracking via `/api/clinic/dynamic-pricing`

---

## 🟡 PRIORITET 4: Payatt Terminologi - Byt "billing" till "Engagement Hub" ✅

**DECISION:** User valde **Option A: `/engagement/*`** (Customer Engagement Hub) ✅
**STATUS:** ✅ KLART - Refactoring genomförd 2025-10-19

### 4.2 Routing-ändringar ✅ (STOR REFACTORING KLAR)
**Vad vi gjorde:**
- ✅ Bytte `/app/billing/*` → `/app/engagement/*`
- ✅ Flyttade `/app/api/billing/payatt/*` → `/app/api/engagement/payatt/*`
- ✅ Uppdaterade alla API-anrop och route references

---

## 🟡 PRIORITET 5: Wave 5A - Revenue Intelligence & Analytics ✅

### 5.1 Business Metrics Dashboard ✅ KLART! (2025-10-19)
**Feature:** Komplett Revenue Intelligence dashboard för MRR/ARR tracking

**API Endpoints:**
- [x] GET /api/analytics/revenue - MRR/ARR trends ✅
- [x] GET /api/analytics/customers - Customer distribution ✅
- [x] GET /api/analytics/churn - Churn metrics ✅
- [x] GET /api/analytics/cohorts - Cohort analysis ✅

**UI Komponenter:**
- [x] Dashboard med 4 key metrics cards ✅
- [x] Line chart för MRR growth ✅
- [x] Pie chart för customer distribution ✅
- [x] Top 10 customers table ✅
- [x] Cohort retention heatmap ✅

**Checkpoint:** `Wave 5A Task 5.1 - Business Metrics Dashboard complete`

---

### 5.2 Customer Health Score System ⏳
**Feature:** Proaktiv kundhantring med automatisk health scoring

**Status:** KVARSTÅR - Ej påbörjad

**Vad som behöver implementeras:**
- [ ] Database Models:
  - CustomerHealthScore (score 0-100, factors)
  - HealthAlerts för automatiska varningar
  - CustomerActivity för usage tracking

- [ ] Scoring Algorithm (viktning):
  - Login frequency: 30% (sista 30 dagarna)
  - Feature usage: 25% (andel aktiverade AI-funktioner)
  - Booking volume vs limit: 20%
  - Support tickets: 15%
  - Payment history: 10%

- [ ] Automatiska Alerts:
  - Score <30: Risk för churn → retention email
  - Score 30-60: Watch list → erbjud support
  - Score >80: Happy customer → erbjud upgrade/referral

- [ ] UI Dashboard:
  - Customer health overview med färgkodade scores
  - Filtering per health score range
  - Action buttons: "Skicka retention email", "Erbjud support"
  - Drill-down på individuell kund med detaljerad breakdown

**Estimerad tid:** 5-6 timmar

---

### 5.3 Automated Marketing Triggers ⏳
**Feature:** Email automation baserat på användarbeteende

**Status:** KVARSTÅR - Ej påbörjad

**Vad som behöver implementeras:**
- [ ] Email Automation Flows:
  - Trial Day 3: "Har du hittat dina AI-rekommendationer ännu?"
  - Trial Day 7: "Halvvägs genom din trial - vad du missat"
  - Trial Day 12: "Uppgradera nu, 20% rabatt första månaden"
  - BASIC user >400 bookings: "Uppgradera till PROFESSIONAL"
  - Efter 30 dagar PROFESSIONAL: "Success story + referral"

- [ ] Database:
  - EmailCampaign model
  - EmailTrigger för automatiska triggers
  - EmailLog för delivery tracking

- [ ] API Integration:
  - Integration med 46elks eller Resend API
  - Template system för olika email types

- [ ] Admin Interface:
  - Email campaign dashboard (open rates, click rates)
  - Template editor
  - A/B test setup
  - Opt-out management (GDPR)

- [ ] Triggers:
  - Webhook integration vid subscription events
  - Cron jobs för periodic checks
  - Real-time triggers vid user actions

**Estimerad tid:** 6-8 timmar

---

## 🟢 PRIORITET 6: Wave 5B - Competitive Intelligence (Låg prioritet) ⏳

### 6.1 Competitor Analysis Dashboard
**Feature:** Competitive intelligence system för marknadspositioning

**Status:** KVARSTÅR - Ej påbörjad

**Vad som behöver implementeras:**
- [ ] Web Scraping Setup:
  - Automated price monitoring (Bookify, TidyHQ, etc.)
  - Feature comparison matrix
  - Review sentiment från G2, Capterra, Trustpilot

- [ ] Database:
  - Competitor model
  - MarketIntelligence
  - CompetitiveAlert

- [ ] Dashboard UI:
  - Competitive pricing matrix
  - Feature gap analysis
  - Market positioning chart
  - Alerts vid prisförändringar

- [ ] Actionable Insights:
  - Automated recommendations för prisjusteringar
  - Feature prioritization baserat på gaps
  - Market opportunity identification

**Estimerad tid:** 8-10 timmar

---

## 🟠 PRIORITET 7: Pricing-förbättringar

### 7.1 Yearly Payment Option ✅
**Status:** KLART - Implementerad 2025-10-19

**Implementation:**
- ✅ Database schema: BillingInterval enum (MONTHLY/YEARLY)
- ✅ Pricing Logic: 20% rabatt för yearly
- ✅ UI Updates: "⭐ BÄSTA VÄRDE" badge
- ✅ Upgrade Flow: Toggle monthly/yearly

**Checkpoint:** `Yearly payment option complete`

---

### 7.2 A/B Testing för Pricing Page ⏳
**Feature:** Conversion rate optimization

**Status:** KVARSTÅR - Ej påbörjad

**Åtgärd:**
- [ ] Variant A: Nuvarande pricing
- [ ] Variant B: Begränsad tid erbjudande (50% rabatt första månaden)
- [ ] Tracking av conversion rate per variant
- [ ] Admin dashboard för A/B-test resultat

---

### 7.3 Referral Program ⏳
**Feature:** "Bjud in kollega, få 1 månad gratis"

**Status:** KVARSTÅR - Ej påbörjad

**Åtgärd:**
- [ ] Referral link generation
- [ ] Tracking av referrals
- [ ] Automated discount application
- [ ] Referral dashboard

---

### 7.4 Freemium Tier (Låg prioritet) ⏳
**Feature:** 50 bokningar/månad gratis

**Status:** KVARSTÅR - Ej påbörjad

**Åtgärd:**
- [ ] Lägg till FREE tier i pricing table
- [ ] Begränsningar: 50 bokningar/mån, basic features
- [ ] Upgrade prompts när gräns nås
- [ ] Conversion tracking FREE → BASIC/PROFESSIONAL

---

## 🟠 PRIORITET 8: GoHighLevel (GHL) Integration - SuperAdmin UI ✅

### 8.1 GHL SuperAdmin Configuration Page ✅
**Status:** KLART - Implementerad 2025-10-19

**Vad vi skapade:**
- ✅ `/app/superadmin/ghl-config/page.tsx` - GHL configuration page
- ✅ `/components/superadmin/ghl-config-form.tsx` - Komplett formulär
- ✅ `/app/api/ghl/test/route.ts` - Test-endpoint
- ✅ Navigation i SuperAdmin layout

**Checkpoint:** `GHL SuperAdmin UI complete`

---

### 8.2 GHL Webhooks (Framtida förbättring) ⏳
**Feature:** Ta emot webhooks från GHL

**Status:** KVARSTÅR - Ej påbörjad

**Åtgärd:**
- [ ] Skapa `/api/ghl/webhooks/route.ts`
- [ ] Verifiera webhook signature
- [ ] Mappta GHL appointments → Flow bookings
- [ ] Logga alla webhook events

---

## 🟢 PRIORITET 9: Corex Integration ✅

### 9.1 Corex Voice Integration ✅
**Status:** KLART - Implementerad med KB Whisper

**Vad som finns:**
- ✅ STT/TTS/Corex integration komplett
- ✅ KB Whisper konfigurerad för STT
- ✅ Corex chat widget i dashboard
- ✅ Voice conversation API
- ✅ Full dokumentation i RÖST_INTEGRATION_HANDOVER.md

**Endpoints:**
- ✅ `/api/corex/chat` - Chat med Corex
- ✅ `/api/voice/conversation` - Voice conversation handling
- ✅ `/api/stt/transcribe` - Speech-to-text via KB Whisper
- ✅ `/api/voice/tts` - Text-to-speech

**UI Komponenter:**
- ✅ `ai-chat-widget.tsx` - Chat interface
- ✅ `corex-chat-widget.tsx` - Corex-specific widget

---

### 9.2 Corex Analytics Dashboard ⏳
**Feature:** Visa call-statistik och AI-insights från Corex

**Status:** KVARSTÅR - Ej påbörjad

**Åtgärd:**
- [ ] Call volume metrics
- [ ] Conversion rates från calls → bokningar
- [ ] Sentiment analysis av samtal
- [ ] Integration med Flow Revenue Intelligence

---

## 🟢 PRIORITET 10: Nice-to-have förbättringar

### 10.1 Visningsläge / Display preferences ⏳
**Status:** Delvis implementerat (Display Mode finns, men ej user preferences)

**Vad som finns:**
- ✅ Display Mode Switcher (FULL/OPERATIONS/KIOSK/CAMPAIGNS)
- ✅ Module visibility per mode

**Vad som kvarstår:**
- [ ] Dark/light mode toggle
- [ ] Compact vs Expanded view
- [ ] Användarinställningar för display preferences
- [ ] Länk i huvudmenyn: "Inställningar" → "Display Preferences"

---

### 10.2 Mock Clinics för SA testing ⏳
**Status:** KVARSTÅR - Ej påbörjad

**Åtgärd:**
- [ ] Skapa 2-3 mock clinics med realistisk data
- [ ] Använd för SA impersonation testing
- [ ] Seeda med bokningar, kunder, staff

---

### 10.3 Onboarding steg 2 banner ✅
**Status:** KLART - Implementerad 2025-10-19

---

## 📋 Implementation Checklist - Rekommenderad ordning

**✅ VECKA 1-2: Kritisk säkerhet & SA funktionalitet (KLART!)**
- ✅ Task 1-5 Security & Superadmin
- ✅ Auth Middleware
- ✅ Footer conditional rendering
- ✅ Onboarding fixes
- ✅ STT UI complete

**✅ VECKA 3-4: Dynamic Pricing + Integrations (KLART!)**
- ✅ Dynamic Pricing Toggle
- ✅ Payatt → Engagement Hub refactoring
- ✅ Revenue Intelligence Dashboard
- ✅ GHL SuperAdmin UI
- ✅ 46elks Subaccounts
- ✅ Yearly Payment Option
- ✅ Röstintegration (STT/TTS/Corex)

**⏳ VECKA 5-6: Customer Intelligence (NÄSTA STEG)**
- [ ] 5.2 - Customer Health Score System (5-6h)
- [ ] 5.3 - Automated Marketing Triggers (6-8h)
- [ ] 6.1 - Competitor Analysis Dashboard (8-10h)

**FRAMTID: Business Growth Features**
- [ ] 7.2 - A/B Testing för Pricing Page
- [ ] 7.3 - Referral Program
- [ ] 7.4 - Freemium Tier
- [ ] 8.2 - GHL Webhooks
- [ ] 9.2 - Corex Analytics Dashboard
- [ ] 10.1 - Display preferences (dark mode, etc.)
- [ ] 10.2 - Mock clinics för SA testing

---

## 🔗 Relaterade dokument

**Handover & Dokumentation:**
- `/home/ubuntu/RÖST_INTEGRATION_HANDOVER.md` - Komplett röstintegration guide 🆕
- `/home/ubuntu/HANDOVER_V3.md` - General handover document
- `/home/ubuntu/jillae.md` - Actionable to-do (uppdaterad)
- `/home/ubuntu/internal.md` - Framtidstankar

**Källa-promptar:**
- `/home/ubuntu/Uploads/login routing` - Säkerhet & routing ✅
- `/home/ubuntu/Uploads/Dynamic Pricing Intelligence i Flow` ✅
- `/home/ubuntu/Uploads/old_eller` - Revenue Intelligence ✅
- `/home/ubuntu/Uploads/openai` - OpenAI Whisper config ✅
- `/home/ubuntu/Uploads/payatt term` ✅
- `/home/ubuntu/Uploads/Tier_ARR` - Pricing-strategi ✅

**Tekniska specs:**
- KB-Whisper: `/home/ubuntu/Uploads/KB_Whisper_Access_Guide_v2.pdf`
- STT Implementation: `/home/ubuntu/flow/STT_IMPLEMENTATION_SUMMARY.md`
- Task 1-5 Summary: `/home/ubuntu/flow/TASK_1_5_IMPLEMENTATION_SUMMARY.md` ✅
- 46elks: `/home/ubuntu/flow/46ELKS_SUBACCOUNTS_IMPLEMENTATION_COMPLETE.md`

---

## 💬 Nästa Session: Rekommendationer

### Prioritet 1: Customer Intelligence (Vecka 5-6)
**Rekommenderad ordning:**

1. **Customer Health Score System** (5-6 timmar)
   - Implementera scoring algorithm
   - Skapa health alerts
   - Bygga dashboard UI
   - **Impact:** Proaktiv retention, minskar churn

2. **Automated Marketing Triggers** (6-8 timmar)
   - Skapa email templates
   - Implementera trigger logic
   - Bygga campaign dashboard
   - **Impact:** Automatiserad communication, ökad conversion

3. **Competitor Analysis** (8-10 timmar)
   - Web scraping för price monitoring
   - Feature comparison matrix
   - Market positioning dashboard
   - **Impact:** Competitive intelligence, bättre pricing

**Total estimerad tid:** 19-24 timmar (2-3 dagars arbete)

---

**Dokumenterat av:** DeepAgent  
**Senaste session:** 2025-10-23 (Röstintegration & Handover)  
**Nästa session:** Customer Intelligence Wave (Health Score + Marketing Triggers)


