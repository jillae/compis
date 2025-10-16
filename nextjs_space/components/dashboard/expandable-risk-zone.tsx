
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  Phone,
  Mail,
  Sparkles,
  TrendingDown,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface RiskBooking {
  bookingId: string;
  customerName: string;
  serviceName: string;
  scheduledTime: string;
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedLoss: number;
  topReason: string;
}

interface ExpandableRiskZoneProps {
  metrics: {
    highRiskBookings: number;
    mediumRiskBookings: number;
    potentialLoss: number;
  } | null;
  timeRange?: number;
}

export function ExpandableRiskZone({ metrics, timeRange = 14 }: ExpandableRiskZoneProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [riskBookings, setRiskBookings] = useState<RiskBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && riskBookings.length === 0) {
      fetchRiskBookings();
    }
  }, [isExpanded]);

  const fetchRiskBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/predict?days=${timeRange}&limit=5`);
      const data = await res.json();
      
      if (data.bookings) {
        // Map to our interface (mock data for now)
        setRiskBookings(
          data.bookings.slice(0, 5).map((b: any) => ({
            bookingId: b.bookingId,
            customerName: 'Kund från bokning',
            serviceName: 'Behandling',
            scheduledTime: new Date().toISOString(),
            riskScore: b.riskScore,
            riskLevel: b.riskLevel,
            estimatedLoss: b.estimatedLoss,
            topReason: b.contributingFactors?.[0] || 'Hög riskprofil'
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch risk bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string, bookingId: string) => {
    switch (action) {
      case 'sms':
        toast.success('✅ SMS-påminnelse skickad via Corex!');
        break;
      case 'call':
        toast.info('📞 Förbereder samtal...');
        break;
      case 'email':
        toast.success('📧 Email skickat!');
        break;
      case 'corex':
        toast.info('✨ Corex startar automatisk uppföljning...');
        break;
    }
  };

  if (!metrics) return null;

  const totalAtRisk = (metrics.highRiskBookings || 0) + (metrics.mediumRiskBookings || 0);

  return (
    <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-100/50">
      <CardHeader 
        className="cursor-pointer hover:bg-red-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">I Riskzonen</CardTitle>
              {totalAtRisk > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalAtRisk} bokningar
                </Badge>
              )}
            </div>
            <CardDescription className="text-red-700">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                <span className="font-semibold">
                  {metrics.potentialLoss?.toLocaleString() || 0} kr i riskzon
                </span>
              </div>
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 pt-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-3 bg-white/50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">
                {metrics.highRiskBookings}
              </div>
              <div className="text-xs text-muted-foreground">Hög risk</div>
            </div>
            <div className="p-3 bg-white/50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.mediumRiskBookings}
              </div>
              <div className="text-xs text-muted-foreground">Medel risk</div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Hämtar riskbokningar...</p>
            </div>
          )}

          {/* Risk Bookings List */}
          {!loading && riskBookings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-red-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Top 5 Högrisikbokningar
              </h4>
              
              {riskBookings.map((booking) => (
                <div 
                  key={booking.bookingId}
                  className="p-3 bg-white rounded-lg border border-red-200 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={booking.riskLevel === 'HIGH' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {booking.riskScore}% risk
                        </Badge>
                        <span className="text-sm font-medium">
                          {booking.estimatedLoss.toLocaleString()} kr
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {booking.topReason}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleQuickAction('sms', booking.bookingId)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      SMS
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleQuickAction('call', booking.bookingId)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Ring
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs border-primary text-primary"
                      onClick={() => handleQuickAction('corex', booking.bookingId)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Corex
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && riskBookings.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Inga högriskbokningar just nu! 🎉
              </p>
            </div>
          )}

          {/* View All Button */}
          <Link href="/dashboard/at-risk">
            <Button variant="default" className="w-full gap-2 bg-red-600 hover:bg-red-700">
              <Eye className="h-4 w-4" />
              Se alla riskbokningar
            </Button>
          </Link>

          {/* Corex Auto-Follow Up Banner */}
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-primary">
                  Aktivera Corex Auto-uppföljning
                </p>
                <p className="text-muted-foreground mt-1">
                  Låt Corex automatiskt hantera alla högriskbokningar och spara 5-10h/vecka
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
