'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  QrCode,
  Loader2,
  Check,
  X,
  Stamp,
  Star,
  Gift,
  ChevronRight,
  User,
  Sparkles,
} from 'lucide-react';

interface ScanResult {
  success: boolean;
  message: string;
  stampsAdded?: number;
  pointsAdded?: number;
  tierUpgraded?: boolean;
  newLevel?: string;
  card?: {
    stamps: number;
    points: number;
    level: string;
    customer?: {
      name?: string;
      firstName?: string;
      lastName?: string;
    };
    program?: {
      name: string;
    };
  };
  availableRewards?: { id: string; name: string; requiredStamps?: number }[];
}

interface RecentScan {
  id: string;
  customerName: string;
  programName: string;
  stampsAdded: number;
  pointsAdded: number;
  timestamp: Date;
  tierUpgraded: boolean;
}

export default function ScanPage() {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const levelLabel = (level: string) => {
    const labels: Record<string, string> = {
      bronze: 'Brons',
      silver: 'Silver',
      gold: 'Guld',
      platinum: 'Platina',
    };
    return labels[level] ?? level;
  };

  const levelColor = (level: string) => {
    const colors: Record<string, string> = {
      bronze: 'border-orange-700 text-orange-400',
      silver: 'border-zinc-500 text-zinc-300',
      gold: 'border-yellow-600 text-yellow-400',
      platinum: 'border-cyan-600 text-cyan-400',
    };
    return colors[level] ?? 'border-zinc-700 text-zinc-400';
  };

  const handleScan = async (codeOverride?: string) => {
    const code = codeOverride ?? qrCode.trim();
    if (!code) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/loyalty/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: code }),
      });

      const data = await res.json();
      setResult(data);

      if (data.success && data.card) {
        const customerName =
          data.card.customer?.name ??
          [data.card.customer?.firstName, data.card.customer?.lastName]
            .filter(Boolean)
            .join(' ') ??
          'Okänd kund';

        setRecentScans((prev) => [
          {
            id: Date.now().toString(),
            customerName,
            programName: data.card.program?.name ?? '',
            stampsAdded: data.stampsAdded ?? 0,
            pointsAdded: data.pointsAdded ?? 0,
            timestamp: new Date(),
            tierUpgraded: data.tierUpgraded ?? false,
          },
          ...prev.slice(0, 9),
        ]);

        // Clear input för nästa skanning
        setQrCode('');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch {
      setResult({ success: false, message: 'Nätverksfel – försök igen' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const resetResult = () => {
    setResult(null);
    setQrCode('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/loyalty">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Skanna kundkort</h1>
          <p className="text-sm text-zinc-400">Scanna QR-koden från kundens wallet</p>
        </div>
      </div>

      {/* Skanningsvy */}
      {!result ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            {/* Kamera-platshållare */}
            <div className="w-full aspect-square max-w-xs mx-auto mb-6 rounded-2xl bg-zinc-800 border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center gap-3">
              <QrCode className="h-16 w-16 text-zinc-500" />
              <p className="text-sm text-zinc-500 text-center px-4">
                Kamera-skanning (kommande)
              </p>
              <p className="text-xs text-zinc-600 text-center px-6">
                Ange QR-koden manuellt nedan
              </p>
            </div>

            {/* Manuell inmatning */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-300 text-center">
                Ange QR-kod manuellt
              </p>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="KF-XXXXXXXXXXXXXXXX"
                  className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[52px] font-mono text-center text-lg tracking-wider"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              <Button
                onClick={() => handleScan()}
                disabled={!qrCode.trim() || loading}
                className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white text-base font-medium"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Stamp className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Skannar...' : 'Lägg till stämpel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Resultat-vy */
        <Card
          className={`border-2 ${
            result.success
              ? 'bg-emerald-950/20 border-emerald-800'
              : 'bg-red-950/20 border-red-900'
          }`}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              {/* Status-ikon */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  result.success ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}
              >
                {result.success ? (
                  <Check className="h-8 w-8 text-emerald-400" />
                ) : (
                  <X className="h-8 w-8 text-red-400" />
                )}
              </div>

              {/* Tier-uppgradering */}
              {result.tierUpgraded && result.newLevel && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-600/50">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-300 font-medium text-sm">
                    Uppgraderad till {levelLabel(result.newLevel)}!
                  </span>
                </div>
              )}

              {/* Meddelande */}
              <p
                className={`text-lg font-semibold text-center ${
                  result.success ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {result.message}
              </p>

              {/* Kundinfo */}
              {result.card && (
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50">
                    <User className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-zinc-100">
                        {result.card.customer?.name ??
                          [
                            result.card.customer?.firstName,
                            result.card.customer?.lastName,
                          ]
                            .filter(Boolean)
                            .join(' ') ??
                          'Okänd kund'}
                      </p>
                      {result.card.program?.name && (
                        <p className="text-xs text-zinc-400">{result.card.program.name}</p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`${levelColor(result.card.level)} flex-shrink-0`}
                    >
                      {levelLabel(result.card.level)}
                    </Badge>
                  </div>

                  {/* Stämplar/poäng */}
                  <div className="grid grid-cols-2 gap-3">
                    {result.stampsAdded !== undefined && result.stampsAdded > 0 && (
                      <div className="p-3 rounded-lg bg-zinc-800/50 text-center">
                        <Stamp className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-zinc-100">{result.card.stamps}</p>
                        <p className="text-xs text-zinc-400">
                          stämplar
                          <span className="text-emerald-400 ml-1">
                            (+{result.stampsAdded})
                          </span>
                        </p>
                      </div>
                    )}
                    {result.pointsAdded !== undefined && result.pointsAdded > 0 && (
                      <div className="p-3 rounded-lg bg-zinc-800/50 text-center">
                        <Star className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-zinc-100">{result.card.points}</p>
                        <p className="text-xs text-zinc-400">
                          poäng
                          <span className="text-yellow-400 ml-1">
                            (+{result.pointsAdded})
                          </span>
                        </p>
                      </div>
                    )}
                    {result.stampsAdded === 0 && result.pointsAdded === 0 && (
                      <div className="col-span-2 p-3 rounded-lg bg-zinc-800/50 text-center">
                        <Stamp className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-zinc-100">{result.card.stamps}</p>
                        <p className="text-xs text-zinc-400">totala stämplar</p>
                      </div>
                    )}
                  </div>

                  {/* Tillgängliga belöningar */}
                  {result.availableRewards && result.availableRewards.length > 0 && (
                    <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">
                          Belöningar tillgängliga!
                        </span>
                      </div>
                      <div className="space-y-1">
                        {result.availableRewards.map((r) => (
                          <p key={r.id} className="text-xs text-purple-400 flex items-center gap-1">
                            <ChevronRight className="h-3 w-3" />
                            {r.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Knappar */}
              <div className="flex gap-3 w-full mt-2">
                <Button
                  onClick={resetResult}
                  className="flex-1 min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  Skanna nästa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Senaste skanningar */}
      {recentScans.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Senaste skanningar
          </h2>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center gap-3 p-3">
                    <div className="flex-shrink-0">
                      {scan.tierUpgraded ? (
                        <Sparkles className="h-4 w-4 text-yellow-400" />
                      ) : scan.stampsAdded > 0 ? (
                        <Stamp className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Star className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{scan.customerName}</p>
                      <p className="text-xs text-zinc-500 truncate">{scan.programName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {scan.stampsAdded > 0 && (
                        <p className="text-xs text-emerald-400 font-medium">
                          +{scan.stampsAdded} stämpel
                        </p>
                      )}
                      {scan.pointsAdded > 0 && (
                        <p className="text-xs text-yellow-400 font-medium">
                          +{scan.pointsAdded} poäng
                        </p>
                      )}
                      <p className="text-xs text-zinc-600">
                        {scan.timestamp.toLocaleTimeString('sv-SE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
