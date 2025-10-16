
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FlowROICalculator } from '@/lib/flow-roi-calculator';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'quarterly' | 'yearly';
    const clinicId = searchParams.get('clinicId');

    if (clinicId) {
      // Single clinic ROI
      const roi = await FlowROICalculator.calculateROI(clinicId, period);
      return NextResponse.json({ success: true, roi });
    } else {
      // All clinics ROI
      const allROI = await FlowROICalculator.calculateAllClinics(period);
      return NextResponse.json({ success: true, clinics: allROI });
    }
  } catch (error) {
    console.error('Error calculating Flow ROI:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ROI' },
      { status: 500 }
    );
  }
}
