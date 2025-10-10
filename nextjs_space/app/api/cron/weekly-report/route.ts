

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { sv } from 'date-fns/locale';

const resend = new Resend(process.env.RESEND_API_KEY);

// This endpoint should be called by a cron job (e.g., Vercel Cron or external service)
// Schedule: Every Monday at 8 AM
export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all clinics with active subscriptions
    const clinics = await prisma.clinic.findMany({
      where: {
        isActive: true,
      },
      include: {
        users: {
          where: {
            role: 'ADMIN',
            email: { not: null },
          },
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const results = [];

    for (const clinic of clinics) {
      if (clinic.users.length === 0) continue;

      // Get weekly stats
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      const previousWeekStart = subWeeks(weekStart, 1);
      const previousWeekEnd = subWeeks(weekEnd, 1);

      // Current week bookings
      const currentWeekBookings = await prisma.booking.findMany({
        where: {
          clinicId: clinic.id,
          scheduledTime: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      });

      // Previous week bookings
      const previousWeekBookings = await prisma.booking.findMany({
        where: {
          clinicId: clinic.id,
          scheduledTime: {
            gte: previousWeekStart,
            lte: previousWeekEnd,
          },
        },
      });

      // Calculate metrics
      const currentRevenue = currentWeekBookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.price), 0);

      const previousRevenue = previousWeekBookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.price), 0);

      const currentNoShows = currentWeekBookings.filter(
        (b) => b.status === 'NO_SHOW'
      ).length;
      const previousNoShows = previousWeekBookings.filter(
        (b) => b.status === 'NO_SHOW'
      ).length;

      const revenueChange =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      const noShowChange = currentNoShows - previousNoShows;

      // Get at-risk customers
      const atRiskCustomers = await prisma.customer.findMany({
        where: {
          clinicId: clinic.id,
          totalSpent: { gt: 5000 },
          bookings: {
            none: {
              scheduledTime: {
                gte: subWeeks(new Date(), 8),
              },
            },
          },
        },
        take: 5,
        orderBy: { totalSpent: 'desc' },
      });

      // Get top services (placeholder - will implement later)
      const topServices: any[] = [];

      // Send email to all admins
      for (const admin of clinic.users) {
        if (!admin.email) continue;

        const emailHtml = generateEmailHTML({
          clinicName: clinic.name,
          adminName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
          weekStart: format(weekStart, 'dd MMM', { locale: sv }),
          weekEnd: format(weekEnd, 'dd MMM', { locale: sv }),
          currentRevenue,
          revenueChange,
          currentNoShows,
          noShowChange,
          atRiskCustomers,
          topServices,
        });

        try {
          await resend.emails.send({
            from: 'Flow <noreply@flow.se>',
            to: admin.email,
            subject: `📊 Veckorapport för ${clinic.name} - ${format(weekStart, 'dd MMM', { locale: sv })}`,
            html: emailHtml,
          });

          results.push({
            clinic: clinic.name,
            email: admin.email,
            status: 'sent',
          });
        } catch (error: any) {
          console.error(`Failed to send email to ${admin.email}:`, error);
          results.push({
            clinic: clinic.name,
            email: admin.email,
            status: 'failed',
            error: error?.message || 'Unknown error',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: results.filter((r) => r.status === 'sent').length,
      emailsFailed: results.filter((r) => r.status === 'failed').length,
      results,
    });
  } catch (error: any) {
    console.error('Weekly report cron error:', error);
    return NextResponse.json(
      { error: 'Failed to send weekly reports', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateEmailHTML(data: {
  clinicName: string;
  adminName: string;
  weekStart: string;
  weekEnd: string;
  currentRevenue: number;
  revenueChange: number;
  currentNoShows: number;
  noShowChange: number;
  atRiskCustomers: any[];
  topServices: any[];
}) {
  const revenueEmoji = data.revenueChange >= 0 ? '📈' : '📉';
  const revenueColor = data.revenueChange >= 0 ? '#10b981' : '#ef4444';
  const noShowEmoji = data.noShowChange <= 0 ? '✅' : '⚠️';

  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Veckorapport</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                📊 Veckorapport
              </h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">
                ${data.weekStart} - ${data.weekEnd}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="margin: 0; font-size: 16px; color: #374151;">
                Hej ${data.adminName}!
              </p>
              <p style="margin: 10px 0 0; font-size: 14px; color: #6b7280;">
                Här är din veckorapport för <strong>${data.clinicName}</strong>
              </p>
            </td>
          </tr>

          <!-- Revenue Card -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      💰 Intäkter denna vecka
                    </h3>
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #111827;">
                      ${data.currentRevenue.toLocaleString('sv-SE')} kr
                    </p>
                    <p style="margin: 10px 0 0; font-size: 14px; color: ${revenueColor}; font-weight: 600;">
                      ${revenueEmoji} ${data.revenueChange >= 0 ? '+' : ''}${data.revenueChange.toFixed(1)}% från förra veckan
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- No-Shows Card -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; font-size: 14px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${noShowEmoji} No-Shows
                    </h3>
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #78350f;">
                      ${data.currentNoShows}
                    </p>
                    <p style="margin: 10px 0 0; font-size: 14px; color: #92400e;">
                      ${data.noShowChange > 0 ? `+${data.noShowChange}` : data.noShowChange} jämfört med förra veckan
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- At-Risk Customers -->
          ${
            data.atRiskCustomers.length > 0
              ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <h3 style="margin: 0 0 15px; font-size: 16px; color: #111827; font-weight: 600;">
                ⚠️ Kunder i riskzonen (${data.atRiskCustomers.length})
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 8px; overflow: hidden;">
                ${data.atRiskCustomers
                  .map(
                    (customer, index) => `
                <tr>
                  <td style="padding: 12px 20px; ${index !== data.atRiskCustomers.length - 1 ? 'border-bottom: 1px solid #fecaca;' : ''}">
                    <p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: 500;">
                      ${customer.firstName} ${customer.lastName}
                    </p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #b91c1c;">
                      Total spenderat: ${customer.totalSpent.toLocaleString('sv-SE')} kr • Har inte besökt på 8+ veckor
                    </p>
                  </td>
                </tr>
                `
                  )
                  .join('')}
              </table>
              <p style="margin: 10px 0 0; font-size: 12px; color: #6b7280;">
                💡 Tips: Skicka en personlig påminnelse eller erbjudande för att återaktivera dessa kunder.
              </p>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Top Services -->
          ${
            data.topServices.length > 0
              ? `
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 15px; font-size: 16px; color: #111827; font-weight: 600;">
                🔥 Populäraste tjänsterna
              </h3>
              ${data.topServices
                .map(
                  (service, index) => `
              <div style="margin-bottom: 10px; padding: 12px; background-color: #eff6ff; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 500;">
                  ${index + 1}. ${service.name}
                </p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #3b82f6;">
                  ${service.bookingsCount} bokningar • ${service.price.toLocaleString('sv-SE')} kr
                </p>
              </div>
              `
                )
                .join('')}
            </td>
          </tr>
          `
              : ''
          }

          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="https://flow.se/dashboard/simulator" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Se fullständig rapport →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Detta är en automatisk rapport från <strong>Flow</strong>
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
                Har du frågor? Kontakta oss på <a href="mailto:support@flow.se" style="color: #667eea; text-decoration: none;">support@flow.se</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
