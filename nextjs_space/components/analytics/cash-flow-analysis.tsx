
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";

interface CashFlowSummary {
  totalSales: number;
  totalIncoming: number;
  gap: number;
  gapPercentage: number;
  matchedCount: number;
  pendingCount: number;
  unmatchedCount: number;
}

interface ChartDataPoint {
  date: string;
  sales: number;
  bankIncome: number;
  gap: number;
}

interface Sale {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  totalAmount: number;
  customer?: {
    id: string;
    name: string;
  };
  bankTransactions: any[];
}

interface BankTransaction {
  id: string;
  transactionDate: string;
  amount: number;
  description?: string;
  matchStatus: string;
  matchedSale?: {
    id: string;
    receiptNumber: string;
    receiptDate: string;
    totalAmount: number;
  };
}

interface CashFlowData {
  summary: CashFlowSummary;
  chartData: ChartDataPoint[];
  sales: Sale[];
  bankTransactions: BankTransaction[];
}

export default function CashFlowAnalysis() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<CashFlowData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const fetchCashFlow = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    try {
      const from = format(dateRange.from, "yyyy-MM-dd");
      const to = format(dateRange.to, "yyyy-MM-dd");

      const response = await fetch(`/api/analytics/cash-flow?from=${from}&to=${to}`);
      if (!response.ok) {
        throw new Error("Failed to fetch cash flow data");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching cash flow:", error);
      toast.error("Kunde inte hämta kassaflödesdata");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
      const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

      const response = await fetch("/api/fortnox/bank-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromDate: from, toDate: to }),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const result = await response.json();
      toast.success(
        `Synkronisering klar! ${result.results.created} nya, ${result.results.matched} matchade`
      );
      
      // Refresh data
      await fetchCashFlow();
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error("Kunde inte synkronisera banktransaktioner");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Ingen data tillgänglig</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, chartData, sales, bankTransactions } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kassaflödesanalys</h2>
          <p className="text-muted-foreground">
            Jämför Bokadirekt försäljning med Nordea inbetalningar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker 
            value={dateRange || { from: undefined, to: undefined }} 
            onChange={(range) => setDateRange(range)} 
          />
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Synkronisera
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bokadirekt Försäljning</CardDescription>
            <CardTitle className="text-2xl">{summary.totalSales.toLocaleString("sv-SE")} kr</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Förväntad intäkt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nordea Inbetalningar</CardDescription>
            <CardTitle className="text-2xl">
              {summary.totalIncoming.toLocaleString("sv-SE")} kr
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Faktisk inbetalning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Skillnad/Gap</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              {summary.gap >= 0 ? (
                <TrendingDown className="mr-2 h-5 w-5 text-orange-500" />
              ) : (
                <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              )}
              {Math.abs(summary.gap).toLocaleString("sv-SE")} kr
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {summary.gap >= 0 ? "Väntar på inbetalning" : "Överskott"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Matchningsstatus</CardDescription>
            <CardTitle className="text-2xl">{summary.matchedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="default" className="text-xs">
                {summary.matchedCount} matchade
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {summary.pendingCount} väntande
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Kassaflöde över tid</CardTitle>
          <CardDescription>
            Röd = Bokadirekt försäljning · Grön = Nordea inbetalningar · Gul = Skillnad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBank" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), "d MMM")}
              />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString("sv-SE")} kr`}
                labelFormatter={(label) => format(new Date(label), "d MMMM yyyy")}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorSales)"
                name="Försäljning"
              />
              <Area
                type="monotone"
                dataKey="bankIncome"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorBank)"
                name="Inbetalningar"
              />
              <Area
                type="monotone"
                dataKey="gap"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorGap)"
                name="Skillnad"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transaction Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRightLeft className="mr-2 h-5 w-5" />
              Bokadirekt Försäljning
            </CardTitle>
            <CardDescription>Senaste 10 försäljningarna</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sales.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">
                      {sale.customer?.name || "Anonym kund"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(sale.receiptDate), "d MMM yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{sale.totalAmount.toLocaleString("sv-SE")} kr</p>
                    <div>
                      {sale.bankTransactions.length > 0 ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Matchad
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          Väntande
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bank Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Nordea Inbetalningar
            </CardTitle>
            <CardDescription>Senaste 10 transaktionerna</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bankTransactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">
                      {transaction.description || "Ingen beskrivning"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.transactionDate), "d MMM yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {transaction.amount.toLocaleString("sv-SE")} kr
                    </p>
                    <div>
                      {transaction.matchStatus === "matched" ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Matchad
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Omatchad
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
