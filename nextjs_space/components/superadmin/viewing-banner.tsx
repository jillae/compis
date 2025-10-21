
'use client';

import { useClinic } from '@/context/ClinicContext';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Eye, X, Building2 } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
  tier: string;
}

export function ViewingBanner() {
  const { selectedClinic, clearClinicView } = useClinic();
  const [clinic, setClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    if (selectedClinic) {
      fetchClinic(selectedClinic);
    } else {
      setClinic(null);
    }
  }, [selectedClinic]);

  const fetchClinic = async (clinicId: string) => {
    try {
      const response = await fetch(`/api/superadmin/clinics/${clinicId}`);
      if (response.ok) {
        const data = await response.json();
        setClinic(data);
      }
    } catch (error) {
      console.error('Failed to fetch clinic:', error);
    }
  };

  if (!clinic) return null;

  return (
    <Alert className="border-purple-600 bg-purple-50 mb-4">
      <Eye className="h-4 w-4 text-purple-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-purple-600" />
          <span className="font-semibold text-purple-900">
            Visar som: {clinic.name}
          </span>
          <span className="text-xs px-2 py-1 bg-purple-200 text-purple-700 rounded">
            {clinic.tier}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearClinicView}
          className="gap-2 border-purple-300 hover:bg-purple-100"
        >
          <X className="h-3 w-3" />
          Avsluta klinikvy
        </Button>
      </AlertDescription>
    </Alert>
  );
}
