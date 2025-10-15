
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/integrations/sync-tags - Sync tags from booking system
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';

    // Get clinic
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    if (!clinic.bokadirektEnabled || !clinic.bokadirektApiKey) {
      return NextResponse.json(
        { error: 'Bokadirekt integration not enabled' },
        { status: 400 }
      );
    }

    // Fetch customers from Bokadirekt
    // TODO: Implement actual Bokadirekt API call
    // For now, we'll sync tags from our existing customers
    
    const customers = await prisma.customer.findMany({
      where: {
        clinicId: session.user.clinicId,
        bokadirektId: {
          not: null,
        },
      },
    });

    let synced = 0;
    const tagsSynced: { [key: string]: number } = {};

    for (const customer of customers) {
      // In a real implementation, we would fetch tags from Bokadirekt API
      // For now, we'll use the existing tags array field
      
      if (customer.tags && customer.tags.length > 0) {
        for (const tagName of customer.tags) {
          // Find or create tag
          let tag = await prisma.tag.findUnique({
            where: {
              clinicId_name: {
                clinicId: session.user.clinicId,
                name: tagName,
              },
            },
          });

          if (!tag && !dryRun) {
            tag = await prisma.tag.create({
              data: {
                clinicId: session.user.clinicId,
                name: tagName,
                description: 'Synced from Bokadirekt',
                color: '#10b981',
              },
            });
          }

          if (tag && !dryRun) {
            // Apply tag
            await prisma.customerTag.upsert({
              where: {
                customerId_tagId: {
                  customerId: customer.id,
                  tagId: tag.id,
                },
              },
              create: {
                customerId: customer.id,
                tagId: tag.id,
                source: 'BOOKING_SYSTEM',
                sourceReference: customer.bokadirektId || undefined,
              },
              update: {
                appliedAt: new Date(),
              },
            });

            tagsSynced[tagName] = (tagsSynced[tagName] || 0) + 1;
            synced++;
          }
        }
      }
    }

    // Update tag counts
    if (!dryRun) {
      for (const tagName of Object.keys(tagsSynced)) {
        const tag = await prisma.tag.findUnique({
          where: {
            clinicId_name: {
              clinicId: session.user.clinicId,
              name: tagName,
            },
          },
        });

        if (tag) {
          const count = await prisma.customerTag.count({
            where: { tagId: tag.id },
          });

          await prisma.tag.update({
            where: { id: tag.id },
            data: { customerCount: count },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      customersProcessed: customers.length,
      tagsSynced: synced,
      uniqueTags: Object.keys(tagsSynced).length,
      dryRun,
      tagBreakdown: tagsSynced,
    });
  } catch (error) {
    console.error('[Sync Tags API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync tags' },
      { status: 500 }
    );
  }
}
