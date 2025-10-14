
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateAIResponse } from '@/lib/ai-assistant';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, customerId, conversationHistory = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    let customerContext;

    // If customer ID provided, fetch their loyalty info
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          loyaltyCards: {
            where: { isActive: true },
            include: {
              program: true,
            },
            take: 1,
          },
        },
      });

      if (customer && customer.loyaltyCards.length > 0) {
        const card = customer.loyaltyCards[0];
        const redeemRule = card.program.redeemRule as any;
        const stampsRequired = Object.keys(redeemRule).map(Number).sort((a, b) => b - a)[0] || 10;
        const rewardDescription = redeemRule[stampsRequired];

        customerContext = {
          name: customer.name || 'Kund',
          phone: customer.phone || '',
          currentStamps: card.stamps,
          stampsRequired,
          rewardDescription,
          isCompleted: card.stamps >= stampsRequired,
          programName: card.program.name,
        };
      }
    }

    const aiResponse = await generateAIResponse(
      message,
      customerContext,
      conversationHistory
    );

    return NextResponse.json({
      response: aiResponse,
      customerContext,
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
