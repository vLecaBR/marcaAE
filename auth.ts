// auth.ts  (raiz do projeto, ao lado de package.json)
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          // Garante refresh_token no primeiro login
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  session: {
    strategy: "database",
  },

  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },

  callbacks: {
    async session({ session, user }) {
      // Injeta campos extras do User no objeto de sessão
      if (session.user) {
        session.user.id = user.id
        session.user.username = (user as { username?: string }).username ?? null
        session.user.onboarded = (user as { onboarded?: boolean }).onboarded ?? false
        session.user.timeZone = (user as { timeZone?: string }).timeZone ?? "America/Sao_Paulo"
      }
      return session
    },
  },

  events: {
    async createUser({ user }) {
      // Cria o Schedule padrão automaticamente ao registrar
      if (!user.id) return
      await prisma.schedule.create({
        data: {
          userId: user.id,
          name: "Agenda Padrão",
          timeZone: "America/Sao_Paulo",
          isDefault: true,
          availabilities: {
            createMany: {
              data: [
                // Seg a Sex — 09:00 às 18:00
                { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
                { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
                { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
                { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
                { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
              ],
            },
          },
        },
      })
    },
  },
})