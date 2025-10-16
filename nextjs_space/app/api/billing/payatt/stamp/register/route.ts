
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateQRCodeData } from '@/lib/qr-generator';
import { smsService, SMSService } from '@/lib/sms/sms-service';
import { renderTemplate } from '@/lib/sms/templates';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { qrData, customerId, phone, loyaltyCardId } = await req.json();

    let customerIdToUse = customerId;

    // If QR code data provided, validate and extract customer ID
    if (qrData) {
      const validatedData = validateQRCodeData(qrData);
      
      if (!validatedData) {
        return NextResponse.json({ 
          error: 'Invalid or expired QR code' 
        }, { status: 400 });
      }

      customerIdToUse = validatedData.customerId;
    }

    // If phone provided, find customer
    if (phone && !customerIdToUse) {
      const customer = await prisma.customer.findFirst({
        where: {
          phone,
          clinicId: session.user.clinicId,
        },
      });

      if (!customer) {
        return NextResponse.json({ 
          error: 'Customer not found' 
        }, { status: 404 });
      }

      customerIdToUse = customer.id;
    }

    if (!customerIdToUse) {
      return NextResponse.json({ 
        error: 'Customer identification required' 
      }, { status: 400 });
    }

    // Get or create loyalty card
    let loyaltyCard;
    let loyaltyProgram;

    if (loyaltyCardId) {
      loyaltyCard = await prisma.loyaltyCard.findUnique({
        where: { id: loyaltyCardId },
        include: { 
          program: true,
          customer: true,
        },
      });
      loyaltyProgram = loyaltyCard?.program;
    } else {
      // Get active loyalty program for clinic
      loyaltyProgram = await prisma.loyaltyProgram.findFirst({
        where: {
          clinicId: session.user.clinicId!,
          isActive: true,
          isDraft: false,
        },
      });

      if (!loyaltyProgram) {
        return NextResponse.json({ 
          error: 'No active loyalty program' 
        }, { status: 400 });
      }

      // Get or create loyalty card
      loyaltyCard = await prisma.loyaltyCard.findFirst({
        where: {
          customerId: customerIdToUse,
          programId: loyaltyProgram.id,
          isActive: true,
        },
        include: {
          program: true,
          customer: true,
        },
      });

      if (!loyaltyCard) {
        // Create new loyalty card
        loyaltyCard = await prisma.loyaltyCard.create({
          data: {
            customerId: customerIdToUse,
            programId: loyaltyProgram.id,
            stamps: 0,
            points: 0,
            isActive: true,
          },
          include: {
            program: true,
            customer: true,
          },
        });
      }
    }

    if (!loyaltyCard || !loyaltyProgram) {
      return NextResponse.json({ 
        error: 'Loyalty card not found' 
      }, { status: 404 });
    }

    // Parse earn rule from program
    const earnRule = loyaltyProgram.earnRule as any;
    const stampsToAdd = earnRule?.value || 1;
    
    // Parse redeem rule to get total stamps required
    const redeemRule = loyaltyProgram.redeemRule as any;
    const stampsRequired = Object.keys(redeemRule || {}).map(Number).sort((a, b) => b - a)[0] || 10;

    // Add stamp
    const newStampCount = loyaltyCard.stamps + stampsToAdd;
    const isCompleted = newStampCount >= stampsRequired;

    // Update loyalty card
    const updatedCard = await prisma.loyaltyCard.update({
      where: { id: loyaltyCard.id },
      data: {
        stamps: newStampCount,
        lastEarnedAt: new Date(),
      },
      include: {
        customer: true,
        program: true,
      },
    });

    // Create transaction record
    await prisma.loyaltyTransaction.create({
      data: {
        customerId: customerIdToUse,
        type: 'stamp_earned',
        stamps: stampsToAdd,
        description: 'Stämpel registrerad via display',
        clinicId: session.user.clinicId!,
      },
    });

    // Send SMS notification
    if (updatedCard.customer.phone && updatedCard.customer.consentSms) {
      try {
        const phone = SMSService.formatPhoneNumber(updatedCard.customer.phone);
        
        if (isCompleted) {
          // Reward earned
          const rewardDescription = (redeemRule[stampsRequired] as string) || 'Belöning';
          const message = renderTemplate('reward_earned', {
            firstName: updatedCard.customer.firstName || updatedCard.customer.name || 'Kund',
            rewardName: rewardDescription,
          });
          
          await smsService.send({ to: phone, message });
        } else {
          // Stamp earned
          const remaining = stampsRequired - newStampCount;
          const message = renderTemplate('stamp_earned', {
            firstName: updatedCard.customer.firstName || updatedCard.customer.name || 'Kund',
            currentStamps: newStampCount.toString(),
            totalStamps: stampsRequired.toString(),
            remaining: remaining.toString(),
          });
          
          await smsService.send({ to: phone, message });
        }
      } catch (smsError) {
        console.error('SMS notification error:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    return NextResponse.json({
      success: true,
      loyaltyCard: {
        id: updatedCard.id,
        currentStamps: updatedCard.stamps,
        stampsRequired: stampsRequired,
        isCompleted,
        rewardDescription: (redeemRule[stampsRequired] as string) || 'Belöning',
      },
      customer: {
        name: updatedCard.customer.name,
        phone: updatedCard.customer.phone,
      },
    });

  } catch (error) {
    console.error('Stamp registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register stamp' },
      { status: 500 }
    );
  }
}
