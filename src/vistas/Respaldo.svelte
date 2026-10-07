<script lang="ts">
  import { Download, Info, LockKeyhole, ShieldCheck, TriangleAlert, Upload } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import { espacioUsado, esPersistente, pedirPersistencia } from '../lib/almacenamiento'
  import { borrarBorradoresDe } from '../lib/borradores'
  import { leerRespaldo, type Respaldo } from '../lib/db'
  import { expedientes } from '../lib/expedientes.svelte'
  import { fechaLocal, formatoHora, formatoMedio, haceCuanto } from '../lib/fechas'
  import { descargarRespaldo } from '../lib/respaldo'
  import { ui } from '../lib/ui.svelte'

  let persistente = $state<boolean | null>(null)
  let espacio = $state<number | null>(null)
  let consultas = $state<number | null>(null)
  let descargando = $state(false)
  let restaurando = $state(false)
  let selector: HTMLInputElement

  async function actualizarResumen() {
    ;[persistente, espacio, consultas] = await Promise.all([
      esPersistente(),
      espacioUsado(),
      expedientes.contarConsultas(),
    ])
  }

  onMount(actualizarResumen)

  function formatoBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  }

  async function descargar() {
    descargando = true
    try {
      await descargarRespaldo()
      ui.avisar('Respaldo descargado')
    } catch (e) {
      ui.avisar(`No se pudo generar el respaldo: ${e instanceof Error ? e.message : e}`, 'error')
    } finally {
      descargando = false
    }
  }

  async function protegerDatos() {
    persistente = await pedirPersistencia()
    if (persistente) ui.avisar('El navegador conservará los expedientes')
    else ui.avisar('El navegador no lo permitió; descarga respaldos con frecuencia', 'error')
  }

  async function alElegirArchivo(e: Event & { currentTarget: HTMLInputElement }) {
    const archivo = e.currentTarget.files?.[0]
    e.currentTarget.value = ''
    if (!archivo) return

    let respaldo: Respaldo
    try {
      respaldo = leerRespaldo(JSON.parse(await archivo.text()))
    } catch (error) {
      const motivo = error instanceof SyntaxError ? 'El archivo no es un respaldo válido.' : (error as Error).message
      ui.avisar(motivo, 'error')
      return
    }

    const actuales = expedientes.totalPacientes
    const ok = await ui.confirmar({
      titulo: 'Restaurar respaldo',
      mensaje:
        `El respaldo del ${formatoMedio(fechaLocal(respaldo.exportado))} tiene ` +
        `${respaldo.pacientes.length} expedientes y ${respaldo.consultas.length} consultas. ` +
        (actuales
          ? `Reemplazará los ${actuales} expedientes que hay en este navegador; lo que no esté en el respaldo se perderá.`
          : 'Se cargarán en este navegador.'),
      confirmar: actuales ? 'Reemplazar datos' : 'Restaurar',
      peligro: actuales > 0,
    })
    if (!ok) return

    restaurando = true
    try {
      await expedientes.restaurar(respaldo)
      borrarBorradoresDe()
      await actualizarResumen()
      ui.avisar('Respaldo restaurado')
    } catch (error) {
      ui.avisar(`No se pudo restaurar: ${error instanceof Error ? error.message : error}`, 'error')
    } finally {
      restaurando = false
    }
  }
</script>

<svelte:head><title>Respaldo · Oculorum</title></svelte:head>

