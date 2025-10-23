
/**
 * Error State Component
 * Provides consistent error display across dashboard
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorState({ 
  title = 'Ett fel uppstod',
  message,
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {message}
        </p>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Försök igen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function InlineErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="ghost" 
          size="sm"
          className="flex-shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
