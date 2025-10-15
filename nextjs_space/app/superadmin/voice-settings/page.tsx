
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Phone, Save, Play, Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [testText, setTestText] = useState('Hej och välkommen till kliniken! Hur kan jag hjälpa dig idag?');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/voice/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        toast.error('Kunde inte hämta voice-konfiguration');
      }
    } catch (error) {
      toast.error('Fel vid hämtning av konfiguration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/voice/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success('✅ Voice-konfiguration sparad!');
        fetchConfig();
      } else {
        toast.error('Kunde inte spara konfiguration');
      }
    } catch (error) {
      toast.error('Fel vid sparande av konfiguration');
    } finally {
      setSaving(false);
    }
  };

  const testTTS = async () => {
    if (!testText.trim()) {
      toast.error('Skriv in text att testa');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/voice/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          clinicId: config?.clinicId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult(data);
        toast.success(`✅ TTS genererat via ${data.provider} (${data.latencyMs}ms)`);

        // Play audio
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/${data.format || 'mp3'};base64,${data.audioBase64}`);
          audio.play();
        }
      } else {
        toast.error(data.error || 'TTS-test misslyckades');
        setTestResult({ error: data.error });
      }
    } catch (error: any) {
      toast.error('Fel vid TTS-test');
      setTestResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Ingen konfiguration hittades</CardTitle>
            <CardDescription>Skapa en voice-konfiguration för att komma igång</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Phone className="h-8 w-8" />
            Voice & TTS Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Konfigurera AI-röstassistent och TTS-inställningar
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Spara ändringar
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Provider Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Primär TTS-Provider</CardTitle>
              <CardDescription>
                Välj primär text-to-speech provider och konfigurera inställningar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={config.primaryProvider}
                  onValueChange={(value) =>
                    setConfig({ ...config, primaryProvider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPENAI">OpenAI TTS</SelectItem>
                    <SelectItem value="ELEVENLABS">ElevenLabs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.primaryProvider === 'OPENAI' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-semibold">OpenAI Inställningar</h4>
                    
                    <div className="space-y-2">
                      <Label>Röst</Label>
                      <Select
                        value={config.openaiVoice}
                        onValueChange={(value) =>
                          setConfig({ ...config, openaiVoice: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alloy">Alloy</SelectItem>
                          <SelectItem value="echo">Echo</SelectItem>
                          <SelectItem value="fable">Fable</SelectItem>
                          <SelectItem value="onyx">Onyx</SelectItem>
                          <SelectItem value="nova">Nova ⭐ (Rekommenderad för svenska)</SelectItem>
                          <SelectItem value="shimmer">Shimmer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Modell</Label>
                      <Select
                        value={config.openaiModel}
                        onValueChange={(value) =>
                          setConfig({ ...config, openaiModel: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tts-1">TTS-1 (Snabbare, lägre kvalitet)</SelectItem>
                          <SelectItem value="tts-1-hd">TTS-1-HD (Högre kvalitet)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Talhastighet: {config.openaiSpeed}x</Label>
                      <Input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={config.openaiSpeed}
                        onChange={(e) =>
                          setConfig({ ...config, openaiSpeed: parseFloat(e.target.value) })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        0.5x (långsam) - 2.0x (snabb)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Select
                        value={config.openaiFormat}
                        onValueChange={(value) =>
                          setConfig({ ...config, openaiFormat: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mp3">MP3</SelectItem>
                          <SelectItem value="opus">Opus</SelectItem>
                          <SelectItem value="aac">AAC</SelectItem>
                          <SelectItem value="flac">FLAC</SelectItem>
                          <SelectItem value="wav">WAV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {config.primaryProvider === 'ELEVENLABS' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-semibold">ElevenLabs Inställningar</h4>
                    
                    <div className="space-y-2">
                      <Label>Voice ID</Label>
                      <Input
                        type="text"
                        placeholder="EXAVITQu4vr4xnSDxMaL"
                        value={config.elevenlabsVoiceId || ''}
                        onChange={(e) =>
                          setConfig({ ...config, elevenlabsVoiceId: e.target.value })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Hitta voice ID på ElevenLabs dashboard
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Talhastighet: {config.elevenlabsSpeed}x</Label>
                      <Input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={config.elevenlabsSpeed}
                        onChange={(e) =>
                          setConfig({ ...config, elevenlabsSpeed: parseFloat(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fallback Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Fallback-konfiguration</CardTitle>
              <CardDescription>
                Automatiskt byta till alternativ provider vid fel eller timeout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aktivera fallback</Label>
                  <p className="text-sm text-muted-foreground">
                    Använd alternativ provider vid primär provider-fel
                  </p>
                </div>
                <Switch
                  checked={config.enableFallback}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableFallback: checked })
                  }
                />
              </div>

              {config.enableFallback && (
                <div className="space-y-2">
                  <Label>Timeout (millisekunder)</Label>
                  <Input
                    type="number"
                    value={config.fallbackTimeoutMs}
                    onChange={(e) =>
                      setConfig({ ...config, fallbackTimeoutMs: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Vänta max {(config.fallbackTimeoutMs / 1000).toFixed(1)}s innan fallback
                  </p>
                </div>
              )}

              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Fallback-kedja:</strong>{' '}
                  {config.primaryProvider === 'OPENAI' ? 'OpenAI → ElevenLabs' : 'ElevenLabs → OpenAI'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conversation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Samtalshantering</CardTitle>
              <CardDescription>
                Konfigurera vilka intents AI-assistenten kan hantera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bokningsintent</Label>
                  <p className="text-sm text-muted-foreground">Hantera nya bokningar</p>
                </div>
                <Switch
                  checked={config.enableBookingIntent}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableBookingIntent: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ombokningsintent</Label>
                  <p className="text-sm text-muted-foreground">Hantera ombokningar</p>
                </div>
                <Switch
                  checked={config.enableRebookingIntent}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableRebookingIntent: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Avbokningsintent</Label>
                  <p className="text-sm text-muted-foreground">Hantera avbokningar</p>
                </div>
                <Switch
                  checked={config.enableCancelIntent}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableCancelIntent: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>FAQ-intent</Label>
                  <p className="text-sm text-muted-foreground">
                    Hantera vanliga frågor (kräver FAQ-databas)
                  </p>
                </div>
                <Switch
                  checked={config.enableFAQIntent}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableFAQIntent: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Max samtalslängd (minuter)</Label>
                <Input
                  type="number"
                  value={config.maxCallDurationMinutes}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxCallDurationMinutes: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Fallback Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Fallback-kontakt</CardTitle>
              <CardDescription>
                E-post och ämne för ticket-notifikationer när AI inte kan hantera samtalet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>E-postadress</Label>
                <Input
                  type="email"
                  value={config.fallbackEmail}
                  onChange={(e) =>
                    setConfig({ ...config, fallbackEmail: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Ämnesrad</Label>
                <Input
                  type="text"
                  value={config.fallbackSubject}
                  onChange={(e) =>
                    setConfig({ ...config, fallbackSubject: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Test Panel */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                TTS-testpanel
              </CardTitle>
              <CardDescription>
                Testa TTS-inställningar med egen text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Testtext</Label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={5}
                  placeholder="Skriv text att testa..."
                />
              </div>

              <Button
                onClick={testTTS}
                disabled={testing}
                className="w-full"
                size="lg"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Genererar...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Testa TTS
                  </>
                )}
              </Button>

              {testResult && (
                <div className="space-y-2 pt-2">
                  <Separator />
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium">Resultat:</span>
                    {testResult.error ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Misslyckades
                      </Badge>
                    ) : (
                      <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Lyckades
                      </Badge>
                    )}
                  </div>

                  {!testResult.error && (
                    <>
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>Provider:</strong> {testResult.provider}
                        </p>
                        <p>
                          <strong>Latens:</strong> {testResult.latencyMs}ms
                        </p>
                        <p>
                          <strong>Format:</strong> {testResult.format || 'mp3'}
                        </p>
                      </div>
                    </>
                  )}

                  {testResult.error && (
                    <div className="p-3 bg-destructive/10 rounded-md">
                      <p className="text-sm text-destructive">{testResult.error}</p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Snabbinstruktioner</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Testa olika röster och hastigheter</li>
                  <li>Ändra provider för att jämföra kvalitet</li>
                  <li>Kontrollera latens och prestanda</li>
                  <li>Spara ändringar innan test</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Phone Number Info */}
          <Card>
            <CardHeader>
              <CardTitle>Telefonnummer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">46elks-nummer:</span>
                  <Badge variant="outline" className="font-mono">
                    {config.phoneNumber}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Detta nummer tar emot inkommande samtal och hanteras av AI-assistenten
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button Bottom */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={saveConfig} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Spara alla ändringar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
