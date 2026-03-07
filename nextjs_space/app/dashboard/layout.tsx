

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { OnboardingBanner } from "@/components/dashboard/onboarding-banner"
import { UsageLimitBanner } from "@/components/dashboard/usage-limit-banner"
import { UserHeader } from "@/components/layout/user-header"
import { DynamicNav } from "@/components/dashboard/dynamic-nav"
import { prisma } from "@/lib/db"
// Note: server component can use @prisma/client, but we use string literals
// to stay consistent with client-types pattern across the app

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Require authentication
  if (!session) {
    redirect('/auth/login')
  }

  // Fetch user onboarding status, clinic display mode and tier
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      onboardingStep: true,
      onboardingCompletedAt: true,
      clinic: {
        select: {
          activeDisplayMode: true,
          tier: true,
        },
      },
    },
  })

  const activeDisplayMode = (user?.clinic?.activeDisplayMode as string) ?? 'FULL'
  const clinicTier = (user?.clinic?.tier as string) ?? 'BASIC'
  const userRole = session.user.role as string

  const isKiosk = activeDisplayMode === 'KIOSK'

  return (
    <div className={isKiosk ? 'bg-zinc-950 min-h-screen overflow-hidden' : 'min-h-screen bg-background'}>
      {/* ── Top header — hidden in KIOSK mode ── */}
      {!isKiosk && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* User info — left side */}
            <div className="flex items-center gap-3 min-w-0">
              <UserHeader />
            </div>

            {/* Navigation hamburger — RIGHT side */}
            <div className="flex-shrink-0">
              <DynamicNav
                initialMode={activeDisplayMode}
                clinicTier={clinicTier}
                userRole={userRole}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Onboarding & usage banners (not shown in KIOSK or for SUPER_ADMIN) ── */}
      {!isKiosk && (
        <div className="container mx-auto px-4">
          {user && userRole !== 'SUPER_ADMIN' && (
            <OnboardingBanner
              userId={user.id}
              onboardingStep={user.onboardingStep}
              onboardingCompletedAt={user.onboardingCompletedAt}
            />
          )}
          <UsageLimitBanner />
        </div>
      )}

      {/* ── Main content ── */}
      {children}

      {/* ── KIOSK: bottom bar navigation (fixed, no Sheet trigger) ── */}
      {isKiosk && (
        <DynamicNav
          initialMode={activeDisplayMode}
          clinicTier={clinicTier}
          userRole={userRole}
        />
      )}
    </div>
  )
}
