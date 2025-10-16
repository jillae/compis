'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function StaffTimesheetPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Clock className="h-8 w-8" />
          Tidrapport
        </h1>
        <p className="text-muted-foreground mt-2">
          Se arbetade timmar och checka in/ut
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kommande funktion</CardTitle>
          <CardDescription>
            Tidrapportering är under utveckling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Här kommer du kunna checka in/ut och se dina arbetade timmar per månad.
            Exportera till lönesystem och se övertid.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
