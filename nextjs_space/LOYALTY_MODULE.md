# KlinikFlow Lojalitetsmodul

Byggt 2026-03-03. Inspirerat av RiseRank Wallet-baserade lojalitetssystem.

---

## Arkitekturöversikt

Lojalitetsmodulen är ett komplett wallet-baserat lojalitetssystem integrerat i KlinikFlow. Det stöder stämpelkort, poängkort och hybridprogram med QR-kods-skanning, tier-system och belöningsinlösen.

---

## Prisma-schema-ändringar

### Tillagda modeller

**`WalletPass`** (ny model `wallet_passes`):
```prisma
model WalletPass {
  id            String      @id @default(cuid())
  cardId        String
  card          LoyaltyCard @relation(fields: [cardId], references: [id], onDelete: Cascade)
  passType      String      // "apple" | "google"
  serialNumber  String      @unique
  qrCode        String      @unique
  passUrl       String?
  pushToken     String?
  isActive      Boolean     @default(true)
  lastUpdatedAt DateTime    @default(now())
  createdAt     DateTime    @default(now())
  @@map("wallet_passes")
}
```

### Uppdaterade modeller

**`LoyaltyCard`** – tillagd relation:
```prisma
walletPasses  WalletPass[]
```

---

## API-endpoints

Alla autentiserade endpoints använder `getAuthSession()` + `getClinicFilter()` för multi-tenant-säkerhet.

| Metod  | URL                              | Beskrivning                                      | Auth |
|--------|----------------------------------|--------------------------------------------------|------|
| GET    | `/api/loyalty/programs`          | Lista alla lojalitetsprogram för kliniken         | Ja   |
| POST   | `/api/loyalty/programs`          | Skapa nytt program                               | Ja   |
| GET    | `/api/loyalty/programs/[id]`     | Hämta enskilt program med kort och belöningar     | Ja   |
| PUT    | `/api/loyalty/programs/[id]`     | Uppdatera program                                | Ja   |
| DELETE | `/api/loyalty/programs/[id]`     | Ta bort program                                  | Ja   |
| GET    | `/api/loyalty/cards`             | Lista kort (filter: programId, search, level)     | Ja   |
| POST   | `/api/loyalty/cards`             | Skapa nytt kort för kund                         | Ja   |
| GET    | `/api/loyalty/cards/[id]`        | Hämta kort med transaktionshistorik              | Ja   |
| POST   | `/api/loyalty/scan`              | Skanna QR-kod, lägg till stämpel/poäng           | Ja   |
| POST   | `/api/loyalty/redeem`            | Lös in belöning                                  | Ja   |
| POST   | `/api/loyalty/wallet`            | Generera wallet-pass URL                         | Ja   |
| GET    | `/api/loyalty/stats`             | Programstatistik och aktivitetsflöde             | Ja   |
| GET    | `/api/loyalty/public`            | Hämta kortinfo via QR-kod (publik)               | Nej  |
| POST   | `/api/loyalty/public`            | Registrera kund för program (publik)             | Nej  |

### POST `/api/loyalty/scan` – Skanning-flöde

```typescript
// Request
{ qrCode: "KF-XXXXXXXXXXXXXXXX", note?: "Besök 2026-03-03" }

// Response
{
  success: true,
  card: { stamps, points, level, customer, program },
  stampsAdded: 1,
  pointsAdded: 0,
  tierUpgraded: false,
  newLevel: "bronze",
  availableRewards: [...],
  message: "+1 stämpel tillagd"
}
```

### POST `/api/loyalty/redeem` – Inlösning-flöde

```typescript
// Request
{ cardId: "...", rewardId: "..." }

// Response
{
  success: true,
  redemption: { id, reward, valueSEK, verificationCode, status },
  verificationCode: "A3F9",
  message: "Belöning \"Gratis behandling\" inlöst"
}
```

---

## Dashboard-sidor

### `/dashboard/loyalty` — Lojalitetsöversikt
- KPI-kort: aktiva kort, stämplar idag, inlösningar/mån, program
- Lista över aktiva program med status och medlemsantal
- Nivåfördelning (brons/silver/guld)
- Senaste aktivitetsflöde
- Snabbåtgärder: skanna, se medlemmar, skapa program

### `/dashboard/loyalty/programs/new` — Skapa program
- Välj programtyp: stämpelkort, poängkort, hybrid
- Grundinfo: namn, beskrivning, kod
- Intjäningsregler: stämplar/poäng per besök
- Belöningar: konfigurera vad kunder kan lösa in
- Kortdesign: välj färg med förhandsgranskning i realtid
- Spara som utkast eller aktivera direkt

