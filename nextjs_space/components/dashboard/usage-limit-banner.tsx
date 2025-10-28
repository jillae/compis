
'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface UsageData {
  tier: string;
  bookingsThisMonth: number;
  bookingsLimit: number | null;
  remaining: number;
}

export function UsageLimitBanner() {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        if (data.subscription) {
          setUsage({
            tier: data.subscription.tier,
            bookingsThisMonth: data.subscription.bookingsThisMonth || 0,
            bookingsLimit: data.subscription.bookingsLimit,
            remaining:
              data.subscription.bookingsLimit !== null
                ? data.subscription.bookingsLimit - (data.subscription.bookingsThisMonth || 0)
                : -1,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) return null;

  // Only show for FREE tier
  if (usage.tier !== 'FREE' || usage.bookingsLimit === null) return null;

  const usagePercent = (usage.bookingsThisMonth / usage.bookingsLimit) * 100;
  const isNearLimit = usagePercent > 80;
  const isAtLimit = usage.remaining <= 0;

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <Alert variant={isAtLimit ? 'destructive' : 'default'} className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {isAtLimit ? (
          <>
            Bokningsgräns nådd
            <Badge variant="destructive">50/50 bokningar</Badge>
          </>
        ) : (
          <>
            Snart full bokningsgräns
            <Badge variant="secondary">
              {usage.bookingsThisMonth}/{usage.bookingsLimit} bokningar
            </Badge>
          </>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        {isAtLimit ? (
          <p>
            Du har använt alla 50 gratisbokningar för denna månad. Uppgradera till <strong>Basic</strong> för obegränsade
            bokningar!
          </p>
        ) : (
          <>
            <p>
              Du har {usage.remaining} bokningar kvar denna månad. Uppgradera för obegränsade bokningar och avancerade
              funktioner.
            </p>
            <Progress value={usagePercent} className="h-2" />
          </>
        )}

        <div className="flex gap-3 mt-4">
          <Button onClick={() => router.push('/pricing')} size="sm" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Uppgradera Nu
          </Button>
          {!isAtLimit && (
            <Button onClick={() => router.push('/pricing')} variant="outline" size="sm">
              Se Priser
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
