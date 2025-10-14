
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import KioskStampDisplay from '@/components/kiosk-stamp-display';
import PinExitModal from '@/components/pin-exit-modal';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function KioskPage() {
  const params = useParams();
  const programId = params?.programId as string;
  const [showPinModal, setShowPinModal] = useState(false);
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (programId) {
      fetchProgram();
    }
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/payatt/programs/${programId}`);
      if (res.ok) {
        const data = await res.json();
        setProgram(data);
      }
    } catch (error) {
      console.error('Failed to fetch program:', error);
    } finally {
      setLoading(false);
    }
  };

  // Secret corner for exiting (top-right corner triple-click)
  const handleExitClick = () => {
    setShowPinModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Program hittades inte</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <KioskStampDisplay program={program} />
      
      {/* Secret Exit Button - Top Right Corner */}
      <button
        onClick={handleExitClick}
        className="fixed top-4 right-4 opacity-0 hover:opacity-20 transition-opacity w-16 h-16 z-50"
        aria-label="Exit Kiosk Mode"
      >
        <Settings className="w-8 h-8 text-gray-400" />
      </button>

      <PinExitModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
      />
    </>
  );
}
