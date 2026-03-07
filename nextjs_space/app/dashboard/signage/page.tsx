'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Monitor, Play, Pause, Settings, Image, Clock, Calendar, Users, Star, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignageScreen {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  currentSlide: string;
  lastPing: string;
}

interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'info' | 'promo' | 'queue' | 'reviews';
}

export default function DigitalSignagePage() {
  const { toast } = useToast();
  const [screens, setScreens] = useState<SignageScreen[]>([]);
  const [templates, setTemplates] = useState<SlideTemplate[]>([]);
  const [activeTab, setActiveTab] = useState('screens');
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationInterval, setRotationInterval] = useState('30');

  useEffect(() => {
    // Simulated data
    setScreens([
      {
        id: '1',
        name: 'Väntrumsskärm 1',
        location: 'Huvudväntrum',
        status: 'online',
        currentSlide: 'Välkommen',
        lastPing: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Reception',
        location: 'Entrén',
        status: 'online',
        currentSlide: 'Dagens schema',
        lastPing: new Date().toISOString(),
      },
    ]);

    setTemplates([
      { id: '1', name: 'Välkomstskärm', description: 'Visar klinikens logo och välkomstmeddelande', preview: '', category: 'info' },
      { id: '2', name: 'Köstatus', description: 'Realtidsvisning av kölistan', preview: '', category: 'queue' },
      { id: '3', name: 'Kampanjerbjudande', description: 'Visa aktuella kampanjer och erbjudanden', preview: '', category: 'promo' },
      { id: '4', name: 'Kundrecensioner', description: 'Roterande kundomdömen', preview: '', category: 'reviews' },
      { id: '5', name: 'Behandlingsinformation', description: 'Info om tjänster och priser', preview: '', category: 'info' },
      { id: '6', name: 'Dagens schema', description: 'Visar behandlare och tider', preview: '', category: 'queue' },
    ]);
  }, []);

  const copyScreenUrl = (screenId: string) => {
    const url = `${window.location.origin}/signage/${screenId}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Kopierat!', description: 'Skärm-URL kopierad' });
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800',
      promo: 'bg-green-100 text-green-800',
      queue: 'bg-purple-100 text-purple-800',
      reviews: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Monitor className="h-8 w-8 text-primary" />
            Digital Signage
          </h1>
          <p className="text-muted-foreground mt-1">
            Hantera väntrumsskärmar och digital display
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Inställningar
          </Button>
          <Button>
            <Monitor className="h-4 w-4 mr-2" />
            Lägg till skärm
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva skärmar</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {screens.filter(s => s.status === 'online').length}/{screens.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mallar</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-rotation</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoRotate ? 'På' : 'Av'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rotationInterval}s</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="screens">Skärmar</TabsTrigger>
              <TabsTrigger value="templates">Mallar</TabsTrigger>
              <TabsTrigger value="settings">Inställningar</TabsTrigger>
            </TabsList>

            <TabsContent value="screens" className="mt-4">
              <div className="space-y-4">
                {screens.map((screen) => (
                  <div key={screen.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${screen.status === 'online' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <Monitor className={`h-6 w-6 ${screen.status === 'online' ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-medium">{screen.name}</h3>
                          <p className="text-sm text-muted-foreground">{screen.location}</p>
                        </div>
                        <Badge variant={screen.status === 'online' ? 'default' : 'destructive'}>
                          {screen.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Visar: {screen.currentSlide}</p>
                          <p className="text-xs text-muted-foreground">
                            Senaste ping: {new Date(screen.lastPing).toLocaleTimeString('sv-SE')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => copyScreenUrl(screen.id)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            {screen.status === 'online' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {screens.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga skärmar konfigurerade</p>
                    <Button className="mt-4">
                      <Monitor className="h-4 w-4 mr-2" />
                      Lägg till första skärmen
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge className={getCategoryBadge(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <Monitor className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                      <Button variant="outline" className="w-full mt-4">
                        Använd mall
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <div className="space-y-6 max-w-md">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-rotation</Label>
                    <p className="text-sm text-muted-foreground">Rotera slides automatiskt</p>
                  </div>
                  <Switch checked={autoRotate} onCheckedChange={setAutoRotate} />
                </div>

                <div className="space-y-2">
                  <Label>Rotationsintervall</Label>
                  <Select value={rotationInterval} onValueChange={setRotationInterval}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj intervall" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 sekunder</SelectItem>
                      <SelectItem value="20">20 sekunder</SelectItem>
                      <SelectItem value="30">30 sekunder</SelectItem>
                      <SelectItem value="60">1 minut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button>Spara inställningar</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Kom igång</CardTitle>
          <CardDescription>Så här sätter du upp digital signage</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Lägg till en ny skärm och ge den ett namn och plats</li>
            <li>Kopiera skärm-URL:en och öppna den i fullskärm på din displayenhet</li>
            <li>Välj vilka mallar som ska visas på skärmen</li>
            <li>Konfigurera rotationsintervall efter behov</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
