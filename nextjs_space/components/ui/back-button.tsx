
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  href: string
  label?: string
  className?: string
}

export function BackButton({ href, label = 'Tillbaka', className }: BackButtonProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground",
        "hover:text-foreground transition-colors duration-200",
        "group",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
      <span>{label}</span>
    </Link>
  )
}
