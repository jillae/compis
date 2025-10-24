
/**
 * Seasonal Index Module
 * Identifies seasonal patterns in cash flow data
 */

interface DataPoint {
  date: Date;
  amount: number;
}

/**
 * Calculate seasonal index for each week of the year (1-52)
 * Returns a multiplier for each week (e.g., 1.2 = 20% above average)
 */
export function calculateSeasonalIndex(data: DataPoint[]): number[] {
  if (data.length === 0) {
    // Return neutral index (all 1.0) if no data
    return Array(52).fill(1.0);
  }

  // Initialize arrays for 52 weeks
  const weeklySum = Array(52).fill(0);
  const weeklyCount = Array(52).fill(0);

  // Accumulate data by week of year
  data.forEach(d => {
    const weekOfYear = getWeekOfYear(d.date);
    weeklySum[weekOfYear] += d.amount;
    weeklyCount[weekOfYear]++;
  });

  // Calculate average for each week
  const weeklyAvg = weeklySum.map((sum, i) => 
    weeklyCount[i] > 0 ? sum / weeklyCount[i] : 0
  );

  // Calculate overall average (excluding zero weeks)
  const nonZeroWeeks = weeklyAvg.filter(avg => avg > 0);
  const overallAvg = nonZeroWeeks.length > 0
    ? nonZeroWeeks.reduce((sum, avg) => sum + avg, 0) / nonZeroWeeks.length
    : 0;

  if (overallAvg === 0) {
    return Array(52).fill(1.0);
  }

  // Calculate seasonal index (week / overall average)
  return weeklyAvg.map(avg => avg > 0 ? avg / overallAvg : 1.0);
}

/**
 * Get seasonal multiplier for a specific date
 */
export function getSeasonalMultiplier(date: Date, seasonalIndex: number[]): number {
  const weekOfYear = getWeekOfYear(date);
  return seasonalIndex[weekOfYear] || 1.0;
}

/**
 * Get week of year (0-51)
 * Week 1 starts on first Monday of the year
 */
function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const daysSinceFirstDay = Math.floor(
    (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.floor(daysSinceFirstDay / 7) % 52;
}

/**
 * Smooth seasonal index using moving average
 * Reduces noise by averaging with neighboring weeks
 */
export function smoothSeasonalIndex(seasonalIndex: number[], windowSize: number = 3): number[] {
  const smoothed = [...seasonalIndex];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < seasonalIndex.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = (i + j + 52) % 52; // Wrap around
      sum += seasonalIndex[idx];
      count++;
    }

    smoothed[i] = sum / count;
  }

  return smoothed;
}
