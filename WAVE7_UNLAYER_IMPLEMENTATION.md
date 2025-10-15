
# Wave 7: Unlayer Email Editor & License Management

## Implementation Summary
**Date:** 2025-10-15  
**Status:** ✅ Complete and Tested

## Overview
Implementerade Unlayer Free email editor för alla användare och ett komplett licenshanteringssystem för SuperAdmin för att hantera betalda Enterprise-licenser.

---

## 1. Database Schema Updates

### New Models

#### UnlayerLicense
```prisma
model UnlayerLicense {
  id              String                 @id @default(cuid())
  clinicId        String                 @unique
  clinic          Clinic                 @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  
  plan            UnlayerPlan            @default(FREE)
  status          UnlayerLicenseStatus   @default(ACTIVE)
  apiKey          String?
  projectId       String?
  
  pricePerMonth   Decimal                @default(0) @db.Decimal(10, 2)
  
  activatedAt     DateTime               @default(now())
  expiresAt       DateTime?
  lastSyncedAt    DateTime?
  
  emailsSent      Int                    @default(0)
  emailsLimit     Int?
  
  metadata        Json?
  
  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt
  
  @@index([clinicId])
  @@index([status])
  @@index([plan])
  @@index([expiresAt])
}
```

### New Enums
```prisma
enum UnlayerPlan {
  FREE        // Free plan (no API key)
  LAUNCH      // Paid Launch plan
  SCALE       // Paid Scale plan
  OPTIMIZE    // Paid Optimize plan
}

enum UnlayerLicenseStatus {
  ACTIVE      // License is active
  EXPIRED     // License has expired
  SUSPENDED   // License is suspended
  CANCELLED   // License cancelled
  PENDING     // License pending activation
}
```

---

## 2. API Endpoints Created

### License Management (SuperAdmin Only)

#### GET /api/unlayer-licenses
- **Description:** Hämta alla Unlayer-licenser med klinikinfo
- **Auth:** SUPER_ADMIN only
- **Response:** Array av licenser med clinic info

#### POST /api/unlayer-licenses
- **Description:** Aktivera ny Unlayer Pro-licens för en klinik
- **Auth:** SUPER_ADMIN only
- **Body:**
```json
{
  "clinicId": "string",
  "plan": "LAUNCH|SCALE|OPTIMIZE",
  "apiKey": "string",
  "projectId": "string (optional)",
  "pricePerMonth": number,
  "expiresAt": "ISO date (optional)"
}
```

#### PUT /api/unlayer-licenses/[id]
- **Description:** Uppdatera befintlig licens (plan, status, API key, etc.)
- **Auth:** SUPER_ADMIN only

#### DELETE /api/unlayer-licenses/[id]
- **Description:** Avsluta och ta bort licens
- **Auth:** SUPER_ADMIN only

#### GET /api/unlayer-licenses/for-clinic
- **Description:** Hämta aktuell kliniks licens
- **Auth:** Autentiserad användare
- **Response:** License info eller FREE plan om ingen licens finns

### Support Routes

#### GET /api/superadmin/clinics
- **Description:** Hämta lista över alla kliniker (för licensvalet)
- **Auth:** SUPER_ADMIN only

---

## 3. Frontend Components

### UnlayerEmailEditor Component
**Location:** `/components/unlayer-email-editor.tsx`

**Features:**
- ✅ Free mode för alla tier (BASIC, PROFESSIONAL)
- ✅ Pro mode för ENTERPRISE med API key
- ✅ Badge visar aktivt plan (FREE/LAUNCH/SCALE/OPTIMIZE)
- ✅ "Upgrade to Pro" knapp för Free users
- ✅ Export HTML och design JSON
- ✅ Load initial design
- ✅ SSR-safe (dynamisk import)

**Props:**
```typescript
interface UnlayerEmailEditorProps {
  onReady?: () => void;
  onDesignLoad?: (data: any) => void;
  initialDesign?: any;
  plan?: string;
  apiKey?: string | null;
}
```

### License Dashboard (SuperAdmin)
**Location:** `/app/superadmin/licenses/page.tsx`

**Features:**
- ✅ Översikt av alla licenser
- ✅ Statistik (Totalt, Aktiva, Utgångna, MRR)
- ✅ Färgkodade kort baserat på status:
  - Grön = ACTIVE
  - Röd = EXPIRED
  - Blå = PENDING
  - Gul = SUSPENDED
- ✅ Aktivera ny licens (modal)
- ✅ Filtrera endast ENTERPRISE-kliniker
- ✅ Uppdatera licensstatus (Pausa/Aktivera)
- ✅ Avsluta licens med bekräftelse

**Activation Modal Fields:**
- Klinik (dropdown, endast ENTERPRISE)
- Unlayer Plan (LAUNCH/SCALE/OPTIMIZE)
- API Key (från Unlayer Dashboard)
- Project ID (valfritt)
- Pris per månad (SEK)
- Utgångsdatum (valfritt)

---

## 4. Newsletter Module Updates

**Location:** `/app/dashboard/newsletters/page.tsx`

