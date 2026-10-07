<script lang="ts">
  import { COLUMNAS_RX, conSignoMenos, OJOS, type FilaRx, type TipoRx } from '../lib/optometria'

  interface Props {
    od: FilaRx
    oi: FilaRx
    columnas: TipoRx[]
    etiqueta: string
  }

  let { od, oi, columnas, etiqueta }: Props = $props()

  // Esfera, cilindro y eje siempre; el resto solo si algún ojo tiene dato.
  const visibles = $derived(
    columnas.filter((t) => t === 'esfera' || t === 'cilindro' || t === 'eje' || od[t] || oi[t]),
  )

  function valor(fila: FilaRx, tipo: TipoRx): string {
    const v = fila[tipo]
    if (!v) return '—'
    if (tipo === 'eje') return `${v}°`
    if (tipo === 'prisma') return `${v} Δ`
    return conSignoMenos(v)
  }
</script>

<div class="contenedor">
  <table class="resumen-rx tabular" aria-label={etiqueta}>
    <thead>
      <tr>
        <th scope="col"><span class="sr-only">Ojo</span></th>
        {#each visibles as tipo (tipo)}<th scope="col">{COLUMNAS_RX[tipo].titulo}</th>{/each}
      </tr>
    </thead>
    <tbody>
      {#each OJOS as ojo (ojo.clave)}
        {@const fila = ojo.clave === 'od' ? od : oi}
        <tr>
          <th scope="row"><abbr title={ojo.nombre}>{ojo.sigla}</abbr></th>
          {#each visibles as tipo (tipo)}
            <td class:vacia={!fila[tipo]}>{valor(fila, tipo)}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .contenedor {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9375rem;
  }

  th,
  td {
    padding: 9px 12px;
    border-bottom: 1px solid var(--borde);
    text-align: center;
    white-space: nowrap;
  }

  thead th {
    padding-top: 0;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--texto-3);
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }

  tbody th {
    width: 56px;
    padding-left: 0;
    text-align: left;
  }

  abbr {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 34px;
    height: 24px;
    padding: 0 6px;
    border-radius: 6px;
    background: var(--primario-suave);
    color: var(--primario-tinta);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-decoration: none;
  }

  td {
    font-weight: 560;
  }

  td.vacia {
    color: var(--texto-3);
    font-weight: 400;
  }

  @media (max-width: 640px) {
    table {
      font-size: 0.875rem;
    }

    th,
    td {
      padding: 8px 4px;
    }

    tbody th {
      width: 44px;
    }
  }

  @media print {
    table {
      font-size: 10.5pt;
    }

    th,
    td {
      padding: 5px 8px;
      border-bottom-color: #ccc;
    }

    abbr {
      background: none;
      color: #000;
      padding: 0;
    }
  }
</style>
