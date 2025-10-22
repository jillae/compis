
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Info, 
  ExternalLink, 
  Upload, 
  Calendar,
  Zap,
  AlertCircle 
} from 'lucide-react'

export interface BookingSystem {
  id: string
  name: string
  hasApi: boolean
  apiDocUrl?: string
  popularity: 'high' | 'medium' | 'low'
  country: 'se' | 'no' | 'dk' | 'fi' | 'global'
}

export const BOOKING_SYSTEMS: BookingSystem[] = [
  // Swedish systems (most popular)
  { id: 'bokadirekt', name: 'Bokadirekt', hasApi: true, apiDocUrl: 'https://api.bokadirekt.se/docs', popularity: 'high', country: 'se' },
  { id: 'timify', name: 'Timify', hasApi: true, apiDocUrl: 'https://help.timify.com/hc/en-us/sections/360001150199-API', popularity: 'high', country: 'global' },
  { id: 'bokamera', name: 'Bokamera', hasApi: true, apiDocUrl: 'https://bokamera.se/api', popularity: 'medium', country: 'se' },
  { id: 'timepal', name: 'Timepal', hasApi: true, apiDocUrl: 'https://www.timepal.se/api', popularity: 'medium', country: 'se' },
  
  // Nordic systems
  { id: 'simplybook', name: 'SimplyBook.me', hasApi: true, apiDocUrl: 'https://simplybook.me/en/api', popularity: 'medium', country: 'global' },
  { id: 'bookingkit', name: 'BookingKit', hasApi: true, apiDocUrl: 'https://www.bookingkit.de/api', popularity: 'low', country: 'global' },
  { id: 'resursbokaren', name: 'Resursbokaren', hasApi: false, popularity: 'low', country: 'se' },
  { id: 'appointfix', name: 'AppointFix', hasApi: true, apiDocUrl: 'https://www.appointfix.com/api-documentation', popularity: 'low', country: 'global' },
  
  // Global platforms
  { id: 'calendly', name: 'Calendly', hasApi: true, apiDocUrl: 'https://developer.calendly.com', popularity: 'high', country: 'global' },
  { id: 'acuity', name: 'Acuity Scheduling', hasApi: true, apiDocUrl: 'https://developers.acuityscheduling.com', popularity: 'medium', country: 'global' },
  { id: 'square', name: 'Square Appointments', hasApi: true, apiDocUrl: 'https://developer.squareup.com', popularity: 'medium', country: 'global' },
  { id: 'setmore', name: 'Setmore', hasApi: true, apiDocUrl: 'https://developer.setmore.com', popularity: 'low', country: 'global' },
  { id: 'appointy', name: 'Appointy', hasApi: true, apiDocUrl: 'https://www.appointy.com/api', popularity: 'low', country: 'global' },
  { id: 'vcita', name: 'vcita', hasApi: true, apiDocUrl: 'https://developers.vcita.com', popularity: 'low', country: 'global' },
  { id: 'planity', name: 'Planity', hasApi: true, apiDocUrl: 'https://api.planity.com', popularity: 'low', country: 'global' },
  
  // Salon-specific
  { id: 'fresha', name: 'Fresha (formerly Shedul)', hasApi: true, apiDocUrl: 'https://www.fresha.com/developers', popularity: 'medium', country: 'global' },
  { id: 'vagaro', name: 'Vagaro', hasApi: true, apiDocUrl: 'https://www.vagaro.com/api', popularity: 'low', country: 'global' },
  { id: 'glossgenius', name: 'GlossGenius', hasApi: false, popularity: 'low', country: 'global' },
  { id: 'boulevard', name: 'Boulevard', hasApi: true, apiDocUrl: 'https://developer.boulevard.io', popularity: 'low', country: 'global' },
  { id: 'zenoti', name: 'Zenoti', hasApi: true, apiDocUrl: 'https://developers.zenoti.com', popularity: 'low', country: 'global' },
  { id: 'mindbody', name: 'Mindbody', hasApi: true, apiDocUrl: 'https://developers.mindbodyonline.com', popularity: 'medium', country: 'global' },
  
  // Fallback
  { id: 'other', name: 'Annat system', hasApi: false, popularity: 'medium', country: 'global' },
  { id: 'none', name: 'Inget bokningssystem', hasApi: false, popularity: 'low', country: 'global' },
]

interface BookingSystemSelectorProps {
  onSelect: (system: BookingSystem, integrationMethod: 'api' | 'manual') => void
  defaultSystem?: string
}

