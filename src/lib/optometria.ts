import type { RxOjo } from './tipos'

export type TipoRx = 'esfera' | 'cilindro' | 'eje' | 'add' | 'prisma' | 'base' | 'av'

const PALABRAS_CERO: Record<string, string> = {
  n: 'Neutro',
  neutro: 'Neutro',
  neutral: 'Neutro',
  pl: 'Plano',
  plano: 'Plano',
}

function palabraCero(texto: string): string | undefined {
  const clave = texto.trim().toLowerCase()
  return Object.hasOwn(PALABRAS_CERO, clave) ? PALABRAS_CERO[clave] : undefined
}

/**
 * Convierte texto en dioptrías. Acepta coma decimal, signo menos tipográfico y
 * el atajo sin punto decimal: "-125" → −1.25, "50" → 0.50.
 */
export function aDioptrias(texto: string): number | null {
  if (palabraCero(texto)) return 0
  const s = texto
    .trim()
    .replace(/[−–]/g, '-')
    .replace(',', '.')
    .replace(/\s+/g, '')
    .replace(/d$/i, '')
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return null
  let n = Number(s)
  if (!s.includes('.') && Math.abs(n) >= 25 && Math.abs(n) % 25 === 0) n /= 100
  return n
}

/** +1.25, −0.50, 0.00 */
export function formatoDioptrias(n: number): string {
  const r = Math.round(n * 100) / 100
  if (r === 0) return '0.00'
  return (r > 0 ? '+' : '-') + Math.abs(r).toFixed(2)
}

const formatoPrisma = (n: number) => String(Math.round(Math.abs(n) * 100) / 100)

/** Deja cada valor en la forma en que se escribe en una receta. */
export function normalizarRx(tipo: TipoRx, texto: string): string {
  const s = texto.trim().replace(/\s+/g, ' ')
  if (!s) return ''
  switch (tipo) {
    case 'esfera':
    case 'cilindro': {
      const palabra = palabraCero(s)
      if (palabra) return palabra
      const n = aDioptrias(s)
      return n === null ? s : formatoDioptrias(n)
    }
    case 'add': {
      const n = aDioptrias(s)
      return n === null ? s : formatoDioptrias(n)
    }
    case 'prisma': {
      const n = aDioptrias(s.replace(/[Δ∆]/g, ''))
      return n === null ? s : formatoPrisma(n)
    }
    case 'eje': {
      const m = /^(\d{1,3})\s*[°º]?$/.exec(s)
      if (!m) return s
      const n = Number(m[1])
      return String(n === 0 ? 180 : n)
    }
    case 'base': {
      const grados = /^(\d{1,3})\s*[°º]?$/.exec(s)
      if (grados) return `${Number(grados[1])}°`
      return /^[a-z]{1,3}$/i.test(s) ? s.toUpperCase() : s
    }
    case 'av':
      return normalizarAV(s)
  }
}

/** "40" → "20/40", "20-30" → "20/30", "cd" → "CD". */
export function normalizarAV(texto: string): string {
  const s = texto.trim().replace(/\s+/g, ' ')
  if (/^\d{2,3}$/.test(s)) {
    const n = Number(s)
    if (n >= 10 && n <= 800) return `20/${n}`
  }
  const fraccion = /^(20|6)\s*[-\\ ]\s*(\d{1,3})$/.exec(s)
  if (fraccion) return `${fraccion[1]}/${fraccion[2]}`
  return s.replace(/^(npl|nlp|ppl|pl|mm|cd)\b/i, (m) => m.toUpperCase())
}

const hayCilindro = (cilindro: string) => cilindro.trim() !== '' && aDioptrias(cilindro) !== 0

/**
 * Revisión no bloqueante de un valor ya capturado. El cilindro del mismo ojo
 * se usa para revisar el eje.
 */
export function advertenciaRx(tipo: TipoRx, valor: string, cilindro = ''): string | null {
  const v = valor.trim()
  if (tipo === 'eje') {
    if (!v) return hayCilindro(cilindro) ? 'Falta el eje del cilindro' : null
    if (!/^\d{1,3}$/.test(v) || Number(v) < 1 || Number(v) > 180) return 'El eje va de 1° a 180°'
    return hayCilindro(cilindro) ? null : 'Sin cilindro, el eje no aplica'
  }
  if (!v) return null
  switch (tipo) {
    case 'esfera':
    case 'cilindro':
    case 'add': {
      if (tipo !== 'add' && palabraCero(v)) return null
      const n = aDioptrias(v)
      if (n === null) return 'Escribe un valor en dioptrías, p. ej. −1.25'
      if (tipo === 'add' && n <= 0) return 'La adición es un valor positivo'
      const limite = { esfera: 30, cilindro: 10, add: 4 }[tipo]
      if (Math.abs(n) > limite) return 'Valor fuera de lo habitual, revísalo'
      if (Math.round(Math.abs(n) * 100) % 25 !== 0) return 'Normalmente va en pasos de 0.25'
      return null
    }
    case 'prisma': {
      const n = aDioptrias(v.replace(/[Δ∆]/g, ''))
      if (n === null) return 'Escribe las dioptrías prismáticas, p. ej. 2'
      return Math.abs(n) > 20 ? 'Valor fuera de lo habitual, revísalo' : null
    }
    default:
      return null
  }
}

