'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Star, Image, Video, MessageSquare, Share2, Plus, Search, Filter, ThumbsUp, ExternalLink } from 'lucide-react';

interface UGCItem {
  id: string;
  type: 'review' | 'photo' | 'video' | 'testimonial';
  customerName: string;
  content: string;
  rating?: number;
  mediaUrl?: string;
  createdAt: string;
  approved: boolean;
  featured: boolean;
}

export default function UGCPage() {
  const [items, setItems] = useState<UGCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Simulated data
    setItems([
      {
        id: '1',
        type: 'review',
        customerName: 'Anna S.',
        content: 'Fantastisk behandling! Personalen var så professionell och resultatet överträffade mina förväntningar.',
        rating: 5,
        createdAt: new Date().toISOString(),
        approved: true,
        featured: true,
      },
      {
        id: '2',
        type: 'photo',
        customerName: 'Maria L.',
        content: 'Före och efter min behandling',
        mediaUrl: '/placeholder-ugc.jpg',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        approved: true,
        featured: false,
      },
      {
        id: '3',
        type: 'testimonial',
        customerName: 'Erik J.',
        content: 'Har varit kund i 3 år och kommer aldrig gå någon annanstans. Bästa kliniken!',
        rating: 5,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        approved: false,
        featured: false,
      },
    ]);
    setLoading(false);
  }, []);

  const stats = {
    total: items.length,
    reviews: items.filter(i => i.type === 'review').length,
    photos: items.filter(i => i.type === 'photo').length,
    pending: items.filter(i => !i.approved).length,
    avgRating: items.filter(i => i.rating).reduce((acc, i) => acc + (i.rating || 0), 0) / items.filter(i => i.rating).length || 0,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <Star className="h-4 w-4" />;
      case 'photo': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'testimonial': return <MessageSquare className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="h-8 w-8 text-primary" />
            UGC (User Generated Content)
          </h1>
          <p className="text-muted-foreground mt-1">
            Hantera kundrecensioner, testimonials och media
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Begär recension
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt innehåll</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recensioner</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bilder</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.photos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Väntar godkännande</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Snittbetyg</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Innehåll</CardTitle>
              <CardDescription>Granska och hantera användarinnehåll</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Sök..." className="pl-8 w-64" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Alla</TabsTrigger>
              <TabsTrigger value="reviews">Recensioner</TabsTrigger>
              <TabsTrigger value="photos">Bilder</TabsTrigger>
              <TabsTrigger value="pending">Väntar godkännande</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              <div className="space-y-4">
                {items
                  .filter(item => {
                    if (activeTab === 'all') return true;
                    if (activeTab === 'reviews') return item.type === 'review';
                    if (activeTab === 'photos') return item.type === 'photo';
                    if (activeTab === 'pending') return !item.approved;
                    return true;
                  })
                  .map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded-full">
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.customerName}</span>
                              {item.rating && (
                                <div className="flex items-center gap-1">
                                  {[...Array(item.rating)].map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                              )}
                              {item.featured && <Badge variant="secondary">Utvald</Badge>}
                              {!item.approved && <Badge variant="outline" className="text-orange-500 border-orange-500">Väntar</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(item.createdAt).toLocaleDateString('sv-SE')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!item.approved && (
                            <Button size="sm" variant="outline">
                              <ThumbsUp className="h-3 w-3 mr-1" /> Godkänn
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Share2 className="h-3 w-3 mr-1" /> Dela
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                {items.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inget innehåll ännu</p>
                    <p className="text-sm">Börja samla in recensioner och testimonials från dina kunder</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Collection Widget */}
      <Card>
        <CardHeader>
          <CardTitle>Insamlingswidget</CardTitle>
          <CardDescription>Lägg till på din hemsida för att samla in innehåll</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <code className="text-sm">
              {'<script src="https://flow.klinikflow.app/widget/ugc.js" data-clinic="YOUR_CLINIC_ID"></script>'}
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Widget kommer snart - kontakta support för tidig access
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
