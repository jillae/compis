
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIActionEngine } from '@/lib/ai-action-engine';
import { prisma } from '@/lib/db';
import { startOfWeek } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 });
    }

    // Generate recommendations using AI Engine
    const engine = new AIActionEngine(user.clinicId);
    const recommendations = await engine.generateRecommendations();

    // Save recommendations to database
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday

    // Clear old pending recommendations for this week
    await prisma.weeklyAction.deleteMany({
      where: {
        clinicId: user.clinicId,
        weekStartDate: weekStart,
        status: 'PENDING',
      },
    });

    // Create new recommendations
    const savedActions = await Promise.all(
      recommendations.map(rec =>
        prisma.weeklyAction.create({
          data: {
            clinicId: user.clinicId!,
            weekStartDate: weekStart,
            priority: rec.priority,
            title: rec.title,
            category: rec.category,
            expectedImpact: rec.expectedImpact,
            description: rec.description,
            reasoning: rec.reasoning,
            steps: rec.steps,
            evidence: rec.evidence,
            status: 'PENDING',
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      recommendations: savedActions,
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
