
// Module Registry - Defines all modules in the system
// This is the single source of truth for module definitions

import { ModuleStatus, SubscriptionTier } from '@prisma/client'

export interface ModuleDefinition {
  key: string
  name: string
  description: string
  icon: string // lucide-react icon name
  category: 'core' | 'premium' | 'labs'
  status: ModuleStatus
  order: number
  availableForTiers: SubscriptionTier[]
  route?: string // Navigation route
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // CORE MODULES (All tiers)
  {
    key: 'dashboard',
    name: 'Dashboard',
    description: 'Översikt av nyckeltal och insights',
    icon: 'LayoutDashboard',
    category: 'core',
    status: 'STABLE',
    order: 1,
    availableForTiers: ['INTERNAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'],
    route: '/dashboard',
  },
  {
    key: 'bookings',
    name: 'Bokningar',
    description: 'Hantera och övervaka bokningar',
    icon: 'Calendar',
    category: 'core',
    status: 'STABLE',
    order: 2,
    availableForTiers: ['INTERNAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'],
    route: '/bookings',
  },
  {
    key: 'customers',
    name: 'Kunder',
    description: 'Kundregister och kommunikation',
    icon: 'Users',
    category: 'core',
    status: 'STABLE',
    order: 3,
    availableForTiers: ['INTERNAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'],
    route: '/customers',
  },
  {
    key: 'analytics',
    name: 'Analyser',
    description: 'Affärsanalyser och rapporter',
    icon: 'BarChart3',
    category: 'core',
    status: 'STABLE',
    order: 4,
    availableForTiers: ['INTERNAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'],
    route: '/analytics',
  },

  // PREMIUM MODULES (Professional & Enterprise)
  {
    key: 'campaigns',
    name: 'Kampanjer',
    description: 'SMS och email-kampanjer',
    icon: 'Megaphone',
    category: 'premium',
    status: 'STABLE',
    order: 5,
    availableForTiers: ['INTERNAL', 'PROFESSIONAL', 'ENTERPRISE'],
    route: '/campaigns',
  },
  {
    key: 'ai_recommendations',
    name: 'AI Rekommendationer',
    description: 'AI-drivna förslag för att öka intäkter',
    icon: 'Sparkles',
    category: 'premium',
    status: 'STABLE',
    order: 6,
    availableForTiers: ['INTERNAL', 'PROFESSIONAL', 'ENTERPRISE'],
    route: '/ai/recommendations',
  },
  {
    key: 'dynamic_pricing',
    name: 'Dynamisk Prissättning',
    description: 'AI-optimerade priser baserat på efterfrågan',
    icon: 'TrendingUp',
    category: 'premium',
    status: 'STABLE',
    order: 7,
    availableForTiers: ['INTERNAL', 'PROFESSIONAL', 'ENTERPRISE'],
    route: '/pricing',
  },
  {
    key: 'staff_management',
    name: 'Personalhantering',
    description: 'Schema, ledighet och tidsrapportering',
    icon: 'UserCog',
    category: 'premium',
    status: 'STABLE',
    order: 8,
    availableForTiers: ['INTERNAL', 'PROFESSIONAL', 'ENTERPRISE'],
    route: '/staff',
  },

  // ENTERPRISE MODULES
  {
    key: 'competitive_intelligence',
    name: 'Konkurrentanalys',
    description: 'Övervaka konkurrenters priser och erbjudanden',
    icon: 'Target',
    category: 'premium',
    status: 'BETA',
    order: 9,
    availableForTiers: ['INTERNAL', 'ENTERPRISE'],
    route: '/competitive',
  },
  {
    key: 'voice_assistant',
    name: 'Röstassistent',
    description: 'AI-driven telefonihantering',
    icon: 'Phone',
    category: 'premium',
    status: 'BETA',
    order: 10,
    availableForTiers: ['INTERNAL', 'ENTERPRISE'],
    route: '/voice',
  },

  // LABS MODULES (Only for INTERNAL tier - Arch Clinic)
  {
    key: 'revenue_intelligence_pro',
    name: 'Revenue Intelligence Pro',
    description: 'Djupgående ekonomiska insikter med bank-integration',
    icon: 'DollarSign',
    category: 'labs',
    status: 'LABS',
    order: 100,
    availableForTiers: ['INTERNAL'],
    route: '/revenue-pro',
  },
  {
    key: 'bank_integration',
    name: 'Bank-integration',
    description: 'Realtidsdata från bankkonto (GoCardless)',
    icon: 'Building',
    category: 'labs',
    status: 'LABS',
    order: 101,
    availableForTiers: ['INTERNAL'],
    route: '/settings/bank',
  },
]

// Helper functions
export function getModuleByKey(key: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.key === key)
}

export function getModulesByTier(tier: SubscriptionTier): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.availableForTiers.includes(tier))
}

export function getModulesByCategory(category: string): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.category === category)
}

export function getModulesByStatus(status: ModuleStatus): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.status === status)
}

export function isModuleAvailableForTier(
  moduleKey: string,
  tier: SubscriptionTier
): boolean {
  const module = getModuleByKey(moduleKey)
  return module ? module.availableForTiers.includes(tier) : false
}
