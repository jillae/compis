
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  TestTube2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface GHLConfig {
  enabled: boolean;
  hasApiKey: boolean;
  hasLocationId: boolean;
  lastSync: string | null;
}

interface GHLConfigFormProps {
  clinicId: string;
  clinicName: string;
}

export function GHLConfigForm({ clinicId, clinicName }: GHLConfigFormProps) {
  const [config, setConfig] = useState<GHLConfig | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [locationId, setLocationId] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Fetch current config on mount
  React.useEffect(() => {
    fetchConfig();
  }, [clinicId]);

  // Fetch current config
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ghl/config?clinicId=${clinicId}`);
      const data = await res.json();
      
      if (data.success) {
        setConfig(data.config);
        setEnabled(data.config.enabled);
      }
    } catch (error) {
      toast.error('Kunde inte hämta GHL-konfiguration');
    } finally {
      setLoading(false);
    }
  };

  // Save config
  const handleSave = async () => {
    if (!apiKey && !config?.hasApiKey) {
      toast.error('API Key krävs');
      return;
    }

    if (!locationId && !config?.hasLocationId) {
      toast.error('Location ID krävs');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/ghl/config?clinicId=${clinicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          apiKey: apiKey || undefined,
          locationId: locationId || undefined
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('GHL-konfiguration sparad!');
        await fetchConfig(); // Refresh config
        setApiKey(''); // Clear sensitive field
      } else {
        toast.error('Kunde inte spara konfiguration');
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!apiKey && !config?.hasApiKey) {
      toast.error('API Key krävs för att testa anslutning');
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      // Test by fetching GHL location details
      const testApiKey = apiKey || 'existing'; // Use existing if not changed
      const res = await fetch(`https://rest.gohighlevel.com/v1/locations/${locationId || 'test'}`, {
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setTestResult('success');
        toast.success('Anslutningen lyckades! ✅');
      } else {
        setTestResult('error');
        toast.error('Anslutningen misslyckades. Kontrollera dina credentials.');
      }
    } catch (error) {
      setTestResult('error');
      toast.error('Kunde inte ansluta till GoHighLevel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GoHighLevel Configuration</CardTitle>
        <CardDescription>
          Konfigurera GoHighLevel-integration för <strong>{clinicName}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="ghl-enabled" className="text-base font-semibold">
              Aktivera GHL Integration
            </Label>
            <p className="text-sm text-muted-foreground">
              Synkronisera bokningar och kunder med GoHighLevel CRM
            </p>
          </div>
          <Switch
            id="ghl-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="ghl-api-key">
                API Key
                {config?.hasApiKey && (
                  <Badge variant="secondary" className="ml-2">Konfigurerad</Badge>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="ghl-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config?.hasApiKey ? '••••••••••••••••' : 'Ange GHL API Key'}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Hitta din API Key i GoHighLevel → Settings → Integrations
              </p>
            </div>

            {/* Location ID */}
            <div className="space-y-2">
              <Label htmlFor="ghl-location-id">
                Location ID
                {config?.hasLocationId && (
                  <Badge variant="secondary" className="ml-2">Konfigurerad</Badge>
                )}
              </Label>
              <Input
                id="ghl-location-id"
                type="text"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder={config?.hasLocationId ? 'abc123...' : 'Ange GHL Location ID'}
              />
              <p className="text-xs text-muted-foreground">
                Hitta Location ID i GoHighLevel-URL:en (e.g., app.gohighlevel.com/location/<strong>abc123</strong>)
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <Alert variant={testResult === 'success' ? 'default' : 'destructive'}>
                {testResult === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {testResult === 'success'
                    ? 'Anslutningen till GoHighLevel lyckades!'
                    : 'Anslutningen misslyckades. Kontrollera API Key och Location ID.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Last Sync */}
            {config?.lastSync && (
              <div className="text-sm text-muted-foreground">
                Senaste synk: {new Date(config.lastSync).toLocaleString('sv-SE')}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube2 className="h-4 w-4 mr-2" />
                )}
                Testa Anslutning
              </Button>

              <Button
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Spara Konfiguration
              </Button>
            </div>
          </>
        )}

        {!enabled && (
          <Alert>
            <AlertDescription>
              Aktivera GHL-integration för att synkronisera bokningar och kunder med GoHighLevel CRM.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
