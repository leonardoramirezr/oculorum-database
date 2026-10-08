<script lang="ts">
  import { Check } from '@lucide/svelte'
  import { untrack } from 'svelte'

  interface Props {
    secciones: { id: string; titulo: string; completa: boolean }[]
  }

  let { secciones }: Props = $props()

  let activa = $state(untrack(() => secciones[0]?.id))
  let lista: HTMLOListElement

  // Resalta la sección que está en la parte superior de la pantalla.
  $effect(() => {
    const ids = untrack(() => secciones.map((s) => s.id))
    const visibles = new Set<string>()
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visibles.add(e.target.id)
          else visibles.delete(e.target.id)
        }
        const primera = ids.find((id) => visibles.has(id))
        if (primera) activa = primera
      },
      { rootMargin: '-90px 0px -55% 0px' },
    )
    for (const id of ids) {
      const seccion = document.getElementById(id)
      if (seccion) observador.observe(seccion)
    }
    // La última sección puede ser demasiado corta para llegar a la franja superior.
    const alDesplazar = () => {
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) activa = ids[ids.length - 1]
    }
    addEventListener('scroll', alDesplazar, { passive: true })
    return () => {
      observador.disconnect()
      removeEventListener('scroll', alDesplazar)
    }
  })

  // En la barra horizontal (celular) mantener visible la sección activa.
  $effect(() => {
    const boton = lista?.querySelector<HTMLElement>(`[data-seccion="${activa}"]`)
    if (boton && lista.scrollWidth > lista.clientWidth) {
      lista.scrollTo({ left: boton.offsetLeft - 16, behavior: 'smooth' })
    }
  })

  function ir(id: string) {
    const seccion = document.getElementById(id)
    if (!seccion) return
    activa = id
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches
    seccion.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' })
    seccion.focus({ preventScroll: true })
  }
</script>

<nav class="indice" aria-label="Secciones de la consulta">
  <ol bind:this={lista}>
    {#each secciones as s, i (s.id)}
      <li>
        <button
          type="button"
          data-seccion={s.id}
          class:activa={activa === s.id}
          aria-current={activa === s.id ? 'true' : undefined}
          onclick={() => ir(s.id)}
        >
          <span class="marca" class:completa={s.completa}>
            {#if s.completa}<Check size={12} strokeWidth={3} />{:else}{i + 1}{/if}
          </span>
          <span class="texto">{s.titulo}</span>
          {#if s.completa}<span class="sr-only">(con datos)</span>{/if}
        </button>
      </li>
    {/each}
  </ol>
</nav>

<style>
  ol {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  button {
    /* Contiene el texto .sr-only, que es absoluto, dentro del carril desplazable. */
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    border: 0;
    background: none;
    color: var(--texto-2);
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
    transition:
      background-color 0.15s,
      color 0.15s;
  }

  button:hover {
    color: var(--texto);
  }

  button.activa {
    color: var(--primario-tinta);
    font-weight: 600;
  }

  .marca {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 1.5px solid var(--borde-fuerte);
    border-radius: 50%;
    background: var(--superficie);
    color: var(--texto-3);
    font-size: 0.6875rem;
    font-weight: 700;
  }

  .activa .marca {
    border-color: var(--primario);
    color: var(--primario);
  }

  .marca.completa {
    border-color: var(--primario);
    background: var(--primario);
    color: var(--sobre-primario);
  }

  /* Escritorio: índice vertical fijo al costado. */
  @media (min-width: 1024px) {
    .indice {
      position: sticky;
      top: calc(var(--alto-encabezado) + 20px);
    }

    ol {
      flex-direction: column;
      gap: 2px;
      border-left: 1px solid var(--borde);
    }

    button {
      margin-left: -1px;
      padding: 8px 12px;
      border-left: 2px solid transparent;
      border-radius: 0 var(--r-sm) var(--r-sm) 0;
    }

    button:hover {
      background: var(--superficie-3);
    }

    button.activa {
      border-left-color: var(--primario);
      background: var(--primario-suave);
    }
  }

  /* Tableta y celular: barra horizontal desplazable bajo el encabezado. */
  @media (max-width: 1023.98px) {
    .indice {
      position: sticky;
      top: var(--alto-encabezado);
      z-index: 5;
      margin: 0 -24px;
      padding: 8px 0;
      border-bottom: 1px solid var(--borde);
      background: color-mix(in srgb, var(--fondo) 88%, transparent);
      backdrop-filter: blur(10px);
    }

    ol {
      gap: 6px;
      padding: 0 24px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    ol::-webkit-scrollbar {
      display: none;
    }

    button {
      flex: none;
      width: auto;
      gap: 6px;
      padding: 6px 12px 6px 6px;
      border: 1px solid var(--borde);
      border-radius: 999px;
      background: var(--superficie);
      white-space: nowrap;
    }

    button.activa {
      border-color: var(--primario);
      background: var(--primario-suave);
    }
  }

  @media (max-width: 640px) {
    .indice {
      margin: 0 -16px;
    }

    ol {
      padding: 0 16px;
    }
  }
</style>
