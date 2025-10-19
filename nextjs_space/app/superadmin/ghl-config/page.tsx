
'use client';

import { useEffect, useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { GHLConfigForm } from '@/components/superadmin/ghl-config-form';
import { GHLConnectionStatus } from '@/components/ghl/ghl-connection-status';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
}

export default function GHLConfigPage() {
  const { selectedClinic } = useClinic() || {};
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedClinic) {
      fetchClinicData();
    }
  }, [selectedClinic]);

  const fetchClinicData = async () => {
    if (!selectedClinic) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/clinics/${selectedClinic}`);
      if (res.ok) {
        const data = await res.json();
        setClinic(data);
      }
    } catch (error) {
      console.error('Failed to fetch clinic data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedClinic) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Välj en klinik från dropdown-menyn för att konfigurera GoHighLevel-integration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GoHighLevel Integration</h1>
        <p className="text-muted-foreground mt-2">
          Konfigurera och hantera GoHighLevel CRM-integration för {clinic?.name || 'vald klinik'}
        </p>
      </div>

      {/* Configuration Form */}
      <GHLConfigForm
        clinicId={selectedClinic}
        clinicName={clinic?.name || 'Okänd klinik'}
      />

      {/* Connection Status & Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Synkroniseringsstatus</h2>
        <GHLConnectionStatus />
      </div>

      {/* Documentation */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Dokumentation</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• API-dokumentation: <a href="https://highlevel.stoplight.io/docs/integrations" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GHL API Docs</a></li>
            <li>• Webhook-integration: Kommer snart</li>
            <li>• Support: Kontakta Flow team för hjälp</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
