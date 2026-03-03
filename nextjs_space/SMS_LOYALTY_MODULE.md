# SMS Loyalty Module + Staff Push Notifications

Byggd: 2026-03-03  
Projekt: KlinikFlow (Next.js 14 + Prisma 6.7 + PostgreSQL)

---

## Vad som byggdes

### 1. Databas – Ny Prisma-modell

**`StaffNotification`** tillagd i `prisma/schema.prisma`:

```
model StaffNotification {
  id        String   @id @default(cuid())
  clinicId  String
  staffId   String?  // null = alla i kliniken
  type      String   // campaign_reminder | loyalty_milestone | customer_alert | schedule_reminder
  title     String
  message   String   @db.Text
  actionUrl String?
  priority  String   @default("medium")
  isRead    Boolean  @default(false)
  readAt    DateTime?
  createdAt DateTime @default(now())
  expiresAt DateTime?
  clinic    Clinic   @relation(...)
  @@map("staff_notifications")
}
```

**Relation** tillagd på `Clinic`-modellen:
```
staffNotifications  StaffNotification[]
```

> **OBS:** Kör `npx prisma migrate dev --name add_staff_notifications` för att applicera migrationen.

---

### 2. lib/loyalty/sms-automation.ts

`LoyaltySMSAutomation` – skickar lojalitets-SMS via existerande `smsService`:

| Metod | Trigger | SMS-kategori |
|---|---|---|
| `sendWelcome(cardId)` | Kund registrerar lojalitetskort | `loyalty` |
| `sendStampConfirmation(cardId, newStamps, total)` | Stämpel läggs till via scan | `loyalty` |
| `sendLevelUp(cardId, oldLevel, newLevel)` | Tier-uppgradering (bronze→silver→gold) | `loyalty` |
| `sendRewardAvailable(cardId, rewardName)` | Kund har nog stämplar för belöning | `loyalty` |
| `sendReminder(cardId)` | Kund har inte besökt på länge | `marketing` |
| `sendBirthday(cardId)` | Kunden fyller år (kräver dateOfBirth) | `loyalty` |

**Svenska meddelandemallar** – läser `welcomeSms`/`reminderSms` från LoyaltyProgram om de finns, annars används standardtexter.

**Exporteras som:** `loyaltySMSAutomation` (singleton)

---

### 3. lib/notifications/staff-notifications.ts

`StaffNotificationService` – CRUD för in-dashboard-notiser:

| Metod | Beskrivning |
|---|---|
| `notify(staffId, clinicId, input)` | Notis till specifik personalmedlem |
| `notifyClinic(clinicId, input)` | Notis till all personal i kliniken |
| `getUnread(staffId, clinicId, limit?)` | Hämta olästa notiser |
| `getAll(staffId, clinicId, limit?)` | Hämta alla notiser |
| `getUnreadCount(staffId, clinicId)` | Antal olästa (för badge) |
| `markRead(notificationId)` | Markera en notis som läst |
| `markAllRead(staffId, clinicId)` | Markera alla som lästa |
| `pruneExpired()` | Ta bort utgångna notiser (cron) |

**Exporteras som:** `staffNotificationService` (singleton)

---

### 4. lib/notifications/campaign-reminders.ts

Kampanjpåminnelselogik:

| Funktion | Beskrivning |
|---|---|
| `checkAndNotifyCampaignReminders()` | Söker kampanjer schemalagda inom 24h, skapar StaffNotifications. Körs av cron kl 07:00. |
| `notifyCampaignReady(campaignId)` | Manuell utlösning för en specifik kampanj |
| `notifyLoyaltyMilestone(clinicId, customerName, newLevel, cardId)` | Notis när kund uppgraderar lojalitetsnivå |

---

### 5. API-endpoints

#### `GET/PUT /api/notifications`
- **GET**: Hämtar notiser för inloggad personal. `?unread=true` för enbart olästa. `?limit=N`.
- **PUT**: `{ notificationId }` markerar enskild som läst. `{ markAll: true }` markerar alla.

