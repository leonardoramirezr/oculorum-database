import { describe, expect, it } from 'vitest'
import { buscarPacientes, posiblesDuplicados, recientes } from './buscar'
import type { Paciente } from './tipos'

function paciente(id: string, nombre: string, paterno: string, materno: string, extra: Partial<Paciente> = {}): Paciente {
  return {
    id,
    nombre,
    apellidoPaterno: paterno,
    apellidoMaterno: materno,
    fechaNacimiento: '1990-01-01',
    domicilio: '',
    telefono: '',
    creado: '2026-01-01T00:00:00.000Z',
    actualizado: '2026-01-01T00:00:00.000Z',
    ultimaConsulta: null,
    ...extra,
  }
}

const pacientes = [
  paciente('0001', 'María José', 'López', 'García', { telefono: '55 1234 5678' }),
  paciente('0002', 'José', 'Martínez', 'Núñez', { actualizado: '2026-05-01T00:00:00.000Z' }),
  paciente('0012', 'Ana', 'Lozano', '', { telefono: '222 555 0101' }),
]

const ids = (lista: Paciente[]) => lista.map((p) => p.id)

describe('buscarPacientes', () => {
  it('encuentra por número de expediente', () => {
    expect(ids(buscarPacientes(pacientes, '12'))).toEqual(['0012'])
    expect(ids(buscarPacientes(pacientes, '0012'))).toEqual(['0012'])
    expect(ids(buscarPacientes(pacientes, 'exp. 1'))).toEqual(['0001'])
    expect(ids(buscarPacientes(pacientes, '#2'))).toEqual(['0002'])
  })

  it('encuentra por teléfono', () => {
    expect(ids(buscarPacientes(pacientes, '5512'))).toEqual(['0001'])
    expect(ids(buscarPacientes(pacientes, '555 0101'))).toEqual(['0012'])
  })

  it('encuentra por nombre sin importar acentos ni orden', () => {
    expect(ids(buscarPacientes(pacientes, 'maria lopez'))).toEqual(['0001'])
    expect(ids(buscarPacientes(pacientes, 'nunez'))).toEqual(['0002'])
    // Primero quien tiene ese nombre de pila
    expect(ids(buscarPacientes(pacientes, 'jose'))).toEqual(['0002', '0001'])
    expect(ids(buscarPacientes(pacientes, 'lo'))).toEqual(['0001', '0012'])
  })

  it('no devuelve nada con una búsqueda vacía o sin coincidencias', () => {
    expect(buscarPacientes(pacientes, '  ')).toEqual([])
    expect(buscarPacientes(pacientes, 'pedro')).toEqual([])
  })
})

describe('recientes y duplicados', () => {
  it('ordena por actividad', () => {
    expect(ids(recientes(pacientes, 1))).toEqual(['0002'])
  })

  it('detecta un posible expediente duplicado', () => {
    const datos = { nombre: 'maria jose', apellidoPaterno: 'LOPEZ', apellidoMaterno: '' }
    expect(ids(posiblesDuplicados(pacientes, datos))).toEqual(['0001'])
    expect(posiblesDuplicados(pacientes, datos, '0001')).toEqual([])
    expect(posiblesDuplicados(pacientes, { ...datos, apellidoMaterno: 'Pérez' })).toEqual([])
  })
})
