
# Flow - AI-Powered Revenue Intelligence Platform

**För skönhets- och hälsokliniker som vill maximera intäkter och effektivisera verksamheten.**

---

## 🌟 Översikt

Flow är en modern SaaS-plattform som kombinerar:
- 📊 **Revenue Intelligence** - Datadriven intäktsanalys
- 🤖 **Corex AI Assistant** - Intelligent assistent med långt minne
- 📅 **Smart Booking Management** - Optimera bokningar och minska no-shows
- 📈 **Marketing Automation** - Meta Ads integration och kampanjhantering
- 👥 **Customer Intelligence** - Djup förståelse för kundbeteende
- 💰 **Dynamic Pricing** - AI-driven prisoptimering

---

## 🚀 Senaste Uppdateringar

### Wave 8: Corex AI & GoHighLevel Integration (Oktober 2025)

#### 🤖 Corex AI Assistant
- **Långt kontextminne** - Kommer ihåg tidigare konversationer
- **Text-to-Speech** - Prata med Corex via röst
- **Speech-to-Text** - Lyssna på Corex svar
- **Multi-channel** - Web, röst, SMS, WhatsApp
- **Personalisering** - Lär sig kundpreferenser över tid

#### 📡 GoHighLevel Integration
- **Auto-sync bokningar** till GHL CRM
- **Customer sync** - Håll kontakter synkroniserade
- **Connection status** - Real-time monitoring
- **Retry logic** - Automatisk återförsök vid fel

#### ⚠️ No-Show Risk Analysis
- **Förbättrade actions** - SMS, Ring, Email, Corex Auto-uppföljning
- **Expanderbar riskzon** på dashboard
- **Pro tips** med Corex-rekommendationer

#### 🔙 Navigation
- **Back-buttons** på alla undersidor
- Enkel och intuitiv navigation

Se [WAVE8_CHANGELOG.md](WAVE8_CHANGELOG.md) för fullständig lista.

---

## 🏗️ Arkitektur

```
flow/
├── nextjs_space/           # Next.js 14 app
│   ├── app/                # App router (Pages)
│   │   ├── api/            # API routes
│   │   │   ├── corex/      # Corex AI endpoints
│   │   │   ├── ghl/        # GoHighLevel integration
│   │   │   ├── bookings/   # Booking management
│   │   │   └── ...
│   │   ├── dashboard/      # Main dashboard & subpages
│   │   └── auth/           # Authentication pages
│   ├── components/         # React components
│   │   ├── corex/          # Corex-specifika komponenter
│   │   ├── ghl/            # GHL-komponenter
│   │   ├── dashboard/      # Dashboard widgets
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Utilities & helpers
│   │   ├── db.ts           # Prisma client
│   │   ├── auth.ts         # NextAuth config
│   │   └── ...
│   ├── prisma/             # Database schema
│   └── public/             # Static assets
```

---

## 🗄️ Database Schema

### Huvudmodeller

#### **Clinic** - Kliniken
- Bokadirekt integration
- Meta API credentials
- GHL credentials (NY i Wave 8)
- Corex settings
- Subscription & billing

#### **Customer** - Kunder
- Kontaktinfo och consent
- Health score & risk analysis
- Lifetime value
- Engagement metrics

#### **Booking** - Bokningar
- Schedule & status
- Service & staff
- Risk prediction
- Revenue tracking

#### **CorexConversation** (NY i Wave 8)
- Långt kontextminne per user
- Messages array (JSON)
- Sentiment & keywords
- Learned preferences

#### **GHLIntegrationLog** (NY i Wave 8)
- Sync tracking
- Success/failure status
- Error logging
- Retry management

#### **Staff** - Personal
- Specializations
- Performance metrics
- Utilization rates

#### **Service** - Tjänster
- Pricing & duration
- Category & description
- Dynamic pricing history

Se [schema.prisma](prisma/schema.prisma) för fullständig dokumentation.

---

## 🔧 Installation & Setup

### Förutsättningar
- Node.js 18+
- PostgreSQL 14+
- Yarn (package manager)

### Setup Steps

1. **Installera dependencies**
```bash
cd nextjs_space
yarn install
```

2. **Konfigurera miljövariabler** (`.env`)
```env
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Bokadirekt
BOKADIREKT_API_KEY=...
BOKADIREKT_API_URL=https://external.api.portal.bokadirekt.se/api/v1

# Meta Marketing
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=...
META_APP_ID=...
META_APP_SECRET=...

# AbacusAI (för Corex)
ABACUSAI_API_KEY=...

# GoHighLevel (optional)
# Konfigureras via UI per klinik

# 46elks SMS (optional)
FORTYSEVEN_ELKS_API_USERNAME=...
FORTYSEVEN_ELKS_API_PASSWORD=...
```

3. **Setup database**
```bash
yarn prisma generate
yarn prisma db push
```

4. **Seed data** (optional - demo data)
```bash
yarn prisma db seed
```

5. **Starta dev server**
```bash
yarn dev
```

