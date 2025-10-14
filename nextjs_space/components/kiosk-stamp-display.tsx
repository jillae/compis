
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Smartphone } from 'lucide-react';

interface StampResult {
  success: boolean;
  loyaltyCard?: {
    id: string;
    currentStamps: number;
    stampsRequired: number;
    isCompleted: boolean;
    rewardDescription?: string;
  };
  customer?: {
    name: string;
    phone: string;
  };
  error?: string;
}

interface KioskStampDisplayProps {
  program: {
    id: string;
    name: string;
    description?: string;
    stampsRequired: number;
    rewardDescription: string;
  };
}

export default function KioskStampDisplay({ program }: KioskStampDisplayProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StampResult | null>(null);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-reset after 30 seconds of inactivity
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    const timer = setTimeout(() => {
      setResult(null);
      setPhone('');
    }, 30000); // 30 seconds

    setInactivityTimer(timer);
  };

  // Reset timer on any interaction
  useEffect(() => {
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [phone, result]);

  // Auto-reset result after 8 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        setPhone('');
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/payatt/stamp/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone,
          programId: program.id 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          ...data,
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Kunde inte registrera stämpel',
        });
      }
    } catch (error) {
      console.error('Stamp registration error:', error);
      setResult({
        success: false,
        error: 'Ett fel uppstod',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <CardTitle className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {program.name}
          </CardTitle>
          {program.description && (
            <CardDescription className="text-xl">
              {program.description}
            </CardDescription>
          )}
          <div className="bg-blue-100 p-4 rounded-lg inline-block">
            <p className="text-2xl font-semibold text-blue-800">
              Samla {program.stampsRequired} stämplar → {program.rewardDescription}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Phone Input */}
          {!result && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-2xl font-semibold text-gray-700 block text-center">
                  Ange ditt mobilnummer
                </label>
                <Input
                  type="tel"
                  placeholder="070-123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-3xl text-center h-20 font-mono"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-lg text-gray-500 text-center">
                  Formatera som: 070-XXX XX XX eller +46 70 XXX XX XX
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-20 text-2xl"
                disabled={loading || !phone.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-8 h-8 mr-3 animate-spin" />
                    Registrerar...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-8 h-8 mr-3" />
                    Registrera Stämpel
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Result Display */}
          {result && (
            <div className="text-center space-y-8 py-12">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-32 h-32 mx-auto text-green-500" />
                  <div className="space-y-4">
                    <h3 className="text-4xl font-bold text-green-700">
                      Grattis {result.customer?.name}! 🎉
                    </h3>
                    
                    {result.loyaltyCard?.isCompleted ? (
                      <div className="space-y-6">
                        <p className="text-2xl text-gray-700">
                          Du har samlat alla stämplar!
                        </p>
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-8 rounded-lg">
                          <p className="text-3xl font-bold">
                            🏆 {result.loyaltyCard.rewardDescription}
                          </p>
                        </div>
                        <p className="text-xl text-gray-600">
                          Visa detta meddelande vid ditt nästa besök
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-2xl text-gray-700">
                          Stämpel registrerad!
                        </p>
                        <div className="bg-blue-100 p-8 rounded-lg">
                          <p className="text-6xl font-bold text-blue-700">
                            {result.loyaltyCard?.currentStamps} / {result.loyaltyCard?.stampsRequired}
                          </p>
                          <p className="text-2xl text-gray-700 mt-4">
                            {(result.loyaltyCard?.stampsRequired || 0) - (result.loyaltyCard?.currentStamps || 0)} stämplar kvar till belöning
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-32 h-32 mx-auto text-red-500" />
                  <div className="space-y-4">
                    <h3 className="text-4xl font-bold text-red-700">
                      Hoppsan!
                    </h3>
                    <p className="text-2xl text-gray-700">
                      {result.error}
                    </p>
                    <p className="text-lg text-gray-600">
                      Kontrollera att du angav rätt mobilnummer
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Info Section */}
          {!result && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <p className="text-lg text-blue-800 text-center">
                💡 <strong>Tips:</strong> Du får en SMS-bekräftelse när stämpeln registreras
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
