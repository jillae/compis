
# Flow - AI-Powered Revenue Intelligence Platform

## Overview
Flow is a SaaS platform designed for beauty and health clinics to optimize resource planning, reduce no-shows, and maximize revenue through AI-driven insights and recommendations.

## 🎯 Core Value Proposition
**Transform your clinic data into actionable insights that directly increase revenue and operational efficiency**

## ✨ Features Implemented

### 1. **Dashboard & Analytics**
- Real-time KPI tracking (Total Bookings, Revenue, No-Show Rate, Utilization)
- Interactive charts for no-show patterns by hour
- Weekly booking trends visualization
- Capacity utilization overview
- Beautiful gradient UI with responsive design

### 2. **AI-Powered Insights** 🤖
- **No-Show Analysis**: Identifies high no-show rates and provides actionable recommendations
- **Peak Hours Optimization**: Detects low-utilization periods and suggests promotional strategies
- **Customer Retention Analysis**: Measures repeat client rates and suggests loyalty programs
- **Revenue Optimization**: Analyzes average booking value and recommends upselling strategies
- **Booking Pattern Analysis**: Identifies lead times and suggests scheduling optimizations
- **Staff Utilization**: Detects underbooked staff and recommends schedule adjustments
- **Weekend vs Weekday Performance**: Analyzes booking patterns and suggests weekday promotions

All insights are:
- Categorized by impact (High, Medium, Low)
- Actionable with specific recommendations
- Data-driven from actual clinic performance

### 3. **Data Import System**
- CSV file upload with intelligent column mapping
- Support for Bokadirekt exports and custom formats
- Preview data before import
- Real-time import progress tracking
- Detailed error reporting with success/failure counts
- Automatic customer and staff creation from imported data

### 4. **Authentication & Security**
- NextAuth.js integration with credential-based login
- Secure password hashing with bcrypt
- Protected API routes
- Session management
- Role-based access control ready

### 5. **Database Schema** (PostgreSQL + Prisma)
- **Users**: Multi-tenant ready with company information
- **Customers**: Complete customer profiles with booking history
- **Staff**: Staff members with specializations and hourly rates
- **Rooms**: Treatment room management with equipment tracking
- **Bookings**: Comprehensive booking records with status tracking
- **ImportLog**: Track all data imports with metadata

## 📊 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** (Server & Client Components)
- **TypeScript** (Type-safe development)
- **Tailwind CSS** (Utility-first styling)
- **Shadcn UI** (Beautiful component library)
- **Recharts** (Data visualization)
- **Lucide React** (Icons)

### Backend
- **Next.js API Routes** (Serverless functions)
- **Prisma ORM** (Type-safe database access)
- **PostgreSQL** (Reliable data storage)
- **NextAuth.js** (Authentication)

### Infrastructure
- **AWS S3** (File storage - configured and ready)
- **Vercel/Custom Hosting** (Deployment ready)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- PostgreSQL database
- Environment variables configured

### Installation
```bash
cd flow/nextjs_space
yarn install
```

### Environment Variables
Already configured in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Session encryption key
- `NEXTAUTH_URL`: Application URL
- `AWS_*`: S3 configuration for file uploads

### Database Setup
```bash
# Generate Prisma Client
yarn prisma generate

# Push schema to database
yarn prisma db push

# Seed with demo data
yarn prisma db seed
```

### Development
```bash
yarn dev
```
Navigate to `http://localhost:3000`

### Production Build
```bash
yarn build
yarn start
```

## 👥 Demo Accounts

### Admin User
- Email: `admin@flowclinic.com`
- Password: `admin123`

### Test User
- Email: `john@doe.com`
- Password: `johndoe123`

## 📈 Sample Data
The seeded database includes:
- **250 bookings** with realistic patterns (last 30 days)
- **20 customers** with varied booking histories
- **6 staff members** with different specializations
- **8 treatment rooms** with equipment types
- **3 users** (admin + test accounts)

