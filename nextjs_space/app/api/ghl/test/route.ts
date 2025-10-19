
/**
 * GoHighLevel Connection Test API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get clinicId from query param
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    // Fetch clinic GHL config
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        ghlEnabled: true,
        ghlApiKey: true,
        ghlLocationId: true
      }
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    if (!clinic.ghlEnabled) {
      return NextResponse.json({ 
        success: false,
        error: 'GHL integration is not enabled for this clinic' 
      });
    }

    if (!clinic.ghlApiKey || !clinic.ghlLocationId) {
      return NextResponse.json({ 
        success: false,
        error: 'GHL API credentials are missing' 
      });
    }

    // Test connection to GHL API
    // We'll use a simple API call to verify credentials
    const ghlResponse = await fetch(
      `https://rest.gohighlevel.com/v1/locations/${clinic.ghlLocationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${clinic.ghlApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      return NextResponse.json({
        success: false,
        error: `GHL API returned ${ghlResponse.status}: ${errorText}`
      });
    }

    const locationData = await ghlResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Connection successful!',
      location: {
        id: locationData.id || locationData._id,
        name: locationData.name || locationData.companyName || 'Unknown'
      }
    });

  } catch (error: any) {
    console.error('GHL test connection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to test GHL connection' 
      },
      { status: 500 }
    );
  }
}
