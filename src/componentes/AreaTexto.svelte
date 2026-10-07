<script lang="ts">
  import { Check, Plus } from '@lucide/svelte'
  import { tick, type Snippet } from 'svelte'
  import type { Sugerencia } from '../lib/sugerencias'
  import { normalizar } from '../lib/texto'

  interface Props {
    id: string
    etiqueta: string
    valor: string
    filas?: number
    placeholder?: string
    ayuda?: string
    ocultarEtiqueta?: boolean
    sugerencias?: Sugerencia[]
    /** Botón u otro contenido a la derecha de la etiqueta. */
    accion?: Snippet
  }

  let {
    id,
    etiqueta,
    valor = $bindable(''),
    filas = 3,
    placeholder,
    ayuda,
    ocultarEtiqueta = false,
    sugerencias = [],
    accion,
  }: Props = $props()

  let area: HTMLTextAreaElement

  function ajustarAltura() {
    if (!area) return
    area.style.height = 'auto'
    area.style.height = `${area.scrollHeight + 2}px`
  }

  // También al cambiar el texto desde fuera (borrador recuperado, sugerencias…).
  $effect(() => {
    void valor
    ajustarAltura()
  })

  const textoNormalizado = $derived(normalizar(valor))
  const yaIncluida = (s: Sugerencia) => textoNormalizado.includes(normalizar(s.insertar ?? s.texto))

  async function agregar(s: Sugerencia) {
    const nuevo = s.insertar ?? s.texto
    const actual = valor.replace(/\s+$/, '')
    valor = actual ? `${actual}\n${nuevo}` : nuevo
    await tick()
    area.focus()
    area.setSelectionRange(valor.length, valor.length)
    ajustarAltura()
  }
</script>

<div class="campo">
  <div class="etiqueta" class:sr-only={ocultarEtiqueta && !accion}>
    <label for={id} class:sr-only={ocultarEtiqueta}>{etiqueta}</label>
    {@render accion?.()}
  </div>
  <textarea
    bind:this={area}
    {id}
    class="control"
    rows={filas}
    bind:value={valor}
    oninput={ajustarAltura}
    {placeholder}
    aria-describedby={ayuda ? `${id}-ayuda` : undefined}
  ></textarea>
  {#if sugerencias.length}
    <div class="sugerencias no-imprimir" role="group" aria-label="Agregar a {etiqueta.toLowerCase()}">
      {#each sugerencias as s (s.texto)}
        {@const incluida = yaIncluida(s)}
        <button type="button" class="chip" class:incluida onclick={() => agregar(s)}>
          {#if incluida}<Check size={13} strokeWidth={2.5} />{:else}<Plus size={13} strokeWidth={2.5} />{/if}
          {s.texto}
        </button>
      {/each}
    </div>
  {/if}
  {#if ayuda}<p class="ayuda" id="{id}-ayuda">{ayuda}</p>{/if}
</div>

<style>
  textarea {
    overflow: hidden;
    resize: none;
    line-height: 1.55;
  }

  .sugerencias {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 2px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 28px;
    padding: 0 10px 0 8px;
    border: 1px dashed var(--borde-fuerte);
    border-radius: 999px;
    background: transparent;
    color: var(--texto-2);
    font-size: 0.8125rem;
    font-weight: 500;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .chip:hover {
    border-color: var(--primario);
    border-style: solid;
    background: var(--primario-suave);
    color: var(--primario-tinta);
  }

  .chip:focus-visible {
    outline: none;
    box-shadow: var(--anillo);
  }

  .chip.incluida {
    border-style: solid;
    border-color: transparent;
    background: var(--superficie-3);
    color: var(--texto-3);
  }

  @media (pointer: coarse) {
    .chip {
      min-height: 34px;
    }
  }
</style>
