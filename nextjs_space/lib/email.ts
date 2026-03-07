
import { Resend } from 'resend';

// Lazy-load Resend client to prevent build-time initialization errors
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Export for use in other files
export { getResendClient };

/**
 * Generic email sending function
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = 'Flow <noreply@flowrevenue.se>',
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const result = await getResendClient().emails.send({
      from,
      to,
      subject,
      html,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

interface WeeklyReportData {
  clinicName: string;
  weekRange: string;
  metrics: {
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
    noShowRate: string;
    completionRate: string;
    weekOverWeekChange: {
      bookings: number;
      revenue: number;
    };
  };
  insights: Array<{
    title: string;
    description: string;
    impact?: string;
  }>;
  dashboardUrl: string;
}

export async function sendWeeklyReport(
  to: string,
  data: WeeklyReportData
) {
  try {
    const emailHtml = generateWeeklyReportHTML(data);
    
    const result = await getResendClient().emails.send({
      from: 'Flow <noreply@flowrevenue.se>',
      to,
      subject: `📊 Veckorapport för ${data.clinicName} - ${data.weekRange}`,
      html: emailHtml,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending weekly report:', error);
    return { success: false, error };
  }
}

function generateWeeklyReportHTML(data: WeeklyReportData): string {
  const { clinicName, weekRange, metrics, insights, dashboardUrl } = data;

  return `
    <!DOCTYPE html>
    <html lang="sv">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Veckorapport - ${clinicName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 16px;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0 0 8px 0;
          font-size: 28px;
        }
        .header p {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }
        .metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }
        .metric-card {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #3b82f6;
        }
        .metric-label {
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin: 4px 0;
        }
        .metric-change {
          font-size: 12px;
          font-weight: 600;
        }
        .metric-change.positive {
          color: #10b981;
        }
        .metric-change.negative {
          color: #ef4444;
        }
        .insights-section {
          margin-bottom: 32px;
        }
        .insights-section h2 {
          color: #1f2937;
          font-size: 20px;
          margin-bottom: 16px;
        }
        .insight-card {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .insight-title {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 4px;
        }
        .insight-description {
          color: #4b5563;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .insight-impact {
          font-size: 13px;
          font-weight: 600;
          color: #10b981;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 6px;
          font-weight: 600;
          text-align: center;
          margin: 16px 0;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Veckorapport</h1>
          <p>${clinicName} • ${weekRange}</p>
        </div>

        <div class="metrics">
          <div class="metric-card">
            <div class="metric-label">Bokningar</div>
            <div class="metric-value">${metrics.totalBookings}</div>
            ${
              metrics.weekOverWeekChange.bookings !== 0
                ? `<div class="metric-change ${
                    metrics.weekOverWeekChange.bookings > 0 ? 'positive' : 'negative'
                  }">
                    ${metrics.weekOverWeekChange.bookings > 0 ? '↑' : '↓'} ${Math.abs(
                    metrics.weekOverWeekChange.bookings
                  )}% vs förra veckan
                  </div>`
                : ''
            }
          </div>

          <div class="metric-card">
            <div class="metric-label">Intäkt</div>
            <div class="metric-value">${metrics.totalRevenue.toLocaleString('sv-SE')} kr</div>
            ${
              metrics.weekOverWeekChange.revenue !== 0
                ? `<div class="metric-change ${
                    metrics.weekOverWeekChange.revenue > 0 ? 'positive' : 'negative'
                  }">
                    ${metrics.weekOverWeekChange.revenue > 0 ? '↑' : '↓'} ${Math.abs(
                    metrics.weekOverWeekChange.revenue
                  )}% vs förra veckan
                  </div>`
                : ''
            }
          </div>

          <div class="metric-card">
            <div class="metric-label">Genomförandegrad</div>
            <div class="metric-value">${metrics.completionRate}%</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Uteblivengrad</div>
            <div class="metric-value">${metrics.noShowRate}%</div>
          </div>
        </div>

        ${
          insights.length > 0
            ? `
        <div class="insights-section">
          <h2>💡 AI-insikter & Rekommendationer</h2>
          ${insights
            .map(
              (insight) => `
            <div class="insight-card">
              <div class="insight-title">${insight.title}</div>
              <div class="insight-description">${insight.description}</div>
              ${insight.impact ? `<div class="insight-impact">${insight.impact}</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
        `
            : ''
        }

        <div style="text-align: center;">
          <a href="${dashboardUrl}" class="cta-button">
            Se fullständig rapport →
          </a>
        </div>

        <div class="footer">
          <p>
            Detta är din automatiska veckorapport från Flow.<br>
            Du får den varje måndag med sammanfattning av föregående vecka.
          </p>
          <p style="margin-top: 12px;">
            © ${new Date().getFullYear()} Flow - Revenue Intelligence Platform
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
