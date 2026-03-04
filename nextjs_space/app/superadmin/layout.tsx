import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Building2,
  Users,
  Monitor,
  Webhook,
  Shield,
  Receipt,
  Smartphone,
  MessageSquare,
  Phone,
  Mic,
  Ticket,
  HelpCircle,
  BarChart3,
  CreditCard,
  TrendingUp,
  Key,
  ClipboardList,
  Menu,
  ChevronDown,
} from "lucide-react"
import { ClinicSelector } from "@/components/superadmin/clinic-selector"
import { ViewingBanner } from "@/components/superadmin/viewing-banner"

// --- Nav structure ---
const navSections = [
  {
    label: "Drift",
    collapsible: false,
    items: [
      { href: "/superadmin", icon: Home, label: "Dashboard" },
      { href: "/superadmin/clinics", icon: Building2, label: "Kliniker" },
      { href: "/superadmin/users", icon: Users, label: "Användare" },
    ],
  },
  {
    label: "Konfiguration",
    collapsible: true,
    items: [
      { href: "/superadmin/display-config", icon: Monitor, label: "Display Config" },
      { href: "/superadmin/ghl-config", icon: Webhook, label: "GHL Config" },
      { href: "/superadmin/meta-config", icon: Shield, label: "Meta Config" },
      { href: "/superadmin/fortnox-config", icon: Receipt, label: "Fortnox" },
      { href: "/superadmin/46elks-subaccounts", icon: Smartphone, label: "46elks Subkonton" },
    ],
  },
  {
    label: "Kommunikation",
    collapsible: true,
    items: [
      { href: "/superadmin/sms", icon: MessageSquare, label: "SMS & Kampanjer" },
      { href: "/superadmin/voice-settings", icon: Phone, label: "Voice & TTS" },
      { href: "/superadmin/stt-providers", icon: Mic, label: "STT Providers" },
      { href: "/superadmin/voice-tickets", icon: Ticket, label: "Voice Tickets" },
      { href: "/superadmin/faq", icon: HelpCircle, label: "FAQ" },
    ],
  },
  {
    label: "Business",
    collapsible: true,
    items: [
      { href: "/superadmin/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/superadmin/billing", icon: CreditCard, label: "Billing" },
      { href: "/superadmin/flow-roi", icon: TrendingUp, label: "Flow ROI" },
      { href: "/superadmin/licenses", icon: Key, label: "Licenser" },
      { href: "/superadmin/beta-applications", icon: ClipboardList, label: "Beta-ansökningar" },
    ],
  },
]

// --- Sidebar content (shared between desktop & mobile Sheet) ---
function SidebarContent() {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <Link href="/superadmin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">SA</span>
          </div>
          <span className="font-semibold text-slate-100 text-base">SuperAdmin</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500 select-none">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 rounded-md text-slate-300 hover:text-slate-100 hover:bg-slate-700/70 transition-colors min-h-[44px]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-700 px-4 py-3">
        <p className="text-[11px] text-slate-600">KlinikFlow v1.0</p>
      </div>
    </div>
  )
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Check if user is SuperAdmin — string comparison, NO @prisma/client
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 bg-slate-900 text-slate-200 fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {/* Main area: offset by sidebar width on desktop */}
      <div className="flex-1 md:ml-[240px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Left: mobile hamburger + SA badge */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-11 w-11"
                  aria-label="Öppna meny"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[240px] bg-slate-900 text-slate-200 border-r border-slate-700">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* SA badge (desktop shows next to sidebar brand; mobile acts as identity) */}
            <Link href="/superadmin" className="flex items-center gap-2 md:hidden">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">SA</span>
              </div>
              <span className="font-semibold text-sm">SuperAdmin</span>
            </Link>
          </div>

          {/* Right: ClinicSelector + Visa som klinik */}
          <div className="flex items-center gap-2 md:gap-3">
            <ClinicSelector />
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-[36px] text-xs md:text-sm">
                Visa som klinik
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <ViewingBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
