
'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  priceSnapshots: Array<{
    serviceName: string;
    price: number;
    ourPrice: number | null;
    priceDiff: number | null;
    priceDiffPct: number | null;
  }>;
}

interface PriceComparisonMatrixProps {
  competitors: Competitor[];
}

export function PriceComparisonMatrix({ competitors }: PriceComparisonMatrixProps) {
  // Group all services
  const allServices = new Map<string, Array<{ competitor: string; price: number; ourPrice: number | null }>>();

  competitors.forEach(competitor => {
    competitor.priceSnapshots.forEach(snapshot => {
      if (!allServices.has(snapshot.serviceName)) {
        allServices.set(snapshot.serviceName, []);
      }
      allServices.get(snapshot.serviceName)!.push({
        competitor: competitor.name,
        price: snapshot.price,
        ourPrice: snapshot.ourPrice,
      });
    });
  });

  if (allServices.size === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No price data available. Add price snapshots to see comparisons.
      </p>
    );
  }

  const getPriceComparison = (ourPrice: number | null, theirPrice: number) => {
    if (!ourPrice) return null;
    
    const diff = ourPrice - theirPrice;
    const diffPct = (diff / theirPrice) * 100;

    if (diffPct > 5) {
      return { 
        icon: <TrendingUp className="h-3 w-3" />, 
        text: `+${diffPct.toFixed(0)}%`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      };
    } else if (diffPct < -5) {
      return { 
        icon: <TrendingDown className="h-3 w-3" />, 
        text: `${diffPct.toFixed(0)}%`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    } else {
      return { 
        icon: <Minus className="h-3 w-3" />, 
        text: 'Similar',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
      };
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Service</TableHead>
            <TableHead className="text-center">Our Price</TableHead>
            {competitors.map(competitor => (
              <TableHead key={competitor.id} className="text-center">
                {competitor.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from(allServices.entries()).map(([serviceName, prices]) => {
            const ourPrice = prices.find(p => p.ourPrice)?.ourPrice;

            return (
              <TableRow key={serviceName}>
                <TableCell className="font-medium">{serviceName}</TableCell>
                <TableCell className="text-center">
                  {ourPrice ? (
                    <span className="font-semibold">{ourPrice} kr</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                {competitors.map(competitor => {
                  const priceData = prices.find(p => p.competitor === competitor.name);
                  const comparison = priceData && getPriceComparison(priceData.ourPrice, priceData.price);

                  return (
                    <TableCell key={competitor.id} className="text-center">
                      {priceData ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold">{priceData.price} kr</span>
                          {comparison && (
                            <Badge 
                              variant="outline" 
                              className={`${comparison.bgColor} ${comparison.color} border-0 text-xs`}
                            >
                              <span className="flex items-center gap-1">
                                {comparison.icon}
                                {comparison.text}
                              </span>
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
