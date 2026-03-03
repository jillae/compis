

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Key, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { UserRole } from '@/lib/client-types';

interface License {
  id: string;
  clinicId: string;
  plan: string;
  status: string;
  apiKey: string | null;
  projectId: string | null;
  pricePerMonth: number;
  activatedAt: string;
  expiresAt: string | null;
  clinic: {
    id: string;
    name: string;
    tier: string;
    subscriptionStatus: string;
  };
}

interface Clinic {
  id: string;
  name: string;
  tier: string;
}

export default function LicensesPage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    clinicId: '',
    plan: 'LAUNCH',
    apiKey: '',
    projectId: '',
    pricePerMonth: '0',
    expiresAt: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      redirect('/dashboard');
      return;
    }

    fetchLicenses();
    fetchClinics();
  }, [session, status]);

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/unlayer-licenses');
      if (response.ok) {
        const data = await response.json();
        setLicenses(data);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta licenser',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const response = await fetch('/api/superadmin/clinics');
      if (response.ok) {
        const data = await response.json();
        setClinics(data.clinics || []);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const handleCreateLicense = async () => {
    if (!formData.clinicId || !formData.plan) {
      toast({
        title: 'Fyll i alla fält',
        description: 'Klinik och plan är obligatoriska',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/unlayer-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pricePerMonth: parseFloat(formData.pricePerMonth) || 0,
          expiresAt: formData.expiresAt || null,
        }),
      });

      if (response.ok) {
        const newLicense = await response.json();
        setLicenses([newLicense, ...licenses]);
        setIsCreateOpen(false);
        resetForm();
        toast({
          title: 'Licens aktiverad!',
          description: `${newLicense.plan}-licens aktiverad för ${newLicense.clinic.name}`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create license');
      }
    } catch (error: any) {
      console.error('Error creating license:', error);
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte aktivera licens',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateLicense = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/unlayer-licenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedLicense = await response.json();
        setLicenses(licenses.map(l => l.id === id ? updatedLicense : l));
        toast({
          title: 'Licens uppdaterad',
          description: `Status ändrad till ${status}`,
        });
      } else {
        throw new Error('Failed to update license');
      }
    } catch (error) {
      console.error('Error updating license:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte uppdatera licens',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm('Är du säker på att du vill avsluta denna licens?')) return;

    try {
      const response = await fetch(`/api/unlayer-licenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLicenses(licenses.filter(l => l.id !== id));
        toast({
          title: 'Licens avslutad',
          description: 'Licensen har avslutats',
        });
      } else {
        throw new Error('Failed to delete license');
      }
    } catch (error) {
      console.error('Error deleting license:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte avsluta licens',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      clinicId: '',
      plan: 'LAUNCH',
      apiKey: '',
      projectId: '',
      pricePerMonth: '0',
      expiresAt: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Aktiv</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Utgått</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Pausad</Badge>;
      case 'PENDING':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Väntande</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800',
      LAUNCH: 'bg-blue-100 text-blue-800',
      SCALE: 'bg-purple-100 text-purple-800',
      OPTIMIZE: 'bg-yellow-100 text-yellow-800',
    };
    return <Badge className={colors[plan] || 'bg-gray-100'}>{plan}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laddar licenser...</p>
        </div>
      </div>
    );
  }

  const activeLicenses = licenses.filter(l => l.status === 'ACTIVE').length;
  const expiredLicenses = licenses.filter(l => l.status === 'EXPIRED').length;
  const totalRevenue = licenses.reduce((sum, l) => sum + Number(l.pricePerMonth), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unlayer License Manager</h1>
          <p className="text-muted-foreground mt-1">
            Hantera Unlayer Pro-licenser för Enterprise-kunder
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Aktivera Licens
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aktivera Unlayer Pro-licens</DialogTitle>
              <DialogDescription>
                Aktivera en betald Unlayer-licens för en Enterprise-kund
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clinic">Klinik (Enterprise)*</Label>
                <Select value={formData.clinicId} onValueChange={(value) => setFormData({ ...formData, clinicId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj klinik" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics
                      .filter(c => c.tier === 'ENTERPRISE')
                      .map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name} ({clinic.tier})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Unlayer Plan*</Label>
                <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAUNCH">Launch</SelectItem>
                    <SelectItem value="SCALE">Scale</SelectItem>
                    <SelectItem value="OPTIMIZE">Optimize</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">Unlayer API Key*</Label>
                <Input
                  id="apiKey"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="unlayer_api_key..."
                />
                <p className="text-xs text-muted-foreground">
                  Hämta från Unlayer Dashboard API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">Project ID (valfritt)</Label>
                <Input
                  id="projectId"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  placeholder="123456"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Pris per månad (SEK)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.pricePerMonth}
                    onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Utgångsdatum (valfritt)</Label>
                  <Input
                    id="expires"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreateLicense}>
                <Key className="h-4 w-4 mr-2" />
                Aktivera Licens
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
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeLicenses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utgångna</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredLicenses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} kr</div>
          </CardContent>
        </Card>
      </div>

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alla Licenser</CardTitle>
          <CardDescription>Översikt över alla Unlayer Pro-licenser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {licenses.map((license) => (
              <div
                key={license.id}
                className={`p-4 border rounded-lg transition-colors ${
                  license.status === 'ACTIVE' ? 'bg-green-50 border-green-200' :
                  license.status === 'EXPIRED' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{license.clinic.name}</h3>
                      {getPlanBadge(license.plan)}
                      {getStatusBadge(license.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tier</p>
                        <p className="font-medium">{license.clinic.tier}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pris/månad</p>
                        <p className="font-medium">{Number(license.pricePerMonth).toLocaleString()} kr</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Aktiverad</p>
                        <p className="font-medium">
                          {new Date(license.activatedAt).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      {license.expiresAt && (
                        <div>
                          <p className="text-muted-foreground">Utgår</p>
                          <p className="font-medium">
                            {new Date(license.expiresAt).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                      )}
                    </div>
                    {license.apiKey && (
                      <div className="text-xs text-muted-foreground">
                        API Key: {license.apiKey.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {license.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateLicense(license.id, 'SUSPENDED')}
                      >
                        Pausa
                      </Button>
                    )}
                    {license.status === 'SUSPENDED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateLicense(license.id, 'ACTIVE')}
                      >
                        Aktivera
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteLicense(license.id)}
                    >
                      Avsluta
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {licenses.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Inga licenser aktiverade än</p>
                <p className="text-sm mt-2">
                  Aktivera en Unlayer Pro-licens för Enterprise-kunder
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

