
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
    }),
    // Credentials Provider (Email/Password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email || '',
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
        } as any
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours of inactivity before logout
    updateAge: 60 * 30, // Update session every 30 minutes
  },
  pages: {
    signIn: "/auth/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fetch user details from database to get additional fields
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            jobTitle: true,
            role: true,
            clinicId: true
          }
        })
        if (dbUser) {
          token.firstName = dbUser.firstName || undefined
          token.lastName = dbUser.lastName || undefined
          token.companyName = dbUser.companyName || undefined
          token.jobTitle = dbUser.jobTitle || undefined
          token.role = dbUser.role
          token.clinicId = dbUser.clinicId || undefined
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || ''
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.companyName = token.companyName as string
        session.user.jobTitle = token.jobTitle as string
        session.user.role = token.role as any
        session.user.clinicId = token.clinicId as string | undefined
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect based on user role
      if (url.startsWith(baseUrl)) {
        // If redirect is to /dashboard, check user role
        if (url.includes('/dashboard')) {
          try {
            // Get the token to check role (this is during callback)
            // For now, let client-side handle the redirect
            return url
          } catch (error) {
            return baseUrl + '/dashboard'
          }
        }
        return url
      } else if (url.startsWith('/')) {
        return new URL(url, baseUrl).toString()
      }
      return baseUrl
    }
  }
}