/**
 * Valor siguiente al usar ↑/↓: 0.25 D (1.00 D con Shift) y 5° (1° con Shift).
 * Devuelve null si el tipo no admite pasos o el valor actual no es numérico.
 */
export function pasoRx(tipo: TipoRx, valor: string, direccion: 1 | -1, shift = false): string | null {
  const vacio = valor.trim() === ''
  switch (tipo) {
    case 'esfera':
    case 'cilindro':
    case 'add': {
      const n = vacio ? 0 : aDioptrias(valor)
      return n === null ? null : formatoDioptrias(n + direccion * (shift ? 1 : 0.25))
    }
    case 'prisma': {
      const n = vacio ? 0 : aDioptrias(valor)
      return n === null ? null : formatoPrisma(Math.max(0, Math.abs(n) + direccion * (shift ? 1 : 0.5)))
    }
    case 'eje': {
      const paso = shift ? 1 : 5
      if (vacio) return direccion > 0 ? String(paso) : '180'
      if (!/^\d{1,3}$/.test(valor.trim())) return null
      const siguiente = Number(valor) + direccion * paso
      return String(((((siguiente - 1) % 180) + 180) % 180) + 1)
    }
    default:
      return null
  }
}

/** Para teclados táctiles sin signo menos: alterna + y −. */
export function invertirSigno(valor: string): string {
  if (!valor.trim()) return '-'
  const n = aDioptrias(valor)
  return n === null || n === 0 ? valor : formatoDioptrias(-n)
}

/** Cambia el guion por el signo menos tipográfico, más legible en pantalla y en papel. */
export const conSignoMenos = (s: string) => s.replace(/-(?=[\d.])/g, '−')

/** "−2.00 = −0.75 × 180°" */
export function formatoRx(o: RxOjo): string {
  if (!o.esfera && !o.cilindro && !o.eje) return ''
  let s = o.esfera || 'Neutro'
  if (o.cilindro) s += ` = ${o.cilindro} × ${o.eje ? `${o.eje}°` : '—'}`
  return conSignoMenos(s)
}

export const tieneDatos = (o: object) =>
  Object.values(o).some((v) => typeof v === 'string' && v.trim() !== '')

export const SUGERENCIAS_AV: { valor: string; texto?: string }[] = [
  { valor: '20/20' },
  { valor: '20/25' },
  { valor: '20/30' },
  { valor: '20/40' },
  { valor: '20/50' },
  { valor: '20/60' },
  { valor: '20/70' },
  { valor: '20/80' },
  { valor: '20/100' },
  { valor: '20/200' },
  { valor: '20/400' },
  { valor: 'CD', texto: 'Cuenta dedos' },
  { valor: 'MM', texto: 'Movimiento de manos' },
  { valor: 'PL', texto: 'Percibe luz' },
  { valor: 'NPL', texto: 'No percibe luz' },
]

export const SUGERENCIAS_BASE = ['Nasal', 'Temporal', 'Superior', 'Inferior']

/** Encabezados de las tablas de graduación; cada columna es un campo del mismo nombre. */
export const COLUMNAS_RX: Record<TipoRx, { titulo: string; antes?: '=' | '×'; lista?: string }> = {
  esfera: { titulo: 'Esfera' },
  cilindro: { titulo: 'Cilindro', antes: '=' },
  eje: { titulo: 'Eje', antes: '×' },
  add: { titulo: 'ADD' },
  prisma: { titulo: 'Prisma' },
  base: { titulo: 'Base', lista: 'lista-base' },
  av: { titulo: 'AV', lista: 'lista-av' },
}

export type FilaRx = { [K in TipoRx]?: string }

export const OJOS = [
  { clave: 'od', sigla: 'OD', nombre: 'Ojo derecho' },
  { clave: 'oi', sigla: 'OI', nombre: 'Ojo izquierdo' },
] as const
