

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { OnboardingBanner } from "@/components/dashboard/onboarding-banner"
import { UserHeader } from "@/components/layout/user-header"
import { prisma } from "@/lib/db"

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

  // Fetch user onboarding status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      onboardingStep: true,
      onboardingCompletedAt: true,
    }
  })

  // Redirect superadmins to their dashboard
  if (session.user.role === 'SUPER_ADMIN') {
    // Allow SA to view dashboard if explicitly accessing it
    // This enables the "View as User" functionality
  }

  return (
    <div className="min-h-screen bg-background">
      {/* User Header - Always visible at the top */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex justify-end">
          <UserHeader />
        </div>
      </div>

      {/* Show onboarding banner if step 2 not complete */}
      <div className="container mx-auto px-4">
        {user && (
          <OnboardingBanner 
            userId={user.id}
            onboardingStep={user.onboardingStep}
            onboardingCompletedAt={user.onboardingCompletedAt}
          />
        )}
      </div>

      {/* Main content */}
      {children}
    </div>
  )
}
