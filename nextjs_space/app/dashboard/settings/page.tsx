
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

      {/* Data Sources - IMPROVED: More visual, clearer that switches are the only interactive element */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Datakällor & Integrationer
          </CardTitle>
          <CardDescription>
            Aktivera eller inaktivera integrationer med toggle-knapparna
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Bokadirekt */}
          <div className="p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="bokadirekt" className="text-base font-semibold cursor-pointer">
                    Bokadirekt Integration
                  </Label>
                  {settings.bokadirektEnabled && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Aktiv
                    </span>
                  )}
                </div>
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
          </div>

          {/* Corex */}
          <div className="p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="corex" className="text-base font-semibold cursor-pointer">
                    Corex Integration
                  </Label>
                  {settings.corexEnabled && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Aktiv
                    </span>
                  )}
                </div>
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
          </div>

          {/* Meta Ads */}
          <div className="p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="meta" className="text-base font-semibold cursor-pointer">
                    Meta Marketing Integration
                  </Label>
                  {settings.metaEnabled && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Aktiv
                    </span>
                  )}
                </div>
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
          </div>
        </CardContent>
      </Card>

      {/* AI Features - IMPROVED: Same visual treatment */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            AI-Funktioner
          </CardTitle>
          <CardDescription>
            Aktivera eller inaktivera AI-drivna funktioner med toggle-knapparna
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* AI Actions */}
          <div className="p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="ai-actions" className="text-base font-semibold cursor-pointer">
                    AI Action Recommendations
                  </Label>
                  {settings.aiActionsEnabled && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Aktiv
                    </span>
                  )}
                </div>
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
          </div>

          {/* Dynamic Pricing */}
          <div className="p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="dynamic-pricing" className="text-base font-semibold cursor-pointer">
                    Dynamic Pricing Intelligence
                  </Label>
                  {settings.dynamicPricingEnabled && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Aktiv
                    </span>
                  )}
                </div>
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
          </div>

          {/* Retention Autopilot */}
          <div className="p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="retention" className="text-base font-semibold cursor-pointer">
                    Retention Autopilot
                  </Label>
                  {settings.retentionAutopilotEnabled && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Aktiv
                    </span>
                  )}
                </div>
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
