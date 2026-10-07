<script lang="ts">
  import { invertirSigno, normalizarRx, pasoRx, type TipoRx } from '../lib/optometria'

  interface Props {
    id: string
    tipo: TipoRx
    valor: string
    advertencia?: string | null
    ojo?: string
    onsalir?: () => void
  }

  let { id, tipo, valor = $bindable(''), advertencia = null, ojo, onsalir }: Props = $props()

  let campo: HTMLInputElement

  const conSigno = $derived(tipo === 'esfera' || tipo === 'cilindro')
  const sufijo = $derived(tipo === 'eje' ? '°' : tipo === 'prisma' ? 'Δ' : '')
  const teclado = $derived(
    tipo === 'eje' ? 'numeric' : tipo === 'av' || tipo === 'base' ? undefined : ('decimal' as const),
  )
  const lista = $derived(tipo === 'av' ? 'lista-av' : tipo === 'base' ? 'lista-base' : undefined)

  function alSalir() {
    valor = normalizarRx(tipo, valor)
    onsalir?.()
  }

  function alTeclear(e: KeyboardEvent) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    const siguiente = pasoRx(tipo, valor, e.key === 'ArrowUp' ? 1 : -1, e.shiftKey)
    if (siguiente === null) return
    e.preventDefault()
    valor = siguiente
  }

  // En teclados táctiles numéricos no siempre hay signo menos.
  function cambiarSigno() {
    valor = invertirSigno(valor)
    campo.focus()
    requestAnimationFrame(() => campo.setSelectionRange(valor.length, valor.length))
  }
</script>

<div class="campo-rx" class:con-signo={conSigno} class:con-sufijo={sufijo !== ''}>
  {#if conSigno}
    <button
      type="button"
      class="signo"
      tabindex="-1"
      aria-label="Cambiar signo"
      onpointerdown={(e) => e.preventDefault()}
      onclick={cambiarSigno}>±</button
    >
  {/if}
  <input
    bind:this={campo}
    {id}
    class="control rx tabular"
    class:advertido={!!advertencia}
    type="text"
    inputmode={teclado}
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    list={lista}
    data-ojo={ojo}
    bind:value={valor}
    onblur={alSalir}
    onkeydown={alTeclear}
    aria-describedby={advertencia ? `${id}-advertencia` : undefined}
  />
  {#if sufijo}<span class="sufijo" aria-hidden="true">{sufijo}</span>{/if}
</div>

<style>
  .campo-rx {
    position: relative;
    min-width: 0;
  }

  .rx {
    min-height: 42px;
    padding-inline: 6px;
    text-align: center;
    font-weight: 560;
    letter-spacing: 0.01em;
  }

  .con-sufijo .rx {
    padding-right: 20px;
  }

  .sufijo {
    position: absolute;
    top: 50%;
    right: 9px;
    transform: translateY(-50%);
    color: var(--texto-3);
    font-size: 0.8125rem;
    pointer-events: none;
  }

  .rx.advertido:not(:focus) {
    border-color: var(--aviso-borde);
    background: var(--aviso-suave);
  }

  .signo {
    display: none;
  }

  @media (pointer: coarse) {
    .signo {
      position: absolute;
      top: 4px;
      bottom: 4px;
      left: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      border: 0;
      border-radius: 7px;
      background: var(--superficie-3);
      color: var(--texto-2);
      font-size: 1rem;
      font-weight: 700;
    }

    .con-signo .rx {
      padding-left: 34px;
    }
  }
</style>
