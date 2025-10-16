
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Building,
  Loader2,
  AlertCircle,
  Lock,
  Sparkles,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface Transaction {
  id: string
  amount: number
  currency: string
  bookingDate: string
  remittanceInformation: string | null
  transactionType: string | null
  category: string | null
  isReconciled: boolean
}

export default function RevenueIntelligenceProPage() {
  const { data: session } = useSession() || {}
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasBankConnection, setHasBankConnection] = useState(false)

  useEffect(() => {
    if (session?.user) {
      checkBankConnection()
    }
  }, [session])

  const checkBankConnection = async () => {
    try {
      const res = await fetch('/api/bank/connect')
      if (res.ok) {
        const data = await res.json()
        const activeConnections = data.connections?.filter((c: any) => c.status === 'ACTIVE')
        setHasBankConnection(activeConnections.length > 0)
        
        if (activeConnections.length > 0 && activeConnections[0].accountIds.length > 0) {
          fetchTransactions(activeConnections[0].accountIds[0])
        }
      }
    } catch (error) {
      console.error('Error checking bank connection:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (accountId: string) => {
    try {
      const res = await fetch(`/api/bank/transactions?accountId=${accountId}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  // Calculate metrics
  const totalIncome = transactions
    .filter((t) => t.transactionType === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter((t) => t.transactionType === 'DEBIT')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netCashflow = totalIncome - totalExpenses

  const reconciledRevenue = transactions
    .filter((t) => t.isReconciled && t.transactionType === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0)

  const unreconciledRevenue = transactions
    .filter((t) => !t.isReconciled && t.transactionType === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Check if user has access (only INTERNAL tier)
  // This should be enforced on the API level too
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in to access this feature.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!hasBankConnection) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-yellow-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">
                LABS
              </span>
            </div>
            <h1 className="text-3xl font-bold">Revenue Intelligence Pro</h1>
            <p className="text-muted-foreground mt-2">
              Djupgående ekonomiska insikter med bank-integration
            </p>
          </div>

          <Alert>
            <Building className="h-4 w-4" />
            <AlertDescription>
              No bank account connected yet.{' '}
              <Link href="/settings/bank" className="underline font-medium">
                Connect your bank
              </Link>{' '}
              to start seeing financial insights.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-yellow-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">
              LABS - INTERNAL ONLY
            </span>
          </div>
          <h1 className="text-3xl font-bold">Revenue Intelligence Pro</h1>
          <p className="text-muted-foreground mt-2">
            Real-time financial insights from bank transactions
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div className="text-2xl font-bold text-green-600">
                  {totalIncome.toLocaleString('sv-SE')} SEK
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div className="text-2xl font-bold text-red-600">
                  {totalExpenses.toLocaleString('sv-SE')} SEK
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Cashflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className={`h-5 w-5 ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netCashflow.toLocaleString('sv-SE')} SEK
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unreconciled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div className="text-2xl font-bold text-amber-600">
                  {unreconciledRevenue.toLocaleString('sv-SE')} SEK
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest {transactions.length} transactions from your bank account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactions.slice(0, 20).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {tx.remittanceInformation || 'No description'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(tx.bookingDate).toLocaleDateString('sv-SE')}
                      {tx.category && ` • ${tx.category}`}
                      {tx.isReconciled && ' • Reconciled'}
                    </div>
                  </div>
                  <div className={`font-bold ${
                    tx.transactionType === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.transactionType === 'CREDIT' ? '+' : '-'}
                    {Math.abs(tx.amount).toLocaleString('sv-SE')} {tx.currency}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
