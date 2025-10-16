
'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Info, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function DynamicPricingToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pricing/dynamic/status');
      const data = await response.json();
      if (data.success) {
        setEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error fetching Dynamic Pricing status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (newValue: boolean) => {
    if (newValue && !hasAcceptedTerms) {
      setShowWarning(true);
      return;
    }

    try {
      const response = await fetch('/api/pricing/dynamic/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue }),
      });

      const data = await response.json();
      if (data.success) {
        setEnabled(newValue);
        toast.success(
          newValue 
            ? 'Dynamic Pricing aktiverad!' 
            : 'Dynamic Pricing inaktiverad'
        );
        setShowWarning(false);
      } else {
        toast.error('Kunde inte uppdatera inställning');
      }
    } catch (error) {
      console.error('Error toggling Dynamic Pricing:', error);
      toast.error('Ett fel uppstod');
    }
  };

  const acceptAndEnable = () => {
    setHasAcceptedTerms(true);
    handleToggle(true);
  };

  if (loading) {
    return (
      <div className="animate-pulse h-8 w-32 bg-muted rounded"></div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        <Switch
          id="dynamic-pricing"
          checked={enabled}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="dynamic-pricing" className="cursor-pointer">
          Dynamic Pricing Intelligence
        </Label>
      </div>

      {/* Legal Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              Viktig information om Dynamic Pricing
            </DialogTitle>
            <DialogDescription className="text-base">
              Läs noga igenom följande innan du aktiverar Dynamic Pricing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Legal Disclaimer */}
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-sm leading-relaxed">
                <strong className="block mb-2">⚖️ Juridiskt Ansvar:</strong>
                Aktivering av Dynamic Pricing innebär att priser kan justeras automatiskt baserat på 
                marknadsförhållanden, efterfrågan och konkurrenssituation. Du är ansvarig för att:
                
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Säkerställa att användningen följer gällande lagar och regler</li>
                  <li>Informera kunder om dynamisk prissättning enligt konsumentlagstiftning</li>
                  <li>Upprätthålla transparens i marknadsföring och priskommunikation</li>
                  <li>Följa Marknadsföringslagen (2008:486) och Prisinformationslagen (2004:347)</li>
                  <li>Dokumentera prissättningslogik för eventuell granskning</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Best Practices */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-sm leading-relaxed">
                <strong className="block mb-2">✅ Rekommenderade Åtgärder:</strong>
                
                <ul className="list-disc ml-6 space-y-1">
                  <li>Uppdatera din integritetspolicy och villkor</li>
                  <li>Informera kunder om att priser kan variera</li>
                  <li>Sätt rimliga min/max-gränser för prisfluktuationer</li>
                  <li>Övervaka systemet regelbundet</li>
                  <li>Ha en tydlig priskommunikationsstrategi</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Risks */}
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-sm leading-relaxed">
                <strong className="block mb-2">⚠️ Potentiella Risker:</strong>
                
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Juridiska konsekvenser:</strong> Vid bristande transparens eller vilseledande prissättning</li>
                  <li><strong>Kundförtroende:</strong> Oväntade prisförändringar kan skada relationer</li>
                  <li><strong>Etiska dilemman:</strong> Diskriminerande prissättning är olagligt</li>
                  <li><strong>Konkurrensrättsliga frågor:</strong> Samordnad prissättning är förbjuden</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Terms Acceptance */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="accept-terms" className="text-sm cursor-pointer">
                  <strong>Jag bekräftar att jag har läst och förstått ovanstående information.</strong>
                  <br />
                  Jag tar fullt ansvar för användningen av Dynamic Pricing och säkerställer att all 
                  användning följer gällande lagar och regler. Jag förstår att otillräcklig transparens 
                  kan medföra rättsliga eller etiska konsekvenser.
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWarning(false)}
            >
              Avbryt
            </Button>
            <Button
              onClick={acceptAndEnable}
              disabled={!hasAcceptedTerms}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Jag förstår - Aktivera Dynamic Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
