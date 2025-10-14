
# META Marketing API Integration Guide

## Översikt

Flow's META Marketing API-integration ger proaktiv optimering av annonseringskampanjer baserat på klinikens kapacitet och bokningsdata. Systemet håller automatiskt kapacitetsutnyttjandet i optimal zon (75-90%) genom intelligenta varningar och rekommendationer.

---

## Vad löser vi?

### Problem
- **Klassisk fälla**: Fullt bokad → sänker annonsbudget → plötsligt tom kalender
- **Stress och dålig kultur**: När kalendern blir tom uppstår panik
- **För sent att reagera**: När man märker problemet har skadan redan skett
- **Ineffektiv annonsering**: Fortsätter annonsera vid 95% beläggning

### Lösning
- **Prediktiva varningar**: Baserat på historisk bokningströghet (lag)
- **Lead-kvalitetsövervakning**: Inte bara ROAS, utan faktisk konvertering till bokningar
- **Proaktiva budgetrekommendationer**: Automatiska förslag baserat på kapacitet
- **Creative fatigue-detektering**: Innan prestandan sjunker

---

## Funktioner

### 1. Bokningströghet-analys
- Beräknar tiden mellan annonsexponering och faktisk bokning
- Använder korskorrelation mellan annonsdata och bokningsserier
- Typiskt lag: 7-14 dagar för skönhetskliniker

### 2. Proaktiva Varningar

#### Critical Alerts (Röd)
- **Låg annonsering + bokningströghet = tom kalender snart**
  - Triggas när: Annonsspend < 50% av normalperiod
  - Dagar till påverkan: Baserat på bokningströghet
  - Åtgärd: Öka budget OMEDELBART

#### Warning Alerts (Orange)
- **Försämrad lead-kvalitet**
  - Triggas när: Konverteringsgrad sjunker >20% vs baseline
  - Åtgärd: Granska målgrupp och kreativ
  
- **ROAS nedgång**
  - Triggas när: ROAS < 70% av historiskt snitt
  - Åtgärd: Pausa underpresterande kampanjer

#### Info Alerts (Blå)
- **Creative fatigue**
  - Triggas när: Frekvens > 3.5
  - Åtgärd: Rotera kreativa eller expandera målgrupp

### 3. Budgetoptimering
- Rekommenderad daglig budget baserat på:
  - Historisk kostnad per bokning
  - Önskat bokningsmål
  - Säsongsfaktorer
  - Aktuellt kapacitetsutnyttjande

### 4. Real-time Övervakning
- ROAS (Return on Ad Spend)
- CPL (Cost Per Lead)
- CTR (Click-Through Rate)
- Konverteringsgrad
- Frekvens och Reach
- Lead-kvalitet

---

## Setup Guide

### Steg 1: Skaffa META Marketing API Access Token

