
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BackButton } from '@/components/ui/back-button';
import { Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateTriggerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'health_status_change',
    channel: 'sms',
    subject: '',
    messageBody: '',
    usePersonalization: true,
    includeOffer: false,
    offerType: 'discount',
    offerValue: 20,
    offerUnit: 'percent',
    offerDescription: '',
    maxExecutionsPerCustomer: 1,
    cooldownDays: 30,
    maxDailyExecutions: 100,
    priority: 5,
    isActive: true,
    // Condition fields
    healthStatus: 'AT_RISK',
    daysSinceLastVisit: 60,
    minLifetimeValue: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build conditions object based on trigger type
      const conditions: any = {};
      
      if (formData.triggerType === 'health_status_change') {
        conditions.healthStatus = formData.healthStatus;
      } else if (formData.triggerType === 'no_visit_days') {
        conditions.daysSinceLastVisit = formData.daysSinceLastVisit;
      } else if (formData.triggerType === 'high_value_at_risk') {
        conditions.healthStatus = 'AT_RISK';
        conditions.minLifetimeValue = formData.minLifetimeValue;
      }

      const offerDetails = formData.includeOffer ? {
        type: formData.offerType,
        value: formData.offerValue,
        unit: formData.offerUnit,
        description: formData.offerDescription,
      } : null;

      const response = await fetch('/api/marketing-triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          triggerType: formData.triggerType,
          conditions,
          channel: formData.channel,
          subject: formData.subject,
          messageBody: formData.messageBody,
          usePersonalization: formData.usePersonalization,
          includeOffer: formData.includeOffer,
          offerDetails,
          maxExecutionsPerCustomer: formData.maxExecutionsPerCustomer,
          cooldownDays: formData.cooldownDays,
          maxDailyExecutions: formData.maxDailyExecutions,
          priority: formData.priority,
          isActive: formData.isActive,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Trigger Skapad',
          description: 'Marknadsföringstrigger har skapats',
        });
        router.push('/dashboard/marketing-triggers');
      } else {
        throw new Error('Failed to create trigger');
      }
    } catch (error) {
      console.error('Error creating trigger:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte skapa trigger',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard/marketing-triggers" />
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            Skapa Marknadsföringstriggern
          </h1>
          <p className="text-muted-foreground mt-1">
            Konfigurera en automatisk kampanj baserad på kundbeteende
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grundläggande Information</CardTitle>
              <CardDescription>Namnge och beskriv din trigger</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Namn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="t.ex. Återaktivera inaktiva kunder"
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beskriv syftet med denna trigger..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trigger-villkor</CardTitle>
              <CardDescription>När ska denna trigger aktiveras?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="triggerType">Trigger-typ *</Label>
                <Select
                  value={formData.triggerType}
                  onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_status_change">Hälsostatus Ändring</SelectItem>
                    <SelectItem value="no_visit_days">Ingen Visit (X dagar)</SelectItem>
                    <SelectItem value="high_value_at_risk">Högvärdeskund i Risk</SelectItem>
                    <SelectItem value="low_engagement">Låg Engagemang</SelectItem>
                    <SelectItem value="birthday">Födelsedag</SelectItem>
                    <SelectItem value="milestone">Milstolpe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.triggerType === 'health_status_change' && (
                <div>
                  <Label htmlFor="healthStatus">Hälsostatus</Label>
                  <Select
                    value={formData.healthStatus}
                    onValueChange={(value) => setFormData({ ...formData, healthStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICAL">Kritisk</SelectItem>
                      <SelectItem value="AT_RISK">I Risk</SelectItem>
                      <SelectItem value="HEALTHY">Hälsosam</SelectItem>
                      <SelectItem value="EXCELLENT">Utmärkt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.triggerType === 'no_visit_days' && (
                <div>
                  <Label htmlFor="daysSinceLastVisit">Dagar sedan senaste besök</Label>
                  <Input
                    id="daysSinceLastVisit"
                    type="number"
                    value={formData.daysSinceLastVisit}
                    onChange={(e) => setFormData({ ...formData, daysSinceLastVisit: parseInt(e.target.value) })}
                  />
                </div>
              )}

              {formData.triggerType === 'high_value_at_risk' && (
                <div>
                  <Label htmlFor="minLifetimeValue">Minimum Lifetime Value (SEK)</Label>
                  <Input
                    id="minLifetimeValue"
                    type="number"
                    value={formData.minLifetimeValue}
                    onChange={(e) => setFormData({ ...formData, minLifetimeValue: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meddelande</CardTitle>
              <CardDescription>Konfigurera kanal och innehåll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="channel">Kanal *</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value) => setFormData({ ...formData, channel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">E-post</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.channel === 'email' && (
                <div>
                  <Label htmlFor="subject">Ämnesrad *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required={formData.channel === 'email'}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="messageBody">Meddelande *</Label>
                <Textarea
                  id="messageBody"
                  value={formData.messageBody}
                  onChange={(e) => setFormData({ ...formData, messageBody: e.target.value })}
                  required
                  rows={5}
                  placeholder="Hej {firstName}, vi saknar dig! {offer}"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Använd variabler: {'{firstName}'}, {'{name}'}, {'{totalVisits}'}, {'{lifetimeValue}'}, {'{offer}'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="usePersonalization"
                  checked={formData.usePersonalization}
                  onCheckedChange={(checked) => setFormData({ ...formData, usePersonalization: checked })}
                />
                <Label htmlFor="usePersonalization">Använd personalisering</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeOffer"
                  checked={formData.includeOffer}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeOffer: checked })}
                />
                <Label htmlFor="includeOffer">Inkludera erbjudande</Label>
              </div>

              {formData.includeOffer && (
                <div className="space-y-4 ml-6 p-4 border rounded-lg">
                  <div>
                    <Label>Erbjudandetyp</Label>
                    <Select
                      value={formData.offerType}
                      onValueChange={(value) => setFormData({ ...formData, offerType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Rabatt</SelectItem>
                        <SelectItem value="freebie">Gratis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Värde</Label>
                      <Input
                        type="number"
                        value={formData.offerValue}
                        onChange={(e) => setFormData({ ...formData, offerValue: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Enhet</Label>
                      <Select
                        value={formData.offerUnit}
                        onValueChange={(value) => setFormData({ ...formData, offerUnit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Procent (%)</SelectItem>
                          <SelectItem value="sek">SEK</SelectItem>
                          <SelectItem value="item">Artikel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formData.offerType === 'freebie' && (
                    <div>
                      <Label>Beskrivning</Label>
                      <Input
                        value={formData.offerDescription}
                        onChange={(e) => setFormData({ ...formData, offerDescription: e.target.value })}
                        placeholder="t.ex. en gratis ansiktsbehandling"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Körningsregler</CardTitle>
              <CardDescription>Hantera frekvens och begränsningar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxExecutionsPerCustomer">Max per kund</Label>
                  <Input
                    id="maxExecutionsPerCustomer"
                    type="number"
                    value={formData.maxExecutionsPerCustomer}
                    onChange={(e) => setFormData({ ...formData, maxExecutionsPerCustomer: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="cooldownDays">Cooldown (dagar)</Label>
                  <Input
                    id="cooldownDays"
                    type="number"
                    value={formData.cooldownDays}
                    onChange={(e) => setFormData({ ...formData, cooldownDays: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxDailyExecutions">Max per dag</Label>
                  <Input
                    id="maxDailyExecutions"
                    type="number"
                    value={formData.maxDailyExecutions}
                    onChange={(e) => setFormData({ ...formData, maxDailyExecutions: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Prioritet (1-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Aktivera direkt</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Skapar...' : 'Skapa Trigger'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/marketing-triggers')}
            >
              Avbryt
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
