import { z } from "zod"

/**
 * Variáveis de ambiente do frontend. Pós-extermínio do Prisma/NextAuth, o Next é um cliente puro
 * da API .NET — não há mais banco, segredo de sessão ou chaves de gateway no front. Tudo isso
 * vive no backend. Restam apenas as URLs públicas.
 */
const envSchema = z.object({
  // Base da API .NET consumida pelo front (via BFF server-side / proxies públicos).
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:5080"),
  // URL pública do próprio app (usada em links de marketing/QR).
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

const parseResult = envSchema.safeParse(process.env)

if (!parseResult.success) {
  console.error("❌ Variáveis de ambiente inválidas:", parseResult.error.flatten().fieldErrors)
  throw new Error("Variáveis de ambiente inválidas ou ausentes")
}

export const env = parseResult.data
