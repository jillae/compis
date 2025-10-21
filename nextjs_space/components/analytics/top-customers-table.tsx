
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TopCustomersTableProps {
  clinicId: string;
}

export function TopCustomersTable({ clinicId }: TopCustomersTableProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/analytics/top-customers?clinicId=${clinicId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch top customers');
        }
        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (error) {
        console.error('Failed to fetch top customers:', error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (clinicId) {
      fetchTopCustomers();
    }
  }, [clinicId]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      EXCELLENT: { variant: 'default', label: 'Excellent' },
      HEALTHY: { variant: 'secondary', label: 'Healthy' },
      AT_RISK: { variant: 'destructive', label: 'At Risk' },
      CRITICAL: { variant: 'destructive', label: 'Critical' },
    };

    const config = variants[status] || variants.HEALTHY;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800',
      BASIC: 'bg-blue-100 text-blue-800',
      PROFESSIONAL: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-amber-100 text-amber-800',
      INTERNAL: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={colors[tier] || colors.BASIC} variant="outline">
        {tier}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by MRR</CardTitle>
          <CardDescription>Kunder med högst månadsintäkt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Laddar...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Customers by MRR</CardTitle>
        <CardDescription>Kunder med högst månadsintäkt och deras health status</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kund</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">MRR</TableHead>
              <TableHead className="text-right">Health Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{getTierBadge(customer.tier)}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('sv-SE', {
                    style: 'currency',
                    currency: 'SEK',
                    minimumFractionDigits: 0,
                  }).format(customer.mrr)}
                </TableCell>
                <TableCell className="text-right">{customer.healthScore}/100</TableCell>
                <TableCell>{getStatusBadge(customer.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
