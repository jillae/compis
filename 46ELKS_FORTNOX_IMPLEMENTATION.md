# 46elks Subaccounts + Fortnox Integration Implementation

**Status:** Implementation Starting  
**Datum:** 2025-10-21

---

## 📋 OVERVIEW

### Två huvuduppgifter:
1. **46elks Subaccounts** - Subkonto per klinik för spårbarhet
2. **Fortnox Integration** - Bank transactions + fakturering

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: 46elks Subaccounts (2-3 timmar)

**1.1 Database Schema**
```prisma
model Clinic {
  elksSubaccountId     String?
  elksSubaccountKey    String?  // Encrypted credentials
  elksSubaccountSecret String?  // Encrypted credentials
}
```

**1.2 API Endpoints**
- `POST /api/46elks/subaccounts/create` - Skapa subaccount vid onboarding
- `GET /api/46elks/subaccounts` - Lista alla subaccounts (SuperAdmin)
- `PUT /api/46elks/subaccounts/[id]` - Uppdatera subaccount settings

**1.3 Service Layer**
```typescript
// lib/46elks/subaccount-service.ts
export async function createSubaccount(clinicId: string, clinicName: string)
export async function getSubaccounts()
export async function updateSubaccount(subaccountId: string, data: any)
```

**1.4 Integration i Onboarding**
- Vid signup av ny klinik → automatisk subaccount creation
- Spara subaccount credentials encrypted i database
- Använd subaccount credentials i alla SMS/Voice API calls

---

### Phase 2: Fortnox Integration (4-5 timmar)

**2.1 Database Schema**
```prisma
model Clinic {
  fortnoxClientId      String?
  fortnoxClientSecret  String?  // Encrypted
  fortnoxAccessToken   String?  // Encrypted
  fortnoxRefreshToken  String?  // Encrypted
  fortnoxTokenExpiry   DateTime?
  fortnoxEnabled       Boolean @default(false)
}
```

**2.2 OAuth2 Flow**
- `GET /api/fortnox/auth` - Initiate OAuth
- `GET /api/fortnox/callback` - Handle OAuth callback
- `POST /api/fortnox/refresh-token` - Refresh access token

**2.3 Bank Transactions API**
- `GET /api/fortnox/bank-transactions` - Fetch bank transactions
- Endpoint: `https://api.fortnox.se/3/bank-transactions`
- Fallback to Plaid if Fortnox doesn't support

**2.4 SuperAdmin UI**
```
/superadmin/fortnox-config
- Client ID: 3DCiYeshpNAi
- Client Secret: 3m8Mg7R98A
- Redirect URI input
- Scopes selector
- Test Connection button
```

---

## ✅ DELIVERABLES

### 46elks Subaccounts:
- [ ] Database migration med subaccount fields
- [ ] Service layer för subaccount management
- [ ] API endpoints (create, list, update)
- [ ] Auto-creation vid onboarding
- [ ] SuperAdmin UI för att lista subaccounts
- [ ] Documentation i README

### Fortnox Integration:
- [ ] Database migration med Fortnox fields
- [ ] OAuth2 flow implementation
- [ ] Bank transactions API integration
- [ ] SuperAdmin configuration UI
- [ ] Test med Arch Clinic credentials
- [ ] Fallback logic för Plaid
- [ ] Documentation i README

---

## 🚀 NEXT STEPS

1. Implementera 46elks subaccounts först (enklare)
2. Testa med Arch Clinic
3. Implementera Fortnox OAuth
4. Testa bank transactions endpoint
5. Deploy och verifiera

**Estimerad tid:** 6-8 timmar total

