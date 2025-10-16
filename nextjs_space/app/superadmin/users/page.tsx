
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Search, Building2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string
  clinicId: string | null
  createdAt: string
  onboardingCompletedAt: string | null
  clinic: {
    id: string
    name: string
  } | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    let filtered = users

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.clinic?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [searchTerm, roleFilter, users])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/superadmin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setFilteredUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Kunde inte hämta användare')
    } finally {
      setLoading(false)
    }
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

  const roleStats = {
    total: users.length,
    superAdmin: users.filter(u => u.role === 'SUPER_ADMIN').length,
    admin: users.filter(u => u.role === 'ADMIN').length,
    staff: users.filter(u => u.role === 'STAFF').length,
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alla Användare</h1>
          <p className="text-muted-foreground">Översikt över alla användare i systemet</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SuperAdmin</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.superAdmin}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.admin}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.staff}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök användare eller klinik..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla roller</SelectItem>
            <SelectItem value="SUPER_ADMIN">SuperAdmin</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="STAFF">Staff</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {filteredUsers.length} av {users.length} användare
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Användare</CardTitle>
          <CardDescription>Alla registrerade användare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{user.name || `${user.firstName} ${user.lastName}` || 'Unnamed'}</p>
                    <Badge>{user.role}</Badge>
                    {user.onboardingCompletedAt && (
                      <Badge variant="outline">Onboarded</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.clinic && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{user.clinic.name}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Skapad: {new Date(user.createdAt).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                {user.clinic && (
                  <Link href={`/superadmin/clinics/${user.clinic.id}/users`}>
                    <Button variant="outline" size="sm">
                      Hantera
                    </Button>
                  </Link>
                )}
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {searchTerm || roleFilter !== 'all' 
                    ? 'Inga användare matchar din sökning' 
                    : 'Inga användare hittades'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
