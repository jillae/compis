
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ConnectionStatus {
  connected: boolean;
  lastSync: string | null;
  error: string | null;
  tokenExpiresAt: string | null;
}

export function MetaConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketing/meta/connection-status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking Meta connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshConnection = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/marketing/meta/refresh-token', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Meta-anslutning uppdaterad!');
        await checkConnection();
      } else {
        toast.error(data.error || 'Kunde inte uppdatera anslutning');
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      toast.error('Ett fel uppstod');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Kontrollerar Meta-anslutning...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const isExpiringSoon = status.tokenExpiresAt 
    ? new Date(status.tokenExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 
    : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img src="/meta-icon.png" alt="Meta" className="h-5 w-5" />
          Meta Marketing API Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status.connected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Ansluten</p>
                  {status.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Senast synkad: {new Date(status.lastSync).toLocaleString('sv-SE')}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-700">Frånkopplad</p>
                  <p className="text-xs text-muted-foreground">Anslutning behövs</p>
                </div>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshConnection}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Uppdaterar...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Testa Anslutning
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {status.error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm">
              <strong>Fel:</strong> {status.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Token Expiry Warning */}
        {isExpiringSoon && status.connected && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm">
              <strong>Uppmärksamhet:</strong> Din Meta-token upphör snart. Förnya den för att undvika avbrott.
              <br />
              <span className="text-xs text-muted-foreground">
                Upphör: {status.tokenExpiresAt ? new Date(status.tokenExpiresAt).toLocaleDateString('sv-SE') : 'Okänt'}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {status.error && (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open('/META_API_FIX_GUIDE.md', '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visa Fix-Guide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/dashboard/settings', '_self')}
              className="flex-1"
            >
              Gå till Inställningar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
