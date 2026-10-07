import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb'
import { formatoId, numeroDeId } from './ids'
import { completar, esObjeto } from './objetos'
import { consultaVacia, datosPacienteVacios, type Consulta, type DatosPaciente, type Paciente } from './tipos'

// Todo vive en IndexedDB de este navegador: nada sale del dispositivo.

type Meta = { clave: 'consecutivo'; valor: number } | { clave: 'ultimoRespaldo'; valor: string }

interface Esquema extends DBSchema {
  pacientes: { key: string; value: Paciente }
  consultas: { key: string; value: Consulta; indexes: { porPaciente: string } }
  meta: { key: Meta['clave']; value: Meta }
}

type TxConsultas = IDBPTransaction<Esquema, ('pacientes' | 'consultas')[], 'readwrite'>

const NOMBRE_DB = 'oculorum-expedientes'

let conexion: Promise<IDBPDatabase<Esquema>> | null = null

function db() {
  conexion ??= openDB<Esquema>(NOMBRE_DB, 1, {
    upgrade(base) {
      base.createObjectStore('pacientes', { keyPath: 'id' })
      base.createObjectStore('consultas', { keyPath: 'id' }).createIndex('porPaciente', 'pacienteId')
      base.createObjectStore('meta', { keyPath: 'clave' })
    },
    blocking(_actual, _nueva, evento) {
      // Otra pestaña abrió una versión más nueva: soltar la conexión.
      ;(evento.target as IDBDatabase).close()
    },
  }).catch((error) => {
    conexion = null
    throw error
  })
  return conexion
}

const ahora = () => new Date().toISOString()

export async function leerTodo(): Promise<{ pacientes: Paciente[]; consecutivo: number; ultimoRespaldo: string | null }> {
  const base = await db()
  const [pacientes, consecutivo, respaldo] = await Promise.all([
    base.getAll('pacientes'),
    base.get('meta', 'consecutivo'),
    base.get('meta', 'ultimoRespaldo'),
  ])
  return {
    pacientes,
    consecutivo: typeof consecutivo?.valor === 'number' ? consecutivo.valor : 0,
    ultimoRespaldo: typeof respaldo?.valor === 'string' ? respaldo.valor : null,
  }
}

/** Da de alta un paciente con el siguiente número de expediente. */
export async function crearPaciente(datos: DatosPaciente): Promise<Paciente> {
  const tx = (await db()).transaction(['pacientes', 'meta'], 'readwrite')
  const registro = await tx.objectStore('meta').get('consecutivo')
  const siguiente = (typeof registro?.valor === 'number' ? registro.valor : 0) + 1
  const fecha = ahora()
  const paciente: Paciente = {
    ...datos,
    id: formatoId(siguiente),
    creado: fecha,
    actualizado: fecha,
    ultimaConsulta: null,
  }
  await Promise.all([
    tx.objectStore('meta').put({ clave: 'consecutivo', valor: siguiente }),
    tx.objectStore('pacientes').add(paciente),
    tx.done,
  ])
  return paciente
}

export async function actualizarPaciente(id: string, datos: DatosPaciente): Promise<Paciente> {
  const tx = (await db()).transaction('pacientes', 'readwrite')
  const actual = await tx.store.get(id)
  if (!actual) throw new Error(`No existe el expediente ${id}`)
  const paciente: Paciente = { ...actual, ...datos, actualizado: ahora() }
  await Promise.all([tx.store.put(paciente), tx.done])
  return paciente
}

/** Borra el expediente junto con todas sus consultas. */
export async function eliminarPaciente(id: string): Promise<void> {
  const tx = (await db()).transaction(['pacientes', 'consultas'], 'readwrite')
  const claves = await tx.objectStore('consultas').index('porPaciente').getAllKeys(id)
  await Promise.all([
    ...claves.map((clave) => tx.objectStore('consultas').delete(clave)),
    tx.objectStore('pacientes').delete(id),
    tx.done,
  ])
}

/** Consultas del paciente, de la más reciente a la más antigua. */
export async function consultasDe(pacienteId: string): Promise<Consulta[]> {
  const consultas = await (await db()).getAllFromIndex('consultas', 'porPaciente', pacienteId)
  return consultas.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado.localeCompare(a.creado))
}

export async function contarConsultas(): Promise<number> {
  return (await db()).count('consultas')
}

export async function obtenerConsulta(id: string): Promise<Consulta | undefined> {
  return (await db()).get('consultas', id)
}

async function refrescarPaciente(tx: TxConsultas, pacienteId: string): Promise<Paciente> {
  const paciente = await tx.objectStore('pacientes').get(pacienteId)
  if (!paciente) throw new Error(`No existe el expediente ${pacienteId}`)
  const fechas = (await tx.objectStore('consultas').index('porPaciente').getAll(pacienteId)).map((c) => c.fecha)
  const actualizado: Paciente = {
    ...paciente,
    ultimaConsulta: fechas.length ? fechas.reduce((a, b) => (a > b ? a : b)) : null,
    actualizado: ahora(),
  }
  await tx.objectStore('pacientes').put(actualizado)
  return actualizado
}

