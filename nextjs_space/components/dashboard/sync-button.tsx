
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    toast.info('Starting sync...', { duration: 2000 });

    try {
      const response = await fetch('/api/sync/manual', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sync completed!', {
          description: `Updated at ${new Date().toLocaleTimeString('sv-SE')}`,
          duration: 4000,
        });
        // Reload page to show new data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('Sync failed', {
          description: result.error || 'Unknown error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Network error',
        duration: 5000,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync Now'}
    </Button>
  );
}
