
# 🔒 RLS POLICIES - TODO INNAN PRODUCTION

**Status:** ⏸️ PAUSAD - Implementera efter första beta-kliniken  
**Prioritet:** 🔴 CRITICAL för production  
**Estimerad tid:** 1 timme  
**Datum skapad:** 2025-10-22

---

## 📋 VARFÖR RLS POLICIES?

**Row-Level Security (RLS)** är kritiskt för multi-tenant säkerhet:

- ✅ **Data Isolation:** Säkerställer att Klinik A ALDRIG kan se Klinik B:s data
- ✅ **Defense in Depth:** Extra säkerhetslager utöver application-level filtering
- ✅ **Compliance:** Krävs för GDPR och ISO 27001
- ✅ **Audit Trail:** Database-level logging av access attempts

---

## ⚠️ VARFÖR PAUSAD NU?

**Beslut:** Vänta till efter första beta-kliniken har onboarded.

**Motivering:**
1. **Onboarding Flow Testing:** RLS-policies kan blockera signup/onboarding-flows om de inte är perfekt konfigurerade
2. **Edge Cases:** Bättre att hitta edge cases INNAN vi låser ner databasen
3. **Nuvarande State:** Endast 2 users (Sanna, Gilbert), ingen riktig kunddata än
4. **Risk vs. Reward:** Låg risk nu (privat repo), hög risk för att blockera development

**Timeline:** Implementera inom 1 vecka efter första beta-kliniken är live.

---

## 🛠️ SQL IMPLEMENTATION

### Step 1: Enable RLS på alla kritiska tabeller

```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE "Clinic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EngagementProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stamp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketingCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerSegment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetaWebhookLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CorexConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Policies för varje tabell

#### Clinic Table
```sql
-- Clinic: Users can only see their own clinic
CREATE POLICY "clinic_isolation_policy" ON "Clinic"
  USING (
    id = (
      SELECT "clinicId" FROM "User" 
      WHERE id = current_setting('app.user_id')::text
    )
  );

-- SUPER_ADMIN can see all clinics
CREATE POLICY "superadmin_clinic_access" ON "Clinic"
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = current_setting('app.user_id')::text
      AND role = 'SUPER_ADMIN'
    )
  );
```

#### Customer Table
```sql
-- Customers: Only accessible to users from same clinic
CREATE POLICY "customer_isolation_policy" ON "Customer"
  USING (
    "clinicId" = (
      SELECT "clinicId" FROM "User"
      WHERE id = current_setting('app.user_id')::text
    )
  );

-- SUPER_ADMIN can see all customers
CREATE POLICY "superadmin_customer_access" ON "Customer"
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = current_setting('app.user_id')::text
      AND role = 'SUPER_ADMIN'
    )
  );
```

#### Booking Table
```sql
-- Bookings: Only accessible via customer's clinic
CREATE POLICY "booking_isolation_policy" ON "Booking"
  USING (
    EXISTS (
      SELECT 1 FROM "Customer" c
      WHERE c.id = "Booking"."customerId"
      AND c."clinicId" = (
        SELECT "clinicId" FROM "User"
        WHERE id = current_setting('app.user_id')::text
      )
    )
  );

-- SUPER_ADMIN can see all bookings
CREATE POLICY "superadmin_booking_access" ON "Booking"
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = current_setting('app.user_id')::text
      AND role = 'SUPER_ADMIN'
    )
  );
```

#### Service Table
```sql
-- Services: Only accessible to users from same clinic
CREATE POLICY "service_isolation_policy" ON "Service"
  USING (
    "clinicId" = (
      SELECT "clinicId" FROM "User"
      WHERE id = current_setting('app.user_id')::text
    )
  );

-- SUPER_ADMIN can see all services
CREATE POLICY "superadmin_service_access" ON "Service"
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = current_setting('app.user_id')::text
      AND role = 'SUPER_ADMIN'
    )
  );
```

#### Staff Table
```sql
-- Staff: Only accessible to users from same clinic
CREATE POLICY "staff_isolation_policy" ON "Staff"
  USING (
    "clinicId" = (
      SELECT "clinicId" FROM "User"
      WHERE id = current_setting('app.user_id')::text
    )
  );

-- SUPER_ADMIN can see all staff
CREATE POLICY "superadmin_staff_access" ON "Staff"
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = current_setting('app.user_id')::text
      AND role = 'SUPER_ADMIN'
    )
  );
