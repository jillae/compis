
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CustomerHealthCardProps {
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    healthScore: number | null;
    healthStatus: 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL' | null;
    lastHealthCalculation: string | null;
    riskFactors: string[] | null;
    totalVisits: number;
    lifetimeValue: number;
  };
  onUpdate?: () => void;
}

export function CustomerHealthCard({ customer, onUpdate }: CustomerHealthCardProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const getHealthIcon = (status: string | null) => {
    switch (status) {
      case 'EXCELLENT':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'HEALTHY':
        return <Heart className="h-5 w-5 text-blue-500" />;
      case 'AT_RISK':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Heart className="h-5 w-5 text-gray-400" />;
    }
  };

  const getHealthBadge = (status: string | null) => {
    switch (status) {
      case 'EXCELLENT':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Excellent</Badge>;
      case 'HEALTHY':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Healthy</Badge>;
      case 'AT_RISK':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">At Risk</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 76) return 'text-green-600';
    if (score >= 51) return 'text-blue-600';
    if (score >= 26) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleSendRetentionEmail = async () => {
    try {
      setSending(true);
      // TODO: Implement retention email API
      toast({
        title: 'Feature Coming Soon',
        description: 'Retention email functionality will be available after email template integration.',
      });
    } catch (error) {
      toast({
        title: 'Failed to Send Email',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const riskFactors = customer.riskFactors || [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Customer Info */}
            <div className="flex items-center gap-4 flex-1">
              {getHealthIcon(customer.healthStatus)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{customer.name || 'Unknown Customer'}</h3>
                  {getHealthBadge(customer.healthStatus)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </span>
                  )}
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Health Score */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(customer.healthScore)}`}>
                  {customer.healthScore || '—'}
                </div>
                <div className="text-xs text-muted-foreground">Health Score</div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{customer.totalVisits}</div>
                  <div className="text-xs text-muted-foreground">Visits</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{Math.round(customer.lifetimeValue)} kr</div>
                  <div className="text-xs text-muted-foreground">LTV</div>
                </div>
              </div>

              {/* Actions & Expand */}
              <div className="flex items-center gap-2">
                {(customer.healthStatus === 'AT_RISK' || customer.healthStatus === 'CRITICAL') && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleSendRetentionEmail}
                    disabled={sending}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    {sending ? 'Sending...' : 'Contact'}
                  </Button>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </div>

          {/* Expandable Details */}
          <CollapsibleContent className="mt-4 pt-4 border-t">
            <div className="space-y-3">
              {/* Risk Factors */}
              {riskFactors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Risk Factors
                  </h4>
                  <div className="space-y-1">
                    {riskFactors.map((factor, index) => (
                      <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {(customer.healthStatus === 'AT_RISK' || customer.healthStatus === 'CRITICAL') && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Recommendations
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {customer.healthStatus === 'CRITICAL' && (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        🚨 URGENT: Send personalized retention offer
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      💬 Reach out via phone or Corex
                    </div>
                    {customer.lifetimeValue > 5000 && (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        🎁 Offer VIP loyalty discount (high-value customer)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Last Calculation */}
              {customer.lastHealthCalculation && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last updated: {new Date(customer.lastHealthCalculation).toLocaleDateString('sv-SE')}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
