
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, Zap } from 'lucide-react';
import { PRICING_TIERS, formatPrice } from '@/lib/billing';
import { SubscriptionTier } from '@prisma/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { PricingToggle, PriceDisplay } from '@/components/pricing/pricing-toggle';

export default function UpgradePage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      setUpgrading(true);
      setSelectedTier(tier);

      const response = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTier: tier }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        router.push('/dashboard/billing');
      } else {
        toast.error('Kunde inte uppgradera prenumeration');
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error('Fel vid uppgradering');
    } finally {
      setUpgrading(false);
      setSelectedTier(null);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Välj din plan</h1>
          <p className="text-muted-foreground">
            Uppgradera för att låsa upp fler funktioner
          </p>
        </div>
        <Link href="/dashboard/billing">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka
          </Button>
        </Link>
      </div>

      {/* Pricing Toggle */}
      <div className="flex justify-center">
        <PricingToggle onToggle={setIsYearly} />
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BASIC */}
        <Card className="border-2 hover:border-blue-300 transition-all relative">
          <CardHeader>
            <CardTitle className="text-2xl">{PRICING_TIERS.BASIC.name}</CardTitle>
            <CardDescription>För mindre kliniker som börjar digitalisera</CardDescription>
            <div className="pt-4 text-blue-600">
              <PriceDisplay monthlyPrice={PRICING_TIERS.BASIC.price} isYearly={isYearly} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                {PRICING_TIERS.BASIC.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleUpgrade(SubscriptionTier.BASIC)}
                disabled={upgrading}
              >
                {upgrading && selectedTier === SubscriptionTier.BASIC
                  ? 'Uppgraderar...'
                  : 'Välj Basic'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PROFESSIONAL */}
        <Card className="border-2 border-purple-300 hover:border-purple-400 transition-all relative shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              POPULÄRAST
            </Badge>
          </div>
          <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardTitle className="text-2xl text-purple-900">
              {PRICING_TIERS.PROFESSIONAL.name}
            </CardTitle>
            <CardDescription>För växande kliniker som vill maximera intäkter</CardDescription>
            <div className="pt-4 text-purple-600">
              <PriceDisplay monthlyPrice={PRICING_TIERS.PROFESSIONAL.price} isYearly={isYearly} />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                {PRICING_TIERS.PROFESSIONAL.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => handleUpgrade(SubscriptionTier.PROFESSIONAL)}
                disabled={upgrading}
              >
                <Zap className="mr-2 h-4 w-4" />
                {upgrading && selectedTier === SubscriptionTier.PROFESSIONAL
                  ? 'Uppgraderar...'
                  : 'Välj Professional'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ENTERPRISE */}
        <Card className="border-2 hover:border-indigo-300 transition-all relative">
          <CardHeader>
            <CardTitle className="text-2xl">{PRICING_TIERS.ENTERPRISE.name}</CardTitle>
            <CardDescription>För etablerade kliniker med flera enheter</CardDescription>
            <div className="pt-4 text-indigo-600">
              <PriceDisplay monthlyPrice={PRICING_TIERS.ENTERPRISE.price} isYearly={isYearly} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                {PRICING_TIERS.ENTERPRISE.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600"
                onClick={() => handleUpgrade(SubscriptionTier.ENTERPRISE)}
                disabled={upgrading}
              >
                {upgrading && selectedTier === SubscriptionTier.ENTERPRISE
                  ? 'Uppgraderar...'
                  : 'Välj Enterprise'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Vanliga frågor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Kan jag byta plan när som helst?</h3>
              <p className="text-sm text-muted-foreground">
                Ja, du kan uppgradera eller nedgradera din plan när som helst. Ändringar träder i kraft omedelbart.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Vad händer om jag överskrider min bokningsgräns?</h3>
              <p className="text-sm text-muted-foreground">
                För Basic-planen får du en varning när du närmar dig gränsen. Du kan då uppgradera till Professional för obegränsat antal bokningar.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Kan jag avsluta min prenumeration?</h3>
              <p className="text-sm text-muted-foreground">
                Ja, du kan när som helst avsluta prenumerationen. Din tillgång fortsätter till periodens slut.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Vilka betalningsmetoder accepteras?</h3>
              <p className="text-sm text-muted-foreground">
                Vi accepterar kreditkort (Visa, Mastercard, Amex) och Swish. Faktura (NET 30) är tillgängligt för Enterprise-kunder.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
