
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/ui/back-button';
import { ShoppingBag, Search, Clock, DollarSign, Star, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  duration?: number;
  isActive: boolean;
  popularity?: number;
  clinicId?: string;
  clinic?: {
    name: string;
  };
}

export default function MarketplacePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, categoryFilter, services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplace/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
        setFilteredServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Kunde inte hämta tjänster');
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }

    setFilteredServices(filtered);
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setBookingDialogOpen(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/marketplace/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService?.id,
          preferredDate: formData.get('preferredDate'),
          preferredTime: formData.get('preferredTime'),
          notes: formData.get('notes'),
        }),
      });

      if (response.ok) {
        toast.success('Bokningsförfrågan skickad!');
        setBookingDialogOpen(false);
      } else {
        toast.error('Kunde inte skicka bokningsförfrågan');
      }
    } catch (error) {
      toast.error('Något gick fel');
    }
  };

  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean))) as string[];

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Laddar tjänster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <BackButton />
        <div className="flex items-center gap-3 mt-4">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Tjänstemarknadsplats</h1>
            <p className="text-muted-foreground mt-1">Bläddra och boka tjänster från alla kliniker</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök tjänster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-64">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Alla kategorier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla kategorier</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga tjänster hittades</h3>
              <p className="text-muted-foreground">Prova att ändra dina sökfilter</p>
            </CardContent>
          </Card>
        ) : (
          filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.category && (
                      <Badge variant="secondary" className="mt-2">
                        {service.category}
                      </Badge>
                    )}
                  </div>
                  {service.popularity && service.popularity > 50 && (
                    <Badge variant="default" className="gap-1">
                      <Star className="h-3 w-3" />
                      Populär
                    </Badge>
                  )}
                </div>
                {service.description && <CardDescription className="mt-3">{service.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {service.duration || 60} min
                  </span>
                  {service.price && (
                    <span className="flex items-center gap-2 font-semibold text-primary">
                      <DollarSign className="h-4 w-4" />
                      {service.price} SEK
                    </span>
                  )}
                </div>

                {service.clinic && (
                  <p className="text-xs text-muted-foreground">Tillhandahålls av: {service.clinic.name}</p>
                )}

                <Button onClick={() => handleBookService(service)} className="w-full gap-2">
                  <Calendar className="h-4 w-4" />
                  Boka Tid
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Boka {selectedService?.name}</DialogTitle>
            <DialogDescription>Fyll i dina önskade tid och datum för bokningen</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div>
              <Label htmlFor="preferredDate">Önskat datum</Label>
              <Input type="date" id="preferredDate" name="preferredDate" required />
            </div>
            <div>
              <Label htmlFor="preferredTime">Önskad tid</Label>
              <Input type="time" id="preferredTime" name="preferredTime" required />
            </div>
            <div>
              <Label htmlFor="notes">Anteckningar (valfritt)</Label>
              <Textarea id="notes" name="notes" placeholder="Särskilda önskemål eller information..." />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)} className="flex-1">
                Avbryt
              </Button>
              <Button type="submit" className="flex-1">
                Skicka Förfrågan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
