import { DisplayMode, SubscriptionTier } from '@/lib/client-types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface NavItem {
  href: string
  icon: string // lucide icon name
  label: string
  requiredTier?: SubscriptionTier[] // if not set, available to all tiers
  badge?: string // e.g. "BETA", "NY"
}

export interface NavSection {
  title: string
  items: NavItem[]
  defaultOpen?: boolean
  superAdminOnly?: boolean
}

export interface NavConfig {
  mode: DisplayMode
  sections: NavSection[]
}

// ─────────────────────────────────────────────────────────────────────────────
// KIOSK Mode — Touch-first, corridor-friendly, max 5 items
// ─────────────────────────────────────────────────────────────────────────────

export const kioskNavConfig: NavConfig = {
  mode: DisplayMode.KIOSK,
  sections: [
    {
      title: 'Kiosk',
      defaultOpen: true,
      items: [
        {
          href: '/dashboard/schedule',
          icon: 'CalendarDays',
          label: 'Dagens Schema',
        },
        {
          href: '/dashboard/loyalty/scan',
          icon: 'QrCode',
          label: 'Skanna Lojalitetskort',
        },
        {
          href: '/dashboard/risk-alerts',
          icon: 'ShieldAlert',
          label: 'No-Show Varningar',
        },
        {
          href: '/dashboard/staff',
          icon: 'Users',
          label: 'Personal Idag',
        },
        {
          href: '/dashboard/staff/timesheet',
          icon: 'Clock',
          label: 'Stämpla In/Ut',
        },
      ],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONS Mode — Admin daily use, ~10 items, grouped sections
// ─────────────────────────────────────────────────────────────────────────────

export const operationsNavConfig: NavConfig = {
  mode: DisplayMode.OPERATIONS,
  sections: [
    {
      title: 'Drift',
      defaultOpen: true,
      items: [
        {
          href: '/dashboard/schedule',
          icon: 'CalendarDays',
          label: 'Dagens Schema',
        },
        {
          href: '/dashboard/capacity',
          icon: 'Gauge',
          label: 'Kapacitetsprognos',
        },
        {
          href: '/dashboard/staff',
          icon: 'Users',
          label: 'Personalöversikt',
        },
        {
          href: '/dashboard/staff/timesheet',
          icon: 'Clock',
          label: 'Tidrapporter',
        },
      ],
    },
    {
      title: 'Kunder',
      defaultOpen: true,
      items: [
        {
          href: '/dashboard/customers',
          icon: 'UsersRound',
          label: 'Kundöversikt',
        },
        {
          href: '/dashboard/loyalty',
          icon: 'LayoutDashboard',
          label: 'Lojalitet',
        },
        {
          href: '/dashboard/risk-alerts',
          icon: 'ShieldAlert',
          label: 'No-Show Risk',
        },
      ],
    },
    {
      title: 'Marknadsföring',
      defaultOpen: false,
      items: [
        {
          href: '/dashboard/marketing-triggers',
          icon: 'Zap',
          label: 'Marketing Triggers',
        },
        {
          href: '/dashboard/newsletters',
          icon: 'MessageSquare',
          label: 'Nyhetsbrev',
        },
      ],
    },
    {
      title: 'Inställningar',
      defaultOpen: false,
      items: [
        {
          href: '/dashboard/settings',
          icon: 'Settings',
          label: 'Inställningar',
        },
        {
          href: '/dashboard/billing',
          icon: 'CreditCard',
          label: 'Prenumeration',
        },
      ],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL Mode — Everything, collapsible sections
// ─────────────────────────────────────────────────────────────────────────────

export const fullNavConfig: NavConfig = {
  mode: DisplayMode.FULL,
  sections: [
    {
      title: 'Drift',
      defaultOpen: true,
      items: [
        {
          href: '/dashboard/schedule',
          icon: 'CalendarDays',
          label: 'Dagens Schema',
        },
        {
          href: '/dashboard/capacity',
          icon: 'Gauge',
          label: 'Kapacitetsprognos',
        },
        {
          href: '/dashboard/staff',
          icon: 'Users',
          label: 'Personalöversikt',
        },
        {
          href: '/dashboard/staff/schedule',
          icon: 'CalendarDays',
          label: 'Veckoschema',
        },
        {
          href: '/dashboard/staff/timesheet',
          icon: 'Clock',
          label: 'Tidrapporter & Stämpling',
        },
        {
          href: '/dashboard/staff/leave',
          icon: 'CalendarRange',
          label: 'Semester & Frånvaro',
        },
      ],
    },
    {
      title: 'Kunder',
      defaultOpen: true,
      items: [
        {
          href: '/dashboard/customers',
          icon: 'UsersRound',
          label: 'Kundöversikt',
        },
        {
          href: '/dashboard/at-risk',
          icon: 'ShieldAlert',
          label: 'Customer Health',
        },
        {
          href: '/dashboard/tags',
          icon: 'Tag',
          label: 'Tag Manager',
        },
        {
          href: '/dashboard/segments',
          icon: 'Target',
          label: 'Kundsegment',
        },
      ],
    },
    {
      title: 'Lojalitet',
      defaultOpen: false,
      items: [
        {
          href: '/dashboard/loyalty',
          icon: 'LayoutDashboard',
          label: 'Översikt',
        },
        {
          href: '/dashboard/loyalty/scan',
          icon: 'QrCode',
          label: 'Skanna QR',
        },
        {
          href: '/dashboard/loyalty/members',
          icon: 'UsersRound',
          label: 'Medlemmar',
        },
        {
          href: '/dashboard/loyalty/programs/new',
          icon: 'Star',
          label: 'Program',
        },
      ],
    },
    {
      title: 'Marknadsföring',
      defaultOpen: false,
      items: [
        {
          href: '/dashboard/marketing-triggers',
          icon: 'Zap',
          label: 'Marketing Triggers',
        },
        {
          href: '/dashboard/newsletters',
          icon: 'MessageSquare',
          label: 'Nyhetsbrev',
        },
        {
          href: '/dashboard/competitors',
          icon: 'Activity',
          label: 'Konkurrensanalys',
        },
      ],
    },
    {
      title: 'Ekonomi & Analys',
      defaultOpen: false,
      items: [
        {
          href: '/dashboard/analytics',
          icon: 'BarChart3',
          label: 'Business Metrics',
        },
        {
          href: '/dashboard/cash-flow',
          icon: 'ArrowRightLeft',
          label: 'Kassaflödesanalys',
        },
        {
          href: '/dashboard/liquidity-forecast',
          icon: 'TrendingUp',
          label: 'Likviditetsplanering',
        },
      ],
    },
    {
      title: 'AI Autopilot',
      defaultOpen: false,
      items: [
        {
          href: '/dashboard/actions',
          icon: 'Sparkles',
          label: 'Corex Rekommendationer',
        },
        {
          href: '/dashboard/insights',
          icon: 'TrendingUp',
          label: 'AI Insikter',
        },
      ],
    },
    {
      title: 'Data',
      defaultOpen: false,
      items: [
        {
          href: '/dashboard/import',
          icon: 'Upload',
          label: 'Importera CSV',
        },
        {
          href: '#weekly-report',
          icon: 'Mail',
          label: 'Skicka veckorapport',
          badge: 'E-POST',
        },
      ],
    },
    {
      title: 'Inställningar',
      defaultOpen: false,
      items: [
        {
          href: '/dashboard/settings',
          icon: 'Settings',
          label: 'Funktioner & Integrationer',
        },
        {
          href: '/dashboard/settings/bokadirekt',
          icon: 'ExternalLink',
          label: 'Bokadirekt-synk',
        },
        {
          href: '/dashboard/settings/display',
          icon: 'Monitor',
          label: 'Visningsinställningar',
        },
        {
          href: '/dashboard/billing',
          icon: 'CreditCard',
          label: 'Prenumeration & Fakturering',
        },
        {
          href: '/dashboard/referrals',
          icon: 'Gift',
          label: 'Hänvisa & Tjäna',
        },
        {
          href: '/settings/bank',
          icon: 'Building',
          label: 'Bank-integration',
        },
      ],
    },
    {
      title: 'LABS',
      defaultOpen: false,
      superAdminOnly: true,
      items: [
        {
          href: '/revenue-pro',
          icon: 'DollarSign',
          label: 'Revenue Intelligence Pro',
          badge: 'LABS',
        },
        {
          href: '/dashboard/simulator',
          icon: 'Activity',
          label: 'Revenue Simulator',
          badge: 'LABS',
        },
        {
          href: '/dashboard/ab-testing',
          icon: 'Target',
          label: 'A/B Testing',
          badge: 'LABS',
        },
        {
          href: '/dashboard/marketplace',
          icon: 'ExternalLink',
          label: 'Marketplace',
          badge: 'LABS',
        },
      ],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Config lookup
// ─────────────────────────────────────────────────────────────────────────────

export function getNavConfig(mode: DisplayMode): NavConfig {
  switch (mode) {
    case DisplayMode.KIOSK:
      return kioskNavConfig
    case DisplayMode.OPERATIONS:
      return operationsNavConfig
    case DisplayMode.FULL:
    default:
      return fullNavConfig
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon name → Lucide component mapping (used in dynamic-nav)
// ─────────────────────────────────────────────────────────────────────────────

export const ICON_NAMES = [
  'CalendarDays',
  'QrCode',
  'ShieldAlert',
  'Users',
  'Clock',
  'Gauge',
  'UsersRound',
  'LayoutDashboard',
  'Zap',
  'MessageSquare',
  'Settings',
  'CreditCard',
  'Tag',
  'Target',
  'Star',
  'Activity',
  'BarChart3',
  'ArrowRightLeft',
  'TrendingUp',
  'Sparkles',
  'Upload',
  'Mail',
  'ExternalLink',
  'Monitor',
  'Gift',
  'Building',
  'DollarSign',
  'CalendarRange',
] as const

export type IconName = (typeof ICON_NAMES)[number]
