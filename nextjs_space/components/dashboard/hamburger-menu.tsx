
'use client';

import { useState } from 'react';
import { Menu, X, Users, LogOut, Mail, UserCog, ExternalLink, Sparkles, Settings, CreditCard, Tag, UsersRound, MessageSquare } from 'lucide-react';
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
            <Link href="/staff" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Personalöversikt
              </Button>
            </Link>
            <Link href="/staff/leave" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <UserCog className="h-4 w-4 mr-2" />
                Ledighetshantering
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
            <Link href="/dashboard/billing" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                Prenumeration & Fakturering
              </Button>
            </Link>
          </div>

          {/* External Links */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Länkar
            </h3>
            <Link href="/" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Landningssida
              </Button>
            </Link>
          </div>

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
