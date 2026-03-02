'use client';

import { useState, useEffect, useCallback } from 'react';
import { AutoBookingToggle } from '@/components/bokadirekt/auto-booking-toggle';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  RefreshCw,
  Webhook,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Users,
  CalendarDays,
  UserRound,
  Scissors,
  AlertCircle,
  Clock,
  Activity,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors?: number;
}

interface SyncResults {
  services?: SyncResult;
  staff?: SyncResult;
  customers?: SyncResult;
  bookings?: SyncResult;
  sales?: SyncResult;
}

interface SyncLog {
  id?: string;
  entity: string;
  status: 'success' | 'error' | 'partial';
  records: number;
  timestamp: string;
  message?: string;
}

interface LastSync {
  completedAt?: string;
  triggeredAt?: string;
  status?: string;
}

interface SyncHistory {
  lastSync?: LastSync;
  recentLogs?: SyncLog[];
}

interface EntityCount {
  total: number;
  lastSynced?: string;
}

interface EntitySummary {
  customers?: EntityCount;
  bookings?: EntityCount;
  staff?: EntityCount;
  services?: EntityCount;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso?: string | null): string {
  if (!iso) return '–';
  try {
    return new Intl.DateTimeFormat('sv-SE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return '–';
  }
}

function maskUrl(url: string): string {
  if (!url || url.length < 8) return '••••••••';
  return '••••••••' + url.slice(-4);
}

function entityLabel(entity: string): string {
  const map: Record<string, string> = {
    services: 'Tjänster',
    staff: 'Personal',
    customers: 'Kunder',
    bookings: 'Bokningar',
    sales: 'Försäljning',
  };
  return map[entity.toLowerCase()] ?? entity;
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'success') return 'default';
  if (status === 'error') return 'destructive';
  return 'secondary';
}

function statusLabel(status: string): string {
  if (status === 'success') return 'OK';
  if (status === 'error') return 'Fel';
  return 'Delvis';
}

