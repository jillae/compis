
/**
 * Cashflow Forecasting Engine
 * Generates forward-looking liquidity predictions based on historical data
 */

import { prisma } from "@/lib/db";
import { addWeeks, subMonths, format } from "date-fns";
import { linearRegression, calculateVolatility, predictValue } from "./trend-analysis";
import { calculateSeasonalIndex, getSeasonalMultiplier, smoothSeasonalIndex } from "./seasonal-index";

export interface ForecastOptions {
  clinicId: string;
  historicalMonths: number; // How far back to analyze (default: 3-6 months)
  forecastWeeks: number; // How far forward to predict (default: 13 weeks)
}

export interface ForecastResult {
  date: Date;
  dateStr: string;
  optimistic: number; // Best case scenario
  realistic: number; // Most likely prediction
  conservative: number; // Worst case scenario
  confidence: number; // How confident we are (0-1)
}

export interface ForecastData {
  historical: Array<{ date: string; amount: number }>;
  forecast: ForecastResult[];
  metadata: {
    generatedAt: Date;
    basedOnMonths: number;
    forecastWeeks: number;
    dataPoints: number;
    trendStrength: number; // R² value
  };
}

/**
 * Generate cashflow forecast
 */
export async function generateCashflowForecast(
  options: ForecastOptions
): Promise<ForecastData> {
  const { clinicId, historicalMonths, forecastWeeks } = options;

  // 1. Fetch historical data (Sales + Bank Transactions)
  const startDate = subMonths(new Date(), historicalMonths);
  const endDate = new Date();

  const historicalData = await getHistoricalCashflow(clinicId, startDate, endDate);

  // 2. Analyze trends and seasonal patterns
  const trendResult = linearRegression(historicalData);
  const volatility = calculateVolatility(historicalData, trendResult);
  const seasonalIndex = smoothSeasonalIndex(
    calculateSeasonalIndex(historicalData)
  );

  // 3. Generate forecast for each week forward
  const forecast: ForecastResult[] = [];
  const baseDate = historicalData.length > 0 
    ? historicalData[0].date 
    : startDate;

  for (let week = 1; week <= forecastWeeks; week++) {
    const forecastDate = addWeeks(new Date(), week);

    // Base prediction: Trend + seasonal adjustment
    const trendValue = predictValue(forecastDate, baseDate, trendResult);
    const seasonalMultiplier = getSeasonalMultiplier(forecastDate, seasonalIndex);
    const realistic = Math.max(0, trendValue * seasonalMultiplier);

    // Optimistic: Add 1 standard deviation
    const optimistic = Math.max(0, realistic + volatility);

    // Conservative: Subtract 1 standard deviation
    const conservative = Math.max(0, realistic - volatility);

    // Confidence decreases over time (closer weeks = more confident)
    const confidence = Math.max(0.3, 1 - (week / forecastWeeks) * 0.7);

    forecast.push({
      date: forecastDate,
      dateStr: format(forecastDate, "yyyy-MM-dd"),
      optimistic: Math.round(optimistic * 100) / 100,
      realistic: Math.round(realistic * 100) / 100,
      conservative: Math.round(conservative * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  // 4. Format historical data for chart
  const historical = historicalData.map(d => ({
    date: format(d.date, "yyyy-MM-dd"),
    amount: Math.round(d.amount * 100) / 100,
  }));

  return {
    historical,
    forecast,
    metadata: {
      generatedAt: new Date(),
      basedOnMonths: historicalMonths,
      forecastWeeks,
      dataPoints: historicalData.length,
      trendStrength: Math.round(trendResult.r2 * 100) / 100,
    },
  };
}

/**
 * Fetch historical cashflow data (Sales + Bank Transactions)
 */
async function getHistoricalCashflow(
  clinicId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: Date; amount: number }>> {
  // Fetch Sales (expected revenue)
  const sales = await prisma.sale.findMany({
    where: {
      clinicId,
      receiptType: 0, // Only sales, not refunds
      receiptDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      receiptDate: true,
      totalAmount: true,
    },
  });

  // Fetch Bank Transactions (actual incoming cash)
  const bankTransactions = await prisma.bankTransaction.findMany({
    where: {
      clinicId,
      source: "fortnox",
      amount: { gt: 0 }, // Only incoming payments
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      transactionDate: true,
      amount: true,
    },
  });

  // Combine and aggregate by date
  const dataMap = new Map<string, number>();

  sales.forEach(sale => {
    const dateKey = format(sale.receiptDate, "yyyy-MM-dd");
    const current = dataMap.get(dateKey) || 0;
    dataMap.set(dateKey, current + Number(sale.totalAmount));
  });

  bankTransactions.forEach(transaction => {
    const dateKey = format(transaction.transactionDate, "yyyy-MM-dd");
    const current = dataMap.get(dateKey) || 0;
    dataMap.set(dateKey, current + Number(transaction.amount));
  });

  // Convert to array and sort by date
  return Array.from(dataMap.entries())
    .map(([dateStr, amount]) => ({
      date: new Date(dateStr),
      amount,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
