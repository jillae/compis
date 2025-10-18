
# LEFTOVERS - Kvarvarande Tasks

**Senast uppdaterat:** 2025-10-18 (Kväll)

---

## 📊 Status - Vad som är KLART denna session

### ✅ STT (Speech-to-Text) - KLART
1. ✅ KB-Whisper uppdaterad till port 5001 (Flow-Speak, telefoni-optimerad)
2. ✅ OpenAI Whisper fullständig konfiguration implementerad:
   - Model: whisper-1
   - Language: Swedish (sv)
   - Response format: verbose_json (timestamps + metadata)
   - Temperature: 0.0 (deterministic)
   - Timestamp granularities: word-level
   - Prompt: Svensk medicinsk terminologi (Bokadirekt, Botox, etc.)
3. ✅ STT service uppdaterad med alla OpenAI-parametrar
4. ✅ Quality metrics extraction (avgLogprob, compressionRatio, confidence)

---

## 🔴 PRIORITET 1: Kritiska säkerhetsproblem (Login Routing)

### 1.1 Superadmin Dashboard - SAKNAS HELT
**Problem:** SA har ingen dedicated dashboard, kan bara nå via GoCardless-sidan

**Åtgärd:**
- [ ] Skapa `/app/superadmin/dashboard/page.tsx`
- [ ] Innehåll:
  - System health metrics
  - Lista över alla clinics med quick stats
  - Recent activity logs
  - Billing overview (Plaid-status)
  - Quick actions (add clinic, view logs, etc.)
- [ ] Uppdatera middleware för att redirecta SA till `/superadmin/dashboard` efter login

**Filer att skapa:**
```
/app/superadmin/dashboard/page.tsx
/components/superadmin/system-metrics.tsx
/components/superadmin/clinic-list.tsx
/components/superadmin/recent-activity.tsx
```

---

### 1.2 Clinic Selector & Impersonation - SAKNAS
**Problem:** SA kan inte välja klinik för att se clinic user view

**Åtgärd:**
- [ ] Skapa Clinic Context (`/context/ClinicContext.tsx`)
- [ ] Implementera clinic selector dropdown i header (för SA)
- [ ] Visa "Viewing as: [Clinic Name]" banner när klinik är vald
- [ ] "Exit SA Mode" knapp för att återgå till SA view

**UI Mockup:**
```
┌────────────────────────────────────────┐
│ Flow | 👤 Gilbert (SA)                 │
│                                        │
│ [🔧 SA Mode ▼] | Clinic: [Dropdown ▼] │
│                                        │
│ SA Mode:                               │
│  ✓ Superadmin View                     │
│  ○ Clinic User View (requires clinic)  │
│                                        │
│ Clinic Selector (när i User View):     │
│  ○ None (SA-only view)                 │
│  ✓ ArchClinic                          │
│  ○ MockClinic A                        │
│  ○ MockClinic B                        │
└────────────────────────────────────────┘
```

**Filer att skapa/uppdatera:**
```
/context/ClinicContext.tsx
/components/superadmin/clinic-selector.tsx
/components/superadmin/viewing-banner.tsx
/components/layout/header.tsx (uppdatera med clinic selector för SA)
```

---

### 1.3 Role Switch - Fungerar inte
**Problem:** När SA växlar roll i menyn händer ingenting

**Åtgärd:**
- [ ] Implementera role context med state management (Zustand eller React Context)
- [ ] Role switch ska:
  - Uppdatera UI permissions dynamiskt
  - Re-route till korrekt dashboard (/superadmin vs /dashboard)
  - Uppdatera sidebar menu items baserat på role
  - Persist role selection i localStorage

**Implementation:**
```typescript
// /lib/role-context.tsx
export const RoleContext = createContext({
  currentRole: 'SUPER_ADMIN',
  selectedClinic: null,
  isSuperadminMode: true,
  switchRole: (role: string) => {},
  selectClinic: (clinicId: string) => {},
  exitSuperadminMode: () => {}
});
```

---

### 1.4 Ta bort GoCardless routes
**Problem:** `/superadmin/gocardless` är den ENDA vägen till SA dashboard just nu

**Åtgärd:**
- [ ] Ta bort `/app/superadmin/gocardless/page.tsx`
- [ ] Skapa `/app/superadmin/billing/page.tsx` istället
- [ ] Integrera Plaid-status (ersätt GoCardless med Plaid)
- [ ] Uppdatera alla länkar som pekar på gocardless

**Filer att ta bort:**
```
/app/superadmin/gocardless/page.tsx
```

