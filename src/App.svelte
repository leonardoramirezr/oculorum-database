<script lang="ts">
  import { CircleAlert } from '@lucide/svelte'
  import { tick } from 'svelte'
  import Avisos from './componentes/Avisos.svelte'
  import DialogoConfirmacion from './componentes/DialogoConfirmacion.svelte'
  import Encabezado from './componentes/Encabezado.svelte'
  import { expedientes } from './lib/expedientes.svelte'
  import { router } from './lib/router.svelte'
  import Consulta from './vistas/Consulta.svelte'
  import FormularioConsulta from './vistas/FormularioConsulta.svelte'
  import FormularioPaciente from './vistas/FormularioPaciente.svelte'
  import Inicio from './vistas/Inicio.svelte'
  import NoEncontrado from './vistas/NoEncontrado.svelte'
  import Paciente from './vistas/Paciente.svelte'
  import Respaldo from './vistas/Respaldo.svelte'

  void expedientes.iniciar()

  const ruta = $derived(router.ruta)
  let principal: HTMLElement

  // Al cambiar de pantalla, llevar el foco al nuevo título para lectores de pantalla.
  let primeraVista = true
  $effect(() => {
    void router.camino
    if (primeraVista) {
      primeraVista = false
      return
    }
    void tick().then(() => {
      const enfocado = document.activeElement
      if (enfocado && enfocado !== document.body && principal.contains(enfocado)) return
      const titulo = principal.querySelector<HTMLElement>('h1')
      titulo?.setAttribute('tabindex', '-1')
      titulo?.focus({ preventScroll: true })
    })
  })

  function saltarAlContenido(e: MouseEvent) {
    e.preventDefault()
    principal.focus()
  }
</script>

<a class="saltar" href="#contenido" onclick={saltarAlContenido}>Saltar al contenido</a>

<Encabezado />

<main id="contenido" bind:this={principal} tabindex="-1">
  {#if expedientes.estado === 'error'}
    <div class="pagina angosta">
      <div class="alerta peligro">
        <CircleAlert size={18} />
        <div class="cuerpo">
          <strong>No se pudo abrir la base de datos de este navegador</strong>
          <span>
            Los expedientes se guardan en el almacenamiento del navegador y parece estar bloqueado (por ejemplo, en
            una ventana privada). Abre la aplicación en una ventana normal.
          </span>
          <span class="tenue">Detalle: {expedientes.error}</span>
        </div>
      </div>
    </div>
  {:else if expedientes.estado === 'listo'}
    {#key router.camino}
      {#if ruta.nombre === 'inicio'}
        <Inicio />
      {:else if ruta.nombre === 'nuevo'}
        <FormularioPaciente nombreSugerido={ruta.nombreSugerido} />
      {:else if ruta.nombre === 'editar-paciente'}
        <FormularioPaciente id={ruta.id} />
      {:else if ruta.nombre === 'paciente'}
        <Paciente id={ruta.id} />
      {:else if ruta.nombre === 'nueva-consulta'}
        <FormularioConsulta id={ruta.id} />
      {:else if ruta.nombre === 'editar-consulta'}
        <FormularioConsulta id={ruta.id} consultaId={ruta.consultaId} />
      {:else if ruta.nombre === 'consulta'}
        <Consulta id={ruta.id} consultaId={ruta.consultaId} />
      {:else if ruta.nombre === 'respaldo'}
        <Respaldo />
      {:else}
        <NoEncontrado />
      {/if}
    {/key}
  {/if}
</main>

<Avisos />
<DialogoConfirmacion />

<style>
  main:focus {
    outline: none;
  }

  main :global(h1:focus) {
    outline: none;
  }

  .saltar {
    position: absolute;
    top: -100px;
    left: 16px;
    z-index: 100;
    padding: 8px 14px;
    border-radius: var(--r);
    background: var(--primario);
    color: var(--sobre-primario);
    font-weight: 600;
  }

  .saltar:focus {
    top: 12px;
  }
</style>
