
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeAllTriggers } from '@/lib/marketing-triggers';

export const dynamic = 'force-dynamic';

// POST /api/cron/execute-triggers - Cron job to execute all active triggers
// This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
export async function POST(req: Request) {
  try {
    // Verify cron secret if provided
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active clinics
    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const results = [];
    let totalExecuted = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const clinic of clinics) {
      try {
        const result = await executeAllTriggers(clinic.id);
        
        totalExecuted += result.totalExecuted;
        totalSkipped += result.totalSkipped;
        totalFailed += result.totalFailed;
        
        results.push({
          clinicId: clinic.id,
          clinicName: clinic.name,
          ...result,
        });
      } catch (error) {
        console.error(`Error executing triggers for clinic ${clinic.id}:`, error);
        results.push({
          clinicId: clinic.id,
          clinicName: clinic.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clinicsProcessed: clinics.length,
      totalExecuted,
      totalSkipped,
      totalFailed,
      results,
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute cron job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow GET for testing
export async function GET(req: Request) {
  return NextResponse.json({
    message: 'Trigger execution cron endpoint',
    usage: 'POST to this endpoint to execute all active triggers',
    note: 'Add CRON_SECRET env var for production security',
  });
}