/** Guarda (crea o reemplaza) una consulta y devuelve el paciente actualizado. */
export async function guardarConsulta(consulta: Consulta): Promise<Paciente> {
  const tx = (await db()).transaction(['pacientes', 'consultas'], 'readwrite')
  await tx.objectStore('consultas').put(consulta)
  const paciente = await refrescarPaciente(tx, consulta.pacienteId)
  await tx.done
  return paciente
}

export async function eliminarConsulta(consulta: Consulta): Promise<Paciente> {
  const tx = (await db()).transaction(['pacientes', 'consultas'], 'readwrite')
  await tx.objectStore('consultas').delete(consulta.id)
  const paciente = await refrescarPaciente(tx, consulta.pacienteId)
  await tx.done
  return paciente
}

export async function registrarRespaldo(fecha: string): Promise<void> {
  await (await db()).put('meta', { clave: 'ultimoRespaldo', valor: fecha })
}

// ── Respaldo ───────────────────────────────────────────────────────────────

export interface Respaldo {
  app: 'oculorum'
  formato: 1
  exportado: string
  consecutivo: number
  pacientes: Paciente[]
  consultas: Consulta[]
}

export async function exportar(): Promise<Respaldo> {
  const base = await db()
  const [pacientes, consultas, consecutivo] = await Promise.all([
    base.getAll('pacientes'),
    base.getAll('consultas'),
    base.get('meta', 'consecutivo'),
  ])
  return {
    app: 'oculorum',
    formato: 1,
    exportado: ahora(),
    consecutivo: typeof consecutivo?.valor === 'number' ? consecutivo.valor : 0,
    pacientes,
    consultas,
  }
}

/**
 * Valida un archivo de respaldo. Los campos faltantes se rellenan con valores
 * vacíos para que un respaldo de una versión anterior siga siendo legible.
 */
export function leerRespaldo(datos: unknown): Respaldo {
  if (!esObjeto(datos) || datos.app !== 'oculorum' || !Array.isArray(datos.pacientes) || !Array.isArray(datos.consultas)) {
    throw new Error('El archivo no es un respaldo de Oculorum.')
  }
  if (datos.formato !== 1) throw new Error('El respaldo es de una versión más nueva de la aplicación.')

  const pacientes = datos.pacientes.filter(esObjeto).map((p): Paciente => {
    if (typeof p.id !== 'string' || !p.id) throw new Error('Hay un paciente sin número de expediente.')
    const fecha = typeof p.creado === 'string' ? p.creado : ahora()
    return {
      ...completar(datosPacienteVacios(), p),
      id: p.id,
      creado: fecha,
      actualizado: typeof p.actualizado === 'string' ? p.actualizado : fecha,
      ultimaConsulta: null,
    }
  })
  const ids = new Set(pacientes.map((p) => p.id))
  if (ids.size !== pacientes.length) throw new Error('Hay números de expediente repetidos en el respaldo.')

  const consultas = datos.consultas.filter(esObjeto).map((c): Consulta => {
    if (typeof c.id !== 'string' || typeof c.pacienteId !== 'string' || !ids.has(c.pacienteId)) {
      throw new Error('Hay una consulta que no corresponde a ningún expediente.')
    }
    const fecha = typeof c.creado === 'string' ? c.creado : ahora()
    return {
      ...completar(consultaVacia(''), c),
      id: c.id,
      pacienteId: c.pacienteId,
      creado: fecha,
      actualizado: typeof c.actualizado === 'string' ? c.actualizado : fecha,
    }
  })

  // La fecha de la última consulta se recalcula para que coincida con las consultas del archivo.
  const ultimas = new Map<string, string>()
  for (const c of consultas) {
    if (c.fecha > (ultimas.get(c.pacienteId) ?? '')) ultimas.set(c.pacienteId, c.fecha)
  }
  for (const p of pacientes) p.ultimaConsulta = ultimas.get(p.id) ?? null

  const mayorId = pacientes.reduce((max, p) => Math.max(max, numeroDeId(p.id)), 0)
  const consecutivo = typeof datos.consecutivo === 'number' ? Math.max(datos.consecutivo, mayorId) : mayorId
  return {
    app: 'oculorum',
    formato: 1,
    exportado: typeof datos.exportado === 'string' ? datos.exportado : ahora(),
    consecutivo,
    pacientes,
    consultas,
  }
}

/** Reemplaza todos los datos de este navegador por los del respaldo. */
export async function restaurar(respaldo: Respaldo): Promise<void> {
  const tx = (await db()).transaction(['pacientes', 'consultas', 'meta'], 'readwrite')
  await Promise.all([tx.objectStore('pacientes').clear(), tx.objectStore('consultas').clear()])
  await Promise.all([
    ...respaldo.pacientes.map((p) => tx.objectStore('pacientes').put(p)),
    ...respaldo.consultas.map((c) => tx.objectStore('consultas').put(c)),
    tx.objectStore('meta').put({ clave: 'consecutivo', valor: respaldo.consecutivo }),
    tx.done,
  ])
}
