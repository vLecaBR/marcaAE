import { test, expect } from "@playwright/test"

test("página de login carrega corretamente", async ({ page }) => {
  await page.goto("/login")

  // Verifica se o título da página está correto
  await expect(page).toHaveTitle(/Entrar/)

  // Verifica se o texto do botão do Google aparece
  const googleButton = page.locator("button", { hasText: "Continuar com Google" })
  await expect(googleButton).toBeVisible()
})

test("redireciona para login ao tentar acessar dashboard sem sessão", async ({ page }) => {
  await page.goto("/dashboard")
  
  // O middleware do NextAuth deve chutar o usuário para o login
  await expect(page).toHaveURL(/.*\/login.*/)
})
