

'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';

interface OnboardingBannerProps {
  userId: string;
  onboardingStep: number | null;
  onboardingCompletedAt: Date | null;
}

export function OnboardingBanner({ userId, onboardingStep, onboardingCompletedAt }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user dismissed banner in this session
  useEffect(() => {
    const isDismissed = sessionStorage.getItem(`onboarding-banner-dismissed-${userId}`);
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, [userId]);

  // Don't show if onboarding is complete (step 2 done)
  const isComplete = onboardingStep === 2 && onboardingCompletedAt;

  if (isComplete || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(`onboarding-banner-dismissed-${userId}`, 'true');
    setDismissed(true);
  };

  const handlePermanentDismiss = async () => {
    setLoading(true);
    try {
      // Mark onboarding as complete to permanently hide banner
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          step: 2,
          skipStep2: true // Flag to skip step 2
        })
      });
      setDismissed(true);
    } catch (error) {
      console.error('Failed to dismiss onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert className="border-orange-600 bg-orange-50 mb-4">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-orange-900">
              Slutför din onboarding för att få full tillgång till alla funktioner
            </span>
          </div>
          <p className="text-sm text-orange-700">
            Anslut Bokadirekt och Meta API för att synka din bokningsdata och aktivera AI-driven marknadsföring.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Link href="/onboarding">
              <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700">
                <Settings className="mr-2 h-3 w-3" />
                Slutför onboarding
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Dölj denna session
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePermanentDismiss}
              disabled={loading}
              className="text-orange-600 hover:text-orange-800"
            >
              {loading ? 'Stänger...' : 'Stäng av permanent'}
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-orange-600 hover:text-orange-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
