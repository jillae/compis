
// API: Seed module registry into database (SA only)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MODULE_REGISTRY } from '@/lib/modules/module-registry'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upsert all modules
    for (const moduleDef of MODULE_REGISTRY) {
      await prisma.module.upsert({
        where: { key: moduleDef.key },
        update: {
          name: moduleDef.name,
          description: moduleDef.description,
          icon: moduleDef.icon,
          category: moduleDef.category,
          status: moduleDef.status,
          order: moduleDef.order,
        },
        create: {
          key: moduleDef.key,
          name: moduleDef.name,
          description: moduleDef.description,
          icon: moduleDef.icon,
          category: moduleDef.category,
          status: moduleDef.status,
          order: moduleDef.order,
        },
      })

      // Create module access for each tier
      const module = await prisma.module.findUnique({
        where: { key: moduleDef.key },
      })

      if (module) {
        for (const tier of moduleDef.availableForTiers) {
          await prisma.moduleAccess.upsert({
            where: {
              moduleId_tier: {
                moduleId: module.id,
                tier,
              },
            },
            update: { isEnabled: true },
            create: {
              moduleId: module.id,
              tier,
              isEnabled: true,
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${MODULE_REGISTRY.length} modules`,
    })
  } catch (error: any) {
    console.error('Error seeding modules:', error)
    return NextResponse.json({ error: 'Failed to seed modules' }, { status: 500 })
  }
}
