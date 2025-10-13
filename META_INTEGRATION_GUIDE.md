
# META Marketing Integration - Setup Guide

## 🎯 Vision: Proaktiv Annonsövervakning

Flow's META-integration löser ett kritiskt problem för kliniker:

### Problemet vi löser:
- **Klassisk fälla:** Fullbokad → sänker ads → plötsligt tom kalender
- **Tröghet i systemet:** Resultat idag kommer från beslut för X veckor sedan
- **Stress & negativ kultur:** Tom kalender → stress → dålig konvertering → ännu sämre resultat
- **Reaktivt istället för proaktivt:** Upptäcker problem när det redan är för sent

### Flow's Lösning:
✅ **Varningar INNAN kalendern blir tom** (baserat på mätbar tröghet)  
✅ **Realtidsövervakning av lead-kvalitet** (inte bara ROAS)  
✅ **Automatiska budgetrekommendationer** baserat på historisk data  
✅ **Creative fatigue-detektering** innan prestandan sjunker  
✅ **Proaktiva signaler** som förhindrar negativ spiral

---

## 📊 Vad META-Integration Ger Dig

### 1. Bokningströghet-Analys
Flow analyserar historisk data för att **exakt** veta hur lång tid det tar från att någon ser din annons till att de bokar. Detta är grunden för alla proaktiva varningar.

**Exempel:**
- Tröghet: 14 dagar
- Du sänker annonseringen idag
- Flow varnar: "Om 14 dagar kommer kalendern vara tom"

### 2. Proaktiva Varningar (4 typer)

#### 🚨 CRITICAL: Budget-varning
**Utlöses när:** Annonsbudget sjunker >50% under normal nivå
```
"VARNING: Låg annonsering kommer orsaka tom kalender"
Annonsering har minskat med 60%. Baserat på 14 dagars tröghet 
kommer detta påverka bokningar om 14 dagar.

Rekommendation: Öka annonsbudget till minst 3,500 kr/dag 
OMEDELBART för att undvika tomma luckor.

Potentiell förlust: 45,000 kr
```

#### ⚠️ WARNING: Lead-kvalitet
**Utlöses när:** Konverteringsgrad sjunker >20%
```
"Försämrad lead-kvalitet"
Konverteringsgraden har sjunkit från 12.5% till 8.2%. 
Detta indikerar sämre kvalitet på leadsen.

Rekommendation: Granska målgruppsval, annonskreativ och 
landningssida. Testa nya målgruppssegment.

Potentiell påverkan: 12,000 kr
```

#### 💡 INFO: Creative Fatigue
**Utlöses när:** Genomsnittlig frekvens >3.5
```
"Creative fatigue - samma personer ser annonsen för ofta"
Genomsnittlig frekvens är 4.2, vilket kan leda till 
annonstrotthet och minskad effektivitet.

Rekommendation: Rotera annonskreativ eller expandera 
målgruppen. Testa nya budskap och visuella element.
```

#### ⚠️ WARNING: ROAS-nedgång
**Utlöses när:** ROAS sjunker >30%
```
"ROAS har sjunkit betydligt"
ROAS har minskat från 4.2 till 2.5. Detta indikerar 
ineffektiv annonsering.

Rekommendation: Pausa underpresterande kampanjer. 
Fokusera budget på kampanjer med bäst ROAS.
```

### 3. Budgetoptimering
Flow rekommenderar optimal daglig budget baserat på:
- Historisk kostnad per bokning
- Önskad antal bokningar
- Säsongsvariationer
- ROAS-trends

**Exempel:**
```
Nuvarande budget: 2,500 kr/dag
Rekommenderad budget: 3,800 kr/dag
Förväntade bokningar: 12/dag (vs 8/dag nu)
Säkerhet: 85%
```

---

## 🔧 Setup: Konfigurera META Marketing API

### Steg 1: Skapa META Developer App

1. Gå till https://developers.facebook.com/
2. Klicka "My Apps" → "Create App"
3. Välj app-typ: "Business"
4. Fyll i appinformation:
   - App Name: "Flow Klinik Integration"
   - Contact Email: din@email.com
5. Välj "Business Portfolio" (eller skapa ny)

### Steg 2: Lägg till Marketing API

1. I din app, gå till "Add Product"
2. Hitta "Marketing API" och klicka "Set Up"
3. Följ instruktionerna för att koppla ditt Ad Account

### Steg 3: Generera Access Token

#### Kort Access Token (för testning):
1. Gå till "Tools" → "Graph API Explorer"
2. Välj din app
3. Välj permissions:
   - `ads_read` ✅
   - `ads_management` ✅
4. Klicka "Generate Access Token"
5. Kopiera token

#### Långvarig Access Token (för produktion):
1. Ta din short-lived token från ovan
2. Använd Token Debugger: https://developers.facebook.com/tools/debug/accesstoken/
3. Klicka "Extend Access Token"
4. Kopiera den nya token (giltig i 60 dagar)

**⚠️ VIKTIGT:** För permanent access, använd System User Access Token:
https://developers.facebook.com/docs/marketing-api/system-users

### Steg 4: Hitta ditt Ad Account ID

