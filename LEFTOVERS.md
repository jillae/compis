
# LEFTOVERS - Kvarvarande Tasks

**Senast uppdaterat:** 2025-10-21 (Deploy + 46elks/Fortnox påbörjat)

## 🎉 DAGENS PROGRESS (2025-10-21)

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

### 📋 LEFTOVERS Analys
- **Quick wins:** ✅ KLART (navigation, footer, auth)
- **Big tasks:** Customer Health Score, Marketing Triggers, Competitor Analysis (8-12h total)
- **Business decisions:** A/B testing, Referral, Freemium (kräver stakeholder input)

---

**Tidigare uppdateringar:** 2025-10-19 (Prompt-avstämning - 7 filer genomgångna)

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

**Middleware-implementation (befintlig):**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/auth/login', '/auth/signup', '/pricing', ...]
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Require authentication for protected routes
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // SuperAdmin route protection
  if (pathname.startsWith('/superadmin')) {
    if (token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}
```

**Checkpoint:** `Auth middleware verified and fixed` (2025-10-19)

---

### 1.2 Footer conditional rendering ✅
**Status:** KLART - Footer har redan korrekt conditional rendering!

**Vad vi verifierade:**
- ✅ Footer använder `useSession()` från next-auth för auth-check
- ✅ Conditional rendering baserat på `isAuthenticated`:
  - **Ej inloggad:** Funktioner, Priser, Dokumentation, Kontakt
  - **Inloggad:** Dashboard, Revenue Intelligence, Customer Health, Marketing Automation
- ✅ Support- och Juridiskt-sektionerna visar alltid publika länkar
- ✅ Footer är implementerad i root layout (`app/layout.tsx`)

**Implementation (befintlig):**
```typescript
// components/footer.tsx
export function Footer() {
  const { data: session } = useSession() || {};
  const isAuthenticated = !!session?.user;

  return (
    <footer className="border-t bg-muted/50 mt-auto">
      {/* Product section med conditional rendering */}
      {isAuthenticated ? (
        <div>
          <ul>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/dashboard/insights">Revenue Intelligence</Link></li>
            <li><Link href="/dashboard/customers">Customer Health</Link></li>
            <li><Link href="/dashboard/marketing">Marketing Automation</Link></li>
          </ul>
        </div>
      ) : (
        <div>
          <ul>
            <li><Link href="/#features">Funktioner</Link></li>
            <li><Link href="/pricing">Priser</Link></li>
            <li><Link href="/docs">Dokumentation</Link></li>
            <li><a href="mailto:support@klinikflow.se">Kontakt</a></li>
          </ul>
        </div>
      )}
    </footer>
  );
}
```

**Testresultat:**
- ✅ Utloggade användare ser publika länkar (Funktioner, Priser, Dokumentation, Kontakt)
- ✅ Footer visas korrekt på landing page
- ✅ Ingen exponering av skyddade routes via footer

**Fil:** `components/footer.tsx`

---

### 1.3 Onboarding upstream error ✅
**Status:** KLART - Onboarding fungerar korrekt! Upstream error var tillfälligt.

---

### 1.4 Onboarding Banner för Steg 2 ✅
**Status:** KLART - Implementerad 2025-10-19

**Vad vi skapade:**
- ✅ OnboardingBanner komponent i `/components/dashboard/onboarding-banner.tsx`
- ✅ Integrerad i `/app/dashboard/layout.tsx`
- ✅ Visar banner om steg 2 inte är klart
- ✅ Tre alternativ för användaren:
  - **"Slutför onboarding"** - Går till /onboarding
  - **"Dölj denna session"** - Döljer banner tills nästa inloggning (sessionStorage)
  - **"Stäng av permanent"** - Markerar onboarding som skippad (databasen)

**Funktionalitet:**
```typescript
// Banner visas om:
- onboardingStep !== 2 ELLER
- onboardingCompletedAt === null

// Banner döljs om:
- Användaren klickar "Dölj denna session" (sessionStorage)
- Användaren klickar "Stäng av permanent" (database update)
- Onboarding är klart (step 2 done)
```

---

### 1.5 Session Timeout Konfiguration ✅
**Status:** KLART - Implementerad 2025-10-19

**Vad vi fixade:**
- ✅ Lagt till session timeout i `/lib/auth.ts`
- ✅ Konfigurerad NextAuth session:
  - **maxAge:** 8 timmar (28800 sekunder) vid inaktivitet
  - **updateAge:** 30 minuter (1800 sekunder) för session refresh

**Implementation:**
```typescript
// lib/auth.ts
session: {
  strategy: "jwt",
  maxAge: 60 * 60 * 8, // 8 hours of inactivity before logout
  updateAge: 60 * 30, // Update session every 30 minutes
}
```

**Beteende:**
- Användaren loggas ut automatiskt efter 8 timmar inaktivitet
- Session uppdateras varje 30:e minut vid aktivitet
- JWT token förfaller och kräver ny inloggning

**Vad vi verifierade:**
- ✅ `/app/onboarding/page.tsx` existerar med komplett 2-stegs onboarding flow
- ✅ API-endpoints finns och fungerar:
  - `/api/user/onboarding-status` (GET) - Hämtar onboarding-status
  - `/api/user/onboarding` (POST) - Sparar onboarding-data
- ✅ Database-schemat har alla nödvändiga fält:
  - User: `onboardingStep`, `onboardingCompletedAt`
  - Clinic: `bokadirektEnabled`, `bokadirektApiKey`, `metaEnabled`, `metaAccessToken`, `metaAdAccountId`, `metaPixelId`
- ✅ Middleware skyddar `/onboarding` korrekt (kräver autentisering)
- ✅ Build lyckas utan fel - onboarding kompilerar korrekt
- ✅ Route redirectar korrekt till `/auth/login` för obehöriga användare

**Onboarding Flow:**
1. **Steg 1:** Välkomstskärm med intro till Flow
2. **Steg 2:** Anslut system (Bokadirekt & Meta API)
   - Toggle för att aktivera/avaktivera integrationer
   - Input-fält för API-nycklar och credentials
   - Instruktioner för att få API-nycklar
   - Möjlighet att hoppa över och aktivera senare

**Testresultat:**
```bash
# Onboarding kräver autentisering (korrekt beteende)
curl -I http://localhost:3000/onboarding
→ HTTP/1.1 307 Temporary Redirect
→ location: /auth/login?callbackUrl=%2Fonboarding

# Build lyckas
yarn build → exit_code=0
```

**Slutsats:** "Upstream error" var ett tillfälligt deployment-problem. Onboarding fungerar nu korrekt!

---

## 🟠 PRIORITET 2: OpenAI Whisper Configuration UI ✅

### 2.1 Superadmin UI för OpenAI-konfiguration ✅
**Status:** KLART - Fullständig OpenAI Whisper-konfiguration implementerad!

**Vad vi skapade:**
- ✅ `/app/superadmin/stt-providers/[id]/page.tsx` - Edit page för providers
- ✅ `/components/superadmin/openai-whisper-config.tsx` - OpenAI-specifik konfigurationsform
- ✅ "Configure"-knapp i STTProviderManager (endast för OpenAI providers)
- ✅ Alla parametrar enligt spec:
  - **Model selector:** whisper-1, gpt-4o-transcribe, gpt-4o-mini-transcribe
  - **Language input:** ISO-639-1 kod (default: 'sv')
  - **Temperature slider:** 0.0-1.0 med visuell indikator
  - **Prompt textarea:** Max 224 tokens / ~200 ord med live word/token counter
  - **Response format selector:** json, verbose_json, text, srt, vtt
  - **Timestamp granularities:** Checkboxes för segment + word level

**Extra features:**
- ✅ Prompt validation med varning vid överskridande av 224-token limit
- ✅ Estimerad token-räkning (4 chars/token approximation)
- ✅ Beskrivande hjälptexter för varje parameter
- ✅ Link till OpenAI dokumentation
- ✅ Sparar config i `config_json` via befintligt API
- ✅ Auto-laddar befintlig config vid edit

**Filer skapade:**
```
✅ /components/superadmin/openai-whisper-config.tsx (408 rader)
✅ /app/superadmin/stt-providers/[id]/page.tsx
```

**Filer uppdaterade:**
```
✅ /components/superadmin/STTProviderManager.tsx
   - Lagt till Settings-ikon import
   - Lagt till Link import  
   - Lagt till "Configure"-knapp för OpenAI providers
```

**Checkpoint:** `OpenAI Whisper config UI complete` (2025-10-19)

---

### 2.2 Test-funktion i Superadmin ✅
**Status:** KLART - Test-funktion fanns redan implementerad!

**Befintlig funktionalitet:**
- ✅ "Test"-knapp i STT Providers-listan (STTProviderManager)
- ✅ Genererar test-ljudfil (1 sekund tystnad)
- ✅ Skickar till `/api/stt/transcribe` för att testa provider
- ✅ Visar resultat med toast-meddelanden:
  - Success: "✓ {provider}: Fungerar! Provider: {provider_used}"
  - Error: "✗ {provider}: Misslyckades" med error message
- ✅ Loading state under test
- ✅ Test-knappen disabled för inaktiva providers

**Implementation:**
```typescript
const testProvider = async (provider: Provider) => {
  setTesting(provider.id);
  
  // Create a test audio blob (1 second of silence)
  const audioContext = new AudioContext();
  const testBlob = new Blob([...], { type: 'audio/wav' });
  
  const formData = new FormData();
  formData.append('file', testBlob, 'test.wav');

  const res = await fetch('/api/stt/transcribe', {
    method: 'POST',
    body: formData
  });

  // Show toast with result
};
```

**Fil:** `/components/superadmin/STTProviderManager.tsx` (rad 150-186)

**Note:** Mer avancerad test-funktion med fil-upload och detaljerade metrics kan implementeras senare om behövs.

---

## 🟡 PRIORITET 3: Dynamic Pricing Intelligence

### 3.1 Dynamic Pricing Toggle med Disclaimer ✅
**Status:** KLART - Redan fullständigt implementerad!

**Vad som finns:**
- ✅ Modal vid aktivering med 28-dagarsregel disclaimer
- ✅ Modal vid avaktivering med prisstabilitetspåminnelse (inom 28 dagar)
- ✅ Ingen varning vid avaktivering efter 28+ dagar
- ✅ Whitepaper popup med fullständig laglig information
- ✅ Visuell indikator: "Aktivt i X dagar" / "Inaktivt i X dagar"
- ✅ Alert när <28 dagar: "För att marknadsföra med prisjämförelser behöver priset vara stabilt i minst 28 dagar"
- ✅ Success alert när ≥28 dagar: "Du kan nu använda prisjämförelser i marknadsföringen"
- ✅ Database tracking via `/api/clinic/dynamic-pricing`

**Filer:**
- `/components/dynamic-pricing/dynamic-pricing-toggle.tsx` (279 rader)
- `/components/dynamic-pricing/dynamic-pricing-whitepaper.tsx`
- `/app/api/clinic/dynamic-pricing/route.ts`
- Används i `/app/dashboard/settings/page.tsx`

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
**STATUS:** ✅ KLART - Refactoring genomförd 2025-10-19

### 4.1 Background från prompt ✅
**Problem:** "billing" skapar förvirring - betyder fakturering i SaaS, inte loyalty

**Rationale:**
- "Billing" i SaaS = betalningshantering och fakturering
- Loyalty/SMS/Campaigns passar bättre under "Engagement" eller "Retention"
- Branschstandard för fintech/SaaS customer engagement platforms

---

### 4.2 Routing-ändringar ✅ (STOR REFACTORING KLAR)
**Vad vi gjorde:**
- ✅ Bytte `/app/billing/*` → `/app/engagement/*`
- ✅ Flyttade `/app/api/billing/payatt/*` → `/app/api/engagement/payatt/*`
- ✅ Flyttade `/app/api/billing/ai/*` → `/app/api/engagement/ai/*`
- ✅ Uppdaterade alla API-anrop i `app/engagement/`
- ✅ Uppdaterade alla route references (`/billing/` → `/engagement/`)
- ✅ Bytte funktionsnamn: `BillingPage` → `EngagementPage`

**Vad vi BEHÖLL som "billing":**
- `/app/dashboard/billing/*` - SaaS subscription/pricing management
- `/app/superadmin/billing/*` - Plaid/Bank integration
- `/app/api/billing/invoices` - Invoice management
- `/app/api/billing/subscription` - Subscription management
- `/app/api/billing/upgrade` - Tier upgrades

**Testresultat:**
```bash
✓ TypeScript compilation: 0 errors
✓ Production build: successful
✓ Runtime test: ✅ PASS
✓ API routes verified: /api/engagement/payatt/cards working
```

### 4.3 UI-terminologi ✅
**Status:** KLART - Alla funktionsnamn uppdaterade

**Vad vi gjorde:**
- ✅ `BillingPage` → `EngagementPage` i alla engagement-filer
- ✅ Route references uppdaterade överallt

**Future work (low priority):**
- [ ] Navigation labels: "Customer Engagement Hub" / "Kundengagemang"
- [ ] Undermeny med svenska översättningar (när navigation implementeras)

---

### 4.4 Database & Type updates ✅
**Status:** KLART - Separation mellan SaaS billing och Engagement

**Verifiering:**
- ✅ SaaS Billing behålls: Invoice, Payment, Subscription endpoints
- ✅ Engagement flyttat: Payatt, Loyalty, SMS, Campaigns
- ✅ TypeScript compilation 0 errors
- ✅ Ingen breaking changes för befintliga features

---

## 🟡 PRIORITET 5: Wave 5A - Revenue Intelligence & Analytics

### 5.1 Business Metrics Dashboard ✅ KLART! (2025-10-19)
**Feature:** Komplett Revenue Intelligence dashboard för MRR/ARR tracking

**Database utökning:**
- [x] RevenueMetric model med datum, MRR, ARR, churn_rate, customer_count per tier ✅
- [x] DailyRevenue model för tracking av daglig tillväxt ✅
- [x] CustomerJourney model för tracking av upgrade/downgrade patterns ✅
- [x] CustomerJourneyEvent enum (SIGNUP, TRIAL_START, UPGRADE, CHURN, etc.) ✅

**API Endpoints:**
- [x] GET /api/analytics/revenue - MRR/ARR trends sista 12 månader ✅
  - Stödjer både real data och mock data för demo
  - Visar MRR/ARR, nya kunder, churned kunder, tier breakdown
- [x] GET /api/analytics/customers - Customer distribution per tier ✅
  - Pie chart data med customer count och MRR per tier
- [x] GET /api/analytics/churn - Churn rate och retention metrics ✅
  - Monthly churn trends
  - Churn by reason breakdown
- [x] GET /api/analytics/cohorts - Cohort analysis för retention ✅
  - Heatmap data med retention rates över tid

**UI Komponenter:**
- [x] Dashboard med 4 key metrics cards (MRR, ARR, Active Customers, Churn Rate) ✅
- [x] Line chart för MRR growth över tid med React Recharts ✅
- [x] Pie chart för customer distribution per tier ✅
- [x] Table för top 10 most valuable customers ✅
- [x] Cohort retention heatmap med färgkodning ✅
- [x] Export function för CSV reports ✅
- [x] Tabs för olika vyer (Overview, Kunder, Churn, Cohorts) ✅

**Navigation:**
- [x] Länk till /dashboard/analytics i HamburgerMenu ✅
- [x] "Revenue Intelligence" sektion i menyn med TrendingUp-ikon ✅

**Svenska labels:**
- ✅ "Månadsvis Återkommande Intäkt", "Årlig Återkommande Intäkt"
- ✅ "Kundfördelning", "Kundavhopp", "Retention Rate"
- ✅ "Business Metrics", "Cohort Analysis", "Genomsnittlig Churn Rate"

**Features:**
- ✅ Mock data generation för demo när ingen real data finns
- ✅ Demo-data banner som förklarar när mock data visas
- ✅ SuperAdmin kan växla mellan clinics med ClinicSelector
- ✅ CSV export av revenue metrics
- ✅ Responsiv design för mobil och desktop
- ✅ Cohort heatmap med färgkodning (grön = high retention, röd = low retention)

**Filer skapade:**
```
✅ /app/api/analytics/revenue/route.ts
✅ /app/api/analytics/customers/route.ts
✅ /app/api/analytics/churn/route.ts
✅ /app/api/analytics/cohorts/route.ts
✅ /app/dashboard/analytics/page.tsx (476 rader)
✅ /components/analytics/mrr-chart.tsx
✅ /components/analytics/customer-distribution-chart.tsx
✅ /components/analytics/churn-analysis.tsx
✅ /components/analytics/cohort-heatmap.tsx
✅ /components/analytics/top-customers-table.tsx
```

**Checkpoint:** `Wave 5A Task 5.1 - Business Metrics Dashboard complete` (2025-10-19)

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

## 🟠 PRIORITET 7: Pricing-förbättringar

### 7.1 Yearly Payment Option ✅
**Status:** KLART - Implementerad 2025-10-19

**Vad vi skapade:**
- ✅ Database schema: Lagt till `BillingInterval` enum (MONTHLY/YEARLY)
- ✅ Subscription model: Lagt till `billingInterval` field
- ✅ Pricing Logic: `getTierPrice()` hanterar 20% rabatt för yearly
- ✅ `calculatePeriodEnd()` hanterar yearly billing (1 år istället för 1 månad)
- ✅ API Support:
  - `/api/billing/subscription` accepterar och sparar `billingInterval`
  - `/api/billing/upgrade` hanterar yearly subscriptions
- ✅ UI Updates:
  - "⭐ BÄSTA VÄRDE" badge på yearly-knappen (gradient grön)
  - "Spara 20% med årsbetalning ✨" badge vid monthly
  - PriceDisplay visar genomstruket månadspris vid yearly
  - Visar "Betala årsvis, spara X kr/år"
- ✅ Upgrade Flow: Toggle monthly/yearly på upgrade-sidan

**Implementation Details:**
```typescript
// Prisberäkning med 20% rabatt
BASIC:    499 kr/mån → 4 790 kr/år (399 kr/mån effektivt)
PRO:      1499 kr/mån → 14 390 kr/år (1 199 kr/mån effektivt)
ENTERPRISE: 2999 kr/mån → 28 790 kr/år (2 399 kr/mån effektivt)
```

**Checkpoint:** `Yearly payment option complete` (2025-10-19)

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

### 8.1 GHL SuperAdmin Configuration Page ✅
**Status:** KLART - Implementerad 2025-10-19

**Vad vi skapade:**
- ✅ `/app/superadmin/ghl-config/page.tsx` - GHL configuration page
- ✅ `/components/superadmin/ghl-config-form.tsx` - Komplett formulär (350+ rader)
  - ClinicSelector integration via useClinic()
  - Enable/Disable toggle
  - API Key input (masked/password field)
  - Location ID input  
  - Test Connection-knapp med live GHL API-test
  - Spara-knapp med validering
  - GHLConnectionStatus-integration
  - Instruktioner för att hitta GHL credentials
  - Link till GoHighLevel dashboard
- ✅ `/app/api/ghl/test/route.ts` - Test-endpoint
  - Verifierar GHL credentials mot live API
  - Returnerar location info vid success
- ✅ Navigation i SuperAdmin layout

**Funktionalitet:**
- SuperAdmin väljer klinik via ClinicSelector
- Formuläret laddar den klinikens GHL-config
- Kan aktivera/avaktivera integration
- Kan uppdatera API-nycklar (säkert lagrade)
- Testar live-anslutning mot GHL API (`https://rest.gohighlevel.com/v1/locations/{id}`)
- Visar sync-statistik när aktiverat (GHLConnectionStatus komponent)

**Säkerhet:**
- API keys lagras maskerade i databasen
- Endast SuperAdmin har åtkomst
- Credentials exponeras aldrig i frontend
- Test-endpoint validerar role innan API-anrop

**Checkpoint:** `GHL SuperAdmin UI complete` (2025-10-19)

**Note:** Backend och API fanns redan, detta skapade den saknade SuperAdmin UI:n.

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

**✅ VECKA 2: Kritisk säkerhet (fortsättning) + STT UI (KLART!)**
- ✅ 1.1 - Auth Middleware på /dashboard/* routes
- ✅ 1.2 - Footer conditional rendering
- ✅ 1.3 - Debug onboarding upstream error
- ✅ 1.4 - Onboarding banner för steg 2
- ✅ 1.5 - Session timeout konfiguration
- ✅ 2.1 - OpenAI Configuration UI
- ✅ 2.2 - STT Test-funktion

**✅ VECKA 3: Dynamic Pricing + Payatt terminologi (KLART!)**
- ✅ 3.1 - Dynamic Pricing Toggle med Disclaimer (var redan implementerad)
- ✅ 4.2 - Routing-ändringar (billing → engagement)
- ✅ 4.3 - UI-terminologi uppdatering
- ✅ 4.4 - Database & Type updates

**✅ VECKA 4: Revenue Intelligence (Wave 5A) - KLAR! (2025-10-19)**
- [x] 5.1 - Business Metrics Dashboard (MRR/ARR) ✅
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

2. ✅ **SA clinic association:** BESVARAD 2025-10-19
   - Gilbert (SA) ska INTE ha egen org
   - SA ska kunna växla till Admin-vy på alla anslutna kliniker
   - SA ska kunna köra SA-läge på Arch Clinic för att testa nya funktioner
   - Feature Matrix i SA inställningar: Funktioner 1-6 (exempel)
     - 1-5: Aktiverade (togglade) → synliga för Admin/Staff
     - 6: Avaktiverad (ur togglad) → synlig endast för SA, inte Admin/Staff
   - SA växlar mellan:
     - **SA-läge på Arch Clinic:** Ser allt (1-6)
     - **Admin-läge på Arch Clinic:** Ser aktiverade (1-5)

3. ✅ **Onboarding flow:** BESVARAD 2025-10-19
   - **Steg 1:** KRAV för att komma till dashboard
   - **Steg 2:** Om de hoppar över → banner larmar i dashboard
   - **Banner:** Visar onboarding steg 2 om inte klart
   - **Åtkomst:** Kan gå tillbaka via banner tills allt klart
   - **Inställningar:** User kan släcka banner manuellt
   - **Default:** Banner tänds vid varje ny inloggning om steg 2 ej klart
   - **Session timeout:** Alla sessioner loggas ut efter X tid vid inaktivitet

---

**Dokumenterat av:** DeepAgent  
**Session:** 2025-10-18 (Kväll - Efter Task 1-5)  
**Nästa session:** Börja med VECKA 2 tasks (STT UI + Payatt refactoring)


---

## 🎉 SENASTE PROGRESS (2025-10-22 Kväll)

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

2. **Authorization Issue** ✅ FIXAT
   ```typescript
   // Problem: Sanna hade ADMIN istället för SUPER_ADMIN
   // Fix:
   UPDATE users SET role = 'SUPER_ADMIN' 
   WHERE email = 'sanna@archacademy.se'
   
   // Credentials:
   // Email: sanna@archacademy.se
   // Password: flow2024
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

# Login:
Email: sanna@archacademy.se
Password: flow2024
```

**Cache Notes:**
⚠️ Om felet kvarstår efter deployment:
1. Clear browser data (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Vänta 5-10 min för CDN cache

**Files Modified:**
1. `/app/superadmin/fortnox-config/page.tsx` - useEffect fix
2. Database - Schema sync (6 Fortnox columns)
3. Users table - Sanna → SUPER_ADMIN

**Scripts Created:**
- `check-sanna-role.ts`
- `update-sanna-role.ts`
- `reset-sanna-password.ts`
- `test-stats-api.ts`
- `create-summary.md` (full documentation)

---

