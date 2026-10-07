import { pedirPersistencia } from './almacenamiento'
import * as db from './db'
import { formatoId, numeroDeId } from './ids'
import type { Consulta, DatosPaciente, Paciente } from './tipos'

/** Estado compartido de los expedientes. Las consultas se leen bajo demanda. */
class Expedientes {
  pacientes = $state.raw<Paciente[]>([])
  consecutivo = $state(0)
  ultimoRespaldo = $state<string | null>(null)
  estado = $state<'cargando' | 'listo' | 'error'>('cargando')
  error = $state('')

  siguienteId = $derived(formatoId(this.consecutivo + 1))
  totalPacientes = $derived(this.pacientes.length)

  async iniciar() {
    try {
      const datos = await db.leerTodo()
      this.pacientes = datos.pacientes
      this.consecutivo = datos.consecutivo
      this.ultimoRespaldo = datos.ultimoRespaldo
      this.estado = 'listo'
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e)
      this.estado = 'error'
    }
  }

  porId(id: string): Paciente | undefined {
    return this.pacientes.find((p) => p.id === id)
  }

  #reemplazar(paciente: Paciente) {
    this.pacientes = this.pacientes.map((p) => (p.id === paciente.id ? paciente : p))
  }

  async crear(datos: DatosPaciente): Promise<Paciente> {
    const paciente = await db.crearPaciente($state.snapshot(datos))
    this.pacientes = [...this.pacientes, paciente]
    this.consecutivo = Math.max(this.consecutivo, numeroDeId(paciente.id))
    void pedirPersistencia()
    return paciente
  }

  async actualizar(id: string, datos: DatosPaciente): Promise<Paciente> {
    const paciente = await db.actualizarPaciente(id, $state.snapshot(datos))
    this.#reemplazar(paciente)
    return paciente
  }

  async eliminar(id: string): Promise<void> {
    await db.eliminarPaciente(id)
    this.pacientes = this.pacientes.filter((p) => p.id !== id)
  }

  consultasDe(pacienteId: string): Promise<Consulta[]> {
    return db.consultasDe(pacienteId)
  }

  contarConsultas(): Promise<number> {
    return db.contarConsultas()
  }

  obtenerConsulta(id: string): Promise<Consulta | undefined> {
    return db.obtenerConsulta(id)
  }

  async guardarConsulta(consulta: Consulta): Promise<void> {
    this.#reemplazar(await db.guardarConsulta($state.snapshot(consulta)))
  }

  async eliminarConsulta(consulta: Consulta): Promise<void> {
    this.#reemplazar(await db.eliminarConsulta($state.snapshot(consulta)))
  }

  exportar(): Promise<db.Respaldo> {
    return db.exportar()
  }

  async registrarRespaldo(fecha: string): Promise<void> {
    await db.registrarRespaldo(fecha)
    this.ultimoRespaldo = fecha
  }

  async restaurar(respaldo: db.Respaldo): Promise<void> {
    await db.restaurar(respaldo)
    await this.iniciar()
  }
}

export const expedientes = new Expedientes()
