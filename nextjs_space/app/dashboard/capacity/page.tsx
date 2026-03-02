'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyCapacity {
  date: string;
  dayOfWeek: string;
  totalCapacity: number;
  bookedCapacity: number;
  utilizationRate: number;
  availableSlots: number;
  optimalSlots: number;
  recommendation: string;
  status: 'UNDERUTILIZED' | 'OPTIMAL' | 'NEAR_FULL' | 'OVERBOOKED';
}

interface WeeklyCapacity {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalCapacity: number;
  bookedCapacity: number;
  utilizationRate: number;
  availableSlots: number;
  revenue: number;
  projectedRevenue: number;
  days: DailyCapacity[];
}

interface CapacityInsight {
  type: 'WARNING' | 'OPPORTUNITY' | 'INFO';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
}

interface ForecastData {
  weeks: WeeklyCapacity[];
  insights: CapacityInsight[];
  summary: {
    averageUtilization: number;
    peakUtilization: number;
    lowestUtilization: number;
    totalRevenue: number;
    potentialRevenue: number;
    capacityGap: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number): string {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M kr`;
  if (val >= 1000) return `${Math.round(val / 1000)}k kr`;
  return `${Math.round(val)} kr`;
}

function statusColor(status: string): string {
  switch (status) {
    case 'OVERBOOKED': return 'text-red-400';
    case 'NEAR_FULL': return 'text-amber-400';
    case 'OPTIMAL': return 'text-emerald-400';
    case 'UNDERUTILIZED': return 'text-blue-400';
    default: return 'text-zinc-400';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'OVERBOOKED': return 'bg-red-500/20 border-red-500/30';
    case 'NEAR_FULL': return 'bg-amber-500/20 border-amber-500/30';
    case 'OPTIMAL': return 'bg-emerald-500/20 border-emerald-500/30';
    case 'UNDERUTILIZED': return 'bg-blue-500/20 border-blue-500/30';
    default: return 'bg-zinc-500/20 border-zinc-500/30';
  }
}

function statusBarColor(status: string): string {
  switch (status) {
    case 'OVERBOOKED': return 'bg-red-500';
    case 'NEAR_FULL': return 'bg-amber-500';
    case 'OPTIMAL': return 'bg-emerald-500';
    case 'UNDERUTILIZED': return 'bg-blue-500';
    default: return 'bg-zinc-500';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'OVERBOOKED': return 'Överbokad';
    case 'NEAR_FULL': return 'Nästan fullt';
    case 'OPTIMAL': return 'Optimalt';
    case 'UNDERUTILIZED': return 'Underbelagd';
    default: return status;
  }
}

function statusEmoji(status: string): string {
  switch (status) {
    case 'OVERBOOKED': return '🔴';
    case 'NEAR_FULL': return '🟡';
    case 'OPTIMAL': return '🟢';
    case 'UNDERUTILIZED': return '🔵';
    default: return '⚪';
  }
}

function insightIcon(type: string): string {
  switch (type) {
    case 'WARNING': return '⚠️';
    case 'OPPORTUNITY': return '💡';
    case 'INFO': return 'ℹ️';
    default: return '📋';
  }
}

function insightBg(type: string): string {
  switch (type) {
    case 'WARNING': return 'bg-amber-500/10 border-amber-500/20';
    case 'OPPORTUNITY': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'INFO': return 'bg-blue-500/10 border-blue-500/20';
    default: return 'bg-zinc-800 border-zinc-700';
  }
}

function dayNameShort(dayOfWeek: string): string {
  const map: Record<string, string> = {
    'måndag': 'Mån', 'tisdag': 'Tis', 'onsdag': 'Ons',
    'torsdag': 'Tor', 'fredag': 'Fre', 'lördag': 'Lör', 'söndag': 'Sön',
    'Monday': 'Mån', 'Tuesday': 'Tis', 'Wednesday': 'Ons',
    'Thursday': 'Tor', 'Friday': 'Fre', 'Saturday': 'Lör', 'Sunday': 'Sön',
  };
  return map[dayOfWeek] || dayOfWeek.slice(0, 3);
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CapacityPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeksAhead, setWeeksAhead] = useState(4);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [authStatus, router]);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/capacity/forecast?weeks=${weeksAhead}`);
      if (!res.ok) throw new Error('Kunde inte ladda kapacitetsprognos');
      const data = await res.json();
      setForecast(data.data || null);
    } catch (err: any) {
      setError(err.message || 'Något gick fel');
    } finally {
      setLoading(false);
    }
  }, [weeksAhead]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchForecast();
    }
  }, [authStatus, fetchForecast]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Kapacitetsprognos</h1>
              <p className="text-xs text-zinc-500">{weeksAhead} veckor framåt</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Week selector */}
            <div className="flex bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              {[2, 4, 8].map(w => (
                <button
                  key={w}
                  onClick={() => { setWeeksAhead(w); setExpandedWeek(0); }}
                  className={`px-3 py-2 text-xs font-medium min-h-[44px] transition-all ${
                    weeksAhead === w ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {w}v
                </button>
              ))}
            </div>
            <button
              onClick={fetchForecast}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 12 12 12"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">

        {/* ─── Loading ─────────────────────────────────────────────────── */}
        {loading && !forecast && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 animate-pulse h-24" />
              ))}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 animate-pulse h-32" />
            ))}
          </div>
        )}

        {/* ─── Error ───────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
            <div className="text-red-400 text-sm">{error}</div>
            <button onClick={fetchForecast} className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-sm text-red-300">Försök igen</button>
          </div>
        )}

        {forecast && (
          <>
            {/* ─── Summary Cards ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Snittbeläggning</div>
                <div className="text-2xl font-bold">{Math.round(forecast.summary.averageUtilization)}%</div>
                <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      forecast.summary.averageUtilization >= 85 ? 'bg-amber-500' :
                      forecast.summary.averageUtilization >= 60 ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, forecast.summary.averageUtilization)}%` }}
                  />
                </div>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Toppbeläggning</div>
                <div className="text-2xl font-bold text-amber-400">{Math.round(forecast.summary.peakUtilization)}%</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Lägst: {Math.round(forecast.summary.lowestUtilization)}%
                </div>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Bokad intäkt</div>
                <div className="text-2xl font-bold">{formatCurrency(forecast.summary.totalRevenue)}</div>
                <div className="text-xs text-zinc-500 mt-1">av {formatCurrency(forecast.summary.potentialRevenue)} möjlig</div>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Outnyttjat gap</div>
                <div className="text-2xl font-bold text-blue-400">{Math.round(forecast.summary.capacityGap)}%</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {formatCurrency(forecast.summary.potentialRevenue - forecast.summary.totalRevenue)} möjlig extra
                </div>
              </div>
            </div>

            {/* ─── Week Overview — Visual Grid ─────────────────────────── */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Veckoöversikt</div>
              </div>

              {forecast.weeks.map((week, wi) => (
                <div key={wi} className="border-b border-zinc-800 last:border-0">
                  {/* Week header — clickable */}
                  <button
                    onClick={() => setExpandedWeek(expandedWeek === wi ? null : wi)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/50 active:bg-zinc-800 transition-all min-h-[56px]"
                  >
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{week.weekLabel}</div>
                      <div className="text-xs text-zinc-500">{formatDateShort(week.startDate)} — {formatDateShort(week.endDate)}</div>
                    </div>

                    {/* Mini day indicators */}
                    <div className="flex gap-1 mr-2">
                      {week.days.map((day, di) => (
                        <div
                          key={di}
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border ${statusBg(day.status)}`}
                          title={`${day.dayOfWeek}: ${Math.round(day.utilizationRate)}%`}
                        >
                          {dayNameShort(day.dayOfWeek)[0]}
                        </div>
                      ))}
                    </div>

                    {/* Utilization */}
                    <div className="text-right min-w-[70px]">
                      <div className={`text-sm font-bold ${
                        week.utilizationRate >= 85 ? 'text-amber-400' :
                        week.utilizationRate >= 60 ? 'text-emerald-400' : 'text-blue-400'
                      }`}>
                        {Math.round(week.utilizationRate)}%
                      </div>
                      <div className="text-[10px] text-zinc-500">{formatCurrency(week.revenue)}</div>
                    </div>

                    {/* Chevron */}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-zinc-500 transition-transform ${expandedWeek === wi ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* Expanded daily view */}
                  {expandedWeek === wi && (
                    <div className="px-4 pb-4 space-y-2">
                      {week.days.map((day, di) => (
                        <div key={di} className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                          <div className="flex items-center gap-3">
                            {/* Day label */}
                            <div className="min-w-[60px]">
                              <div className="text-sm font-medium">{dayNameShort(day.dayOfWeek)}</div>
                              <div className="text-[10px] text-zinc-500">{formatDateShort(day.date)}</div>
                            </div>

                            {/* Utilization bar */}
                            <div className="flex-1">
                              <div className="w-full bg-zinc-700 rounded-full h-3 relative overflow-hidden">
                                <div
                                  className={`h-3 rounded-full transition-all ${statusBarColor(day.status)}`}
                                  style={{ width: `${Math.min(100, day.utilizationRate)}%` }}
                                />
                                {/* Optimal zone indicator */}
                                <div className="absolute top-0 h-full border-l-2 border-dashed border-zinc-400/40" style={{ left: '75%' }} />
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-zinc-500">{Math.round(day.bookedCapacity)}h bokad</span>
                                <span className="text-[10px] text-zinc-500">{Math.round(day.totalCapacity)}h total</span>
                              </div>
                            </div>

                            {/* Percentage + status */}
                            <div className="text-right min-w-[80px]">
                              <div className={`text-sm font-bold ${statusColor(day.status)}`}>
                                {Math.round(day.utilizationRate)}%
                              </div>
                              <div className={`text-[10px] ${statusColor(day.status)}`}>
                                {statusLabel(day.status)}
                              </div>
                            </div>
                          </div>

                          {/* Slots info */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                            <span>{day.availableSlots} lediga tider</span>
                            {day.recommendation && (
                              <>
                                <span>·</span>
                                <span className="text-zinc-400">{day.recommendation}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Week total */}
                      <div className="flex items-center justify-between px-3 pt-2 text-xs text-zinc-500">
                        <span>{week.availableSlots} lediga tider denna vecka</span>
                        <span>Projicerad: {formatCurrency(week.projectedRevenue)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ─── Insights ────────────────────────────────────────────── */}
            {forecast.insights && forecast.insights.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 uppercase tracking-wider px-1">Insikter & Rekommendationer</div>
                {forecast.insights.map((insight, i) => (
                  <div key={i} className={`rounded-2xl p-4 border ${insightBg(insight.type)}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-xl">{insightIcon(insight.type)}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{insight.title}</div>
                        <div className="text-xs text-zinc-400 mt-1">{insight.description}</div>
                        {insight.impact && (
                          <div className="mt-2 inline-block px-2 py-0.5 bg-zinc-800/50 rounded text-xs text-zinc-300">
                            {insight.impact}
                          </div>
                        )}
                        {insight.actionItems && insight.actionItems.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {insight.actionItems.map((item, j) => (
                              <li key={j} className="text-xs text-zinc-400 flex items-start gap-1.5">
                                <span className="text-zinc-600 mt-0.5">→</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Legend ───────────────────────────────────────────────── */}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Förklaring</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { status: 'OVERBOOKED', desc: '>95% beläggning' },
                  { status: 'NEAR_FULL', desc: '85-95% beläggning' },
                  { status: 'OPTIMAL', desc: '60-85% beläggning' },
                  { status: 'UNDERUTILIZED', desc: '<60% beläggning' },
                ].map(item => (
                  <div key={item.status} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${statusBarColor(item.status)}`} />
                    <div>
                      <div className={`text-xs font-medium ${statusColor(item.status)}`}>{statusLabel(item.status)}</div>
                      <div className="text-[10px] text-zinc-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
