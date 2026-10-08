<script lang="ts">
  import { ChevronRight } from '@lucide/svelte'
  import { formatoMedio, textoEdad } from '../lib/fechas'
  import { href, rutas } from '../lib/rutas'
  import { nombreCompleto } from '../lib/texto'
  import type { Paciente } from '../lib/tipos'
  import Avatar from './Avatar.svelte'

  interface Props {
    paciente: Paciente
    activa?: boolean
  }

  let { paciente, activa = false }: Props = $props()
</script>

<a class="fila-paciente" class:activa href={href(rutas.paciente(paciente.id))}>
  <Avatar {paciente} />
  <span class="principal">
    <span class="nombre">{nombreCompleto(paciente)}</span>
    <span class="meta">
      <span class="insignia expediente">Exp. {paciente.id}</span>
      {#if paciente.fechaNacimiento}<span>{textoEdad(paciente.fechaNacimiento)}</span>{/if}
      {#if paciente.telefono}<span class="telefono tabular">{paciente.telefono}</span>{/if}
    </span>
  </span>
  <span class="ultima">
    {#if paciente.ultimaConsulta}
      <span class="mas-tenue">Última consulta</span>
      <span class="tabular">{formatoMedio(paciente.ultimaConsulta)}</span>
    {:else}
      <span class="mas-tenue">Sin consultas</span>
    {/if}
  </span>
  <ChevronRight size={18} class="flecha" />
</a>

<style>
  .fila-paciente {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    color: inherit;
    text-decoration: none;
    transition: background-color 0.12s;
  }

  .fila-paciente:hover,
  .fila-paciente.activa {
    background: var(--superficie-2);
    text-decoration: none;
  }

  .fila-paciente.activa {
    box-shadow: inset 3px 0 0 var(--primario);
  }

  .fila-paciente:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--primario);
  }

  .principal {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .nombre {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 10px;
    font-size: 0.8125rem;
    color: var(--texto-2);
  }

  .ultima {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 0.8125rem;
    white-space: nowrap;
  }

  .fila-paciente :global(.flecha) {
    flex: none;
    color: var(--texto-3);
  }

  @media (max-width: 560px) {
    .ultima,
    .telefono {
      display: none;
    }
  }
</style>
