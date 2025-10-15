
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/tags/auto-tag - Run auto-tagging job
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';

    // Get all auto-tags for this clinic
    const autoTags = await prisma.tag.findMany({
      where: {
        clinicId: session.user.clinicId,
        isAutoTag: true,
        isActive: true,
      },
    });

    if (autoTags.length === 0) {
      return NextResponse.json({
        message: 'No auto-tags configured',
        applied: 0,
      });
    }

    // Get all customers for this clinic
    const customers = await prisma.customer.findMany({
      where: {
        clinicId: session.user.clinicId,
      },
      include: {
        bookings: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    const appliedTags: Array<{ customerId: string; tagId: string; tagName: string }> = [];

    for (const tag of autoTags) {
      if (!tag.autoTagRule) continue;

      const rule = tag.autoTagRule as any;

      for (const customer of customers) {
        let shouldTag = true;

        // Check totalVisits rule
        if (rule.totalVisitsMin !== undefined) {
          if ((customer.totalVisits || 0) < rule.totalVisitsMin) {
            shouldTag = false;
          }
        }
        if (rule.totalVisitsMax !== undefined) {
          if ((customer.totalVisits || 0) > rule.totalVisitsMax) {
            shouldTag = false;
          }
        }

        // Check totalSpend rule
        if (rule.totalSpendMin !== undefined) {
          const spend = parseFloat(customer.lifetimeValue?.toString() || '0');
          if (spend < rule.totalSpendMin) {
            shouldTag = false;
          }
        }

        // Check lastVisit rule (days ago)
        if (rule.lastVisitDaysAgo !== undefined && customer.lastVisitAt) {
          const daysAgo = Math.floor(
            (Date.now() - customer.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysAgo < rule.lastVisitDaysAgo) {
            shouldTag = false;
          }
        }

        // Check firstVisit rule (days old)
        if (rule.newCustomerDays !== undefined && customer.createdAt) {
          const daysOld = Math.floor(
            (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysOld > rule.newCustomerDays) {
            shouldTag = false;
          }
        }

        // If all rules pass, apply tag
        if (shouldTag) {
          if (!dryRun) {
            // Check if tag already applied
            const existing = await prisma.customerTag.findUnique({
              where: {
                customerId_tagId: {
                  customerId: customer.id,
                  tagId: tag.id,
                },
              },
            });

            if (!existing) {
              await prisma.customerTag.create({
                data: {
                  customerId: customer.id,
                  tagId: tag.id,
                  source: 'AUTO',
                  autoTaggedAt: new Date(),
                  lastVerifiedAt: new Date(),
                },
              });
            } else {
              // Update last verified
              await prisma.customerTag.update({
                where: {
                  customerId_tagId: {
                    customerId: customer.id,
                    tagId: tag.id,
                  },
                },
                data: {
                  lastVerifiedAt: new Date(),
                },
              });
            }
          }

          appliedTags.push({
            customerId: customer.id,
            tagId: tag.id,
            tagName: tag.name,
          });
        }
      }
    }

    // Update customerCount for each tag
    if (!dryRun) {
      for (const tag of autoTags) {
        const count = await prisma.customerTag.count({
          where: { tagId: tag.id },
        });

        await prisma.tag.update({
          where: { id: tag.id },
          data: { customerCount: count },
        });
      }
    }

    return NextResponse.json({
      message: dryRun ? 'Dry run completed' : 'Auto-tagging completed',
      tagsProcessed: autoTags.length,
      customersChecked: customers.length,
      tagsApplied: appliedTags.length,
      dryRun,
      details: appliedTags.slice(0, 100), // Return first 100 for preview
    });
  } catch (error) {
    console.error('[Tags API] Auto-tag error:', error);
    return NextResponse.json(
      { error: 'Failed to run auto-tagging' },
      { status: 500 }
    );
  }
}
