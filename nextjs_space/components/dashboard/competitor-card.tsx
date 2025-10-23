
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2,
  Globe,
  MapPin,
  Star,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CompetitorCardProps {
  competitor: {
    id: string;
    name: string;
    description: string | null;
    website: string | null;
    location: string | null;
    category: string | null;
    tier: string | null;
    services: string[];
    overallRating: number | null;
    totalReviews: number | null;
    isActive: boolean;
    isMonitoring: boolean;
    lastCheckedAt: string | null;
    priceSnapshots: Array<{
      id: string;
      serviceName: string;
      price: number;
      ourPrice: number | null;
      priceDiff: number | null;
      priceDiffPct: number | null;
      snapshotDate: string;
    }>;
  };
  onUpdate?: () => void;
}

export function CompetitorCard({ competitor, onUpdate }: CompetitorCardProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const getCategoryBadge = (category: string | null) => {
    switch (category) {
      case 'direct':
        return <Badge className="bg-red-100 text-red-700">Direct</Badge>;
      case 'indirect':
        return <Badge className="bg-yellow-100 text-yellow-700">Indirect</Badge>;
      case 'emerging':
        return <Badge className="bg-blue-100 text-blue-700">Emerging</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTierBadge = (tier: string | null) => {
    switch (tier) {
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-700">Premium</Badge>;
      case 'mid':
        return <Badge className="bg-blue-100 text-blue-700">Mid-range</Badge>;
      case 'budget':
        return <Badge className="bg-green-100 text-green-700">Budget</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleToggleMonitoring = async () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Automated monitoring will be available soon.',
    });
  };

  const latestSnapshot = competitor.priceSnapshots[0];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            {/* Competitor Info */}
            <div className="flex items-start gap-4 flex-1">
              <Building2 className="h-6 w-6 text-muted-foreground mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{competitor.name}</h3>
                  {getCategoryBadge(competitor.category)}
                  {getTierBadge(competitor.tier)}
                  {competitor.isMonitoring && (
                    <Badge className="bg-green-100 text-green-700">
                      <Eye className="h-3 w-3 mr-1" />
                      Monitoring
                    </Badge>
                  )}
                </div>

                {competitor.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {competitor.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
                  {competitor.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {competitor.location}
                    </span>
                  )}
                  {competitor.website && (
                    <a 
                      href={competitor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  )}
                  {competitor.overallRating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {competitor.overallRating.toFixed(1)} ({competitor.totalReviews} reviews)
                    </span>
                  )}
                </div>

                {/* Services */}
                {competitor.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {competitor.services.slice(0, 5).map((service, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {competitor.services.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{competitor.services.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Latest Price Info */}
            <div className="flex items-center gap-4">
              {latestSnapshot && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{latestSnapshot.serviceName}</div>
                  <div className="text-lg font-bold">{latestSnapshot.price} kr</div>
                  {latestSnapshot.ourPrice && (
                    <div className="text-sm">
                      {latestSnapshot.priceDiffPct && latestSnapshot.priceDiffPct > 0 ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          {latestSnapshot.priceDiffPct.toFixed(0)}% cheaper
                        </span>
                      ) : latestSnapshot.priceDiffPct && latestSnapshot.priceDiffPct < 0 ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {Math.abs(latestSnapshot.priceDiffPct).toFixed(0)}% pricier
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Same price</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleToggleMonitoring}
                >
                  {competitor.isMonitoring ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
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

          {/* Expandable Price History */}
          <CollapsibleContent className="mt-4 pt-4 border-t">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Price History</h4>
                <Button size="sm" variant="outline" onClick={() => {
                  toast({
                    title: 'Feature Coming Soon',
                    description: 'Manual price snapshot entry will be available soon.',
                  });
                }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Snapshot
                </Button>
              </div>

              {competitor.priceSnapshots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No price snapshots yet</p>
              ) : (
                <div className="space-y-2">
                  {competitor.priceSnapshots.slice(0, 5).map((snapshot) => (
                    <div key={snapshot.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <div>
                        <div className="font-medium">{snapshot.serviceName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(snapshot.snapshotDate).toLocaleDateString('sv-SE')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{snapshot.price} kr</div>
                        {snapshot.ourPrice && (
                          <div className="text-xs text-muted-foreground">
                            Ours: {snapshot.ourPrice} kr
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {competitor.lastCheckedAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last checked: {new Date(competitor.lastCheckedAt).toLocaleDateString('sv-SE')}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
