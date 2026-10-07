import { describe, expect, it } from 'vitest'
import {
  advertenciaRx,
  aDioptrias,
  formatoRx,
  invertirSigno,
  normalizarAV,
  normalizarRx,
  pasoRx,
} from './optometria'

describe('normalizarRx', () => {
  it('da formato de receta a esfera y cilindro', () => {
    expect(normalizarRx('esfera', '-2')).toBe('-2.00')
    expect(normalizarRx('esfera', '1.5')).toBe('+1.50')
    expect(normalizarRx('esfera', '+0,75')).toBe('+0.75')
    expect(normalizarRx('cilindro', '−0.5')).toBe('-0.50')
    expect(normalizarRx('esfera', '0')).toBe('0.00')
  })

  it('acepta el atajo sin punto decimal', () => {
    expect(normalizarRx('esfera', '-125')).toBe('-1.25')
    expect(normalizarRx('cilindro', '-50')).toBe('-0.50')
    expect(normalizarRx('add', '200')).toBe('+2.00')
    expect(normalizarRx('esfera', '-10')).toBe('-10.00')
  })

  it('reconoce neutro y plano', () => {
    expect(normalizarRx('esfera', 'n')).toBe('Neutro')
    expect(normalizarRx('esfera', 'PL')).toBe('Plano')
    expect(aDioptrias('Neutro')).toBe(0)
  })

  it('el eje 0 se escribe 180', () => {
    expect(normalizarRx('eje', '0')).toBe('180')
    expect(normalizarRx('eje', '90°')).toBe('90')
  })

  it('prisma y base', () => {
    expect(normalizarRx('prisma', '2')).toBe('2')
    expect(normalizarRx('prisma', '1.5Δ')).toBe('1.5')
    expect(normalizarRx('base', 'bn')).toBe('BN')
    expect(normalizarRx('base', '270')).toBe('270°')
    expect(normalizarRx('base', 'Nasal')).toBe('Nasal')
  })

  it('es idempotente', () => {
    for (const [tipo, valor] of [
      ['esfera', '-1.25'],
      ['add', '+2.00'],
      ['eje', '180'],
      ['prisma', '0.5'],
      ['av', '20/40'],
      ['base', '90°'],
    ] as const) {
      expect(normalizarRx(tipo, valor)).toBe(valor)
    }
  })

  it('deja intacto lo que no reconoce', () => {
    expect(normalizarRx('esfera', 'sin dato')).toBe('sin dato')
    expect(normalizarRx('esfera', '  ')).toBe('')
  })
})

describe('normalizarAV', () => {
  it('completa la fracción de Snellen', () => {
    expect(normalizarAV('40')).toBe('20/40')
    expect(normalizarAV('20')).toBe('20/20')
    expect(normalizarAV('20-30')).toBe('20/30')
    expect(normalizarAV('20 25')).toBe('20/25')
  })

  it('respeta otras notaciones', () => {
    expect(normalizarAV('20/20-2')).toBe('20/20-2')
    expect(normalizarAV('6/6')).toBe('6/6')
    expect(normalizarAV('cd 1m')).toBe('CD 1m')
    expect(normalizarAV('npl')).toBe('NPL')
  })
})

describe('advertenciaRx', () => {
  it('pide el eje cuando hay cilindro', () => {
    expect(advertenciaRx('eje', '', '-0.75')).toBe('Falta el eje del cilindro')
    expect(advertenciaRx('eje', '', '')).toBeNull()
    expect(advertenciaRx('eje', '180', '-0.75')).toBeNull()
  })

  it('revisa rangos y pasos', () => {
    expect(advertenciaRx('eje', '200', '-1.00')).toMatch(/1° a 180°/)
    expect(advertenciaRx('eje', '90', '')).toMatch(/no aplica/)
    expect(advertenciaRx('esfera', '-1.30')).toMatch(/0.25/)
    expect(advertenciaRx('cilindro', '-12.00')).toMatch(/fuera de lo habitual/)
    expect(advertenciaRx('add', '-1.00')).toMatch(/positivo/)
    expect(advertenciaRx('esfera', 'Neutro')).toBeNull()
    expect(advertenciaRx('esfera', 'abc')).toMatch(/dioptrías/)
  })
})

describe('pasoRx', () => {
  it('sube y baja de 0.25 en 0.25', () => {
    expect(pasoRx('esfera', '-1.00', 1)).toBe('-0.75')
    expect(pasoRx('esfera', '', -1)).toBe('-0.25')
    expect(pasoRx('add', '+2.00', 1, true)).toBe('+3.00')
  })

  it('el eje da la vuelta entre 1° y 180°', () => {
    expect(pasoRx('eje', '180', 1)).toBe('5')
    expect(pasoRx('eje', '5', -1)).toBe('180')
    expect(pasoRx('eje', '90', 1, true)).toBe('91')
    expect(pasoRx('eje', '', -1)).toBe('180')
  })

  it('no aplica a texto libre', () => {
    expect(pasoRx('av', '20/20', 1)).toBeNull()
    expect(pasoRx('esfera', 'abc', 1)).toBeNull()
  })
})

describe('utilidades de receta', () => {
  it('invierte el signo', () => {
    expect(invertirSigno('+1.25')).toBe('-1.25')
    expect(invertirSigno('-2.00')).toBe('+2.00')
    expect(invertirSigno('')).toBe('-')
  })

  it('escribe la notación esfera = cilindro × eje', () => {
    expect(formatoRx({ esfera: '-2.00', cilindro: '-0.75', eje: '180' })).toBe('−2.00 = −0.75 × 180°')
    expect(formatoRx({ esfera: '+1.50', cilindro: '', eje: '' })).toBe('+1.50')
    expect(formatoRx({ esfera: '', cilindro: '-1.00', eje: '90' })).toBe('Neutro = −1.00 × 90°')
    expect(formatoRx({ esfera: '', cilindro: '', eje: '' })).toBe('')
  })
})
