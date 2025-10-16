
/**
 * Flow ROI Calculator
 * 
 * Tracks and calculates how much value each clinic gets from using Flow
 * Used for marketing, customer success, and retention
 */

import { prisma } from './db';

export interface FlowROIMetrics {
  clinicId: string;
  clinicName: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  
  // Revenue Impact
  revenueGained: number; // From recommendations executed
  revenueProtected: number; // From no-show prevention
  revenueOptimized: number; // From pricing/capacity optimization
  
  // Time Savings
  hoursSaved: number; // Automation + insights
  costSavings: number; // Time savings in SEK
  
  // Marketing ROI
  adSpendOptimized: number; // Reduced wasted ad spend
  campaignImprovements: number; // Better ROAS/CPL
  
  // Customer Retention
  customersRetained: number; // Prevented churn
  retentionValue: number; // LTV of retained customers
  
  // Overall Flow ROI
  totalValueGenerated: number;
  flowCost: number; // Subscription cost
  netROI: number; // Value - Cost
  roiPercentage: number; // (Value / Cost - 1) * 100
  
  // Engagement Metrics
  actionsTaken: number;
  actionsCompleted: number;
  loginFrequency: number; // Logins per week
  featureAdoption: number; // Percentage of features used
  
  // Timestamps
  calculatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
}

export class FlowROICalculator {
  
  /**
   * Calculate ROI for a specific clinic
   */
  static async calculateROI(
    clinicId: string, 
    period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<FlowROIMetrics> {
    
    const now = new Date();
    const periodDays = period === 'monthly' ? 30 : period === 'quarterly' ? 90 : 365;
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - periodDays);
    
    // Get clinic info
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { 
        subscription: true,
        users: true,
      }
    });
    
    if (!clinic) {
      throw new Error(`Clinic ${clinicId} not found`);
    }
    
    // 1. Revenue from completed actions
    const completedActions = await prisma.weeklyAction.findMany({
      where: {
        clinicId,
        status: 'COMPLETED',
        completedAt: { gte: periodStart },
      },
    });
    
    const revenueGained = completedActions.reduce(
      (sum, action) => sum + parseFloat(action.expectedImpact.toString()),
      0
    );
    
    // 2. Revenue protected from no-show prevention (estimated from predictions)
    // Estimate based on booking trends
    const revenueProtected = 0; // TODO: Implement based on actual no-show prevention data
    
    // 3. Revenue optimized from Dynamic Pricing (if enabled)
    // Estimate based on pricing strategy
    const revenueOptimized = 0; // TODO: Implement based on dynamic pricing logs
    
    // 4. Time savings (estimate)
    const actionCount = completedActions.length;
    const hoursSaved = actionCount * 2; // Assume each action saves 2 hours on average
    const costSavings = hoursSaved * 500; // SEK 500/hour average cost
    
    // 5. Marketing ROI (Meta integration)
    // Estimate based on marketing campaigns
    const adSpendOptimized = 0; // TODO: Implement based on Meta insights
    const campaignImprovements = 0;
    
    // 6. Customer retention
    // Estimate based on retention campaigns sent
    const customersRetained = 0; // TODO: Implement based on retention campaigns
    const retentionValue = 0;
    
    // 7. Calculate total value
    const totalValueGenerated = 
      revenueGained + 
      revenueProtected + 
      revenueOptimized + 
      costSavings + 
      adSpendOptimized + 
      campaignImprovements + 
      retentionValue;
    
    // 8. Flow cost (subscription)
    const subscriptionCost = clinic.subscription?.monthlyPrice 
      ? parseFloat(clinic.subscription.monthlyPrice.toString()) 
      : 0;
    const flowCost = (subscriptionCost / 30) * periodDays; // Prorate
    
    // 9. Net ROI
    const netROI = totalValueGenerated - flowCost;
    const roiPercentage = flowCost > 0 ? ((totalValueGenerated / flowCost - 1) * 100) : 0;
    
    // 10. Engagement metrics
    const actionsTaken = await prisma.weeklyAction.count({
      where: {
        clinicId,
        createdAt: { gte: periodStart },
      },
    });
    
    const actionsCompleted = completedActions.length;
    
    // User activity (simplified - would need audit log in production)
    const activeUsers = clinic.users.length;
    const loginFrequency = activeUsers * 3; // Estimate: 3 logins/user/week
    
    // Feature adoption (simplified)
    const featureAdoption = (actionsCompleted / Math.max(actionsTaken, 1)) * 100;
    
    return {
      clinicId,
      clinicName: clinic.name,
      period,
      revenueGained,
      revenueProtected,
      revenueOptimized,
      hoursSaved,
      costSavings,
      adSpendOptimized,
      campaignImprovements,
      customersRetained,
      retentionValue,
      totalValueGenerated,
      flowCost,
      netROI,
      roiPercentage,
      actionsTaken,
      actionsCompleted,
      loginFrequency,
      featureAdoption,
      calculatedAt: now,
      periodStart,
      periodEnd: now,
    };
  }
  
  /**
   * Calculate ROI for all clinics (SuperAdmin view)
   */
  static async calculateAllClinics(
    period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<FlowROIMetrics[]> {
    const clinics = await prisma.clinic.findMany({
      select: { id: true },
    });
    
    const results = await Promise.all(
      clinics.map(clinic => this.calculateROI(clinic.id, period))
    );
    
    return results.sort((a, b) => b.netROI - a.netROI);
  }
}
