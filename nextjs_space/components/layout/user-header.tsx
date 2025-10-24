
'use client';

import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Users, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DisplayModeSwitcher } from '@/components/display-mode-switcher';
import { GuideButton } from '@/components/guide-button';

const roleConfig = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    icon: Crown,
    variant: 'default' as const,
    className: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0',
  },
  ADMIN: {
    label: 'Admin',
    icon: Shield,
    variant: 'default' as const,
    className: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0',
  },
  STAFF: {
    label: 'Personal',
    icon: Users,
    variant: 'secondary' as const,
    className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
  },
};

export function UserHeader() {
  const { data: session, status } = useSession() || {};

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-lg border">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const role = user.role || 'STAFF';
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.STAFF;
  const Icon = config.icon;

  // Get initials for avatar fallback
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Guide Button (only for beta users) */}
      <GuideButton />
      
      {/* Display Mode Switcher */}
      <DisplayModeSwitcher />
      
      {/* User Info Card */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {user.name || user.email || 'Användare'}
            </span>
          </div>
          <Badge className={`w-fit text-xs ${config.className}`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}
