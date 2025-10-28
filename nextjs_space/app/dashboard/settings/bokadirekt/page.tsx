
'use client';

import { AutoBookingToggle } from '@/components/bokadirekt/auto-booking-toggle';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Settings } from 'lucide-react';

export default function BokadirektSettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <BackButton />
        <div className="flex items-center gap-3 mt-4">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Bokadirekt-inställningar</h1>
            <p className="text-muted-foreground mt-1">
              Konfigurera automatisk bokningshantering från Bokadirekt
            </p>
          </div>
        </div>
      </div>

      <AutoBookingToggle />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Hur fungerar Auto-Booking?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">🚫 OFF (Manuell)</h3>
            <p className="text-sm text-muted-foreground">
              Ingen automatisering. Du hanterar alla bokningar manuellt via Bokadirekt-gränssnittet.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🔔 NOTIFY (Notifiering)</h3>
            <p className="text-sm text-muted-foreground">
              Flow övervakar Bokadirekt var 15:e minut och skickar ett email när nya bokningsbara tider blir tillgängliga.
              Du väljer sedan själv vilka tider du vill boka.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">⚡ AUTO (Automatisk)</h3>
            <p className="text-sm text-muted-foreground">
              Flow bokar automatiskt första tillgängliga tiden inom ditt angivna antal dagar.
              Detta är det snabbaste sättet att säkra lediga tider!
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Obs:</strong> Auto-booking kräver att du har en aktiv Bokadirekt-integration.
              Gå till SuperAdmin-inställningar för att konfigurera din Bokadirekt API-nyckel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