### `/dashboard/loyalty/scan` — QR-skanner (touch-first)
- Stor kameraplatshållare (kameraskanning redo att integreras)
- Manuell QR-kodinmatning med font-mono styling
- Stor "Lägg till stämpel"-knapp (52px höjd)
- Resultatvy: kundinfo, stämplar/poäng, tier-uppgradering
- Tillgängliga belöningar visas direkt efter skanning
- Lista med senaste skanningar för sessionen

### `/dashboard/loyalty/members` — Medlemslista
- Sökfält: namn, e-post, telefon
- Filter: program, nivå (brons/silver/guld/platina)
- Mobilvy: expanderbara kort
- Desktopvy: tabell med alla fält
- QR-koder visas inline
- Paginering (50 per sida)

---

## Publik kundsida

### `/loyalty/[code]` — Kundens wallet-sida (ingen auth)

**Tre lägen:**

1. **Kortvy** (code börjar med `KF-`): Visar kundkort med stämplar, nivå, QR-kod
2. **Registrering** (programkod): Registreringsformulär med e-post/telefon
3. **Bekräftelse**: Visar skapad QR-kod och kortstatus

Kunden kan bokmärka URL:en och visa den vid nästa besök.

---

## Navigation

Ny sektion "Lojalitet" i hamburger-menyn (`hamburger-menu.tsx`):
- Översikt → `/dashboard/loyalty`
- Skanna QR → `/dashboard/loyalty/scan`
- Medlemmar → `/dashboard/loyalty/members`
- Program → `/dashboard/loyalty/programs/new`

Importerade ikoner: `Star`, `QrCode`, `LayoutDashboard` (från lucide-react)

---

## Design-principer

- **Dark theme**: `bg-zinc-950` (sida), `bg-zinc-900` (kort), `bg-zinc-800` (input)
- **Touch-first**: Alla knappar är minst 44–52px höga
- **Färger**: Emerald för primära åtgärder, Purple för belöningar, Orange/Yellow/Cyan för nivåer
- **Responsiv**: Mobilt-kort-layout, desktop-tabellayout för memberlist
- **Svenska**: Allt UI är på svenska

---

## Programtyper och earn-regler

```typescript
// Stämpelkort
earnRule = { type: "stamp", value: 1 }

// Poängkort  
earnRule = { type: "points", value: 10 }

// Hybrid
earnRule = { type: "hybrid", stamps: 1, points: 5 }
```

### Tier-regler (exempel)
```json
{
  "bronze": 0,
  "silver": 50,
  "gold": 100,
  "platinum": 200
}
```

---

## Framtida utbyggnad

1. **Kameraskanning**: Integrera `react-qr-reader` eller Zxing i `/dashboard/loyalty/scan/page.tsx` (platshållare är redan på plats)
2. **Apple Wallet `.pkpass`**: Kräver Apple Developer-certifikat. Lägg till i `/api/loyalty/wallet/route.ts`
3. **Google Wallet JWT**: Lägg till i `/api/loyalty/wallet/route.ts` med Google Wallet API
4. **Push-notiser**: `pushToken` fält finns på `WalletPass` – integrera med FCM
5. **Kampanjintegration**: Koppla lojalitetstransaktioner till kampanjer
6. **Utgångsdatum för stämplar**: `stampsExpireDays` stöds i programkonfigurationen

---

## Filer skapade

### API
- `app/api/loyalty/programs/route.ts`
- `app/api/loyalty/programs/[id]/route.ts`
- `app/api/loyalty/cards/route.ts`
- `app/api/loyalty/cards/[id]/route.ts`
- `app/api/loyalty/scan/route.ts`
- `app/api/loyalty/redeem/route.ts`
- `app/api/loyalty/wallet/route.ts`
- `app/api/loyalty/stats/route.ts`
- `app/api/loyalty/public/route.ts` *(extra: publik API)*

### Dashboard-sidor
- `app/dashboard/loyalty/page.tsx`
- `app/dashboard/loyalty/programs/new/page.tsx`
- `app/dashboard/loyalty/scan/page.tsx`
- `app/dashboard/loyalty/members/page.tsx`

### Publik kundsida
- `app/loyalty/[code]/page.tsx`

### Modifierade filer
- `prisma/schema.prisma` — WalletPass model + LoyaltyCard relation
- `components/dashboard/hamburger-menu.tsx` — Lojalitet-sektion
