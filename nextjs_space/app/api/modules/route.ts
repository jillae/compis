
// API: Get all modules for current user's clinic tier
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MODULE_REGISTRY, getModulesByTier } from '@/lib/modules/module-registry'

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

    const tier = user.clinic.tier
    const availableModules = getModulesByTier(tier)

    // Get display mode configurations for this clinic
    const displayModeConfigs = await prisma.displayModeConfig.findMany({
      where: { clinicId: user.clinic.id },
    })

    // Attach visibility info to modules
    const modulesWithConfig = availableModules.map((module) => {
      const configs = displayModeConfigs.filter((c: any) => c.moduleKey === module.key)
      return {
        ...module,
        displayModeConfigs: configs,
      }
    })

    return NextResponse.json({
      modules: modulesWithConfig,
      tier,
      activeDisplayMode: user.clinic.activeDisplayMode,
    })
  } catch (error: any) {
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}