#### A. Skapa Meta Business Manager
1. Gå till [business.facebook.com](https://business.facebook.com)
2. Skapa ett Business Manager-konto om du inte har ett
3. Lägg till ditt Facebook-annonserad konto

#### B. Skapa System User (Rekommenderad för produktion)
1. Gå till Business Settings → Users → System Users
2. Klicka "Add" och skapa en ny System User
3. Ge den namnet "Flow API Integration"
4. Ge behörigheter:
   - **Ads Management** (ads_management) - För att läsa och hantera kampanjer
   - **Ads Read** (ads_read) - För att läsa insights
   - **Business Management** (business_management) - För att hantera resurser

#### C. Generera Access Token
1. Välj din System User
2. Klicka "Generate New Token"
3. Välj din App (eller skapa en ny Meta App)
4. Välj permissions:
   - `ads_read` (obligatorisk)
   - `ads_management` (valfri, för framtida automation)
5. Välj "Never expire" för System User tokens
6. Kopiera token (du ser den bara EN gång!)

#### D. Hitta ditt Ad Account ID
1. Gå till [facebook.com/adsmanager](https://facebook.com/adsmanager)
2. Öppna Account Settings (kugghjul)
3. Kopiera "Account ID" (format: `act_1234567890`)
4. **OBS**: I .env använder vi BARA siffrorna (utan `act_` prefix)

### Steg 2: Konfigurera Flow

#### Lägg till i `.env`
```env
# META Marketing API
META_ACCESS_TOKEN="EAAxxxxxxxxxxxxx..."
META_AD_ACCOUNT_ID="1234567890"  # UTAN act_ prefix

# Valfria - för Conversions API
META_PIXEL_ID="1234567890"
META_APP_ID="1234567890"
META_APP_SECRET="xxxxxxxxxxxxx"
```

#### Aktivera i klinikens inställningar
```sql
-- Kör i din databas eller via Prisma Studio
UPDATE "Clinic" 
SET 
  "metaEnabled" = true,
  "metaAccessToken" = 'DIN_TOKEN',
  "metaAdAccountId" = 'DITT_AD_ACCOUNT_ID',
  "metaTargetCPL" = 250.00,  -- Önskad Cost Per Lead i SEK
  "metaTargetROAS" = 3.00,   -- Önskad Return on Ad Spend
  "metaCapacityMin" = 75,    -- Min kapacitet innan budget ökas
  "metaCapacityMax" = 90     -- Max kapacitet innan budget sänks
WHERE id = 'din-clinic-id';
```

### Steg 3: Verifiera Integration

1. **Test API Connection**
   ```bash
   curl "https://graph.facebook.com/v18.0/act_YOUR_AD_ACCOUNT_ID/insights?access_token=YOUR_TOKEN&fields=spend,impressions"
   ```

2. **Synka kampanjdata i Flow**
   - Gå till Dashboard → Marketing
   - Klicka "Synka kampanjdata"
   - Vänta 10-30 sekunder
   - Du bör se kampanjmetrik visas

3. **Verifiera Alerts**
   - Navigera till Dashboard
   - Du bör se "META Ads Intelligence" kortet
   - Om varningar finns visas de med severity-badges

---

## API Dokumentation

### GET /api/marketing/meta/alerts

Returnerar proaktiva varningar baserat på annons- och bokningsdata.

#### Query Parameters
- `days` (optional): Antal dagar att analysera (default: 30)

#### Response Format
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "severity": "critical",
        "type": "budget",
        "title": "VARNING: Låg annonsering kommer orsaka tom kalender",
        "description": "Annonseringen har minskat med 60%. Baserat på 7 dagars tröghet kommer detta påverka bokningar om 7 dagar.",
        "recommendation": "Öka annonsbudgeten till minst 1,500 kr/dag OMEDELBART",
        "impactEstimate": 45000,
        "daysUntilImpact": 7
      }
    ],
    "bookingLag": {
      "days": 7,
      "description": "Det tar i genomsnitt 7 dagar från att någon ser din annons till att de bokar"
    },
    "budgetRecommendation": {
      "recommendedDailyBudget": 1800,
      "currentBudget": 500,
      "expectedBookings": 12,
      "confidence": 0.85
    },
    "metrics": {
      "current": {
        "totalSpend": 3500,
        "avgROAS": 2.8,
        "totalConversions": 45
      },
      "historical": {
        "totalSpend": 8750,
        "avgROAS": 3.2,
        "totalConversions": 112
      }
    }
  }
}
```

#### Error Response (Setup Required)
```json
{
  "success": false,
  "error": "META Marketing API not configured",
  "setupRequired": true,
  "setupInstructions": {
    "message": "För att aktivera META-integrationen, konfigurera följande i dina miljövariabler:",
    "required": [
      "META_ACCESS_TOKEN - Din META Marketing API access token",
      "META_AD_ACCOUNT_ID - Ditt META ad account ID"
    ],
    "guide": "https://developers.facebook.com/docs/marketing-api/get-started"
  }
}
```

### POST /api/meta/sync

Synkroniserar kampanjdata från META Marketing API till lokal databas.

#### Response
```json
{
  "success": true,
  "message": "Meta sync complete",
  "campaigns": 5
}
```

### GET /api/meta/metrics

Returnerar aggregerad kampanjdata för kliniken.

#### Query Parameters
- `days` (optional): Antal dagar (default: 30)

#### Response
```json
{
  "summary": {
    "totalSpend": 15000,
    "totalRevenue": 48000,
    "roas": 3.2,
    "totalLeads": 145,
    "qualityLeads": 87,
    "leadQualityRate": 60,
    "avgCPL": 103.45,
    "impressions": 250000,
    "clicks": 1850
  },
  "budgetRecommendation": {
    "currentUtilization": 82,
    "recommendation": "MAINTAIN",
    "reason": "Kapacitet inom optimal zon (75-90%)",
    "targetCPL": 120
  }
}
```

---

## Beräkningar & Logik

### Bokningströghet (Booking Lag)
Använder korskorrelation mellan annonsdata och bokningsserier:

```typescript
function analyzeBookingLag(
  adData: MetaCampaignMetrics[],
  bookingData: Array<{date: string, count: number}>
): number {
  let bestCorrelation = 0;
  let optimalLag = 7; // Default
  
  for (let lag = 1; lag <= 30; lag++) {
    const correlation = calculateCorrelation(adData, bookingData, lag);
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      optimalLag = lag;
    }
  }
  
  return optimalLag;
}
```

### Creative Fatigue
```typescript
const avgFrequency = currentMetrics.reduce((sum, m) => sum + m.frequency, 0) 
                    / currentMetrics.length;

