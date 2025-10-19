
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Building2, Users, Settings, BarChart3, MessageSquare, Phone, CreditCard, Mic, Monitor } from "lucide-react"
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
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-6">
            <Link href="/superadmin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">SA</span>
              </div>
              <span className="font-semibold text-lg">SuperAdmin</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/superadmin">
                <Button variant="ghost" size="sm">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/superadmin/clinics">
                <Button variant="ghost" size="sm">
                  <Building2 className="mr-2 h-4 w-4" />
                  Clinics
                </Button>
              </Link>
              <Link href="/superadmin/users">
                <Button variant="ghost" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Button>
              </Link>
              <Link href="/superadmin/sms">
                <Button variant="ghost" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  SMS & Kampanjer
                </Button>
              </Link>
              <Link href="/superadmin/voice-settings">
                <Button variant="ghost" size="sm">
                  <Phone className="mr-2 h-4 w-4" />
                  Voice & TTS
                </Button>
              </Link>
              <Link href="/superadmin/stt-providers">
                <Button variant="ghost" size="sm">
                  <Mic className="mr-2 h-4 w-4" />
                  STT Providers
                </Button>
              </Link>
              <Link href="/superadmin/analytics">
                <Button variant="ghost" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href="/superadmin/billing">
                <Button variant="ghost" size="sm">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Button>
              </Link>
              <Link href="/superadmin/display-config">
                <Button variant="ghost" size="sm">
                  <Monitor className="mr-2 h-4 w-4" />
                  Display Config
                </Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ClinicSelector />
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                View as User
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