## 🎨 Key Pages

### `/dashboard`
Main analytics dashboard with KPIs, charts, and AI insights preview

### `/dashboard/insights`
Dedicated AI insights page with detailed recommendations and impact analysis

### `/dashboard/import`
CSV import wizard with column mapping and validation

### `/auth/login` & `/auth/signup`
Authentication pages with beautiful gradient designs

## 📡 API Routes

### `/api/dashboard/metrics`
Returns comprehensive dashboard metrics including:
- Total bookings and revenue
- No-show rate and patterns
- Utilization rate
- Hourly and daily trends

### `/api/insights`
Generates AI-powered insights and recommendations based on clinic data:
- No-show analysis
- Capacity optimization
- Revenue optimization
- Customer retention
- Staff utilization

### `/api/bookings`
CRUD operations for bookings with filtering and pagination

### `/api/import/csv`
Handles CSV file uploads with intelligent data mapping

### `/api/auth/[...nextauth]`
NextAuth.js authentication endpoints

## 🔮 Next Steps (Roadmap)

### Phase 1 - MVP Enhancement ✅ COMPLETED
- [x] Core dashboard with metrics
- [x] AI-driven insights engine
- [x] CSV import functionality
- [x] Authentication system
- [x] Database schema and seeding

### Phase 2 - Bokadirekt Integration (Upcoming)
- [ ] Direct Bokadirekt API integration
- [ ] Real-time booking sync
- [ ] Automated daily imports
- [ ] Two-way data synchronization

### Phase 3 - Advanced AI Features (Upcoming)
- [ ] Predictive no-show scoring for individual bookings
- [ ] Dynamic pricing recommendations
- [ ] Automated staff scheduling optimization
- [ ] Customer lifetime value prediction
- [ ] Treatment package recommendations

### Phase 4 - Automation & Actions (Upcoming)
- [ ] Automated SMS reminders
- [ ] Email marketing campaigns
- [ ] Automated rebooking suggestions
- [ ] Loyalty program management
- [ ] Performance alerts and notifications

### Phase 5 - Corex Integration (Future)
- [ ] Integrate with Corex omnichannel assistant
- [ ] Voice-activated booking queries
- [ ] Conversational analytics
- [ ] Multi-channel customer communication

## 💡 Design Philosophy

### Data-Driven Decisions
Every feature is designed to provide actionable insights that directly impact:
- **Revenue Growth**: Identify upselling opportunities and optimize pricing
- **Cost Reduction**: Minimize no-shows and optimize staff utilization
- **Customer Satisfaction**: Improve retention through personalized service

### Beautiful & Intuitive
- Modern gradient designs
- Responsive layouts for all devices
- Clear visual hierarchy
- Actionable insights prominently displayed

### Production-Ready
- Type-safe TypeScript throughout
- Comprehensive error handling
- Optimized database queries
- Secure authentication
- Scalable architecture

## 🔒 Security Features
- Password hashing with bcrypt
- CSRF protection via NextAuth
- SQL injection prevention via Prisma
- Environment variable protection
- Secure session management

## 📊 Performance
- Server-side rendering for fast initial loads
- Optimized database queries with indexes
- Lazy loading for charts and visualizations
- Static page generation where possible

## 🎓 Development Guidelines

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Consistent component structure
- Clear naming conventions

### Database
- Prisma migrations for schema changes
- Indexes on frequently queried fields
- Proper relations and cascade deletes
- Transaction support for data integrity

### API Design
- RESTful endpoints
- Consistent error responses
- Pagination for large datasets
- Proper HTTP status codes

## 📝 Notes

This is the **foundational MVP** of Flow. The current implementation focuses on:
1. Establishing a solid technical foundation
2. Proving the AI insights concept with real data
3. Creating a beautiful, intuitive user experience
4. Setting up scalable architecture for future features

The platform is ready to onboard pilot clinics and iterate based on real usage data.

---

**Built with ❤️ for beauty and health clinics**
