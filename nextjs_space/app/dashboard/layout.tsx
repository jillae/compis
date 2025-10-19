

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { OnboardingBanner } from "@/components/dashboard/onboarding-banner"
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
    <>
      {/* Show onboarding banner if step 2 not complete */}
      {user && (
        <OnboardingBanner 
          userId={user.id}
          onboardingStep={user.onboardingStep}
          onboardingCompletedAt={user.onboardingCompletedAt}
        />
      )}
      {children}
    </>
  )
}
