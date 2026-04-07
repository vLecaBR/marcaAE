# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Fluxo do Dono (Dashboard) >> Consegue visualizar e cancelar um agendamento
- Location: tests\e2e\dashboard.spec.ts:6:7

# Error details

```
PrismaClientKnownRequestError: 
Invalid `prisma.user.create()` invocation in
C:\Users\7625920\Desktop\MarcaAE\marcaae\tests\e2e\fixtures.ts:58:36

  55 
  56 loggedInOwner: async ({ page, context }: { page: Page, context: BrowserContext }, use: any) => {
  57   // Cria um usuário e dados necessários (Schedule, EventType) para o dono da agenda
→ 58   const user = await prisma.user.create(

```

# Test source

```ts
  1   | import { test as base, Page, BrowserContext } from "@playwright/test"
  2   | // @ts-ignore
  3   | import { encode } from "next-auth/jwt"
  4   | import { prisma } from "@/lib/prisma"
  5   | import { randomUUID } from "crypto"
  6   | 
  7   | // Extender o objeto `test` do Playwright
  8   | export const test = base.extend<{
  9   |   loggedInUser: any
  10  |   loggedInOwner: any
  11  | }>({
  12  |   loggedInUser: async ({ page, context }: { page: Page, context: BrowserContext }, use: any) => {
  13  |     // Cria um usuário no banco para o teste
  14  |     const user = await prisma.user.create({
  15  |       data: {
  16  |         email: `testuser-${randomUUID()}@example.com`,
  17  |         name: "Test E2E User",
  18  |         username: `teste2euser-${randomUUID()}`,
  19  |         onboarded: true,
  20  |       },
  21  |     })
  22  | 
  23  |     // Cria o token JWT pro NextAuth v5
  24  |     const token = await encode({
  25  |       token: {
  26  |         id: user.id,
  27  |         email: user.email,
  28  |         name: user.name,
  29  |         picture: null,
  30  |         username: user.username,
  31  |         onboarded: user.onboarded,
  32  |       },
  33  |       secret: process.env.AUTH_SECRET || "test-secret-never-use-in-prod",
  34  |       salt: "authjs.session-token",
  35  |     })
  36  | 
  37  |     // Injeta o cookie no contexto do navegador
  38  |     await context.addCookies([
  39  |       {
  40  |         name: "authjs.session-token", // No NextAuth v5 por default é authjs.session-token (se não for HTTPS)
  41  |         value: token,
  42  |         domain: "localhost",
  43  |         path: "/",
  44  |         httpOnly: true,
  45  |         sameSite: "Lax",
  46  |         secure: false, // se estiver rodando local no HTTP
  47  |       },
  48  |     ])
  49  | 
  50  |     await use(user)
  51  | 
  52  |     // Cleanup: deletar usuário após o teste
  53  |     await prisma.user.delete({ where: { id: user.id } })
  54  |   },
  55  |   
  56  |   loggedInOwner: async ({ page, context }: { page: Page, context: BrowserContext }, use: any) => {
  57  |     // Cria um usuário e dados necessários (Schedule, EventType) para o dono da agenda
> 58  |     const user = await prisma.user.create({
      |                                    ^ PrismaClientKnownRequestError: 
  59  |       data: {
  60  |         email: `owner-${randomUUID()}@example.com`,
  61  |         name: "Test E2E Owner",
  62  |         username: `teste2eowner-${randomUUID()}`,
  63  |         onboarded: true,
  64  |       },
  65  |     })
  66  | 
  67  |     await prisma.schedule.create({
  68  |       data: {
  69  |         userId: user.id,
  70  |         name: "Agenda E2E",
  71  |         timeZone: "America/Sao_Paulo",
  72  |         isDefault: true,
  73  |         availabilities: {
  74  |           create: [0, 1, 2, 3, 4, 5, 6].map(day => ({
  75  |             dayOfWeek: day,
  76  |             startTime: "09:00",
  77  |             endTime: "18:00",
  78  |           }))
  79  |         }
  80  |       }
  81  |     })
  82  | 
  83  |     await prisma.eventType.create({
  84  |       data: {
  85  |         userId: user.id,
  86  |         title: "Reunião de Vendas E2E",
  87  |         slug: "vendas-e2e",
  88  |         duration: 30,
  89  |         price: 0,
  90  |         currency: "BRL",
  91  |       }
  92  |     })
  93  | 
  94  |     const token = await encode({
  95  |       token: {
  96  |         id: user.id,
  97  |         email: user.email,
  98  |         name: user.name,
  99  |         picture: null,
  100 |         username: user.username,
  101 |         onboarded: user.onboarded,
  102 |       },
  103 |       secret: process.env.AUTH_SECRET || "test-secret-never-use-in-prod",
  104 |       salt: "authjs.session-token",
  105 |     })
  106 | 
  107 |     await context.addCookies([
  108 |       {
  109 |         name: "authjs.session-token", 
  110 |         value: token,
  111 |         domain: "localhost",
  112 |         path: "/",
  113 |         httpOnly: true,
  114 |         sameSite: "Lax",
  115 |         secure: false,
  116 |       },
  117 |     ])
  118 | 
  119 |     await use(user)
  120 | 
  121 |     await prisma.user.delete({ where: { id: user.id } })
  122 |   },
  123 | })
  124 | 
  125 | export { expect } from "@playwright/test"
```