if (avgFrequency > 3.5) {
  // Alert: Creative fatigue detected
}
```

### Lead Quality Drop
```typescript
const currentConversionRate = totalConversions / totalClicks;
const historicalConversionRate = historicalConversions / historicalClicks;

if (currentConversionRate < historicalConversionRate * 0.8) {
  // Alert: 20% drop in conversion rate
}
```

### ROAS Drop
```typescript
const currentROAS = totalRevenue / totalSpend;
const historicalROAS = historicalRevenue / historicalSpend;

if (currentROAS < historicalROAS * 0.7) {
  // Alert: 30% drop in ROAS
}
```

### Budget Warning
```typescript
if (currentSpend < avgHistoricalSpend * 0.5) {
  // Alert: Spend down >50% from normal
  const estimatedLoss = avgHistoricalSpend * 0.3 * 10;
  // Assume 30% of spend becomes bookings
}
```

---

## Test Scenarios

### 1. Ingen Konfiguration
**Input**: META_ACCESS_TOKEN och META_AD_ACCOUNT_ID saknas i .env

**Förväntat beteende**:
- Dashboard visar setup-banner med instruktioner
- API returnerar `setupRequired: true`
- Inga fel kastas

### 2. Normal Drift (Inga Varningar)
**Input**:
- Spend: 1500 kr/dag (stabilt)
- ROAS: 3.2
- Konverteringsgrad: 8%
- Frekvens: 2.5
- Kapacitet: 82%

**Förväntat beteende**:
- Inga alerts genereras
- budgetRecommendation: "MAINTAIN"
- Grön statusindikator

### 3. Kritisk Budget-varning
**Input**:
- Current spend: 300 kr/dag
- Historical avg: 1500 kr/dag
- Booking lag: 7 dagar
- Upcoming bookings: Lågt

**Förväntat beteende**:
- Critical alert med severity "critical"
- Rekommendation: Öka budget omedelbart
- impactEstimate: ~40,000 kr
- daysUntilImpact: 7

### 4. Lead Quality Drop
**Input**:
- Current conversion rate: 4%
- Historical conversion rate: 10%

**Förväntat beteende**:
- Warning alert
- Rekommendation: Granska målgrupp och kreativ
- impactEstimate: Baserat på current spend

### 5. Creative Fatigue
**Input**:
- Average frequency: 4.2

**Förväntat beteende**:
- Info alert
- Rekommendation: Rotera kreativa eller expandera målgrupp

---

## Troubleshooting

### Problem: "Invalid Access Token"
**Lösning**:
1. Verifiera att token är giltig: [developers.facebook.com/tools/debug/accesstoken](https://developers.facebook.com/tools/debug/accesstoken/)
2. Kontrollera att token har `ads_read` permission
3. Om token har gått ut: Generera ny token (System User tokens går inte ut)

### Problem: "Ad Account Not Found"
**Lösning**:
1. Kontrollera att AD_ACCOUNT_ID är korrekt (UTAN `act_` prefix)
2. Verifiera att System User har access till Ad Account:
   - Business Settings → Ad Accounts → [Ditt konto]
   - Kontrollera att System User finns i listan

### Problem: "Insufficient Permissions"
**Lösning**:
1. Lägg till `ads_read` permission till din token
2. Om du vill ha automation: lägg till `ads_management`
3. Regenerera token efter att ha lagt till permissions

### Problem: "Rate Limited"
**Lösning**:
- Flow har inbyggd 5 min cache för META API-anrop
- Om problemet kvarstår: Vänta 1 timme och försök igen
- Kontakta Meta support om återkommande problem

### Problem: Inga kampanjer synkas
**Lösning**:
1. Kontrollera att kampanjerna är aktiva i Ads Manager
2. Verifiera att kampanjerna körs under det Ad Account ID som konfigurerats
3. Kolla console logs för detaljer: `docker logs flow-web`

---

## Performance & Caching

### API Rate Limits
- **Cache duration**: 5 minuter
- **Max requests/hour**: 200 (Meta standard tier)
- **Recommended sync frequency**: Var 30:e minut

### Database Impact
- **MetaCampaignMetric** table växer med ~30 rows/dag per kampanj
- **Cleanup recommendation**: Radera data äldre än 90 dagar månadsvis

```sql
-- Cleanup query (kör månadsvis via cron)
DELETE FROM "MetaCampaignMetric" 
WHERE date < NOW() - INTERVAL '90 days';
```

---

## Säkerhet

### Token Management
- **Använd System User tokens**: Går inte ut automatiskt
- **Lagra säkert**: Använd environment variables, ALDRIG i kod
- **Rotera tokens**: Vid misstanke om läckage, rotera omedelbart
- **Minimal permissions**: Ge endast nödvändiga permissions (`ads_read`)

### Data Privacy
- **Ingen PII lagras**: Flow lagrar aldrig personuppgifter från Meta
- **Aggregerad data**: Endast kampanjmetrik på kampanjnivå
- **GDPR-compliant**: Användare kan begära radering av all kampanjdata

---

## Agency Handoff

### Vad behöver agency veta?

1. **Access Requirements**
   - System User token med `ads_read` permission
   - Ad Account ID
   - Business Manager admin access (för setup)

2. **Kampanjstruktur**
   - Använd tydliga kampanjnamn (Flow visar dessa i dashboarden)
   - Tagga kampanjer med UTM för bättre spårning
   - Rekommenderad struktur: `[Klinik]_[Tjänst]_[Målgrupp]_[Månad]`

3. **Optimization Best Practices**
   - Reagera på Flow's alerts inom 24 timmar
   - Fokusera på lead-kvalitet, inte bara volym
   - Använd creative rotation för att undvika fatigue
   - Håll kapacitet i 75-90% zonen

4. **Reporting**
   - Flow genererar veckovisa insights automatiskt
   - Dashboard uppdateras real-time
   - Export-funktion kommer i nästa release

---

## Roadmap & Framtida Funktioner

### Q1 2025
- [ ] Automatisk budget-justering (utan manuell godkännande)
- [ ] SMS/Email alerts för kritiska varningar
- [ ] Conversions API full integration (lead quality tracking)
- [ ] A/B test recommendations

### Q2 2025
- [ ] Multi-kampanj optimization (föreslå budget-shift mellan kampanjer)
- [ ] Predictive booking model (ML-baserad prognos)
- [ ] Competitor analysis integration
- [ ] Creative performance scoring

### Q3 2025
- [ ] Auto-pause underperforming ads
- [ ] Dynamic ad copy generation (AI)
- [ ] Integration med Google Ads
- [ ] Advanced attribution modeling

---

## Support

### Tekniska Frågor
- **Dokumentation**: [Flow Developer Docs](https://flow.klinik.se/docs)
- **GitHub Issues**: [github.com/klinik-flow/meta-integration](https://github.com/klinik-flow/meta-integration)
- **Email**: dev@klinikflow.se

### Affärsfrågor
- **Email**: support@klinikflow.se
- **Telefon**: +46 8 123 456 78
- **Live Chat**: Tillgänglig måndag-fredag 09:00-17:00

---

## Credits

Utvecklat av Klinik Flow Control Team
- Lead Developer: [Namn]
- Product Manager: [Namn]
- Data Scientist: [Namn]

Med inspiration från:
- Meta Marketing API Best Practices
- Lovable's Flow Strategy Document
- Real clinic owner feedback

**Version**: 1.0.0
**Senast uppdaterad**: 2025-10-14

