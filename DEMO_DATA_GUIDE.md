
# META Integration - Demo Data & Testing Guide

## Översikt

Denna guide hjälper dig att testa META-integrationen med mock data och olika scenarios. Perfekt för demo, utveckling och QA.

---

## Setup Mock Data

### Metod 1: Manuell SQL (Snabbast för demo)

```sql
-- Steg 1: Aktivera Meta för test-klinik
UPDATE "Clinic"
SET
  "metaEnabled" = true,
  "metaAccessToken" = 'DEMO_TOKEN_NOT_REAL',
  "metaAdAccountId" = '1234567890',
  "metaTargetCPL" = 250.00,
  "metaTargetROAS" = 3.00,
  "metaCapacityMin" = 75,
  "metaCapacityMax" = 90
WHERE "name" = 'Arch Clinic';  -- eller din test-klinik

-- Steg 2: Lägg till mock kampanjdata (Normal State)
INSERT INTO "MetaCampaignMetric" 
("id", "clinicId", "metaCampaignId", "metaCampaignName", "date", "spend", "impressions", "clicks", "leads", "cpm", "cpc", "cpl", "ctr", "qualityLeads", "revenue", "roas")
VALUES
-- Vecka 1 (normal drift)
('demo1', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-07', 1500.00, 45000, 850, 12, 33.33, 1.76, 125.00, 1.89, 8, 18000.00, 12.00),
('demo2', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-08', 1480.00, 43500, 820, 11, 34.02, 1.80, 134.55, 1.88, 7, 16800.00, 11.35),
('demo3', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-09', 1520.00, 46000, 870, 13, 33.04, 1.75, 116.92, 1.89, 9, 19500.00, 12.83),
('demo4', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-10', 1490.00, 44000, 840, 12, 33.86, 1.77, 124.17, 1.91, 8, 18000.00, 12.08),
('demo5', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-11', 1510.00, 45500, 860, 11, 33.19, 1.76, 137.27, 1.89, 7, 16800.00, 11.13),
('demo6', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-12', 1500.00, 45000, 850, 12, 33.33, 1.76, 125.00, 1.89, 8, 18000.00, 12.00),
('demo7', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-13', 1520.00, 46000, 870, 13, 33.04, 1.75, 116.92, 1.89, 9, 19500.00, 12.83);

-- Verifiera
SELECT * FROM "MetaCampaignMetric" WHERE "clinicId" = (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic');
```

---

## Test Scenarios

### Scenario 1: Normal Drift (Allt OK)

**Setup**:
- Spend: 1500 kr/dag (stabilt)
- ROAS: ~12.0
- Conversion rate: ~8%
- Frequency: 2.5
- Kapacitet: 82%

**Förväntat resultat**:
```json
{
  "alerts": [],
  "budgetRecommendation": {
    "recommendation": "MAINTAIN",
    "reason": "Kapacitet inom optimal zon (75-90%)"
  }
}
```

**Test**:
```bash
# API test
curl http://localhost:3000/api/marketing/meta/alerts?days=7

# UI test
# Gå till http://localhost:3000/dashboard
# Verifiera att MetaAlerts visar "Allt ser bra ut! ✅"
```

---

### Scenario 2: Kritisk Budget-varning

**Setup**:
```sql
-- Lägg till låg spend-period (simulera att någon sänkt budget)
INSERT INTO "MetaCampaignMetric" 
("id", "clinicId", "metaCampaignId", "metaCampaignName", "date", "spend", "impressions", "clicks", "leads", "cpm", "cpc", "cpl", "ctr", "qualityLeads", "revenue", "roas")
VALUES
('critical1', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-14', 300.00, 9000, 170, 2, 33.33, 1.76, 150.00, 1.89, 1, 3000.00, 10.00);
```

**Förväntat resultat**:
```json
{
  "alerts": [
    {
      "severity": "critical",
      "type": "budget",
      "title": "VARNING: Låg annonsering kommer orsaka tom kalender",
      "description": "Annonseringen har minskat med 80%. Baserat på 7 dagars tröghet kommer detta påverka bokningar om 7 dagar.",
      "recommendation": "Öka annonsbudgeten till minst 1,500 kr/dag OMEDELBART",
      "impactEstimate": 45000,
      "daysUntilImpact": 7
    }
  ]
}
```

