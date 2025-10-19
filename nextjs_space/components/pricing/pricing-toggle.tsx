
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PricingToggleProps {
  onToggle: (isYearly: boolean) => void;
  defaultYearly?: boolean;
}

export function PricingToggle({ onToggle, defaultYearly = false }: PricingToggleProps) {
  const [isYearly, setIsYearly] = useState(defaultYearly);

  const handleToggle = (yearly: boolean) => {
    setIsYearly(yearly);
    onToggle(yearly);
  };

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <Button
        variant={!isYearly ? 'default' : 'outline'}
        onClick={() => handleToggle(false)}
        className="px-6"
      >
        Månadsvis
      </Button>
      <Button
        variant={isYearly ? 'default' : 'outline'}
        onClick={() => handleToggle(true)}
        className="px-6 relative"
      >
        Årsvis
        {isYearly && (
          <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
            20% off
          </Badge>
        )}
      </Button>
      {!isYearly && (
        <Badge variant="secondary" className="bg-green-100 text-green-700 ml-2">
          Spara 20% med årsbetalning
        </Badge>
      )}
    </div>
  );
}

interface PriceDisplayProps {
  monthlyPrice: number;
  isYearly: boolean;
  currency?: string;
}

export function PriceDisplay({ monthlyPrice, isYearly, currency = 'kr' }: PriceDisplayProps) {
  // Calculate yearly pricing with 20% discount
  const yearlyPrice = monthlyPrice * 12 * 0.8;
  const effectiveMonthlyPrice = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;
  const savings = Math.round((monthlyPrice * 12) - yearlyPrice);

  return (
    <div>
      <div className="flex items-baseline gap-2">
        {isYearly && (
          <span className="text-3xl font-bold text-gray-400 line-through mr-2">
            {monthlyPrice.toLocaleString('sv-SE')}
          </span>
        )}
        <span className="text-5xl font-bold">
          {effectiveMonthlyPrice.toLocaleString('sv-SE')}
        </span>
        <div className="flex flex-col">
          <span className="text-gray-600">{currency}/månad</span>
        </div>
      </div>
      {isYearly && (
        <div className="mt-2">
          <span className="text-sm font-semibold text-green-600">
            Betala årsvis, spara {savings.toLocaleString('sv-SE')} {currency}/år
          </span>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate prices
export function calculatePrice(monthlyPrice: number, isYearly: boolean) {
  if (isYearly) {
    const yearlyPrice = monthlyPrice * 12 * 0.8;
    return {
      displayPrice: Math.round(yearlyPrice),
      effectiveMonthlyPrice: Math.round(yearlyPrice / 12),
      savings: Math.round(monthlyPrice * 12 * 0.2),
      interval: 'år' as const,
    };
  }
  return {
    displayPrice: monthlyPrice,
    effectiveMonthlyPrice: monthlyPrice,
    savings: 0,
    interval: 'månad' as const,
  };
}
