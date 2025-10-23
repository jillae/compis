
# Bokadirekt Sales & Revenue Implementation

## 🎯 Problem som löstes

### ❌ Tidigare (Felaktig) Implementation:
- **Intäktsberäkning baserades på `/bookings`-endpoint**
- `Customer.totalSpent` = summa av `Booking.price` för completed bookings
- **Detta var FELAKTIGT!** 

### 🚨 Varför det var fel:

#### Klippkortsproblematiken:
```
1. Kund köper klippkort för 1000 kr
   → Betalning SKER NU (idag)
   → Men ingen bokning finns än!

2. Kund använder klippkort för 10 behandlingar under 3 månader
   → 10 bokningar skapas (varje bokning = 1 stämpel)
   → Ingen betalning sker (redan betalt vid köp)
   → Booking.price = 0 eller saknas

Resultat med gamla systemet:
- Intäkt rapporteras fel tidpunkt (när stämpel används, inte vid köp)
- Klippkortsintäkt kan missas helt
- 1 försäljning = flera bokningar → dubbel- eller felräkning
```

### ✅ Ny (Korrekt) Implementation:

#### Två separata system:
1. **`/sales` (Bokadirekt Sales endpoint)** = Finansiell data
   - Faktiska transaktioner (kort, Swish, klippkort)
   - När pengar betalades
   - Vad som köptes

2. **`/bookings` (Bokadirekt Bookings endpoint)** = Kapacitetsdata
   - Tidsluckor
   - Personalanvändning
   - Beläggningsstatistik

## 📊 Databasstruktur

### Nya tabeller:

#### `Sale` (Kvitto/Transaktion)
```prisma
model Sale {
  id               String   @id
  bokadirektId     String   @unique  // Receipt number
  clinicId         String?
  customerId       String?
  
  receiptDate      DateTime // ← WHEN PAYMENT WAS MADE
  receiptType      Int      // 0=Sale, 1=Refund, etc.
  receiptNumber    String?
  
  totalAmount      Decimal  // Total inkl moms
  totalVat         Decimal  // Totalt momsbelopp
  totalDiscount    Decimal
  
  items            SaleItem[]
  payments         SalePayment[]
}
```

#### `SaleItem` (Rad på kvitto)
```prisma
model SaleItem {
  id               String   @id
  saleId           String
  
  itemId           String?  // Product/Service ID
  name             String?
  itemType         Int      // 0=Product, 1=Service, 4=Klippkort
  
  staffId          String?  // Vem som utförde
  bookingId        String?  // Kan vara null för klippkort!
  customerId       String?
  
  quantity         Int
  pricePerUnit     Decimal
  totalPrice       Decimal  // Efter rabatt, inkl moms
  vatRate          Decimal  // 25.00 för 25%
}
```

#### `SalePayment` (Betalningsmetod)
```prisma
model SalePayment {
  id           String   @id
  saleId       String
  
  paymentType  Int      // 0=Cash, 1=Card, 2=Swish, etc.
  amount       Decimal
}
```

## 🔄 Implementation

### 1. API Client (`lib/bokadirekt/client.ts`)
```typescript
// Nytt: getSales() metod
async getSales(options: SyncOptions = {}): Promise<BokadirektSaleResponse[]> {
  const { startDate, endDate } = options;
  const queryParams: Record<string, string> = {};
  
  if (startDate) queryParams.StartDate = startDate.toISOString();
  if (endDate) queryParams.EndDate = endDate.toISOString();
  
  return this.makeRequest<BokadirektSaleResponse[]>('/sales', { queryParams });
}
```

### 2. Data Mappers (`lib/bokadirekt/mappers.ts`)
```typescript
// Nya mappers:
- mapSaleHeaderToPrisma()
- mapSaleRowsToPrismaItems()
- mapSalePaymentsToPrisma()
- mapSalesResponseBatch()

// Beräknar totaler, VAT, etc.
```

### 3. Sales Sync Service (`lib/bokadirekt/sales-sync.ts`)
```typescript
export async function syncSales(options: SyncOptions = {}): Promise<SyncResult>

// Hämtar sales från Bokadirekt
// Transformerar till Prisma-format
// Upserterar Sale + SaleItems + SalePayments
```

### 4. Customer TotalSpent Recalculation
```typescript
// NY KORREKT funktion:
export async function recalculateCustomerTotalSpentFromSales(): Promise<void>

// Beräknar totalSpent från Sale-tabellen
// Endast receiptType = 0 (faktiska försäljningar, inte refunds)
```

### 5. Integration i syncAll()
```typescript
// Ordning:
1. syncCustomers()
2. syncStaff()
3. syncServices()
4. syncBookings()
5. syncSales() ← NYTTa!
6. recalculateCustomerTotalSpentFromSales() ← NYTT!
7. syncStaffAvailabilities()
```

## 📈 Användning

### Revenue Analytics - ANVÄND SALES:
```typescript
// ✅ KORREKT: Hämta intäktsdata från Sales
const revenue = await prisma.sale.aggregate({
  where: {
    clinicId: 'xxx',
    receiptType: 0, // Endast sales, inte refunds
    receiptDate: {
      gte: startDate,
      lte: endDate,
    },
  },
  _sum: {
    totalAmount: true,
  },
});

// Få detaljerad breakdown:
const salesWithItems = await prisma.sale.findMany({
  where: { clinicId: 'xxx' },
  include: {
    items: true,
    payments: true,
    customer: true,
  },
});
```

