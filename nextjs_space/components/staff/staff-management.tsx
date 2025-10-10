
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { LeaveManagementDialog } from './leave-management-dialog'

interface StaffMember {
  id: string
  name: string
  role: string
  email?: string
  phone?: string
  weeklyHours?: number
}

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      const data = await response.json()
      
      if (data.success) {
        setStaff(data.staff || [])
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast.error('Kunde inte hämta personal')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData: Partial<StaffMember>) => {
    try {
      const url = editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff'
      const method = editingStaff ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingStaff ? 'Personal uppdaterad!' : 'Personal tillagd!')
        setDialogOpen(false)
        setEditingStaff(null)
        fetchStaff()
      } else {
        toast.error(data.message || 'Något gick fel')
      }
    } catch (error) {
      console.error('Error saving staff:', error)
      toast.error('Kunde inte spara personal')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna personal?')) return

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Personal borttagen!')
        fetchStaff()
      } else {
        toast.error(data.message || 'Kunde inte ta bort personal')
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast.error('Kunde inte ta bort personal')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Laddar personal...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>👥 Personalhantering</CardTitle>
              <CardDescription>
                Hantera din kliniks personal och deras scheman
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingStaff(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till personal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStaff ? 'Redigera personal' : 'Lägg till ny personal'}
                  </DialogTitle>
                  <DialogDescription>
                    Fyll i uppgifterna för personalen
                  </DialogDescription>
                </DialogHeader>
                <StaffForm
                  staff={editingStaff}
                  onSave={handleSave}
                  onCancel={() => {
                    setDialogOpen(false)
                    setEditingStaff(null)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">Ingen personal tillagd ännu</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Lägg till första personalen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Veckotimmar</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{member.email || '-'}</TableCell>
                    <TableCell>{member.phone || '-'}</TableCell>
                    <TableCell>{member.weeklyHours ? `${member.weeklyHours}h` : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(member)
                            setLeaveDialogOpen(true)
                          }}
                          title="Hantera semester & ledighet"
                        >
                          <Calendar className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingStaff(member)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Leave Management Dialog */}
      {selectedStaff && (
        <LeaveManagementDialog
          open={leaveDialogOpen}
          onOpenChange={setLeaveDialogOpen}
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
        />
      )}
    </div>
  )
}

function StaffForm({
  staff,
  onSave,
  onCancel,
}: {
  staff: StaffMember | null
  onSave: (data: Partial<StaffMember>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<StaffMember>>(
    staff || { name: '', role: '', email: '', phone: '', weeklyHours: 40 }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Namn *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Roll *</Label>
        <Input
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="T.ex. Massör, Hudterapeut, Receptionist"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-post</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="weeklyHours">Veckotimmar</Label>
        <Input
          id="weeklyHours"
          type="number"
          value={formData.weeklyHours}
          onChange={(e) => setFormData({ ...formData, weeklyHours: parseInt(e.target.value) || 0 })}
          min={0}
          max={168}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button type="submit">
          {staff ? 'Uppdatera' : 'Lägg till'}
        </Button>
      </div>
    </form>
  )
}
