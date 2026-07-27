/**
 * Cor de marca temável com garantia de acessibilidade (ADR-0004).
 *
 * A cor do profissional só é aplicada na área pública do paciente. Antes de usá-la como cor de
 * ação (texto branco por cima), validamos o contraste WCAG AA (≥ 4.5:1). Se falhar, caímos no
 * Teal institucional — nunca entregamos um botão ilegível.
 */

const TEAL_FALLBACK = "#0f9e8e"

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return null
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

/** Luminância relativa (WCAG). */
function luminance([r, g, b]: [number, number, number]): number {
  const chan = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}

/** Razão de contraste entre duas cores (1..21). */
function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

const WHITE: [number, number, number] = [255, 255, 255]

/**
 * Retorna uma cor de marca segura para usar como fundo de ação com texto branco.
 * Se a cor do profissional for inválida ou não atingir AA contra branco, devolve o Teal.
 */
export function safeBrandColor(hex: string | null | undefined): string {
  if (!hex) return TEAL_FALLBACK
  const rgb = parseHex(hex)
  if (!rgb) return TEAL_FALLBACK
  return contrast(rgb, WHITE) >= 4.5 ? `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}` : TEAL_FALLBACK
}

/** Indica se a cor passou no teste (útil para telemetria/debug). */
export function brandPassesAA(hex: string | null | undefined): boolean {
  const rgb = hex ? parseHex(hex) : null
  return !!rgb && contrast(rgb, WHITE) >= 4.5
}
