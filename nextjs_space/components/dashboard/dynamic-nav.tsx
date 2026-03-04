'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  CalendarDays,
  QrCode,
  ShieldAlert,
  Users,
  Clock,
  Gauge,
  UsersRound,
  LayoutDashboard,
  Zap,
  MessageSquare,
  Settings,
  CreditCard,
  Tag,
  Target,
  Star,
  Activity,
  BarChart3,
  ArrowRightLeft,
  TrendingUp,
  Sparkles,
  Upload,
  Mail,
  ExternalLink,
  Monitor,
  Gift,
  Building,
  DollarSign,
  CalendarRange,
  Menu,
  LogOut,
  ChevronDown,
  ChevronUp,
  Wrench,
  LayoutGrid,
  MonitorSpeaker,
  LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

import { UserRole, DisplayMode, SubscriptionTier } from '@/lib/client-types'
import {
  getNavConfig,
  NavItem,
  NavSection,
} from '@/lib/navigation/nav-config'

// ─────────────────────────────────────────────────────────────────────────────
// Icon registry
// ─────────────────────────────────────────────────────────────────────────────

const iconRegistry: Record<string, LucideIcon> = {
  CalendarDays,
  QrCode,
  ShieldAlert,
  Users,
  Clock,
  Gauge,
  UsersRound,
  LayoutDashboard,
  Zap,
  MessageSquare,
  Settings,
  CreditCard,
  Tag,
  Target,
  Star,
  Activity,
  BarChart3,
  ArrowRightLeft,
  TrendingUp,
  Sparkles,
  Upload,
  Mail,
  ExternalLink,
  Monitor,
  Gift,
  Building,
  DollarSign,
  CalendarRange,
}

function getIcon(name: string): LucideIcon {
  return iconRegistry[name] ?? Settings
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface DynamicNavProps {
  /** Initial display mode (from server-side fetch) */
  initialMode?: DisplayMode | string
  /** Clinic subscription tier (from server-side fetch) */
  clinicTier?: SubscriptionTier | string
  /** User role from session — passed from server component to avoid flicker */
  userRole?: UserRole | string
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode display config
// ─────────────────────────────────────────────────────────────────────────────

const modeConfig = {
  [DisplayMode.FULL]: {
    label: 'Fullständigt läge',
    icon: LayoutGrid,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
  },
  [DisplayMode.OPERATIONS]: {
    label: 'Driftläge',
    icon: Wrench,
    color: 'text-green-600',
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200',
  },
  [DisplayMode.KIOSK]: {
    label: 'Kioskläge',
    icon: MonitorSpeaker,
    color: 'text-purple-600',
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
  },
  [DisplayMode.CAMPAIGNS]: {
    label: 'Kampanjläge',
    icon: Zap,
    color: 'text-orange-600',
    bg: 'bg-orange-50 hover:bg-orange-100',
    border: 'border-orange-200',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isAdminOrAbove(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
}

function canSwitchMode(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
}

function filterSections(
  sections: NavSection[],
  userRole: UserRole,
  tier: SubscriptionTier
): NavSection[] {
  return sections
    .filter((section) => {
      // LABS section: SUPER_ADMIN only
      if (section.superAdminOnly && userRole !== UserRole.SUPER_ADMIN) {
        return false
      }
      return true
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.requiredTier) return true
        return item.requiredTier.includes(tier)
      }),
    }))
    .filter((section) => section.items.length > 0)
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function NavItemButton({
  item,
  onClose,
  onWeeklyReport,
}: {
  item: NavItem
  onClose: () => void
  onWeeklyReport?: () => void
}) {
  const Icon = getIcon(item.icon)

  if (item.href === '#weekly-report') {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start min-h-[44px] text-sm"
        onClick={onWeeklyReport}
      >
        <Icon className="h-4 w-4 mr-3 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-1">
            {item.badge}
          </span>
        )}
      </Button>
    )
  }

  return (
    <Link href={item.href} onClick={onClose}>
      <Button
        variant="ghost"
        className="w-full justify-start min-h-[44px] text-sm"
      >
        <Icon className="h-4 w-4 mr-3 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-1">
            {item.badge}
          </span>
        )}
      </Button>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONS sidebar content (flat sections, no collapsible)
// ─────────────────────────────────────────────────────────────────────────────

