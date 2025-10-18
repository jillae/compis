
'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  className?: string;
}

export function Loading({ text = 'Laddar...', size = 'md', fullPage = false, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className={cn('text-muted-foreground', textSizeClasses[size])}>{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton loader for cards
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
      <div className="h-8 w-1/2 bg-muted animate-pulse rounded" />
      <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
    </div>
  );
}

// Skeleton loader for tables
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 w-full bg-muted/50 animate-pulse rounded" />
      ))}
    </div>
  );
}

// Inline spinner for buttons
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}