<div class="pagina angosta">
  <div class="cabecera-pagina">
    <div>
      <h1>Respaldo de datos</h1>
      <p class="subtitulo">
        Los expedientes se guardan solo en este navegador y en este dispositivo; no se envían a ningún servidor.
      </p>
    </div>
  </div>

  <dl class="resumen tarjeta">
    <div>
      <dt>Expedientes</dt>
      <dd class="tabular">{expedientes.totalPacientes}</dd>
    </div>
    <div>
      <dt>Consultas</dt>
      <dd class="tabular">{consultas ?? '—'}</dd>
    </div>
    <div>
      <dt>Espacio usado</dt>
      <dd class="tabular">{espacio === null ? '—' : formatoBytes(espacio)}</dd>
    </div>
    <div>
      <dt>Último respaldo</dt>
      <dd>
        {#if expedientes.ultimoRespaldo}
          <span title="{formatoMedio(fechaLocal(expedientes.ultimoRespaldo))}, {formatoHora(expedientes.ultimoRespaldo)}">
            {haceCuanto(expedientes.ultimoRespaldo)}
          </span>
        {:else}
          Nunca
        {/if}
      </dd>
    </div>
  </dl>

  <section class="tarjeta bloque" aria-labelledby="titulo-descargar">
    <span class="icono"><Download size={20} /></span>
    <div class="cuerpo">
      <h2 id="titulo-descargar">Descargar respaldo</h2>
      <p>
        Genera un archivo con todos los expedientes y consultas. Guárdalo fuera de este equipo (una memoria USB, tu
        nube o tu correo) para no perder información si se borran los datos del navegador o cambias de computadora.
      </p>
      <p class="nota"><LockKeyhole size={14} /> El archivo contiene datos personales y de salud: guárdalo en un lugar seguro.</p>
    </div>
    <button type="button" class="btn btn-primario" onclick={descargar} disabled={descargando}>
      <Download size={18} /> Descargar
    </button>
  </section>

  <section class="tarjeta bloque" aria-labelledby="titulo-restaurar">
    <span class="icono"><Upload size={20} /></span>
    <div class="cuerpo">
      <h2 id="titulo-restaurar">Restaurar respaldo</h2>
      <p>
        Carga un archivo de respaldo para recuperar los expedientes en este u otro dispositivo. Los datos actuales se
        reemplazan por los del archivo.
      </p>
    </div>
    <button type="button" class="btn btn-secundario" onclick={() => selector.click()} disabled={restaurando}>
      <Upload size={18} /> Elegir archivo…
    </button>
    <input
      bind:this={selector}
      class="sr-only"
      type="file"
      accept="application/json,.json"
      tabindex="-1"
      aria-hidden="true"
      onchange={alElegirArchivo}
    />
  </section>

  {#if persistente === false}
    <div class="alerta aviso">
      <TriangleAlert size={18} />
      <div class="cuerpo">
        <strong>El navegador podría borrar los datos si se queda sin espacio</strong>
        <span class="tenue">Puedes pedirle que los conserve. Aun así, descarga respaldos con frecuencia.</span>
      </div>
      <button type="button" class="btn btn-secundario btn-sm" onclick={protegerDatos}>
        <ShieldCheck size={16} /> Conservar datos
      </button>
    </div>
  {:else if persistente}
    <div class="alerta info">
      <ShieldCheck size={18} />
      <div class="cuerpo">
        <strong>Almacenamiento protegido</strong>
        <span class="tenue">El navegador no borrará los expedientes por falta de espacio.</span>
      </div>
    </div>
  {/if}

  <section class="consejos" aria-labelledby="titulo-consejos">
    <h2 id="titulo-consejos"><Info size={16} /> Para no perder información</h2>
    <ul>
      <li>Captura siempre desde el mismo navegador y dispositivo: cada navegador guarda sus propios datos.</li>
      <li>Si borras el historial con «cookies y datos de sitios», también se borran los expedientes.</li>
      <li>Descarga un respaldo al terminar la jornada o, al menos, una vez por semana.</li>
    </ul>
  </section>
</div>

<style>
  .resumen {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0 0 16px;
    padding: 0;
    overflow: hidden;
  }

  .resumen div {
    padding: 16px 20px;
  }

  .resumen div + div {
    border-left: 1px solid var(--borde);
  }

  dt {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--texto-3);
  }

  dd {
    margin: 4px 0 0;
    font-size: 1.25rem;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  .bloque {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
    padding: 20px 24px;
  }

  .icono {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--primario-suave);
    color: var(--primario);
  }

  .cuerpo {
    flex: 1;
    min-width: 0;
  }

  .bloque p {
    margin-top: 4px;
    font-size: 0.9rem;
    color: var(--texto-2);
  }

  .bloque .nota {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    font-size: 0.8125rem;
    color: var(--texto-3);
  }

  .alerta {
    align-items: center;
    margin-bottom: 16px;
  }

  .consejos {
    margin-top: 32px;
    padding: 0 4px;
  }

  .consejos h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9375rem;
  }

  .consejos ul {
    margin: 10px 0 0;
    padding-left: 20px;
    color: var(--texto-2);
    font-size: 0.9rem;
  }

  .consejos li + li {
    margin-top: 6px;
  }

  @media (max-width: 640px) {
    .resumen {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .resumen div:nth-child(3) {
      border-left: 0;
    }

    .resumen div:nth-child(n + 3) {
      border-top: 1px solid var(--borde);
    }

    .bloque {
      flex-wrap: wrap;
      padding: 16px;
    }

    .bloque .btn {
      width: 100%;
    }

    .alerta {
      flex-wrap: wrap;
    }
  }
</style>
