// Las fechas se guardan como texto AAAA-MM-DD y se interpretan en hora local,
// para evitar los corrimientos de un día que provoca new Date('AAAA-MM-DD') (UTC).

const pad = (n: number, largo = 2) => String(n).padStart(largo, '0')

interface PartesFecha {
  anio: number
  mes: number
  dia: number
}

export function aISO({ anio, mes, dia }: PartesFecha): string {
  return `${pad(anio, 4)}-${pad(mes)}-${pad(dia)}`
}

export function hoyISO(): string {
  const d = new Date()
  return aISO({ anio: d.getFullYear(), mes: d.getMonth() + 1, dia: d.getDate() })
}

export function esFechaValida(anio: number, mes: number, dia: number): boolean {
  if (!Number.isInteger(anio) || !Number.isInteger(mes) || !Number.isInteger(dia)) return false
  if (anio < 1000 || mes < 1 || mes > 12 || dia < 1) return false
  return dia <= new Date(anio, mes, 0).getDate()
}

export function partesISO(iso: string): PartesFecha | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  return esFechaValida(anio, mes, dia) ? { anio, mes, dia } : null
}

function aDate(iso: string): Date | null {
  const p = partesISO(iso)
  return p ? new Date(p.anio, p.mes - 1, p.dia) : null
}

/** "15/03/1990" */
export function formatoNumerico(iso: string): string {
  const p = partesISO(iso)
  return p ? `${pad(p.dia)}/${pad(p.mes)}/${p.anio}` : ''
}

const fmtMedio = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtLargo = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtHora = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' })

/** "7 oct 2026" */
export function formatoMedio(iso: string): string {
  const d = aDate(iso)
  return d ? fmtMedio.format(d) : ''
}

/** "7 de octubre de 2026" */
export function formatoLargo(iso: string): string {
  const d = aDate(iso)
  return d ? fmtLargo.format(d) : ''
}

/** Hora de una fecha y hora ISO completa: "10:32 a.m." */
export function formatoHora(isoCompleto: string): string {
  const d = new Date(isoCompleto)
  return Number.isNaN(d.getTime()) ? '' : fmtHora.format(d)
}

/**
 * Interpreta lo que se escribe en un campo dd/mm/aaaa. Acepta separadores
 * libres o solo dígitos (15031990) y años de dos cifras.
 */
export function interpretarFecha(texto: string, hoy = hoyISO()): string | null {
  const limpio = texto.trim()
  if (!limpio) return null
  let dia: number, mes: number, anio: number
  const conSeparador = /^(\d{1,2})\D+(\d{1,2})\D+(\d{2}|\d{4})$/.exec(limpio)
  if (conSeparador) {
    dia = Number(conSeparador[1])
    mes = Number(conSeparador[2])
    anio = Number(conSeparador[3])
    if (conSeparador[3].length === 2) anio = siglo(anio, hoy)
  } else if (/^\d{8}$/.test(limpio)) {
    dia = Number(limpio.slice(0, 2))
    mes = Number(limpio.slice(2, 4))
    anio = Number(limpio.slice(4))
  } else if (/^\d{6}$/.test(limpio)) {
    dia = Number(limpio.slice(0, 2))
    mes = Number(limpio.slice(2, 4))
    anio = siglo(Number(limpio.slice(4)), hoy)
  } else {
    return null
  }
  return esFechaValida(anio, mes, dia) ? aISO({ anio, mes, dia }) : null
}

/** Un año de dos cifras se asume en el pasado: 95 → 1995, 08 → 2008. */
function siglo(dosCifras: number, hoy: string): number {
  const actual = Number(hoy.slice(0, 4))
  const candidato = Math.floor(actual / 100) * 100 + dosCifras
  return candidato > actual ? candidato - 100 : candidato
}

export function edad(nacimiento: string, referencia = hoyISO()): { anios: number; meses: number } | null {
  const n = partesISO(nacimiento)
  const r = partesISO(referencia)
  if (!n || !r) return null
  let anios = r.anio - n.anio
  let meses = r.mes - n.mes
  if (r.dia < n.dia) meses--
  if (meses < 0) {
    anios--
    meses += 12
  }
  return anios < 0 ? null : { anios, meses }
}

/** "34 años"; en menores de 2 años se expresa en meses. */
export function textoEdad(nacimiento: string, referencia = hoyISO()): string {
  const e = edad(nacimiento, referencia)
  if (!e) return ''
  if (e.anios >= 2) return `${e.anios} años`
  const meses = e.anios * 12 + e.meses
  return meses === 1 ? '1 mes' : `${meses} meses`
}

const relativo = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })

/** "hoy", "ayer", "hace 3 días", "hace 2 meses"… a partir de una fecha y hora ISO. */
export function haceCuanto(isoCompleto: string, ahora = new Date()): string {
  const d = new Date(isoCompleto)
  if (Number.isNaN(d.getTime())) return ''
  const inicio = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dias = Math.round((inicio(ahora) - inicio(d)) / 86_400_000)
  if (dias < 30) return relativo.format(-dias, 'day')
  if (dias < 365) return relativo.format(-Math.round(dias / 30), 'month')
  return relativo.format(-Math.round(dias / 365), 'year')
}

export function diasDesde(isoCompleto: string, ahora = new Date()): number {
  const d = new Date(isoCompleto)
  return Number.isNaN(d.getTime()) ? Infinity : (ahora.getTime() - d.getTime()) / 86_400_000
}

const fmtMesCorto = new Intl.DateTimeFormat('es-MX', { month: 'short' })

/** Partes para mostrar una fecha como hoja de calendario: 7 · oct · 2026. */
export function hojaCalendario(iso: string): { dia: string; mes: string; anio: string } | null {
  const p = partesISO(iso)
  if (!p) return null
  return {
    dia: String(p.dia),
    mes: fmtMesCorto.format(new Date(p.anio, p.mes - 1, 1)).replace('.', ''),
    anio: String(p.anio),
  }
}

/** Día local (AAAA-MM-DD) de una fecha y hora ISO. */
export function fechaLocal(isoCompleto: string): string {
  const d = new Date(isoCompleto)
  return Number.isNaN(d.getTime()) ? '' : aISO({ anio: d.getFullYear(), mes: d.getMonth() + 1, dia: d.getDate() })
}
