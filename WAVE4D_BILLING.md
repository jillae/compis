
# WAVE 4D: BILLING & SUBSCRIPTION MANAGEMENT

## Implementation Status: 🚧 IN PROGRESS

### Business Goals
- Enable monetization through subscription billing
- Automate payment processing and invoice generation
- Provide self-service billing portal for clinics
- Track MRR, churn, and revenue metrics
- Support multiple payment methods (Stripe/Swish)

### Technical Components

#### 1. Database Schema Extensions
✅ Existing: SubscriptionTier, SubscriptionStatus enums
🆕 Adding:
- Subscription model (tracks active subscriptions)
- Invoice model (generated monthly)
- Payment model (payment attempts & history)
- BillingAlert model (failed payments, expiring trials)

#### 2. API Endpoints
- `POST /api/billing/subscribe` - Create new subscription
- `POST /api/billing/cancel` - Cancel subscription
- `POST /api/billing/upgrade` - Upgrade/downgrade tier
- `GET /api/billing/invoices` - List invoices
- `POST /api/billing/payment-method` - Update payment method
- `GET /api/billing/usage` - Current usage metrics

#### 3. UI Components
- `/dashboard/billing` - Billing dashboard
- `/dashboard/billing/invoices` - Invoice history
- `/dashboard/billing/upgrade` - Upgrade flow
- Pricing page on landing page with tiers

#### 4. Integrations
- Stripe for payments (primary)
- Swish for Swedish mobile payments
- Email notifications for billing events

### Features

#### Admin Features
- View current plan & usage
- Upgrade/downgrade subscription
- Update payment method
- Download invoices (PDF)
- Cancel subscription
- Trial countdown

#### Super Admin Features
- MRR dashboard
- Churn metrics
- Revenue forecasting
- Failed payment alerts
- Customer lifetime value

### Pricing Tiers

**BASIC** - 499 SEK/månad
- Up to 500 bookings/month
- Basic analytics
- No-show prediction
- Email reports

**PROFESSIONAL** - 1499 SEK/månad
- Unlimited bookings
- Advanced analytics
- AI recommendations
- Meta Ads integration
- Capacity forecasting
- Dynamic pricing
- Priority support

**ENTERPRISE** - 2999+ SEK/månad
- Everything in Professional
- Custom integrations
- Dedicated success manager
- White-label option
- API access
- SLA guarantee

### Implementation Phases

#### Phase 1: Database & Core Logic ✅
- Schema updates
- Billing calculation logic
- Invoice generation

#### Phase 2: Stripe Integration 🚧
- Stripe setup
- Webhook handling
- Payment processing

#### Phase 3: UI & Dashboard 📋
- Billing dashboard
- Invoice list
- Upgrade/cancel flows

#### Phase 4: Notifications & Alerts 📋
- Email notifications
- Failed payment recovery
- Trial expiration reminders

---
**Started:** October 15, 2025
**Target Completion:** October 16, 2025
**Impact:** Enable monetization, ~500k SEK MRR potential with 50 clinics
