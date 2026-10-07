export interface Paciente {
  /** Número de expediente consecutivo, p. ej. "0007". */
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  /** AAAA-MM-DD */
  fechaNacimiento: string
  domicilio: string
  telefono: string
  /** Fecha y hora ISO */
  creado: string
  /** Fecha y hora ISO; también cambia al guardar una consulta. */
  actualizado: string
  /** AAAA-MM-DD de la consulta más reciente, o null si no tiene. */
  ultimaConsulta: string | null
}

export type DatosPaciente = Pick<
  Paciente,
  'nombre' | 'apellidoPaterno' | 'apellidoMaterno' | 'fechaNacimiento' | 'domicilio' | 'telefono'
>

/** Graduación en notación esfera = cilindro × eje. */
export interface RxOjo {
  esfera: string
  cilindro: string
  eje: string
}

export interface RxSubjetivaOjo extends RxOjo {
  add: string
  prisma: string
  base: string
  av: string
}

export interface Consulta {
  id: string
  pacienteId: string
  /** AAAA-MM-DD */
  fecha: string
  motivo: string
  antecedentes: string
  agudezaVisual: { od: string; oi: string; ou: string; notas: string }
  lensometria: { sinLentes: boolean; od: RxOjo; oi: RxOjo }
  refraccion: { od: RxSubjetivaOjo; oi: RxSubjetivaOjo }
  exploracion: string
  diagnostico: string
  tratamiento: string
  creado: string
  actualizado: string
}

export type DatosConsulta = Omit<Consulta, 'id' | 'pacienteId' | 'creado' | 'actualizado'>

export const rxOjoVacio = (): RxOjo => ({ esfera: '', cilindro: '', eje: '' })

export const rxSubjetivaVacia = (): RxSubjetivaOjo => ({
  ...rxOjoVacio(),
  add: '',
  prisma: '',
  base: '',
  av: '',
})

export function consultaVacia(fecha: string): DatosConsulta {
  return {
    fecha,
    motivo: '',
    antecedentes: '',
    agudezaVisual: { od: '', oi: '', ou: '', notas: '' },
    lensometria: { sinLentes: false, od: rxOjoVacio(), oi: rxOjoVacio() },
    refraccion: { od: rxSubjetivaVacia(), oi: rxSubjetivaVacia() },
    exploracion: '',
    diagnostico: '',
    tratamiento: '',
  }
}

export const datosPacienteVacios = (): DatosPaciente => ({
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  domicilio: '',
  telefono: '',
})
