
// ============================================
// BILLING & SUBSCRIPTION UTILITIES
// Wave 4D - October 2025
// ============================================

import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

export const PRICING_TIERS = {
  INTERNAL: {
    name: 'Internal (Arch Clinic)',
    price: 0,
    currency: 'SEK',
    interval: 'month',
    bookingsLimit: null, // unlimited
    features: [
      'Alla funktioner',
      'Experimentella LABS-moduler',
      'Revenue Intelligence Pro',
      'Bank-integration (GoCardless)',
      'Alla premium-funktioner',
      'Testbench för nya features',
    ],
  },
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'SEK',
    interval: 'month',
    bookingsLimit: 50,
    features: [
      'Upp till 50 bokningar/månad',
      'Grundläggande dashboard',
      'Enkel bokningsöversikt',
      'No-show påminnelser',
      'E-postnotiser',
      'Community support',
    ],
  },
  BASIC: {
    name: 'Basic',
    price: 999,
    currency: 'SEK',
    interval: 'month',
    bookingsLimit: 300,
    features: [
      'Upp till 300 bokningar/månad',
      'Grundläggande analys',
      'No-show förutsägelse',
      'Kapacitetsoptimering',
      'E-postrapporter',
      'Bokadirekt-integration',
      'Standard support',
    ],
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 2499,
    currency: 'SEK',
    interval: 'month',
    bookingsLimit: null, // unlimited
    features: [
      'Obegränsat antal bokningar',
      'Avancerad analys & AI-rekommendationer',
      'Revenue Intelligence',
      'Customer Health Scoring',
      'Meta Marketing ROI-tracking',
      'Kapacitetsplanering Pro',
      'Dynamisk prissättning',
      'Retention Autopilot',
      'Automatiska kampanjer',
      'Prioriterad support',
      'API-åtkomst',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 4999,
    currency: 'SEK',
    interval: 'month',
    bookingsLimit: null, // unlimited
    features: [
      'Allt i Professional',
      'Multi-klinik hantering',
      'White-label möjlighet',
      'Anpassade integrationer',
      'Dedikerad Customer Success Manager',
      'SLA-garanti (99.9% uptime)',
      'Anpassad onboarding & träning',
      'Avancerad API-åtkomst',
      'Prioriterad feature requests',
      '24/7 prioriterad support',
    ],
  },
} as const;

export function getTierPrice(tier: SubscriptionTier, billingInterval: 'MONTHLY' | 'YEARLY' = 'MONTHLY'): number {
  const monthlyPrice = PRICING_TIERS[tier].price;
  
  if (billingInterval === 'YEARLY') {
    // 20% discount for yearly billing
    const yearlyPrice = monthlyPrice * 12 * 0.8;
    return Math.round(yearlyPrice);
  }
  
  return monthlyPrice;
}

export function getEffectiveMonthlyPrice(tier: SubscriptionTier, billingInterval: 'MONTHLY' | 'YEARLY' = 'MONTHLY'): number {
  if (billingInterval === 'YEARLY') {
    const yearlyPrice = getTierPrice(tier, 'YEARLY');
    return Math.round(yearlyPrice / 12);
  }
  return PRICING_TIERS[tier].price;
}

export function getTierFeatures(tier: SubscriptionTier): readonly string[] {
  return PRICING_TIERS[tier].features;
}

export function getTierLimit(tier: SubscriptionTier): number | null {
  return PRICING_TIERS[tier].bookingsLimit;
}

export function calculateTrialEndDate(): Date {
  const trialDays = 14;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + trialDays);
  return endDate;
}

export function calculatePeriodEnd(startDate: Date, billingInterval: 'MONTHLY' | 'YEARLY' = 'MONTHLY'): Date {
  const endDate = new Date(startDate);
  
  if (billingInterval === 'YEARLY') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `INV-${year}-${random}`;
}

export function isTrialExpiringSoon(trialEnd: Date | null): boolean {
  if (!trialEnd) return false;
  const daysUntilExpiry = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
}

export function isTrialExpired(trialEnd: Date | null): boolean {
  if (!trialEnd) return false;
  return new Date() > trialEnd;
}

export function formatPrice(amount: number, currency: string = 'SEK'): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getSubscriptionStatusBadge(status: SubscriptionStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  switch (status) {
    case 'TRIAL':
      return { label: 'Trial', variant: 'secondary' };
    case 'ACTIVE':
      return { label: 'Aktiv', variant: 'default' };
    case 'PAST_DUE':
      return { label: 'Förfallen', variant: 'destructive' };
    case 'CANCELLED':
      return { label: 'Avslutad', variant: 'outline' };
    case 'EXPIRED':
      return { label: 'Utgången', variant: 'destructive' };
    default:
      return { label: status, variant: 'outline' };
  }
}

export function calculateMRR(subscriptions: Array<{ tier: SubscriptionTier; status: SubscriptionStatus }>) {
  return subscriptions
    .filter(sub => sub.status === 'ACTIVE' || sub.status === 'TRIAL')
    .reduce((sum, sub) => sum + getTierPrice(sub.tier), 0);
}

export function calculateChurnRate(
  activeLastMonth: number,
  cancelledThisMonth: number
): number {
  if (activeLastMonth === 0) return 0;
  return (cancelledThisMonth / activeLastMonth) * 100;
}
