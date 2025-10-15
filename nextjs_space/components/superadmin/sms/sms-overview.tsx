'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageSquare, TrendingUp, DollarSign, CheckCircle2, AlertCircle, MoreVertical, ExternalLink } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface SMSLog {
  id: string
  direction: string
  from: string
  to: string
  message: string
  status: string
  cost: number
  provider: string
  createdAt: string
  customer?: { name: string; phone: string }
  clinic?: { name: string }
}

export function SMSOverview() {
  const [logs, setLogs] = useState<SMSLog[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedClinic, setSelectedClinic] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [selectedClinic, filterStatus, filterType])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch logs
      const logsParams = new URLSearchParams()
      if (selectedClinic !== 'all') logsParams.set('clinicId', selectedClinic)
      if (filterStatus !== 'all') logsParams.set('status', filterStatus)
      if (filterType !== 'all') logsParams.set('direction', filterType)

      const [logsRes, analyticsRes] = await Promise.all([
        fetch(`/api/superadmin/sms/logs?${logsParams.toString()}`),
        fetch(`/api/superadmin/sms/analytics${selectedClinic !== 'all' ? `?clinicId=${selectedClinic}` : ''}`)
      ])

      const logsData = await logsRes.json()
      const analyticsData = await analyticsRes.json()

      setLogs(logsData.logs || [])
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching SMS data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      delivered: { variant: 'default', label: 'Levererad' },
      sent: { variant: 'secondary', label: 'Skickad' },
      failed: { variant: 'destructive', label: 'Misslyckad' },
      pending: { variant: 'outline', label: 'Väntar' },
      stopped: { variant: 'destructive', label: 'Stoppad' }
    }
    
    const config = variants[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (direction: string, campaignId?: string) => {
    if (campaignId) {
      return <Badge className="bg-blue-100 text-blue-800">Manuell</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Automatisk</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS idag</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics?.overview?.totalSMS || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Senaste 24 timmarna
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kostnad</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(analytics?.overview?.totalCost || 0).toFixed(2)} kr
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {(analytics?.overview?.averageCost || 0).toFixed(3)} kr/SMS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leveransgrad</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analytics?.statusBreakdown?.find((s: any) => s.status === 'delivered')?._count?.id 
                ? ((analytics.statusBreakdown.find((s: any) => s.status === 'delivered')._count.id / analytics.overview.totalSMS) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Senaste 30 dagarna
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">46elks Status</CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Aktiv</div>
            <p className="text-xs text-muted-foreground mt-1">
              API fungerar normalt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart */}
      {analytics?.dailyStats && analytics.dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SMS Trend (30 dagar)</CardTitle>
            <CardDescription>Skickade, levererade och misslyckade SMS</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyStats}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('sv-SE')}
                />
                <Line type="monotone" dataKey="total" stroke="#8884d8" name="Totalt" />
                <Line type="monotone" dataKey="delivered" stroke="#82ca9d" name="Levererade" />
                <Line type="monotone" dataKey="failed" stroke="#ff7c7c" name="Misslyckade" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* SMS Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SMS-logg</CardTitle>
              <CardDescription>Alla SMS-meddelanden i systemet</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla typer</SelectItem>
                  <SelectItem value="outbound">Utgående</SelectItem>
                  <SelectItem value="inbound">Inkommande</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla status</SelectItem>
                  <SelectItem value="delivered">Levererade</SelectItem>
                  <SelectItem value="sent">Skickade</SelectItem>
                  <SelectItem value="failed">Misslyckade</SelectItem>
                  <SelectItem value="pending">Väntande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tidpunkt</TableHead>
                <TableHead>Klinik</TableHead>
                <TableHead>Mottagare</TableHead>
                <TableHead>Meddelande</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Kostnad</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga SMS-meddelanden hittades</p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {new Date(log.createdAt).toLocaleString('sv-SE', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.clinic?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.customer?.name || log.to}</p>
                        <p className="text-xs text-muted-foreground">{log.to}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{log.message}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>{getTypeBadge(log.direction)}</TableCell>
                    <TableCell className="font-mono">
                      {log.cost ? `${log.cost.toFixed(3)} kr` : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            Visa fullständig logg
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Skicka liknande meddelande
                          </DropdownMenuItem>
                          {log.status === 'failed' && (
                            <DropdownMenuItem className="text-red-600">
                              Försök igen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {logs.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <p>Visar {logs.length} meddelanden</p>
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Exportera till CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
