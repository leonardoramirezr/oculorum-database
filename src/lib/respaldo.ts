import { expedientes } from './expedientes.svelte'
import { hoyISO } from './fechas'

/** Descarga todos los expedientes como un archivo JSON y anota la fecha del respaldo. */
export async function descargarRespaldo(): Promise<void> {
  const datos = await expedientes.exportar()
  const archivo = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `oculorum-respaldo-${hoyISO()}.json`
  document.body.append(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  await expedientes.registrarRespaldo(datos.exportado)
}