**Test**:
```bash
# API test
curl http://localhost:3000/api/marketing/meta/alerts?days=7

# UI test - bör visa röd kritisk varning
```

---

### Scenario 3: Lead Quality Drop

**Setup**:
```sql
-- Lägg till period med dålig konvertering
INSERT INTO "MetaCampaignMetric" 
("id", "clinicId", "metaCampaignId", "metaCampaignName", "date", "spend", "impressions", "clicks", "leads", "cpm", "cpc", "cpl", "ctr", "qualityLeads", "revenue", "roas")
VALUES
-- Många leads, men få quality leads (låg konvertering)
('quality1', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-14', 1500.00, 45000, 850, 20, 33.33, 1.76, 75.00, 1.89, 3, 4500.00, 3.00);
```

**Förväntat resultat**:
- Warning alert om lead quality
- Låg ROAS trots många leads
- Rekommendation att granska målgrupp

**Beräkning**:
- Conversion rate: 3/20 = 15% (normalt 8/12 = 67%)
- Drop: 15% vs 67% = 78% nedgång ❌

---

### Scenario 4: Creative Fatigue

**Setup**:
```sql
-- Lägg till kampanj med hög frekvens
INSERT INTO "MetaCampaignMetric" 
("id", "clinicId", "metaCampaignId", "metaCampaignName", "date", "spend", "impressions", "clicks", "leads", "cpm", "cpc", "cpl", "ctr", "qualityLeads", "revenue", "roas")
SELECT
  'fatigue' || generate_series(1, 7),
  (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'),
  'campaign_002',
  'Arch_Laser_Small_Audience',
  CURRENT_DATE - (7 - generate_series(1, 7)),
  1500.00,
  20000,  -- Få impressions
  400,    -- Få klick (CTR sjunker)
  5,
  75.00,  -- Hög CPM
  3.75,   -- Hög CPC
  300.00, -- Hög CPL
  2.00,   -- Låg CTR
  3,
  7500.00,
  5.00;
```

**Förväntat resultat**:
- Info alert om creative fatigue
- Frekvens beräknas som: impressions / reach ≈ 4.5 (> 3.5 threshold)

---

### Scenario 5: ROAS Drop

**Setup**:
```sql
-- Period med dålig ROAS
INSERT INTO "MetaCampaignMetric" 
("id", "clinicId", "metaCampaignId", "metaCampaignName", "date", "spend", "impressions", "clicks", "leads", "cpm", "cpc", "cpl", "ctr", "qualityLeads", "revenue", "roas")
VALUES
('roas1', (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic'), 'campaign_001', 'Arch_Laser_Kvinnor_25-45', '2025-10-14', 1500.00, 45000, 850, 12, 33.33, 1.76, 125.00, 1.89, 4, 6000.00, 4.00);
```

**Förväntat resultat**:
- Warning alert
- ROAS: 4.00 vs historical 12.00 = 67% nedgång
- Rekommendation att pausa underpresterande kampanjer

---

## Interaktiv Testing i UI

### Dashboard Testing

1. **Navigera till Dashboard**
   ```
   http://localhost:3000/dashboard
   ```

2. **Verifiera META Alerts Card**
   - Bör synas högst upp om `metaEnabled = true`
   - Visa booking lag (t.ex. "7 dagar")
   - Visa aktuell ROAS
   - Visa rekommenderad budget

3. **Test Expand/Collapse**
   - Klicka "Visa Detaljer" för att expandera
   - Klicka "^" för att kollapsa
   - Verifiera animeringar funkar

4. **Test Alert Severity Colors**
   - Critical: Röd border + röd ikon
   - Warning: Orange border + orange ikon
   - Info: Blå border + blå ikon

### Marketing Page Testing

1. **Navigera till Marketing**
   ```
   http://localhost:3000/dashboard/marketing
   ```

2. **Test Tier-baserad Access**
   - Om tier = BASIC: Visa upgrade-prompt
   - Om tier = PROFESSIONAL/ENTERPRISE: Visa META dashboard
   - Om metaEnabled = false: Visa setup-instruktioner