const WEBHOOK_URL = 'https://goto.klinikflow.app/api/webhooks/bokadirekt';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SyncResultRow({ label, result }: { label: string; result?: SyncResult }) {
  if (!result) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
      <span className="text-sm text-zinc-300">{label}</span>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-emerald-400">+{result.created ?? 0} ny</span>
        <span className="text-sky-400">~{result.updated ?? 0} upd</span>
        <span className="text-zinc-500">{result.skipped ?? 0} skip</span>
        {(result.errors ?? 0) > 0 && (
          <span className="text-red-400">{result.errors} fel</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BokadirektSettingsPage() {
  // Integration status (static config – not from an API in this iteration)
  const apiBaseUrl = process.env.NEXT_PUBLIC_BOKADIREKT_API_URL ?? 'https://api.bokadirekt.se';
  const salonId = process.env.NEXT_PUBLIC_BOKADIREKT_SALON_ID ?? '–';

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResults | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Entity summary
  const [entitySummary, setEntitySummary] = useState<EntitySummary | null>(null);

  // Copy webhook
  const [copied, setCopied] = useState(false);

  // ── Fetch sync history ──────────────────────────────────────────────────────

  const fetchSyncHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/integrations/bokadirekt/sync');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSyncHistory(data);

      // Derive entity summary from the last sync logs if available
      if (data?.recentLogs) {
        const summary: EntitySummary = {};
        (data.recentLogs as SyncLog[]).forEach((log) => {
          const key = log.entity.toLowerCase() as keyof EntitySummary;
          if (['customers', 'bookings', 'staff', 'services'].includes(key)) {
            summary[key] = {
              total: log.records ?? 0,
              lastSynced: log.timestamp,
            };
          }
        });
        setEntitySummary(summary);
      }
    } catch (err) {
      // Graceful degradation – history simply won't show
      console.error('Failed to fetch sync history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchSyncHistory();
  }, [fetchSyncHistory]);

  // ── Trigger sync ────────────────────────────────────────────────────────────

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      setSyncResults(null);
      setSyncError(null);

      const res = await fetch('/api/integrations/bokadirekt/sync', {
        method: 'POST',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setSyncResults(data?.results ?? null);

      // Refresh history after a successful sync
      await fetchSyncHistory();
    } catch (err: any) {
      setSyncError(err?.message ?? 'Synkronisering misslyckades');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Copy webhook URL ────────────────────────────────────────────────────────

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = WEBHOOK_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Entity card config ─────────────────────────────────────────────────────

  const entityCards = [
    {
      key: 'customers' as const,
      label: 'Kunder',
      icon: <Users className="h-5 w-5 text-sky-400" />,
    },
    {
      key: 'bookings' as const,
      label: 'Bokningar',
      icon: <CalendarDays className="h-5 w-5 text-violet-400" />,
    },
    {
      key: 'staff' as const,
      label: 'Personal',
      icon: <UserRound className="h-5 w-5 text-emerald-400" />,
    },
    {
      key: 'services' as const,
      label: 'Tjänster',
      icon: <Scissors className="h-5 w-5 text-amber-400" />,
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container max-w-4xl mx-auto p-4 sm:p-6 space-y-6">

        {/* ── Header ── */}
        <div>
          <BackButton />
          <div className="flex items-center gap-3 mt-4">
            <div className="p-2 rounded-lg bg-zinc-800">
              <Settings className="h-6 w-6 text-zinc-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                Bokadirekt-integration
              </h1>
              <p className="text-zinc-400 mt-0.5 text-sm">
                Hantera synkronisering, webhooks och auto-booking
              </p>
            </div>
          </div>
        </div>

        {/* ── 1. Integration Status Card ── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Activity className="h-5 w-5" />
              Integrationsstatus
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Anslutning och konfiguration mot Bokadirekt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connected indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-sm font-medium text-emerald-400">Ansluten</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* API URL */}
              <div className="rounded-lg bg-zinc-800 px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">API-adress</p>
                <p className="text-sm font-mono text-zinc-300">{maskUrl(apiBaseUrl)}</p>
              </div>

              {/* Salon ID */}
              <div className="rounded-lg bg-zinc-800 px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">Salong-ID</p>
                <p className="text-sm font-mono text-zinc-300">{salonId}</p>
              </div>

              {/* Last sync */}
              <div className="rounded-lg bg-zinc-800 px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">Senaste lyckade synk</p>
                <p className="text-sm text-zinc-300">
                  {loadingHistory
                    ? '...'
                    : formatDateTime(syncHistory?.lastSync?.completedAt)}
                </p>
              </div>

              {/* Next sync (static – runs on schedule) */}
              <div className="rounded-lg bg-zinc-800 px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">Nästa schemalagda synk</p>
                <p className="text-sm text-zinc-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  Var 15:e minut
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Sync Status & Controls ── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-zinc-100">
                  <RefreshCw className="h-5 w-5" />
                  Synkronisering
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Kör en manuell synk eller se historik
                </CardDescription>
              </div>
              <Button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="min-h-[44px] bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Synkar…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Synka nu
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Sync error */}
            {syncError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800 p-3">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{syncError}</p>
              </div>
            )}

            {/* Sync results */}
            {syncResults && (
              <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-4 space-y-1">
                <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">
                  Resultat från senaste synk
                </p>
                <SyncResultRow label="Tjänster" result={syncResults.services} />
                <SyncResultRow label="Personal" result={syncResults.staff} />
                <SyncResultRow label="Kunder" result={syncResults.customers} />
                <SyncResultRow label="Bokningar" result={syncResults.bookings} />
                <SyncResultRow label="Försäljning" result={syncResults.sales} />
              </div>
            )}

            {/* Sync log table */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                Senaste 5 synkar
              </p>
              {loadingHistory ? (
                <div className="flex items-center gap-2 py-4 text-zinc-500 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Hämtar historik…
                </div>
              ) : !syncHistory?.recentLogs?.length ? (
                <p className="text-sm text-zinc-500 py-3">Ingen synkhistorik tillgänglig.</p>
              ) : (
                <div className="rounded-lg border border-zinc-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-800/60 text-zinc-500 text-xs uppercase tracking-wider">
                        <th className="text-left px-3 py-2">Entitet</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-right px-3 py-2">Poster</th>
                        <th className="text-right px-3 py-2">Tid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncHistory.recentLogs.slice(0, 5).map((log, i) => (
                        <tr
                          key={i}
                          className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-zinc-300">
                            {entityLabel(log.entity)}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant={statusVariant(log.status)} className="text-xs">
                              {statusLabel(log.status)}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right text-zinc-400 tabular-nums">
                            {log.records ?? 0}
                          </td>
                          <td className="px-3 py-2.5 text-right text-zinc-500 text-xs">
                            {formatDateTime(log.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── 3. Webhook Status ── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Webhook className="h-5 w-5" />
              Webhook
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Inkommande events från Bokadirekt
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Webhook URL */}
            <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 mb-1">Webhook-URL</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-sm font-mono text-zinc-300 truncate">{WEBHOOK_URL}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWebhook}
                  className="min-h-[44px] border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5 text-emerald-400" />
                      Kopierad!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" />
                      Kopiera webhook-URL
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Recent webhook events */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                Senaste 5 webhook-events
              </p>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-800/60 text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-3 py-2">Händelse</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-right px-3 py-2">Tid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Placeholder rows – replace with real data when endpoint is available */}
                    {[
                      { event: 'booking.created', status: 'success', time: '–' },
                      { event: 'booking.cancelled', status: 'success', time: '–' },
                      { event: 'customer.updated', status: 'success', time: '–' },
                    ].map((row, i) => (
                      <tr
                        key={i}
                        className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="px-3 py-2.5 font-mono text-xs text-zinc-300">{row.event}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="default" className="text-xs bg-emerald-900 text-emerald-300 border-0">
                            OK
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right text-zinc-500 text-xs">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                * Faktiska events hämtas när webhook-loggning är aktiverad i backend.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── 4. Entity Sync Summary (2×2 grid) ── */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Synkade entiteter
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entityCards.map(({ key, label, icon }) => {
              const data = entitySummary?.[key];
              return (
                <Card key={key} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="font-medium text-zinc-200">{label}</span>
                      </div>
                      {data ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-zinc-600" />
                      )}
                    </div>
                    <p className="text-3xl font-bold text-zinc-100 tabular-nums">
                      {data?.total != null ? data.total.toLocaleString('sv-SE') : '–'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Senast synkad:{' '}
                      {loadingHistory ? '…' : formatDateTime(data?.lastSynced)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── 5. Auto-Booking ── */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Auto-Booking
          </h2>
          <AutoBookingToggle />
        </div>

      </div>
    </div>
  );
}