Öppna [http://localhost:3000](http://localhost:3000)

---

## 🎯 Huvudfunktioner

### 1. 📊 Revenue Dashboard
- Real-time intäktsöversikt
- Trendanalys och prognoser
- Jämförelser över tid
- Top services & personal
- Kapacitetsanalys

### 2. 🤖 Corex AI Assistant
- Intelligent chatbot med långt minne
- Röstfunktion (TTS/STT)
- Kontext-medvetna svar
- Lär sig kundpreferenser
- 24/7 tillgänglig

### 3. ⚠️ No-Show Risk Prediction
- Maskininlärning-baserad riskanalys
- Proaktiva påminnelser
- Corex auto-uppföljning
- Expanderbar riskzon på dashboard
- Actionable insights

### 4. 👥 Customer Intelligence
- Health scores & segmentering
- Churn risk prediction
- Lifetime value beräkning
- Engagement tracking
- Smart tags & filters

### 5. 📈 Marketing Automation
- Meta Ads integration
- Campaign performance tracking
- ROI-analys
- Auto-optimering av ad spend
- A/B testing support

### 6. 💰 Dynamic Pricing
- AI-driven prisrekommendationer
- Competitor analysis
- Demand-based pricing
- Revenue optimization
- Compliance-säkert

### 7. 📡 Integrations
- **Bokadirekt** - Bokningssystem
- **Meta Marketing API** - Annonsering
- **GoHighLevel** - CRM & automation (NY i Wave 8)
- **46elks** - SMS-provider
- **AbacusAI** - LLM för Corex

---

## 🔐 Security & Compliance

- ✅ **GDPR-compliant** - Full data privacy
- ✅ **NextAuth** - Säker autentisering
- ✅ **Row-level security** - Data isolation per klinik
- ✅ **Encrypted credentials** - API keys säkert lagrade
- ✅ **Audit logging** - All data tracking
- ✅ **HTTPS enforced** - Säker kommunikation

---

## 📱 User Roles

### Super Admin
- Se alla kliniker
- Hantera subscriptions & licenses
- System-wide settings
- Analytics & reporting

### Admin (Clinic Owner)
- Full access till sin klinik
- Manage staff & services
- Billing & subscription
- Marketing campaigns
- Customer data

### Staff
- Limited view
- Own bookings & customers
- Performance metrics
- Basic reporting

---

## 🧪 Testing

```bash
# Run TypeScript checks
yarn tsc --noEmit

# Build production
yarn build

# Run tests (if available)
yarn test
```

---

## 🚀 Deployment

Deployed på **flow.abacusai.app**

### Build & Deploy
```bash
# Build app
yarn build

# Deploy (automated via CI/CD)
# Se deployment documentation för detaljer
```

---

## 📚 API Documentation

### Corex AI
- `POST /api/corex/chat` - Send message
- `GET /api/corex/chat?sessionId=xxx` - Get conversation history

### GoHighLevel
- `POST /api/ghl/sync` - Sync entity
- `GET /api/ghl/sync` - Get sync status
- `PUT /api/ghl/config` - Update config

### Bookings
- `GET /api/bookings` - List bookings
- `GET /api/bookings/predict` - Risk prediction
- `POST /api/bookings` - Create booking

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/health` - Health scores
- `POST /api/customers` - Create customer

### Meta Marketing
- `GET /api/meta/campaigns` - Campaign metrics
- `POST /api/meta/sync` - Sync from Meta

Se respektive API-fil för fullständig dokumentation.

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch från `main`
2. Make changes
3. Test thoroughly
4. Create PR
5. Code review
6. Merge to main
7. Auto-deploy

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Component-driven development
- Atomic commits
- Descriptive PR titles

---

## 📞 Support

**För supportfrågor:**
- Email: [support@abacus.ai](mailto:support@abacus.ai)
- Docs: [abacus.ai/help](https://abacus.ai/help/howTo/chatllm)

---

## 📄 License

Proprietary - © 2025 Abacus.AI

---

## 🎉 Credits

**Utvecklat av Flow Team**
- Lead Developer: AI Assistant (Claude/ChatGPT)
- Product Owner: [User]
- Platform: Abacus.AI DeepAgent
- Infrastructure: Abacus.AI

**Powered by:**
- Next.js 14
- Prisma ORM
- PostgreSQL
- shadcn/ui
- AbacusAI LLM APIs

---

**Version:** Wave 8.0  
**Last Updated:** Oktober 16, 2025  
**Status:** ✅ Production

---

## 🗺️ Roadmap

### Completed Waves
- ✅ Wave 1: Core platform & Bokadirekt integration
- ✅ Wave 2: Revenue intelligence & analytics
- ✅ Wave 3: AI autopilot & dynamic pricing
- ✅ Wave 4: Customer intelligence & billing
- ✅ Wave 5: Email automation & competitive intel
- ✅ Wave 6: Voice & AI assistant
- ✅ Wave 7: Unlayer email editor & license management
- ✅ Wave 8: Corex AI memory & GoHighLevel integration

### Planned Features
- 🔜 Wave 9: Advanced analytics & reporting
- 🔜 Wave 10: Mobile app (React Native)
- 🔜 Multi-tenant SaaS expansion
- 🔜 International expansion (UK, US markets)

---

**Made with ❤️ and 🤖 by the Flow Team**
