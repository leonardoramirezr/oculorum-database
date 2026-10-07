<script lang="ts">
  import { CircleAlert, CircleCheckBig, X } from '@lucide/svelte'
  import { fly } from 'svelte/transition'
  import { ui } from '../lib/ui.svelte'
</script>

<div class="avisos no-imprimir" role="status" aria-live="polite">
  {#each ui.avisos as aviso (aviso.id)}
    <div class="aviso {aviso.tipo}" transition:fly={{ y: 16, duration: 200 }}>
      {#if aviso.tipo === 'exito'}<CircleCheckBig size={18} />{:else}<CircleAlert size={18} />{/if}
      <span class="mensaje">{aviso.mensaje}</span>
      <button type="button" class="cerrar" aria-label="Cerrar aviso" onclick={() => ui.cerrarAviso(aviso.id)}>
        <X size={16} />
      </button>
    </div>
  {/each}
</div>

<style>
  .avisos {
    position: fixed;
    left: 50%;
    bottom: 24px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: min(440px, calc(100% - 32px));
    transform: translateX(-50%);
    pointer-events: none;
  }

  /* Por encima de la barra de acciones del formulario de consulta. */
  :global(body:has(.barra-acciones)) .avisos {
    bottom: 92px;
  }

  .aviso {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 8px 10px 14px;
    border-radius: 12px;
    background: #14222c;
    color: #f2f6f8;
    box-shadow: var(--sombra-lg);
    font-size: 0.875rem;
    font-weight: 500;
    pointer-events: auto;
  }

  .exito > :global(svg) {
    color: #5fd39b;
  }

  .error > :global(svg) {
    color: #ff8f86;
  }

  .mensaje {
    flex: 1;
  }

  .cerrar {
    display: flex;
    padding: 6px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #a9b8c2;
  }

  .cerrar:hover {
    background: rgb(255 255 255 / 0.1);
    color: #fff;
  }
</style>