3. **Test Sync Button**
   - Klicka "Synka kampanjdata"
   - Verifiera loading state
   - Kontrollera att data uppdateras efter sync

---

## API Testing med Postman/curl

### 1. Get Alerts
```bash
curl -X GET "http://localhost:3000/api/marketing/meta/alerts?days=30" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Förväntat response**:
```json
{
  "success": true,
  "data": {
    "alerts": [...],
    "bookingLag": { "days": 7, "description": "..." },
    "budgetRecommendation": {...},
    "metrics": {
      "current": {...},
      "historical": {...}
    }
  }
}
```

### 2. Sync Campaigns
```bash
curl -X POST "http://localhost:3000/api/meta/sync" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Förväntat response**:
```json
{
  "success": true,
  "message": "Meta sync complete",
  "campaigns": 5
}
```

### 3. Get Metrics Summary
```bash
curl -X GET "http://localhost:3000/api/meta/metrics?days=30" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## Performance Testing

### Load Test (Artillery)

```yaml
# artillery-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "META Alerts Load Test"
    flow:
      - get:
          url: "/api/marketing/meta/alerts?days=30"
```

```bash
# Kör test
artillery run artillery-test.yml
```

**Förväntade resultat**:
- P95 latency: < 500ms (från cache)
- P99 latency: < 2s (cache miss + Meta API call)
- Error rate: < 1%

---

## Cleanup Mock Data

```sql
-- Ta bort all demo data
DELETE FROM "MetaCampaignMetric" 
WHERE "id" LIKE 'demo%' 
   OR "id" LIKE 'critical%'
   OR "id" LIKE 'quality%'
   OR "id" LIKE 'fatigue%'
   OR "id" LIKE 'roas%';

-- Återställ clinic till disabled state
UPDATE "Clinic"
SET
  "metaEnabled" = false,
  "metaAccessToken" = NULL,
  "metaAdAccountId" = NULL
WHERE "name" = 'Arch Clinic';
```

---

## Debugging Tips

### Enable Verbose Logging
```typescript
// lib/meta-marketing.ts
// Lägg till console.logs för debugging
console.log('📊 Current metrics:', currentMetrics);
console.log('📈 Historical metrics:', historicalMetrics);
console.log('🔔 Generated alerts:', alerts);
```

### Check Database State
```sql
-- Kontrollera kampanjdata
SELECT 
  "date",
  "metaCampaignName",
  "spend",
  "leads",
  "qualityLeads",
  "roas"
FROM "MetaCampaignMetric"
WHERE "clinicId" = (SELECT id FROM "Clinic" WHERE name = 'Arch Clinic')
ORDER BY "date" DESC
LIMIT 10;

-- Kontrollera clinic config
SELECT 
  "name",
  "metaEnabled",
  "metaTargetCPL",
  "metaTargetROAS",
  "metaCapacityMin",
  "metaCapacityMax"
FROM "Clinic"
WHERE "metaEnabled" = true;
```

### Browser DevTools
1. Öppna Network tab
2. Filtrera på "alerts" eller "meta"
3. Kontrollera:
   - Request headers (auth cookie)
   - Response status (200 OK)
   - Response time (< 2s)
   - Response data structure

---

## Automated Testing (Future)

### Jest Unit Tests
```typescript
// __tests__/meta-marketing.test.ts
describe('MetaMarketingService', () => {
  it('should detect critical budget drop', () => {
    const service = new MetaMarketingService('token', 'account_id');
    const alerts = service.generateProactiveAlerts(...);
    expect(alerts).toContainEqual(
      expect.objectContaining({
        severity: 'critical',
        type: 'budget'
      })
    );
  });
});
```

### E2E Tests (Playwright)
```typescript
// e2e/meta-integration.spec.ts
test('META dashboard shows alerts', async ({ page }) => {
  await page.goto('/dashboard/marketing');
  await expect(page.locator('[data-testid="meta-alerts"]')).toBeVisible();
  await expect(page.locator('.alert-critical')).toHaveCount(1);
});
```

---

**Guide Version**: 1.0.0  
**Last Updated**: 2025-10-14  
**Maintained by**: Klinik Flow Control Team

