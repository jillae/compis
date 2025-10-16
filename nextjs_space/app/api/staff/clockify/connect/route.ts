
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClockifyClient from '@/lib/integrations/clockify-client';

/**
 * POST /api/staff/clockify/connect
 * 
 * Connect clinic to Clockify by storing API key and workspace info
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Ej autentiserad' },
        { status: 401 }
      );
    }

    // Only ADMIN and SUPER_ADMIN can connect Clockify
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Saknar behörighet' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clinicId, clockifyApiKey } = body;

    if (!clinicId || !clockifyApiKey) {
      return NextResponse.json(
        { success: false, error: 'clinicId och clockifyApiKey krävs' },
        { status: 400 }
      );
    }

    // Verify clinic access
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: 'Klinik hittades inte' },
        { status: 404 }
      );
    }

    // Test Clockify connection
    const clockify = new ClockifyClient(clockifyApiKey);
    const connectionTest = await clockify.testConnection();

    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kunde inte ansluta till Clockify: ' + connectionTest.error 
        },
        { status: 400 }
      );
    }

    // Get workspaces
    const workspaces = await clockify.getWorkspaces();

    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Inga workspaces hittades i Clockify' },
        { status: 400 }
      );
    }

    // Use first workspace as default
    const defaultWorkspace = workspaces[0];

    // Save or update ClockifyIntegration
    await prisma.clockifyIntegration.upsert({
      where: { clinicId },
      create: {
        clinicId,
        apiKey: clockifyApiKey, // TODO: Encrypt in production
        workspaceId: defaultWorkspace.id,
        workspaceName: defaultWorkspace.name,
        isActive: true,
        lastSyncAt: new Date(),
      },
      update: {
        apiKey: clockifyApiKey,
        workspaceId: defaultWorkspace.id,
        workspaceName: defaultWorkspace.name,
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      workspaces,
      defaultWorkspace,
      user: connectionTest.user,
    });
  } catch (error: any) {
    console.error('[Clockify Connect] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/staff/clockify/connect
 * 
 * Get current Clockify connection status for a clinic
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Ej autentiserad' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'clinicId krävs' },
        { status: 400 }
      );
    }

    const integration = await prisma.clockifyIntegration.findUnique({
      where: { clinicId },
    });

    if (!integration) {
      return NextResponse.json({
        success: true,
        connected: false,
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      workspaceId: integration.workspaceId,
      workspaceName: integration.workspaceName,
      lastSyncAt: integration.lastSyncAt,
      isActive: integration.isActive,
    });
  } catch (error: any) {
    console.error('[Clockify Get Status] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
