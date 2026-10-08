// Avisos breves (toasts) y diálogos de confirmación compartidos por toda la app.

export interface Aviso {
  id: number
  mensaje: string
  tipo: 'exito' | 'error'
}

export interface OpcionesConfirmacion {
  titulo: string
  mensaje: string
  confirmar: string
  cancelar?: string
  peligro?: boolean
}

interface Confirmacion extends OpcionesConfirmacion {
  responder: (ok: boolean) => void
}

let siguiente = 0

class UI {
  avisos = $state<Aviso[]>([])
  confirmacion = $state.raw<Confirmacion | null>(null)

  avisar(mensaje: string, tipo: Aviso['tipo'] = 'exito') {
    const id = ++siguiente
    this.avisos.push({ id, mensaje, tipo })
    setTimeout(() => this.cerrarAviso(id), tipo === 'error' ? 8000 : 4000)
  }

  cerrarAviso(id: number) {
    this.avisos = this.avisos.filter((a) => a.id !== id)
  }

  confirmar(opciones: OpcionesConfirmacion): Promise<boolean> {
    this.confirmacion?.responder(false)
    return new Promise((resolver) => {
      this.confirmacion = {
        ...opciones,
        responder: (ok) => {
          this.confirmacion = null
          resolver(ok)
        },
      }
    })
  }
}

export const ui = new UI()
