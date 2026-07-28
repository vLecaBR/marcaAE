import type { Metadata } from "next"
import { ProfileForm } from "./components/profile-form"
import { Card } from "@/components/ui/card"
import { requireOnboarded } from "@/lib/auth/guards"
import { serverApiFetch } from "@/lib/api/http-client"
import { endpoints } from "@/lib/api/endpoints"
import type { PublicProfileDto } from "@/lib/api/types"

export const metadata: Metadata = { title: "Meu perfil" }

/**
 * Perfil — via API .NET. Identidade base vem de `GET /auth/me`; nome/bio/marca são pré-preenchidos
 * a partir de `GET /public/{username}` quando o username já existe.
 */
export default async function ProfilePage() {
  const me = await requireOnboarded()

  const publicProfile = me.username
    ? await serverApiFetch<PublicProfileDto>(endpoints.public(me.username)).catch(() => null)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie como você aparece para quem agenda com você.
        </p>
      </div>

      <Card className="p-7 rounded-2xl border-border/60 max-w-3xl shadow-sm">
        <ProfileForm
          user={{
            name: publicProfile?.name ?? null,
            username: me.username,
            timeZone: me.timeZone,
            bio: publicProfile?.bio ?? null,
            image: publicProfile?.image ?? null,
            email: me.email,
            theme: publicProfile?.theme ?? "LIGHT",
            brandColor: publicProfile?.brandColor ?? null,
          }}
        />
      </Card>
    </div>
  )
}
