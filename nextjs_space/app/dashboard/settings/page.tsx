
'use client';
import { BackButton } from '@/components/ui/back-button';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Check, Loader2, Settings, Zap, MessageSquare, Info, Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { DynamicPricingToggle } from '@/components/dynamic-pricing/dynamic-pricing-toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

interface FeatureToggles {
  bokadirektEnabled: boolean;
  metaEnabled: boolean;
  corexEnabled: boolean;
  corexRemindersEnabled: boolean;
  corexReminderTonality: string;
  corexReminderTemplate: string | null;
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
    corexRemindersEnabled: false,
    corexReminderTonality: 'professional',
    corexReminderTemplate: null,
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

  const handleSettingChange = (key: keyof FeatureToggles, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
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
      <BackButton href="/dashboard" />
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

          {/* Corex Reminders - Only show if Corex is enabled */}
          {settings.corexEnabled && (
            <div className="p-4 border-2 border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="corex-reminders" className="text-base font-semibold cursor-pointer">
                        Corex AI Påminnelser
                      </Label>
                      {settings.corexRemindersEnabled && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          Aktiv
                        </span>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">
                              Om du vill använda Corex AI påminnelser, kom ihåg att slå av automatiska påminnelser i Bokadirekt för att undvika dubbla meddelanden.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Intelligenta påminnelser med AI som kan svara på kundfrågor
                    </p>
                  </div>
                  <Switch
                    id="corex-reminders"
                    checked={settings.corexRemindersEnabled}
                    onCheckedChange={() => handleToggle('corexRemindersEnabled')}
                  />
                </div>

                {/* Tonality Select - Only show if reminders enabled */}
                {settings.corexRemindersEnabled && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="tonality" className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Tonalitet för påminnelser
                      </Label>
                      <Select
                        value={settings.corexReminderTonality || 'professional'}
                        onValueChange={(value) =>
                          handleSettingChange('corexReminderTonality', value)
                        }
                      >
                        <SelectTrigger id="tonality" className="bg-white">
                          <SelectValue placeholder="Välj tonalitet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">
                            Professionell - "God dag! Du är bokad för..."
                          </SelectItem>
                          <SelectItem value="friendly">
                            Vänlig - "Hej! Vi ser fram emot ditt besök..."
                          </SelectItem>
                          <SelectItem value="casual">
                            Avslappnad - "Hej där! Din tid närmar sig..."
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template" className="text-sm font-medium">
                        Custom mall (valfritt)
                      </Label>
                      <Textarea
                        id="template"
                        placeholder="Hej! Corex på {clinic_name} här! Du är bokad {booking_date} kl {booking_time}. Kul, välkommen! Har du frågor så finns jag här. 😊"
                        value={settings.corexReminderTemplate || ''}
                        onChange={(e) =>
                          handleSettingChange('corexReminderTemplate', e.target.value)
                        }
                        className="min-h-[100px] bg-white"
                      />
                      <p className="text-xs text-muted-foreground">
                        Använd variabler: {'{clinic_name}'}, {'{booking_date}'}, {'{booking_time}'}, {'{service_name}'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


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

          {/* Dynamic Pricing - ENHANCED with legal compliance */}
          <div className="p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <DynamicPricingToggle
              onStatusChange={(status) => {
                setSettings((prev) => ({
                  ...prev,
                  dynamicPricingEnabled: status.enabled,
                }));
              }}
            />
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

      {/* Knowledge Management Section */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-600" />
            Kunskapshantering
          </CardTitle>
          <CardDescription>
            Träna Flow AI med dina egna samtal, dokument och länkar
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Link href="/dashboard/settings/knowledge-base">
            <div className="p-6 border-2 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold group-hover:text-emerald-700 transition-colors">
                    Kunskapsbas & AI-träning
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ladda upp telefonsamtal, dokument och länkar för att göra Flow AI mer personlig och korrekt. 
                    Ju mer innehåll, desto bättre svar.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <span className="text-xs bg-white px-3 py-1 rounded-full font-medium">
                      📞 Telefonsamtal
                    </span>
                    <span className="text-xs bg-white px-3 py-1 rounded-full font-medium">
                      📄 Dokument
                    </span>
                    <span className="text-xs bg-white px-3 py-1 rounded-full font-medium">
                      🔗 Länkar
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
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
