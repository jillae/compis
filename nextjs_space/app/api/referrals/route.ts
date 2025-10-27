
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createReferral,
  getUserReferrals
} from '@/lib/referral-service';
import { getErrorMessage } from '@/lib/error-messages';

// GET /api/referrals - List user's referrals
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await getUserReferrals(session.user.id, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error fetching referrals:', error);
    return NextResponse.json(
      { error: getErrorMessage(error as Error) },
      { status: 500 }
    );
  }
}

// POST /api/referrals - Create referral (send invite)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { referredEmail, notes } = body;

    if (!referredEmail) {
      return NextResponse.json(
        { error: 'E-postadress krävs' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referredEmail)) {
      return NextResponse.json(
        { error: 'Ogiltig e-postadress' },
        { status: 400 }
      );
    }

    // Check if user is trying to refer themselves
    if (referredEmail === session.user.email) {
      return NextResponse.json(
        { error: 'Du kan inte hänvisa dig själv' },
        { status: 400 }
      );
    }

    const referral = await createReferral(
      session.user.id,
      referredEmail.toLowerCase(),
      notes
    );

    // TODO: Send email invite to referredEmail
    // await sendReferralInviteEmail(referral);

    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating referral:', error);
    return NextResponse.json(
      { error: getErrorMessage(error as Error) },
      { status: 500 }
    );
  }
}
