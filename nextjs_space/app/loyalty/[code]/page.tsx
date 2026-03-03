'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Stamp, Star, Gift, Check, QrCode, CreditCard } from 'lucide-react';

interface CardInfo {
  id: string;
  stamps: number;
  points: number;
  level: string;
  lastEarnedAt?: string;
}

interface ProgramInfo {
  id: string;
  name: string;
  description?: string;
  backgroundColor?: string;
  logoUrl?: string;
  earnRule: Record<string, unknown>;
  redeemRule: Record<string, unknown>;
  tierRules?: Record<string, number>;
  clinic: {
    name: string;
  };
}

type PageState = 'loading' | 'card' | 'signup' | 'success' | 'error';

export default function LoyaltyPublicPage() {
  const params = useParams();
  const code = params.code as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [programInfo, setProgramInfo] = useState<ProgramInfo | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Signup form
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupResult, setSignupResult] = useState<{
    qrCode: string;
    passUrl: string;
    programName: string;
    clinicName: string;
    card: CardInfo;
  } | null>(null);

  useEffect(() => {
    if (!code) {
      setPageState('error');
      setErrorMsg('Ogiltig länk');
      return;
    }

    // Check if it's a QR code (starts with KF-) or a program code
    if (code.startsWith('KF-')) {
      // Fetch card info
      fetch(`/api/loyalty/public?qrCode=${encodeURIComponent(code)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCardInfo(data.card);
            setProgramInfo(data.program);
            setCustomerName(data.customerName);
            setPageState('card');
          } else {
            setErrorMsg(data.error ?? 'Kortet hittades inte');
            setPageState('error');
          }
        })
        .catch(() => {
          setErrorMsg('Nätverksfel – kontrollera din internetanslutning');
          setPageState('error');
        });
    } else {
      // It's a program code – show signup
      setPageState('signup');
    }
  }, [code]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) return;

    setSignupLoading(true);
    try {
      const res = await fetch('/api/loyalty/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          programCode: code,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSignupResult(data);
        setPageState('success');
      } else {
        setErrorMsg(data.error ?? 'Registrering misslyckades');
      }
    } catch {
      setErrorMsg('Nätverksfel');
    } finally {
      setSignupLoading(false);
    }
  };

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
      bronze: 'text-orange-400',
      silver: 'text-zinc-300',
      gold: 'text-yellow-400',
      platinum: 'text-cyan-400',
    };
    return colors[level] ?? 'text-zinc-400';
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-400 mx-auto" />
          <p className="text-zinc-400 text-sm">Hämtar ditt lojalitetskort...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
            <QrCode className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Ogiltigt kort</h1>
          <p className="text-zinc-400 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // ── Card view ─────────────────────────────────────────────────────────────
  if (pageState === 'card' && cardInfo && programInfo) {
    const bgColor = programInfo.backgroundColor ?? '#4f46e5';
    const stampGoal = 10; // Default goal

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Clinic branding */}
          <div className="text-center">
            <p className="text-zinc-400 text-sm">{programInfo.clinic.name}</p>
          </div>

          {/* Loyalty Card */}
          <div
            className="rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: bgColor }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">
                  Lojalitetskort
                </p>
                <h2 className="text-white font-bold text-lg">{programInfo.name}</h2>
              </div>
              <div
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                <span className={levelColor(cardInfo.level)}>
                  {levelLabel(cardInfo.level)}
                </span>
              </div>
            </div>

            {/* Stämplar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/70 text-xs">Stämplar</p>
                <p className="text-white text-xs font-medium">
                  {cardInfo.stamps} / {stampGoal}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.from({ length: stampGoal }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full border-2 border-white/40 flex items-center justify-center transition-all ${
                      i < cardInfo.stamps ? 'bg-white' : 'bg-white/10'
                    }`}
                  >
                    {i < cardInfo.stamps && (
                      <Check className="h-3.5 w-3.5 text-current" style={{ color: bgColor }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Poäng (om applicerbart) */}
            {cardInfo.points > 0 && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-300" />
                <span className="text-white text-sm font-medium">
                  {cardInfo.points} poäng
                </span>
              </div>
            )}

            {/* Customer name */}
            {customerName && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-white/70 text-xs">Kortinnehavare</p>
                <p className="text-white font-medium">{customerName}</p>
              </div>
            )}
          </div>

          {/* QR-kod sektion */}
          <div className="bg-zinc-900 rounded-2xl p-5 text-center border border-zinc-800">
            <QrCode className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-300 text-sm font-medium mb-1">Din QR-kod</p>
            <p className="font-mono text-xs text-zinc-500 break-all">{code}</p>
            <p className="text-zinc-500 text-xs mt-3">
              Visa den här sidan för personalen vid ditt nästa besök
            </p>
          </div>

          {/* Belöningar/progression */}
          {programInfo.description && (
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <p className="text-zinc-300 text-sm">{programInfo.description}</p>
            </div>
          )}

          {/* Senaste besök */}
          {cardInfo.lastEarnedAt && (
            <p className="text-center text-xs text-zinc-600">
              Senaste besök:{' '}
              {new Date(cardInfo.lastEarnedAt).toLocaleDateString('sv-SE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Signup ────────────────────────────────────────────────────────────────
  if (pageState === 'signup') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto">
              <CreditCard className="h-8 w-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Gå med i lojalitetsprogrammet</h1>
            <p className="text-zinc-400 text-sm">
              Ange din e-post eller ditt telefonnummer för att skapa ditt lojalitetskort
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-300 block">E-postadress</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.se"
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-500 placeholder:text-zinc-600 min-h-[52px]"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600">ELLER</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-300 block">Telefonnummer</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+46 70 123 45 67"
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-500 placeholder:text-zinc-600 min-h-[52px]"
              />
            </div>

            <button
              type="submit"
              disabled={(!email.trim() && !phone.trim()) || signupLoading}
              className="w-full min-h-[54px] rounded-xl font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#4f46e5', color: 'white' }}
            >
              {signupLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Skapar kort...
                </span>
              ) : (
                'Skapa mitt lojalitetskort'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-600">
            Dina uppgifter används enbart för att identifiera dig i lojalitetsprogrammet
          </p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (pageState === 'success' && signupResult) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-100">
              Välkommen till {signupResult.programName}!
            </h1>
            <p className="text-zinc-400 text-sm">
              {signupResult.clinicName} har skapat ditt lojalitetskort
            </p>
          </div>

          {/* QR-kod */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <QrCode className="h-14 w-14 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-300 text-sm font-medium mb-2">Din QR-kod</p>
            <p className="font-mono text-sm text-zinc-400 break-all bg-zinc-800 rounded-lg px-3 py-2">
              {signupResult.qrCode}
            </p>
          </div>

          {/* Stämplar */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Stamp className="h-5 w-5 text-emerald-400" />
              <span className="text-zinc-100 font-semibold">
                {signupResult.card.stamps} stämplar
              </span>
            </div>
            {signupResult.card.points > 0 && (
              <div className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-zinc-100 font-semibold">
                  {signupResult.card.points} poäng
                </span>
              </div>
            )}
          </div>

          <p className="text-zinc-500 text-xs">
            Spara den här sidan som bokmärke eller lägg till i din wallet för snabb åtkomst
          </p>

          <a
            href={signupResult.passUrl}
            className="block w-full min-h-[54px] rounded-xl font-semibold text-base flex items-center justify-center gap-2"
            style={{ backgroundColor: '#059669', color: 'white' }}
          >
            <CreditCard className="h-5 w-5" />
            Visa mitt kort
          </a>
        </div>
      </div>
    );
  }

  return null;
}
