'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CreditCard,
  Star,
  Gift,
  QrCode,
  Plus,
  TrendingUp,
  TrendingDown,
  Stamp,
  Activity,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface Stats {
  totalActiveCards: number;
  totalPrograms: number;
  stampsTodayCount: number;
  redemptionsThisMonth: number;
  redemptionGrowth: number;
  levelDistribution: { level: string; count: number }[];
}

interface Program {
  id: string;
  name: string;
  isActive: boolean;
  isDraft: boolean;
  memberCount: number;
  backgroundColor?: string;
}

interface Activity {
  id: string;
  type: string;
  stamps: number;
  points: number;
  description: string;
  createdAt: string;
  customerName: string;
}

export default function LoyaltyDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, programsRes] = await Promise.all([
          fetch('/api/loyalty/stats'),
          fetch('/api/loyalty/programs'),
        ]);

        if (!statsRes.ok || !programsRes.ok) {
          throw new Error('Kunde inte hämta data');
        }

        const statsData = await statsRes.json();
        const programsData = await programsRes.json();

        setStats(statsData.stats);
        setPrograms(statsData.topPrograms ?? []);
        setActivity(statsData.recentActivity ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Något gick fel');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
      bronze: 'text-orange-400 bg-orange-400/10',
      silver: 'text-zinc-300 bg-zinc-400/10',
      gold: 'text-yellow-400 bg-yellow-400/10',
      platinum: 'text-cyan-400 bg-cyan-400/10',
    };
    return colors[level] ?? 'text-zinc-400 bg-zinc-400/10';
  };

  const activityIcon = (type: string) => {
    if (type === 'stamp_earned') return <Stamp className="h-4 w-4 text-emerald-400" />;
    if (type === 'points_earned') return <Star className="h-4 w-4 text-yellow-400" />;
    if (type === 'reward_redeemed') return <Gift className="h-4 w-4 text-purple-400" />;
    return <Activity className="h-4 w-4 text-zinc-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-950/30 border border-red-900/50 p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Lojalitetsprogram</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Hantera stämpelkort, poäng och belöningar</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/loyalty/scan">
            <Button
              variant="outline"
              className="min-h-[44px] border-zinc-700 hover:bg-zinc-800"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Skanna QR
            </Button>
          </Link>
          <Link href="/dashboard/loyalty/programs/new">
            <Button className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nytt program
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI-kort */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Aktiva kort</p>
                <p className="text-2xl font-bold text-zinc-100 mt-1">
                  {stats?.totalActiveCards ?? 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CreditCard className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Stämplar idag</p>
                <p className="text-2xl font-bold text-zinc-100 mt-1">
                  {stats?.stampsTodayCount ?? 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Stamp className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Inlösningar/mån</p>
                <p className="text-2xl font-bold text-zinc-100 mt-1">
                  {stats?.redemptionsThisMonth ?? 0}
                </p>
                {stats && stats.redemptionGrowth !== 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {stats.redemptionGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    )}
                    <span
                      className={`text-xs ${
                        stats.redemptionGrowth > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {Math.abs(stats.redemptionGrowth)}% vs förra mån
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Gift className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Program</p>
                <p className="text-2xl font-bold text-zinc-100 mt-1">
                  {stats?.totalPrograms ?? 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program-lista */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100">Aktiva program</h2>
            <Link href="/dashboard/loyalty/programs/new">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 min-h-[36px]">
                Skapa nytt
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {programs.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">Inga program skapade ännu</p>
                <Link href="/dashboard/loyalty/programs/new">
                  <Button className="mt-4 min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Skapa ditt första program
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {programs.map((program) => (
                <Card key={program.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: program.backgroundColor ?? '#4f46e5' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-100 truncate">{program.name}</span>
                          {program.isDraft ? (
                            <Badge variant="outline" className="text-xs border-yellow-700 text-yellow-400 flex-shrink-0">
                              Utkast
                            </Badge>
                          ) : program.isActive ? (
                            <Badge variant="outline" className="text-xs border-emerald-700 text-emerald-400 flex-shrink-0">
                              Aktiv
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500 flex-shrink-0">
                              Inaktiv
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          <Users className="h-3 w-3 inline mr-1" />
                          {program.memberCount} medlemmar
                        </p>
                      </div>
                      <Link href={`/dashboard/loyalty/members?programId=${program.id}`}>
                        <Button variant="ghost" size="sm" className="min-h-[36px] text-zinc-400 hover:text-zinc-100">
                          Visa
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Nivåfördelning */}
          {stats?.levelDistribution && stats.levelDistribution.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-zinc-300">Nivåfördelning</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex gap-3 flex-wrap">
                  {stats.levelDistribution.map(({ level, count }) => (
                    <div
                      key={level}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${levelColor(level)}`}
                    >
                      <span className="font-medium">{levelLabel(level)}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Senaste aktivitet */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100">Senaste aktivitet</h2>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              {activity.length === 0 ? (
                <div className="p-6 text-center">
                  <Activity className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">Ingen aktivitet ännu</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {activityIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{item.customerName}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{item.description}</p>
                      </div>
                      <span className="text-xs text-zinc-600 flex-shrink-0">
                        {new Date(item.createdAt).toLocaleDateString('sv-SE', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Snabblänkar */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-zinc-300">Snabbåtgärder</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Link href="/dashboard/loyalty/scan" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start min-h-[44px] border-zinc-700 hover:bg-zinc-800"
                >
                  <QrCode className="h-4 w-4 mr-3 text-zinc-400" />
                  Skanna kundkort
                </Button>
              </Link>
              <Link href="/dashboard/loyalty/members" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start min-h-[44px] border-zinc-700 hover:bg-zinc-800"
                >
                  <Users className="h-4 w-4 mr-3 text-zinc-400" />
                  Se alla medlemmar
                </Button>
              </Link>
              <Link href="/dashboard/loyalty/programs/new" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start min-h-[44px] border-zinc-700 hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4 mr-3 text-zinc-400" />
                  Skapa program
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
