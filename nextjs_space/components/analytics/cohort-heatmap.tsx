
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CohortHeatmapProps {
  data: any;
}

export function CohortHeatmap({ data }: CohortHeatmapProps) {
  if (!data?.cohorts || data.cohorts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention Analysis</CardTitle>
          <CardDescription>Customer retention över tid per cohort</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ingen data tillgänglig
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHeatmapColor = (retentionRate: number) => {
    if (retentionRate >= 0.9) return 'bg-green-500';
    if (retentionRate >= 0.8) return 'bg-green-400';
    if (retentionRate >= 0.7) return 'bg-yellow-400';
    if (retentionRate >= 0.6) return 'bg-yellow-500';
    if (retentionRate >= 0.5) return 'bg-orange-400';
    if (retentionRate >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const maxMonths = Math.max(...data.cohorts.map((c: any) => c.retention.length));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort Retention Analysis</CardTitle>
        <CardDescription>
          Customer retention över tid per cohort. Varje rad representerar en cohort (månad då kunder
          började), och varje kolumn visar retention rate efter N månader.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium text-muted-foreground">Cohort</th>
                <th className="p-2 text-center font-medium text-muted-foreground">Start</th>
                {Array.from({ length: maxMonths }, (_, i) => (
                  <th key={i} className="p-2 text-center font-medium text-muted-foreground">
                    M{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map((cohort: any) => (
                <tr key={cohort.cohortMonth} className="border-t">
                  <td className="p-2 font-medium">{cohort.cohortMonth}</td>
                  <td className="p-2 text-center">{cohort.initialCustomers}</td>
                  {cohort.retention.map((r: any) => (
                    <td key={r.month} className="p-1">
                      <div
                        className={`${getHeatmapColor(
                          r.retentionRate
                        )} text-white text-center py-2 px-1 rounded font-medium text-xs`}
                        title={`${r.customersRemaining} customers (${(
                          r.retentionRate * 100
                        ).toFixed(1)}%)`}
                      >
                        {(r.retentionRate * 100).toFixed(0)}%
                      </div>
                    </td>
                  ))}
                  {/* Fill empty cells */}
                  {Array.from({ length: maxMonths - cohort.retention.length }, (_, i) => (
                    <td key={`empty-${i}`} className="p-1">
                      <div className="bg-gray-100 text-center py-2 px-1 rounded text-xs">-</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">Retention Rate:</span>
          <div className="flex items-center gap-2">
            <div className="bg-red-500 w-4 h-4 rounded"></div>
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 w-4 h-4 rounded"></div>
            <span>50-60%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 w-4 h-4 rounded"></div>
            <span>70-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-green-400 w-4 h-4 rounded"></div>
            <span>80-90%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-green-500 w-4 h-4 rounded"></div>
            <span>&gt;90%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
