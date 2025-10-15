
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  ArrowUpCircle,
  Calendar,
  Download,
} from 'lucide-react';
import { formatPrice, getSubscriptionStatusBadge, PRICING_TIERS, isTrialExpiringSoon } from '@/lib/billing';
import Link from 'next/link';
import { toast } from 'sonner';
import { SubscriptionTier } from '@prisma/client';

interface SubscriptionData {
  subscription: any;
  clinic: {
    tier: SubscriptionTier;
    subscriptionStatus: string;
    trialEndsAt: string | null;
  };
}

export default function BillingPage() {
  const { data: session } = useSession() || {};
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing/subscription');
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        toast.error('Kunde inte hämta prenumerationsinfo');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Fel vid hämtning av prenumeration');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Är du säker på att du vill avsluta prenumerationen? Tillgång fortsätter till periodens slut.')) {
      return;
    }

    try {
      setCancelling(true);
      const response = await fetch('/api/billing/subscription', {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Prenumeration avslutad');
        fetchSubscription();
      } else {
        toast.error('Kunde inte avsluta prenumeration');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Fel vid avslutning av prenumeration');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar prenumerationsinfo...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ingen prenumerationsdata tillgänglig. Kontakta support om problemet kvarstår.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { clinic, subscription } = data;
  const currentTier = PRICING_TIERS[clinic.tier];
  const statusBadge = getSubscriptionStatusBadge(clinic.subscriptionStatus as any);
  const trialEndsAt = clinic.trialEndsAt ? new Date(clinic.trialEndsAt) : null;
  const isTrialExpiring = isTrialExpiringSoon(trialEndsAt);

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prenumeration & Fakturering</h1>
          <p className="text-muted-foreground">
            Hantera din prenumeration och visa fakturor
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Tillbaka till Dashboard</Button>
        </Link>
      </div>

      {/* Trial Expiring Alert */}
      {isTrialExpiring && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Din trial går ut om {Math.ceil((trialEndsAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dagar.
            Uppgradera nu för att fortsätta använda Flow utan avbrott.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Nuvarande Plan
              </CardTitle>
              <CardDescription>
                Din aktiva prenumeration och funktioner
              </CardDescription>
            </div>
            <Badge variant={statusBadge.variant as any}>{statusBadge.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Tier Info */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <div>
                <h3 className="text-2xl font-bold text-blue-900">{currentTier.name}</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {currentTier.bookingsLimit
                    ? `Upp till ${currentTier.bookingsLimit} bokningar/månad`
                    : 'Obegränsat antal bokningar'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-900">
                  {formatPrice(currentTier.price)}
                </div>
                <p className="text-sm text-blue-700">/månad</p>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold mb-3">Inkluderade funktioner:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentTier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Details */}
            {subscription && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-medium">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString('sv-SE')} -{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                {subscription.trialEnd && (
                  <div>
                    <p className="text-sm text-muted-foreground">Trial slutar</p>
                    <p className="font-medium">
                      {new Date(subscription.trialEnd).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                )}
                {subscription.bookingsThisMonth !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bokningar denna månad</p>
                    <p className="font-medium">
                      {subscription.bookingsThisMonth}
                      {subscription.bookingsLimit ? ` / ${subscription.bookingsLimit}` : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Link href="/dashboard/billing/upgrade">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Uppgradera Plan
                </Button>
              </Link>
              {subscription && !subscription.cancelAtPeriodEnd && (
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                >
                  {cancelling ? 'Avslutar...' : 'Avsluta Prenumeration'}
                </Button>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Prenumerationen avslutas {new Date(subscription.currentPeriodEnd).toLocaleDateString('sv-SE')}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Fakturor
              </CardTitle>
              <CardDescription>
                Historik över dina fakturor
              </CardDescription>
            </div>
            <Link href="/dashboard/billing/invoices">
              <Button variant="outline" size="sm">
                Visa alla fakturor
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {subscription?.invoices && subscription.invoices.length > 0 ? (
            <div className="space-y-3">
              {subscription.invoices.slice(0, 5).map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(invoice.total)}</p>
                      <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'}>
                        {invoice.status === 'PAID' ? 'Betald' : invoice.status}
                      </Badge>
                    </div>
                    {invoice.invoicePdfUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={invoice.invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Inga fakturor än</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Alerts */}
      {subscription?.billingAlerts && subscription.billingAlerts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Varningar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subscription.billingAlerts.map((alert: any) => (
                <Alert key={alert.id} className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
