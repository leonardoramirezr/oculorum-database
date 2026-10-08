import { parsearRuta, type Ruta } from './rutas'

class Router {
  ruta = $state.raw<Ruta>(parsearRuta(location.hash))
  /** Cambia en cada navegación; sirve para reiniciar la vista aunque la ruta se repita. */
  camino = $state(location.hash)

  constructor() {
    window.addEventListener('hashchange', () => this.#sincronizar())
  }

  #sincronizar() {
    this.ruta = parsearRuta(location.hash)
    this.camino = location.hash
    window.scrollTo(0, 0)
  }

  /** `reemplazar` evita que «atrás» regrese a la pantalla actual (p. ej. un formulario ya guardado). */
  ir(camino: string, { reemplazar = false } = {}) {
    if (reemplazar) {
      history.replaceState(history.state, '', `#${camino}`)
      this.#sincronizar()
    } else {
      location.hash = camino
    }
  }
}

export const router = new Router()
