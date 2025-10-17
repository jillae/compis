
/**
 * Standardized loading states for Flow
 * Ensures consistent loading indicators across the application
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Loading({ size = 'md', text, fullScreen = false, className }: LoadingProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {content}
      </div>
    );
  }

  return content;
}

// Specialized loading states
export function LoadingCard({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
      <Loading size="md" text={text || 'Laddar...'} />
    </div>
  );
}

export function LoadingPage({ text }: { text?: string }) {
  return <Loading size="lg" text={text || 'Laddar...'} fullScreen />;
}

export function LoadingButton() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}
