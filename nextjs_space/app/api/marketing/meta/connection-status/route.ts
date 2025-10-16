
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 });
    }

    // Check Meta configuration
    const metaAccessToken = process.env.META_ACCESS_TOKEN;
    const metaAdAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!metaAccessToken || !metaAdAccountId) {
      return NextResponse.json({
        connected: false,
        lastSync: null,
        error: 'Meta API not configured. Please add credentials in Settings.',
        tokenExpiresAt: null,
      });
    }

    // Test API connection
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${metaAdAccountId}?fields=name,account_status&access_token=${metaAccessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({
          connected: false,
          lastSync: null,
          error: errorData.error?.message || 'Invalid Meta API credentials',
          tokenExpiresAt: null,
        });
      }

      // Connection successful
      const data = await response.json();
      
      return NextResponse.json({
        connected: true,
        lastSync: new Date().toISOString(),
        error: null,
        tokenExpiresAt: null, // TODO: Add token expiry tracking
        accountName: data.name,
        accountStatus: data.account_status,
      });
    } catch (fetchError) {
      return NextResponse.json({
        connected: false,
        lastSync: null,
        error: 'Failed to connect to Meta API. Check your internet connection.',
        tokenExpiresAt: null,
      });
    }
  } catch (error) {
    console.error('Error checking Meta connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
