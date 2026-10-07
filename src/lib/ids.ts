/** Los expedientes se numeran de forma consecutiva: 1 → "0001". */
export const formatoId = (n: number) => String(n).padStart(4, '0')

export function numeroDeId(id: string): number {
  const n = Number.parseInt(id, 10)
  return Number.isFinite(n) ? n : 0
}

export function nuevoUUID(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // randomUUID solo existe en contextos seguros (https o localhost)
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
