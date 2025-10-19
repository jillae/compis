
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GHLConfigForm } from '@/components/superadmin/ghl-config-form';

export default function GHLConfigPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GoHighLevel Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Konfigurera GoHighLevel CRM-integration för den valda kliniken.
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <GHLConfigForm />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </CardContent>
    </Card>
  );
}
