
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Mic, 
  MicOff, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  XCircle, 
  Activity,
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Provider {
  id: string;
  provider_name: string;
  display_name: string;
  api_endpoint: string | null;
  port: number | null;
  is_active: boolean;
  priority_order: number;
  max_retry_attempts: number;
  timeout_seconds: number;
  config_json: Record<string, any>;
}

interface ProviderStats {
  id: string;
  display_name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_processing_time: number;
  total_audio_duration: number;
}

export function STTProviderManager() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
    fetchStats();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/superadmin/stt/providers');
      const data = await res.json();
      
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      toast.error('Kunde inte hämta providers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/superadmin/stt/stats?days=7');
      const data = await res.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Could not fetch stats:', error);
    }
  };

  const handleToggleActive = async (providerId: string, currentState: boolean) => {
    try {
      const res = await fetch('/api/superadmin/stt/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: providerId,
          updates: { is_active: !currentState }
        })
      });

      if (res.ok) {
        toast.success('Provider uppdaterad');
        fetchProviders();
      } else {
        toast.error('Kunde inte uppdatera provider');
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
    }
  };

  const handleMoveUp = async (provider: Provider) => {
    if (provider.priority_order === 1) return;

    const otherProvider = providers.find(p => p.priority_order === provider.priority_order - 1);
    if (!otherProvider) return;

    await reorderProviders([
      { id: provider.id, priority_order: provider.priority_order - 1 },
      { id: otherProvider.id, priority_order: otherProvider.priority_order + 1 }
    ]);
  };

  const handleMoveDown = async (provider: Provider) => {
    if (provider.priority_order === providers.length) return;

    const otherProvider = providers.find(p => p.priority_order === provider.priority_order + 1);
    if (!otherProvider) return;

    await reorderProviders([
      { id: provider.id, priority_order: provider.priority_order + 1 },
      { id: otherProvider.id, priority_order: otherProvider.priority_order - 1 }
    ]);
  };

  const reorderProviders = async (providerOrder: { id: string; priority_order: number }[]) => {
    try {
      const res = await fetch('/api/superadmin/stt/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerOrder })
      });

      if (res.ok) {
        toast.success('Ordning uppdaterad');
        fetchProviders();
      } else {
        toast.error('Kunde inte uppdatera ordning');
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
    }
  };

  const testProvider = async (provider: Provider) => {
    setTesting(provider.id);
    
    try {
      // Create a test audio blob (1 second of silence)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 1;
      const numSamples = sampleRate * duration;
      const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
      
      // Export to WAV
      const testBlob = new Blob([new ArrayBuffer(44 + numSamples * 2)], { type: 'audio/wav' });
      
      const formData = new FormData();
      formData.append('file', testBlob, 'test.wav');

      const res = await fetch('/api/stt/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`✓ ${provider.display_name}: Fungerar!`, {
          description: `Provider: ${data.provider_used}`
        });
      } else {
        toast.error(`✗ ${provider.display_name}: Misslyckades`, {
          description: data.error || 'Okänt fel'
        });
      }
    } catch (error: any) {
      toast.error(`✗ ${provider.display_name}: Fel`, {
        description: error.message
      });
    } finally {
      setTesting(null);
    }
  };

  const getProviderStats = (providerId: string) => {
    return stats.find(s => s.id === providerId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">STT Provider Configuration</h2>
        <p className="text-muted-foreground mt-2">
          Hantera Speech-to-Text providers med automatisk fallback. Providers körs i prioritetsordning.
        </p>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">Fallback-ordning</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Vid transkribering försöks provider #1 först. Om den misslyckas, testas #2, sedan #3 osv. 
                Använd pilknapparna för att ändra ordning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="space-y-4">
        {providers.map((provider) => {
          const providerStats = getProviderStats(provider.id);
          const successRate = providerStats 
            ? ((providerStats.successful_requests / providerStats.total_requests) * 100).toFixed(1)
            : null;

          return (
            <Card key={provider.id} className={`${!provider.is_active && 'opacity-60'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Priority Badge */}
                    <div className="flex flex-col items-center gap-1">
                      <Badge 
                        variant={provider.priority_order === 1 ? 'default' : 'secondary'}
                        className="text-lg font-bold w-12 h-12 flex items-center justify-center"
                      >
                        {provider.priority_order}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(provider)}
                          disabled={provider.priority_order === 1}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(provider)}
                          disabled={provider.priority_order === providers.length}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Provider Info */}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {provider.is_active ? (
                          <Mic className="h-5 w-5 text-green-600" />
                        ) : (
                          <MicOff className="h-5 w-5 text-muted-foreground" />
                        )}
                        {provider.display_name}
                        {provider.priority_order === 1 && (
                          <Badge variant="default">Primär</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {provider.api_endpoint 
                          ? `${provider.api_endpoint}:${provider.port}` 
                          : 'OpenAI Cloud API'}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {provider.provider_name === 'openai' && (
                      <Link href={`/superadmin/stt-providers/${provider.id}`}>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </Link>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testProvider(provider)}
                      disabled={testing === provider.id || !provider.is_active}
                    >
                      {testing === provider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Activity className="h-4 w-4 mr-2" />
                      )}
                      Test
                    </Button>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={provider.is_active}
                        onCheckedChange={() => handleToggleActive(provider.id, provider.is_active)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {provider.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Config */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Konfiguration</p>
                    <div className="space-y-1 text-sm">
                      <p>Timeout: {provider.timeout_seconds}s</p>
                      <p>Max retry: {provider.max_retry_attempts}</p>
                    </div>
                  </div>

                  {/* Stats (7 days) */}
                  {providerStats && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Requests (7d)</p>
                        <p className="text-2xl font-bold">{providerStats.total_requests}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{successRate || '—'}%</p>
                          {successRate && parseFloat(successRate) > 90 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : successRate ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Avg Processing Time</p>
                        <p className="text-2xl font-bold">
                          {providerStats.avg_processing_time ? providerStats.avg_processing_time.toFixed(2) + 's' : '—'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
