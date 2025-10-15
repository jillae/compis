
/**
 * Pricing Optimizer
 * Analyzes services and generates dynamic pricing recommendations
 * 
 * Wave 3 - Feature 2
 */

import { prisma } from '@/lib/db';
import { subMonths, startOfMonth } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';

interface PricingAnalysis {
  serviceId: string;
  serviceName: string;
  currentPrice: number;
  recommendedPrice: number;
  priceDifference: number;
  priceChangePercent: number;
  monthlyBookings: number;
  utilizationRate: number;
  expectedMonthlyImpact: number;
  reasoning: string;
  competitorData?: Array<{
    name: string;
    price: number;
  }>;
  demandData: {
    currentUtilization: number;
    historicalDemand: number;
    trendDirection: 'UP' | 'DOWN' | 'STABLE';
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class PricingOptimizer {
  private clinicId: string;

  constructor(clinicId: string) {
    this.clinicId = clinicId;
  }

  /**
   * Analyze all services and generate pricing recommendations
   */
  async analyzePricing(): Promise<PricingAnalysis[]> {
    const services = await prisma.service.findMany({
      where: {
        clinicId: this.clinicId,
        isActive: true,
      },
      include: {
        bookings: {
          where: {
            scheduledTime: {
              gte: subMonths(new Date(), 6), // Last 6 months
            },
            status: {
              in: ['COMPLETED', 'completed'],
            },
          },
        },
      },
    });

    const analyses: PricingAnalysis[] = [];

    for (const service of services) {
      const analysis = await this.analyzeService(service);
      if (analysis) {
        analyses.push(analysis);
      }
    }

    // Sort by expected impact (highest first)
    return analyses.sort((a, b) => b.expectedMonthlyImpact - a.expectedMonthlyImpact);
  }

  /**
   * Analyze a single service
   */
  private async analyzeService(service: any): Promise<PricingAnalysis | null> {
    const bookings = service.bookings || [];
    const currentPrice = Number(service.price);

    // Need at least 5 bookings to make meaningful recommendations
    if (bookings.length < 5) {
      return null;
    }

    // Calculate monthly booking rate
    const monthlyBookings = Math.round(bookings.length / 6); // Average over 6 months

    // Calculate demand trend
    const recentBookings = bookings.filter((b: any) => {
      const bookingDate = new Date(b.scheduledTime);
      return bookingDate >= subMonths(new Date(), 2);
    });
    const recentMonthlyRate = Math.round(recentBookings.length / 2);
    
    let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (recentMonthlyRate > monthlyBookings * 1.2) {
      trendDirection = 'UP';
    } else if (recentMonthlyRate < monthlyBookings * 0.8) {
      trendDirection = 'DOWN';
    }

    // Get market data (simulated for MVP - in production, scrape competitor sites)
    const marketData = this.getMarketData(service.category);
    
    // Calculate recommended price
    let recommendedPrice = currentPrice;
    let reasoning = '';
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

    // Rule 1: High demand + price below market average = RAISE PRICE
    if (trendDirection === 'UP' && currentPrice < marketData.averagePrice * 0.9) {
      recommendedPrice = Math.round(currentPrice * 1.15); // 15% increase
      reasoning = `Hög efterfrågan (${recentMonthlyRate} bokningar/månad, stigande) och pris under marknadsnivå. Marknadsgenom: ${marketData.averagePrice} kr.`;
      confidence = 'HIGH';
    }
    // Rule 2: Low demand + price above market = LOWER PRICE
    else if (trendDirection === 'DOWN' && currentPrice > marketData.averagePrice * 1.1) {
      recommendedPrice = Math.round(currentPrice * 0.9); // 10% decrease
      reasoning = `Fallande efterfrågan (${recentMonthlyRate} bokningar/månad) och pris över marknadsnivå. Sänkning kan stimulera efterfrågan.`;
      confidence = 'MEDIUM';
    }
    // Rule 3: High demand + already at/above market = MODEST INCREASE
    else if (trendDirection === 'UP' && currentPrice >= marketData.averagePrice * 0.9) {
      recommendedPrice = Math.round(currentPrice * 1.05); // 5% increase
      reasoning = `Stark efterfrågan och konkurrenskraftigt pris. Modest ökning kan öka marginalen utan att minska volym.`;
      confidence = 'MEDIUM';
    }
    // Rule 4: Significantly underpriced vs market
    else if (currentPrice < marketData.averagePrice * 0.75) {
      recommendedPrice = Math.round(marketData.averagePrice * 0.85); // Aim for 85% of market
      reasoning = `Kraftigt underprissatt (${Math.round(((marketData.averagePrice - currentPrice) / marketData.averagePrice) * 100)}% under marknad). Stor marginalförbättring möjlig.`;
      confidence = 'HIGH';
    }
    // Rule 5: No change needed
    else {
      return null; // No recommendation needed
    }

    // Calculate expected impact
    const priceDifference = recommendedPrice - currentPrice;
    const priceChangePercent = (priceDifference / currentPrice) * 100;
    
    // Assume 80% of customers accept price increase, 100% benefit from decrease
    const retentionRate = priceDifference > 0 ? 0.8 : 1.0;
    const expectedMonthlyImpact = Math.round(
      priceDifference * monthlyBookings * retentionRate
    );

    // Only recommend if impact is significant (>1000 kr/month)
    if (Math.abs(expectedMonthlyImpact) < 1000) {
      return null;
    }

    return {
      serviceId: service.id,
      serviceName: service.name,
      currentPrice,
      recommendedPrice,
      priceDifference,
      priceChangePercent: Math.round(priceChangePercent * 10) / 10,
      monthlyBookings,
      utilizationRate: recentMonthlyRate,
      expectedMonthlyImpact,
      reasoning,
      competitorData: marketData.competitors,
      demandData: {
        currentUtilization: recentMonthlyRate,
        historicalDemand: monthlyBookings,
        trendDirection,
      },
      confidence,
    };
  }

  /**
   * Get market data (simulated - in production, web scrape competitors)
   */
  private getMarketData(category: string): {
    averagePrice: number;
    competitors: Array<{ name: string; price: number }>;
  } {
    // Market averages for common categories (Swedish market, 2024)
    const marketAverages: Record<string, number> = {
      laser: 1450,
      massage: 895,
      facial: 750,
      waxing: 450,
      lash: 650,
      nails: 550,
      skincare: 850,
      general: 800,
    };

    const categoryLower = category.toLowerCase();
    let avgPrice = marketAverages.general;

    for (const [key, price] of Object.entries(marketAverages)) {
      if (categoryLower.includes(key)) {
        avgPrice = price;
        break;
      }
    }

    // Generate simulated competitor data
    const competitors = [
      { name: 'Konkurrent A', price: Math.round(avgPrice * 0.95) },
      { name: 'Konkurrent B', price: Math.round(avgPrice * 1.05) },
      { name: 'Konkurrent C', price: Math.round(avgPrice * 0.98) },
    ];

    return {
      averagePrice: avgPrice,
      competitors,
    };
  }

  /**
   * Create pricing recommendations in database
   */
  async savePricingRecommendations(): Promise<void> {
    const analyses = await this.analyzePricing();

    // Clear old pending recommendations
    await prisma.pricingRecommendation.deleteMany({
      where: {
        clinicId: this.clinicId,
        status: 'PENDING',
      },
    });

    // Create new recommendations
    for (const analysis of analyses) {
      await prisma.pricingRecommendation.create({
        data: {
          clinicId: this.clinicId,
          serviceId: analysis.serviceId,
          currentPrice: analysis.currentPrice,
          recommendedPrice: analysis.recommendedPrice,
          reasoning: analysis.reasoning,
          competitorData: analysis.competitorData || [],
          demandData: analysis.demandData,
          expectedImpact: analysis.expectedMonthlyImpact,
          status: 'PENDING',
        },
      });
    }
  }
}