### Capacity Analytics - ANVÄND BOOKINGS:
```typescript
// ✅ KORREKT: Hämta kapacitetsdata från Bookings
const utilization = await prisma.booking.aggregate({
  where: {
    clinicId: 'xxx',
    scheduledTime: {
      gte: startDate,
      lte: endDate,
    },
  },
  _count: true,
});
```

## 🔍 Klippkort-flödet

### Scenario: Kund köper klippkort

```typescript
// 1. FÖRSÄLJNING (idag)
Sale {
  receiptDate: '2025-10-23T10:00:00Z', // ← Pengar betalas NU
  receiptType: 0, // Sale
  totalAmount: 1000.00,
  
  items: [
    SaleItem {
      itemType: 4, // Klippkort
      name: '10-klippskort Massage',
      totalPrice: 1000.00,
      bookingId: null, // ← Ingen bokning än!
      customerId: 'customer-123',
    }
  ],
  
  payments: [
    SalePayment {
      paymentType: 1, // Card
      amount: 1000.00,
    }
  ]
}

// 2. ANVÄNDNING av stämpel #1 (1 vecka senare)
Booking {
  scheduledTime: '2025-10-30T14:00:00Z',
  customerId: 'customer-123',
  price: 0, // Ingen betalning - redan betalt!
  status: 'COMPLETED',
}

// 3. SaleItem kan kopplas till Booking (optional)
SaleItem {
  bookingId: 'booking-456', // ← Länk till när stämpeln användes
  totalPrice: 1000.00, // Men priset räknas bara EN gång vid köp!
}
```

### Revenue rapportering:
```sql
-- ✅ KORREKT: 1000 kr bokförs vid KÖPTILLFÄLLET (2025-10-23)
SELECT 
  DATE(receiptDate) as date,
  SUM(totalAmount) as revenue
FROM Sale
WHERE receiptType = 0
GROUP BY DATE(receiptDate);

-- ❌ FELAKTIGT (gamla systemet): 0 kr eller ingen data
SELECT 
  DATE(scheduledTime) as date,
  SUM(price) as revenue
FROM Booking
WHERE status = 'COMPLETED'
GROUP BY DATE(scheduledTime);
```

## 🔧 Migration Guide

### För existerande kliniker:

1. **Kör initial sales sync:**
```bash
POST /api/sync
```
Detta kommer:
- Synka senaste 90 dagarna av sales
- Uppdatera Customer.totalSpent korrekt
- Bevara existerande bookings (för kapacitetsanalys)

2. **Uppdatera dashboards att använda Sales:**
```typescript
// Tidigare (fel):
const revenue = bookings.reduce((sum, b) => sum + b.price, 0);

// Nu (korrekt):
const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
```

3. **Verifiera data:**
```sql
-- Kontrollera att totalSpent är uppdaterat
SELECT 
  c.id,
  c.name,
  c.totalSpent as customer_total,
  COALESCE(SUM(s.totalAmount), 0) as sales_total
FROM Customer c
LEFT JOIN Sale s ON s.customerId = c.id AND s.receiptType = 0
GROUP BY c.id, c.name, c.totalSpent
HAVING ABS(c.totalSpent - COALESCE(SUM(s.totalAmount), 0)) > 0.01;
```

## 📋 Checklist för Frontend/Analytics

När du uppdaterar dashboards/rapporter:

- [ ] Använd `Sale` för intäktsanalys (inte `Booking`)
- [ ] Filtrera på `receiptType = 0` (exkludera refunds)
- [ ] Använd `receiptDate` för tidsserie-analys (inte `scheduledTime`)
- [ ] Använd `Booking` ENDAST för kapacitetsanalys
- [ ] Testa klippkorts-scenario: intäkt vid köp, inte vid användning
- [ ] Verifiera att `Customer.totalSpent` stämmer med summa av deras `Sale`

## 🎓 Key Concepts

### REGEL #1: Separation of Concerns
```
Sales (Financial) ≠ Bookings (Capacity)
```

### REGEL #2: Follow the Money
```
Revenue = When payment received (receiptDate)
NOT when service delivered (scheduledTime)
```

### REGEL #3: Klippkort Reality
```
1 Sale = Multiple Bookings
Payment happens ONCE at purchase
NOT at each booking
```

## 🚀 Next Steps

1. ✅ **Implementation Complete** - Sales sync is live
2. ⏭️ **Update Dashboards** - Migrate revenue widgets to use Sales
3. ⏭️ **Analytics Migration** - Update all revenue reports
4. ⏭️ **Customer Intelligence** - Use Sales for LTV, churn prediction
5. ⏭️ **Dynamic Pricing** - Base on actual Sales data, not Bookings

## 📚 Referenser

- **Bokadirekt API Docs**: https://external.api.portal.bokadirekt.se/index.html
- **Sales Endpoint**: `GET /api/v1/sales`
- **Bookings Endpoint**: `GET /api/v1/bookings` (för kapacitet endast)

---

**Författare**: DA (DeepAgent)  
**Datum**: 2025-10-23  
**Version**: 1.0  
**Status**: ✅ Implementation Complete & Deployed
