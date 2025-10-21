
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Building2, Users, Settings, BarChart3, MessageSquare, Phone, CreditCard, Mic, Monitor, Webhook, Smartphone } from "lucide-react"
import { ClinicSelector } from "@/components/superadmin/clinic-selector"
import { ViewingBanner } from "@/components/superadmin/viewing-banner"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  // Check if user is SuperAdmin
  if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SuperAdmin Header */}
      <div className="border-b bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center gap-2 md:gap-6">
            <Link href="/superadmin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">SA</span>
              </div>
              <span className="font-semibold text-base md:text-lg hidden sm:inline">SuperAdmin</span>
            </Link>
            <nav className="flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-hide max-w-[50vw] md:max-w-none">
              <Link href="/superadmin">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <Home className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/superadmin/clinics">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <Building2 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Clinics</span>
                </Button>
              </Link>
              <Link href="/superadmin/users">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <Users className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Users</span>
                </Button>
              </Link>
              <Link href="/superadmin/sms">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <MessageSquare className="h-4 w-4 md:mr-2" />
                  <span className="hidden lg:inline">SMS & Kampanjer</span>
                </Button>
              </Link>
              <Link href="/superadmin/voice-settings">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <Phone className="h-4 w-4 md:mr-2" />
                  <span className="hidden lg:inline">Voice & TTS</span>
                </Button>
              </Link>
              <Link href="/superadmin/stt-providers">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <Mic className="h-4 w-4 md:mr-2" />
                  <span className="hidden lg:inline">STT Providers</span>
                </Button>
              </Link>
              <Link href="/superadmin/analytics">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <BarChart3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Analytics</span>
                </Button>
              </Link>
              <Link href="/superadmin/billing">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <CreditCard className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Billing</span>
                </Button>
              </Link>
              <Link href="/superadmin/display-config">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <Monitor className="h-4 w-4 md:mr-2" />
                  <span className="hidden lg:inline">Display Config</span>
                </Button>
              </Link>
              <Link href="/superadmin/ghl-config">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <Webhook className="h-4 w-4 md:mr-2" />
                  <span className="hidden lg:inline">GHL Config</span>
                </Button>
              </Link>
              <Link href="/superadmin/46elks-subaccounts">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <Smartphone className="h-4 w-4 md:mr-2" />
                  <span className="hidden lg:inline">46elks</span>
                </Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ClinicSelector />
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Visa som användare
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content with ViewingBanner */}
      <main className="p-8">
        <ViewingBanner />
        {children}
      </main>
    </div>
  )
}
