
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, UserPlus, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { UserRole } from '@prisma/client'

interface User {
  id: string
  name: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string
  createdAt: string
  onboardingCompletedAt: string | null
}

export default function ClinicUsersPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<{
    email: string
    firstName: string
    lastName: string
    password: string
    role: string
  }>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: UserRole.STAFF
  })

  useEffect(() => {
    fetchUsers()
  }, [params.id])

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/superadmin/clinics/${params.id}/users`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Kunde inte hämta användare')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    try {
      const res = await fetch(`/api/superadmin/clinics/${params.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('Användare skapad!')
        setAddDialogOpen(false)
        setFormData({ email: '', firstName: '', lastName: '', password: '', role: UserRole.STAFF })
        fetchUsers()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Kunde inte skapa användare')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/superadmin/clinics/${params.id}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role
        })
      })

      if (res.ok) {
        toast.success('Användare uppdaterad!')
        setEditDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast.error('Kunde inte uppdatera användare')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Är du säker på att du vill radera denna användare?')) {
      return
    }

    try {
      const res = await fetch(`/api/superadmin/clinics/${params.id}/users/${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Användare raderad')
        fetchUsers()
      } else {
        toast.error('Kunde inte radera användare')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      password: '',
      role: user.role
    })
    setEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/superadmin/clinics/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Användare</h1>
            <p className="text-muted-foreground">Hantera användare för denna klinik</p>
          </div>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Lägg till Användare
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till Användare</DialogTitle>
              <DialogDescription>Skapa en ny användare för denna klinik</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">Förnamn</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Efternamn</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Roll</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Avbryt</Button>
              <Button onClick={handleAddUser}>Skapa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Alla Användare ({users.length})</CardTitle>
          <CardDescription>Hantera roller och behörigheter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{user.name || `${user.firstName} ${user.lastName}`}</p>
                    <Badge>{user.role}</Badge>
                    {user.onboardingCompletedAt && (
                      <Badge variant="outline">Onboarded</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Skapad: {new Date(user.createdAt).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Inga användare hittades</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera Användare</DialogTitle>
            <DialogDescription>Uppdatera användarinformation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">E-post</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-firstName">Förnamn</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Efternamn</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-role">Roll</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleUpdateUser}>Uppdatera</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
