
/**
 * Superadmin STT Providers Management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await prisma.$queryRaw<any[]>`
      SELECT * FROM stt_provider_config 
      ORDER BY priority_order ASC
    `;

    return NextResponse.json({
      success: true,
      providers
    });

  } catch (error: any) {
    console.error('[SA STT Providers API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, updates } = await req.json();

    if (!id || !updates) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Build dynamic update query
    const allowedFields = ['is_active', 'max_retry_attempts', 'timeout_seconds', 'config_json'];
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.keys(updates).forEach((key, index) => {
      if (allowedFields.includes(key)) {
        if (key === 'config_json') {
          updateFields.push(`${key} = $${index + 1}::jsonb`);
          values.push(JSON.stringify(updates[key]));
        } else {
          updateFields.push(`${key} = $${index + 1}`);
          values.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(id);

    await prisma.$executeRawUnsafe(`
      UPDATE stt_provider_config 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
    `, ...values);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[SA STT Providers API] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}
