import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  demoClinic: {
    id: string;
    name: string;
    type: string;
  };
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Demo clinic data
  const demoClinic = {
    id: 'demo-clinic-1',
    name: 'ArchClinic Demo',
    type: 'Skönhetsklinik'
  };

  // Check URL parameter and localStorage on mount
  useEffect(() => {
    const urlDemo = searchParams.get('demo') === 'true';
    const localDemo = localStorage.getItem('demo_mode') === 'true';
    
    if (urlDemo || localDemo) {
      setIsDemoMode(true);
      localStorage.setItem('demo_mode', 'true');
      
      // Add demo parameter to URL if not already there
      if (!urlDemo) {
        searchParams.set('demo', 'true');
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, setSearchParams]);

  const toggleDemoMode = () => {
    const newDemoMode = !isDemoMode;
    setIsDemoMode(newDemoMode);
    localStorage.setItem('demo_mode', newDemoMode.toString());
    
    if (newDemoMode) {
      searchParams.set('demo', 'true');
    } else {
      searchParams.delete('demo');
    }
    setSearchParams(searchParams);
    
    console.log(`[DemoMode] ${newDemoMode ? 'Activated' : 'Deactivated'} demo mode`);
  };

  const value = {
    isDemoMode,
    toggleDemoMode,
    demoClinic
  };

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
};