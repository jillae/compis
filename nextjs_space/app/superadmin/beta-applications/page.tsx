
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  Users, 
  Calendar,
  Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface BetaApplication {
  id: string
  clinicName: string
  contactName: string
  email: string
  phone: string | null
  currentBookingSystem: string | null
  numberOfStaff: number | null
  motivation: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  notes: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
}

export default function BetaApplicationsPage() {
  const [applications, setApplications] = useState<BetaApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<BetaApplication | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [action, setAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/beta/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Kunde inte hämta ansökningar')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (application: BetaApplication, actionType: 'APPROVED' | 'REJECTED') => {
    setSelectedApplication(application)
    setAction(actionType)
    setNotes(application.notes || '')
    setDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedApplication || !action) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/beta/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          notes
        })
      })

      if (response.ok) {
        toast.success(action === 'APPROVED' ? 'Ansökan godkänd!' : 'Ansökan avvisad')
        fetchApplications()
        setDialogOpen(false)
      } else {
        toast.error('Något gick fel')
      }
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error('Något gick fel')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" />Väntar</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle className="w-3 h-3 mr-1" />Godkänd</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50"><XCircle className="w-3 h-3 mr-1" />Avvisad</Badge>
      default:
        return null
    }
  }

  const pending = applications.filter(a => a.status === 'PENDING')
  const approved = applications.filter(a => a.status === 'APPROVED')
  const rejected = applications.filter(a => a.status === 'REJECTED')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Beta-ansökningar</h1>
        <p className="text-gray-600">
          Granska och godkänn ansökningar till beta-programmet
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Väntar på granskning</CardDescription>
            <CardTitle className="text-4xl">{pending.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Godkända</CardDescription>
            <CardTitle className="text-4xl text-green-600">{approved.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Platser kvar</CardDescription>
            <CardTitle className="text-4xl text-blue-600">{6 - approved.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Väntande ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Godkända ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Avvisade ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Inga väntande ansökningar
              </CardContent>
            </Card>
          ) : (
            pending.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                onApprove={() => handleAction(app, 'APPROVED')}
                onReject={() => handleAction(app, 'REJECTED')}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approved.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Inga godkända ansökningar än
              </CardContent>
            </Card>
          ) : (
            approved.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {rejected.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Inga avvisade ansökningar
              </CardContent>
            </Card>
          ) : (
            rejected.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'APPROVED' ? 'Godkänn ansökan' : 'Avvisa ansökan'}
            </DialogTitle>
            <DialogDescription>
              {action === 'APPROVED' 
                ? 'Kliniken får ett email med instruktioner för att komma igång.'
                : 'Kliniken får ett email om att deras ansökan inte godkänts.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Interna anteckningar (valfritt)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lägg till anteckningar om ansökan..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={processing}
            >
              Avbryt
            </Button>
            <Button
              onClick={confirmAction}
              disabled={processing}
              className={action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bearbetar...
                </>
              ) : (
                action === 'APPROVED' ? 'Godkänn' : 'Avvisa'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ApplicationCard({
  application,
  onApprove,
  onReject,
  getStatusBadge
}: {
  application: BetaApplication
  onApprove?: () => void
  onReject?: () => void
  getStatusBadge: (status: string) => React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-1">{application.clinicName}</CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {application.contactName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(application.createdAt).toLocaleDateString('sv-SE')}
              </span>
            </CardDescription>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Email</p>
            <p className="font-medium">{application.email}</p>
          </div>
          {application.phone && (
            <div>
              <p className="text-gray-500 mb-1">Telefon</p>
              <p className="font-medium">{application.phone}</p>
            </div>
          )}
          {application.currentBookingSystem && (
            <div>
              <p className="text-gray-500 mb-1">Bokningssystem</p>
              <p className="font-medium">{application.currentBookingSystem}</p>
            </div>
          )}
          {application.numberOfStaff && (
            <div>
              <p className="text-gray-500 mb-1">Antal anställda</p>
              <p className="font-medium flex items-center gap-1">
                <Users className="w-3 h-3" />
                {application.numberOfStaff}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-gray-500 text-sm mb-2">Motivering</p>
          <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
            {application.motivation}
          </p>
        </div>

        {application.notes && (
          <div>
            <p className="text-gray-500 text-sm mb-2">Interna anteckningar</p>
            <p className="text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded-lg">
              {application.notes}
            </p>
          </div>
        )}

        {application.status === 'PENDING' && onApprove && onReject && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Godkänn
            </Button>
            <Button
              onClick={onReject}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Avvisa
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
