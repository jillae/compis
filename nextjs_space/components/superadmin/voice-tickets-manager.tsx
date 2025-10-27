
'use client';

/**
 * Voice Tickets Manager
 * Lists and manages voice call fallback tickets
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Clock, PhoneCall, RefreshCw, User, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useClinic } from '@/context/ClinicContext';

interface VoiceTicket {
  id: string;
  ticketNumber: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customerPhone: string;
  customerName?: string;
  subject: string;
  description: string;
  transcript?: string;
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}

const STATUS_COLORS = {
  OPEN: 'bg-red-500',
  IN_PROGRESS: 'bg-yellow-500',
  RESOLVED: 'bg-green-500',
  CLOSED: 'bg-gray-500',
};

const PRIORITY_COLORS = {
  LOW: 'bg-blue-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

export function VoiceTicketsManager() {
  const [tickets, setTickets] = useState<VoiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<VoiceTicket | null>(null);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const { selectedClinic } = useClinic();

  useEffect(() => {
    fetchTickets();
  }, [selectedClinic, selectedTab]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClinic) {
        params.append('clinicId', selectedClinic);
      }
      if (selectedTab !== 'all') {
        params.append('status', selectedTab.toUpperCase());
      }

      const response = await fetch(`/api/voice/tickets?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast.error('Kunde inte hämta tickets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket || !resolution.trim()) {
      toast.error('Lösning krävs');
      return;
    }

    try {
      setIsResolving(true);
      const response = await fetch('/api/voice/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          resolution: resolution.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to resolve ticket');

      toast.success('Ticket löst!');
      setIsResolveDialogOpen(false);
      setSelectedTicket(null);
      setResolution('');
      fetchTickets();
    } catch (error: any) {
      console.error('Error resolving ticket:', error);
      toast.error('Kunde inte lösa ticket: ' + error.message);
    } finally {
      setIsResolving(false);
    }
  };

  const openResolveDialog = (ticket: VoiceTicket) => {
    setSelectedTicket(ticket);
    setIsResolveDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4" />;
      case 'RESOLVED':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets;

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Hantera fallback-samtal som AI inte kunde processa
          </p>
        </div>
        <Button onClick={fetchTickets} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Uppdatera
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totalt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Öppna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pågående</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lösta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">Alla ({stats.total})</TabsTrigger>
          <TabsTrigger value="open">Öppna ({stats.open})</TabsTrigger>
          <TabsTrigger value="in_progress">Pågående ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="resolved">Lösta ({stats.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Laddar tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Inga tickets hittades</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{ticket.ticketNumber}</CardTitle>
                          <Badge variant="outline" className={`${STATUS_COLORS[ticket.status]} text-white`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(ticket.status)}
                              {ticket.status}
                            </span>
                          </Badge>
                          <Badge variant="outline" className={`${PRIORITY_COLORS[ticket.priority]} text-white`}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <CardDescription className="font-semibold text-base text-foreground">
                          {ticket.subject}
                        </CardDescription>
                      </div>
                      {!ticket.resolved && (
                        <Button onClick={() => openResolveDialog(ticket)} size="sm">
                          Lös ticket
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Kund:</span>
                        <span>{ticket.customerName || 'Okänd'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <PhoneCall className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Telefon:</span>
                        <span>{ticket.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Skapad:</span>
                        <span>{new Date(ticket.createdAt).toLocaleString('sv-SE')}</span>
                      </div>
                      {ticket.emailSent && (
                        <div className="flex items-center gap-2 text-sm">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Email skickad:</span>
                          <span className="text-green-600">✓</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Beskrivning:</h4>
                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                    </div>

                    {/* Transcript */}
                    {ticket.transcript && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Transkribering:</h4>
                        <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                          {ticket.transcript}
                        </div>
                      </div>
                    )}

                    {/* Resolution */}
                    {ticket.resolved && ticket.resolution && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-2 text-green-600">Lösning:</h4>
                        <p className="text-sm text-muted-foreground">{ticket.resolution}</p>
                        {ticket.resolvedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Löst: {new Date(ticket.resolvedAt).toLocaleString('sv-SE')}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lös Ticket: {selectedTicket?.ticketNumber}</DialogTitle>
            <DialogDescription>
              Beskriv hur ticketen löstes och vad som gjordes
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket Info */}
              <div className="bg-muted p-4 rounded-md space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{selectedTicket.customerName || 'Okänd'}</span>
                  <span className="text-muted-foreground">({selectedTicket.customerPhone})</span>
                </div>
                <div>
                  <span className="font-medium">Ärende: </span>
                  <span>{selectedTicket.subject}</span>
                </div>
                <div>
                  <span className="font-medium">Beskrivning: </span>
                  <span className="text-sm">{selectedTicket.description}</span>
                </div>
              </div>

              {/* Resolution Input */}
              <div className="space-y-2">
                <Label htmlFor="resolution">Lösning *</Label>
                <Textarea
                  id="resolution"
                  placeholder="Beskriv vad som gjordes för att lösa ticketen..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleResolveTicket} disabled={isResolving || !resolution.trim()}>
              {isResolving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Löser...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Lös ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
