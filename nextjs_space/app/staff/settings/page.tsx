
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, RefreshCw, Settings } from 'lucide-react';

export default function StaffSettingsPage() {
  const { data: session } = useSession() || {};
  const [clinicId, setClinicId] = useState<string>('');
  const [clockifyApiKey, setClockifyApiKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    workspaceName?: string;
    lastSyncAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checking, setChecking] = useState(false);

  // Get clinic ID from session
  useEffect(() => {
    if (session?.user && 'clinicId' in session.user) {
      setClinicId((session.user as any).clinicId || '');
    }
  }, [session]);

  // Check connection status on load
  useEffect(() => {
    if (clinicId) {
      checkConnectionStatus();
    }
  }, [clinicId]);

  const checkConnectionStatus = async () => {
    if (!clinicId) return;

    setChecking(true);
    try {
      const res = await fetch(`/api/staff/clockify/connect?clinicId=${clinicId}`);
      const data = await res.json();

      if (data.success) {
        setConnectionStatus({
          connected: data.connected,
          workspaceName: data.workspaceName,
          lastSyncAt: data.lastSyncAt,
        });
      }
    } catch (error: any) {
      console.error('Error checking connection:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    if (!clockifyApiKey || !clinicId) {
      toast.error('API-nyckel krävs');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/staff/clockify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          clockifyApiKey,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Ansluten till Clockify! Workspace: ${data.defaultWorkspace.name}`);
        setConnectionStatus({
          connected: true,
          workspaceName: data.defaultWorkspace.name,
          lastSyncAt: new Date().toISOString(),
        });
        setClockifyApiKey(''); // Clear API key from UI
      } else {
        toast.error(data.error || 'Kunde inte ansluta');
      }
    } catch (error: any) {
      console.error('Error connecting:', error);
      toast.error('Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncUsers = async () => {
    if (!clinicId) return;

    setSyncing(true);
    try {
      const res = await fetch('/api/staff/clockify/sync-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Synkroniserade ${data.synced} användare från Clockify`);
        if (data.failed > 0) {
          toast.warning(`${data.failed} användare misslyckades`);
        }
        checkConnectionStatus();
      } else {
        toast.error(data.error || 'Synkronisering misslyckades');
      }
    } catch (error: any) {
      console.error('Error syncing:', error);
      toast.error('Något gick fel');
    } finally {
      setSyncing(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Logga in för att se inställningar</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Personalinställningar</h1>
        <p className="text-muted-foreground mt-2">
          Hantera integration med Clockify för schemaläggning och tidrapportering
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Clockify Integration
          </CardTitle>
          <CardDescription>
            Anslut till Clockify för att synkronisera personal, schema och tidrapporter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          {checking ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Kontrollerar anslutning...
            </div>
          ) : connectionStatus ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {connectionStatus.connected ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Ansluten
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Ej ansluten
                  </Badge>
                )}
              </div>

              {connectionStatus.connected && (
                <>
                  <div className="text-sm">
                    <span className="font-medium">Workspace:</span>{' '}
                    <span className="text-muted-foreground">{connectionStatus.workspaceName}</span>
                  </div>
                  {connectionStatus.lastSyncAt && (
                    <div className="text-sm">
                      <span className="font-medium">Senast synkroniserad:</span>{' '}
                      <span className="text-muted-foreground">
                        {new Date(connectionStatus.lastSyncAt).toLocaleString('sv-SE')}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}

          {/* Connect Form */}
          {!connectionStatus?.connected && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clockifyApiKey">Clockify API-nyckel</Label>
                <Input
                  id="clockifyApiKey"
                  type="password"
                  placeholder="Klistra in din Clockify API-nyckel"
                  value={clockifyApiKey}
                  onChange={(e) => setClockifyApiKey(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Hämta din API-nyckel från{' '}
                  <a
                    href="https://clockify.me/user/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    Clockify Settings
                  </a>
                </p>
              </div>

              <Button onClick={handleConnect} disabled={loading || !clockifyApiKey}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Anslut till Clockify
              </Button>
            </div>
          )}

          {/* Sync Users */}
          {connectionStatus?.connected && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h3 className="text-sm font-medium mb-1">Synkronisera användare</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Hämta alla användare från Clockify och lägg till dem som personal i Flow
                </p>
                <Button onClick={handleSyncUsers} disabled={syncing} variant="outline">
                  {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {syncing ? 'Synkroniserar...' : <RefreshCw className="mr-2 h-4 w-4" />}
                  Synkronisera nu
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium">Så här använder du Clockify</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Skapa ett konto på clockify.me</li>
              <li>Gå till Settings → Profile Settings</li>
              <li>Scrolla ner till "API" och generera en ny API-nyckel</li>
              <li>Klistra in nyckeln ovan och klicka på "Anslut"</li>
              <li>Synkronisera dina användare</li>
              <li>Nu kan du schemalägga personal och spåra arbetstid</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
