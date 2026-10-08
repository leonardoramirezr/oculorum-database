import { escribirLocal, leerLocal } from './almacenamiento'

export type Tema = 'auto' | 'claro' | 'oscuro'

const CLAVE = 'oculorum:tema'
const ORDEN: Tema[] = ['auto', 'claro', 'oscuro']

function aplicar(tema: Tema) {
  const raiz = document.documentElement
  if (tema === 'auto') delete raiz.dataset.theme
  else raiz.dataset.theme = tema === 'claro' ? 'light' : 'dark'
}

class PreferenciaTema {
  valor = $state<Tema>('auto')

  constructor() {
    const guardado = leerLocal(CLAVE)
    this.valor = guardado === 'claro' || guardado === 'oscuro' ? guardado : 'auto'
    aplicar(this.valor)
  }

  /** Automático → claro → oscuro. El modo oscuro ayuda en el gabinete con luz tenue. */
  alternar() {
    this.valor = ORDEN[(ORDEN.indexOf(this.valor) + 1) % ORDEN.length]
    aplicar(this.valor)
    escribirLocal(CLAVE, this.valor === 'auto' ? null : this.valor)
  }
}

export const tema = new PreferenciaTema()
