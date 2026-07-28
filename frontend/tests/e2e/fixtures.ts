/**
 * Fixtures de E2E (Playwright) compartilhadas.
 *
 * Expõe `test`/`expect` estendidos com o fixture `loggedInOwner`, um profissional (owner) já
 * autenticado usado pelos fluxos que exigem sessão. Os dados vêm de `.env.test` (ver
 * `playwright.config.ts`), com defaults de desenvolvimento — assim a suíte tipa e roda sem
 * segredos hardcoded.
 *
 * NOTA: a montagem de sessão real (magic link → cookie `marcaai_at`) é um follow-up; hoje o
 * fixture apenas fornece a identidade do owner de teste. Ao habilitar auth real, faça o login
 * aqui e persista o `storageState` no `context`.
 */

import { test as base, expect } from "@playwright/test"

/** Identidade do profissional (owner) autenticado nos testes. */
export interface LoggedInOwner {
  username: string
  email: string
}

export interface Fixtures {
  loggedInOwner: LoggedInOwner
}

export const test = base.extend<Fixtures>({
  loggedInOwner: async ({}, provide) => {
    const owner: LoggedInOwner = {
      username: process.env.E2E_OWNER_USERNAME ?? "dr-e2e",
      email: process.env.E2E_OWNER_EMAIL ?? "owner.e2e@example.com",
    }
    await provide(owner)
  },
})

export { expect }
