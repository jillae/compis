
# LEFTOVERS - Kvarvarande Tasks

**Senast uppdaterat:** 2025-10-18 (Kväll - Efter Task 1-5)

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

## 🟡 PRIORITET 3: Payatt Terminologi - Byt "billing" till "Engagement Hub"

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

## 🟢 PRIORITET 4: Nice-to-have förbättringar

### 4.1 Visningsläge / Display preferences
**Åtgärd:**
- [ ] Implementera dark/light mode toggle (finns redan?)
- [ ] Compact vs Expanded view
- [ ] Användarinställningar för display preferences
- [ ] Länk i huvudmenyn: "Inställningar" → "Display Preferences"

---

### 4.2 Mock Clinics för SA testing
**Åtgärd:**
- [ ] Skapa 2-3 mock clinics med realistisk data
- [ ] Använd för SA impersonation testing
- [ ] Seeda med bokningar, kunder, staff

---

### 4.3 Onboarding steg 2 banner
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
- ✅ 1.6 - Ta bort "Landningssida" från meny

**VECKA 2: STT UI & Payatt terminologi**
- [ ] 2.1 - OpenAI Configuration UI
- [ ] 2.2 - STT Test-funktion
- [ ] 3.2 - Routing-ändringar (billing → engagement)
- [ ] 3.3 - UI-terminologi uppdatering

**VECKA 3: Refactoring & Polish**
- [ ] 3.4 - Database & Type updates
- [ ] 1.5 - Debug onboarding upstream error
- [ ] 4.1 - Display preferences
- [ ] 4.2 - Mock clinics
- [ ] 4.3 - Onboarding steg 2 verification

---

## 🔗 Relaterade dokument

**Källa-promptar:**
- `/home/ubuntu/Uploads/login routing` - Säkerhet & routing
- `/home/ubuntu/Uploads/openai` - OpenAI Whisper config
- `/home/ubuntu/Uploads/payatt term` - Terminologi-förslag

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

