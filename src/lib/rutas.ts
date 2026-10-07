// Rutas con hash (#/expediente/0001): GitHub Pages solo sirve index.html,
// así que el enrutamiento ocurre por completo en el navegador.

export type Ruta =
  | { nombre: 'inicio' }
  | { nombre: 'nuevo'; nombreSugerido: string }
  | { nombre: 'respaldo' }
  | { nombre: 'paciente'; id: string }
  | { nombre: 'editar-paciente'; id: string }
  | { nombre: 'nueva-consulta'; id: string }
  | { nombre: 'consulta'; id: string; consultaId: string }
  | { nombre: 'editar-consulta'; id: string; consultaId: string }
  | { nombre: 'no-encontrada' }

function decodificar(parte: string): string {
  try {
    return decodeURIComponent(parte)
  } catch {
    return parte
  }
}

export function parsearRuta(hash: string): Ruta {
  const [camino, query = ''] = hash.replace(/^#\/?/, '').split('?')
  const [a, b, c, d, e, ...resto] = camino.split('/').filter(Boolean).map(decodificar)
  if (resto.length) return { nombre: 'no-encontrada' }
  if (!a) return { nombre: 'inicio' }
  if (a === 'nuevo' && !b) return { nombre: 'nuevo', nombreSugerido: new URLSearchParams(query).get('nombre') ?? '' }
  if (a === 'respaldo' && !b) return { nombre: 'respaldo' }
  if (a === 'expediente' && b) {
    if (!c) return { nombre: 'paciente', id: b }
    if (c === 'editar' && !d) return { nombre: 'editar-paciente', id: b }
    if (c === 'consulta' && d === 'nueva' && !e) return { nombre: 'nueva-consulta', id: b }
    if (c === 'consulta' && d && !e) return { nombre: 'consulta', id: b, consultaId: d }
    if (c === 'consulta' && d && e === 'editar') return { nombre: 'editar-consulta', id: b, consultaId: d }
  }
  return { nombre: 'no-encontrada' }
}

const seg = encodeURIComponent

export const rutas = {
  inicio: () => '/',
  respaldo: () => '/respaldo',
  nuevo: (nombre = '') => (nombre ? `/nuevo?${new URLSearchParams({ nombre })}` : '/nuevo'),
  paciente: (id: string) => `/expediente/${seg(id)}`,
  editarPaciente: (id: string) => `/expediente/${seg(id)}/editar`,
  nuevaConsulta: (id: string) => `/expediente/${seg(id)}/consulta/nueva`,
  consulta: (id: string, consultaId: string) => `/expediente/${seg(id)}/consulta/${seg(consultaId)}`,
  editarConsulta: (id: string, consultaId: string) => `/expediente/${seg(id)}/consulta/${seg(consultaId)}/editar`,
}

export const href = (camino: string) => `#${camino}`
