
import { UserRole } from "@prisma/client"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      firstName?: string
      lastName?: string
      companyName?: string
      jobTitle?: string
      role: UserRole
      clinicId?: string
    }
  }

  interface User {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
    role?: UserRole
    clinicId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    firstName?: string
    lastName?: string
    companyName?: string
    jobTitle?: string
    role?: UserRole
    clinicId?: string
  }
}
