
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, MessageSquare, RefreshCw, Send, Target, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SMSSuggestion {
  message: string;
  tone: string;
  targetSegment: string;
  estimatedReach: number;
  reasoning: string;
}

export default function CampaignsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [targetSegment, setTargetSegment] = useState('inactive');
  const [campaignGoal, setCampaignGoal] = useState('reactivation');
  const [customContext, setCustomContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<SMSSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SMSSuggestion | null>(null);
  const [stats, setStats] = useState({ inactive: 0, active: 0, total: 0 });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/engagement/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          inactive: data.inactiveCustomers,
          active: data.activeCustomers,
          total: data.totalCustomers
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const generateSMS = async () => {
    setIsGenerating(true);
    setSuggestions([]);
    setSelectedSuggestion(null);

    try {
      const response = await fetch('/api/engagement/generate-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSegment,
          campaignGoal,
          customContext,
          stats
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let partialRead = '';

      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: undefined };
        if (done) break;
        
        partialRead += decoder.decode(value, { stream: true });
        let lines = partialRead.split('\n');
        partialRead = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsGenerating(false);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.status === 'completed') {
                setSuggestions(parsed.result.suggestions || []);
                setIsGenerating(false);
                return;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating SMS:', error);
      setIsGenerating(false);
    }
  };

  const sendCampaign = async (suggestion: SMSSuggestion) => {
    // TODO: Implement actual SMS sending via 46elks or Twilio
    alert(`Kampanj skulle nu skickas till ${suggestion.estimatedReach} kunder!\n\nMeddelande:\n${suggestion.message}`);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push('/billing')}>
            ← Tillbaka
          </Button>
          <h1 className="text-3xl font-bold mt-2">AI SMS Kampanjgenerator</h1>
          <p className="text-muted-foreground">Generera personliga SMS-kampanjer med AI</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Totalt kunder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Aktiva kunder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">🎯 Inaktiva kunder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
            <p className="text-xs text-orange-600 mt-1">Återvinn dessa kunder!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Konfigurera kampanj
            </CardTitle>
            <CardDescription>Anpassa din SMS-kampanj med AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Målgrupp</Label>
              <Select value={targetSegment} onValueChange={setTargetSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Inaktiva kunder ({stats.inactive})</SelectItem>
                  <SelectItem value="active">Aktiva kunder ({stats.active})</SelectItem>
                  <SelectItem value="all">Alla kunder ({stats.total})</SelectItem>
                  <SelectItem value="new">Nya kunder</SelectItem>
                  <SelectItem value="vip">VIP/Stammis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kampanjmål</Label>
              <Select value={campaignGoal} onValueChange={setCampaignGoal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reactivation">Återaktivering</SelectItem>
                  <SelectItem value="loyalty">Lojalitet & belöning</SelectItem>
                  <SelectItem value="promotion">Kampanjerbjudande</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="reminder">Påminnelse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Extra kontext (valfritt)</Label>
              <Textarea
                placeholder="T.ex. 'Vi har en ny behandling för hudvård' eller 'Julkampanj med 20% rabatt'"
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={generateSMS} 
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI genererar förslag...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generera AI-förslag
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Suggestions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI-genererade förslag
            </CardTitle>
            <CardDescription>Välj ett förslag eller generera nytt</CardDescription>
          </CardHeader>
          <CardContent>
            {suggestions.length === 0 && !isGenerating && (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Konfigurera kampanjen och klicka på "Generera AI-förslag"</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">AI analyserar din kunddata...</p>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all ${
                      selectedSuggestion === suggestion 
                        ? 'border-primary shadow-md' 
                        : 'hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold text-primary">
                          Förslag {index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.tone}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{suggestion.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>~{suggestion.estimatedReach} mottagare</span>
                      </div>
                      {suggestion.reasoning && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {suggestion.reasoning}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {selectedSuggestion && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={generateSMS}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Nytt förslag
                    </Button>
                    <Button 
                      onClick={() => sendCampaign(selectedSuggestion)}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Skicka kampanj
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <strong>AI-driven marknadsföring:</strong> Systemet analyserar dina kunders beteende, 
          historik och preferenser för att generera optimerade SMS-kampanjer. 
          Varje förslag är skräddarsytt för att maximera engagemang och återvinning av inaktiva kunder.
        </AlertDescription>
      </Alert>
    </div>
  );
}
