
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DisplayMode } from '@/lib/client-types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Wrench, 
  Monitor, 
  Megaphone,
  ChevronDown,
} from 'lucide-react'

const DISPLAY_MODE_CONFIG = {
  FULL: {
    label: 'Full View',
    description: 'Alla moduler och funktioner',
    icon: LayoutDashboard,
    color: 'text-blue-600',
  },
  OPERATIONS: {
    label: 'Drift-läge',
    description: 'Daglig verksamhet',
    icon: Wrench,
    color: 'text-green-600',
  },
  KIOSK: {
    label: 'Kiosk-läge',
    description: 'Reception/väntrum',
    icon: Monitor,
    color: 'text-purple-600',
  },
  CAMPAIGNS: {
    label: 'Kampanj-läge',
    description: 'Preventiva åtgärder',
    icon: Megaphone,
    color: 'text-orange-600',
  },
}

export function DisplayModeSwitcher() {
  const { data: session } = useSession() || {}
  const [activeMode, setActiveMode] = useState<DisplayMode>('FULL')
  const [loading, setLoading] = useState(false)

  // Fetch current display mode
  useEffect(() => {
    async function fetchDisplayMode() {
      try {
        const res = await fetch('/api/display-mode')
        if (res.ok) {
          const data = await res.json()
          setActiveMode(data.activeDisplayMode || 'FULL')
        }
      } catch (error) {
        console.error('Error fetching display mode:', error)
      }
    }

    if (session?.user) {
      fetchDisplayMode()
    }
  }, [session])

  const handleModeChange = async (mode: DisplayMode) => {
    setLoading(true)
    try {
      const res = await fetch('/api/display-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayMode: mode }),
      })

      if (res.ok) {
        const data = await res.json()
        setActiveMode(data.activeDisplayMode)
        // Refresh page to apply new display mode
        window.location.reload()
      }
    } catch (error) {
      console.error('Error changing display mode:', error)
    } finally {
      setLoading(false)
    }
  }

  const config = DISPLAY_MODE_CONFIG[activeMode]
  const Icon = config.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className="gap-2"
        >
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className="hidden md:inline">{config.label}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Visningsläge</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(DISPLAY_MODE_CONFIG).map(([mode, cfg]) => {
          const ModeIcon = cfg.icon
          const isActive = mode === activeMode
          return (
            <DropdownMenuItem
              key={mode}
              onClick={() => handleModeChange(mode as DisplayMode)}
              className={`cursor-pointer ${isActive ? 'bg-accent' : ''}`}
            >
              <div className="flex items-start gap-3 w-full">
                <ModeIcon className={`h-5 w-5 ${cfg.color} mt-0.5`} />
                <div className="flex-1">
                  <div className="font-medium">{cfg.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {cfg.description}
                  </div>
                </div>
                {isActive && (
                  <div className="text-xs font-medium text-primary">Aktiv</div>
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
