
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCustomerQRCode } from '@/lib/qr-generator';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, phone } = await req.json();

    let customer;

    // Find customer by ID or phone
    if (customerId) {
      customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          clinicId: session.user.clinicId,
        },
      });
    } else if (phone) {
      customer = await prisma.customer.findFirst({
        where: {
          phone,
          clinicId: session.user.clinicId,
        },
      });
    }

    if (!customer) {
      return NextResponse.json({ 
        error: 'Customer not found' 
      }, { status: 404 });
    }

    // Generate QR code
    const qrCode = await generateCustomerQRCode(
      customer.id,
      session.user.clinicId!
    );

    return NextResponse.json({
      qrCode,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
    });

  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
