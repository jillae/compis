
/**
 * Meta Marketing API Service
 * 
 * Handles all interactions with Meta Marketing API for:
 * - Campaign insights and metrics
 * - Conversions API for lead quality tracking
 * - Dynamic budget allocation based on clinic capacity
 */

import { prisma } from '@/lib/db'
const bizSdk = require('facebook-nodejs-business-sdk')

const { AdAccount, Campaign, AdsInsights } = bizSdk

/**
 * Initialize Meta API client
 */
export function initMetaApi(accessToken: string) {
  const api = bizSdk.FacebookAdsApi.init(accessToken)
  api.setDebug(false)
  return api
}

/**
 * Sync campaign metrics from Meta Marketing API
 */
export async function syncMetaCampaignMetrics(clinicId: string) {
  try {
    // Get clinic's Meta credentials
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        metaEnabled: true,
        metaAccessToken: true,
        metaAdAccountId: true,
      },
    })

    if (!clinic?.metaEnabled || !clinic.metaAccessToken || !clinic.metaAdAccountId) {
      throw new Error('Meta API not configured for this clinic')
    }

    // Initialize API
    initMetaApi(clinic.metaAccessToken)

    // Get ad account
    const account = new AdAccount(clinic.metaAdAccountId)

    // Fetch campaigns
    const campaigns = await account.getCampaigns([
      'id',
      'name',
      'status',
      'objective',
    ])

    // For each campaign, fetch insights
    for (const campaign of campaigns) {
      const insights = await campaign.getInsights(
        [
          'campaign_id',
          'campaign_name',
          'date_start',
          'date_stop',
          'spend',
          'impressions',
          'clicks',
          'cpm',
          'cpc',
          'ctr',
          'actions',
          'cost_per_action_type',
          'quality_ranking',
          'conversion_rate_ranking',
          'engagement_rate_ranking',
        ],
        {
          time_range: { since: getLastSyncDate(clinicId), until: 'today' },
          time_increment: 1, // Daily breakdown
          level: 'campaign',
        }
      )

      // Process each day's insights
      for (const insight of insights) {
        await saveMetricSnapshot(clinicId, insight)
      }
    }

    console.log(`✅ Meta sync complete for clinic ${clinicId}`)
    return { success: true, campaigns: campaigns.length }
  } catch (error) {
    console.error('Meta sync error:', error)
    throw error
  }
}

/**
 * Save a daily metric snapshot
 */
async function saveMetricSnapshot(clinicId: string, insight: any) {
  const data = insight._data

  // Extract lead count from actions
  const leadAction = data.actions?.find((a: any) => a.action_type === 'lead')
  const leads = leadAction ? parseInt(leadAction.value) : 0

  // Extract CPL from cost_per_action_type
  const leadCostAction = data.cost_per_action_type?.find(
    (a: any) => a.action_type === 'lead'
  )
  const cpl = leadCostAction ? parseFloat(leadCostAction.value) : 0

  // Upsert metric snapshot
  await prisma.metaCampaignMetric.upsert({
    where: {
      clinicId_metaCampaignId_date: {
        clinicId,
        metaCampaignId: data.campaign_id,
        date: new Date(data.date_start),
      },
    },
    create: {
      clinicId,
      metaCampaignId: data.campaign_id,
      metaCampaignName: data.campaign_name,
      date: new Date(data.date_start),
      spend: parseFloat(data.spend || 0),
      impressions: parseInt(data.impressions || 0),
      clicks: parseInt(data.clicks || 0),
      leads,
      cpm: parseFloat(data.cpm || 0),
      cpc: parseFloat(data.cpc || 0),
      cpl,
      ctr: parseFloat(data.ctr || 0),
      qualityRanking: data.quality_ranking || null,
      conversionRanking: data.conversion_rate_ranking || null,
      engagementRanking: data.engagement_rate_ranking || null,
      qualityLeads: 0, // Updated via Conversions API
      revenue: 0, // Updated via booking data
    },
    update: {
      spend: parseFloat(data.spend || 0),
      impressions: parseInt(data.impressions || 0),
      clicks: parseInt(data.clicks || 0),
      leads,
      cpm: parseFloat(data.cpm || 0),
      cpc: parseFloat(data.cpc || 0),
      cpl,
      ctr: parseFloat(data.ctr || 0),
      qualityRanking: data.quality_ranking || null,
      conversionRanking: data.conversion_rate_ranking || null,
      engagementRanking: data.engagement_rate_ranking || null,
    },
  })
}

/**
 * Get last sync date (default to 30 days ago)
 */
function getLastSyncDate(clinicId: string): string {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return thirtyDaysAgo.toISOString().split('T')[0]
}

/**
 * Send conversion event to Meta Conversions API
 * Called when a lead becomes a quality appointment
 */
