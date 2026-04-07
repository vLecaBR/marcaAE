import { createBooking } from "./lib/actions/booking"
import { prisma } from "./lib/prisma"
import { addDays, setHours, setMinutes } from "date-fns"

async function run() {
  const testUser = await prisma.user.create({
    data: {
      email: "test-script-owner@test.com",
      name: "Owner Test",
      username: "testscriptowner",
      timeZone: "America/Sao_Paulo",
      onboarded: true,
    },
  })

  const testSchedule = await prisma.schedule.create({
    data: {
      userId: testUser.id,
      name: "Default Test Schedule",
      timeZone: "America/Sao_Paulo",
      isDefault: true,
      availabilities: {
        create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "18:00",
        })),
      },
    },
  })

  const testEventType = await prisma.eventType.create({
    data: {
      userId: testUser.id,
      title: "30 Min Meet",
      slug: "30-min-meet",
      duration: 30,
      price: 0,
      currency: "BRL",
      isActive: true,
    },
  })

  const now = new Date()
  const tomorrow = addDays(now, 1)
  const startTimeUtc = setMinutes(setHours(tomorrow, 12), 0).toISOString()
  const endTimeUtc = setMinutes(setHours(tomorrow, 12), 30).toISOString()

  const bookingInput = {
    eventTypeId: testEventType.id,
    ownerId: testUser.id,
    startTimeUtc,
    endTimeUtc,
    guestTimeZone: "America/Sao_Paulo",
    guestName: "Guest One",
    guestEmail: "guest1@example.com",
    responses: [],
  }

  const result1 = await createBooking(bookingInput)
  console.log("RESULT 1:", result1)

  const bookingInput2 = {
    ...bookingInput,
    guestName: "Guest Two",
    guestEmail: "guest2@example.com",
  }

  const result2 = await createBooking(bookingInput2)
  console.log("RESULT 2:", result2)

  // cleanup
  await prisma.booking.deleteMany({ where: { userId: testUser.id }})
  await prisma.eventType.deleteMany({ where: { userId: testUser.id }})
  await prisma.schedule.deleteMany({ where: { userId: testUser.id }})
  await prisma.user.delete({ where: { id: testUser.id }})
}

run()
  .then(() => process.exit(0))
  .catch(console.error)
