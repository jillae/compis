
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Building2, Users, Calendar, DollarSign, Settings, 
  ArrowLeft, Save, Trash2, Eye
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ClinicData {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  tier: string
  subscriptionStatus: string
  isActive: boolean
  bokadirektEnabled: boolean
  metaEnabled: boolean
  corexEnabled: boolean
  dynamicPricingEnabled: boolean
  retentionAutopilotEnabled: boolean
  aiActionsEnabled: boolean
  _count: {
    users: number
    customers: number
    bookings: number
    services: number
    staff: number
  }
  totalRevenue: number
  users: Array<{
    id: string
    name: string | null
    email: string | null
    role: string
    createdAt: string
  }>
  bookings: Array<{
    id: string
    revenue: number
    status: string
    startTime: string
  }>
  services: Array<{
    id: string
    name: string
    price: number
  }>
}

export default function ClinicDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [clinic, setClinic] = useState<ClinicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    fetchClinic()
  }, [params.id])

  const fetchClinic = async () => {
    try {
      const res = await fetch(`/api/superadmin/clinics/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setClinic(data)
      }
    } catch (error) {
      console.error('Error fetching clinic:', error)
      toast.error('Kunde inte hämta klinikdata')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!clinic) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/clinics/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clinic)
      })

      if (res.ok) {
        toast.success('Klinik uppdaterad!')
        setEditMode(false)
        fetchClinic()
      } else {
        toast.error('Kunde inte uppdatera klinik')
      }
    } catch (error) {
      console.error('Error updating clinic:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Är du säker på att du vill radera denna klinik? Detta går inte att ångra.')) {
      return
    }

    try {
      const res = await fetch(`/api/superadmin/clinics/${params.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Klinik raderad')
        router.push('/superadmin')
      } else {
        toast.error('Kunde inte radera klinik')
      }
    } catch (error) {
      console.error('Error deleting clinic:', error)
      toast.error('Ett fel uppstod')
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

  if (!clinic) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Klinik hittades inte</p>
          <Link href="/superadmin">
            <Button className="mt-4">Tillbaka till översikt</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/superadmin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{clinic.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={clinic.tier === 'BASIC' ? 'secondary' : clinic.tier === 'PROFESSIONAL' ? 'default' : 'destructive'}>
                {clinic.tier}
              </Badge>
              <Badge variant={clinic.subscriptionStatus === 'ACTIVE' ? 'default' : clinic.subscriptionStatus === 'TRIAL' ? 'secondary' : 'destructive'}>
                {clinic.subscriptionStatus}
              </Badge>
              <Badge variant={clinic.isActive ? 'default' : 'destructive'}>
                {clinic.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard?clinicId=${clinic.id}`}>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View Dashboard
            </Button>
          </Link>
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)} variant="outline">
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Sparar...' : 'Spara'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Redigera
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinic._count.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kunder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinic._count.customers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bokningar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinic._count.bookings.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinic._count.staff}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Omsättning</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinic.totalRevenue.toLocaleString()} kr</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="users">Användare ({clinic._count.users})</TabsTrigger>
          <TabsTrigger value="integrations">Integrationer</TabsTrigger>
          <TabsTrigger value="settings">Inställningar</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Klinik Information</CardTitle>
              <CardDescription>Grundläggande information om kliniken</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Kliniknamn</Label>
                  <Input
                    id="name"
                    value={clinic.name}
                    onChange={(e) => setClinic({ ...clinic, name: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clinic.email || ''}
                    onChange={(e) => setClinic({ ...clinic, email: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={clinic.phone || ''}
                    onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Webbplats</Label>
                  <Input
                    id="website"
                    value={clinic.website || ''}
                    onChange={(e) => setClinic({ ...clinic, website: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Adress</Label>
                <Input
                  id="address"
                  value={clinic.address || ''}
                  onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={clinic.description || ''}
                  onChange={(e) => setClinic({ ...clinic, description: e.target.value })}
                  disabled={!editMode}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Användare</CardTitle>
                  <CardDescription>Hantera användare för denna klinik</CardDescription>
                </div>
                <Link href={`/superadmin/clinics/${clinic.id}/users`}>
                  <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Hantera Användare
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clinic.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge>{user.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrationer</CardTitle>
              <CardDescription>Aktivera eller inaktivera integrationer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bokadirekt</Label>
                  <p className="text-sm text-muted-foreground">Synkronisera data från Bokadirekt</p>
                </div>
                <Switch
                  checked={clinic.bokadirektEnabled}
                  onCheckedChange={(checked) => setClinic({ ...clinic, bokadirektEnabled: checked })}
                  disabled={!editMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Meta Marketing</Label>
                  <p className="text-sm text-muted-foreground">Facebook & Instagram annonsering</p>
                </div>
                <Switch
                  checked={clinic.metaEnabled}
                  onCheckedChange={(checked) => setClinic({ ...clinic, metaEnabled: checked })}
                  disabled={!editMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Corex Voice</Label>
                  <p className="text-sm text-muted-foreground">SMS och röstmeddelanden</p>
                </div>
                <Switch
                  checked={clinic.corexEnabled}
                  onCheckedChange={(checked) => setClinic({ ...clinic, corexEnabled: checked })}
                  disabled={!editMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dynamic Pricing</Label>
                  <p className="text-sm text-muted-foreground">AI-driven prisoptimering</p>
                </div>
                <Switch
                  checked={clinic.dynamicPricingEnabled}
                  onCheckedChange={(checked) => setClinic({ ...clinic, dynamicPricingEnabled: checked })}
                  disabled={!editMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Retention Autopilot</Label>
                  <p className="text-sm text-muted-foreground">Automatiska retentionskampanjer</p>
                </div>
                <Switch
                  checked={clinic.retentionAutopilotEnabled}
                  onCheckedChange={(checked) => setClinic({ ...clinic, retentionAutopilotEnabled: checked })}
                  disabled={!editMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Actions</Label>
                  <p className="text-sm text-muted-foreground">AI-drivna handlingsrekommendationer</p>
                </div>
                <Switch
                  checked={clinic.aiActionsEnabled}
                  onCheckedChange={(checked) => setClinic({ ...clinic, aiActionsEnabled: checked })}
                  disabled={!editMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Prenumeration & Inställningar</CardTitle>
              <CardDescription>Hantera prenumeration och systeminställningar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="tier">Prenumerationsnivå</Label>
                  <Select
                    value={clinic.tier}
                    onValueChange={(value) => setClinic({ ...clinic, tier: value })}
                    disabled={!editMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={clinic.subscriptionStatus}
                    onValueChange={(value) => setClinic({ ...clinic, subscriptionStatus: value })}
                    disabled={!editMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRIAL">Trial</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAST_DUE">Past Due</SelectItem>
                      <SelectItem value="CANCELED">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label>Aktiv</Label>
                  <p className="text-sm text-muted-foreground">Kliniken kan använda systemet</p>
                </div>
                <Switch
                  checked={clinic.isActive}
                  onCheckedChange={(checked) => setClinic({ ...clinic, isActive: checked })}
                  disabled={!editMode}
                />
              </div>
              <div className="pt-4 border-t">
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Radera Klinik
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Varning: Detta kommer att permanent radera kliniken och all relaterad data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