export function BookingSystemSelector({ onSelect, defaultSystem }: BookingSystemSelectorProps) {
  const [selectedSystemId, setSelectedSystemId] = useState<string>(defaultSystem || '')
  const [integrationMethod, setIntegrationMethod] = useState<'api' | 'manual' | null>(null)
  
  const selectedSystem = BOOKING_SYSTEMS.find(s => s.id === selectedSystemId)

  const handleSystemChange = (systemId: string) => {
    setSelectedSystemId(systemId)
    setIntegrationMethod(null) // Reset integration method when system changes
  }

  const handleIntegrationChoice = (method: 'api' | 'manual') => {
    setIntegrationMethod(method)
    if (selectedSystem) {
      onSelect(selectedSystem, method)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Välj ditt bokningssystem
        </CardTitle>
        <CardDescription>
          Flow fungerar med alla bokningssystem. Välj ditt system nedan för att komma igång.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* System Selector */}
        <div className="space-y-2">
          <Label htmlFor="booking-system">Bokningssystem</Label>
          <Select value={selectedSystemId} onValueChange={handleSystemChange}>
            <SelectTrigger id="booking-system">
              <SelectValue placeholder="Välj ditt bokningssystem..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" disabled>Välj system...</SelectItem>
              
              {/* Swedish systems first */}
              <SelectItem value="" disabled className="font-semibold text-xs text-gray-500">
                🇸🇪 SVENSKA SYSTEM (REKOMMENDERAT)
              </SelectItem>
              {BOOKING_SYSTEMS
                .filter(s => s.country === 'se')
                .map(system => (
                  <SelectItem key={system.id} value={system.id}>
                    {system.name} {system.hasApi ? '✓ API' : ''}
                  </SelectItem>
                ))}
              
              {/* Global popular systems */}
              <SelectItem value="" disabled className="font-semibold text-xs text-gray-500 mt-2">
                🌍 GLOBALA SYSTEM
              </SelectItem>
              {BOOKING_SYSTEMS
                .filter(s => s.country === 'global' && s.popularity !== 'low')
                .map(system => (
                  <SelectItem key={system.id} value={system.id}>
                    {system.name} {system.hasApi ? '✓ API' : ''}
                  </SelectItem>
                ))}
              
              {/* Other systems */}
              <SelectItem value="" disabled className="font-semibold text-xs text-gray-500 mt-2">
                📋 ÖVRIGA SYSTEM
              </SelectItem>
              {BOOKING_SYSTEMS
                .filter(s => s.country === 'global' && s.popularity === 'low')
                .map(system => (
                  <SelectItem key={system.id} value={system.id}>
                    {system.name} {system.hasApi ? '✓ API' : ''}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Integration Method Selection */}
        {selectedSystem && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4">
            <Label>Hur vill du ansluta {selectedSystem.name}?</Label>
            
            <div className="grid gap-4">
              {/* API Integration */}
              {selectedSystem.hasApi && (
                <button
                  onClick={() => handleIntegrationChoice('api')}
                  className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                    integrationMethod === 'api'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Zap className={`h-5 w-5 mt-0.5 ${integrationMethod === 'api' ? 'text-blue-600' : 'text-gray-600'}`} />
                    <div className="flex-1">
                      <div className="font-semibold mb-1">
                        Automatisk sync (API) 
                        <span className="ml-2 text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded">Rekommenderat</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Bokningar, kunder och behandlingar synkas automatiskt i realtid.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle className="h-3 w-3" /> Realtidsuppdateringar
                        <CheckCircle className="h-3 w-3" /> Ingen manuell hantering
                        <CheckCircle className="h-3 w-3" /> Alla funktioner
                      </div>
                    </div>
                  </div>
                  {selectedSystem.apiDocUrl && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <a
                        href={selectedSystem.apiDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <Info className="h-3 w-3" />
                        API-dokumentation
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </button>
              )}

              {/* Manual Import */}
              <button
                onClick={() => handleIntegrationChoice('manual')}
                className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                  integrationMethod === 'manual'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Upload className={`h-5 w-5 mt-0.5 ${integrationMethod === 'manual' ? 'text-purple-600' : 'text-gray-600'}`} />
                  <div className="flex-1">
                    <div className="font-semibold mb-1">
                      Manuell import (CSV/Excel)
                      {!selectedSystem.hasApi && (
                        <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Enda alternativ</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Ladda upp bokningsdata från Excel eller exportera från ditt system.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="h-3 w-3" /> Snabb start
                      <CheckCircle className="h-3 w-3" /> Ingen API-konfiguration
                      <CheckCircle className="h-3 w-3" /> Fungerar alltid
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Helpful Alerts */}
            {selectedSystem.hasApi && integrationMethod === 'api' && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  <strong>Nästa steg:</strong> Du kommer att behöva API-nycklar från {selectedSystem.name}. 
                  Vi guidar dig genom processen på nästa sida.
                </AlertDescription>
              </Alert>
            )}

            {integrationMethod === 'manual' && (
              <Alert className="bg-purple-50 border-purple-200">
                <Info className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-sm">
                  <strong>Nästa steg:</strong> Du kan ladda upp en CSV-fil med bokningsdata, eller använda Flow utan historisk data 
                  (perfekt för nya kliniker!).
                </AlertDescription>
              </Alert>
            )}

            {selectedSystem.id === 'none' && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <strong>Observera:</strong> Utan bokningssystem kommer vissa funktioner (som kapacitetsplanering och no-show-förutsägelse) 
                  att vara begränsade. Du kan fortfarande använda Flow för kundhantering och analys.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>

      {selectedSystem && integrationMethod && (
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedSystemId('')
              setIntegrationMethod(null)
            }}
          >
            Ändra system
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => handleIntegrationChoice(integrationMethod)}
          >
            Fortsätt
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
