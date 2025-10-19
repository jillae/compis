
'use client';

import { useState, useEffect } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  TestTube, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Key,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { GHLConnectionStatus } from '@/components/ghl/ghl-connection-status';

interface GHLConfig {
  enabled: boolean;
  hasApiKey: boolean;
  hasLocationId: boolean;
  lastSync: string | null;
}

export function GHLConfigForm() {
  const { selectedClinic } = useClinic();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [locationId, setLocationId] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [existingConfig, setExistingConfig] = useState<GHLConfig | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch existing config when clinic changes
  useEffect(() => {
    if (selectedClinic) {
      fetchConfig();
    } else {
      setLoading(false);
      setExistingConfig(null);
    }
  }, [selectedClinic]);

  const fetchConfig = async () => {
    if (!selectedClinic) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/ghl/config?clinicId=${selectedClinic}`);
      const data = await res.json();
      
      if (data.success && data.config) {
        setExistingConfig(data.config);
        setEnabled(data.config.enabled);
        // Don't load actual API keys for security - show masked if exists
        setApiKey('');
        setLocationId('');
      }
    } catch (error) {
      toast.error('Kunde inte ladda GHL-konfiguration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedClinic) {
      toast.error('Ingen klinik vald');
      return;
    }

    if (enabled && (!apiKey && !existingConfig?.hasApiKey)) {
      toast.error('API Key krävs när GHL är aktiverat');
      return;
    }

    if (enabled && (!locationId && !existingConfig?.hasLocationId)) {
      toast.error('Location ID krävs när GHL är aktiverat');
      return;
    }

    setSaving(true);
    try {
      const payload: any = { enabled };
      
      // Only include keys if they're being updated (non-empty)
      if (apiKey) payload.apiKey = apiKey;
      if (locationId) payload.locationId = locationId;

      const res = await fetch(`/api/ghl/config?clinicId=${selectedClinic}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        toast.success('GHL-konfiguration sparad!');
        fetchConfig(); // Refresh
        setApiKey(''); // Clear form
        setLocationId('');
      } else {
        toast.error(data.error || 'Kunde inte spara konfiguration');
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedClinic) {
      toast.error('Ingen klinik vald');
      return;
    }

    if (!existingConfig?.hasApiKey || !existingConfig?.hasLocationId) {
      toast.error('API Key och Location ID måste vara konfigurerade för att testa');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Call a test endpoint (we need to create this)
      const res = await fetch(`/api/ghl/test?clinicId=${selectedClinic}`, {
        method: 'POST'
      });
      
      const data = await res.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: 'Anslutningen fungerar! GHL API svarar korrekt.'
        });
        toast.success('Test lyckades!');
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Anslutningen misslyckades'
        });
        toast.error('Test misslyckades');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Ett oväntat fel uppstod vid test'
      });
      toast.error('Ett fel uppstod');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!selectedClinic) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Välj en klinik i dropdown-menyn för att konfigurera GoHighLevel.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>GHL Configuration</CardTitle>
              <CardDescription>
                Konfigurera GoHighLevel CRM-integration för synkronisering av kunder och bokningar
              </CardDescription>
            </div>
            {existingConfig?.enabled && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Aktiv
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <Label htmlFor="ghl-enabled" className="text-base font-semibold">
                Aktivera GHL Integration
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Synkronisera automatiskt kunder och bokningar med GoHighLevel
              </p>
            </div>
            <Switch
              id="ghl-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <Separator />

          {/* API Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key
                {existingConfig?.hasApiKey && (
                  <Badge variant="outline" className="text-xs">Konfigurerad</Badge>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={existingConfig?.hasApiKey ? '••••••••••••••••' : 'Ange GHL API Key'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={!enabled}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={!enabled}
                >
                  {showApiKey ? '🙈' : '👁️'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Hitta din API Key i GoHighLevel → Settings → API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-id" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location ID
                {existingConfig?.hasLocationId && (
                  <Badge variant="outline" className="text-xs">Konfigurerad</Badge>
                )}
              </Label>
              <Input
                id="location-id"
                type="text"
                placeholder={existingConfig?.hasLocationId ? '••••••••••••••••' : 'Ange GHL Location ID'}
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={!enabled}
              />
              <p className="text-xs text-muted-foreground">
                Din Location ID finns i URL:en när du är inloggad i GHL
              </p>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || (!apiKey && !locationId && enabled === existingConfig?.enabled)}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Spara Konfiguration
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !existingConfig?.hasApiKey || !existingConfig?.hasLocationId}
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testar...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => window.open('https://app.gohighlevel.com', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Öppna GHL
            </Button>
          </div>

          {/* Help Text */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Så här hittar du dina GHL-uppgifter:</strong>
              <ol className="list-decimal ml-4 mt-2 space-y-1">
                <li>Logga in på <a href="https://app.gohighlevel.com" target="_blank" className="underline">GoHighLevel</a></li>
                <li>Gå till Settings → API → Agency API Key</li>
                <li>Kopiera API Key och Location ID</li>
                <li>Klistra in uppgifterna här och spara</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Connection Status */}
      {enabled && existingConfig?.hasApiKey && existingConfig?.hasLocationId && (
        <GHLConnectionStatus />
      )}
    </div>
  );
}
