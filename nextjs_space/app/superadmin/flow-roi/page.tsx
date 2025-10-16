
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Users, 
  Target,
  Award,
  RefreshCw,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface FlowROIMetrics {
  clinicId: string;
  clinicName: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  revenueGained: number;
  revenueProtected: number;
  revenueOptimized: number;
  hoursSaved: number;
  costSavings: number;
  adSpendOptimized: number;
  campaignImprovements: number;
  customersRetained: number;
  retentionValue: number;
  totalValueGenerated: number;
  flowCost: number;
  netROI: number;
  roiPercentage: number;
  actionsTaken: number;
  actionsCompleted: number;
  loginFrequency: number;
  featureAdoption: number;
  calculatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
}

export default function FlowROIPage() {
  const [clinics, setClinics] = useState<FlowROIMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadROI();
  }, [period]);

  const loadROI = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/superadmin/flow-roi?period=${period}`);
      const data = await response.json();
      if (data.success) {
        setClinics(data.clinics);
      }
    } catch (error) {
      console.error('Error loading ROI:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClinics = clinics.filter(clinic =>
    clinic.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aggregate stats
  const totalValue = clinics.reduce((sum, c) => sum + c.totalValueGenerated, 0);
  const totalCost = clinics.reduce((sum, c) => sum + c.flowCost, 0);
  const avgROI = clinics.length > 0
    ? clinics.reduce((sum, c) => sum + c.roiPercentage, 0) / clinics.length
    : 0;
  const totalActions = clinics.reduce((sum, c) => sum + c.actionsCompleted, 0);

  const exportToCSV = () => {
    const headers = [
      'Klinik',
      'Intäktsökning',
      'Intäktsskydd',
      'Tidsbesparingar',
      'Marknadsföringsoptimering',
      'Totalt värde',
      'Flow-kostnad',
      'Netto ROI',
      'ROI %',
      'Aktivitetsgrad',
    ].join(',');

    const rows = filteredClinics.map(c =>
      [
        c.clinicName,
        c.revenueGained.toFixed(0),
        c.revenueProtected.toFixed(0),
        c.costSavings.toFixed(0),
        c.adSpendOptimized.toFixed(0),
        c.totalValueGenerated.toFixed(0),
        c.flowCost.toFixed(0),
        c.netROI.toFixed(0),
        c.roiPercentage.toFixed(1),
        c.featureAdoption.toFixed(1),
      ].join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-roi-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flow ROI Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Värde genererat av Flow per klinik - för marknadsföring & kundvård
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadROI} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportera CSV
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={period === 'monthly' ? 'default' : 'outline'}
          onClick={() => setPeriod('monthly')}
        >
          Månadsvis
        </Button>
        <Button
          variant={period === 'quarterly' ? 'default' : 'outline'}
          onClick={() => setPeriod('quarterly')}
        >
          Kvartalsvis
        </Button>
        <Button
          variant={period === 'yearly' ? 'default' : 'outline'}
          onClick={() => setPeriod('yearly')}
        >
          Årsvis
        </Button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totalt värde genererat</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalValue.toLocaleString('sv-SE')} kr
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Genomsnittlig ROI</p>
                <p className="text-2xl font-bold text-blue-600">
                  {avgROI.toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktiva kliniker</p>
                <p className="text-2xl font-bold">
                  {clinics.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Åtgärder genomförda</p>
                <p className="text-2xl font-bold">
                  {totalActions}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök klinik..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clinics List */}
      <div className="space-y-4">
        {filteredClinics.map((clinic) => (
          <Card key={clinic.clinicId} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {clinic.clinicName}
                    {clinic.roiPercentage > 500 && (
                      <Badge className="bg-yellow-500">⭐ Superuser</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {clinic.featureAdoption.toFixed(0)}% aktivitetsgrad • {clinic.actionsCompleted} åtgärder slutförda
                  </CardDescription>
                </div>
                <Link href={`/superadmin/clinics/${clinic.clinicId}`}>
                  <Button variant="ghost" size="sm">
                    Visa detaljer →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Intäktsökning</p>
                  <p className="text-lg font-semibold text-green-600">
                    +{clinic.revenueGained.toLocaleString('sv-SE')} kr
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Intäktsskydd</p>
                  <p className="text-lg font-semibold text-blue-600">
                    +{clinic.revenueProtected.toLocaleString('sv-SE')} kr
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tidsbesparingar</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {clinic.hoursSaved}h = {clinic.costSavings.toLocaleString('sv-SE')} kr
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Marknadsoptimering</p>
                  <p className="text-lg font-semibold text-orange-600">
                    +{clinic.adSpendOptimized.toLocaleString('sv-SE')} kr
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Totalt värde genererat</p>
                  <p className="text-2xl font-bold">
                    {clinic.totalValueGenerated.toLocaleString('sv-SE')} kr
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Netto ROI</p>
                  <div className="flex items-center gap-2">
                    {clinic.netROI > 0 ? (
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className={`text-2xl font-bold ${clinic.netROI > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {clinic.netROI.toLocaleString('sv-SE')} kr
                      </p>
                      <p className="text-sm font-semibold">
                        ({clinic.roiPercentage.toFixed(0)}% ROI)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredClinics.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                Inga kliniker hittades
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
