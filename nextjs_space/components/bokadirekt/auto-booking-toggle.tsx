
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Bell, Zap, AlertCircle } from 'lucide-react';

enum BokadirektAutoBookingMode {
  OFF = 'OFF',
  NOTIFY = 'NOTIFY',
  AUTO = 'AUTO',
}

interface AutoBookingConfig {
  bokadirektAutoBookingMode: BokadirektAutoBookingMode;
  autoBookingPreferredServices: string[];
  autoBookingPreferredStaff: string[];
  autoBookingMaxDaysAhead: number;
  autoBookingNotifyEmail: string | null;
  bokadirektEnabled: boolean;
}

export function AutoBookingToggle() {
  const [config, setConfig] = useState<AutoBookingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [mode, setMode] = useState<BokadirektAutoBookingMode>(BokadirektAutoBookingMode.OFF);
  const [maxDaysAhead, setMaxDaysAhead] = useState(14);
  const [notifyEmail, setNotifyEmail] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bokadirekt/auto-booking');

      if (!response.ok) {
        throw new Error('Failed to fetch config');
      }

      const data = await response.json();
      setConfig(data);
      setMode(data.bokadirektAutoBookingMode);
      setMaxDaysAhead(data.autoBookingMaxDaysAhead || 14);
      setNotifyEmail(data.autoBookingNotifyEmail || '');
    } catch (error) {
      console.error('Failed to fetch auto-booking config:', error);
      toast.error('Kunde inte hämta inställningar');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        bokadirektAutoBookingMode: mode,
        autoBookingMaxDaysAhead: maxDaysAhead,
        autoBookingNotifyEmail: mode === BokadirektAutoBookingMode.NOTIFY ? notifyEmail : null,
      };

      const response = await fetch('/api/bokadirekt/auto-booking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success('Inställningar sparade!');
      fetchConfig(); // Refresh
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Kunde inte spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Laddar...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config?.bokadirektEnabled) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Bokadirekt Integration Inaktiv</p>
              <p className="text-sm text-amber-700 mt-1">
                Aktivera Bokadirekt-integration först för att använda auto-booking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Bokadirekt Auto-Booking
        </CardTitle>
        <CardDescription>
          Automatisera bokningar från Bokadirekt med tre lägen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="space-y-3">
          <Label>Bokningsläge</Label>
          <RadioGroup value={mode} onValueChange={(val) => setMode(val as BokadirektAutoBookingMode)}>
            {/* OFF Mode */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors">
              <RadioGroupItem value={BokadirektAutoBookingMode.OFF} id="mode-off" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="mode-off" className="cursor-pointer font-semibold flex items-center gap-2">
                  <Badge variant="outline">AV</Badge>
                  Manuell Bokning
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Ingen automatisk hantering. Du hanterar alla bokningar manuellt.
                </p>
              </div>
            </div>

            {/* NOTIFY Mode */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors">
              <RadioGroupItem value={BokadirektAutoBookingMode.NOTIFY} id="mode-notify" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="mode-notify" className="cursor-pointer font-semibold flex items-center gap-2">
                  <Badge variant="secondary">
                    <Bell className="h-3 w-3 mr-1" />
                    NOTIFIERING
                  </Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Få e-post när nya bokningsbara tider blir tillgängliga. Du väljer sedan manuellt om du vill boka.
                </p>
              </div>
            </div>

            {/* AUTO Mode */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors">
              <RadioGroupItem value={BokadirektAutoBookingMode.AUTO} id="mode-auto" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="mode-auto" className="cursor-pointer font-semibold flex items-center gap-2">
                  <Badge>
                    <Zap className="h-3 w-3 mr-1" />
                    AUTOMATISK
                  </Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Bokar automatiskt lediga tider baserat på dina preferenser. Snabbast och mest effektivt!
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* NOTIFY Mode - Email Input */}
        {mode === BokadirektAutoBookingMode.NOTIFY && (
          <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label htmlFor="notify-email">Notifieringsemail *</Label>
            <Input
              id="notify-email"
              type="email"
              placeholder="din@email.se"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
            />
            <p className="text-xs text-blue-700">
              Vi skickar ett mail hit när nya bokningsbara tider blir tillgängliga.
            </p>
          </div>
        )}

        {/* AUTO Mode - Preferences */}
        {mode === BokadirektAutoBookingMode.AUTO && (
          <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="max-days">Max antal dagar framåt</Label>
              <Input
                id="max-days"
                type="number"
                min={1}
                max={90}
                value={maxDaysAhead}
                onChange={(e) => setMaxDaysAhead(parseInt(e.target.value) || 14)}
              />
              <p className="text-xs text-green-700">
                Vi bokar bara tider inom de närmaste {maxDaysAhead} dagarna.
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-green-100 border border-green-300 rounded">
              <Zap className="h-4 w-4 text-green-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-800">
                <strong>Observera:</strong> Automatisk bokning kommer att köras var 15:e minut och boka första tillgängliga tiden.
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={
            saving ||
            (mode === BokadirektAutoBookingMode.NOTIFY && !notifyEmail)
          }
          className="w-full"
        >
          {saving ? 'Sparar...' : 'Spara Inställningar'}
        </Button>
      </CardContent>
    </Card>
  );
}
