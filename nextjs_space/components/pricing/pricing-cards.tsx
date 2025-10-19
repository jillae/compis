
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap } from 'lucide-react';
import { PricingToggle, PriceDisplay } from './pricing-toggle';

export function PricingCards() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="max-w-6xl mx-auto">
      <PricingToggle onToggle={setIsYearly} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* FREE */}
        <Card className="border-2 hover:border-gray-300 transition-all">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="text-sm text-gray-600 mt-1">Perfekt för att testa Flow</p>
              </div>
              <div className="text-gray-900">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">0</span>
                  <div className="flex flex-col">
                    <span className="text-gray-600">kr/månad</span>
                  </div>
                </div>
                <p className="text-sm text-green-600 mt-2 font-semibold">
                  Alltid gratis
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Upp till 50 bokningar/månad</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Grundläggande dashboard</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Enkel bokningsöversikt</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>No-show påminnelser</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>E-postnotiser</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Community support</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block">
                <Button className="w-full" variant="outline">
                  Kom igång gratis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* BASIC */}
        <Card className="border-2 hover:border-blue-300 transition-all">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Basic</h3>
                <p className="text-sm text-gray-600 mt-1">För mindre kliniker</p>
              </div>
              <div className="text-blue-600">
                <PriceDisplay monthlyPrice={499} isYearly={isYearly} />
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Upp till 500 bokningar/månad</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Grundläggande intäktsanalys</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Risk-varningar för no-shows</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Automatiska veckorapporter</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Bokningssystem-integration</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Standard support</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block">
                <Button className="w-full" variant="outline">
                  Kom igång
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* PROFESSIONAL - Popular */}
        <Card className="border-2 border-purple-300 shadow-xl relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
              POPULÄRAST
            </span>
          </div>
          <CardContent className="p-8 bg-gradient-to-br from-purple-50 to-white">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-purple-900">Professional</h3>
                <p className="text-sm text-purple-700 mt-1">För växande kliniker</p>
              </div>
              <div className="text-purple-600">
                <PriceDisplay monthlyPrice={1499} isYearly={isYearly} />
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Obegränsat antal bokningar</span>
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Revenue Intelligence</span>
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Customer Health Scoring</span>
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Meta Marketing ROI-analys</span>
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Kapacitetsoptimering</span>
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Dynamic Pricing</span>
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Automatiska retentionskampanjer</span>
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Prioriterad support</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Zap className="mr-2 h-4 w-4" />
                  Kom igång
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ENTERPRISE */}
        <Card className="border-2 hover:border-indigo-300 transition-all">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Enterprise</h3>
                <p className="text-sm text-gray-600 mt-1">För etablerade kedjor</p>
              </div>
              <div className="text-indigo-600">
                <PriceDisplay monthlyPrice={2999} isYearly={isYearly} />
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Allt i Professional</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Anpassade integrationer</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Dedikerad success manager</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>White-label möjlighet</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>SLA-garanti</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Multi-klinik hantering</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>24/7 support</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600">
                  Kontakta oss
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
