
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
        title: 'Synkroniserar...',
        description: 'Hämtar senaste data från Bokadirekt',
      });

      const response = await fetch('/api/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Synkronisering lyckades! 🎉',
          description: `Uppdaterat: ${result.results.bookings.upserted} bokningar, ${result.results.customers.upserted} kunder, ${result.results.staff.upserted} personal, ${result.results.services.upserted} tjänster`,
        });
        
        // Reload the page to show updated data
        window.location.reload();
      } else {
        toast({
          title: 'Synkronisering misslyckades',
          description: result.error || 'Kunde inte synkronisera data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Synkroniseringsfel',
        description: error instanceof Error ? error.message : 'Ett fel uppstod',
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
      {isSyncing ? 'Synkroniserar...' : 'Synkronisera nu'}
    </Button>
  );
}