function OperationsNavContent({
  sections,
  onClose,
  onWeeklyReport,
}: {
  sections: NavSection[]
  onClose: () => void
  onWeeklyReport: () => void
}) {
  return (
    <div className="mt-6 space-y-5">
      {sections.map((section) => (
        <div key={section.title} className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-1">
            {section.title}
          </h3>
          {section.items.map((item) => (
            <NavItemButton
              key={item.href}
              item={item}
              onClose={onClose}
              onWeeklyReport={onWeeklyReport}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL collapsible sections
// ─────────────────────────────────────────────────────────────────────────────

function CollapsibleSection({
  section,
  onClose,
  onWeeklyReport,
  isLabs,
}: {
  section: NavSection
  onClose: () => void
  onWeeklyReport: () => void
  isLabs?: boolean
}) {
  const [open, setOpen] = useState(section.defaultOpen ?? false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center justify-between px-1 py-1 rounded transition-colors',
            isLabs
              ? 'text-yellow-600 hover:bg-yellow-50'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <h3
            className={cn(
              'text-xs font-semibold uppercase tracking-widest',
              isLabs ? 'text-yellow-600' : ''
            )}
          >
            {isLabs ? '🧪 ' : ''}
            {section.title}
          </h3>
          {open ? (
            <ChevronUp className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 mt-1">
          {section.items.map((item) => (
            <NavItemButton
              key={item.href}
              item={item}
              onClose={onClose}
              onWeeklyReport={onWeeklyReport}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function FullNavContent({
  sections,
  onClose,
  onWeeklyReport,
}: {
  sections: NavSection[]
  onClose: () => void
  onWeeklyReport: () => void
}) {
  return (
    <div className="mt-6 space-y-3">
      {sections.map((section) => (
        <CollapsibleSection
          key={section.title}
          section={section}
          onClose={onClose}
          onWeeklyReport={onWeeklyReport}
          isLabs={section.superAdminOnly}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode-switcher pill (ADMIN/SUPER_ADMIN only)
// ─────────────────────────────────────────────────────────────────────────────

function ModeSwitcherPill({
  currentMode,
  onSwitch,
  isLoading,
}: {
  currentMode: DisplayMode
  onSwitch: (mode: DisplayMode) => void
  isLoading: boolean
}) {
  const modes = [DisplayMode.KIOSK, DisplayMode.OPERATIONS, DisplayMode.FULL]

  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
        Visningsläge
      </p>
      <div className="flex gap-1">
        {modes.map((mode) => {
          const cfg = modeConfig[mode]
          const Icon = cfg.icon
          const isActive = currentMode === mode
          return (
            <button
              key={mode}
              disabled={isLoading}
              onClick={() => onSwitch(mode)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-[10px] font-medium transition-all min-h-[44px]',
                isActive
                  ? cn(cfg.bg, cfg.border, cfg.color, 'shadow-sm')
                  : 'border-transparent text-muted-foreground hover:bg-muted'
              )}
              title={cfg.label}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? cfg.color : '')} />
              <span className="leading-tight text-center">
                {mode === DisplayMode.FULL
                  ? 'Full'
                  : mode === DisplayMode.OPERATIONS
                    ? 'Drift'
                    : 'Kiosk'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KIOSK bottom bar — 4 primary items + right-aligned Meny sheet
// ─────────────────────────────────────────────────────────────────────────────

function KioskBottomBar({
  items,
  canSwitchModes,
  currentMode,
  onModeSwitch,
}: {
  items: NavItem[]
  canSwitchModes: boolean
  currentMode: DisplayMode
  onModeSwitch: (mode: DisplayMode) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Take the first 4 items for the bottom bar; rest go into the sheet
  const primaryItems = items.slice(0, 4)

  return (
    <>
      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950 border-t border-zinc-800 flex items-stretch"
        style={{ minHeight: 56 }}
      >
        {/* Primary nav items (left-to-right) */}
        {primaryItems.map((item) => {
          const Icon = getIcon(item.icon)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 min-h-[56px] text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors active:bg-zinc-800"
            >
              <Icon className="h-6 w-6 shrink-0" />
              <span className="text-[10px] font-medium leading-tight text-center px-1">
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Right-aligned Meny button — visually separated with border-left */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-4 min-h-[56px] min-w-[64px] text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors active:bg-zinc-800 border-l border-zinc-800"
          aria-label="Öppna meny"
        >
          <Menu className="h-6 w-6 shrink-0" />
          <span className="text-[10px] font-medium leading-tight">Meny</span>
        </button>
      </nav>

      {/* Spacer so content doesn't hide behind fixed bar */}
      <div className="h-16 pb-safe" aria-hidden />

      {/* Slide-up Meny sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="bottom"
          className="bg-zinc-950 border-t border-zinc-800 rounded-t-2xl text-white px-5 pb-8"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white text-lg">Meny</SheetTitle>
            <SheetDescription className="text-zinc-500 text-sm">
              Alla alternativ och inställningar
            </SheetDescription>
          </SheetHeader>

          {/* All nav items in a grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {items.map((item) => {
              const Icon = getIcon(item.icon)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors min-h-[72px] justify-center text-zinc-300 hover:text-white active:scale-95"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Mode switcher for admins */}
          {canSwitchModes && (
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                Byt visningsläge
              </p>
              <div className="flex gap-3">
                {([DisplayMode.KIOSK, DisplayMode.OPERATIONS, DisplayMode.FULL] as DisplayMode[]).map(
                  (mode) => {
                    const cfg = modeConfig[mode]
                    const Icon = cfg.icon
                    const isActive = currentMode === mode
                    return (
                      <button
                        key={mode}
                        onClick={() => {
                          onModeSwitch(mode)
                          setMenuOpen(false)
                        }}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all min-h-[44px]',
                          isActive
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{cfg.label}</span>
                      </button>
                    )
                  }
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function DynamicNav({
  initialMode = DisplayMode.FULL,
  clinicTier = SubscriptionTier.BASIC,
  userRole: propUserRole,
}: DynamicNavProps) {
  const { data: session } = useSession()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeMode, setActiveMode] = useState<DisplayMode>((initialMode as DisplayMode) || DisplayMode.FULL)
  const [isSwitching, setIsSwitching] = useState(false)

  // Resolve role: prop (server-passed) takes precedence, then session
  const userRole: UserRole =
    (propUserRole as UserRole) ??
    (session?.user?.role as UserRole) ??
    UserRole.STAFF

  // Resolve tier
  const effectiveTier: SubscriptionTier = (clinicTier as SubscriptionTier) || SubscriptionTier.BASIC

  // STAFF always sees what the clinic is set to (OPERATIONS or KIOSK)
  // ADMIN/SUPER_ADMIN see whatever the clinic is set to, and can change it
  const effectiveMode: DisplayMode = (() => {
    if (!isAdminOrAbove(userRole)) {
      // Staff can't override — always follow clinic setting
      // But only OPERATIONS or KIOSK make sense; fallback to OPERATIONS
      return activeMode === DisplayMode.KIOSK
        ? DisplayMode.KIOSK
        : DisplayMode.OPERATIONS
    }
    return activeMode
  })()

  const navConfig = getNavConfig(effectiveMode)
  const filteredSections = filterSections(navConfig.sections, userRole, effectiveTier)

  // ── Weekly report handler ──────────────────────────────────────────────
  const handleWeeklyReport = useCallback(async () => {
    const res = await fetch('/api/email/weekly-report')
    if (res.ok) {
      alert('✅ Veckorapport skickad till din e-post!')
      setSheetOpen(false)
    } else {
      alert('❌ Kunde inte skicka rapport. Försök igen.')
    }
  }, [])

  // ── Mode switch ────────────────────────────────────────────────────────
  const handleModeSwitch = useCallback(
    async (newMode: DisplayMode) => {
      if (newMode === activeMode || isSwitching) return
      setIsSwitching(true)
      try {
        const res = await fetch('/api/clinic/display-mode', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: newMode }),
        })
        if (res.ok) {
          // Full reload so both server layout and client page pick up the new mode
          window.location.reload()
          return
        } else {
          const data = await res.json().catch(() => ({}))
          alert(data?.error ?? 'Kunde inte byta läge.')
        }
      } catch {
        alert('Nätverksfel. Försök igen.')
      } finally {
        setIsSwitching(false)
      }
    },
    [activeMode, isSwitching]
  )

  const canSwitchModes = canSwitchMode(userRole)

  // ── KIOSK: no Sheet, just bottom bar ──────────────────────────────────
  if (effectiveMode === DisplayMode.KIOSK) {
    const kioskItems = filteredSections[0]?.items ?? []
    return (
      <KioskBottomBar
        items={kioskItems}
        canSwitchModes={canSwitchModes}
        currentMode={activeMode}
        onModeSwitch={handleModeSwitch}
      />
    )
  }

  // ── OPERATIONS / FULL: hamburger → Sheet ──────────────────────────────
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Öppna meny">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent className="overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle>Meny</SheetTitle>
          <SheetDescription>Navigering och inställningar</SheetDescription>
        </SheetHeader>

        {/* Nav items */}
        <div className="flex-1">
          {effectiveMode === DisplayMode.OPERATIONS ? (
            <OperationsNavContent
              sections={filteredSections}
              onClose={() => setSheetOpen(false)}
              onWeeklyReport={handleWeeklyReport}
            />
          ) : (
            <FullNavContent
              sections={filteredSections}
              onClose={() => setSheetOpen(false)}
              onWeeklyReport={handleWeeklyReport}
            />
          )}
        </div>

        {/* Mode switcher pill (ADMIN/SUPER_ADMIN only) */}
        {canSwitchModes && (
          <ModeSwitcherPill
            currentMode={activeMode}
            onSwitch={handleModeSwitch}
            isLoading={isSwitching}
          />
        )}

        {/* Logout */}
        <div className="pt-4 border-t mt-4">
          <Button
            variant="destructive"
            className="w-full min-h-[44px]"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logga ut
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
