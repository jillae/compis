
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BackButton } from '@/components/ui/back-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Zap, Trash2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  description: string;
  triggerType: string;
  channel: string;
  subject: string;
  messageBody: string;
  usePersonalization: boolean;
  includeOffer: boolean;
  offerType: string;
  offerValue: number;
  offerUnit: string;
  offerDescription: string;
  maxExecutionsPerCustomer: number;
  cooldownDays: number;
  maxDailyExecutions: number;
  priority: number;
  isActive: boolean;
  // Condition fields
  healthStatus: string;
  daysSinceLastVisit: number;
  minLifetimeValue: number;
}

export default function EditTriggerPage() {
  const router = useRouter();
  const params = useParams();
  const triggerId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState<FormData>({
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
    healthStatus: 'AT_RISK',
    daysSinceLastVisit: 60,
    minLifetimeValue: 0,
  });

  useEffect(() => {
    fetchTrigger();
  }, [triggerId]);

  const fetchTrigger = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketing-triggers/${triggerId}`);

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Kunde inte hämta trigger');
      }

      const data = await response.json();
      const trigger = data.trigger;

      // Parse conditions JSON
      const conditions = trigger.conditions as Record<string, any> || {};
      const offerDetails = trigger.offerDetails as Record<string, any> | null;

      setFormData({
        name: trigger.name || '',
        description: trigger.description || '',
        triggerType: trigger.triggerType || 'health_status_change',
        channel: trigger.channel || 'sms',
        subject: trigger.subject || '',
        messageBody: trigger.messageBody || '',
        usePersonalization: trigger.usePersonalization ?? true,
        includeOffer: trigger.includeOffer ?? false,
        offerType: offerDetails?.type || 'discount',
        offerValue: offerDetails?.value ?? 20,
        offerUnit: offerDetails?.unit || 'percent',
        offerDescription: offerDetails?.description || '',
        maxExecutionsPerCustomer: trigger.maxExecutionsPerCustomer ?? 1,
        cooldownDays: trigger.cooldownDays ?? 30,
        maxDailyExecutions: trigger.maxDailyExecutions ?? 100,
        priority: trigger.priority ?? 5,
        isActive: trigger.isActive ?? true,
        healthStatus: conditions.healthStatus || 'AT_RISK',
        daysSinceLastVisit: conditions.daysSinceLastVisit ?? 60,
        minLifetimeValue: conditions.minLifetimeValue ?? 0,
      });
    } catch (error) {
      console.error('Error fetching trigger:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta trigger',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Build conditions object based on trigger type
      const conditions: Record<string, any> = {};

      if (formData.triggerType === 'health_status_change') {
        conditions.healthStatus = formData.healthStatus;
      } else if (formData.triggerType === 'no_visit_days') {
        conditions.daysSinceLastVisit = formData.daysSinceLastVisit;
      } else if (formData.triggerType === 'high_value_at_risk') {
        conditions.healthStatus = 'AT_RISK';
        conditions.minLifetimeValue = formData.minLifetimeValue;
      }

      const offerDetails = formData.includeOffer
        ? {
            type: formData.offerType,
            value: formData.offerValue,
            unit: formData.offerUnit,
            description: formData.offerDescription,
          }
        : null;

      const response = await fetch(`/api/marketing-triggers/${triggerId}`, {
        method: 'PATCH',
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
          title: 'Sparad',
          description: 'Triggern har uppdaterats',
        });
        router.push('/dashboard/marketing-triggers');
      } else {
        throw new Error('Failed to update trigger');
      }
    } catch (error) {
      console.error('Error updating trigger:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte spara trigger',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/marketing-triggers/${triggerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Borttagen',
          description: 'Triggern har tagits bort',
        });
        router.push('/dashboard/marketing-triggers');
      } else {
        throw new Error('Failed to delete trigger');
      }
    } catch (error) {
      console.error('Error deleting trigger:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort trigger',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const response = await fetch(`/api/marketing-triggers/${triggerId}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Trigger Kördes',
          description: `Skickade: ${data.result?.executed ?? 0}, Hoppade över: ${data.result?.skipped ?? 0}, Misslyckades: ${data.result?.failed ?? 0}`,
        });
      } else {
        throw new Error('Failed to execute trigger');
      }
    } catch (error) {
      console.error('Error executing trigger:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte köra trigger',
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard/marketing-triggers" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              Redigera Trigger
            </h1>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard/marketing-triggers" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              Trigger Hittades Inte
            </h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Denna trigger existerar inte eller har tagits bort.</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/dashboard/marketing-triggers')}
            >
              Tillbaka till Triggers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard/marketing-triggers" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              Redigera Trigger
            </h1>
            <p className="text-muted-foreground mt-1">
              Uppdatera inställningar för marknadsföringstriggern
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleExecute}
          disabled={executing}
          className="flex-shrink-0"
        >
          {executing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
              Kör...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Testa Nu
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Grundläggande Information */}
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

          {/* Trigger-villkor */}
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
                    onChange={(e) =>
                      setFormData({ ...formData, daysSinceLastVisit: parseInt(e.target.value) || 0 })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, minLifetimeValue: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meddelande */}
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
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, usePersonalization: checked })
                  }
                />
                <Label htmlFor="usePersonalization">Använd personalisering</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeOffer"
                  checked={formData.includeOffer}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includeOffer: checked })
                  }
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
                        onChange={(e) =>
                          setFormData({ ...formData, offerValue: parseInt(e.target.value) || 0 })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, offerDescription: e.target.value })
                        }
                        placeholder="t.ex. en gratis ansiktsbehandling"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Körningsregler */}
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxExecutionsPerCustomer: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cooldownDays">Cooldown (dagar)</Label>
                  <Input
                    id="cooldownDays"
                    type="number"
                    value={formData.cooldownDays}
                    onChange={(e) =>
                      setFormData({ ...formData, cooldownDays: parseInt(e.target.value) || 0 })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDailyExecutions: parseInt(e.target.value) || 0,
                      })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Aktiv</Label>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Sparar...' : 'Spara Ändringar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/marketing-triggers')}
            >
              Avbryt
            </Button>

            <div className="ml-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Tar bort...' : 'Ta Bort Trigger'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ta bort trigger?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Är du säker på att du vill ta bort triggern &quot;{formData.name}&quot;? Denna åtgärd kan inte ångras och all historik för triggern tas bort.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Ta Bort
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
