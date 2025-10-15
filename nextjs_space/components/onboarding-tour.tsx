
'use client';

import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Välkommen till Flow! 🚀</h2>
        <p>Låt oss visa dig hur du använder plattformen för att maximera din kliniks intäkter.</p>
      </div>
    ),
    placement: 'center',
  },
  {
    target: '[data-tour="actions-card"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold">AI-Rekommendationer ✨</h3>
        <p>Varje vecka analyserar Flow din data och ger dig 3 konkreta åtgärder för att öka intäkter.</p>
      </div>
    ),
  },
  {
    target: '[data-tour="simulator-card"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold">Intäktssimulator 📊</h3>
        <p>Testa "what-if" scenarion och se hur olika förändringar påverkar din årsintäkt.</p>
      </div>
    ),
  },
  {
    target: '[data-tour="marketing-card"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold">Marketing Intelligence 📈</h3>
        <p>Automatisk optimering av Meta-annonser baserat på din kapacitet och efterfrågan.</p>
      </div>
    ),
  },
  {
    target: '[data-tour="overview-cards"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold">Översikt 📌</h3>
        <p>Snabb överblick av nyckeltal: bokningar, intäkter, genomförande och riskbokningar.</p>
      </div>
    ),
  },
  {
    target: '[data-tour="time-period-selector"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold">Tidsperiod 📅</h3>
        <p>Filtrera all data för olika tidsperioder: 30 dagar, 90 dagar, innevarande år, etc.</p>
      </div>
    ),
  },
  {
    target: '[data-tour="hamburger-menu"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold">Meny & Inställningar ⚙️</h3>
        <p>Här hittar du personal, rapporter, integrations-inställningar och mer.</p>
      </div>
    ),
  },
  {
    target: 'body',
    content: (
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Du är redo! 🎉</h2>
        <p>Börja utforska Flow och öka dina intäkter med data-drivna insikter.</p>
      </div>
    ),
    placement: 'center',
  },
];

interface OnboardingTourProps {
  run?: boolean;
  onComplete?: () => void;
}

export function OnboardingTour({ run = false, onComplete }: OnboardingTourProps) {
  const [tourRun, setTourRun] = useState(false);

  useEffect(() => {
    if (run) {
      setTourRun(true);
    }
  }, [run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setTourRun(false);
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={tourRun}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#8b5cf6',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#8b5cf6',
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 8,
        },
        buttonSkip: {
          color: '#9ca3af',
        },
      }}
      locale={{
        back: 'Tillbaka',
        close: 'Stäng',
        last: 'Avsluta',
        next: 'Nästa',
        skip: 'Hoppa över',
      }}
    />
  );
}
