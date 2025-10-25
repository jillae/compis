
/**
 * Display Preferences Page
 * Customize theme, display mode, and UI settings
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, Monitor, Eye, Layout, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DisplayPreferencesPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Preferences state
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load saved preferences from localStorage
    const savedCompactMode = localStorage.getItem('compactMode') === 'true';
    const savedAnimations = localStorage.getItem('animationsEnabled') !== 'false';
    const savedHighContrast = localStorage.getItem('highContrastMode') === 'true';
    
    setCompactMode(savedCompactMode);
    setAnimationsEnabled(savedAnimations);
    setHighContrastMode(savedHighContrast);
    
    // Apply preferences
    if (savedCompactMode) {
      document.documentElement.classList.add('compact-mode');
    }
    if (!savedAnimations) {
      document.documentElement.classList.add('no-animations');
    }
    if (savedHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: '✨ Tema uppdaterat',
      description: `Bytte till ${newTheme === 'dark' ? 'mörkt' : newTheme === 'light' ? 'ljust' : 'systemets'} läge`,
    });
  };

  const toggleCompactMode = (enabled: boolean) => {
    setCompactMode(enabled);
    localStorage.setItem('compactMode', enabled.toString());
    
    if (enabled) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
    
    toast({
      title: enabled ? '📐 Kompakt läge aktiverat' : '📐 Kompakt läge avaktiverat',
      description: enabled ? 'Mindre padding och tätare layout' : 'Standard layout återställd',
    });
  };

  const toggleAnimations = (enabled: boolean) => {
    setAnimationsEnabled(enabled);
    localStorage.setItem('animationsEnabled', enabled.toString());
    
    if (!enabled) {
      document.documentElement.classList.add('no-animations');
    } else {
      document.documentElement.classList.remove('no-animations');
    }
    
    toast({
      title: enabled ? '✨ Animationer aktiverade' : '✨ Animationer avaktiverade',
      description: enabled ? 'Smidiga övergångar och effekter' : 'Snabbare rendering utan animationer',
    });
  };

  const toggleHighContrast = (enabled: boolean) => {
    setHighContrastMode(enabled);
    localStorage.setItem('highContrastMode', enabled.toString());
    
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    toast({
      title: enabled ? '🔆 Hög kontrast aktiverad' : '🔆 Hög kontrast avaktiverad',
      description: enabled ? 'Förbättrad läsbarhet' : 'Standard kontrast återställd',
    });
  };

  const resetToDefaults = () => {
    setTheme('system');
    setCompactMode(false);
    setAnimationsEnabled(true);
    setHighContrastMode(false);
    
    localStorage.removeItem('compactMode');
    localStorage.removeItem('animationsEnabled');
    localStorage.removeItem('highContrastMode');
    
    document.documentElement.classList.remove('compact-mode', 'no-animations', 'high-contrast');
    
    toast({
      title: '🔄 Inställningar återställda',
      description: 'Alla visningsinställningar är nu standard',
    });
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Visningsinställningar</h1>
          <p className="text-muted-foreground mt-2">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Visningsinställningar</h1>
        <p className="text-muted-foreground mt-2">
          Anpassa hur Flow ser ut och beter sig
        </p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : theme === 'light' ? <Sun className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            Färgtema
          </CardTitle>
          <CardDescription>
            Välj mellan ljust, mörkt eller systemets tema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="theme-select">Tema</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme-select" className="w-full md:w-[300px]">
                <SelectValue placeholder="Välj tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Ljust läge
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Mörkt läge
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Systemets tema
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="aspect-video rounded bg-white shadow-sm mb-2"></div>
              <p className="text-sm font-medium">Ljust</p>
            </button>
            
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="aspect-video rounded bg-gray-900 shadow-sm mb-2"></div>
              <p className="text-sm font-medium">Mörkt</p>
            </button>
            
            <button
              onClick={() => handleThemeChange('system')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'system' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="aspect-video rounded bg-gradient-to-br from-white to-gray-900 shadow-sm mb-2"></div>
              <p className="text-sm font-medium">System</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout & Beteende
          </CardTitle>
          <CardDescription>
            Anpassa hur innehåll visas och fungerar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode" className="text-base">
                Kompakt läge
              </Label>
              <p className="text-sm text-muted-foreground">
                Minska padding och marginaler för tätare layout
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={toggleCompactMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="animations" className="text-base">
                Animationer
              </Label>
              <p className="text-sm text-muted-foreground">
                Aktivera smidiga övergångar och effekter
              </p>
            </div>
            <Switch
              id="animations"
              checked={animationsEnabled}
              onCheckedChange={toggleAnimations}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast" className="text-base">
                Hög kontrast
              </Label>
              <p className="text-sm text-muted-foreground">
                Förbättra läsbarhet med högre kontrast
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={highContrastMode}
              onCheckedChange={toggleHighContrast}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Tillgänglighet
          </CardTitle>
          <CardDescription>
            Anpassa för bättre användarvänlighet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Flow följer WCAG 2.1 riktlinjer för tillgänglighet. Alla funktioner kan användas med tangentbord,
            och skärmläsare stöds fullt ut.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer">
                Läs mer om WCAG
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={resetToDefaults} variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Återställ till standard
        </Button>
        <Button onClick={() => router.push('/dashboard')}>
          Tillbaka till Dashboard
        </Button>
      </div>
    </div>
  );
}
