<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    id: string
    numero: number
    titulo: string
    descripcion?: string
    acciones?: Snippet
    children: Snippet
  }

  let { id, numero, titulo, descripcion, acciones, children }: Props = $props()
</script>

<section {id} class="seccion tarjeta" tabindex="-1" aria-labelledby="{id}-titulo">
  <header>
    <span class="numero" aria-hidden="true">{numero}</span>
    <div class="titulos">
      <h2 id="{id}-titulo">{titulo}</h2>
      {#if descripcion}<p>{descripcion}</p>{/if}
    </div>
    {#if acciones}<div class="acciones">{@render acciones()}</div>{/if}
  </header>
  <div class="contenido">
    {@render children()}
  </div>
</section>

<style>
  .seccion {
    padding: 20px 24px 24px;
    scroll-margin-top: calc(var(--alto-encabezado) + 16px);
  }

  .seccion:focus {
    outline: none;
  }

  header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .numero {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-top: -2px;
    border-radius: 50%;
    background: var(--primario-suave);
    color: var(--primario-tinta);
    font-size: 0.8125rem;
    font-weight: 700;
  }

  .titulos {
    flex: 1;
    min-width: 0;
  }

  .titulos p {
    margin-top: 2px;
    font-size: 0.8125rem;
    color: var(--texto-3);
  }

  .acciones {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
    margin-top: -4px;
  }

  .contenido {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-top: 18px;
  }

  @media (max-width: 640px) {
    .seccion {
      padding: 16px 16px 20px;
      scroll-margin-top: calc(var(--alto-encabezado) + 64px);
    }

    header {
      flex-wrap: wrap;
    }

    .acciones {
      flex-basis: 100%;
      justify-content: flex-start;
      margin: 0;
      padding-left: 40px;
    }
  }
</style>
