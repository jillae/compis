
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PinExitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PinExitModal({ isOpen, onClose }: PinExitModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  // Default PIN - should be configurable in production
  const DEFAULT_PIN = '1234';
  const MAX_ATTEMPTS = 5;

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (attempts >= MAX_ATTEMPTS) {
      setError('För många felaktiga försök. Kontakta administratör.');
      return;
    }

    if (pin === DEFAULT_PIN) {
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      
      // Clear kiosk mode
      localStorage.removeItem('kioskMode');
      
      // Redirect to admin
      router.push('/billing');
    } else {
      setAttempts(prev => prev + 1);
      setError(`Fel PIN-kod. Försök ${MAX_ATTEMPTS - attempts - 1} kvar.`);
      setPin('');
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Lämna Kiosk-läge
          </DialogTitle>
          <DialogDescription>
            Ange PIN-kod för att lämna kiosk-läget och återgå till admin-panelen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">PIN-kod (4 siffror)</label>
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              placeholder="••••"
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {attempts >= MAX_ATTEMPTS && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Maximalt antal försök uppnått. Vänligen kontakta systemadministratör för att återställa PIN-koden.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={pin.length !== 4 || attempts >= MAX_ATTEMPTS}
            >
              Lämna Kiosk-läge
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Standard PIN: 1234 (ska ändras i produktionsmiljö)
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
