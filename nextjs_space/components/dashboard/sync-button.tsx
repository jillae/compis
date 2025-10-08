
'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      toast({
        title: 'Syncing...',
        description: 'Fetching latest data from Bokadirekt',
      });

      const response = await fetch('/api/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Sync Successful! 🎉',
          description: `Updated: ${result.results.bookings.upserted} bookings, ${result.results.customers.upserted} customers, ${result.results.staff.upserted} staff, ${result.results.services.upserted} services`,
        });
        
        // Reload the page to show updated data
        window.location.reload();
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Failed to sync data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync Now'}
    </Button>
  );
}
