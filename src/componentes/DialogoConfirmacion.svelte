<script lang="ts">
  import { TriangleAlert } from '@lucide/svelte'
  import { ui } from '../lib/ui.svelte'

  let dialogo: HTMLDialogElement

  $effect(() => {
    if (ui.confirmacion && !dialogo.open) dialogo.showModal()
    else if (!ui.confirmacion && dialogo.open) dialogo.close()
  })
</script>

<!-- Esc o clic fuera del cuadro equivalen a cancelar. -->
<dialog
  bind:this={dialogo}
  aria-labelledby="confirmacion-titulo"
  aria-describedby="confirmacion-mensaje"
  onclose={() => ui.confirmacion?.responder(false)}
  onclick={(e) => e.target === dialogo && ui.confirmacion?.responder(false)}
>
  {#if ui.confirmacion}
    {@const c = ui.confirmacion}
    <div class="cuadro">
      {#if c.peligro}
        <span class="icono"><TriangleAlert size={20} /></span>
      {/if}
      <h2 id="confirmacion-titulo">{c.titulo}</h2>
      <p id="confirmacion-mensaje">{c.mensaje}</p>
      <div class="acciones">
        <!-- svelte-ignore a11y_autofocus -->
        <button type="button" class="btn btn-secundario" autofocus onclick={() => c.responder(false)}>
          {c.cancelar ?? 'Cancelar'}
        </button>
        <button
          type="button"
          class="btn {c.peligro ? 'btn-peligro' : 'btn-primario'}"
          onclick={() => c.responder(true)}
        >
          {c.confirmar}
        </button>
      </div>
    </div>
  {/if}
</dialog>

<style>
  dialog {
    width: min(440px, calc(100% - 32px));
    padding: 0;
    border: 1px solid var(--borde);
    border-radius: var(--r-lg);
    background: var(--superficie);
    color: var(--texto);
    box-shadow: var(--sombra-lg);
  }

  dialog::backdrop {
    background: rgb(10 20 26 / 0.45);
    backdrop-filter: blur(2px);
  }

  .cuadro {
    padding: 24px;
  }

  .icono {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: 14px;
    border-radius: 50%;
    background: var(--peligro-suave);
    color: var(--peligro);
  }

  p {
    margin-top: 8px;
    color: var(--texto-2);
  }

  .acciones {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;
  }
</style>
