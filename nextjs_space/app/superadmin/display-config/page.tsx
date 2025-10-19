
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Wrench, 
  Monitor, 
  Megaphone,
  Save,
  RefreshCw,
  Info,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MODULE_REGISTRY, type ModuleDefinition } from '@/lib/modules/module-registry';
import { DisplayMode } from '@prisma/client';

interface DisplayModeConfig {
  id: string;
  clinicId: string;
  displayMode: DisplayMode;
  moduleKey: string;
  isVisibleToStaff: boolean;
  isVisibleToAdmin: boolean;
}

interface ConfigState {
  [displayMode: string]: {
    [moduleKey: string]: {
      isVisibleToStaff: boolean;
      isVisibleToAdmin: boolean;
    };
  };
}

const DISPLAY_MODES: { mode: DisplayMode; label: string; icon: any; description: string; color: string }[] = [
  {
    mode: 'FULL',
    label: 'Full View',
    icon: LayoutDashboard,
    description: 'Alla moduler och funktioner',
    color: 'text-blue-600',
  },
  {
    mode: 'OPERATIONS',
    label: 'Drift-läge',
    icon: Wrench,
    description: 'Daglig verksamhet',
    color: 'text-green-600',
  },
  {
    mode: 'KIOSK',
    label: 'Kiosk-läge',
    icon: Monitor,
    description: 'Reception/väntrum',
    color: 'text-purple-600',
  },
  {
    mode: 'CAMPAIGNS',
    label: 'Kampanj-läge',
    icon: Megaphone,
    description: 'Preventiva åtgärder',
    color: 'text-orange-600',
  },
];

export default function DisplayConfigPage() {
  const { data: session } = useSession() || {};
  const [configs, setConfigs] = useState<DisplayModeConfig[]>([]);
  const [configState, setConfigState] = useState<ConfigState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/display-mode/config');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs);
        
        // Build config state
        const state: ConfigState = {};
        DISPLAY_MODES.forEach(({ mode }) => {
          state[mode] = {};
          MODULE_REGISTRY.forEach((module) => {
            const config = data.configs.find(
              (c: DisplayModeConfig) => c.displayMode === mode && c.moduleKey === module.key
            );
            state[mode][module.key] = {
              isVisibleToStaff: config?.isVisibleToStaff ?? true,
              isVisibleToAdmin: config?.isVisibleToAdmin ?? true,
            };
          });
        });
        
        setConfigState(state);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Kunde inte hämta konfiguration');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (displayMode: DisplayMode, moduleKey: string, field: 'isVisibleToStaff' | 'isVisibleToAdmin') => {
    setConfigState((prev) => ({
      ...prev,
      [displayMode]: {
        ...prev[displayMode],
        [moduleKey]: {
          ...prev[displayMode][moduleKey],
          [field]: !prev[displayMode][moduleKey][field],
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all configurations
      const promises: Promise<any>[] = [];
      
      DISPLAY_MODES.forEach(({ mode }) => {
        MODULE_REGISTRY.forEach((module) => {
          const config = configState[mode]?.[module.key];
          if (config) {
            promises.push(
              fetch('/api/display-mode/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  displayMode: mode,
                  moduleKey: module.key,
                  isVisibleToStaff: config.isVisibleToStaff,
                  isVisibleToAdmin: config.isVisibleToAdmin,
                }),
              })
            );
          }
        });
      });

      await Promise.all(promises);
      toast.success('Konfiguration sparad!');
      setHasChanges(false);
      fetchConfigs();
    } catch (error) {
      console.error('Error saving configs:', error);
      toast.error('Kunde inte spara konfiguration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchConfigs();
    setHasChanges(false);
    toast.success('Återställd till sparad konfiguration');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Display Configuration Matrix</h1>
        <p className="text-muted-foreground">
          Konfigurera vilka moduler som ska visas i olika displaylägen
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Vad är Display Modes?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li><strong>FULL:</strong> Alla moduler tillgängliga (admin-vy)</li>
                <li><strong>OPERATIONS:</strong> Daglig drift - essentiella verktyg för personal</li>
                <li><strong>KIOSK:</strong> Begränsad vy för reception/väntrum (kundfacing)</li>
                <li><strong>CAMPAIGNS:</strong> Fokus på kampanjer och preventiva åtgärder</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
          <Save className="h-4 w-4" />
          Spara ändringar
        </Button>
        <Button onClick={handleReset} variant="outline" disabled={!hasChanges} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Återställ
        </Button>
        {hasChanges && (
          <Badge variant="secondary" className="ml-auto">
            Osparade ändringar
          </Badge>
        )}
      </div>

      {/* Tabs for each Display Mode */}
      <Tabs defaultValue="FULL" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {DISPLAY_MODES.map(({ mode, label, icon: Icon, color }) => (
            <TabsTrigger key={mode} value={mode} className="gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {DISPLAY_MODES.map(({ mode, label, icon: Icon, description }) => (
          <TabsContent key={mode} value={mode} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6" />
                  <div>
                    <CardTitle>{label}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Modul</th>
                        <th className="text-left py-3 px-4 font-medium">Kategori</th>
                        <th className="text-center py-3 px-4 font-medium">Status</th>
                        <th className="text-center py-3 px-4 font-medium">Synlig för Personal</th>
                        <th className="text-center py-3 px-4 font-medium">Synlig för Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULE_REGISTRY.map((module) => {
                        const config = configState[mode]?.[module.key];
                        return (
                          <tr key={module.key} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{module.name}</div>
                                <div className="text-xs text-muted-foreground">{module.description}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={module.category === 'core' ? 'default' : 'secondary'}>
                                {module.category}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={
                                  module.status === 'STABLE'
                                    ? 'default'
                                    : module.status === 'BETA'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {module.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Checkbox
                                checked={config?.isVisibleToStaff ?? true}
                                onCheckedChange={() =>
                                  handleToggle(mode, module.key, 'isVisibleToStaff')
                                }
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Checkbox
                                checked={config?.isVisibleToAdmin ?? true}
                                onCheckedChange={() =>
                                  handleToggle(mode, module.key, 'isVisibleToAdmin')
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
