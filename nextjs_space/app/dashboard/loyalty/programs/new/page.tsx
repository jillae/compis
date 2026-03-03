'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  Stamp,
  Star,
  Layers,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import Link from 'next/link';

type ProgramType = 'stamps' | 'points' | 'hybrid';

interface Reward {
  name: string;
  description: string;
  requiredStamps: number;
  requiredPoints: number;
  valueSEK: number;
  discountPercent: number;
}

const PRESET_COLORS = [
  '#4f46e5', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#db2777', '#1d4ed8',
];

export default function NewLoyaltyProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programType, setProgramType] = useState<ProgramType>('stamps');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    backgroundColor: '#4f46e5',
    welcomeSms: '',
    stampsExpireDays: '',
    pointsExpireDays: '',
    stampsPerVisit: '1',
    pointsPerVisit: '10',
    isDraft: false,
  });

  const [rewards, setRewards] = useState<Reward[]>([
    {
      name: 'Gratis behandling',
      description: '',
      requiredStamps: 10,
      requiredPoints: 0,
      valueSEK: 500,
      discountPercent: 0,
    },
  ]);

  const updateField = (key: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addReward = () => {
    setRewards((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        requiredStamps: 10,
        requiredPoints: 0,
        valueSEK: 0,
        discountPercent: 0,
      },
    ]);
  };

  const updateReward = (index: number, key: keyof Reward, value: string | number) => {
    setRewards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const removeReward = (index: number) => {
    setRewards((prev) => prev.filter((_, i) => i !== index));
  };

  const buildEarnRule = () => {
    if (programType === 'stamps') {
      return { type: 'stamp', value: parseInt(formData.stampsPerVisit) || 1 };
    } else if (programType === 'points') {
      return { type: 'points', value: parseInt(formData.pointsPerVisit) || 10 };
    } else {
      return {
        type: 'hybrid',
        stamps: parseInt(formData.stampsPerVisit) || 1,
        points: parseInt(formData.pointsPerVisit) || 5,
      };
    }
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!formData.name.trim()) {
      setError('Programmets namn är obligatoriskt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const earnRule = buildEarnRule();
      const redeemRule: Record<string, string> = {};
      rewards.forEach((r) => {
        if (r.requiredStamps > 0) redeemRule[r.requiredStamps] = r.name;
      });

      // Create program
      const programRes = await fetch('/api/loyalty/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          code: formData.code || undefined,
          earnRule,
          redeemRule,
          backgroundColor: formData.backgroundColor,
          welcomeSms: formData.welcomeSms || undefined,
          stampsExpireDays: formData.stampsExpireDays
            ? parseInt(formData.stampsExpireDays)
            : undefined,
          pointsExpireDays: formData.pointsExpireDays
            ? parseInt(formData.pointsExpireDays)
            : undefined,
          isDraft: asDraft,
          isActive: !asDraft,
          validDays: [1, 2, 3, 4, 5, 6, 7],
        }),
      });

      if (!programRes.ok) {
        const data = await programRes.json();
        throw new Error(data.error ?? 'Kunde inte skapa programmet');
      }

      const { program } = await programRes.json();

      // Create rewards
      for (const reward of rewards) {
        if (!reward.name.trim()) continue;
        await fetch('/api/loyalty/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_reward',
            programId: program.id,
            ...reward,
          }),
        });
      }

      router.push('/dashboard/loyalty');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  const programTypeOptions: { value: ProgramType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: 'stamps',
      label: 'Stämpelkort',
      desc: 'En stämpel per besök – enkelt och klassiskt',
      icon: <Stamp className="h-5 w-5" />,
    },
    {
      value: 'points',
      label: 'Poängkort',
      desc: 'Poäng baserade på spend eller aktivitet',
      icon: <Star className="h-5 w-5" />,
    },
    {
      value: 'hybrid',
      label: 'Hybrid',
      desc: 'Kombinera stämplar och poäng',
      icon: <Layers className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/loyalty">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Nytt lojalitetsprogram</h1>
          <p className="text-sm text-zinc-400">Konfigurera stämpelkort, poäng och belöningar</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        {/* Programtyp */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-zinc-100">Typ av program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {programTypeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setProgramType(opt.value)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors min-h-[60px] ${
                  programType === opt.value
                    ? 'border-emerald-600 bg-emerald-950/30'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    programType === opt.value ? 'text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-100 text-sm">{opt.label}</span>
                    {programType === opt.value && (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Grundinfo */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-zinc-100">Grundinformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">
                Programnamn <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="t.ex. Stamkunds-kort"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Beskrivning</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Beskriv programmet för kunderna..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Kod (valfri)</Label>
              <Input
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder="t.ex. STAMKUND23"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[44px] font-mono"
              />
              <p className="text-xs text-zinc-500">Kunder kan använda koden för att gå med</p>
            </div>
          </CardContent>
        </Card>

        {/* Intjäningsregler */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-zinc-100">Intjäningsregler</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Hur mycket kunden tjänar per besök
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(programType === 'stamps' || programType === 'hybrid') && (
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Stämplar per besök</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.stampsPerVisit}
                  onChange={(e) => updateField('stampsPerVisit', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[44px]"
                />
              </div>
            )}

            {(programType === 'points' || programType === 'hybrid') && (
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Poäng per besök</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.pointsPerVisit}
                  onChange={(e) => updateField('pointsPerVisit', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[44px]"
                />
              </div>
            )}

            {programType === 'stamps' && (
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Stämplar går ut efter (dagar, valfri)</Label>
                <Input
                  type="number"
                  min="30"
                  value={formData.stampsExpireDays}
                  onChange={(e) => updateField('stampsExpireDays', e.target.value)}
                  placeholder="t.ex. 365"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[44px]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Belöningar */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-zinc-100">Belöningar</CardTitle>
                <CardDescription className="text-zinc-400 text-sm mt-0.5">
                  Vad kunden kan lösa in sina stämplar/poäng mot
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addReward}
                className="min-h-[36px] border-zinc-700 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Lägg till
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rewards.map((reward, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                    Belöning {index + 1}
                  </span>
                  {rewards.length > 1 && (
                    <button
                      onClick={() => removeReward(index)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Namn</Label>
                  <Input
                    value={reward.name}
                    onChange={(e) => updateReward(index, 'name', e.target.value)}
                    placeholder="t.ex. Gratis behandling"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(programType === 'stamps' || programType === 'hybrid') && (
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs">Kräver stämplar</Label>
                      <Input
                        type="number"
                        min="1"
                        value={reward.requiredStamps}
                        onChange={(e) =>
                          updateReward(index, 'requiredStamps', parseInt(e.target.value) || 0)
                        }
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[44px]"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">Värde (kr)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={reward.valueSEK}
                      onChange={(e) =>
                        updateReward(index, 'valueSEK', parseFloat(e.target.value) || 0)
                      }
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Design */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-zinc-100">Kortdesign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Kortfärg</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateField('backgroundColor', color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      formData.backgroundColor === color
                        ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => updateField('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0"
                  title="Välj anpassad färg"
                />
              </div>
            </div>

            {/* Kortförhandsgranskning */}
            <div
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{ backgroundColor: formData.backgroundColor }}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-base truncate">
                  {formData.name || 'Programnamn'}
                </span>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  Aktiv
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full border-2 border-white/40 ${
                      i < 3 ? 'bg-white' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-white/70 text-xs">3 / 10 stämplar</span>
                <span className="text-white/70 text-xs">Förhandsvy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Välkomst-SMS */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-zinc-100">Välkomstmeddelande (valfri)</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Skickas automatiskt när kunden registrerar sig
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.welcomeSms}
              onChange={(e) => updateField('welcomeSms', e.target.value)}
              placeholder="Välkommen till vårt lojalitetsprogram! Visa det här meddelandet i kassan för din första stämpel."
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="flex-1 min-h-[48px] border-zinc-700 hover:bg-zinc-800"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Spara som utkast
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Aktivera program
          </Button>
        </div>
      </div>
    </div>
  );
}
