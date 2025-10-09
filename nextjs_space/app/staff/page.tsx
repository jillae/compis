

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BackButton } from '@/components/ui/back-button'
import { StaffManagement } from '@/components/staff/staff-management'

export default async function StaffPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">👥 Personal</h1>
              <p className="text-muted-foreground mt-1">
                Hantera din kliniks personal och schemaläggning
              </p>
            </div>
            <BackButton href="/dashboard" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-6">
        <StaffManagement />
      </div>
    </div>
  )
}

