'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Users,
  Stamp,
  Star,
  QrCode,
  ChevronRight,
  Loader2,
  Filter,
  CreditCard,
} from 'lucide-react';

interface LoyaltyCard {
  id: string;
  stamps: number;
  points: number;
  level: string;
  lastEarnedAt?: string;
  createdAt: string;
  customer: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  program: {
    id: string;
    name: string;
    backgroundColor?: string;
  };
  walletPasses: {
    id: string;
    passType: string;
    qrCode: string;
  }[];
}

interface Program {
  id: string;
  name: string;
}

function MembersContent() {
  const searchParams = useSearchParams();
  const initialProgramId = searchParams.get('programId') ?? '';

  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(initialProgramId);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        page: String(pagination.page),
        ...(search ? { search } : {}),
        ...(selectedProgram ? { programId: selectedProgram } : {}),
        ...(selectedLevel ? { level: selectedLevel } : {}),
      });

      const res = await fetch(`/api/loyalty/cards?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      setCards(data.cards ?? []);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search, selectedProgram, selectedLevel, pagination.page]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    async function loadPrograms() {
      try {
        const res = await fetch('/api/loyalty/programs');
        if (!res.ok) return;
        const data = await res.json();
        setPrograms(data.programs ?? []);
      } catch {/* ignore */}
    }
    loadPrograms();
  }, []);

  const customerName = (card: LoyaltyCard) =>
    card.customer.name ??
    [card.customer.firstName, card.customer.lastName].filter(Boolean).join(' ') ??
    'Okänd kund';

  const levelLabel = (level: string) => {
    const labels: Record<string, string> = {
      bronze: 'Brons', silver: 'Silver', gold: 'Guld', platinum: 'Platina',
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

  const LEVELS = [
    { value: '', label: 'Alla nivåer' },
    { value: 'bronze', label: 'Brons' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Guld' },
    { value: 'platinum', label: 'Platina' },
  ];

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
          <h1 className="text-xl font-bold text-zinc-100">Lojalitetsmedlemmar</h1>
          <p className="text-sm text-zinc-400">
            {pagination.total} aktiva kort
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Sök på namn, e-post eller telefon..."
            className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 min-h-[44px]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Program-filter */}
          <select
            value={selectedProgram}
            onChange={(e) => {
              setSelectedProgram(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="flex-shrink-0 text-sm bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 min-h-[36px] outline-none focus:border-zinc-500"
          >
            <option value="">Alla program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Nivå-filter */}
          <div className="flex gap-1.5 flex-shrink-0">
            {LEVELS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  setSelectedLevel(value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap min-h-[36px] ${
                  selectedLevel === value
                    ? 'bg-emerald-700 text-white'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kortlista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : cards.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-10 text-center">
            <Users className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">Inga medlemmar hittades</p>
            {(search || selectedProgram || selectedLevel) && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-zinc-500 hover:text-zinc-300 min-h-[40px]"
                onClick={() => {
                  setSearch('');
                  setSelectedProgram('');
                  setSelectedLevel('');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Rensa filter
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobilvy: kort-layout */}
          <div className="space-y-2 md:hidden">
            {cards.map((card) => (
              <Card
                key={card.id}
                className="bg-zinc-900 border-zinc-800 active:bg-zinc-800 cursor-pointer"
                onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: card.program.backgroundColor ?? '#4f46e5' }}
                    >
                      <CreditCard className="h-5 w-5 text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-100 text-sm truncate">
                          {customerName(card)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs flex-shrink-0 ${levelColor(card.level)}`}
                        >
                          {levelLabel(card.level)}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">{card.program.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Stamp className="h-3 w-3 text-emerald-400" />
                        <span className="text-sm font-bold text-zinc-100">{card.stamps}</span>
                      </div>
                      {card.points > 0 && (
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <Star className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs text-zinc-400">{card.points}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanderat innehåll */}
                  {selectedCard?.id === card.id && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-zinc-500">E-post</p>
                          <p className="text-xs text-zinc-300 truncate">
                            {card.customer.email ?? '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Telefon</p>
                          <p className="text-xs text-zinc-300">{card.customer.phone ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Senaste besök</p>
                          <p className="text-xs text-zinc-300">
                            {card.lastEarnedAt
                              ? new Date(card.lastEarnedAt).toLocaleDateString('sv-SE')
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Wallet-pass</p>
                          <p className="text-xs text-zinc-300">
                            {card.walletPasses.length > 0
                              ? `${card.walletPasses.length} st`
                              : 'Ingen'}
                          </p>
                        </div>
                      </div>

                      {card.walletPasses.length > 0 && (
                        <div className="p-2 rounded-lg bg-zinc-800 space-y-1">
                          {card.walletPasses.map((wp) => (
                            <div key={wp.id} className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-zinc-500" />
                              <span className="font-mono text-xs text-zinc-400 flex-1 truncate">
                                {wp.qrCode}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs border-zinc-700 text-zinc-500"
                              >
                                {wp.passType}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktopvy: tabell */}
          <div className="hidden md:block">
            <Card className="bg-zinc-900 border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Kund
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Nivå
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Stämplar
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Poäng
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Senaste besök
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        QR
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {cards.map((card) => (
                      <tr
                        key={card.id}
                        className="hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-zinc-100">{customerName(card)}</p>
                            <p className="text-xs text-zinc-500">
                              {card.customer.email ?? card.customer.phone ?? ''}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: card.program.backgroundColor ?? '#4f46e5' }}
                            />
                            <span className="text-zinc-300 text-sm truncate max-w-[120px]">
                              {card.program.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${levelColor(card.level)}`}
                          >
                            {levelLabel(card.level)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Stamp className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="font-bold text-zinc-100">{card.stamps}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {card.points > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3.5 w-3.5 text-yellow-400" />
                              <span className="text-zinc-300">{card.points}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-sm">
                          {card.lastEarnedAt
                            ? new Date(card.lastEarnedAt).toLocaleDateString('sv-SE')
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {card.walletPasses.length > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <QrCode className="h-4 w-4 text-zinc-400" />
                              <span className="text-xs text-zinc-500 font-mono">
                                {card.walletPasses[0].qrCode.slice(0, 10)}…
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Paginering */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                className="min-h-[40px] border-zinc-700 hover:bg-zinc-800"
              >
                Föregående
              </Button>
              <span className="text-sm text-zinc-400">
                Sida {pagination.page} av {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                className="min-h-[40px] border-zinc-700 hover:bg-zinc-800"
              >
                Nästa
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <MembersContent />
    </Suspense>
  );
}