**Filer att skapa:**
```
/app/superadmin/billing/page.tsx
/components/superadmin/plaid-status.tsx
```

---

### 1.5 Onboarding upstream error
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
# Kolla efter upstream connection errors i deployment logs
```

---

### 1.6 Ta bort "Landningssida" från menyn för inloggade användare
**Problem:** Inloggade användare ser "Landningssida" i menyn som leder till onboarding → simulator

**Åtgärd:**
- [ ] Hitta sidebar/navigation component
- [ ] Conditional rendering: visa INTE "Landningssida" för inloggade clinic users
- [ ] För SA: "Landningssida" kan länka till marketing preview (goto.klinikflow.app)
- [ ] Intäktssimulator ska nås via huvudmenyn direkt, EJ via onboarding

**Filer att uppdatera:**
```
/components/layout/sidebar.tsx (eller motsvarande)
/components/layout/navigation.tsx
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

### 3.1 Background från prompt
**Problem:** "billing" skapar förvirring - betyder fakturering i SaaS, inte loyalty

**Rekommendation:** Byt till "Customer Engagement Hub" eller "Growth Suite"

**Rationale:**
- "Billing" i SaaS = betalningshantering och fakturering
- Loyalty/SMS/Campaigns passar bättre under "Engagement" eller "Retention"
- Branschstandard för fintech/SaaS customer engagement platforms

---

### 3.2 Routing-ändringar
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

**OBS:** Detta påverkar MÅNGA filer - behöver systematisk refactoring!

---

### 3.3 UI-terminologi
**Åtgärd:**
- [ ] Uppdatera modulnamn i navigation: "Customer Engagement Hub"
- [ ] Svenska översättning: "Kundengagemang" eller "Tillväxt & Retention"
- [ ] Undermeny:
  - Loyalty Programs
  - Campaigns
  - SMS & Messaging
  - Analytics

**Filer att uppdatera:**
```
/components/layout/sidebar.tsx
/components/layout/navigation.tsx
/app/engagement/layout.tsx (header/title)
```

---

### 3.4 Database & Type updates
**Åtgärd:**
- [ ] Sök igenom alla TypeScript-filer för "billing" som INTE refererar till faktiska fakturor
- [ ] Uppdatera interfaces, types, function names
- [ ] Kontrollera att ÄKTA billing (Invoice, Payment, Subscription) INTE påverkas

**Script för att hitta filer:**
```bash
# Hitta alla references till "billing" som INTE är fakturering
cd /home/ubuntu/flow/nextjs_space
grep -r "billing" app/ lib/ components/ | grep -v "Invoice" | grep -v "Payment" | grep -v "Subscription"
```

---

### 3.5 Alternativa namn (från prompt)
**Om "Engagement" inte fungerar, andra förslag:**

**Option A: Engagement-fokuserad** (mest rekommenderad)
```
Modulnamn: "Customer Engagement Hub"
Routes: /app/engagement/*
Svenska: "Kundengagemang"
```

**Option B: Growth-fokuserad**
```
Modulnamn: "Growth & Retention Suite"
Routes: /app/growth/*
Svenska: "Tillväxt & Retention"
```

**Option C: Loyalty-fokuserad** (mest konservativt)
```
Modulnamn: "Loyalty & Campaigns Platform"
Routes: /app/loyalty/*
Svenska: "Lojalitet & Kampanjer"
```

---

## 🟢 PRIORITET 4: Nice-to-have förbättringar

### 4.1 Visningsläge / Display preferences
**Åtgärd:**
- [ ] Implementera dark/light mode toggle
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

**VECKA 1: Kritisk säkerhet & SA funktionalitet**
- [ ] 1.1 - Skapa Superadmin Dashboard
- [ ] 1.2 - Implementera Clinic Selector
- [ ] 1.3 - Fixa Role Switch
- [ ] 1.4 - Ta bort GoCardless, skapa Billing page
- [ ] 1.6 - Ta bort "Landningssida" från meny

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

---

## 💬 Frågor till användaren

1. **Payatt terminologi:** Vill du gå vidare med "Engagement Hub" eller föredrar du "Growth Suite" eller "Loyalty Platform"?
2. **SA clinic association:** Ska Gilbert (SA) vara kopplad till ArchClinic eller ha egen org ("KlinikFlow Admin")?
3. **Onboarding flow:** Ska onboarding vara en one-time setup eller kunna nås igen senare?

---

**Dokumenterat av:** DeepAgent  
**Session:** 2025-10-18 (Kväll)  
**Nästa session:** Se prioriteringar ovan och börja med VECKA 1 tasks
