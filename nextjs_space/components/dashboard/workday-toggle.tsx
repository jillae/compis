

'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Calendar } from 'lucide-react'

interface WorkdayToggleProps {
  value: '5' | '7'
  onChange: (value: '5' | '7') => void
}

export function WorkdayToggle({ value, onChange }: WorkdayToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as '5' | '7')}>
        <ToggleGroupItem value="5" aria-label="5 arbetsdagar">
          5 dagar
        </ToggleGroupItem>
        <ToggleGroupItem value="7" aria-label="7 dagar">
          7 dagar
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

