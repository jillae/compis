
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AtRiskClient from './at-risk-client'

export const metadata: Metadata = {
  title: 'Riskbokningar | Flow',
  description: 'Övervaka och hantera riskfyllda bokningar för att förhindra uteblivna besök'
}

export const dynamic = 'force-dynamic'

export default async function AtRiskPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return <AtRiskClient />
}
