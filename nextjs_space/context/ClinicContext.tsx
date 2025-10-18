
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ClinicContextType {
  selectedClinic: string | null;
  selectClinic: (clinicId: string | null) => void;
  isViewingAsClinic: boolean;
  clearClinicView: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedClinicId');
      if (saved) {
        setSelectedClinic(saved);
      }
    }
  }, []);

  // Save to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedClinic) {
        localStorage.setItem('selectedClinicId', selectedClinic);
      } else {
        localStorage.removeItem('selectedClinicId');
      }
    }
  }, [selectedClinic]);

  const selectClinic = (clinicId: string | null) => {
    setSelectedClinic(clinicId);
  };

  const clearClinicView = () => {
    setSelectedClinic(null);
  };

  const isViewingAsClinic = selectedClinic !== null;

  return (
    <ClinicContext.Provider
      value={{
        selectedClinic,
        selectClinic,
        isViewingAsClinic,
        clearClinicView,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
