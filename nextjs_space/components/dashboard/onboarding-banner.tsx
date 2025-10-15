
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { OnboardingTour } from '../onboarding-tour';

export function OnboardingBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding tour
    const tourCompleted = localStorage.getItem('flow-tour-completed');
    if (!tourCompleted) {
      setShowBanner(true);
    }
  }, []);

  const handleStartTour = () => {
    setShowBanner(false);
    setRunTour(true);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('flow-tour-completed', 'true');
  };

  const handleTourComplete = () => {
    localStorage.setItem('flow-tour-completed', 'true');
  };

  if (!showBanner) {
    return <OnboardingTour run={runTour} onComplete={handleTourComplete} />;
  }

  return (
    <>
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Välkommen till Flow!</h3>
                <p className="text-sm text-purple-700">
                  Ta en snabb genomgång och lär dig hur du maximerar intäkter med Flow (2 min)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleStartTour}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Starta guiden
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <OnboardingTour run={runTour} onComplete={handleTourComplete} />
    </>
  );
}
