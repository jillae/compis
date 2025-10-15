'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Plus, Calendar, Users, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/superadmin/sms/campaigns')
      const data = await res.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (campaign: any) => {
    if (campaign.sentAt) {
      return <Badge className="bg-gray-500">Slutförd</Badge>
    }
    if (campaign.scheduledAt) {
      return <Badge className="bg-blue-500">Schemalagd</Badge>
    }
    return <Badge variant="outline">Utkast</Badge>
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna kampanj?')) return

    try {
      await fetch(`/api/superadmin/sms/campaigns/${id}`, {
        method: 'DELETE'
      })
      toast.success('Kampanj borttagen')
      fetchCampaigns()
    } catch (error) {
      toast.error('Kunde inte ta bort kampanj')
    }
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SMS Kampanjer</CardTitle>
              <CardDescription>Hantera schemalagda och genomförda kampanjer</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ny kampanj
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namn</TableHead>
                <TableHead>Klinik</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mottagare</TableHead>
                <TableHead>Leveransgrad</TableHead>
                <TableHead>Kostnad</TableHead>
                <TableHead>Skapad</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga kampanjer än</p>
                    <Button variant="link" className="mt-2">
                      Skapa din första kampanj
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.clinic?.name}</TableCell>
                    <TableCell>{getStatusBadge(campaign)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {campaign.recipientCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.recipientCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          {((campaign.successCount / campaign.recipientCount) * 100).toFixed(1)}%
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {campaign.totalCost ? `${campaign.totalCost.toFixed(2)} kr` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(campaign.createdAt).toLocaleDateString('sv-SE')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Visa detaljer</DropdownMenuItem>
                          <DropdownMenuItem>Duplicera</DropdownMenuItem>
                          <DropdownMenuItem>Exportera rapport</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            Ta bort
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
