
// API: Get available banks for a country
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import GoCardlessClient from '@/lib/integrations/gocardless-client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    })

    if (!user?.clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    if (!user.clinic.gocardlessAccessToken) {
      return NextResponse.json(
        { error: 'GoCardless not configured' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country') || 'se'

    const client = new GoCardlessClient(user.clinic.gocardlessAccessToken)
    const institutions = await client.getInstitutions(country)

    return NextResponse.json({ institutions })
  } catch (error: any) {
    console.error('Error fetching institutions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch institutions' },
      { status: 500 }
    )
  }
}
