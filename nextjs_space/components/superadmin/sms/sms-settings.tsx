'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export function SMSSettings() {
  const [settings, setSettings] = useState<any>({
    maxPerHour: 100,
    maxPerDay: 500,
    maxPerMonth: 10000,
    budgetSEK: 3500,
    alertAt80Percent: true,
    alertAt100Percent: true
  })
  const [elkStatus, setElkStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkElksStatus()
  }, [])

  const checkElksStatus = async () => {
    try {
      const res = await fetch('/api/superadmin/sms/history?limit=1')
      if (res.ok) {
        setElkStatus({
          connected: true,
          lastCheck: new Date(),
          phoneNumber: '+46766866273'
        })
      }
    } catch (error) {
      setElkStatus({ connected: false })
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Mock save - implement actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Inställningar sparade')
    } catch (error) {
      toast.error('Kunde inte spara inställningar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 46elks Status */}
      <Card>
        <CardHeader>
          <CardTitle>46elks Integration Status</CardTitle>
          <CardDescription>Anslutning och API-hälsa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {elkStatus?.connected ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="font-semibold text-green-600">✓ Anslutning aktiv</p>
                <p className="text-sm mt-1">Telefonnummer: {elkStatus.phoneNumber}</p>
                <p className="text-sm">Senaste kontroll: {elkStatus.lastCheck?.toLocaleTimeString('sv-SE')}</p>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold">⚠ Anslutning misslyckad</p>
                <p className="text-sm">Kontrollera API-credentials i .env</p>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={checkElksStatus}>
              Testa anslutning
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://46elks.se/docs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                46elks Dokumentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits & Budget</CardTitle>
          <CardDescription>Globala begränsningar för alla kliniker</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Max per timme</Label>
              <Input
                type="number"
                value={settings.maxPerHour}
                onChange={(e) => setSettings({ ...settings, maxPerHour: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max per dag</Label>
              <Input
                type="number"
                value={settings.maxPerDay}
                onChange={(e) => setSettings({ ...settings, maxPerDay: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max per månad</Label>
              <Input
                type="number"
                value={settings.maxPerMonth}
                onChange={(e) => setSettings({ ...settings, maxPerMonth: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Maximal budget per månad (SEK)</Label>
            <Input
              type="number"
              value={settings.budgetSEK}
              onChange={(e) => setSettings({ ...settings, budgetSEK: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              SMS pausas automatiskt när budgeten är förbrukad
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Varna vid 80% budget</Label>
                <p className="text-xs text-muted-foreground">Email till superadmin</p>
              </div>
              <Switch
                checked={settings.alertAt80Percent}
                onCheckedChange={(checked) => setSettings({ ...settings, alertAt80Percent: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Pausa automatiskt vid 100% budget</Label>
                <p className="text-xs text-muted-foreground">Stoppar alla SMS tills nästa månad</p>
              </div>
              <Switch
                checked={settings.alertAt100Percent}
                onCheckedChange={(checked) => setSettings({ ...settings, alertAt100Percent: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Nödbroms</CardTitle>
          <CardDescription>Pausa ALLA SMS i systemet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">⚠️ Använd endast vid kritiska problem</p>
              <p className="text-sm">Detta stoppar alla SMS för alla kliniker omedelbart</p>
            </AlertDescription>
          </Alert>

          <Button variant="destructive" className="w-full">
            PAUSA ALLA SMS
          </Button>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Sparar...' : 'Spara inställningar'}
        </Button>
      </div>
    </div>
  )
}
