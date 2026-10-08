import { describe, expect, it } from 'vitest'
import { leerRespaldo } from './db'
import { formatoId, numeroDeId } from './ids'
import { parsearRuta, rutas } from './rutas'
import { formatoTelefono, separarNombre } from './texto'

describe('texto', () => {
  it('da formato a teléfonos mexicanos', () => {
    expect(formatoTelefono('5512345678')).toBe('55 1234 5678')
    expect(formatoTelefono('(222) 123-4567')).toBe('222 123 4567')
    expect(formatoTelefono('+52 1 55 1234 5678')).toBe('+52 1 55 1234 5678')
  })

  it('reparte un nombre escrito en el buscador', () => {
    expect(separarNombre('Juan')).toEqual({ nombre: 'Juan', apellidoPaterno: '', apellidoMaterno: '' })
    expect(separarNombre('Juan Pérez')).toEqual({ nombre: 'Juan', apellidoPaterno: 'Pérez', apellidoMaterno: '' })
    expect(separarNombre('María José López García')).toEqual({
      nombre: 'María José',
      apellidoPaterno: 'López',
      apellidoMaterno: 'García',
    })
  })
})

describe('ids y rutas', () => {
  it('numera expedientes con cuatro cifras', () => {
    expect(formatoId(7)).toBe('0007')
    expect(formatoId(12345)).toBe('12345')
    expect(numeroDeId('0042')).toBe(42)
  })

  it('interpreta las rutas', () => {
    expect(parsearRuta('')).toEqual({ nombre: 'inicio' })
    expect(parsearRuta('#/expediente/0007')).toEqual({ nombre: 'paciente', id: '0007' })
    expect(parsearRuta('#' + rutas.nuevaConsulta('0007'))).toEqual({ nombre: 'nueva-consulta', id: '0007' })
    expect(parsearRuta('#' + rutas.editarConsulta('0007', 'abc'))).toEqual({
      nombre: 'editar-consulta',
      id: '0007',
      consultaId: 'abc',
    })
    expect(parsearRuta('#' + rutas.nuevo('Juan Pérez'))).toEqual({ nombre: 'nuevo', nombreSugerido: 'Juan Pérez' })
    expect(parsearRuta('#/otra/cosa')).toEqual({ nombre: 'no-encontrada' })
  })
})

describe('leerRespaldo', () => {
  const base = {
    app: 'oculorum',
    formato: 1,
    exportado: '2026-10-07T12:00:00.000Z',
    consecutivo: 3,
    pacientes: [{ id: '0005', nombre: 'Ana', apellidoPaterno: 'Ruiz', creado: '2026-01-01T00:00:00.000Z' }],
    consultas: [{ id: 'c1', pacienteId: '0005', fecha: '2026-02-01', motivo: 'Revisión', refraccion: { od: { esfera: '-1.00' } } }],
  }

  it('completa campos faltantes y corrige el consecutivo', () => {
    const r = leerRespaldo(base)
    expect(r.consecutivo).toBe(5)
    expect(r.pacientes[0].telefono).toBe('')
    expect(r.consultas[0].refraccion.od.esfera).toBe('-1.00')
    expect(r.consultas[0].refraccion.oi.av).toBe('')
    expect(r.consultas[0].lensometria.sinLentes).toBe(false)
    expect(r.pacientes[0].ultimaConsulta).toBe('2026-02-01')
  })

  it('rechaza archivos ajenos o inconsistentes', () => {
    expect(() => leerRespaldo({ foo: 1 })).toThrow(/no es un respaldo/)
    expect(() => leerRespaldo({ ...base, formato: 2 })).toThrow(/más nueva/)
    expect(() => leerRespaldo({ ...base, consultas: [{ id: 'c2', pacienteId: '9999' }] })).toThrow(/ningún expediente/)
    expect(() => leerRespaldo({ ...base, pacientes: [...base.pacientes, ...base.pacientes] })).toThrow(/repetidos/)
  })
})