**Changes:**
- ✅ Ersatt `<Textarea>` med `<UnlayerEmailEditor>`
- ✅ Dynamisk laddning av editor (SSR-safe)
- ✅ Fetch license info vid mount
- ✅ Visa rätt plan-badge i editorn
- ✅ Export HTML från Unlayer innan save
- ✅ Uppdaterad validering (emailHtml istället för formData.content)
- ✅ Reset form rensar även emailHtml och emailDesign

**User Experience:**
- BASIC/PROFESSIONAL: Ser "Unlayer Free Mode" badge
- ENTERPRISE: Ser "✓ Unlayer Pro Active (PLAN)" badge i grönt
- Alla: Kan använda drag-and-drop email builder

---

## 5. SuperAdmin Navigation Update

**Location:** `/app/superadmin/page.tsx`

**Addition:**
- ✅ "Unlayer Licenser" knapp i header (bredvid "Lägg till klinik")
- ✅ Länk till `/superadmin/licenses`
- ✅ Key icon för visuell identifiering

---

## 6. Package Dependencies

**Added:**
```json
{
  "react-email-editor": "^1.7.11"
}
```

**Script Loading:**
- Unlayer SDK laddas dynamiskt från CDN: `https://editor.unlayer.com/embed.js`
- Ingen licensing-nyckel krävs för FREE mode
- API key används endast för ENTERPRISE med paid plans

---

## 7. Security & Access Control

### Tier-Based Access
- **FREE (BASIC/PROFESSIONAL):** 
  - Unlayer Free mode
  - Grundläggande mallar
  - Standard funktioner
  
- **ENTERPRISE:**
  - Unlayer Free mode (default)
  - Unlayer Pro (Launch/Scale/Optimize) vid aktiverad licens
  - Premium mallar och avancerade funktioner
  - Dedikerad API key per klinik

### SuperAdmin Controls
- ✅ Endast SUPER_ADMIN kan:
  - Se alla licenser
  - Aktivera nya licenser
  - Uppdatera licensstatus
  - Avsluta licenser
  - Se MRR och användningsdata

---

## 8. Cost Management

### Free Tier
- **Kostnad:** 0 kr (ingen API key)
- **Inkluderat i:** BASIC (499 kr/mån) & PROFESSIONAL (1499 kr/mån)
- **Restriktion:** Basic templates only

### Paid Licenses (Enterprise)
- **LAUNCH:** Pris enligt avtal med Unlayer
- **SCALE:** Pris enligt avtal med Unlayer
- **OPTIMIZE:** Pris enligt avtal med Unlayer
- **Fakturering:** Hanteras av Flow, synkas med Unlayer Dashboard API
- **Usage Tracking:** emailsSent och emailsLimit i databasen

---

## 9. Deployment & Migration

### Database Migration
```bash
cd /home/ubuntu/flow/nextjs_space
yarn prisma db push
```

### Environment Variables
**Optional (for paid plans only):**
```env
# Unlayer configurations
UNLAYER_PROJECT_ID=your_project_id  # (Optional)
```

**Note:** API keys lagras per-klinik i databasen, inte i .env

---

## 10. Testing

### Manual Test Checklist
- [x] Newsletter skapas med Unlayer editor
- [x] FREE mode visas för BASIC/PROFESSIONAL users
- [x] License Dashboard laddas för SuperAdmin
- [x] Aktivera ny licens (modal)
- [x] Uppdatera licensstatus
- [x] Avsluta licens
- [x] Licenses API returnerar korrekt data
- [x] for-clinic endpoint returnerar FREE som default

### Build Tests
- [x] TypeScript compilation: ✅ No errors
- [x] Next.js build: ✅ Success
- [x] Production build: ✅ Success
- [x] Dev server: ✅ Running

---

## 11. Known Limitations & Future Enhancements

### Current Limitations
1. Unlayer API key måste anges manuellt i SuperAdmin
2. Ingen automatisk sync med Unlayer Dashboard API (scheduled för framtida release)
3. Usage tracking (emailsSent) kräver manuell inkrementering i send-funktionen

### Future Enhancements
- [ ] Automatisk Unlayer API integration för licensaktivering
- [ ] Real-time usage tracking och notifieringar
- [ ] Auto-renewal för licenser
- [ ] A/B testing för newsletter templates
- [ ] Analytics dashboard för email performance

---

## 12. Documentation & Resources

### Internal Links
- License API Docs: `/api/unlayer-licenses/*`
- SuperAdmin Dashboard: `/superadmin/licenses`
- Newsletter Editor: `/dashboard/newsletters`

### External Resources
- [Unlayer Documentation](https://docs.unlayer.com/)
- [Unlayer Pricing Plans](https://unlayer.com/pricing)
- [Unlayer Dashboard](https://dashboard.unlayer.com/)

---

## Summary

**Wave 7 deliverables:**
✅ Unlayer Free integration för alla users  
✅ License Management Module (SuperAdmin)  
✅ API endpoints för licenshantering  
✅ Tier-based differentiation (FREE vs PRO)  
✅ Database schema för licenses  
✅ UI komponenter (Editor + Dashboard)  
✅ Complete testing och dokumentation  

**Next Wave:** TBD (Fortsättning med Corex AI-assistent eller annan prioriterad funktion)

---

**Slutsats:** Wave 7 är komplett och redo för produktion. Alla Free-användare har nu tillgång till en professionell email builder, och SuperAdmin kan enkelt hantera betalda Enterprise-licenser.

