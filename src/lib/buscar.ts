import { numeroDeId } from './ids'
import type { DatosPaciente, Paciente } from './tipos'
import { compararPorApellido, nombreCompleto, normalizar, soloDigitos } from './texto'

/**
 * Busca por número de expediente ("12", "0012", "exp 12", "#12"), por teléfono
 * (3 dígitos o más) o por nombre: cada palabra escrita debe coincidir con el
 * inicio de alguna palabra del nombre, sin importar acentos ni mayúsculas.
 */
export function buscarPacientes(pacientes: readonly Paciente[], consulta: string, limite = 30): Paciente[] {
  const q = normalizar(consulta)
  if (!q) return []

  const sinPrefijo = q.replace(/^(expediente|exp|num|no|id)?[\s.#:º°-]*/, '')
  const esNumero = /^[\d\s-]+$/.test(sinPrefijo) && /\d/.test(sinPrefijo)
  const digitos = soloDigitos(sinPrefijo)
  const terminos = q.split(' ')

  const encontrados: { paciente: Paciente; puntos: number }[] = []
  for (const paciente of pacientes) {
    let puntos = 0
    if (esNumero) {
      if (numeroDeId(paciente.id) === Number(digitos)) puntos = 100
      else if (digitos.length >= 3 && soloDigitos(paciente.telefono).includes(digitos)) puntos = 60
    } else {
      const nombre = normalizar(nombreCompleto(paciente))
      const palabras = nombre.split(' ')
      if (terminos.every((t) => palabras.some((p) => p.startsWith(t)))) {
        puntos = nombre.startsWith(q) ? 60 : 50
      } else if (nombre.includes(q)) {
        puntos = 30
      }
    }
    if (puntos > 0) encontrados.push({ paciente, puntos })
  }

  return encontrados
    .sort((a, b) => b.puntos - a.puntos || compararPorApellido(a.paciente, b.paciente))
    .slice(0, limite)
    .map((e) => e.paciente)
}

/** Pacientes con actividad más reciente (alta, edición o consulta). */
export function recientes(pacientes: readonly Paciente[], limite = 8): Paciente[] {
  return [...pacientes].sort((a, b) => b.actualizado.localeCompare(a.actualizado)).slice(0, limite)
}

/** Expedientes que parecen ser de la misma persona, para evitar duplicados. */
export function posiblesDuplicados(
  pacientes: readonly Paciente[],
  datos: Pick<DatosPaciente, 'nombre' | 'apellidoPaterno' | 'apellidoMaterno'>,
  excluirId?: string,
): Paciente[] {
  const nombre = normalizar(datos.nombre)
  const paterno = normalizar(datos.apellidoPaterno)
  const materno = normalizar(datos.apellidoMaterno)
  if (!nombre || !paterno) return []
  return pacientes.filter(
    (p) =>
      p.id !== excluirId &&
      normalizar(p.nombre) === nombre &&
      normalizar(p.apellidoPaterno) === paterno &&
      (!materno || !p.apellidoMaterno || normalizar(p.apellidoMaterno) === materno),
  )
}
