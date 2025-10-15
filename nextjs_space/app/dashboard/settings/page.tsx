
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Check, Loader2, Settings, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface FeatureToggles {
  bokadirektEnabled: boolean;
  metaEnabled: boolean;
  corexEnabled: boolean;
  dynamicPricingEnabled: boolean;
  retentionAutopilotEnabled: boolean;
  aiActionsEnabled: boolean;
}

export default function SettingsPage() {
  const { data: session, status } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FeatureToggles>({
    bokadirektEnabled: true,
    metaEnabled: false,
    corexEnabled: false,
    dynamicPricingEnabled: false,
    retentionAutopilotEnabled: false,
    aiActionsEnabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/features');
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Kunde inte hämta inställningar');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof FeatureToggles) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast.success('Inställningar sparade!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Kunde inte spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inställningar</h1>
          <p className="text-muted-foreground">
            Hantera integrationerna och funktionerna för din klinik
          </p>
        </div>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aktivera eller inaktivera funktioner baserat på vad din klinik behöver. 
          Ändringar sparas direkt och påverkar alla användare.
        </AlertDescription>
      </Alert>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Datakällor & Integrationer
          </CardTitle>
          <CardDescription>
            Hantera anslutningar till externa system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bokadirekt */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="bokadirekt" className="text-base font-medium">
                Bokadirekt Integration
              </Label>
              <p className="text-sm text-muted-foreground">
                Synkronisera bokningar, kunder och tjänster från Bokadirekt
              </p>
            </div>
            <Switch
              id="bokadirekt"
              checked={settings.bokadirektEnabled}
              onCheckedChange={() => handleToggle('bokadirektEnabled')}
            />
          </div>

          <Separator />

          {/* Corex */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="corex" className="text-base font-medium">
                Corex Integration
              </Label>
              <p className="text-sm text-muted-foreground">
                Omnichannel-assistent för SMS, påminnelser och kundkommunikation
              </p>
            </div>
            <Switch
              id="corex"
              checked={settings.corexEnabled}
              onCheckedChange={() => handleToggle('corexEnabled')}
            />
          </div>

          <Separator />

          {/* Meta Ads */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="meta" className="text-base font-medium">
                Meta Marketing Integration
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatisk optimering av Facebook/Instagram-annonser
              </p>
            </div>
            <Switch
              id="meta"
              checked={settings.metaEnabled}
              onCheckedChange={() => handleToggle('metaEnabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            AI-Funktioner
          </CardTitle>
          <CardDescription>
            Aktivera eller inaktivera AI-drivna funktioner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Actions */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="ai-actions" className="text-base font-medium">
                AI Action Recommendations
              </Label>
              <p className="text-sm text-muted-foreground">
                Veckovisa AI-genererade rekommendationer för att öka intäkter
              </p>
            </div>
            <Switch
              id="ai-actions"
              checked={settings.aiActionsEnabled}
              onCheckedChange={() => handleToggle('aiActionsEnabled')}
            />
          </div>

          <Separator />

          {/* Dynamic Pricing */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="dynamic-pricing" className="text-base font-medium">
                Dynamic Pricing Intelligence
              </Label>
              <p className="text-sm text-muted-foreground">
                AI-baserade prisrekommendationer baserat på efterfrågan och konkurrens
              </p>
            </div>
            <Switch
              id="dynamic-pricing"
              checked={settings.dynamicPricingEnabled}
              onCheckedChange={() => handleToggle('dynamicPricingEnabled')}
            />
          </div>

          <Separator />

          {/* Retention Autopilot */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="retention" className="text-base font-medium">
                Retention Autopilot
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatiska kampanjer för att återaktivera inaktiva kunder
              </p>
            </div>
            <Switch
              id="retention"
              checked={settings.retentionAutopilotEnabled}
              onCheckedChange={() => handleToggle('retentionAutopilotEnabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Spara inställningar
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Tips:</strong> Du kan när som helst aktivera eller inaktivera funktioner.
            Inaktiverade funktioner visas inte i menyn och använder inga resurser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
