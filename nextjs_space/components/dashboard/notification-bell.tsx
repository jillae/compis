'use client';

/**
 * NotificationBell
 *
 * En klockikon för dashboardens header/menyrad som visar antal olästa notiser.
 * Vid klick visas en dropdown med de senaste notiserna.
 *
 * - Pollar /api/notifications/unread-count var 30:e sekund
 * - Hämtar fullständig lista vid klick (lazy)
 * - "Markera alla som lästa"-knapp
 * - Klick på enskild notis navigerar till actionUrl
 * - Ikoner per notis-typ
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Megaphone,
  Star,
  AlertTriangle,
  Calendar,
  X,
  CheckCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// -------------------------------------------------------------------
// Typer
// -------------------------------------------------------------------
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  priority: string;
  isRead: boolean;
  createdAt: string;
  expiresAt: string | null;
}

// -------------------------------------------------------------------
// Hjälpfunktioner
// -------------------------------------------------------------------
function getTypeIcon(type: string) {
  switch (type) {
    case 'campaign_reminder':
      return <Megaphone className="h-4 w-4 text-blue-400 shrink-0" />;
    case 'loyalty_milestone':
      return <Star className="h-4 w-4 text-yellow-400 shrink-0" />;
    case 'customer_alert':
      return <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />;
    case 'schedule_reminder':
      return <Calendar className="h-4 w-4 text-green-400 shrink-0" />;
    default:
      return <Bell className="h-4 w-4 text-zinc-400 shrink-0" />;
  }
}

function getPriorityDot(priority: string) {
  if (priority === 'high') return 'bg-red-500';
  if (priority === 'medium') return 'bg-yellow-500';
  return 'bg-zinc-500';
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just nu';
  if (diff < 3600) return `${Math.floor(diff / 60)} min sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} tim sedan`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dagar sedan`;
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

// -------------------------------------------------------------------
// Komponent
// -------------------------------------------------------------------
export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<number>(0);

  // Polla oläst antal var 30:e sekund
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch {
      // Tyst fel – badge är icke-kritisk
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Hämta fullständig lista vid öppning (max en gång per 10s)
  const fetchNotifications = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetched < 10_000) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=30', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setLastFetched(Date.now());
      }
    } catch {
      // Tyst fel
    } finally {
      setLoading(false);
    }
  }, [lastFetched]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) fetchNotifications();
  };

  // Markera enskild notis som läst
  const handleMarkRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Tyst fel
    }
  };

  // Markera alla som lästa
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Tyst fel
    }
  };

  // Navigera till actionUrl och markera som läst
  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) await handleMarkRead(n.id);
    if (n.actionUrl) {
      setOpen(false);
      router.push(n.actionUrl);
    }
  };

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative min-h-[44px] min-w-[44px] px-2"
          aria-label="Notiser"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0 bg-zinc-900 border-zinc-800 shadow-2xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-100">Notiser</span>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-1.5 py-0"
              >
                {unreadCount} olästa
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Markera alla som lästa
              </Button>
            )}
          </div>
        </div>

        {/* Lista */}
        <ScrollArea className="max-h-[420px]">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Bell className="h-8 w-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Inga notiser just nu</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {/* Olästa */}
              {unread.length > 0 && (
                <div>
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                    Olästa
                  </p>
                  {unread.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onClick={() => handleNotificationClick(n)}
                      onDismiss={() => handleMarkRead(n.id)}
                    />
                  ))}
                </div>
              )}

              {/* Lästa */}
              {read.length > 0 && (
                <div>
                  {unread.length > 0 && (
                    <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                      Tidigare
                    </p>
                  )}
                  {read.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onClick={() => handleNotificationClick(n)}
                      onDismiss={undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// -------------------------------------------------------------------
// NotificationItem
// -------------------------------------------------------------------
function NotificationItem({
  notification: n,
  onClick,
  onDismiss,
}: {
  notification: Notification;
  onClick: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer',
        n.isRead
          ? 'hover:bg-zinc-800/40'
          : 'bg-zinc-800/30 hover:bg-zinc-800/60'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Prioritetsdot */}
      <span
        className={cn(
          'mt-1.5 h-2 w-2 rounded-full shrink-0',
          n.isRead ? 'bg-transparent' : getPriorityDot(n.priority)
        )}
      />

      {/* Ikon */}
      <div className="mt-0.5">{getTypeIcon(n.type)}</div>

      {/* Innehåll */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug truncate',
            n.isRead ? 'text-zinc-400 font-normal' : 'text-zinc-100 font-medium'
          )}
        >
          {n.title}
        </p>
        <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">
          {n.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-zinc-600">{timeAgo(n.createdAt)}</span>
          {n.actionUrl && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-2.5 w-2.5" />
              Öppna
            </span>
          )}
        </div>
      </div>

      {/* Avfärda-knapp (visas vid hover, enbart för olästa) */}
      {onDismiss && (
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 h-5 w-5 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label="Markera som läst"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
