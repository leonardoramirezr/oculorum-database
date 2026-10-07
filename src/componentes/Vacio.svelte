<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    titulo: string
    texto?: string
    icono?: Snippet
    children?: Snippet
  }

  let { titulo, texto, icono, children }: Props = $props()
</script>

<div class="vacio">
  {#if icono}<div class="icono">{@render icono()}</div>{/if}
  <h2>{titulo}</h2>
  {#if texto}<p>{texto}</p>{/if}
  {#if children}<div class="acciones">{@render children()}</div>{/if}
</div>

<style>
  .vacio {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 48px 24px;
    text-align: center;
  }

  .icono {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: 8px;
    border-radius: 16px;
    background: var(--primario-suave);
    color: var(--primario);
  }

  p {
    max-width: 42ch;
    color: var(--texto-2);
  }

  .acciones {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
  }
</style>
