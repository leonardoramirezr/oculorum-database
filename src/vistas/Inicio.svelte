<script lang="ts">
  import { DatabaseBackup, FolderOpen, Search, UserRoundPlus, X } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import FilaPaciente from '../componentes/FilaPaciente.svelte'
  import Vacio from '../componentes/Vacio.svelte'
  import { buscarPacientes, recientes } from '../lib/buscar'
  import { expedientes } from '../lib/expedientes.svelte'
  import { diasDesde, haceCuanto } from '../lib/fechas'
  import { descargarRespaldo } from '../lib/respaldo'
  import { router } from '../lib/router.svelte'
  import { href, rutas } from '../lib/rutas'
  import { ui } from '../lib/ui.svelte'

  let consulta = $state('')
  /** Renglón resaltado con ↑/↓; Enter lo abre. */
  let activo = $state(-1)
  let buscador: HTMLInputElement

  const buscando = $derived(consulta.trim() !== '')
  const total = $derived(expedientes.pacientes.length)
  const lista = $derived(
    buscando ? buscarPacientes(expedientes.pacientes, consulta) : recientes(expedientes.pacientes),
  )
  const respaldoPendiente = $derived(
    total > 0 && (!expedientes.ultimoRespaldo || diasDesde(expedientes.ultimoRespaldo) > 7),
  )

  onMount(() => {
    // En celulares no abrir el teclado sin que la persona lo pida.
    if (matchMedia('(pointer: fine)').matches) buscador.focus()
  })

  function escribir(valor: string) {
    consulta = valor
    activo = valor.trim() ? 0 : -1
  }

  function alTeclear(e: KeyboardEvent) {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && lista.length) {
      e.preventDefault()
      const paso = e.key === 'ArrowDown' ? 1 : -1
      activo = (activo + paso + lista.length) % lista.length
    } else if (e.key === 'Enter' && lista[activo]) {
      e.preventDefault()
      router.ir(rutas.paciente(lista[activo].id))
    } else if (e.key === 'Escape' && consulta) {
      e.preventDefault()
      escribir('')
    }
  }

  async function respaldar() {
    try {
      await descargarRespaldo()
      ui.avisar('Respaldo descargado')
    } catch {
      ui.avisar('No se pudo generar el respaldo', 'error')
    }
  }
</script>

<svelte:head><title>Pacientes · Oculorum</title></svelte:head>

