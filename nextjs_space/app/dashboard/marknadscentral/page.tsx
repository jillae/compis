'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Radio, RefreshCw, Copy, CheckCircle, XCircle, Zap, Users, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarknadsentralStatus {
  connected: boolean;
  lastSync: string | null;
  endpoints: {
    status: boolean;
    capacity: boolean;
    insights: boolean;
    customers: boolean;
  };
}

export default function MarknadsentralPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<MarknadsentralStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_FLOW_EXTERNAL_API_KEY || 'Konfigureras i miljövariabler';
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/external` : '';

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    // Simulate status check
    await new Promise(resolve => setTimeout(resolve, 500));
    setStatus({
      connected: true,
      lastSync: new Date().toISOString(),
      endpoints: {
        status: true,
        capacity: true,
        insights: true,
        customers: true,
      },
    });
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Kopierat!', description: 'API-nyckel kopierad till urklipp' });
  };

  const endpoints = [
    { name: 'Status', path: '/status', icon: Zap, description: 'Klinikens grunddata och dagens snapshot' },
    { name: 'Kapacitet', path: '/capacity', icon: Calendar, description: 'Tillgängliga tider och beläggning' },
    { name: 'Insikter', path: '/insights', icon: TrendingUp, description: 'AI-drivna affärsinsikter' },
    { name: 'Kunder', path: '/customers', icon: Users, description: 'Kundsegment och statistik' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="h-8 w-8 text-primary" />
            Marknadscentral
          </h1>
          <p className="text-muted-foreground mt-1">
            Extern integration för marknadsföringsplattformar
          </p>
        </div>
        <Badge variant={status?.connected ? 'default' : 'destructive'} className="text-sm">
          {status?.connected ? 'Ansluten' : 'Ej ansluten'}
        </Badge>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {endpoints.map((ep) => (
          <Card key={ep.path}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{ep.name}</CardTitle>
              <ep.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {status?.endpoints?.[ep.path.replace('/', '') as keyof typeof status.endpoints] ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-muted-foreground">{ep.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API-konfiguration</CardTitle>
          <CardDescription>
            Använd dessa uppgifter för att ansluta Marknadscentral till Flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Integration aktiv</Label>
              <p className="text-sm text-muted-foreground">Tillåt externa anrop till API:et</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label>Base URL</Label>
            <div className="flex gap-2">
              <Input value={baseUrl} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(baseUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>API-nyckel (X-FLOW-API-KEY header)</Label>
            <div className="flex gap-2">
              <Input 
                type={apiKeyVisible ? 'text' : 'password'} 
                value={apiKey} 
                readOnly 
                className="font-mono text-sm" 
              />
              <Button variant="outline" onClick={() => setApiKeyVisible(!apiKeyVisible)}>
                {apiKeyVisible ? 'Dölj' : 'Visa'}
              </Button>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sätt FLOW_EXTERNAL_API_KEY i Vercel/miljövariabler
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Tillgängliga endpoints för Marknadscentral</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {endpoints.map((ep) => (
              <div key={ep.path} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      GET {baseUrl}{ep.path}?clinicId=XXX
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">{ep.description}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(`${baseUrl}${ep.path}?clinicId=YOUR_CLINIC_ID`)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Kopiera
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Status */}
      <div className="flex justify-end">
        <Button onClick={checkStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera status
        </Button>
      </div>
    </div>
  );
}
