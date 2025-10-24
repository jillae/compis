
/**
 * Trend Analysis Module
 * Performs linear regression to identify trends in cash flow data
 */

interface DataPoint {
  date: Date;
  amount: number;
}

interface TrendResult {
  slope: number;
  intercept: number;
  r2: number; // Coefficient of determination (how well the line fits)
}

/**
 * Linear Regression: y = mx + b
 * Calculates best-fit line for time series data
 */
export function linearRegression(data: DataPoint[]): TrendResult {
  if (data.length === 0) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  const n = data.length;
  
  // Convert dates to numeric values (days since first date)
  const firstDate = data[0].date.getTime();
  const x = data.map(d => (d.date.getTime() - firstDate) / (1000 * 60 * 60 * 24)); // Days
  const y = data.map(d => d.amount);

  // Calculate means
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate slope (m)
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean);
    denominator += Math.pow(x[i] - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R² (coefficient of determination)
  const yPredicted = x.map(xi => slope * xi + intercept);
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPredicted[i], 2), 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

  return { slope, intercept, r2 };
}

/**
 * Calculate standard deviation (volatility)
 */
export function calculateVolatility(data: DataPoint[], trendResult: TrendResult): number {
  if (data.length === 0) return 0;

  const firstDate = data[0].date.getTime();
  const deviations = data.map(d => {
    const x = (d.date.getTime() - firstDate) / (1000 * 60 * 60 * 24);
    const predicted = trendResult.slope * x + trendResult.intercept;
    return Math.pow(d.amount - predicted, 2);
  });

  const variance = deviations.reduce((sum, dev) => sum + dev, 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Predict value for a future date
 */
export function predictValue(date: Date, baseDate: Date, trendResult: TrendResult): number {
  const daysDiff = (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
  return trendResult.slope * daysDiff + trendResult.intercept;
}
