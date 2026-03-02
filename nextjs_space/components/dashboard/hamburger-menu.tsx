
'use client';

import { useState } from 'react';
import { Menu, X, Users, LogOut, Mail, UserCog, ExternalLink, Sparkles, Settings, CreditCard, Tag, UsersRound, MessageSquare, DollarSign, Building, TrendingUp, Upload, ArrowRightLeft, Monitor, Gift, CalendarDays, Clock, CalendarRange } from 'lucide-react';
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
import { UserRole } from '@prisma/client';
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Meny</SheetTitle>
          <SheetDescription>
            Navigering och inställningar
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* AI Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              AI Autopilot
            </h3>
            <Link href="/dashboard/actions" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Sparkles className="h-4 w-4 mr-2" />
                Corex Rekommendationer
              </Button>
            </Link>
          </div>

          {/* Revenue Intelligence */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Revenue Intelligence
            </h3>
            <Link href="/dashboard/analytics" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Business Metrics
              </Button>
            </Link>
            <Link href="/dashboard/cash-flow" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Kassaflödesanalys
              </Button>
            </Link>
            <Link href="/dashboard/liquidity-forecast" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Likviditetsplanering
              </Button>
            </Link>
          </div>

          {/* Data Management */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Data
            </h3>
            <Link href="/dashboard/import" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Importera CSV
              </Button>
            </Link>
          </div>

          {/* Customer Intelligence */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Kundinsikter
            </h3>
            <Link href="/dashboard/tags" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Tag className="h-4 w-4 mr-2" />
                Tag Manager
              </Button>
            </Link>
            <Link href="/dashboard/segments" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <UsersRound className="h-4 w-4 mr-2" />
                Kundsegment
              </Button>
            </Link>
            <Link href="/dashboard/newsletters" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Nyhetsbrev
              </Button>
            </Link>
          </div>

          {/* Staff Management */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Personal
            </h3>
            <Link href="/dashboard/staff/schedule" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <CalendarDays className="h-4 w-4 mr-2" />
                Veckoschema
              </Button>
            </Link>
            <Link href="/dashboard/staff/timesheet" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Tidrapporter & Stämpling
              </Button>
            </Link>
            <Link href="/dashboard/staff/leave" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <CalendarRange className="h-4 w-4 mr-2" />
                Semester & Frånvaro
              </Button>
            </Link>
          </div>

          {/* Reports */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Rapporter
            </h3>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={handleSendWeeklyReport}
            >
              <Mail className="h-4 w-4 mr-2" />
              Skicka veckorapport
            </Button>
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Inställningar
            </h3>
            <Link href="/dashboard/settings" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Funktioner & Integrationer
              </Button>
            </Link>
            <Link href="/dashboard/settings/display" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Monitor className="h-4 w-4 mr-2" />
                Visningsinställningar
              </Button>
            </Link>
            <Link href="/dashboard/billing" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                Prenumeration & Fakturering
              </Button>
            </Link>
            <Link href="/dashboard/referrals" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Gift className="h-4 w-4 mr-2" />
                Hänvisa & Tjäna
              </Button>
            </Link>
            <Link href="/settings/bank" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Building className="h-4 w-4 mr-2" />
                Bank-integration
              </Button>
            </Link>
          </div>

          {/* LABS Features (only for SUPER_ADMIN) */}
          {userRole === UserRole.SUPER_ADMIN && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">
                🧪 LABS - Arch Clinic
              </h3>
              <Link href="/revenue-pro" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Revenue Intelligence Pro
                </Button>
              </Link>
            </div>
          )}

          {/* Role Toggle for Super Admin */}
          {userRole === UserRole.SUPER_ADMIN && simulatedRole && onRoleChange && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Admin
              </h3>
              <div className="px-3">
                <RoleToggle currentRole={simulatedRole} onRoleChange={onRoleChange} />
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              className="w-full"
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
