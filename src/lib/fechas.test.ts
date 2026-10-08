import { describe, expect, it } from 'vitest'
import { edad, formatoMedio, formatoNumerico, haceCuanto, interpretarFecha, textoEdad } from './fechas'

describe('interpretarFecha', () => {
  const hoy = '2026-10-07'

  it('acepta dd/mm/aaaa con o sin separadores', () => {
    expect(interpretarFecha('15/03/1990', hoy)).toBe('1990-03-15')
    expect(interpretarFecha('1/3/1990', hoy)).toBe('1990-03-01')
    expect(interpretarFecha('15-03-1990', hoy)).toBe('1990-03-15')
    expect(interpretarFecha('15031990', hoy)).toBe('1990-03-15')
  })

  it('interpreta años de dos cifras hacia el pasado', () => {
    expect(interpretarFecha('15/03/90', hoy)).toBe('1990-03-15')
    expect(interpretarFecha('01/02/08', hoy)).toBe('2008-02-01')
    expect(interpretarFecha('010226', hoy)).toBe('2026-02-01')
    expect(interpretarFecha('01/02/27', hoy)).toBe('1927-02-01')
  })

  it('rechaza fechas imposibles o incompletas', () => {
    expect(interpretarFecha('31/02/2020', hoy)).toBeNull()
    expect(interpretarFecha('29/02/2023', hoy)).toBeNull()
    expect(interpretarFecha('29/02/2024', hoy)).toBe('2024-02-29')
    expect(interpretarFecha('15/03', hoy)).toBeNull()
    expect(interpretarFecha('', hoy)).toBeNull()
  })
})

describe('edad', () => {
  it('cuenta años cumplidos', () => {
    expect(edad('1990-10-07', '2026-10-07')).toEqual({ anios: 36, meses: 0 })
    expect(edad('1990-10-08', '2026-10-07')).toEqual({ anios: 35, meses: 11 })
    expect(edad('2030-01-01', '2026-10-07')).toBeNull()
  })

  it('en menores de dos años usa meses', () => {
    expect(textoEdad('2025-04-07', '2026-10-07')).toBe('18 meses')
    expect(textoEdad('2026-09-01', '2026-10-07')).toBe('1 mes')
    expect(textoEdad('2020-01-01', '2026-10-07')).toBe('6 años')
  })
})

describe('formatos', () => {
  it('muestra fechas en español de México', () => {
    expect(formatoNumerico('2026-03-05')).toBe('05/03/2026')
    expect(formatoMedio('2026-10-07')).toBe('7 oct 2026')
    expect(formatoNumerico('no es fecha')).toBe('')
  })

  it('describe cuánto tiempo pasó', () => {
    const ahora = new Date(2026, 9, 7, 12)
    expect(haceCuanto(new Date(2026, 9, 7, 8).toISOString(), ahora)).toBe('hoy')
    expect(haceCuanto(new Date(2026, 9, 6, 23).toISOString(), ahora)).toBe('ayer')
    expect(haceCuanto(new Date(2026, 9, 1).toISOString(), ahora)).toBe('hace 6 días')
  })
})
