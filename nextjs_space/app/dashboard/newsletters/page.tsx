
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Mail, Send, Eye, Users, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  scheduledFor: string | null;
  sentAt: string | null;
  recipientCount: number;
  openRate: number | null;
  clickRate: number | null;
  segment: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

interface Segment {
  id: string;
  name: string;
  _count: {
    customers: number;
  };
}

export default function NewslettersPage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewNewsletter, setPreviewNewsletter] = useState<Newsletter | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    segmentId: '',
    scheduledFor: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNewsletters();
      fetchSegments();
    }
  }, [status]);

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletters');
      if (response.ok) {
        const data = await response.json();
        setNewsletters(data);
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta nyhetsbrev',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments');
      if (response.ok) {
        const data = await response.json();
        setSegments(data);
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  const handleCreateNewsletter = async (sendNow: boolean = false) => {
    if (!formData.segmentId) {
      toast({
        title: 'Välj målgrupp',
        description: 'Du måste välja ett segment för nyhetsbrevet',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledFor: formData.scheduledFor || null,
          status: sendNow ? 'SENT' : (formData.scheduledFor ? 'SCHEDULED' : 'DRAFT'),
        }),
      });

      if (response.ok) {
        const newNewsletter = await response.json();
        
        if (sendNow) {
          // Send immediately
          await fetch(`/api/newsletters/${newNewsletter.id}/send`, {
            method: 'POST',
          });
          
          toast({
            title: 'Nyhetsbrev skickat!',
            description: `Skickat till ${newNewsletter.recipientCount} mottagare`,
          });
        } else {
          toast({
            title: 'Nyhetsbrev skapat',
            description: formData.scheduledFor 
              ? 'Nyhetsbrevet kommer att skickas vid schemalagd tid'
              : 'Nyhetsbrevet har sparats som utkast',
          });
        }

        setNewsletters([newNewsletter, ...newsletters]);
        setIsCreateOpen(false);
        resetForm();
      } else {
        throw new Error('Failed to create newsletter');
      }
    } catch (error) {
      console.error('Error creating newsletter:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte skapa nyhetsbrev',
        variant: 'destructive',
      });
    }
  };

  const handleSendNewsletter = async (id: string) => {
    if (!confirm('Är du säker på att du vill skicka detta nyhetsbrev nu?')) return;

    try {
      const response = await fetch(`/api/newsletters/${id}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        const updatedNewsletter = await response.json();
        setNewsletters(newsletters.map(n => n.id === id ? updatedNewsletter : n));
        toast({
          title: 'Nyhetsbrev skickat!',
          description: `Skickat till ${updatedNewsletter.recipientCount} mottagare`,
        });
      } else {
        throw new Error('Failed to send newsletter');
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte skicka nyhetsbrev',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNewsletter = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta nyhetsbrev?')) return;

    try {
      const response = await fetch(`/api/newsletters/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNewsletters(newsletters.filter(n => n.id !== id));
        toast({
          title: 'Nyhetsbrev borttaget',
          description: 'Nyhetsbrevet har tagits bort',
        });
      } else {
        throw new Error('Failed to delete newsletter');
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort nyhetsbrev',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      content: '',
      segmentId: '',
      scheduledFor: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Skickad</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Schemalagd</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800"><Mail className="h-3 w-3 mr-1" />Utkast</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedSegment = segments.find(s => s.id === formData.segmentId);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laddar nyhetsbrev...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Manager</h1>
          <p className="text-muted-foreground mt-1">
            Skapa och skicka riktade nyhetsbrev till dina kundsegment
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Skapa Nyhetsbrev
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Skapa nytt nyhetsbrev</DialogTitle>
              <DialogDescription>
                Komponera ditt nyhetsbrev och välj målgrupp
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Ämnesrad*</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="T.ex. Nya erbjudanden bara för dig!"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Innehåll*</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Skriv ditt nyhetsbrev här..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Tips: Använd {'{namn}'} för att personalisera med kundens namn
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="segment">Målgrupp (Segment)*</Label>
                  <Select value={formData.segmentId} onValueChange={(value) => setFormData({ ...formData, segmentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name} ({segment._count?.customers || 0} kunder)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledFor">Schemalägg (valfritt)</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  />
                </div>
              </div>

              {selectedSegment && (
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span>
                        Detta nyhetsbrev kommer att skickas till <strong>{selectedSegment._count?.customers || 0} mottagare</strong>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Avbryt
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleCreateNewsletter(false)}
                disabled={!formData.subject || !formData.content || !formData.segmentId}
              >
                Spara som utkast
              </Button>
              <Button 
                onClick={() => handleCreateNewsletter(true)}
                disabled={!formData.subject || !formData.content || !formData.segmentId}
              >
                <Send className="h-4 w-4 mr-2" />
                Skicka nu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newsletters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skickade</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newsletters.filter(n => n.status === 'SENT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schemalagda</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newsletters.filter(n => n.status === 'SCHEDULED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utkast</CardTitle>
            <Mail className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newsletters.filter(n => n.status === 'DRAFT').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Newsletters List */}
      <div className="space-y-4">
        {newsletters.map((newsletter) => (
          <Card key={newsletter.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{newsletter.subject}</CardTitle>
                    {getStatusBadge(newsletter.status)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {newsletter.content.substring(0, 150)}...
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewNewsletter(newsletter)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {newsletter.status !== 'SENT' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendNewsletter(newsletter.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteNewsletter(newsletter.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Målgrupp</p>
                  <p className="font-medium">{newsletter.segment?.name || 'Okänd'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mottagare</p>
                  <p className="font-medium">{newsletter.recipientCount}</p>
                </div>
                {newsletter.status === 'SCHEDULED' && newsletter.scheduledFor && (
                  <div>
                    <p className="text-muted-foreground">Schemalagd för</p>
                    <p className="font-medium">
                      {new Date(newsletter.scheduledFor).toLocaleString('sv-SE')}
                    </p>
                  </div>
                )}
                {newsletter.status === 'SENT' && newsletter.sentAt && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Skickad</p>
                      <p className="font-medium">
                        {new Date(newsletter.sentAt).toLocaleString('sv-SE')}
                      </p>
                    </div>
                    {newsletter.openRate !== null && (
                      <div>
                        <p className="text-muted-foreground">Öppningsgrad</p>
                        <p className="font-medium">{(newsletter.openRate * 100).toFixed(1)}%</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {newsletters.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga nyhetsbrev än</h3>
              <p className="text-muted-foreground text-center mb-4">
                Skapa ditt första nyhetsbrev för att börja kommunicera med dina kunder
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa Nyhetsbrev
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewNewsletter} onOpenChange={(open) => !open && setPreviewNewsletter(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewNewsletter?.subject}</DialogTitle>
            <DialogDescription>
              Förhandsvisning av nyhetsbrev
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-6 bg-muted">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {previewNewsletter?.content}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <div className="mt-1">
                  {previewNewsletter && getStatusBadge(previewNewsletter.status)}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Mottagare</p>
                <p className="font-medium mt-1">{previewNewsletter?.recipientCount}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewNewsletter(null)}>
              Stäng
            </Button>
            {previewNewsletter?.status !== 'SENT' && (
              <Button onClick={() => {
                if (previewNewsletter) {
                  handleSendNewsletter(previewNewsletter.id);
                  setPreviewNewsletter(null);
                }
              }}>
                <Send className="h-4 w-4 mr-2" />
                Skicka nu
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
