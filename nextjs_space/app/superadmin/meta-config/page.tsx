
/**
 * Meta Configuration Page (SuperAdmin)
 * Configure Meta Pixel ID and credentials per clinic
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, ExternalLink, Building2, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/client-types';

interface Clinic {
  id: string;
  name: string;
  metaPixelId: string | null;
  metaAccessToken: string | null;
  metaAdAccountId: string | null;
  metaAppId: string | null;
  metaAppSecret: string | null;
}

interface MetaConfig {
  clinics: Clinic[];
}

export default function MetaConfigPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [config, setConfig] = useState<MetaConfig | null>(null);
  const [editedClinics, setEditedClinics] = useState<Record<string, Partial<Clinic>>>({});

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      router.replace('/dashboard');
      return;
    }

    loadConfig();
  }, [session, status, router]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/superadmin/meta-config');
      if (!response.ok) throw new Error('Failed to load configuration');

      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load Meta config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (clinicId: string, field: string, value: string) => {
    setEditedClinics((prev) => ({
      ...prev,
      [clinicId]: {
        ...prev[clinicId],
        [field]: value,
      },
    }));
  };

  const saveClinicConfig = async (clinic: Clinic) => {
    setSaving(clinic.id);
    try {
      const updates = editedClinics[clinic.id] || {};
      const response = await fetch('/api/superadmin/meta-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic.id,
          metaPixelId: updates.metaPixelId ?? clinic.metaPixelId,
          metaAccessToken: updates.metaAccessToken ?? clinic.metaAccessToken,
          metaAdAccountId: updates.metaAdAccountId ?? clinic.metaAdAccountId,
        }),
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      toast({
        title: '✅ Configuration Saved',
        description: `Meta settings updated for ${clinic.name}`,
      });

      // Clear edits and reload
      setEditedClinics((prev) => {
        const newEdits = { ...prev };
        delete newEdits[clinic.id];
        return newEdits;
      });
      
      loadConfig();
    } catch (error) {
      console.error('Failed to save Meta config:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const hasChanges = (clinicId: string) => {
    return !!editedClinics[clinicId] && Object.keys(editedClinics[clinicId]).length > 0;
  };

  const isConfigured = (clinic: Clinic) => {
    const edited = editedClinics[clinic.id];
    const pixelId = edited?.metaPixelId ?? clinic.metaPixelId;
    const accessToken = edited?.metaAccessToken ?? clinic.metaAccessToken;
    const adAccountId = edited?.metaAdAccountId ?? clinic.metaAdAccountId;
    
    return !!(pixelId && accessToken && adAccountId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>Failed to load Meta configuration</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Meta Marketing Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure Meta Pixel ID and API credentials for each clinic
        </p>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          <strong>How to get Meta Pixel ID:</strong>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>
              Go to{' '}
              <a
                href="https://business.facebook.com/events_manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Meta Events Manager
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Select the Pixel for the clinic</li>
            <li>Copy the Pixel ID (it looks like: 1234567890123456)</li>
            <li>Paste it here for the corresponding clinic</li>
          </ol>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {config.clinics.map((clinic) => {
          const edited = editedClinics[clinic.id] || {};
          const configured = isConfigured(clinic);
          
          return (
            <Card key={clinic.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5" />
                    <CardTitle>{clinic.name}</CardTitle>
                    {configured ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                  </div>
                  {hasChanges(clinic.id) && (
                    <Badge variant="outline" className="text-amber-600">
                      Unsaved Changes
                    </Badge>
                  )}
                </div>
                <CardDescription>Clinic ID: {clinic.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`pixel-${clinic.id}`}>Meta Pixel ID *</Label>
                    <Input
                      id={`pixel-${clinic.id}`}
                      value={edited.metaPixelId ?? clinic.metaPixelId ?? ''}
                      onChange={(e) =>
                        handleInputChange(clinic.id, 'metaPixelId', e.target.value)
                      }
                      placeholder="1234567890123456"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`ad-account-${clinic.id}`}>Ad Account ID *</Label>
                    <Input
                      id={`ad-account-${clinic.id}`}
                      value={edited.metaAdAccountId ?? clinic.metaAdAccountId ?? ''}
                      onChange={(e) =>
                        handleInputChange(clinic.id, 'metaAdAccountId', e.target.value)
                      }
                      placeholder="act_1234567890123456"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`token-${clinic.id}`}>Access Token *</Label>
                  <Input
                    id={`token-${clinic.id}`}
                    type="password"
                    value={edited.metaAccessToken ?? clinic.metaAccessToken ?? ''}
                    onChange={(e) =>
                      handleInputChange(clinic.id, 'metaAccessToken', e.target.value)
                    }
                    placeholder="EAAxxxxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Long-lived access token from Meta Business Manager
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => saveClinicConfig(clinic)}
                    disabled={saving === clinic.id || !hasChanges(clinic.id)}
                    size="sm"
                  >
                    {saving === clinic.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>

                  {hasChanges(clinic.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedClinics((prev) => {
                          const newEdits = { ...prev };
                          delete newEdits[clinic.id];
                          return newEdits;
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {config.clinics.length === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No clinics found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
