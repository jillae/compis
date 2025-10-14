
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Smartphone, QrCode as QrCodeIcon } from 'lucide-react';

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

export default function StampDisplay() {
  const [mode, setMode] = useState<'phone' | 'qr'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StampResult | null>(null);

  // Auto-reset result after 5 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        setPhone('');
      }, 5000);
      
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
        body: JSON.stringify({ phone }),
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
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Registrera Stämpel
          </CardTitle>
          <CardDescription className="text-lg">
            Ange ditt mobilnummer för att få din stämpel
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <Button
              variant={mode === 'phone' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setMode('phone')}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobilnummer
            </Button>
            <Button
              variant={mode === 'qr' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setMode('qr')}
              disabled
            >
              <QrCodeIcon className="w-4 h-4 mr-2" />
              QR-kod (Kommer snart)
            </Button>
          </div>

          {/* Phone Input */}
          {mode === 'phone' && !result && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder="070-123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-2xl text-center h-16 font-mono"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-sm text-gray-500 text-center">
                  Formatera som: 070-XXX XX XX eller +46 70 XXX XX XX
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-16 text-xl"
                disabled={loading || !phone.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Registrerar...
                  </>
                ) : (
                  'Registrera Stämpel'
                )}
              </Button>
            </form>
          )}

          {/* Result Display */}
          {result && (
            <div className="text-center space-y-6 py-8">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-24 h-24 mx-auto text-green-500" />
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-green-700">
                      Grattis {result.customer?.name}! 🎉
                    </h3>
                    
                    {result.loyaltyCard?.isCompleted ? (
                      <div className="space-y-4">
                        <p className="text-xl text-gray-700">
                          Du har samlat alla stämplar!
                        </p>
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-lg">
                          <p className="text-2xl font-bold">
                            🏆 {result.loyaltyCard.rewardDescription}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Visa detta meddelande vid ditt nästa besök
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xl text-gray-700">
                          Stämpel registrerad!
                        </p>
                        <div className="bg-blue-100 p-6 rounded-lg">
                          <p className="text-4xl font-bold text-blue-700">
                            {result.loyaltyCard?.currentStamps} / {result.loyaltyCard?.stampsRequired}
                          </p>
                          <p className="text-lg text-gray-700 mt-2">
                            {(result.loyaltyCard?.stampsRequired || 0) - (result.loyaltyCard?.currentStamps || 0)} stämplar kvar till belöning
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-24 h-24 mx-auto text-red-500" />
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-red-700">
                      Hoppsan!
                    </h3>
                    <p className="text-xl text-gray-700">
                      {result.error}
                    </p>
                    <p className="text-sm text-gray-600">
                      Kontrollera att du angav rätt mobilnummer
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Info Section */}
          {!result && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 text-center">
                💡 <strong>Tips:</strong> Du får en SMS-bekräftelse när stämpeln registreras
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
