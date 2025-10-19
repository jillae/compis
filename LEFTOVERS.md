
# LEFTOVERS - Kvarvarande Tasks

**Senast uppdaterat:** 2025-10-19 (Prompt-avstämning - 7 filer genomgångna)

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

### 1.1 Auth Middleware på /dashboard/* routes ⚠️
**Problem:** Användare kan nå /dashboard/simulator UTAN inloggning

**Säkerhetsbrist:** Alla routes under /dashboard/* måste kräva autentisering

**Åtgärd:**
- [ ] Implementera auth middleware som kontrollerar session
- [ ] Redirecta till /auth/login om ej authenticated
- [ ] Applicera på ALLA /dashboard/* routes
- [ ] Testa att obehöriga användare blockeras

**Teknisk implementation:**
```typescript
// middleware.ts eller app/dashboard/layout.tsx
export const requireAuth = async (req, res, next) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.redirect('/auth/login');
  }
  next();
};
```

---

### 1.2 Footer conditional rendering ⚠️
**Problem:** Utloggade användare kan nå interna sidor via footer-länkar

**Säkerhetsbrist:** Footer-menyn exponerar skyddade sidor för obehöriga

**Åtgärd:**
- [ ] Implementera conditional rendering i footer baserat på auth status
- [ ] Ej inloggad: Visa endast publik landing, pricing, kontakt
- [ ] Inloggad: Visa relevanta dashboard-länkar baserat på role
- [ ] Testa att footer ändras korrekt vid login/logout

**Filer att uppdatera:**
```
/components/layout/footer.tsx (eller motsvarande)
/components/layout/navigation.tsx
```

---

### 1.3 Onboarding upstream error ⚠️
**Problem:** `/onboarding` ger "upstream connect error"

**Åtgärd:**
- [ ] Debug onboarding route configuration
- [ ] Kontrollera att route handler finns och fungerar
- [ ] Verifiera att onboarding flow inte redirectar till felaktig upstream
- [ ] Fixa eventuell routing misconfiguration

**Debug checklist:**
```bash
# Kontrollera route files
ls -la app/onboarding/

# Testa onboarding endpoint
curl https://goto.klinikflow.app/onboarding

# Kontrollera Next.js routing logs
```

---

## 🟠 PRIORITET 2: OpenAI Whisper Configuration UI

### 2.1 Superadmin UI för OpenAI-konfiguration
**Status:** Backend och service är klart, men UI saknas

**Åtgärd:**
- [ ] Skapa `/app/superadmin/stt-providers/[id]/page.tsx` (edit page)
- [ ] OpenAI-specifik konfigurationsform:
  - Model selector (whisper-1, gpt-4o-transcribe, gpt-4o-mini-transcribe)
  - Language input (ISO-639-1 kod)
  - Temperature slider (0.0 - 1.0)
  - Prompt textarea (max 224 tokens / ~200 ord)
  - Response format selector (json, verbose_json, text, srt, vtt)
  - Timestamp granularities checkboxes (segment, word)

**Mockup:**
```
┌────────────────────────────────────────┐
│ OpenAI Whisper Configuration           │
├────────────────────────────────────────┤
│ Model: [whisper-1 ▼]                   │
│ Language: [sv] (ISO-639-1)             │
│                                        │
│ Temperature: [====○-----] 0.0          │
│              Exakt ←→ Kreativ          │
│                                        │
│ Prompt (Max 224 tokens):               │
│ ┌──────────────────────────────────┐  │
│ │ Dr. Andersson, Bokadirekt, ...   │  │
│ └──────────────────────────────────┘  │
│ Word count: 25 / ~200                  │
│                                        │
│ Response Format: [verbose_json ▼]     │
│                                        │
│ ☑ Word-level timestamps                │
│ ☐ Segment-level timestamps             │
│                                        │
│ [Save Configuration]                   │
└────────────────────────────────────────┘
```

**Filer att skapa:**
```
/components/superadmin/openai-whisper-config.tsx
/app/superadmin/stt-providers/[id]/page.tsx
```

---

### 2.2 Test-funktion i Superadmin
**Åtgärd:**
- [ ] Lägg till "Test Transcription" knapp i STT Providers-listan
- [ ] Modal för att ladda upp test-ljudfil
- [ ] Visa resultat: text, duration, confidence, quality metrics
- [ ] Spara test-resultat för jämförelse mellan providers

**Filer att uppdatera:**
```
/app/superadmin/stt-providers/page.tsx
/components/superadmin/test-stt-modal.tsx
```

---

## 🟡 PRIORITET 3: Dynamic Pricing Intelligence

### 3.1 Dynamic Pricing Toggle med Disclaimer
**Feature:** Aktivera/avaktivera dynamisk prissättning med laglig disclaimer

**Åtgärd:**
- [ ] Modal vid aktivering: Varning om svensk lag (28-dagarsregel för "rea", "rabatt")
- [ ] Modal vid avaktivering (inom 28 dagar): Påminnelse om prisstabilitet
- [ ] Ingen varning vid avaktivering efter 28+ dagar
- [ ] Whitepaper popup med fullständig laglig information (PDF)

**UI-komponenter:**
```
┌────────────────────────────────────────┐
│ Aktivera Dynamic Pricing?              │
├────────────────────────────────────────┤
│ Kom ihåg: Vid dynamiska priser ska du  │
│ undvika marknadsföring med 'rea',      │
│ 'rabatt' eller 'ordinarie pris'.       │
│ Prisjämförelser får endast användas om │
│ priset varit stabilt i minst 28 dagar. │
│                                        │
│ [Läs mer - Whitepaper] (PDF popup)     │
│                                        │
│ [Avbryt]  [Aktivera]                   │
└────────────────────────────────────────┘
```

**Visuell indikator:**
- Visa "Aktivt i X dagar" eller "Inaktivt i X dagar" bredvid toggle

**Database:**
- Logga tidsstämpel för varje toggle event för att beräkna 28-dagarsperiod

**Filer att skapa:**
```
/components/dashboard/dynamic-pricing-toggle.tsx
/components/dashboard/dynamic-pricing-disclaimer-modal.tsx
/public/whitepapers/dynamic-pricing-guide.pdf
/app/api/settings/dynamic-pricing/route.ts (för att logga events)
```

**Dokumentation:** Se `/home/ubuntu/Uploads/Dynamic Pricing Intelligence i Flow`

---

## 🟡 PRIORITET 4: Payatt Terminologi - Byt "billing" till "Engagement Hub"

**DECISION:** User valde **Option A: `/engagement/*`** (Customer Engagement Hub) ✅

### 3.1 Background från prompt
**Problem:** "billing" skapar förvirring - betyder fakturering i SaaS, inte loyalty

**Rationale:**
- "Billing" i SaaS = betalningshantering och fakturering
- Loyalty/SMS/Campaigns passar bättre under "Engagement" eller "Retention"
- Branschstandard för fintech/SaaS customer engagement platforms

---

### 3.2 Routing-ändringar (STOR REFACTORING) 🚨
**Åtgärd:**
- [ ] Byt URL från `/app/billing/*` till `/app/engagement/*`
- [ ] Uppdatera API routes från `/api/billing/*` till `/api/engagement/*`

**Filer att byta namn på:**
```
Before:                          After:
/app/billing/                 →  /app/engagement/
/app/billing/campaigns/       →  /app/engagement/campaigns/
/app/billing/loyalty/         →  /app/engagement/loyalty/
/app/billing/sms/             →  /app/engagement/sms/

/api/billing/payatt/*         →  /api/engagement/payatt/*
/api/billing/ai/chat          →  /api/engagement/ai/chat
```

**⚠️ OBS:** Detta påverkar MÅNGA filer - behöver systematisk refactoring!

**Script för att hitta alla references:**
```bash
cd /home/ubuntu/flow/nextjs_space
grep -r "billing" app/ lib/ components/ | grep -v "Invoice" | grep -v "Payment" | grep -v "Subscription"
```

---

### 3.3 UI-terminologi
**Åtgärd:**
- [ ] Uppdatera modulnamn i navigation: "Customer Engagement Hub"
- [ ] Svenska översättning: "Kundengagemang"
- [ ] Undermeny:
  - Loyalty Programs → Lojalitetsprogram
  - Campaigns → Kampanjer
  - SMS & Messaging → SMS & Meddelanden
  - Analytics → Analys

**Filer att uppdatera:**
```
/components/layout/sidebar.tsx (om den finns)
/components/layout/navigation.tsx (om den finns)
/components/dashboard/hamburger-menu.tsx
/app/engagement/layout.tsx (ny header/title)
```

---

### 3.4 Database & Type updates
**Åtgärd:**
- [ ] Sök igenom alla TypeScript-filer för "billing" som INTE refererar till faktiska fakturor
- [ ] Uppdatera interfaces, types, function names
- [ ] Kontrollera att ÄKTA billing (Invoice, Payment, Subscription) INTE påverkas

**Important:** Behåll "billing" för:
- Invoice-relaterade funktioner
- Payment processing
- Subscription management (för SaaS billing)

Byt till "engagement" för:
- Payatt-relaterade funktioner
- Loyalty programs
- SMS campaigns
- Customer engagement features

---

## 🟡 PRIORITET 5: Wave 5A - Revenue Intelligence & Analytics

### 5.1 Business Metrics Dashboard
**Feature:** Komplett Revenue Intelligence dashboard för MRR/ARR tracking

**Database utökning:**
- [ ] RevenueMetric model med datum, MRR, ARR, churn_rate, customer_count per tier
- [ ] DailyRevenue model för tracking av daglig tillväxt
- [ ] CustomerJourney model för tracking av upgrade/downgrade patterns

**API Endpoints:**
- [ ] GET /api/analytics/revenue - MRR/ARR trends sista 12 månader
- [ ] GET /api/analytics/customers - Customer distribution per tier
- [ ] GET /api/analytics/churn - Churn rate och retention metrics
- [ ] GET /api/analytics/cohorts - Cohort analysis för retention

**UI Komponenter:**
- [ ] Dashboard med 4 key metrics cards (MRR, ARR, Active Customers, Churn Rate)
- [ ] Line chart för MRR growth över tid med React Recharts
- [ ] Pie chart för customer distribution per tier
- [ ] Table för top 10 most valuable customers
- [ ] Cohort retention heatmap
- [ ] Export function för CSV reports

**Svenska labels:**
- "Månadsvis Återkommande Intäkt", "Årlig Återkommande Intäkt"
- "Kundfördelning", "Kundavhopp", "Retention Rate"

**Dokumentation:** Se `/home/ubuntu/Uploads/old_eller`

---

### 5.2 Customer Health Score System
**Feature:** Proaktiv kundhantring med automatisk health scoring

**Database Models:**
- [ ] CustomerHealthScore med score (0-100), faktorer som påverkar
- [ ] HealthAlerts för automatiska varningar
- [ ] CustomerActivity för tracking av användning

**Beräkning av Health Score:**
- Login frequency (30% av score) - sista 30 dagarna
- Feature usage (25%) - andel aktiverade AI-funktioner
- Booking volume vs limit (20%) - hur nära gränsen de är
- Support tickets (15%) - antal klagomål
- Payment history (10%) - försenade betalningar

**Automatiska Alerts:**
- Score under 30: Risk för churn, skicka retention email
- Score 30-60: Watch list, erbjud support
- Score över 80: Happy customer, erbjud upgrade eller referral

**UI Dashboard:**
- [ ] Customer health overview med färgkodade scores
- [ ] Filtering per health score range
- [ ] Action buttons: "Skicka retention email", "Erbjud support"
- [ ] Drill-down på individuell kund med detaljerad health breakdown

**Svenska interface:** "Kundhälsa", "Riskanalys", "Åtgärdsförslag"

---

### 5.3 Automated Marketing Triggers
**Feature:** Email automation baserat på användarbeteende

**Email Automation Flows:**
- [ ] Trial Day 3: "Har du hittat dina AI-rekommendationer ännu?"
- [ ] Trial Day 7: "Halvvägs genom din trial - här är vad du missat"
- [ ] Trial Day 12: "Uppgradera nu och få 20% rabatt första månaden"
- [ ] BASIC user >400 bookings: "Du närmar dig gränsen - uppgradera till PROFESSIONAL"
- [ ] Efter 30 dagar PROFESSIONAL: "Kund-success story + referral program"

**Database:**
- [ ] EmailCampaign model för kampanjhantering
- [ ] EmailTrigger för automatiska triggers baserat på events
- [ ] EmailLog för delivery tracking

**API Integration:**
- [ ] Integration med 46elks eller Resend API för svenska email delivery
- [ ] Template system för olika email types

**Admin Interface:**
- [ ] Email campaign dashboard med open rates, click rates
- [ ] Template editor för anpassning av meddelanden
- [ ] A/B test setup för subject lines och content
- [ ] Opt-out management för GDPR compliance

**Triggers:**
- [ ] Webhook integration när subscription events sker
- [ ] Cron jobs för periodic checks (daily health score updates)
- [ ] Real-time triggers vid specifika user actions

---

## 🟢 PRIORITET 6: Wave 5B - Competitive Intelligence (Låg prioritet)

### 6.1 Competitor Analysis Dashboard
**Feature:** Competitive intelligence system för marknadspositioning

**Web Scraping Setup:**
- [ ] Automated price monitoring av konkurrenter (Bookify, TidyHQ, etc.)
- [ ] Feature comparison matrix
- [ ] Review sentiment från G2, Capterra, Trustpilot

**Database:**
- [ ] Competitor model med namn, priser, features, last_updated
- [ ] MarketIntelligence för trends och insights
- [ ] CompetitiveAlert för prisförändringar

**Dashboard UI:**
- [ ] Competitive pricing matrix med dina priser vs konkurrenter
- [ ] Feature gap analysis - vad konkurrenter har som du saknar
- [ ] Market positioning chart med pris vs features
- [ ] Alerts när konkurrenter ändrar priser eller lanserar features

**Actionable Insights:**
- [ ] Automated recommendations för prisjusteringar
- [ ] Feature prioritization baserat på competitive gaps
- [ ] Market opportunity identification

**Dokumentation:** Se `/home/ubuntu/Uploads/old_eller`

---

## 🟢 PRIORITET 7: Pricing-förbättringar

### 7.1 Yearly Payment Option
**Feature:** Årlig betalning med 10% rabatt

**Åtgärd:**
- [ ] Toggle mellan monthly/yearly på pricing page
- [ ] Beräkna och visa "Spara X SEK/år" dynamiskt
- [ ] Uppdatera Stripe integration för yearly subscriptions
- [ ] Visa "BÄSTA VÄRDE" badge på yearly option

**UI:**
```
┌────────────────────────────────────┐
│ [Monthly] [Yearly - Spara 10%] ✨  │
└────────────────────────────────────┘
```

---

### 7.2 A/B Testing för Pricing Page
**Feature:** Conversion rate optimization

**Åtgärd:**
- [ ] Variant A: Nuvarande pricing
- [ ] Variant B: Begränsad tid erbjudande (första månaden 50% rabatt)
- [ ] Tracking av conversion rate per variant
- [ ] Admin dashboard för att se A/B-test resultat

---

### 7.3 Referral Program
**Feature:** "Bjud in kollega, få 1 månad gratis"

**Åtgärd:**
- [ ] Referral link generation för varje användare
- [ ] Tracking av referrals i database
- [ ] Automated discount application vid successful referral
- [ ] Referral dashboard för användare

---

### 7.4 Freemium Tier (Låg prioritet)
**Feature:** 50 bokningar/månad gratis för att öka conversions

**Åtgärd:**
- [ ] Lägg till FREE tier i pricing table
- [ ] Begränsningar: 50 bokningar/mån, basic features endast
- [ ] Upgrade prompts när gräns nås
- [ ] Conversion tracking från FREE → BASIC/PROFESSIONAL

**Dokumentation:** Se `/home/ubuntu/Uploads/Tier_ARR`

---

## 🟠 PRIORITET 8: GoHighLevel (GHL) Integration - SuperAdmin UI

### 8.1 GHL SuperAdmin Configuration Page ⚠️
**Status:** Backend och API finns, men SuperAdmin UI saknas

**Befintlig implementation:**
- ✅ `/api/ghl/config/route.ts` - GET/PUT endpoints för GHL config
- ✅ `/api/ghl/sync/route.ts` - POST/GET för synkronisering
- ✅ `/components/ghl/ghl-connection-status.tsx` - Status dashboard
- ✅ Database: `ghlEnabled`, `ghlApiKey`, `ghlLocationId`, `ghlLastSync` på Clinic model

**Saknas:**
- [ ] `/app/superadmin/ghl-config/page.tsx` - SuperAdmin UI för GHL setup
- [ ] Form för att konfigurera GHL per klinik:
  - API Key input (masked/password field)
  - Location ID input
  - Enable/Disable toggle
  - Test Connection knapp
  - Sync status display (använd GHLConnectionStatus komponent)

**UI Mockup:**
```
┌──────────────────────────────────────────────┐
│ GoHighLevel Configuration                    │
├──────────────────────────────────────────────┤
│ Klinik: [ArchClinic ▼]                       │
│                                              │
│ ☑ Aktivera GHL Integration                  │
│                                              │
│ API Key: [••••••••••••••••] 🔑              │
│                                              │
│ Location ID: [abc123...] 📍                  │
│                                              │
│ [Test Connection] [Spara Konfiguration]     │
│                                              │
│ ─────────────────────────────────────────   │
│                                              │
│ <GHLConnectionStatus />                      │
│   • Totalt synkningar: 45                   │
│   • Lyckade: 43                              │
│   • Misslyckade: 2                           │
│   • Senaste synk: 2025-10-19 15:30          │
│                                              │
│ [Visa Sync-loggar]                           │
└──────────────────────────────────────────────┘
```

**Filer att skapa:**
```
/app/superadmin/ghl-config/page.tsx
/components/superadmin/ghl-config-form.tsx
```

**Integration med ClinicSelector:**
- Använd ClinicContext för att hämta vald klinik
- Visa GHL config för den valda kliniken
- SuperAdmin kan konfigurera GHL för vilken klinik som helst

---

### 8.2 GHL Webhooks (Framtida förbättring)
**Feature:** Ta emot webhooks från GHL när bokningar skapas/uppdateras i GHL

**Åtgärd:**
- [ ] Skapa `/api/ghl/webhooks/route.ts` för att ta emot GHL webhooks
- [ ] Verifiera webhook signature från GHL
- [ ] Mappta GHL appointments → Flow bookings
- [ ] Mappta GHL contacts → Flow customers
- [ ] Logga alla webhook events
- [ ] Admin UI för att visa webhook-loggar

**Dokumentation:** 
- GHL Webhooks: https://highlevel.stoplight.io/docs/integrations/

---

## 🟢 PRIORITET 9: Corex Integration (Framtida Wave)

### 9.1 Corex Voice Calls Integration
**Feature:** Integration med Corex AI-telefoniassistent

**Åtgärd:**
- [ ] API integration med Corex endpoints
- [ ] Call logging och recording
- [ ] Transkribering med Whisper
- [ ] Dashboard för call analytics
- [ ] Admin UI för Corex-konfiguration

**Dokumentation:** Se `/home/ubuntu/Uploads/Corex - omnichannel klinikassistent.md`

---

### 9.2 Corex Analytics Dashboard
**Feature:** Visa call-statistik och AI-insights från Corex

**Åtgärd:**
- [ ] Call volume metrics
- [ ] Conversion rates från calls → bokningar
- [ ] Sentiment analysis av samtal
- [ ] Integration med Flow Revenue Intelligence

---

## 🟢 PRIORITET 10: Nice-to-have förbättringar

### 10.1 Visningsläge / Display preferences
**Åtgärd:**
- [ ] Implementera dark/light mode toggle (finns redan?)
- [ ] Compact vs Expanded view
- [ ] Användarinställningar för display preferences
- [ ] Länk i huvudmenyn: "Inställningar" → "Display Preferences"

---

### 10.2 Mock Clinics för SA testing
**Åtgärd:**
- [ ] Skapa 2-3 mock clinics med realistisk data
- [ ] Använd för SA impersonation testing
- [ ] Seeda med bokningar, kunder, staff

---

### 10.3 Onboarding steg 2 banner
**Verifiering behövs:**
- [ ] Kontrollera onboarding flow configuration
- [ ] Steg 2 ska innehålla:
  - Bokadirekt connection setup
  - Banner med instruktioner/guiding
  - Progress indicator (Steg 2/X)

---

## 📋 Implementation Checklist - Rekommenderad ordning

**✅ VECKA 1: Kritisk säkerhet & SA funktionalitet (KLART!)**
- ✅ 1.1 - Skapa Superadmin Dashboard
- ✅ 1.2 - Implementera Clinic Selector
- ✅ 1.3 - Fixa Role Switch
- ✅ 1.4 - Ta bort GoCardless, skapa Billing page
- ✅ 1.5 - Ta bort "Landningssida" från meny

**VECKA 2: Kritisk säkerhet (fortsättning) + STT UI**
- [ ] 1.1 - Auth Middleware på /dashboard/* routes 🔴
- [ ] 1.2 - Footer conditional rendering 🔴
- [ ] 1.3 - Debug onboarding upstream error
- [ ] 2.1 - OpenAI Configuration UI
- [ ] 2.2 - STT Test-funktion

**VECKA 3: Dynamic Pricing + Payatt terminologi**
- [ ] 3.1 - Dynamic Pricing Toggle med Disclaimer
- [ ] 4.2 - Routing-ändringar (billing → engagement)
- [ ] 4.3 - UI-terminologi uppdatering
- [ ] 4.4 - Database & Type updates

**VECKA 4-6: Revenue Intelligence (Wave 5A)**
- [ ] 5.1 - Business Metrics Dashboard (MRR/ARR)
- [ ] 5.2 - Customer Health Score System
- [ ] 5.3 - Automated Marketing Triggers

**VECKA 7-8: Pricing-förbättringar**
- [ ] 7.1 - Yearly Payment Option
- [ ] 7.2 - A/B Testing för Pricing Page
- [ ] 7.3 - Referral Program

**FRAMTID: Nice-to-have**
- [ ] 6.1 - Competitor Analysis Dashboard (Wave 5B)
- [ ] 7.4 - Freemium Tier
- [ ] 8.1 - Display preferences
- [ ] 8.2 - Mock clinics
- [ ] 8.3 - Onboarding steg 2 verification

---

## 🔗 Relaterade dokument

**Källa-promptar (2025-10-19):**
- `/home/ubuntu/Uploads/login routing` - Säkerhet & routing ✅
- `/home/ubuntu/Uploads/Dynamic Pricing Intelligence i Flow` - Dynamic Pricing feature 🆕
- `/home/ubuntu/Uploads/old_eller` - Wave 5A/5B Revenue Intelligence 🆕
- `/home/ubuntu/Uploads/openai` - OpenAI Whisper config ✅
- `/home/ubuntu/Uploads/konfiguera` - Gamla konfigurationsnoteringar (Voice, TTS, FAQ)
- `/home/ubuntu/Uploads/payatt term` - Terminologi-förslag (billing → engagement) ✅
- `/home/ubuntu/Uploads/Tier_ARR` - ARR-beräkning och pricing-strategi 🆕

**Tekniska specs:**
- KB-Whisper: `/home/ubuntu/Uploads/KB_Whisper_Access_Guide_v2.pdf`
- STT Implementation: `/home/ubuntu/flow/STT_IMPLEMENTATION_SUMMARY.md`
- **Task 1-5 Summary:** `/home/ubuntu/flow/TASK_1_5_IMPLEMENTATION_SUMMARY.md` ✅

---

## 💬 Frågor till användaren

1. ✅ **Payatt terminologi:** User valde **Option A: "Engagement Hub"**
2. **SA clinic association:** Ska Gilbert (SA) vara kopplad till ArchClinic eller ha egen org ("KlinikFlow Admin")? (Ej besvarad)
3. **Onboarding flow:** Ska onboarding vara en one-time setup eller kunna nås igen senare? (Ej besvarad)

---

**Dokumenterat av:** DeepAgent  
**Session:** 2025-10-18 (Kväll - Efter Task 1-5)  
**Nästa session:** Börja med VECKA 2 tasks (STT UI + Payatt refactoring)

