import { prisma } from "@/lib/prisma"

const GOOGLE_OAUTH_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3"

/**
 * Gets a valid access token for the given user.
 * If the current token is expired, it uses the refresh token to get a new one
 * and updates the database.
 */
async function getValidAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  })

  if (!account) return null

  // If token is valid for at least 5 more minutes
  if (account.expires_at && account.expires_at * 1000 > Date.now() + 5 * 60 * 1000) {
    return account.access_token
  }

  // Token is expired, need to refresh
  if (!account.refresh_token) {
    console.warn(`[Google Auth] No refresh token found for user ${userId}`)
    return null
  }

  try {
    const response = await fetch(GOOGLE_OAUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      }),
    })

    const tokens = await response.json()

    if (!response.ok) {
      console.error("[Google Auth] Failed to refresh token", tokens)
      return null
    }

    // Update database with new tokens
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token,
        expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
        // Google sometimes sends a new refresh token, if not, keep the old one
        refresh_token: tokens.refresh_token ?? account.refresh_token,
      },
    })

    return tokens.access_token
  } catch (err) {
    console.error("[Google Auth] Error refreshing token", err)
    return null
  }
}

/**
 * Fetches busy slots from the user's primary Google Calendar.
 * Uses the FreeBusy API which is very fast and efficient.
 */
export async function getGoogleCalendarBusySlots(
  userId: string,
  timeMin: Date,
  timeMax: Date
): Promise<{ start: Date; end: Date }[]> {
  const accessToken = await getValidAccessToken(userId)

  if (!accessToken) {
    // If no access token (e.g., user not connected with Google), we return empty busy array
    return []
  }

  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API_URL}/freeBusy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: "primary" }],
      }),
    })

    if (!response.ok) {
      console.error("[Google Calendar] FreeBusy API error", await response.text())
      return []
    }

    const data = await response.json()
    const busy = data.calendars.primary.busy as { start: string; end: string }[]

    if (!busy) return []

    return busy.map((slot) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
    }))
  } catch (err) {
    console.error("[Google Calendar] Error fetching busy slots", err)
    return []
  }
}

interface CreateGoogleEventInput {
  userId: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  guestName: string
  guestEmail: string
  createMeetLink?: boolean
}

/**
 * Creates an event in the user's Google Calendar and optionally generates a Meet link.
 */
export async function createGoogleCalendarEvent(
  input: CreateGoogleEventInput
): Promise<{ eventId: string; meetLink?: string } | null> {
  const accessToken = await getValidAccessToken(input.userId)

  if (!accessToken) return null

  const eventBody: any = {
    summary: input.title,
    description: input.description,
    start: {
      dateTime: input.startTime.toISOString(),
    },
    end: {
      dateTime: input.endTime.toISOString(),
    },
    attendees: [
      { email: input.guestEmail, displayName: input.guestName }
    ],
  }

  // Request a Google Meet link if required
  if (input.createMeetLink) {
    eventBody.conferenceData = {
      createRequest: {
        requestId: `meet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    }
  }

  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API_URL}/calendars/primary/events?conferenceDataVersion=1`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    })

    if (!response.ok) {
      console.error("[Google Calendar] Error creating event", await response.text())
      return null
    }

    const data = await response.json()
    const meetLink = data.conferenceData?.entryPoints?.find(
      (ep: any) => ep.entryPointType === "video"
    )?.uri

    return {
      eventId: data.id,
      meetLink,
    }
  } catch (err) {
    console.error("[Google Calendar] Failed to create event", err)
    return null
  }
}

/**
 * Cancels (deletes) an event from the user's Google Calendar.
 */
export async function deleteGoogleCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return false

  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.ok || response.status === 404 // 404 means it's already gone
  } catch (err) {
    console.error("[Google Calendar] Failed to delete event", err)
    return false
  }
}
