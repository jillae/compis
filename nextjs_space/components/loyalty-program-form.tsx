
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoyaltyProgramFormProps {
  onSuccess?: () => void;
  initialData?: any;
}

export default function LoyaltyProgramForm({ onSuccess, initialData }: LoyaltyProgramFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    stampsRequired: initialData?.stampsRequired || 10,
    rewardDescription: initialData?.rewardDescription || '',
    backgroundColor: initialData?.backgroundColor || '#6366f1',
    isActive: initialData?.isActive ?? true,
    isDraft: initialData?.isDraft ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData?.id 
        ? `/api/billing/programs/${initialData.id}`
        : '/api/billing/programs';
      
      const method = initialData?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess?.();
      } else {
        const data = await response.json();
        alert(data.error || 'Något gick fel');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData?.id ? 'Redigera' : 'Skapa'} Lojalitetsprogram</CardTitle>
        <CardDescription>
          Konfigurera ditt stämpelkortsprogram och belöningar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Programnamn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="T.ex. Lojalitetsprogram 2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beskriv programmet för dina kunder..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stampsRequired">Antal stämplar krävs *</Label>
              <Input
                id="stampsRequired"
                type="number"
                min="1"
                max="50"
                value={formData.stampsRequired}
                onChange={(e) => setFormData({ ...formData, stampsRequired: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Färg</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rewardDescription">Belöning *</Label>
            <Input
              id="rewardDescription"
              value={formData.rewardDescription}
              onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
              placeholder="T.ex. 20% rabatt på nästa behandling"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Aktivt program</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDraft}
                onChange={(e) => setFormData({ ...formData, isDraft: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Utkast (ej synligt för kunder)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                initialData?.id ? 'Uppdatera Program' : 'Skapa Program'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
