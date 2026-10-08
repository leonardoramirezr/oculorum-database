<script lang="ts">
  import { Copy, MapPin, Phone } from '@lucide/svelte'
  import type { Snippet } from 'svelte'
  import { formatoNumerico, textoEdad } from '../lib/fechas'
  import { nombreCompleto, soloDigitos } from '../lib/texto'
  import type { Paciente } from '../lib/tipos'
  import { ui } from '../lib/ui.svelte'
  import Avatar from './Avatar.svelte'

  interface Props {
    paciente: Paciente
    acciones?: Snippet
  }

  let { paciente, acciones }: Props = $props()

  async function copiarExpediente() {
    try {
      await navigator.clipboard.writeText(paciente.id)
      ui.avisar(`Número de expediente ${paciente.id} copiado`)
    } catch {
      ui.avisar('No se pudo copiar el número de expediente', 'error')
    }
  }
</script>

<header class="encabezado-paciente tarjeta">
  <Avatar {paciente} tamano="grande" />
  <div class="datos">
    <h1>{nombreCompleto(paciente)}</h1>
    <div class="linea">
      <button
        type="button"
        class="insignia expediente copiar"
        onclick={copiarExpediente}
        title="Copiar número de expediente"
      >
        Exp. {paciente.id}
        <Copy size={12} strokeWidth={2.25} />
      </button>
      {#if paciente.fechaNacimiento}
        <span class="edad">{textoEdad(paciente.fechaNacimiento)}</span>
        <span class="tenue"><span class="separador" aria-hidden="true">·&nbsp;</span>Nació el {formatoNumerico(paciente.fechaNacimiento)}</span>
      {/if}
    </div>
    {#if paciente.telefono || paciente.domicilio}
      <dl class="contacto">
        {#if paciente.telefono}
          <div>
            <dt><Phone size={15} /><span class="sr-only">Teléfono</span></dt>
            <dd><a href="tel:{soloDigitos(paciente.telefono)}">{paciente.telefono}</a></dd>
          </div>
        {/if}
        {#if paciente.domicilio}
          <div>
            <dt><MapPin size={15} /><span class="sr-only">Domicilio</span></dt>
            <dd>{paciente.domicilio}</dd>
          </div>
        {/if}
      </dl>
    {/if}
  </div>
  {#if acciones}<div class="acciones no-imprimir">{@render acciones()}</div>{/if}
</header>

<style>
  .encabezado-paciente {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    padding: 22px 24px;
  }

  .datos {
    flex: 1;
    min-width: 0;
  }

  h1 {
    font-size: 1.5rem;
    overflow-wrap: anywhere;
  }

  .linea {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin-top: 8px;
    font-size: 0.875rem;
  }

  .copiar {
    border: 0;
    cursor: pointer;
  }

  .copiar:hover {
    background: var(--primario-suave-2);
  }

  .copiar:focus-visible {
    outline: none;
    box-shadow: var(--anillo);
  }

  .edad {
    font-weight: 600;
  }

  .contacto {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 20px;
    margin: 12px 0 0;
    font-size: 0.875rem;
    color: var(--texto-2);
  }

  .contacto div {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
  }

  .contacto dt {
    display: flex;
    padding-top: 2px;
    color: var(--texto-3);
  }

  .contacto dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .acciones {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (max-width: 760px) {
    .encabezado-paciente {
      flex-wrap: wrap;
      padding: 18px;
      gap: 14px;
    }

    .datos {
      flex-basis: calc(100% - 76px);
    }

    .acciones {
      width: 100%;
    }

    .separador {
      display: none;
    }

    .acciones > :global(*) {
      flex: 1;
    }
  }
</style>
