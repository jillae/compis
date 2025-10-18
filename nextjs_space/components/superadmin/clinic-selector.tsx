
'use client';

import { useEffect, useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
  tier: string;
  status: string;
}

export function ClinicSelector() {
  const { selectedClinic, selectClinic } = useClinic();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const response = await fetch('/api/superadmin/clinics');
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      }
    } catch (error) {
      console.error('Failed to fetch clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedClinic || 'none'}
        onValueChange={(value) => selectClinic(value === 'none' ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select clinic..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="font-semibold">SuperAdmin View</span>
          </SelectItem>
          {clinics.map((clinic) => (
            <SelectItem key={clinic.id} value={clinic.id}>
              {clinic.name}
              <span className="ml-2 text-xs text-muted-foreground">({clinic.tier})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
