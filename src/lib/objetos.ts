export const esObjeto = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)

/**
 * Copia de `base` con los valores de `fuente` que existan con el mismo tipo,
 * de forma recursiva. Sirve para leer datos guardados por versiones anteriores
 * (respaldos, borradores) sin campos faltantes ni tipos inesperados.
 */
export function completar<T>(base: T, fuente: unknown): T {
  if (!esObjeto(base) || !esObjeto(fuente)) return base
  const resultado: Record<string, unknown> = { ...base }
  for (const [clave, valorBase] of Object.entries(base)) {
    const valor = fuente[clave]
    if (esObjeto(valorBase)) resultado[clave] = completar(valorBase, valor)
    else if (typeof valor === typeof valorBase) resultado[clave] = valor
  }
  return resultado as T
}
