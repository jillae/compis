
# Automatiska Marknadsföringstriggrar - Guide

## Översikt

Flow Control har nu ett komplett system för automatiska marknadsföringstriggrar som skickar personaliserade SMS/e-post baserat på kundbeteende.

## Funktioner

### 1. Trigger-typer

- **Hälsostatus Ändring** - När kunds hälsostatus ändras (EXCELLENT, HEALTHY, AT_RISK, CRITICAL)
- **Ingen Visit (X dagar)** - När kund inte besökt på X antal dagar
- **Högvärdeskund i Risk** - När kund med hög LTV blir riskklassad
- **Låg Engagemang** - När kundens engagemang sjunker
- **Födelsedag** - X dagar före kundens födelsedag
- **Milstolpe** - När kund når ett visst antal besök eller LTV

### 2. Villkor & Segmentering

Varje trigger kan konfigureras med:
- Hälsostatus (EXCELLENT/HEALTHY/AT_RISK/CRITICAL)
- Min/max hälsopoäng (0-100)
- Dagar sedan senaste/första besök
- Min/max lifetime value
- Min/max antal besök
- Min/max no-shows
- Dagar till födelsedag
- Milstolpar (besök eller LTV)

### 3. Personalisering

Använd variabler i meddelanden:
- `{firstName}` - Kundens förnamn
- `{name}` - Kundens fulla namn
- `{totalVisits}` - Antal besök
- `{lifetimeValue}` - Total spenderad summa
- `{offer}` - Erbjudande (om aktiverat)

### 4. Erbjudanden

Inkludera automatiska erbjudanden:
- **Rabatt** - Procent eller SEK
- **Gratis** - Gratis behandling/produkt

### 5. Körningsregler

Kontrollera frekvens och volym:
- **Max per kund** - Max antal gånger samma kund får triggern
- **Cooldown** - Minst X dagar mellan triggers för samma kund
- **Max per dag** - Max totalt antal triggers per dag
- **Prioritet** - 1-10, högre = viktigare (körs först)

## API Endpoints

### GET /api/marketing-triggers
Lista alla triggers för kliniken

### POST /api/marketing-triggers
Skapa ny trigger

### GET /api/marketing-triggers/:id
Hämta specifik trigger

### PATCH /api/marketing-triggers/:id
Uppdatera trigger

### DELETE /api/marketing-triggers/:id
Ta bort trigger

### POST /api/marketing-triggers/:id/execute
Kör trigger manuellt

### GET /api/marketing-triggers/:id/metrics
Hämta prestationsstatistik

### POST /api/marketing-triggers/execute-all
Kör alla aktiva triggers

### POST /api/cron/execute-triggers
Cron endpoint för automatisk körning

## Automatisk Körning

### Via Vercel Cron (Rekommenderat)

1. Lägg till i `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/execute-triggers",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

2. Sätt CRON_SECRET i .env:
```
CRON_SECRET=din_hemliga_nyckel_här
```

3. Deploy till Vercel

### Via Externa Cron-tjänster

Använd tjänster som:
- **cron-job.org**
- **EasyCron**
- **GitHub Actions**

Exempel med GitHub Actions:

```yaml
name: Execute Marketing Triggers
on:
  schedule:
    - cron: '0 */6 * * *'  # Var 6:e timme
  workflow_dispatch:  # Manuell körning

jobs:
  execute-triggers:
    runs-on: ubuntu-latest
    steps:
      - name: Execute triggers
        run: |
          curl -X POST https://goto.klinikflow.app/api/cron/execute-triggers \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## UI Komponenter

### Dashboard
- `/dashboard/marketing-triggers` - Lista och hantera triggers
- `/dashboard/marketing-triggers/create` - Skapa ny trigger
- `/dashboard/marketing-triggers/:id/edit` - Redigera trigger (TODO)
- `/dashboard/marketing-triggers/:id/metrics` - Visa statistik (TODO)

### Marketing Dashboard
- `/dashboard/marketing` - Huvudpanel med länk till triggers

## Exempel: Skapa en "Återaktivera Inaktiva Kunder" Trigger

```typescript
POST /api/marketing-triggers
{
  "name": "Återaktivera Inaktiva Kunder",
  "description": "Skicka erbjudande till kunder som inte besökt på 60 dagar",
  "triggerType": "no_visit_days",
  "conditions": {
    "daysSinceLastVisit": 60
  },
  "channel": "sms",
  "messageBody": "Hej {firstName}! Vi saknar dig! Kom tillbaka och få {offer} på din nästa behandling. Ring oss på 08-123 456",
  "usePersonalization": true,
  "includeOffer": true,
  "offerDetails": {
    "type": "discount",
    "value": 20,
    "unit": "percent"
  },
  "maxExecutionsPerCustomer": 2,
  "cooldownDays": 90,
  "maxDailyExecutions": 50,
  "priority": 7,
  "isActive": true
}
```

## Performance Tracking

Varje trigger spårar:
- Totalt körda
- Framgångsrika sändningar
- Misslyckade sändningar
- Hoppade över (med anledning)
- Total kostnad (SEK)
- Total intäkt (SEK)
- ROAS (Return on Ad Spend)

## Skip Reasons

Triggers kan hoppas över av följande anledningar:
- `conditions_not_met` - Kund uppfyller inte villkoren
- `cooldown` - Cooldown-period aktiv
- `max_executions` - Max antal körningar uppnått
- `opt_out` - Kund har opt-out
- `no_consent` - Saknar samtycke
- `no_contact_info` - Saknar telefon/e-post
- `daily_limit` - Daglig gräns uppnådd

## Best Practices

### 1. Segmentering
- Börja med breda triggers och förfina över tid
- Testa olika villkor för att hitta optimal segmentering

### 2. Meddelanden
- Håll meddelanden korta och tydliga
- Använd personalisering för högre engagemang
- Inkludera tydlig call-to-action
- Testa olika erbjudanden för att se vad som fungerar bäst

### 3. Frekvens
- Börja med konservativa cooldown-perioder (30-90 dagar)
- Övervaka ROAS och justera baserat på data
- Undvik att överväldiga kunder med för många meddelanden

### 4. Timing
- Kör triggers under kontorstid för bäst respons
- Undvik helger och helgdagar
- Testa olika tider för att hitta optimal timing

### 5. Testing
- Börja med små dagsgränser (10-20)
- Kör manuellt först för att verifiera meddelanden
- Öka gradvis baserat på prestanda

## Nästa Steg

### Phase 1 (Klar)
- ✅ Database schema
- ✅ Backend API
- ✅ Trigger execution logic
- ✅ Basic UI för att skapa och hantera triggers

### Phase 2 (TODO)
- ⏳ Edit trigger UI
- ⏳ Metrics & analytics UI
- ⏳ A/B testing för meddelanden
- ⏳ Template library

### Phase 3 (TODO)
- ⏳ Integration med SMS provider (46elks)
- ⏳ E-post provider integration
- ⏳ Revenue attribution
- ⏳ Advanced segmentation

### Phase 4 (TODO)
- ⏳ AI-genererade meddelanden
- ⏳ Predictive triggering
- ⏳ Multi-channel orchestration
- ⏳ Campaign builder

## Support

För frågor om automatiska marknadsföringstriggrar, kontakta support eller se dokumentationen i:
- `/lib/marketing-triggers.ts` - Core logic
- `/app/api/marketing-triggers/` - API routes
- `/app/dashboard/marketing-triggers/` - UI komponenter
