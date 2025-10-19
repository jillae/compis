
'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface UsageLimitBannerProps {
  currentBookings: number;
  bookingsLimit: number;
  tier: string;
}

export function UsageLimitBanner({ currentBookings, bookingsLimit, tier }: UsageLimitBannerProps) {
  const [show, setShow] = useState(false);
  
  // Only show for FREE tier with a limit
  useEffect(() => {
    if (tier === 'FREE' && bookingsLimit > 0) {
      setShow(true);
    }
  }, [tier, bookingsLimit]);

  if (!show || bookingsLimit === 0) return null;

  const usagePercent = (currentBookings / bookingsLimit) * 100;
  const remaining = Math.max(0, bookingsLimit - currentBookings);
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = currentBookings >= bookingsLimit;

  return (
    <Alert 
      variant={isAtLimit ? 'destructive' : isNearLimit ? 'default' : 'default'}
      className={`mb-6 ${isAtLimit ? 'border-red-500 bg-red-50' : isNearLimit ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}
    >
      <div className="flex items-start gap-4">
        {isAtLimit ? (
          <AlertTriangle className="h-5 w-5 mt-0.5 text-red-600" />
        ) : (
          <TrendingUp className="h-5 w-5 mt-0.5 text-orange-600" />
        )}
        
        <div className="flex-1 space-y-3">
          <div>
            <AlertTitle className="text-base font-semibold">
              {isAtLimit 
                ? '🚨 Bokningsgräns nådd' 
                : isNearLimit 
                ? '⚠️ Du närmar dig bokningsgränsen' 
                : '📊 Bokningsanvändning'}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {isAtLimit ? (
                <span>
                  Du har använt <strong>{currentBookings} av {bookingsLimit} bokningar</strong> denna månad. 
                  Uppgradera nu för att fortsätta ta emot bokningar.
                </span>
              ) : (
                <span>
                  Du har använt <strong>{currentBookings} av {bookingsLimit} bokningar</strong> denna månad. 
                  {isNearLimit && ` Du har ${remaining} bokningar kvar.`}
                </span>
              )}
            </AlertDescription>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress 
              value={Math.min(usagePercent, 100)} 
              className={`h-2 ${isAtLimit ? 'bg-red-200' : isNearLimit ? 'bg-orange-200' : 'bg-blue-200'}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentBookings} bokningar</span>
              <span>{remaining} kvar av {bookingsLimit}</span>
            </div>
          </div>

          {/* Upgrade CTA */}
          {(isNearLimit || isAtLimit) && (
            <div className="flex gap-2 pt-2">
              <Link href="/dashboard/billing/upgrade">
                <Button size="sm" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Uppgradera till Basic
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="sm" variant="outline">
                  Se alla planer
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}
