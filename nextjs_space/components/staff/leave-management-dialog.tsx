
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

interface Leave {
  id: string
  startDate: string
  endDate: string
  leaveType: string
  reason?: string
  status: string
}

interface LeaveManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffId: string
  staffName: string
}

const leaveTypes = {
  VACATION: 'Semester',
  SICK_LEAVE: 'Sjukfrånvaro',
  PERSONAL: 'Personlig ledighet',
  UNPAID: 'Obetald ledighet',
  PARENTAL: 'Föräldraledighet',
  OTHER: 'Annat'
}

export function LeaveManagementDialog({
  open,
  onOpenChange,
  staffId,
  staffName
}: LeaveManagementDialogProps) {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'VACATION',
    reason: ''
  })

  useEffect(() => {
    if (open) {
      fetchLeaves()
    }
  }, [open, staffId])

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/staff/${staffId}/leave`)
      const result = await response.json()
      
      if (result.success) {
        setLeaves(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching leaves:', error)
      toast.error('Kunde inte hämta ledighet')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.startDate || !formData.endDate) {
      toast.error('Vänligen fyll i start- och slutdatum')
      return
    }

    try {
      const response = await fetch(`/api/staff/${staffId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Ledighet registrerad!')
        setShowForm(false)
        setFormData({
          startDate: '',
          endDate: '',
          leaveType: 'VACATION',
          reason: ''
        })
        fetchLeaves()
      } else {
        toast.error(result.error || 'Kunde inte registrera ledighet')
      }
    } catch (error) {
      console.error('Error saving leave:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna ledighet?')) return

    try {
      const response = await fetch(`/api/staff/${staffId}/leave?leaveId=${leaveId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Ledighet borttagen!')
        fetchLeaves()
      } else {
        toast.error(result.error || 'Kunde inte ta bort ledighet')
      }
    } catch (error) {
      console.error('Error deleting leave:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: sv })
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Semester & Ledighet - {staffName}
          </DialogTitle>
          <DialogDescription>
            Hantera semester och frånvaro för personalen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Leave Button */}
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Registrera ny ledighet
            </Button>
          )}

          {/* Add Leave Form */}
          {showForm && (
            <form onSubmit={handleSaveLeave} className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <h3 className="font-semibold">Ny ledighet</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Startdatum *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">Slutdatum *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveType">Typ av ledighet *</Label>
                <Select
                  value={formData.leaveType}
                  onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(leaveTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Anledning (valfritt)</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="T.ex. Operation, bröllop, semester i Thailand..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Spara
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({
                      startDate: '',
                      endDate: '',
                      leaveType: 'VACATION',
                      reason: ''
                    })
                  }}
                >
                  Avbryt
                </Button>
              </div>
            </form>
          )}

          {/* Leaves List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Registrerade ledigheter</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Laddar...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Ingen ledighet registrerad ännu
              </div>
            ) : (
              <div className="space-y-2">
                {leaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {leaveTypes[leave.leaveType as keyof typeof leaveTypes]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </span>
                      </div>
                      {leave.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {leave.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLeave(leave.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
