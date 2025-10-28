
// A/B Testing Framework
// Lightweight system for marketing experiments

import { prisma } from '@/lib/db';
import { ABTestStatus } from '@prisma/client';

/**
 * Assign user to variant (A or B) based on traffic split
 * Uses deterministic hashing for consistent assignment
 */
export function assignVariant(testId: string, userId?: string, sessionId?: string): 'A' | 'B' {
  const identifier = userId || sessionId || '';
  const hash = simpleHash(testId + identifier);
  
  // TODO: Fetch actual traffic split from database
  const trafficSplit = 50; // Default 50/50
  
  return (hash % 100) < trafficSplit ? 'B' : 'A';
}

/**
 * Simple hash function for consistent variant assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Track event (view, click, conversion)
 */
export async function trackABTestEvent(params: {
  testId: string;
  variant: 'A' | 'B';
  eventType: 'view' | 'click' | 'conversion';
  userId?: string;
  sessionId?: string;
  eventData?: any;
}) {
  const { testId, variant, eventType, userId, sessionId, eventData } = params;

  try {
    // Create conversion event
    await prisma.aBTestConversion.create({
      data: {
        testId,
        variant,
        eventType,
        userId,
        sessionId,
        eventData: eventData ? JSON.parse(JSON.stringify(eventData)) : null,
      },
    });

    // Increment variant metrics
    await updateVariantMetrics(testId, variant, eventType);
  } catch (error) {
    console.error('Error tracking AB test event:', error);
  }
}

/**
 * Update variant metrics (views, clicks, conversions)
 */
async function updateVariantMetrics(testId: string, variant: 'A' | 'B', eventType: string) {
  const updateField = eventType === 'view' ? 'views' : eventType === 'click' ? 'clicks' : 'conversions';

  await prisma.aBTestVariant.upsert({
    where: {
      testId_variant: {
        testId,
        variant,
      },
    },
    update: {
      [updateField]: {
        increment: 1,
      },
    },
    create: {
      testId,
      variant,
      [updateField]: 1,
    },
  });
}

/**
 * Get test results with statistical significance
 */
export async function getABTestResults(testId: string) {
  const variants = await prisma.aBTestVariant.findMany({
    where: { testId },
  });

  if (variants.length !== 2) {
    throw new Error('Test must have exactly 2 variants');
  }

  const variantA = variants.find((v) => v.variant === 'A');
  const variantB = variants.find((v) => v.variant === 'B');

  if (!variantA || !variantB) {
    throw new Error('Missing variant data');
  }

  // Calculate conversion rates
  const conversionRateA = variantA.views > 0 ? (variantA.conversions / variantA.views) * 100 : 0;
  const conversionRateB = variantB.views > 0 ? (variantB.conversions / variantB.views) * 100 : 0;

  // Calculate improvement
  const improvement = conversionRateA > 0 ? ((conversionRateB - conversionRateA) / conversionRateA) * 100 : 0;

  // Simple statistical significance (Chi-squared test approximation)
  const isSignificant = calculateStatisticalSignificance(variantA, variantB);

  return {
    variantA: {
      views: variantA.views,
      conversions: variantA.conversions,
      conversionRate: conversionRateA.toFixed(2),
    },
    variantB: {
      views: variantB.views,
      conversions: variantB.conversions,
      conversionRate: conversionRateB.toFixed(2),
    },
    improvement: improvement.toFixed(2),
    isSignificant,
    winner: improvement > 0 && isSignificant ? 'B' : improvement < 0 && isSignificant ? 'A' : null,
  };
}

/**
 * Calculate statistical significance (simplified)
 * Returns true if p-value < 0.05 (95% confidence)
 */
function calculateStatisticalSignificance(variantA: any, variantB: any): boolean {
  const n1 = variantA.views;
  const n2 = variantB.views;
  const x1 = variantA.conversions;
  const x2 = variantB.conversions;

  // Need at least 100 views per variant for reliable results
  if (n1 < 100 || n2 < 100) return false;

  // Simple proportions test
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pPool = (x1 + x2) / (n1 + n2);

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  const z = Math.abs(p1 - p2) / se;

  // Z-score > 1.96 means 95% confidence (p < 0.05)
  return z > 1.96;
}

/**
 * Create new A/B test
 */
export async function createABTest(params: {
  name: string;
  description?: string;
  targetPage: string;
  variantA: any;
  variantB: any;
  trafficSplit?: number;
  conversionGoal?: string;
  clinicId?: string;
}) {
  const { name, description, targetPage, variantA, variantB, trafficSplit = 50, conversionGoal, clinicId } = params;

  const test = await prisma.aBTest.create({
    data: {
      name,
      description,
      targetPage,
      variantA: JSON.parse(JSON.stringify(variantA)),
      variantB: JSON.parse(JSON.stringify(variantB)),
      trafficSplit,
      conversionGoal,
      clinicId,
      status: ABTestStatus.DRAFT,
    },
  });

  // Create variant records
  await prisma.aBTestVariant.createMany({
    data: [
      { testId: test.id, variant: 'A' },
      { testId: test.id, variant: 'B' },
    ],
  });

  return test;
}

/**
 * Start A/B test
 */
export async function startABTest(testId: string) {
  return await prisma.aBTest.update({
    where: { id: testId },
    data: {
      status: ABTestStatus.RUNNING,
      startDate: new Date(),
    },
  });
}

/**
 * Stop A/B test
 */
export async function stopABTest(testId: string) {
  return await prisma.aBTest.update({
    where: { id: testId },
    data: {
      status: ABTestStatus.COMPLETED,
      endDate: new Date(),
    },
  });
}