<div class="pagina">
  {#if respaldoPendiente}
    <div class="alerta aviso respaldo">
      <DatabaseBackup size={18} />
      <div class="cuerpo">
        <strong>Descarga un respaldo de tus expedientes</strong>
        <span class="tenue">
          {expedientes.ultimoRespaldo
            ? `El último fue ${haceCuanto(expedientes.ultimoRespaldo)}.`
            : 'Todavía no has descargado ninguno.'}
          Los datos solo están guardados en este navegador.
        </span>
      </div>
      <button type="button" class="btn btn-secundario btn-sm" onclick={respaldar}>Descargar respaldo</button>
    </div>
  {/if}

  <section class="buscador" aria-labelledby="titulo-inicio">
    <h1 id="titulo-inicio">Pacientes</h1>
    <p class="subtitulo">Busca un expediente por nombre, número o teléfono, o abre uno nuevo.</p>
    <div class="caja-busqueda">
      <Search size={20} class="lupa" />
      <input
        bind:this={buscador}
        type="search"
        class="control"
        placeholder="Ej. María López, 0012 o 55 1234 5678"
        aria-label="Buscar paciente"
        aria-describedby="ayuda-busqueda"
        autocomplete="off"
        spellcheck="false"
        enterkeyhint="search"
        bind:value={() => consulta, escribir}
        onkeydown={alTeclear}
      />
      {#if consulta}
        <button
          type="button"
          class="limpiar"
          aria-label="Limpiar búsqueda"
          onclick={() => {
            escribir('')
            buscador.focus()
          }}
        >
          <X size={18} />
        </button>
      {/if}
    </div>
    <p id="ayuda-busqueda" class="ayuda">Usa ↑ ↓ para elegir y Enter para abrir el expediente.</p>
  </section>

  {#if total === 0}
    <div class="tarjeta primera-vez">
      <Vacio
        titulo="Aún no hay expedientes"
        texto="Abre el primer expediente: captura los datos del paciente y se le asignará un número para encontrarlo en sus siguientes visitas."
      >
        {#snippet icono()}<FolderOpen size={26} />{/snippet}
        <a class="btn btn-primario" href={href(rutas.nuevo())}><UserRoundPlus size={18} /> Abrir el primer expediente</a>
      </Vacio>
    </div>
  {:else if buscando}
    <div class="titulo-seccion">
      <h2>Resultados</h2>
      <span class="conteo" aria-live="polite">
        {lista.length === 1 ? '1 paciente' : `${lista.length} pacientes`}
      </span>
    </div>
    {#if lista.length}
      <ul class="lista tarjeta">
        {#each lista as paciente, i (paciente.id)}
          <li><FilaPaciente {paciente} activa={i === activo} /></li>
        {/each}
      </ul>
    {:else}
      <div class="tarjeta">
        <Vacio
          titulo="No encontramos «{consulta.trim()}»"
          texto="Revisa cómo está escrito o, si es un paciente nuevo, ábrele un expediente."
        >
          {#snippet icono()}<Search size={26} />{/snippet}
          <a class="btn btn-primario" href={href(rutas.nuevo(/\d/.test(consulta) ? '' : consulta.trim()))}>
            <UserRoundPlus size={18} /> Abrir expediente nuevo
          </a>
        </Vacio>
      </div>
    {/if}
  {:else}
    <div class="titulo-seccion">
      <h2>Actividad reciente</h2>
      <span class="conteo">{total === 1 ? '1 expediente' : `${total} expedientes`} en este dispositivo</span>
    </div>
    <ul class="lista tarjeta">
      {#each lista as paciente, i (paciente.id)}
        <li><FilaPaciente {paciente} activa={i === activo} /></li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .respaldo {
    align-items: center;
    margin-bottom: 24px;
  }

  .respaldo .cuerpo span {
    font-size: 0.8125rem;
  }

  .buscador {
    padding: 12px 0 4px;
  }

  .subtitulo {
    margin-top: 6px;
    color: var(--texto-2);
  }

  .caja-busqueda {
    position: relative;
    margin-top: 20px;
  }

  .caja-busqueda :global(.lupa) {
    position: absolute;
    top: 50%;
    left: 16px;
    transform: translateY(-50%);
    color: var(--texto-3);
    pointer-events: none;
  }

  .caja-busqueda input {
    min-height: 54px;
    padding: 0 48px 0 48px;
    border-radius: var(--r-lg);
    font-size: 1.0625rem;
    box-shadow: var(--sombra);
  }

  .caja-busqueda input::-webkit-search-cancel-button {
    display: none;
  }

  .limpiar {
    position: absolute;
    top: 50%;
    right: 10px;
    display: flex;
    padding: 6px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--texto-3);
    transform: translateY(-50%);
  }

  .limpiar:hover {
    background: var(--superficie-3);
    color: var(--texto);
  }

  .ayuda {
    margin-top: 8px;
  }

  @media (pointer: coarse) {
    .ayuda {
      display: none;
    }
  }

  .primera-vez {
    margin-top: 28px;
  }

  .lista {
    margin: 0;
    padding: 0;
    overflow: hidden;
    list-style: none;
  }

  .lista li + li {
    border-top: 1px solid var(--borde);
  }

  @media (max-width: 640px) {
    .respaldo {
      flex-wrap: wrap;
    }

    .respaldo .btn {
      margin-left: 30px;
    }
  }
</style>
