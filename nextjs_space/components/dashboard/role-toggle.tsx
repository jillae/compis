

'use client'

import { useState } from 'react'
import { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Shield, Users, ChevronDown } from 'lucide-react'

interface RoleToggleProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
}

export function RoleToggle({ currentRole, onRoleChange }: RoleToggleProps) {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <Shield className="h-4 w-4" />
      case UserRole.ADMIN:
        return <Users className="h-4 w-4" />
      case UserRole.STAFF:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'SuperAdmin (SA)'
      case UserRole.ADMIN:
        return 'Admin (A)'
      case UserRole.STAFF:
        return 'Personal (S)'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {getRoleIcon(currentRole)}
          <span>Visa som: {getRoleLabel(currentRole)}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onRoleChange(UserRole.SUPER_ADMIN)}>
          <Shield className="mr-2 h-4 w-4" />
          SuperAdmin (SA)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRoleChange(UserRole.ADMIN)}>
          <Users className="mr-2 h-4 w-4" />
          Admin (A)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRoleChange(UserRole.STAFF)}>
          <User className="mr-2 h-4 w-4" />
          Personal (S)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