#### `GET /api/notifications/unread-count`
- Returnerar `{ count: number }` – pollas var 30:e sekund från `NotificationBell`.

#### `POST /api/loyalty/sms/test`
- Skickar ett test-SMS utan consent-check eller rate limit.
- Body: `{ programId, type, phone }` där `type` är `welcome | stamp | level_up | reward | reminder | birthday`.

#### `GET/PUT /api/loyalty/automation`
- **GET** `?programId=...`: Hämtar SMS-automationsinställningar för ett program.
- **PUT**: `{ programId, settings: { sendWelcomeSms, welcomeSms, reminderSms } }` – sparar inställningar.

---

### 6. components/dashboard/notification-bell.tsx

`NotificationBell` – React-komponent för dashboard-header:

- Klockikon med rött badge (antal olästa)
- Pollar `/api/notifications/unread-count` var **30 sekunder**
- Popover-dropdown med ScrollArea (max 420px)
- Sektioner: **Olästa** / **Tidigare**
- Ikon per typ: 📣 kampanj, ⭐ lojalitet, ⚠️ varning, 📅 schema
- Prioritetsfärger: röd (high), gul (medium), grå (low)
- "Markera alla som lästa" / X-knapp per notis
- Klick navigerar till `actionUrl` via `router.push()`
- Touch-first: `min-h-[44px]` på alla interaktiva element
- Mörkt tema: `bg-zinc-900`, `border-zinc-800`

**Användning i header/hamburgermeny:**
```tsx
import { NotificationBell } from '@/components/dashboard/notification-bell';

// I din header:
<div className="flex items-center gap-2">
  <NotificationBell />
  <HamburgerMenu ... />
</div>
```

---

### 7. Scan-endpoint (/api/loyalty/scan) – uppdaterad

Lagt till fire-and-forget SMS-block efter lyckad skanning:

```
// 7. Skicka SMS-notiser asynkront
void (async () => {
  await loyaltySMSAutomation.sendStampConfirmation(...)
  if (tierUpgraded) {
    await loyaltySMSAutomation.sendLevelUp(...)
    await notifyLoyaltyMilestone(...)  // Staff notis
  }
  if (availableRewards.length > 0) {
    await loyaltySMSAutomation.sendRewardAvailable(...)
  }
})()
```

SMS-fel loggas men bryter **inte** HTTP-svaret – kunden får alltid svar oavsett SMS-status.

---

## Att göra (ej inkluderat)

1. **Prisma migration**: `npx prisma migrate dev --name add_staff_notifications`
2. **Cron-jobb** för kampanjpåminnelser: Anropa `checkAndNotifyCampaignReminders()` kl 07:00 dagligen
3. **Cron-jobb** för lojalitetspåminnelser: Iterera kort med `lastEarnedAt` > X dagar → `loyaltySMSAutomation.sendReminder()`
4. **Cron-jobb** för födelsdagar: Kontrollera `dateOfBirth` matchar dagens datum → `loyaltySMSAutomation.sendBirthday()`
5. **Välkomst-SMS** vid kortregistrering: Anropa `loyaltySMSAutomation.sendWelcome(card.id)` i `/api/loyalty/cards` POST-handler
6. **NotificationBell** monteras i layout/header-komponent

---

## Filstruktur

```
lib/
  loyalty/
    sms-automation.ts          ← NY
  notifications/
    staff-notifications.ts     ← NY
    campaign-reminders.ts      ← NY
  
app/api/
  notifications/
    route.ts                   ← NY (GET/PUT)
    unread-count/
      route.ts                 ← NY (GET)
  loyalty/
    sms/
      test/
        route.ts               ← NY (POST)
    automation/
      route.ts                 ← NY (GET/PUT)
    scan/
      route.ts                 ← UPPDATERAD (SMS-triggers)

components/dashboard/
  notification-bell.tsx        ← NY

prisma/
  schema.prisma                ← UPPDATERAD (StaffNotification + Clinic relation)
```
