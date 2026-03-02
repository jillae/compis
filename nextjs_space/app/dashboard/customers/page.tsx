'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  city: string | null;
  totalBookings: number;
  noShowCount: number;
  totalSpent: number;
  lifetimeValue: number;
  healthScore: number | null;
  healthStatus: string | null;
  churnRisk: string | null;
  churnScore: number | null;
  totalVisits: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  averageSpend: number | null;
  consentSms: boolean;
  consentEmail: boolean;
  consentMarketing: boolean;
  isActive: boolean;
  source: string;
  isCompany: boolean;
  companyName: string | null;
  createdAt: string;
}

interface Stats {
  totalCustomers: number;
  activeCustomers: number;
  healthDistribution: Record<string, number>;
  avgHealthScore: number;
  totalLifetimeValue: number;
  avgLifetimeValue: number;
  avgSpend: number;
  avgBookings: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number): string {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M kr`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k kr`;
  return `${Math.round(val)} kr`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function relativeDate(d: string | null): string {
  if (!d) return 'Aldrig';
  const now = new Date();
  const date = new Date(d);
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Idag';
  if (days === 1) return 'Igår';
  if (days < 7) return `${days} dagar sedan`;
  if (days < 30) return `${Math.floor(days / 7)} veckor sedan`;
  if (days < 365) return `${Math.floor(days / 30)} mån sedan`;
  return `${Math.floor(days / 365)} år sedan`;
}

function healthColor(status: string | null): string {
  switch (status) {
    case 'EXCELLENT': return 'text-emerald-400';
    case 'HEALTHY': return 'text-green-400';
    case 'AT_RISK': return 'text-amber-400';
    case 'CRITICAL': return 'text-red-400';
    default: return 'text-zinc-500';
  }
}

function healthBg(status: string | null): string {
  switch (status) {
    case 'EXCELLENT': return 'bg-emerald-500/20 border-emerald-500/30';
    case 'HEALTHY': return 'bg-green-500/20 border-green-500/30';
    case 'AT_RISK': return 'bg-amber-500/20 border-amber-500/30';
    case 'CRITICAL': return 'bg-red-500/20 border-red-500/30';
    default: return 'bg-zinc-500/20 border-zinc-500/30';
  }
}

function healthLabel(status: string | null): string {
  switch (status) {
    case 'EXCELLENT': return 'Utmärkt';
    case 'HEALTHY': return 'Frisk';
    case 'AT_RISK': return 'Risk';
    case 'CRITICAL': return 'Kritisk';
    default: return 'Okänd';
  }
}

function healthEmoji(status: string | null): string {
  switch (status) {
    case 'EXCELLENT': return '💎';
    case 'HEALTHY': return '💚';
    case 'AT_RISK': return '⚠️';
    case 'CRITICAL': return '🔴';
    default: return '❓';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortField, setSortField] = useState('lastVisitAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [authStatus, router]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort: sortField,
        order: sortOrder,
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (tagFilter) params.set('tag', tagFilter);

      const res = await fetch(`/api/customers/list?${params}`);
      if (!res.ok) throw new Error('Kunde inte hämta kunder');
      const data = await res.json();

      setCustomers(data.customers || []);
      setStats(data.stats || null);
      setPagination(data.pagination || null);
      setAvailableTags(data.filters?.availableTags || []);
    } catch (err: any) {
      setError(err.message || 'Något gick fel');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, tagFilter, sortField, sortOrder]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchCustomers();
    }
  }, [authStatus, fetchCustomers]);

  // Debounced search
  const handleSearchInput = (val: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

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
              <h1 className="text-xl font-bold">Kundöversikt</h1>
              <p className="text-xs text-zinc-500">{pagination ? `${pagination.totalCount} kunder` : '...'}</p>
            </div>
          </div>
          <button
            onClick={fetchCustomers}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 12 12 12"/></svg>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">

        {/* ─── Stats Cards ─────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Aktiva kunder</div>
              <div className="text-2xl font-bold">{stats.activeCustomers.toLocaleString('sv-SE')}</div>
              <div className="text-xs text-zinc-500 mt-1">av {stats.totalCustomers} totalt</div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Genomsnittligt LTV</div>
              <div className="text-2xl font-bold">{formatCurrency(stats.avgLifetimeValue)}</div>
              <div className="text-xs text-zinc-500 mt-1">per kund</div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Hälsopoäng (snitt)</div>
              <div className="text-2xl font-bold">{stats.avgHealthScore}/100</div>
              <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    stats.avgHealthScore >= 75 ? 'bg-emerald-500' :
                    stats.avgHealthScore >= 50 ? 'bg-green-500' :
                    stats.avgHealthScore >= 25 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stats.avgHealthScore}%` }}
                />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Snitt bokningar</div>
              <div className="text-2xl font-bold">{stats.avgBookings}</div>
              <div className="text-xs text-zinc-500 mt-1">per kund</div>
            </div>
          </div>
        )}

        {/* ─── Health Distribution ─────────────────────────────────────── */}
        {stats && (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Kundstatus fördelning</div>
            <div className="grid grid-cols-4 gap-2">
              {(['EXCELLENT', 'HEALTHY', 'AT_RISK', 'CRITICAL'] as const).map((s) => {
                const count = stats.healthDistribution[s] || 0;
                const pct = stats.activeCustomers > 0 ? Math.round((count / stats.activeCustomers) * 100) : 0;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(statusFilter === s ? '' : s);
                      setPage(1);
                    }}
                    className={`rounded-xl p-3 border transition-all active:scale-95 min-h-[44px] ${
                      statusFilter === s ? healthBg(s) + ' ring-2 ring-white/20' : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-lg">{healthEmoji(s)}</div>
                    <div className={`text-sm font-bold ${healthColor(s)}`}>{count}</div>
                    <div className="text-[10px] text-zinc-500">{healthLabel(s)} ({pct}%)</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Search & Filters ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Sök namn, email, telefon..."
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 min-h-[44px]"
            />
          </div>

          {availableTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-100 min-h-[44px] min-w-[140px] focus:outline-none focus:border-zinc-600"
            >
              <option value="">Alla taggar</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          <select
            value={`${sortField}_${sortOrder}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split('_');
              setSortField(f);
              setSortOrder(o as 'asc' | 'desc');
              setPage(1);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-100 min-h-[44px] min-w-[160px] focus:outline-none focus:border-zinc-600"
          >
            <option value="lastVisitAt_desc">Senast besök ↓</option>
            <option value="lastVisitAt_asc">Senast besök ↑</option>
            <option value="lifetimeValue_desc">Högst LTV ↓</option>
            <option value="lifetimeValue_asc">Lägst LTV ↑</option>
            <option value="totalBookings_desc">Flest bokningar ↓</option>
            <option value="healthScore_desc">Hälsopoäng ↓</option>
            <option value="healthScore_asc">Hälsopoäng ↑</option>
            <option value="name_asc">Namn A-Ö</option>
            <option value="name_desc">Namn Ö-A</option>
            <option value="createdAt_desc">Nyast ↓</option>
          </select>
        </div>

        {/* Active filter chips */}
        {(statusFilter || tagFilter || search) && (
          <div className="flex flex-wrap gap-2">
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-full">
                Sök: "{search}"
                <button onClick={() => setSearch('')} className="ml-1 hover:text-white">&times;</button>
              </span>
            )}
            {statusFilter && (
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 border text-xs rounded-full ${healthBg(statusFilter)} ${healthColor(statusFilter)}`}>
                {healthEmoji(statusFilter)} {healthLabel(statusFilter)}
                <button onClick={() => setStatusFilter('')} className="ml-1 hover:text-white">&times;</button>
              </span>
            )}
            {tagFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs rounded-full">
                Tagg: {tagFilter}
                <button onClick={() => setTagFilter('')} className="ml-1 hover:text-white">&times;</button>
              </span>
            )}
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setTagFilter(''); setPage(1); }}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Rensa alla
            </button>
          </div>
        )}

        {/* ─── Error State ─────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
            <div className="text-red-400 text-sm">{error}</div>
            <button
              onClick={fetchCustomers}
              className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-sm text-red-300 transition-colors"
            >
              Försök igen
            </button>
          </div>
        )}

        {/* ─── Loading ─────────────────────────────────────────────────── */}
        {loading && !customers.length && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-800 rounded w-40 mb-2" />
                    <div className="h-3 bg-zinc-800 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Customer List ───────────────────────────────────────────── */}
        {!loading && customers.length === 0 && !error && (
          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-zinc-400 text-sm">Inga kunder hittades</div>
            {search && <div className="text-zinc-500 text-xs mt-1">Prova en annan sökning</div>}
          </div>
        )}

        <div className="space-y-2">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCustomer(selectedCustomer?.id === c.id ? null : c)}
              className="w-full text-left bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all active:scale-[0.99] overflow-hidden"
            >
              {/* Main row */}
              <div className="p-4 flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${healthBg(c.healthStatus)}`}>
                  {(c.name || c.firstName || '?')[0]?.toUpperCase()}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Okänd'}</span>
                    {c.isCompany && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] rounded">Företag</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                    <span>{relativeDate(c.lastVisitAt)}</span>
                    <span>·</span>
                    <span>{c.totalBookings} besök</span>
                  </div>
                </div>

                {/* Health badge */}
                <div className={`px-2 py-1 rounded-lg border text-xs font-medium ${healthBg(c.healthStatus)} ${healthColor(c.healthStatus)}`}>
                  {healthLabel(c.healthStatus)}
                </div>

                {/* LTV */}
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium">{formatCurrency(Number(c.lifetimeValue))}</div>
                  <div className="text-[10px] text-zinc-500">LTV</div>
                </div>
              </div>

              {/* Expanded detail */}
              {selectedCustomer?.id === c.id && (
                <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                  {/* Contact info */}
                  <div className="grid grid-cols-2 gap-3">
                    {c.email && (
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Email</div>
                        <div className="text-sm truncate">{c.email}</div>
                      </div>
                    )}
                    {c.phone && (
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Telefon</div>
                        <div className="text-sm">{c.phone}</div>
                      </div>
                    )}
                    {c.city && (
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Stad</div>
                        <div className="text-sm">{c.city}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Källa</div>
                      <div className="text-sm capitalize">{c.source}</div>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-zinc-800/50 rounded-xl p-2 text-center">
                      <div className="text-xs text-zinc-500">Spenderat</div>
                      <div className="text-sm font-bold">{formatCurrency(Number(c.totalSpent))}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-2 text-center">
                      <div className="text-xs text-zinc-500">Snitt/besök</div>
                      <div className="text-sm font-bold">{c.averageSpend ? formatCurrency(Number(c.averageSpend)) : '—'}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-2 text-center">
                      <div className="text-xs text-zinc-500">Hälsopoäng</div>
                      <div className="text-sm font-bold">{c.healthScore ?? '—'}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-2 text-center">
                      <div className="text-xs text-zinc-500">No-shows</div>
                      <div className={`text-sm font-bold ${c.noShowCount > 2 ? 'text-red-400' : ''}`}>{c.noShowCount}</div>
                    </div>
                  </div>

                  {/* Consent badges */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Samtycke:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${c.consentSms ? 'bg-green-500/20 text-green-300' : 'bg-zinc-800 text-zinc-500'}`}>
                      SMS {c.consentSms ? '✓' : '✗'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${c.consentEmail ? 'bg-green-500/20 text-green-300' : 'bg-zinc-800 text-zinc-500'}`}>
                      Email {c.consentEmail ? '✓' : '✗'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${c.consentMarketing ? 'bg-green-500/20 text-green-300' : 'bg-zinc-800 text-zinc-500'}`}>
                      Markn. {c.consentMarketing ? '✓' : '✗'}
                    </span>
                  </div>

                  {/* Tags */}
                  {c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/25 text-purple-300 text-[10px] rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Första besök: {formatDate(c.firstVisitAt)}</span>
                    <span>Senaste besök: {formatDate(c.lastVisitAt)}</span>
                    <span>Kund sedan: {formatDate(c.createdAt)}</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* ─── Pagination ──────────────────────────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm disabled:opacity-30 hover:bg-zinc-800 active:scale-95 transition-all min-h-[44px]"
            >
              ← Föregående
            </button>
            <span className="text-sm text-zinc-500">
              Sida {page} av {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={!pagination.hasMore}
              className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm disabled:opacity-30 hover:bg-zinc-800 active:scale-95 transition-all min-h-[44px]"
            >
              Nästa →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
