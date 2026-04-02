import { describe, it, expect } from "vitest"

describe("Testes Unitários de Prova de Conceito", () => {
  it("O ambiente do Vitest deve estar configurado corretamente", () => {
    expect(1 + 1).toBe(2)
  })

  it("Testando mocks globais de navegador (window)", () => {
    expect(typeof window).not.toBe("undefined")
  })
})
