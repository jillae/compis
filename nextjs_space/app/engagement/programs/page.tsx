
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoyaltyProgramForm from '@/components/loyalty-program-form';
import { Plus, Users, Calendar, ToggleLeft, ToggleRight, Monitor, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/engagement/programs');
      const data = await response.json();
      setPrograms(data.programs || []);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const toggleProgramStatus = async (programId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/engagement/programs/${programId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      fetchPrograms();
    } catch (error) {
      console.error('Failed to toggle program:', error);
    }
  };

  const copyKioskUrl = async (programId: string) => {
    const kioskUrl = `${window.location.origin}/kiosk/${programId}`;
    
    try {
      await navigator.clipboard.writeText(kioskUrl);
      setCopiedId(programId);
      
      toast({
        title: 'Kiosk-URL kopierad!',
        description: 'Öppna denna URL på din display-skärm',
      });

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Kunde inte kopiera',
        description: 'Försök igen',
        variant: 'destructive',
      });
    }
  };

  const openKiosk = (programId: string) => {
    const kioskUrl = `/kiosk/${programId}`;
    window.open(kioskUrl, '_blank', 'fullscreen=yes,toolbar=no,menubar=no,scrollbars=no,resizable=no');
  };

  if (loading) {
    return <div className="p-8">Laddar...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lojalitetsprogram</h1>
          <p className="text-gray-600 mt-2">
            Hantera dina stämpelkortsprogram och belöningar
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Visa Lista' : 'Nytt Program'}
        </Button>
      </div>

      {showForm ? (
        <LoyaltyProgramForm
          onSuccess={() => {
            setShowForm(false);
            fetchPrograms();
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 mb-4">Inga program än</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Skapa Ditt Första Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            programs.map((program) => {
              const redeemRule = program.redeemRule as any;
              const stampsRequired = Object.keys(redeemRule)[0];
              const rewardDescription = redeemRule[stampsRequired];

              return (
                <Card key={program.id} className="relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 right-0 h-2"
                    style={{ backgroundColor: program.backgroundColor }}
                  />
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {program.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProgramStatus(program.id, program.isActive)}
                      >
                        {program.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                    </CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{stampsRequired} stämplar krävs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{program._count?.loyaltyCards || 0} aktiva kort</span>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-yellow-800">Belöning:</p>
                      <p className="text-yellow-700">{rewardDescription}</p>
                    </div>

                    {/* Kiosk Mode Section */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Monitor className="w-4 h-4" />
                        <span>Kiosk Display</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => copyKioskUrl(program.id)}
                        >
                          {copiedId === program.id ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-green-600" />
                              Kopierad!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Kopiera URL
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openKiosk(program.id)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {program.isDraft && (
                      <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        Utkast
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