1. Gå till https://business.facebook.com/
2. Välj ditt Business Manager
3. Gå till "Business Settings" → "Ad Accounts"
4. Kopiera "Ad Account ID" (ex: `act_1234567890`)
5. **Använd ENDAST siffrorna** (ex: `1234567890`)

### Steg 5: Konfigurera Flow

Lägg till följande i din `.env` fil:

```bash
# META Marketing API Configuration
META_ACCESS_TOKEN=ditt_access_token_här
META_AD_ACCOUNT_ID=1234567890  # BARA siffror, INTE "act_"
```

### Steg 6: Verifiera Integration

1. Logga in på Flow
2. Gå till Dashboard
3. Scrolla ner till "META Ads Intelligence"
4. Om konfigurerat korrekt ser du:
   - Bokningströghet (dagar)
   - Aktuell ROAS
   - Rekommenderad budget
   - Aktiva varningar (om några)

---

## 🧪 Test-Scenarion

### Test 1: Setup-meddelande (INNAN konfiguration)
1. Gå till Dashboard
2. Du ska se en orange setup-banner
3. Klicka "Läs Setup-guide" → öppnar Facebook docs

### Test 2: Fungerade Integration
1. Konfigurera `.env` enligt ovan
2. Starta om servern: `yarn dev`
3. Gå till Dashboard
4. Du ska se META Ads Intelligence-kortet med:
   - Bokningströghet (ex: 14 dagar)
   - ROAS-data
   - Eventuella varningar

### Test 3: Collapsed/Expanded View
1. Kortet börjar **expanded** (visar alla detaljer)
2. Klicka "collapse" knappen (uppe till höger)
3. Kortet visar endast sammanfattning
4. Klicka "Visa Detaljer" för att expandera igen

---

## 📈 Data Flow

```
META API → Flow Backend → Analys → Proaktiva Varningar
   ↓                           ↓              ↓
Kampanjer                 Tröghet        Dashboard
   ↓                           ↓              ↓
ROAS, CTR              Prediktion    Email-notiser
   ↓                           ↓              ↓
Spend                    Rekomm.      Åtgärder
```

### API Endpoints

**GET `/api/marketing/meta/alerts?days=30`**
```typescript
Response: {
  success: true,
  data: {
    alerts: MetaAlert[],        // Proaktiva varningar
    bookingLag: {               // Tröghet-analys
      days: 14,
      description: "Det tar i genomsnitt 14 dagar..."
    },
    budgetRecommendation: {     // Budget-optimering
      recommendedDailyBudget: 3800,
      currentBudget: 2500,
      expectedBookings: 12,
      confidence: 0.85
    },
    metrics: {                  // Nyckeltal
      current: { totalSpend, avgROAS, totalConversions },
      historical: { ... }
    }
  }
}
```

---

## 🔐 Säkerhet & Best Practices

### Access Token Management
- ✅ Använd `.env` filer (aldrig commit tokens till Git)
- ✅ Rotera tokens regelbundet (var 60:e dag minimum)
- ✅ Använd System User tokens för produktion
- ❌ Dela aldrig tokens i slack/email

### Rate Limiting
META Marketing API har följande gränser:
- **200 requests per hour** per access token
- Flow cachar data i **5 minuter** för att minimera requests

### Permissions
Minimala permissions som krävs:
- `ads_read` - Läsa kampanjdata och nyckeltal
- `ads_management` - (optional) För framtida automation

---

## 🚀 Framtida Funktioner

### Fas 2: Automatisk Budgetjustering
- Auto-pausa underpresterande kampanjer
- Auto-öka budget på high-ROAS kampanjer
- Smart scheduling baserat på peak-times

### Fas 3: Predictive Analytics
- ML-modeller för lead quality prediction
- Seasonal trend forecasting
- Competition analysis

### Fas 4: Multi-Channel
- Google Ads integration
- TikTok Ads
- LinkedIn Ads
- Unified dashboard för alla kanaler

---

## ❓ Troubleshooting

### Problem: "META Marketing API not configured"
**Lösning:** 
1. Kontrollera att `.env` innehåller `META_ACCESS_TOKEN`
2. Starta om servern
3. Verifiera token är giltig i Facebook Token Debugger

### Problem: "Invalid access token"
**Lösning:**
1. Token har förfallit (max 60 dagar)
2. Generera ny token enligt Steg 3 ovan
3. Uppdatera `.env` och starta om

### Problem: "Ad Account not found"
**Lösning:**
1. Kontrollera `META_AD_ACCOUNT_ID` är BARA siffror
2. Verifiera att appen har access till Ad Account
3. Gå till Business Settings → Ad Accounts → säkerställ appen är listad

### Problem: "No alerts showing"
**Detta är NORMALT!** 
- Om allt går bra, finns inga varningar
- Du ser då "Allt ser bra ut! ✅"
- Varningar visas ENDAST när något behöver åtgärdas

---

## 📞 Support

- **META Developer Docs:** https://developers.facebook.com/docs/marketing-api
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer/
- **Token Debugger:** https://developers.facebook.com/tools/debug/accesstoken/

---

**Skapad:** 2025-10-13  
**Version:** 1.0  
**Status:** Production Ready 🚀
