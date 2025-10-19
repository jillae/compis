
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OpenAIWhisperConfig {
  model: string;
  language?: string;
  temperature?: number;
  prompt?: string;
  response_format?: string;
  timestamp_granularities?: string[];
}

interface Provider {
  id: string;
  provider_name: string;
  display_name: string;
  config_json: OpenAIWhisperConfig;
  is_active: boolean;
  priority_order: number;
}

interface Props {
  providerId: string;
}

const WHISPER_MODELS = [
  { value: 'whisper-1', label: 'Whisper-1 (Standard)' },
  { value: 'gpt-4o-transcribe', label: 'GPT-4o Transcribe (Beta)' },
  { value: 'gpt-4o-mini-transcribe', label: 'GPT-4o Mini Transcribe (Beta)' },
];

const RESPONSE_FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'verbose_json', label: 'Verbose JSON (with timestamps)' },
  { value: 'text', label: 'Text' },
  { value: 'srt', label: 'SRT (subtitle)' },
  { value: 'vtt', label: 'VTT (subtitle)' },
];

const MAX_PROMPT_TOKENS = 224; // ~200 words
const APPROX_CHARS_PER_TOKEN = 4;
const MAX_PROMPT_CHARS = MAX_PROMPT_TOKENS * APPROX_CHARS_PER_TOKEN;

export function OpenAIWhisperConfig({ providerId }: Props) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [model, setModel] = useState('whisper-1');
  const [language, setLanguage] = useState('sv'); // Swedish default
  const [temperature, setTemperature] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [responseFormat, setResponseFormat] = useState('verbose_json');
  const [timestampSegment, setTimestampSegment] = useState(true);
  const [timestampWord, setTimestampWord] = useState(false);

  useEffect(() => {
    fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      const res = await fetch('/api/superadmin/stt/providers');
      const data = await res.json();

      if (data.success) {
        const prov = data.providers.find((p: Provider) => p.id === providerId);
        if (prov) {
          setProvider(prov);
          
          // Load config from provider
          const config = prov.config_json || {};
          setModel(config.model || 'whisper-1');
          setLanguage(config.language || 'sv');
          setTemperature(config.temperature ?? 0);
          setPrompt(config.prompt || '');
          setResponseFormat(config.response_format || 'verbose_json');
          
          const granularities = config.timestamp_granularities || ['segment'];
          setTimestampSegment(granularities.includes('segment'));
          setTimestampWord(granularities.includes('word'));
        }
      }
    } catch (error) {
      toast.error('Kunde inte hämta provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Build timestamp_granularities array
    const timestamp_granularities: string[] = [];
    if (timestampSegment) timestamp_granularities.push('segment');
    if (timestampWord) timestamp_granularities.push('word');

    const config: OpenAIWhisperConfig = {
      model,
      language: language || undefined,
      temperature: temperature !== 0 ? temperature : undefined,
      prompt: prompt || undefined,
      response_format: responseFormat,
      timestamp_granularities: timestamp_granularities.length > 0 ? timestamp_granularities : undefined,
    };

    setSaving(true);

    try {
      const res = await fetch('/api/superadmin/stt/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: providerId,
          updates: { config_json: config }
        })
      });

      if (res.ok) {
        toast.success('✓ Konfiguration sparad!');
        fetchProvider(); // Refresh
      } else {
        toast.error('Kunde inte spara konfiguration');
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
    } finally {
      setSaving(false);
    }
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const getEstimatedTokens = (text: string) => {
    return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!provider) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Provider kunde inte hittas</AlertDescription>
      </Alert>
    );
  }

  if (provider.provider_name !== 'openai') {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Denna provider ({provider.provider_name}) är inte OpenAI Whisper. 
          OpenAI-specifik konfiguration är inte tillgänglig.
        </AlertDescription>
      </Alert>
    );
  }

  const estimatedTokens = getEstimatedTokens(prompt);
  const wordCount = getWordCount(prompt);
  const isPromptTooLong = estimatedTokens > MAX_PROMPT_TOKENS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{provider.display_name}</h2>
        <p className="text-muted-foreground mt-1">
          OpenAI Whisper API-konfiguration
        </p>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Whisper Model Configuration</CardTitle>
          <CardDescription>
            Konfigurera OpenAI Whisper-parametrar för transkribering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Selector */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Välj model" />
              </SelectTrigger>
              <SelectContent>
                {WHISPER_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Whisper-1 är den senaste stabila modellen. GPT-4o-modellerna är beta.
            </p>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Språk (ISO-639-1 kod)</Label>
            <Input
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="sv"
              maxLength={2}
            />
            <p className="text-xs text-muted-foreground">
              t.ex. sv, en, fr, de. Lämna tomt för auto-detect. Förbättrar noggrannheten för det specifika språket.
            </p>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
            </div>
            <Slider
              id="temperature"
              value={[temperature]}
              onValueChange={(val) => setTemperature(val[0])}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.0 (Exakt)</span>
              <span>1.0 (Kreativ)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Lägre värden (0.0-0.3) ger mer deterministiska resultat. Högre värden ger mer variation.
            </p>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">Prompt (Valfritt)</Label>
              <span className={`text-xs ${isPromptTooLong ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                {wordCount} ord / ~{estimatedTokens} tokens (max {MAX_PROMPT_TOKENS})
              </span>
            </div>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Dr. Andersson, Bokadirekt, laser, kliniken..."
              rows={4}
              maxLength={MAX_PROMPT_CHARS}
            />
            <p className="text-xs text-muted-foreground">
              Hjälper modellen att känna igen specifika namn, termer och kontext. 
              Exempel: kliniknamn, behandlingar, vanliga namn.
            </p>
            {isPromptTooLong && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Prompt är för lång! OpenAI accepterar max 224 tokens (~200 ord).
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Response Format */}
          <div className="space-y-2">
            <Label htmlFor="responseFormat">Response Format</Label>
            <Select value={responseFormat} onValueChange={setResponseFormat}>
              <SelectTrigger id="responseFormat">
                <SelectValue placeholder="Välj format" />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_FORMATS.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              För Flow rekommenderas <strong>verbose_json</strong> för att få timestamps.
            </p>
          </div>

          {/* Timestamp Granularities */}
          <div className="space-y-3">
            <Label>Timestamp Granularities</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamp-segment"
                  checked={timestampSegment}
                  onCheckedChange={(checked) => setTimestampSegment(checked as boolean)}
                />
                <label
                  htmlFor="timestamp-segment"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Segment-level timestamps
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamp-word"
                  checked={timestampWord}
                  onCheckedChange={(checked) => setTimestampWord(checked as boolean)}
                />
                <label
                  htmlFor="timestamp-word"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Word-level timestamps
                </label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Endast för <strong>verbose_json</strong> format. 
              Word-level ger mer detaljerade timestamps men tar längre tid.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving || isPromptTooLong}
              size="lg"
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
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-sm">📚 OpenAI Whisper API Documentation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 dark:text-blue-100">
          <p>
            Läs mer om parametrarna och hur de påverkar transkriberingen:
          </p>
          <a
            href="https://platform.openai.com/docs/guides/speech-to-text"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            OpenAI Speech-to-Text Guide →
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
