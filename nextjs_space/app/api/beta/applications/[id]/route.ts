
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getResendClient } from '@/lib/email'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status, notes } = body

    const application = await prisma.betaApplication.update({
      where: { id: params.id },
      data: {
        status,
        notes,
        approvedAt: status === 'APPROVED' ? new Date() : undefined
      }
    })

    // Send email to applicant
    if (process.env.RESEND_API_KEY) {
      if (status === 'APPROVED') {
        await getResendClient().emails.send({
          from: 'Flow <hello@goto.klinikflow.app>',
          to: application.email,
          subject: 'Välkommen till Flow Beta! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Grattis, ${application.contactName}! 🎉</h1>
              
              <p>Vi är glada att meddela att ${application.clinicName} har godkänts till vårt beta-program!</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Vad händer nu?</h2>
                <ol style="margin: 0; padding-left: 20px;">
                  <li>Skapa ditt konto på <a href="${process.env.NEXTAUTH_URL}/auth/signup">goto.klinikflow.app</a></li>
                  <li>Vi bokar en onboarding-session inom 48 timmar</li>
                  <li>Du får tillgång till vår Slack-kanal för direktsupport</li>
                </ol>
              </div>
              
              <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Dina beta-förmåner:</h3>
                <ul>
                  <li>✅ 3 månader helt gratis</li>
                  <li>✅ 15% livstidsrabatt efter beta-perioden</li>
                  <li>✅ Prioriterad support via Slack</li>
                  <li>✅ Gratis onboarding & uppsättning</li>
                  <li>✅ Beta Partner Badge</li>
                </ul>
              </div>
              
              <p>Svara på detta email så bokar vi en tid för onboarding!</p>
              
              <p>Med vänliga hälsningar,<br/>Flow-teamet</p>
            </div>
          `
        })
      } else if (status === 'REJECTED') {
        await getResendClient().emails.send({
          from: 'Flow <hello@goto.klinikflow.app>',
          to: application.email,
          subject: 'Angående din beta-ansökan till Flow',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Tack för ditt intresse, ${application.contactName}</h1>
              
              <p>Tack för din ansökan till Flow's beta-program för ${application.clinicName}.</p>
              
              <p>Tyvärr har vi just nu inte plats för fler beta-kliniker, men vi skulle gärna hålla kontakten inför vår officiella lansering.</p>
              
              <p>Vi hör av oss när vi öppnar för fler platser!</p>
              
              <p>Med vänliga hälsningar,<br/>Flow-teamet</p>
            </div>
          `
        })
      }
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Error updating beta application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}
