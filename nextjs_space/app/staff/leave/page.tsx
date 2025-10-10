
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StaffLeave {
  id: string
  staffId: string
  startDate: string
  endDate: string
  leaveType: string
  reason?: string
  status: string
  staff: {
    name: string
  }
  createdAt: string
}

export default function StaffLeavePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [leaves, setLeaves] = useState<StaffLeave[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    staffId: '',
    startDate: '',
    endDate: '',
    leaveType: 'VACATION',
    reason: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch staff
      const staffRes = await fetch('/api/staff')
      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setStaff(staffData.staff || [])
      }

      // Fetch leaves
      const leavesRes = await fetch('/api/staff/leave')
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json()
        setLeaves(leavesData.leaves || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/staff/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchData()
        setDialogOpen(false)
        setFormData({
          staffId: '',
          startDate: '',
          endDate: '',
          leaveType: 'VACATION',
          reason: '',
        })
      }
    } catch (error) {
      console.error('Failed to create leave:', error)
    }
  }

  const handleUpdateStatus = async (leaveId: string, status: string) => {
    try {
      const response = await fetch(`/api/staff/leave/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to update leave status:', error)
    }
  }

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      VACATION: 'Semester',
      SICK_LEAVE: 'Sjukfrånvaro',
      PERSONAL: 'Personlig ledighet',
      UNPAID: 'Obetald ledighet',
      PARENTAL: 'Föräldraledighet',
      OTHER: 'Annat',
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Väntar' },
      APPROVED: { color: 'bg-green-100 text-green-800', label: 'Godkänd' },
      REJECTED: { color: 'bg-red-100 text-red-800', label: 'Avvisad' },
      CANCELLED: { color: 'bg-gray-100 text-gray-800', label: 'Avbruten' },
    }
    const variant = variants[status] || variants.PENDING
    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar ledigheter...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Personalledighet</h1>
                <p className="text-muted-foreground">Hantera semester och frånvaro</p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ny Ledighet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrera Ledighet</DialogTitle>
                  <DialogDescription>
                    Fyll i information om personalledighe

t
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="staffId">Personal</Label>
                    <Select
                      value={formData.staffId}
                      onValueChange={(value) => setFormData({ ...formData, staffId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj personal" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="leaveType">Typ av Ledighet</Label>
                    <Select
                      value={formData.leaveType}
                      onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VACATION">Semester</SelectItem>
                        <SelectItem value="SICK_LEAVE">Sjukfrånvaro</SelectItem>
                        <SelectItem value="PERSONAL">Personlig ledighet</SelectItem>
                        <SelectItem value="UNPAID">Obetald ledighet</SelectItem>
                        <SelectItem value="PARENTAL">Föräldraledighet</SelectItem>
                        <SelectItem value="OTHER">Annat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Startdatum</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Slutdatum</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reason">Anledning (valfritt)</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Lägg till eventuell kommentar..."
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Avbryt
                    </Button>
                    <Button type="submit">Spara</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totala Ledigheter</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaves.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Väntar Godkännande</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaves.filter((l) => l.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Godkända</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaves.filter((l) => l.status === 'APPROVED').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avvisade</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaves.filter((l) => l.status === 'REJECTED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaves List */}
        <Card>
          <CardHeader>
            <CardTitle>Alla Ledigheter</CardTitle>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Inga ledigheter registrerade ännu
              </p>
            ) : (
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{leave.staff.name}</h3>
                        {getStatusBadge(leave.status)}
                        <Badge variant="outline">{getLeaveTypeLabel(leave.leaveType)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(leave.startDate).toLocaleDateString('sv-SE')} - {new Date(leave.endDate).toLocaleDateString('sv-SE')}
                      </div>
                      {leave.reason && (
                        <p className="text-sm text-muted-foreground mt-1">{leave.reason}</p>
                      )}
                    </div>

                    {leave.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleUpdateStatus(leave.id, 'APPROVED')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Godkänn
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleUpdateStatus(leave.id, 'REJECTED')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Avvisa
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
