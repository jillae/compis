
'use client'

import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Info } from "lucide-react"

interface OptimalCorridorControlsProps {
  optimalMin: number
  optimalMax: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
}

export function OptimalCorridorControls({
  optimalMin,
  optimalMax,
  onMinChange,
  onMaxChange
}: OptimalCorridorControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎯 Optimal beläggningskorridor</span>
        </CardTitle>
        <CardDescription className="flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
          <span>
            Ställ in din målzon för kapacitetsutnyttjande. Graferna visar när du är inom, över eller under din optimala nivå.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Minimum beläggning</Label>
            <span className="text-2xl font-bold text-primary">{optimalMin}%</span>
          </div>
          <Slider
            value={[optimalMin]}
            onValueChange={(values) => onMinChange(values[0])}
            min={0}
            max={100}
            step={5}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">
            Under {optimalMin}% = Underutnyttjad kapacitet (röd zon)
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Maximum beläggning</Label>
            <span className="text-2xl font-bold text-primary">{optimalMax}%</span>
          </div>
          <Slider
            value={[optimalMax]}
            onValueChange={(values) => onMaxChange(values[0])}
            min={0}
            max={100}
            step={5}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">
            Över {optimalMax}% = Överbelastning (orange zon)
          </p>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Optimal zon:</span>
            <span className="font-semibold text-green-600">
              {optimalMin}% - {optimalMax}%
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-red-400 via-green-400 to-orange-400" />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Underutnyttjad</span>
            <span>Optimal</span>
            <span>Överbelastad</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
