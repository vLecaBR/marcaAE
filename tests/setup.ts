import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock do next/navigation e next/headers essenciais para o App Router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
  headers: () => new Map(),
}))

// Mock global do Auth.js (NextAuth) para testar os componentes de forma limpa
vi.mock("@/auth", () => ({
  auth: vi.fn(() => ({
    user: { id: "test-user-id", name: "Test User", email: "test@example.com", onboarded: true },
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))
