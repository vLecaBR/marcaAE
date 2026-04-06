import { PrismaClient } from "@prisma/client"
import { addDays, setHours, setMinutes } from "date-fns"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Limpar dados existentes (opcional se rodarmos prisma migrate reset)
  await prisma.booking.deleteMany()
  await prisma.scheduleAvailability.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.eventType.deleteMany()
  await prisma.user.deleteMany()

  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      username: "testuser",
      timeZone: "America/Sao_Paulo",
      onboarded: true,
    },
  })

  // Create a test schedule
  const schedule = await prisma.schedule.create({
    data: {
      userId: user.id,
      name: "Default Schedule",
      timeZone: "America/Sao_Paulo",
      isDefault: true,
      availabilities: {
        create: [1, 2, 3, 4, 5].map((day) => ({
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
        })),
      },
    },
  })

  // Create a test event type
  const eventType = await prisma.eventType.create({
    data: {
      userId: user.id,
      title: "30 Min Meeting",
      slug: "30-min",
      duration: 30,
      price: 0,
      currency: "BRL",
    },
  })

  // Create a test booking
  const now = new Date()
  const tomorrow = addDays(now, 1)
  const startTime = setMinutes(setHours(tomorrow, 10), 0)
  const endTime = setMinutes(setHours(tomorrow, 10), 30)

  await prisma.booking.create({
    data: {
      userId: user.id,
      eventTypeId: eventType.id,
      guestName: "Guest User",
      guestEmail: "guest@example.com",
      startTime,
      endTime,
      guestTimeZone: "America/Sao_Paulo",
      status: "CONFIRMED",
    },
  })

  console.log("Seed finished.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
