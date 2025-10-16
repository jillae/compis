
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewClinicPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    tier: 'BASIC',
    subscriptionStatus: 'TRIAL',
    bokadirektApiKey: '',
    bokadirektEnabled: true,
    metaEnabled: false,
    corexEnabled: false,
    dynamicPricingEnabled: false,
    retentionAutopilotEnabled: false,
    aiActionsEnabled: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email) {
      toast.error('Namn och e-post är obligatoriska')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const clinic = await res.json()
        toast.success('Klinik skapad!')
        router.push(`/superadmin/clinics/${clinic.id}`)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Kunde inte skapa klinik')
      }
    } catch (error) {
      console.error('Error creating clinic:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/superadmin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Lägg till Klinik</h1>
          <p className="text-muted-foreground">Registrera en ny klinik i systemet</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Grundläggande Information</CardTitle>
              <CardDescription>Klinikens kontaktuppgifter och beskrivning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Kliniknamn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">E-post *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Adress</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="website">Webbplats</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle>Prenumeration</CardTitle>
              <CardDescription>Välj prenumerationsnivå och status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="tier">Prenumerationsnivå</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value) => setFormData({ ...formData, tier: value })}
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
                    value={formData.subscriptionStatus}
                    onValueChange={(value) => setFormData({ ...formData, subscriptionStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRIAL">Trial</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Integrationer</CardTitle>
              <CardDescription>Aktivera eller inaktivera funktioner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bokadirektApiKey">Bokadirekt API Key</Label>
                <Input
                  id="bokadirektApiKey"
                  value={formData.bokadirektApiKey}
                  onChange={(e) => setFormData({ ...formData, bokadirektApiKey: e.target.value })}
                  placeholder="Klinikens Bokadirekt API-nyckel"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bokadirekt</Label>
                  <p className="text-sm text-muted-foreground">Synkronisera data från Bokadirekt</p>
                </div>
                <Switch
                  checked={formData.bokadirektEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, bokadirektEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Meta Marketing</Label>
                  <p className="text-sm text-muted-foreground">Facebook & Instagram annonsering</p>
                </div>
                <Switch
                  checked={formData.metaEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, metaEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Corex Voice</Label>
                  <p className="text-sm text-muted-foreground">SMS och röstmeddelanden</p>
                </div>
                <Switch
                  checked={formData.corexEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, corexEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dynamic Pricing</Label>
                  <p className="text-sm text-muted-foreground">AI-driven prisoptimering</p>
                </div>
                <Switch
                  checked={formData.dynamicPricingEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, dynamicPricingEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Retention Autopilot</Label>
                  <p className="text-sm text-muted-foreground">Automatiska retentionskampanjer</p>
                </div>
                <Switch
                  checked={formData.retentionAutopilotEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, retentionAutopilotEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Actions</Label>
                  <p className="text-sm text-muted-foreground">AI-drivna handlingsrekommendationer</p>
                </div>
                <Switch
                  checked={formData.aiActionsEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, aiActionsEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Link href="/superadmin">
              <Button variant="outline" type="button">Avbryt</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Skapar...' : 'Skapa Klinik'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