```

### Step 3: Middleware för att sätta session variable

**File:** `/home/ubuntu/flow/nextjs_space/lib/db-session.ts`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './db';

/**
 * Sets the app.user_id session variable for RLS policies
 * MUST be called at the start of every API route that accesses multi-tenant data
 */
export async function setDatabaseSession() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    // Set session variable that RLS policies will use
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.user_id = '${session.user.id}'`
    );
  }
}
```

**Usage in API routes:**
```typescript
import { setDatabaseSession } from '@/lib/db-session';

export async function GET(req: Request) {
  // Set database session FIRST
  await setDatabaseSession();
  
  // Now all queries will be filtered by RLS policies
  const customers = await prisma.customer.findMany();
  
  return Response.json(customers);
}
```

---

## ✅ TESTING CHECKLIST

När du implementerar RLS, testa följande:

### Test 1: Basic Isolation
- [ ] Create 2 test clinics (Clinic A, Clinic B)
- [ ] Create users for each clinic
- [ ] Login as Clinic A user
- [ ] Try to fetch customers → Should only see Clinic A customers
- [ ] Login as Clinic B user
- [ ] Try to fetch customers → Should only see Clinic B customers

### Test 2: SuperAdmin Access
- [ ] Login as SUPER_ADMIN (Gilbert)
- [ ] Fetch all clinics → Should see ALL clinics
- [ ] Fetch all customers → Should see ALL customers
- [ ] Verify clinic switching works

### Test 3: API Routes
- [ ] Test `/api/customers` → Filtered correctly
- [ ] Test `/api/bookings` → Filtered correctly
- [ ] Test `/api/analytics` → Aggregated data only from own clinic
- [ ] Test `/api/superadmin/*` → Full access for superadmin

### Test 4: Onboarding Flow
- [ ] Signup new user
- [ ] Create new clinic during onboarding
- [ ] Verify user can see their own clinic
- [ ] Verify user CANNOT see other clinics

### Test 5: Edge Cases
- [ ] User with no clinicId → Should see nothing (or error gracefully)
- [ ] Invalid session token → Queries should fail
- [ ] Direct SQL injection attempts → Should be blocked by RLS

---

## 📚 RESOURCES

**PostgreSQL RLS Documentation:**
https://www.postgresql.org/docs/current/ddl-rowsecurity.html

**Supabase RLS Guide:**
https://supabase.com/docs/guides/auth/row-level-security

**Prisma + RLS:**
https://www.prisma.io/docs/orm/prisma-client/queries/raw-database-access

---

## 🚨 VARNINGAR

1. **SUPER_ADMIN Bypass:** SuperAdmin policies måste vara korrekta, annars kan de se för mycket ELLER för lite
2. **Session Variable:** `app.user_id` måste sättas i VARJE API route, annars får ingen data
3. **Performance:** RLS policies kan sakta ner queries om de inte är indexerade
4. **Migration:** När du kör migrations, disable RLS temporärt (eller kör som superuser)

---

## 📅 IMPLEMENTATION TIMELINE

**Week 0 (Before Beta):**
- ✅ Document RLS plan (denna fil)
- ✅ Create test SQL scripts
- ⏸️ PAUSE - vänta på beta-klinik

**Week 1 (After Beta Onboarding):**
- [ ] Day 1: Enable RLS på 3 kritiska tabeller (Clinic, Customer, Booking)
- [ ] Day 2: Test isolation med beta-klinik
- [ ] Day 3: Enable RLS på övriga tabeller
- [ ] Day 4: Full regression testing
- [ ] Day 5: Deploy to production

**Week 2 (Monitoring):**
- [ ] Monitor query performance
- [ ] Check for any blocked legitimate queries
- [ ] Optimize policies if needed

---

## 🎯 SUCCESS CRITERIA

RLS implementation är successful när:

1. ✅ Klinik A NEVER sees Klinik B's data (verified via tests)
2. ✅ SUPER_ADMIN can see all clinics (verified via tests)
3. ✅ Onboarding flow works without issues
4. ✅ No performance degradation (< 10% increase in query time)
5. ✅ All API routes have `setDatabaseSession()` call
6. ✅ Audit logs show correct access patterns

---

**Nästa steg:** Implementera efter första beta-kliniken är live! 🚀
