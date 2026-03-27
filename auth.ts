import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  ...authConfig, // Puxa as configurações do Google
  
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.username = (user as any).username ?? null
        session.user.onboarded = (user as any).onboarded ?? false
        session.user.timeZone = (user as any).timeZone ?? "America/Sao_Paulo"
      }
      return session
    },
  },

  events: {
    async createUser({ user }) {
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