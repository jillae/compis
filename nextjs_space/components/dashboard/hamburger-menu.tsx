
'use client';

import { useState } from 'react';
import { Menu, X, Users, LogOut, Mail, UserCog, ExternalLink, Sparkles, Settings, CreditCard, Tag, UsersRound, MessageSquare, DollarSign, Building, TrendingUp, Upload, ArrowRightLeft, Monitor, Gift, CalendarDays, Clock, CalendarRange, BarChart3, Target, Zap, Activity, ShieldAlert, Gauge, Star, QrCode, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { UserRole } from '@/lib/client-types';
import { RoleToggle } from './role-toggle';

interface HamburgerMenuProps {
  userRole?: UserRole;
  simulatedRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export function HamburgerMenu({ userRole, simulatedRole, onRoleChange }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);

  const handleSendWeeklyReport = async () => {
    const res = await fetch('/api/email/weekly-report');
    if (res.ok) {
      alert('✅ Veckorapport skickad till din e-post!');
      setOpen(false);
    } else {
      alert('❌ Kunde inte skicka rapport. Försök igen.');
    }
  };

  const NavLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => (
    <Link href={href} onClick={() => setOpen(false)}>
      <Button variant="ghost" className="w-full justify-start min-h-[44px]">
        <Icon className="h-4 w-4 mr-2 shrink-0" />
        {children}
      </Button>
    </Link>
  );

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
      {children}
    </h3>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Meny</SheetTitle>
          <SheetDescription>
            Navigering och inställningar
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-5">

          {/* ─── Drift (Operations) ─── */}
          <div className="space-y-1">
            <SectionHeader>Drift</SectionHeader>
            <NavLink href="/dashboard/schedule" icon={CalendarDays}>
              Dagens Schema
            </NavLink>
            <NavLink href="/dashboard/capacity" icon={Gauge}>
              Kapacitetsprognos
            </NavLink>
            <NavLink href="/dashboard/staff" icon={Users}>
              Personalöversikt
            </NavLink>
            <NavLink href="/dashboard/staff/schedule" icon={CalendarDays}>
              Veckoschema
            </NavLink>
            <NavLink href="/dashboard/staff/timesheet" icon={Clock}>
              Tidrapporter & Stämpling
            </NavLink>
            <NavLink href="/dashboard/staff/leave" icon={CalendarRange}>
              Semester & Frånvaro
            </NavLink>
          </div>

          {/* ─── Kunder ─── */}
          <div className="space-y-1">
            <SectionHeader>Kunder</SectionHeader>
            <NavLink href="/dashboard/customers" icon={UsersRound}>
              Kundöversikt
            </NavLink>
            <NavLink href="/dashboard/at-risk" icon={ShieldAlert}>
              Customer Health
            </NavLink>
            <NavLink href="/dashboard/tags" icon={Tag}>
              Tag Manager
            </NavLink>
            <NavLink href="/dashboard/segments" icon={Target}>
              Kundsegment
            </NavLink>
          </div>

          {/* ─── Lojalitet ─── */}
          <div className="space-y-1">
            <SectionHeader>Lojalitet</SectionHeader>
            <NavLink href="/dashboard/loyalty" icon={LayoutDashboard}>
              Översikt
            </NavLink>
            <NavLink href="/dashboard/loyalty/scan" icon={QrCode}>
              Skanna QR
            </NavLink>
            <NavLink href="/dashboard/loyalty/members" icon={UsersRound}>
              Medlemmar
            </NavLink>
            <NavLink href="/dashboard/loyalty/programs/new" icon={Star}>
              Program
            </NavLink>
          </div>

          {/* ─── Marknadsföring ─── */}
          <div className="space-y-1">
            <SectionHeader>Marknadsföring</SectionHeader>
            <NavLink href="/dashboard/marketing-triggers" icon={Zap}>
              Marketing Triggers
            </NavLink>
            <NavLink href="/dashboard/newsletters" icon={MessageSquare}>
              Nyhetsbrev
            </NavLink>
            <NavLink href="/dashboard/competitors" icon={Activity}>
              Konkurrensanalys
            </NavLink>
          </div>

          {/* ─── Ekonomi ─── */}
          <div className="space-y-1">
            <SectionHeader>Ekonomi & Analys</SectionHeader>
            <NavLink href="/dashboard/analytics" icon={BarChart3}>
              Business Metrics
            </NavLink>
            <NavLink href="/dashboard/cash-flow" icon={ArrowRightLeft}>
              Kassaflödesanalys
            </NavLink>
            <NavLink href="/dashboard/liquidity-forecast" icon={TrendingUp}>
              Likviditetsplanering
            </NavLink>
          </div>

          {/* ─── AI ─── */}
          <div className="space-y-1">
            <SectionHeader>AI Autopilot</SectionHeader>
            <NavLink href="/dashboard/actions" icon={Sparkles}>
              Corex Rekommendationer
            </NavLink>
            <NavLink href="/dashboard/insights" icon={TrendingUp}>
              AI Insikter
            </NavLink>
          </div>

          {/* ─── Data & Import ─── */}
          <div className="space-y-1">
            <SectionHeader>Data</SectionHeader>
            <NavLink href="/dashboard/import" icon={Upload}>
              Importera CSV
            </NavLink>
            <Button 
              variant="ghost" 
              className="w-full justify-start min-h-[44px]"
              onClick={handleSendWeeklyReport}
            >
              <Mail className="h-4 w-4 mr-2 shrink-0" />
              Skicka veckorapport
            </Button>
          </div>

          {/* ─── Inställningar ─── */}
          <div className="space-y-1">
            <SectionHeader>Inställningar</SectionHeader>
            <NavLink href="/dashboard/settings" icon={Settings}>
              Funktioner & Integrationer
            </NavLink>
            <NavLink href="/dashboard/settings/bokadirekt" icon={ExternalLink}>
              Bokadirekt-synk
            </NavLink>
            <NavLink href="/dashboard/settings/display" icon={Monitor}>
              Visningsinställningar
            </NavLink>
            <NavLink href="/dashboard/billing" icon={CreditCard}>
              Prenumeration & Fakturering
            </NavLink>
            <NavLink href="/dashboard/referrals" icon={Gift}>
              Hänvisa & Tjäna
            </NavLink>
            <NavLink href="/settings/bank" icon={Building}>
              Bank-integration
            </NavLink>
          </div>

          {/* LABS Features (only for SUPER_ADMIN) */}
          {userRole === UserRole.SUPER_ADMIN && (
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-yellow-600 uppercase tracking-widest px-1">
                🧪 LABS
              </h3>
              <NavLink href="/revenue-pro" icon={DollarSign}>
                Revenue Intelligence Pro
              </NavLink>
              <NavLink href="/dashboard/simulator" icon={Activity}>
                Revenue Simulator
              </NavLink>
              <NavLink href="/dashboard/ab-testing" icon={Target}>
                A/B Testing
              </NavLink>
              <NavLink href="/dashboard/marketplace" icon={ExternalLink}>
                Marketplace
              </NavLink>
            </div>
          )}

          {/* Role Toggle for Super Admin */}
          {userRole === UserRole.SUPER_ADMIN && simulatedRole && onRoleChange && (
            <div className="space-y-1">
              <SectionHeader>Admin</SectionHeader>
              <div className="px-3">
                <RoleToggle currentRole={simulatedRole} onRoleChange={onRoleChange} />
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              className="w-full min-h-[44px]"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logga ut
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
