

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Phone, 
  MessageSquare, 
  TrendingDown,
  Calendar,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

interface RiskPrediction {
  bookingId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contributingFactors: string[];
  recommendations: string[];
}

interface BookingWithRisk {
  id: string;
  scheduledAt: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  service: {
    name: string;
  };
  staff: {
    name: string;
  };
  price: number;
  prediction: RiskPrediction;
}

interface RiskData {
  summary: {
    totalBookings: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    expectedLoss: number;
  };
  bookings: BookingWithRisk[];
}

function getRiskColor(level: string) {
  switch (level) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getRiskIcon(level: string) {
  switch (level) {
    case 'CRITICAL':
      return <AlertTriangle className="h-4 w-4" />;
    case 'HIGH':
      return <AlertCircle className="h-4 w-4" />;
    case 'MEDIUM':
      return <Clock className="h-4 w-4" />;
    case 'LOW':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}

export default function RiskAlertsPage() {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/predict-risk?days=${selectedDays}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, [selectedDays]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Analyserar no-show risk...</p>
        </div>
      </div>
    );
  }

  const criticalRisk = data.bookings.filter(b => b.prediction.riskLevel === 'CRITICAL');
  const highRisk = data.bookings.filter(b => b.prediction.riskLevel === 'HIGH');
  const mediumRisk = data.bookings.filter(b => b.prediction.riskLevel === 'MEDIUM');
  const lowRisk = data.bookings.filter(b => b.prediction.riskLevel === 'LOW');

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">⚠️ No-Show Riskanalys</h1>
              <p className="text-muted-foreground mt-2">
                Identifiera riskbokningar och minimera förlorade intäkter
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value={1}>Imorgon</option>
                <option value={7}>Kommande 7 dagar</option>
                <option value={14}>Kommande 14 dagar</option>
                <option value={30}>Kommande 30 dagar</option>
              </select>
              <Button onClick={fetchRiskData} variant="outline">
                Uppdatera
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bokningar</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                Kommande {selectedDays} {selectedDays === 1 ? 'dag' : 'dagar'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hög Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data.summary.highRisk}
              </div>
              <p className="text-xs text-muted-foreground">
                Behöver omedelbar uppmärksamhet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Förväntad Förlust</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {data.summary.expectedLoss.toLocaleString('sv-SE')} kr
              </div>
              <p className="text-xs text-muted-foreground">
                Om inga åtgärder vidtas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genomsnittlig Risk</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.totalBookings > 0 
                  ? Math.round(
                      data.bookings.reduce((sum, b) => sum + b.prediction.riskScore, 0) / 
                      data.bookings.length
                    ) + '%'
                  : '0%'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Över alla bokningar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Analysis by Level */}
        <Tabs defaultValue="critical" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="critical" className="relative">
              Kritisk ({criticalRisk.length})
              {criticalRisk.length > 0 && (
                <span className="absolute -top-2 -right-2 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="high">Hög ({highRisk.length})</TabsTrigger>
            <TabsTrigger value="medium">Måttlig ({mediumRisk.length})</TabsTrigger>
            <TabsTrigger value="low">Låg ({lowRisk.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="critical" className="space-y-4">
            {criticalRisk.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600">Inga kritiska riskbokningar!</h3>
                  <p className="text-muted-foreground">Alla bokningar har acceptabla risknivåer.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Kräver omedelbar åtgärd:</strong> {criticalRisk.length} bokningar har mycket hög risk för no-show.
                    Förväntad förlust: {Math.round(criticalRisk.reduce((sum, b) => sum + (b.price * b.prediction.riskScore / 100), 0)).toLocaleString('sv-SE')} kr.
                  </AlertDescription>
                </Alert>
                {criticalRisk.map((booking) => (
                  <BookingRiskCard key={booking.id} booking={booking} />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="high" className="space-y-4">
            {highRisk.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600">Inga högriskbokningar!</h3>
                  <p className="text-muted-foreground">Utmärkt - alla bokningar har låg till måttlig risk.</p>
                </CardContent>
              </Card>
            ) : (
              highRisk.map((booking) => (
                <BookingRiskCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="medium" className="space-y-4">
            {mediumRisk.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold">Inga måttliga riskbokningar</h3>
                  <p className="text-muted-foreground">Alla bokningar är antingen låg eller hög risk.</p>
                </CardContent>
              </Card>
            ) : (
              mediumRisk.map((booking) => (
                <BookingRiskCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="low" className="space-y-4">
            {lowRisk.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold">Inga lågriskbokningar</h3>
                  <p className="text-muted-foreground">Alla bokningar kräver uppmärksamhet.</p>
                </CardContent>
              </Card>
            ) : (
              lowRisk.map((booking) => (
                <BookingRiskCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BookingRiskCard({ booking }: { booking: BookingWithRisk }) {
  const scheduledDate = parseISO(booking.scheduledAt);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">
                {booking.customer.firstName} {booking.customer.lastName}
              </h3>
              <Badge className={getRiskColor(booking.prediction.riskLevel)}>
                {getRiskIcon(booking.prediction.riskLevel)}
                <span className="ml-1">{booking.prediction.riskLevel}</span>
              </Badge>
              <Badge variant="secondary">
                {booking.prediction.riskScore}% risk
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(scheduledDate, 'EEEE d MMM', { locale: sv })} kl {format(scheduledDate, 'HH:mm')}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {booking.service.name} med {booking.staff.name}
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {booking.price.toLocaleString('sv-SE')} kr
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">Riskfaktorer:</h4>
            <div className="flex flex-wrap gap-1">
              {booking.prediction.contributingFactors.map((factor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Rekommenderade åtgärder:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {booking.prediction.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Ring {booking.customer.phone}
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS påminnelse
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
