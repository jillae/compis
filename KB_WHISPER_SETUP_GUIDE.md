
# KB-Whisper Server Setup Guide

**Datum:** 2025-10-18  
**Status:** ⚠️ Kräver konfiguration

---

## 📋 Vad du behöver

För att ansluta KB-Whisper som fallback-provider behöver du följande information från din KB-Whisper server:

### 1. Server IP-adress
- **Exempel:** `192.168.1.100` eller `kb-whisper.yourdomain.com`
- **Port:** Standardport är `8000`

### 2. API Token
- Finns i: `/opt/kb-whisper/.env` på servern
- Variabel: `API_TOKEN=din_secret_token`
- **SSH-kommando för att hämta:**
  ```bash
  ssh -i /path/to/private_key.pem user@your-server-ip -p 22
  cat /opt/kb-whisper/.env | grep API_TOKEN
  ```

### 3. SSH-uppgifter (för framtida underhåll)
- **Privat nyckel:** `/path/to/private_key.pem`
- **Användarnamn:** `whisperadmin` (eller annat)
- **Port:** `22` (standard SSH)

---

## 🔧 Konfigurationssteg

### Steg 1: Samla information

Fyll i följande (ersätt med dina faktiska värden):

```bash
# Server-uppgifter
SERVER_IP="din-server-ip-här"           # T.ex. 192.168.1.100
SERVER_PORT="8000"                       # Standard KB-Whisper port
API_TOKEN="din-api-token-här"           # Från /opt/kb-whisper/.env
```

### Steg 2: Verifiera att servern är tillgänglig

Kör detta från din terminal för att kontrollera health-endpoint:

```bash
curl http://${SERVER_IP}:${SERVER_PORT}/health
```

**Förväntat resultat:** HTTP 200 OK

### Steg 3: Testa transkribering

```bash
curl -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@/path/to/test.wav" \
  -F "model=large-v3" \
  -F "language=sv" \
  http://${SERVER_IP}:${SERVER_PORT}/v1/audio/transcriptions
```

### Steg 4: Uppdatera Flow-konfigurationen

När du har verifierat ovanstående, kör detta script:

```bash
cd /home/ubuntu/flow/nextjs_space
yarn tsx scripts/configure-kb-whisper.ts
```

Scriptet kommer att fråga efter:
1. Server IP-adress
2. Server port (standard: 8000)
3. API token

---

## 📊 Aktuell konfiguration i Flow

Efter konfiguration kommer KB-Whisper att användas enligt denna prioritetsordning:

| Prioritet | Provider | Endpoint | Status |
|-----------|----------|----------|--------|
| **#1** | OpenAI Whisper API | `api.openai.com` | ✅ Aktiv (Primär) |
| **#2** | KB-Whisper Flow-Speak | `http://{SERVER_IP}:{PORT}/transcribe` | ⚠️ Behöver konfigureras |

---

## 🔍 Felsökning

### Problem: "Connection refused"
**Lösning:** Kontrollera att:
- Servern är igång: `docker ps` (ska visa `kb-whisper` container)
- Firewall tillåter port 8000
- IP-adressen är korrekt

### Problem: "Unauthorized"
**Lösning:**
- Verifiera API_TOKEN i `/opt/kb-whisper/.env`
- Kontrollera att token är korrekt inmatad i Flow

### Problem: "Timeout"
**Lösning:**
- Öka timeout i Superadmin → STT Providers
- Standard är 30 sekunder, kan behöva höjas för långa ljudfiler

---

## 📁 Filplatser

### På KB-Whisper servern:
- **Huvudkatalog:** `/opt/kb-whisper/`
- **Modeller:** `/opt/kb-whisper/model/`
- **Loggar:** `/opt/kb-whisper/logs/`
- **Environment:** `/opt/kb-whisper/.env`

### I Flow:
- **API implementation:** `/home/ubuntu/flow/nextjs_space/lib/voice/stt.ts`
- **Provider config:** Databas → `stt_provider_config` table
- **API endpoint:** `/api/stt/transcribe`
- **Konfigurationsscript:** `/home/ubuntu/flow/nextjs_space/scripts/configure-kb-whisper.ts`

---

## 🔒 Säkerhet

### Best practices:
1. **Använd HTTPS:** Om möjligt, sätt upp reverse proxy med SSL
2. **Begränsa åtkomst:** Endast Flow-servern ska kunna nå KB-Whisper
3. **Rotera API-token:** Byt token regelbundet
4. **Logga åtkomst:** Övervaka `/opt/kb-whisper/logs/` för misstänkt aktivitet

### API Token i Flow:
- Sparas i: `stt_provider_config.config_json` (krypterat i databasen)
- Alternativt: Environment variable `KB_WHISPER_API_TOKEN`

---

## 📞 Support

### Kontrollera serverstatus:
```bash
ssh whisperadmin@${SERVER_IP} -p 22
docker logs -f kb-whisper
```

### Starta om tjänsten:
```bash
docker restart kb-whisper
```

### Se systemresurser:
```bash
docker stats kb-whisper
```

---

## ✅ Checklista för konfiguration

- [ ] Hämtat server IP-adress
- [ ] Hämtat API token från servern
- [ ] Verifierat health-endpoint
- [ ] Testat transkribering med curl
- [ ] Kört konfigurationsscript i Flow
- [ ] Testat från Superadmin → STT Providers
- [ ] Verifierat fallback-funktionalitet

---

**Nästa steg:** Fyll i dina serveruppgifter och kör konfigurationsskriptet!
