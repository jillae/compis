
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Fetch current feature toggles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { clinic: true },
    });

    if (!user?.clinic) {
      return NextResponse.json(
        { error: 'No clinic found' },
        { status: 404 }
      );
    }

    // Return feature toggles
    const features = {
      bokadirektEnabled: user.clinic.bokadirektEnabled,
      metaEnabled: user.clinic.metaEnabled,
      corexEnabled: user.clinic.corexEnabled,
      dynamicPricingEnabled: user.clinic.dynamicPricingEnabled,
      retentionAutopilotEnabled: user.clinic.retentionAutopilotEnabled,
      aiActionsEnabled: user.clinic.aiActionsEnabled,
    };

    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching feature toggles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Update feature toggles
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { clinic: true },
    });

    if (!user?.clinic) {
      return NextResponse.json(
        { error: 'No clinic found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      bokadirektEnabled,
      metaEnabled,
      corexEnabled,
      dynamicPricingEnabled,
      retentionAutopilotEnabled,
      aiActionsEnabled,
    } = body;

    // Update clinic settings
    const updatedClinic = await prisma.clinic.update({
      where: { id: user.clinic.id },
      data: {
        bokadirektEnabled: bokadirektEnabled ?? user.clinic.bokadirektEnabled,
        metaEnabled: metaEnabled ?? user.clinic.metaEnabled,
        corexEnabled: corexEnabled ?? user.clinic.corexEnabled,
        dynamicPricingEnabled: dynamicPricingEnabled ?? user.clinic.dynamicPricingEnabled,
        retentionAutopilotEnabled: retentionAutopilotEnabled ?? user.clinic.retentionAutopilotEnabled,
        aiActionsEnabled: aiActionsEnabled ?? user.clinic.aiActionsEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      features: {
        bokadirektEnabled: updatedClinic.bokadirektEnabled,
        metaEnabled: updatedClinic.metaEnabled,
        corexEnabled: updatedClinic.corexEnabled,
        dynamicPricingEnabled: updatedClinic.dynamicPricingEnabled,
        retentionAutopilotEnabled: updatedClinic.retentionAutopilotEnabled,
        aiActionsEnabled: updatedClinic.aiActionsEnabled,
      },
    });
  } catch (error) {
    console.error('Error updating feature toggles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
