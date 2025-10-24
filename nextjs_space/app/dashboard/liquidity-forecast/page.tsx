
/**
 * Liquidity Forecast Page
 * Forward-looking cashflow planning dashboard
 */

import { LiquidityForecast } from '@/components/analytics/liquidity-forecast';

export default function LiquidityForecastPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Likviditetsplanering</h1>
        <p className="text-muted-foreground mt-2">
          Framåtblickande prognoser för kassaflöde och likviditet
        </p>
      </div>

      <LiquidityForecast />
    </div>
  );
}
