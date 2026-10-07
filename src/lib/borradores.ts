import { escribirLocal, leerLocal } from './almacenamiento'

// Copia automática de una consulta mientras se captura, para no perderla si
// se cierra la pestaña o se navega a otra pantalla antes de guardar.

const PREFIJO = 'oculorum:borrador:'

export interface Borrador<T> {
  datos: T
  guardado: string
}

export const claveBorrador = (pacienteId: string, consultaId?: string) => `${pacienteId}:${consultaId ?? 'nueva'}`

export function leerBorrador<T>(clave: string): Borrador<T> | null {
  const texto = leerLocal(PREFIJO + clave)
  if (!texto) return null
  try {
    const borrador = JSON.parse(texto)
    return borrador && typeof borrador.guardado === 'string' && borrador.datos ? borrador : null
  } catch {
    return null
  }
}

export function guardarBorrador<T>(clave: string, datos: T): string {
  const guardado = new Date().toISOString()
  escribirLocal(PREFIJO + clave, JSON.stringify({ datos, guardado }))
  return guardado
}

export function borrarBorrador(clave: string): void {
  escribirLocal(PREFIJO + clave, null)
}

/** Sin argumento borra todos los borradores. */
export function borrarBorradoresDe(pacienteId?: string): void {
  const inicio = pacienteId === undefined ? PREFIJO : `${PREFIJO}${pacienteId}:`
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(inicio))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // sin localStorage no hay borradores que borrar
  }
}
