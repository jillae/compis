
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  // Require authentication
  if (!session) {
    redirect('/login')
  }

  // Redirect superadmins to their dashboard
  if (session.user.role === 'SUPER_ADMIN') {
    // Allow SA to view dashboard if explicitly accessing it
    // This enables the "View as User" functionality
  }

  return <>{children}</>
}