export async function sendConversionEvent(
  clinicId: string,
  eventData: {
    eventName: 'Lead' | 'Purchase' | 'Schedule'
    customerId: string
    customerEmail?: string
    customerPhone?: string
    value?: number
    currency?: string
  }
) {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        metaEnabled: true,
        metaAccessToken: true,
        metaPixelId: true,
      },
    })

    if (!clinic?.metaEnabled || !clinic.metaAccessToken || !clinic.metaPixelId) {
      console.log('Conversions API not configured, skipping event')
      return
    }

    initMetaApi(clinic.metaAccessToken)

    const { EventRequest, UserData, ServerEvent } = bizSdk

    const userData = new UserData()
    if (eventData.customerEmail) userData.setEmail(eventData.customerEmail)
    if (eventData.customerPhone) userData.setPhone(eventData.customerPhone)

    const serverEvent = new ServerEvent()
      .setEventName(eventData.eventName)
      .setEventTime(Math.floor(Date.now() / 1000))
      .setUserData(userData)
      .setActionSource('website')

    if (eventData.value) {
      serverEvent.setCustomData({
        value: eventData.value,
        currency: eventData.currency || 'SEK',
      })
    }

    const eventRequest = new EventRequest(
      clinic.metaAccessToken,
      clinic.metaPixelId
    )
    eventRequest.setEvents([serverEvent])

    await eventRequest.execute()

    console.log(`✅ Conversion event sent: ${eventData.eventName}`)
  } catch (error) {
    console.error('Failed to send conversion event:', error)
  }
}

/**
 * Calculate capacity-based budget recommendations
 */
export async function getCapacityBasedBudgetRecommendation(clinicId: string) {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        metaCapacityMin: true,
        metaCapacityMax: true,
        metaTargetCPL: true,
      },
    })

    // Calculate current capacity utilization
    const now = new Date()
    const twoWeeksAhead = new Date()
    twoWeeksAhead.setDate(twoWeeksAhead.getDate() + 14)

    const totalSlots = await getTotalAvailableSlots(clinicId, now, twoWeeksAhead)
    const bookedSlots = await prisma.booking.count({
      where: {
        clinicId,
        scheduledTime: {
          gte: now,
          lte: twoWeeksAhead,
        },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'completed'] },
      },
    })

    const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0

    // Determine budget action
    let recommendation = 'MAINTAIN'
    let reason = ''

    if (utilizationRate < (clinic?.metaCapacityMin || 75)) {
      recommendation = 'INCREASE'
      reason = `Kapacitet under ${clinic?.metaCapacityMin}% - öka budget för fler leads`
    } else if (utilizationRate > (clinic?.metaCapacityMax || 90)) {
      recommendation = 'DECREASE'
      reason = `Kapacitet över ${clinic?.metaCapacityMax}% - minska budget för att undvika overbooking`
    } else {
      reason = `Kapacitet inom optimal zon (${clinic?.metaCapacityMin}-${clinic?.metaCapacityMax}%)`
    }

    return {
      currentUtilization: Math.round(utilizationRate),
      recommendation,
      reason,
      targetCPL: clinic?.metaTargetCPL || null,
    }
  } catch (error) {
    console.error('Failed to calculate budget recommendation:', error)
    return null
  }
}

/**
 * Helper: Calculate total available slots (simplified)
 */
async function getTotalAvailableSlots(
  clinicId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const staff = await prisma.staff.count({
    where: { clinicId, isActive: true },
  })

  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Assume 8 hour workday, 30 min slots
  const slotsPerStaffPerDay = 16
  return staff * slotsPerStaffPerDay * days
}

/**
 * Get Meta campaign performance summary
 */
export async function getMetaCampaignSummary(
  clinicId: string,
  days: number = 30
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const metrics = await prisma.metaCampaignMetric.groupBy({
    by: ['clinicId'],
    where: {
      clinicId,
      date: { gte: startDate },
    },
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      leads: true,
      qualityLeads: true,
      revenue: true,
    },
  })

  if (!metrics || metrics.length === 0) {
    return null
  }

  const data = metrics[0]._sum
  const totalSpend = parseFloat(String(data.spend || 0))
  const totalRevenue = parseFloat(String(data.revenue || 0))
  const totalLeads = data.leads || 0
  const qualityLeads = data.qualityLeads || 0

  return {
    totalSpend,
    totalRevenue,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    totalLeads,
    qualityLeads,
    leadQualityRate: totalLeads > 0 ? (qualityLeads / totalLeads) * 100 : 0,
    avgCPL: totalLeads > 0 ? totalSpend / totalLeads : 0,
    impressions: data.impressions || 0,
    clicks: data.clicks || 0,
  }
}
