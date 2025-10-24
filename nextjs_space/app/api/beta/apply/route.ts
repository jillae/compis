
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clinicName, contactName, email, phone, currentBookingSystem, numberOfStaff, motivation } = body

    // Validate required fields
    if (!clinicName || !contactName || !email || !motivation) {
      return NextResponse.json(
        { error: 'Vänligen fyll i alla obligatoriska fält' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingApplication = await prisma.betaApplication.findFirst({
      where: { email }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'En ansökan med denna email har redan skickats in' },
        { status: 400 }
      )
    }

    // Create beta application
    const application = await prisma.betaApplication.create({
      data: {
        clinicName,
        contactName,
        email,
        phone,
        currentBookingSystem,
        numberOfStaff,
        motivation
      }
    })

    // Send confirmation email to applicant
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Flow <hello@goto.klinikflow.app>',
          to: email,
          subject: 'Tack för din beta-ansökan till Flow! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Tack för din ansökan, ${contactName}! 🎉</h1>
              
              <p>Vi har mottagit din ansökan om att bli en av våra första beta-kliniker.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Nästa steg:</h2>
                <ol style="margin: 0; padding-left: 20px;">
                  <li>Vi granskar din ansökan (vanligtvis inom 24 timmar)</li>
                  <li>Du får ett email med beslut</li>
                  <li>Vid godkännande bokar vi en onboarding-session</li>
                </ol>
              </div>
              
              <p><strong>Din ansökan:</strong></p>
              <ul style="list-style: none; padding: 0;">
                <li>🏥 Klinik: ${clinicName}</li>
                <li>📧 Email: ${email}</li>
                <li>👥 Antal anställda: ${numberOfStaff || 'Ej angivet'}</li>
                <li>💻 Bokningssystem: ${currentBookingSystem || 'Ej angivet'}</li>
              </ul>
              
              <p>Har du frågor? Svara på detta email så hör vi av oss!</p>
              
              <p>Med vänliga hälsningar,<br/>Flow-teamet</p>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Send notification to admin
    if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
      try {
        await resend.emails.send({
          from: 'Flow <hello@goto.klinikflow.app>',
          to: process.env.ADMIN_EMAIL,
          subject: `Ny beta-ansökan från ${clinicName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Ny beta-ansökan! 🎉</h1>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Klinik:</strong> ${clinicName}</p>
                <p><strong>Kontaktperson:</strong> ${contactName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefon:</strong> ${phone || 'Ej angivet'}</p>
                <p><strong>Bokningssystem:</strong> ${currentBookingSystem || 'Ej angivet'}</p>
                <p><strong>Antal anställda:</strong> ${numberOfStaff || 'Ej angivet'}</p>
                <p><strong>Motivering:</strong></p>
                <p style="white-space: pre-wrap;">${motivation}</p>
              </div>
              
              <p>
                <a href="${process.env.NEXTAUTH_URL}/superadmin/beta-applications" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Granska ansökan
                </a>
              </p>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError)
      }
    }

    return NextResponse.json({ 
      success: true,
      applicationId: application.id
    })
  } catch (error) {
    console.error('Error creating beta application:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod. Försök igen senare.' },
      { status: 500 }
    )
  }
}
