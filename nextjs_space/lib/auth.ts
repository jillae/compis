
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
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
    strategy: "jwt"
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
            jobTitle: true
          }
        })
        if (dbUser) {
          token.firstName = dbUser.firstName || undefined
          token.lastName = dbUser.lastName || undefined
          token.companyName = dbUser.companyName || undefined
          token.jobTitle = dbUser.jobTitle || undefined
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
      }
      return session
    }
  }
}
