
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface GHLStatus {
  enabled: boolean;
  stats: {
    totalSyncs: number;
    successful: number;
    failed: number;
    lastSync: string | null;
  };
  recentLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    status: string;
    createdAt: string;
    errorMessage: string | null;
  }>;
}

export function GHLConnectionStatus() {
  const [status, setStatus] = useState<GHLStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ghl/sync');
      const data = await res.json();
      
      if (data.success) {
        setStatus(data);
      }
    } catch (error) {
      toast.error('Kunde inte hämta GHL-status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status?.enabled) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          GoHighLevel-integration är inte aktiverad. Gå till inställningar för att konfigurera.
        </AlertDescription>
      </Alert>
    );
  }

  const successRate = status.stats.totalSyncs > 0
    ? ((status.stats.successful / status.stats.totalSyncs) * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              GoHighLevel Status
              {status.enabled && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Aktiv
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time synkronisering med GoHighLevel CRM
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{status.stats.totalSyncs}</div>
            <div className="text-xs text-muted-foreground">Totalt</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{status.stats.successful}</div>
            <div className="text-xs text-muted-foreground">Lyckade</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{status.stats.failed}</div>
            <div className="text-xs text-muted-foreground">Misslyckade</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
          <span className="text-sm font-medium">Framgångsgrad:</span>
          <Badge variant={parseFloat(successRate) > 90 ? 'default' : 'destructive'}>
            {successRate}%
          </Badge>
        </div>

        {/* Last Sync */}
        {status.stats.lastSync && (
          <div className="text-sm text-muted-foreground">
            Senaste synk: {new Date(status.stats.lastSync).toLocaleString('sv-SE')}
          </div>
        )}

        {/* Recent Activity */}
        {status.recentLogs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Senaste aktiviteter</h4>
            <div className="space-y-2">
              {status.recentLogs.slice(0, 5).map((log) => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="capitalize">{log.action} {log.entityType}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString('sv-SE')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link to GHL */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open('https://app.gohighlevel.com', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Öppna GoHighLevel
        </Button>
      </CardContent>
    </Card>
  );
}
