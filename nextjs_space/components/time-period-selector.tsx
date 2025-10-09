
'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimePeriodSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimePeriodSelector({ value, onChange, className }: TimePeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Välj tidsperiod" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">7 dagar</SelectItem>
        <SelectItem value="30">30 dagar</SelectItem>
        <SelectItem value="60">60 dagar</SelectItem>
        <SelectItem value="90">90 dagar</SelectItem>
        <SelectItem value="180">180 dagar</SelectItem>
        <SelectItem value="365">1 år</SelectItem>
        <SelectItem value="730">2 år</SelectItem>
        <SelectItem value="all">Från början</SelectItem>
        <SelectItem value="currentYear">Innevarande år</SelectItem>
        <SelectItem value="previousYear">Föregående år</SelectItem>
      </SelectContent>
    </Select>
  )
}
