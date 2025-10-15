'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Send, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'

export function ManualSMSForm() {
  const [clinics, setClinics] = useState<any[]>([])
  const [selectedClinic, setSelectedClinic] = useState('')
  const [recipientType, setRecipientType] = useState<'single' | 'segment'>('segment')
  const [segment, setSegment] = useState('all')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [timing, setTiming] = useState<'now' | 'scheduled'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [estimatedRecipients, setEstimatedRecipients] = useState(0)
  const [estimatedCost, setEstimatedCost] = useState(0)

  useEffect(() => {
    // Fetch clinics list
    fetchClinics()
  }, [])

  useEffect(() => {
    if (selectedClinic && recipientType === 'segment') {
      estimateRecipients()
    }
  }, [selectedClinic, segment])

  const fetchClinics = async () => {
    try {
      const res = await fetch('/api/superadmin/stats')
      const data = await res.json()
      setClinics(data.clinics || [])
    } catch (error) {
      console.error('Error fetching clinics:', error)
    }
  }

  const estimateRecipients = async () => {
    // Mock estimation - in real scenario, call API
    const estimates: Record<string, number> = {
      all: 500,
      vip: 45,
      active: 180,
      inactive: 120,
      new: 35
    }
    const count = estimates[segment] || 0
    setEstimatedRecipients(count)
    setEstimatedCost(count * 0.35) // 0.35 kr per SMS
  }

  const handleSend = async () => {
    if (!selectedClinic) {
      toast.error('Välj en klinik')
      return
    }

    if (!message.trim()) {
      toast.error('Skriv ett meddelande')
      return
    }

    if (recipientType === 'single' && !phoneNumber) {
      toast.error('Ange telefonnummer')
      return
    }

    setLoading(true)

    try {
      const payload: any = {
        clinicId: selectedClinic,
        message: message.trim(),
        category: 'manual'
      }

      if (recipientType === 'segment') {
        payload.segmentType = segment
      } else {
        payload.recipients = [phoneNumber]
      }

      if (timing === 'scheduled') {
        const scheduleDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
        payload.scheduledAt = scheduleDateTime.toISOString()
      }

      const res = await fetch('/api/superadmin/sms/send-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(
          timing === 'scheduled' 
            ? `SMS schemalagt! Skickas ${scheduledDate} kl ${scheduledTime}`
            : `✅ ${data.successful} SMS skickade, ${data.failed} misslyckades`
        )
        // Reset form
        setMessage('')
        setPhoneNumber('')
      } else {
        toast.error(data.error || 'Kunde inte skicka SMS')
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const characterCount = message.length
  const smsCount = Math.ceil(characterCount / 160)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skicka SMS manuellt</CardTitle>
          <CardDescription>
            För specialerbjudanden, VIP-kunder, eller tester
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Clinic Selection */}
          <div className="space-y-2">
            <Label>Välj klinik</Label>
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger>
                <SelectValue placeholder="Välj en klinik..." />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name} ({clinic.tier})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Selection */}
          <div className="space-y-4">
            <Label>Mottagare</Label>
            <RadioGroup value={recipientType} onValueChange={(v: any) => setRecipientType(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="segment" id="segment" />
                <Label htmlFor="segment" className="font-normal cursor-pointer">
                  Segment (rekommenderat)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal cursor-pointer">
                  Enskild kund
                </Label>
              </div>
            </RadioGroup>

            {recipientType === 'segment' ? (
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla kunder</SelectItem>
                  <SelectItem value="vip">VIP (&gt;10 besök)</SelectItem>
                  <SelectItem value="active">Aktiva (besök senaste 30 dagar)</SelectItem>
                  <SelectItem value="inactive">Inaktiva (&gt;30 dagar)</SelectItem>
                  <SelectItem value="new">Nya kunder (&lt;30 dagar)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="tel"
                placeholder="+46701234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            )}

            {estimatedRecipients > 0 && recipientType === 'segment' && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-semibold">{estimatedRecipients} kunder</span> kommer att få SMS
                  <br />
                  Uppskattad kostnad: <span className="font-semibold">{estimatedCost.toFixed(2)} SEK</span>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Meddelande</Label>
              <div className="text-sm text-muted-foreground">
                {characterCount}/160 tecken · {smsCount} SMS
              </div>
            </div>
            <Textarea
              placeholder="Skriv ditt meddelande här... Använd {firstName}, {clinicName} för personalisering"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            {characterCount > 160 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Meddelandet är {characterCount} tecken och kommer delas upp i {smsCount} SMS.
                  Kostnad: {(smsCount * 0.35).toFixed(2)} kr/mottagare
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Preview */}
          {message && (
            <div className="space-y-2">
              <Label>Förhandsvisning</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">
                  {message
                    .replace(/{firstName}/g, 'Anna')
                    .replace(/{clinicName}/g, clinics.find(c => c.id === selectedClinic)?.name || 'Kliniken')}
                </p>
              </div>
            </div>
          )}

          {/* Timing */}
          <div className="space-y-4">
            <Label>Timing</Label>
            <RadioGroup value={timing} onValueChange={(v: any) => setTiming(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="font-normal cursor-pointer">
                  Skicka nu
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled" className="font-normal cursor-pointer">
                  Schemalägg
                </Label>
              </div>
            </RadioGroup>

            {timing === 'scheduled' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tid</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Safety Checks */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="space-y-1">
              <p className="font-semibold">Säkerhetskontroller:</p>
              <p className="text-sm">✓ STOP-lista respekteras automatiskt</p>
              <p className="text-sm">✓ Quiet hours (22:00-08:00) enforcement</p>
              <p className="text-sm">✓ Rate limit: Kontrolleras vid sändning</p>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSend}
              disabled={loading || !selectedClinic || !message.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Skickar...
                </>
              ) : timing === 'scheduled' ? (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schemalägg SMS
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Skicka SMS
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMessage('')
                setPhoneNumber('')
                setSelectedClinic('')
              }}
            >
              Återställ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
