'use client';

import Link from 'next/link';
import { Megaphone, TrendingUp, CalendarDays, ArrowRight } from 'lucide-react';

interface QuickStartProps {
  className?: string;
}

export function QuickStart({ className = '' }: QuickStartProps) {
  const actions = [
    {
      href: '/dashboard/marketing-triggers',
      icon: Megaphone,
      label: 'Ny kampanj',
      description: 'Skapa SMS eller email-utskick',
      gradient: 'from-violet-500 to-purple-600',
      hoverGradient: 'hover:from-violet-600 hover:to-purple-700',
    },
    {
      href: '/dashboard/capacity',
      icon: TrendingUp,
      label: 'Prognos',
      description: 'Se beläggning och kapacitet',
      gradient: 'from-emerald-500 to-teal-600',
      hoverGradient: 'hover:from-emerald-600 hover:to-teal-700',
    },
    {
      href: '/dashboard/schedule',
      icon: CalendarDays,
      label: 'Schema',
      description: 'Visa dagens bokningar',
      gradient: 'from-blue-500 to-indigo-600',
      hoverGradient: 'hover:from-blue-600 hover:to-indigo-700',
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.gradient} ${action.hoverGradient} p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
            
            <div className="relative flex flex-col h-full min-h-[120px]">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-1">{action.label}</h3>
              <p className="text-sm text-white/80">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
