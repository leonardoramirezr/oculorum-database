import type { DatosPaciente, Paciente } from './tipos'

/** Minúsculas, sin acentos ni espacios repetidos: para comparar y buscar. */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export const limpiarEspacios = (s: string) => s.replace(/\s+/g, ' ').trim()

export const soloDigitos = (s: string) => s.replace(/\D/g, '')

type Nombre = Pick<Paciente, 'nombre' | 'apellidoPaterno' | 'apellidoMaterno'>

export function nombreCompleto(p: Nombre): string {
  return [p.nombre, p.apellidoPaterno, p.apellidoMaterno].map(limpiarEspacios).filter(Boolean).join(' ')
}

export function iniciales(p: Nombre): string {
  const primera = (s: string) => limpiarEspacios(s).charAt(0)
  return (primera(p.nombre) + primera(p.apellidoPaterno)).toUpperCase()
}

const ordenAlfabetico = new Intl.Collator('es', { sensitivity: 'base' })

export function compararPorApellido(a: Nombre, b: Nombre): number {
  return (
    ordenAlfabetico.compare(a.apellidoPaterno, b.apellidoPaterno) ||
    ordenAlfabetico.compare(a.apellidoMaterno, b.apellidoMaterno) ||
    ordenAlfabetico.compare(a.nombre, b.nombre)
  )
}

// En México solo CDMX (55, 56), Guadalajara (33) y Monterrey (81) usan lada de 2 dígitos.
const LADAS_DOS_DIGITOS = /^(55|56|33|81)/

/** Da formato a teléfonos mexicanos de 10 dígitos; cualquier otro se deja como se escribió. */
export function formatoTelefono(s: string): string {
  const d = soloDigitos(s)
  if (d.length !== 10) return limpiarEspacios(s)
  return LADAS_DOS_DIGITOS.test(d)
    ? `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`
    : `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

/**
 * Reparte un nombre escrito en el buscador entre los campos del formulario:
 * los dos últimos términos se toman como apellidos.
 */
export function separarNombre(texto: string): Pick<DatosPaciente, 'nombre' | 'apellidoPaterno' | 'apellidoMaterno'> {
  const partes = limpiarEspacios(texto).split(' ').filter(Boolean)
  if (partes.length <= 1) return { nombre: partes[0] ?? '', apellidoPaterno: '', apellidoMaterno: '' }
  if (partes.length === 2) return { nombre: partes[0], apellidoPaterno: partes[1], apellidoMaterno: '' }
  return {
    nombre: partes.slice(0, -2).join(' '),
    apellidoPaterno: partes[partes.length - 2],
    apellidoMaterno: partes[partes.length - 1],
  }
}
