<script lang="ts">
  import { TriangleAlert } from '@lucide/svelte'
  import { advertenciaRx, COLUMNAS_RX, OJOS, type FilaRx, type TipoRx } from '../lib/optometria'
  import CampoRx from './CampoRx.svelte'

  interface Props {
    idBase: string
    od: FilaRx
    oi: FilaRx
    columnas: TipoRx[]
  }

  let { idBase, od = $bindable(), oi = $bindable(), columnas }: Props = $props()

  type ClaveOjo = (typeof OJOS)[number]['clave']

  const fila = (ojo: ClaveOjo) => (ojo === 'od' ? od : oi)
  const idCampo = (ojo: ClaveOjo, tipo: TipoRx) => `${idBase}-${ojo}-${tipo}`

  // Las advertencias de un ojo aparecen hasta salir de su renglón, para no
  // interrumpir mientras se captura.
  let ojoEnfocado = $state<string | null>(null)

  const advertencias = $derived(
    OJOS.flatMap(({ clave, sigla }) =>
      clave === ojoEnfocado
        ? []
        : columnas.flatMap((tipo) => {
            const datos = fila(clave)
            const mensaje = advertenciaRx(tipo, datos[tipo] ?? '', datos.cilindro ?? '')
            return mensaje ? [{ id: idCampo(clave, tipo), sigla, titulo: COLUMNAS_RX[tipo].titulo, mensaje }] : []
          }),
    ),
  )
  const advertenciaDe = (id: string) => advertencias.find((a) => a.id === id)?.mensaje ?? null

  /** La adición casi siempre es igual en ambos ojos: se copia a OI si está vacía. */
  function alSalir(ojo: ClaveOjo, tipo: TipoRx) {
    if (tipo === 'add' && ojo === 'od' && od.add && !oi.add) oi.add = od.add
  }

  // En pantallas táctiles cada campo necesita más ancho por el botón ±.
  const tactil = matchMedia('(pointer: coarse)').matches
  let ancho = $state(0)
  const horizontal = $derived(ancho >= 80 + columnas.length * (tactil ? 112 : 86))
  // La AV («20/200», «CD 1m») necesita un poco más de ancho que los valores numéricos.
  const plantilla = $derived(
    `80px ${columnas.map((t) => (t === 'av' ? 'minmax(0, 1.35fr)' : 'minmax(0, 1fr)')).join(' ')}`,
  )
</script>

<div
  class="tabla-rx"
  class:horizontal
  bind:clientWidth={ancho}
  style:--plantilla={plantilla}
  style:--ancho-maximo="{80 + columnas.length * 150}px"
  onfocusin={(e) => (ojoEnfocado = (e.target as HTMLElement).dataset.ojo ?? null)}
  onfocusout={() => (ojoEnfocado = null)}
>
  {#if horizontal}
    <div class="fila encabezado" aria-hidden="true">
      <span></span>
      {#each columnas as tipo (tipo)}
        <span class="titulo-columna">{COLUMNAS_RX[tipo].titulo}</span>
      {/each}
    </div>
  {/if}

  {#each OJOS as ojo (ojo.clave)}
    <div class="fila" role="group" aria-labelledby="{idBase}-{ojo.clave}">
      <div class="ojo" id="{idBase}-{ojo.clave}">
        <span class="sigla">{ojo.sigla}</span>
        <span class="nombre-ojo">{ojo.nombre}</span>
      </div>
      {#each columnas as tipo (tipo)}
        {@const id = idCampo(ojo.clave, tipo)}
        {@const antes = COLUMNAS_RX[tipo].antes}
        <div class="celda">
          <label class="titulo-celda" class:sr-only={horizontal} for={id}>
            {COLUMNAS_RX[tipo].titulo}<span class="sr-only">, {ojo.nombre.toLowerCase()}</span>
          </label>
          {#if antes && horizontal}<span class="notacion" aria-hidden="true">{antes}</span>{/if}
          <CampoRx
            {id}
            {tipo}
            ojo={ojo.clave}
            bind:valor={() => fila(ojo.clave)[tipo] ?? '', (v) => (fila(ojo.clave)[tipo] = v)}
            advertencia={advertenciaDe(id)}
            onsalir={() => alSalir(ojo.clave, tipo)}
          />
        </div>
      {/each}
    </div>
  {/each}

  {#if advertencias.length}
    <ul class="advertencias">
      {#each advertencias as a (a.id)}
        <li id="{a.id}-advertencia">
          <TriangleAlert size={14} />
          <span><strong>{a.sigla} · {a.titulo}:</strong> {a.mensaje}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .tabla-rx {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Vista apilada (pantallas angostas) ── */

  .fila {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px 10px;
    padding: 12px;
    border: 1px solid var(--borde);
    border-radius: var(--r);
    background: var(--superficie-2);
  }

  .ojo {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sigla {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 26px;
    padding: 0 6px;
    border-radius: 7px;
    background: var(--primario-suave);
    color: var(--primario-tinta);
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .nombre-ojo {
    font-size: 0.8125rem;
    color: var(--texto-2);
  }

  .celda {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .titulo-celda {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--texto-2);
  }

  /* ── Vista de tabla ── */

  .horizontal {
    gap: 8px;
  }

  .horizontal .fila {
    grid-template-columns: var(--plantilla);
    max-width: var(--ancho-maximo);
    gap: 0 18px;
    align-items: center;
    padding: 0;
    border: 0;
    background: none;
  }

  .horizontal .ojo {
    grid-column: auto;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .horizontal .nombre-ojo {
    font-size: 0.6875rem;
    line-height: 1.2;
    color: var(--texto-3);
  }

  .encabezado {
    padding-bottom: 2px;
  }

  .titulo-columna {
    font-size: 0.75rem;
    font-weight: 600;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--texto-3);
  }

  /* Los signos «=» y «×» de la notación de receta, centrados entre columnas. */
  .notacion {
    position: absolute;
    top: 50%;
    left: -9px;
    transform: translate(-50%, -50%);
    color: var(--texto-3);
    font-size: 1rem;
    font-weight: 500;
    pointer-events: none;
  }

  .advertencias {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 4px 0 0;
    padding: 10px 12px;
    list-style: none;
    border: 1px solid var(--aviso-borde);
    border-radius: var(--r);
    background: var(--aviso-suave);
    font-size: 0.8125rem;
    color: var(--texto);
  }

  .advertencias li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .advertencias :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--aviso);
  }

  .advertencias strong {
    font-weight: 600;
  }
</style>
