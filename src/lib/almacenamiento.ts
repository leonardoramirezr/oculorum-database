/**
 * Pide al navegador que no borre los datos por falta de espacio. Chrome y Edge
 * lo conceden casi siempre a sitios usados con frecuencia; Safari no lo garantiza.
 */
export async function pedirPersistencia(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    return (await navigator.storage.persisted()) || (await navigator.storage.persist())
  } catch {
    return false
  }
}

export async function esPersistente(): Promise<boolean | null> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null
  } catch {
    return null
  }
}

export async function espacioUsado(): Promise<number | null> {
  try {
    return (await navigator.storage?.estimate?.())?.usage ?? null
  } catch {
    return null
  }
}

// localStorage puede no existir o lanzar excepciones (modo privado, cuota llena).
export function leerLocal(clave: string): string | null {
  try {
    return localStorage.getItem(clave)
  } catch {
    return null
  }
}

export function escribirLocal(clave: string, valor: string | null): void {
  try {
    if (valor === null) localStorage.removeItem(clave)
    else localStorage.setItem(clave, valor)
  } catch {
    // sin almacenamiento local: se pierde solo la comodidad (borrador o tema)
  }
}
