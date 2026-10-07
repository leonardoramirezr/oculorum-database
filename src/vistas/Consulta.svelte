<script lang="ts">
  import { ArrowLeft, Pencil, Printer, Trash } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import Logo from '../componentes/Logo.svelte'
  import ResumenRx from '../componentes/ResumenRx.svelte'
  import { expedientes } from '../lib/expedientes.svelte'
  import { fechaLocal, formatoHora, formatoLargo, formatoMedio, formatoNumerico, textoEdad } from '../lib/fechas'
  import { tieneDatos, type TipoRx } from '../lib/optometria'
  import { router } from '../lib/router.svelte'
  import { href, rutas } from '../lib/rutas'
  import { nombreCompleto } from '../lib/texto'
  import type { Consulta } from '../lib/tipos'
  import { ui } from '../lib/ui.svelte'
  import NoEncontrado from './NoEncontrado.svelte'

  interface Props {
    id: string
    consultaId: string
  }

  let { id, consultaId }: Props = $props()

  const paciente = $derived(expedientes.porId(id))
  /** undefined mientras carga; null si no existe. */
  let consulta = $state.raw<Consulta | null | undefined>(undefined)

  onMount(async () => {
    const c = await expedientes.obtenerConsulta(consultaId)
    consulta = c && c.pacienteId === id ? c : null
  })

  const COLUMNAS_LENSOMETRIA: TipoRx[] = ['esfera', 'cilindro', 'eje']
  const COLUMNAS_REFRACCION: TipoRx[] = ['esfera', 'cilindro', 'eje', 'add', 'prisma', 'base', 'av']

  async function eliminar() {
    if (!consulta || !paciente) return
    const ok = await ui.confirmar({
      titulo: '¿Eliminar esta consulta?',
      mensaje: `Se borrará la consulta del ${formatoLargo(consulta.fecha)} del expediente de ${nombreCompleto(paciente)}. Esta acción no se puede deshacer.`,
      confirmar: 'Eliminar consulta',
      peligro: true,
    })
    if (!ok) return
    try {
      await expedientes.eliminarConsulta(consulta)
      ui.avisar('Consulta eliminada')
      router.ir(rutas.paciente(id), { reemplazar: true })
    } catch (e) {
      ui.avisar(`No se pudo eliminar: ${e instanceof Error ? e.message : e}`, 'error')
    }
  }
</script>

{#snippet texto(valor: string)}
  {#if valor.trim()}
    <p class="texto-libre">{valor}</p>
  {:else}
    <p class="sin-dato">Sin registrar</p>
  {/if}
{/snippet}

<svelte:head>
  <title>
    {consulta && paciente
      ? `Consulta ${formatoNumerico(consulta.fecha).replaceAll('/', '-')} · ${nombreCompleto(paciente)}`
      : 'Consulta'} · Oculorum
  </title>
</svelte:head>

{#if !paciente || consulta === null}
  <NoEncontrado titulo="No encontramos esta consulta" texto="Es posible que se haya eliminado." />
{:else if consulta}
  {@const c = consulta}
  {@const edadEnConsulta = paciente.fechaNacimiento ? textoEdad(paciente.fechaNacimiento, c.fecha) : ''}
  <div class="pagina angosta">
    <a class="volver no-imprimir" href={href(rutas.paciente(paciente.id))}>
      <ArrowLeft size={16} /> Expediente de {nombreCompleto(paciente)}
    </a>

    <div class="cabecera-pagina no-imprimir">
      <div>
        <h1>Consulta del {formatoLargo(c.fecha)}</h1>
        <p class="subtitulo">
          {[nombreCompleto(paciente), `Exp. ${paciente.id}`, edadEnConsulta].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div class="acciones">
        <a class="btn btn-secundario" href={href(rutas.editarConsulta(paciente.id, c.id))}>
          <Pencil size={16} /> Editar
        </a>
        <button type="button" class="btn btn-primario" onclick={() => print()}>
          <Printer size={18} /> Imprimir
        </button>
        <button
          type="button"
          class="btn btn-fantasma btn-icono eliminar"
          onclick={eliminar}
          title="Eliminar consulta"
          aria-label="Eliminar consulta"
        >
          <Trash size={18} />
        </button>
      </div>
    </div>

    <article class="documento tarjeta" aria-label="Historia clínica">
      <header class="membrete solo-imprimir">
        <div class="marca">
          <Logo tamano={30} />
          <div>
            <strong>Oculorum</strong>
            <span>Historia clínica optométrica</span>
          </div>
        </div>
        <div class="fecha-documento">
          <span>Fecha de consulta</span>
          <strong>{formatoNumerico(c.fecha)}</strong>
        </div>
      </header>

      <dl class="ficha">
        <div class="ancha">
          <dt>Paciente</dt>
          <dd>{nombreCompleto(paciente)}</dd>
        </div>
        <div>
          <dt>Expediente</dt>
          <dd class="tabular">{paciente.id}</dd>
        </div>
        <div>
          <dt>Fecha de nacimiento</dt>
          <dd class="tabular">{formatoNumerico(paciente.fechaNacimiento) || '—'}</dd>
        </div>
        <div>
          <dt>Edad</dt>
          <dd>{edadEnConsulta || '—'}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd class="tabular">{paciente.telefono || '—'}</dd>
        </div>
        <div class="ancha">
          <dt>Domicilio</dt>
          <dd>{paciente.domicilio || '—'}</dd>
        </div>
      </dl>

      <section class="apartado">
        <h2><span class="n">1</span> Motivo de consulta y antecedentes</h2>
        <h3>Motivo de consulta</h3>
        {@render texto(c.motivo)}
        <h3>Antecedentes y anamnesis</h3>
        {@render texto(c.antecedentes)}
      </section>

      <section class="apartado">
        <h2><span class="n">2</span> Agudeza visual</h2>
        {#if tieneDatos({ od: c.agudezaVisual.od, oi: c.agudezaVisual.oi, ou: c.agudezaVisual.ou })}
          <dl class="agudeza tabular">
            <div><dt><abbr title="Ojo derecho">OD</abbr></dt><dd>{c.agudezaVisual.od || '—'}</dd></div>
            <div><dt><abbr title="Ojo izquierdo">OI</abbr></dt><dd>{c.agudezaVisual.oi || '—'}</dd></div>
            <div><dt><abbr title="Ambos ojos">OU</abbr></dt><dd>{c.agudezaVisual.ou || '—'}</dd></div>
          </dl>
        {/if}
        {#if c.agudezaVisual.notas.trim()}
          <h3>Resultados y observaciones</h3>
          <p class="texto-libre">{c.agudezaVisual.notas}</p>
        {:else if !tieneDatos(c.agudezaVisual)}
          <p class="sin-dato">Sin registrar</p>
        {/if}
      </section>

      <section class="apartado">
        <h2><span class="n">3</span> Lensometría</h2>
        {#if c.lensometria.sinLentes}
          <p>El paciente no usa lentes.</p>
        {:else if tieneDatos(c.lensometria.od) || tieneDatos(c.lensometria.oi)}
          <ResumenRx
            od={c.lensometria.od}
            oi={c.lensometria.oi}
            columnas={COLUMNAS_LENSOMETRIA}
            etiqueta="Lensometría"
          />
        {:else}
          <p class="sin-dato">Sin registrar</p>
        {/if}
      </section>

      <section class="apartado">
        <h2><span class="n">4</span> Refracción subjetiva</h2>
        {#if tieneDatos(c.refraccion.od) || tieneDatos(c.refraccion.oi)}
          <ResumenRx
            od={c.refraccion.od}
            oi={c.refraccion.oi}
            columnas={COLUMNAS_REFRACCION}
            etiqueta="Refracción subjetiva"
          />
        {:else}
          <p class="sin-dato">Sin registrar</p>
        {/if}
      </section>

      <section class="apartado">
        <h2><span class="n">5</span> Exploración física</h2>
        {@render texto(c.exploracion)}
      </section>

      <section class="apartado">
        <h2><span class="n">6</span> Diagnóstico y tratamiento</h2>
        <h3>Diagnóstico</h3>
        {@render texto(c.diagnostico)}
        <h3>Tratamiento e indicaciones</h3>
        {@render texto(c.tratamiento)}
      </section>

      <footer class="firma solo-imprimir">
        <div class="linea-firma"></div>
        <span>Nombre y firma del optometrista</span>
      </footer>
    </article>

    <p class="registro no-imprimir">
      Registrada el {formatoMedio(fechaLocal(c.creado))} a las {formatoHora(c.creado)}
      {#if c.actualizado !== c.creado}
        <span aria-hidden="true">·</span> Modificada el {formatoMedio(fechaLocal(c.actualizado))} a las
        {formatoHora(c.actualizado)}
      {/if}
    </p>
  </div>
{/if}

<style>
  .acciones {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .eliminar:hover {
    color: var(--peligro);
  }

  .documento {
    padding: 8px 28px 28px;
  }

  .ficha {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px 20px;
    margin: 0;
    padding: 20px 0;
    border-bottom: 1px solid var(--borde);
  }

  .ficha .ancha {
    grid-column: span 2;
  }

  dt {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--texto-3);
  }

  dd {
    margin: 2px 0 0;
    overflow-wrap: anywhere;
  }

  .apartado {
    padding: 22px 0 4px;
  }

  .apartado + .apartado {
    border-top: 1px solid var(--borde);
  }

  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    font-size: 1rem;
    break-after: avoid;
  }

  .n {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primario-suave);
    color: var(--primario-tinta);
    font-size: 0.75rem;
    font-weight: 700;
  }

  h3 {
    margin: 14px 0 4px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--texto-2);
    break-after: avoid;
  }

  h2 + h3 {
    margin-top: 0;
  }

  p {
    margin-bottom: 12px;
  }

  .sin-dato {
    color: var(--texto-3);
    font-style: italic;
  }

  .agudeza {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 32px;
    margin: 0 0 14px;
  }

  .agudeza div {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .agudeza dd {
    font-size: 1.0625rem;
    font-weight: 600;
  }

  abbr {
    text-decoration: none;
  }

  .registro {
    margin-top: 14px;
    font-size: 0.8125rem;
    color: var(--texto-3);
    text-align: center;
  }

  @media (max-width: 640px) {
    .documento {
      padding: 4px 16px 16px;
    }

    .ficha {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .cabecera-pagina .acciones {
      width: 100%;
    }

    .cabecera-pagina .acciones .btn:not(.btn-icono) {
      flex: 1;
    }
  }

  /* ── Hoja impresa ── */

  .membrete {
    padding: 0 0 12px;
    border-bottom: 2px solid #111;
  }

  @media print {
    .documento {
      padding: 0;
      border: 0;
      border-radius: 0;
    }

    .membrete {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    .marca {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .marca div,
    .fecha-documento {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }

    .marca strong {
      font-size: 13pt;
    }

    .marca span,
    .fecha-documento span {
      font-size: 9pt;
      color: #555;
    }

    .fecha-documento {
      align-items: flex-end;
    }

    .ficha {
      padding: 12px 0;
      border-bottom-color: #bbb;
    }

    .apartado {
      padding: 12px 0 0;
    }

    .apartado + .apartado {
      border-top-color: #ddd;
    }

    h2 {
      margin-bottom: 6px;
      font-size: 11.5pt;
    }

    .n {
      width: auto;
      height: auto;
      background: none;
      color: #000;
      font-size: inherit;
    }

    .n::after {
      content: '.';
    }

    h3 {
      margin-top: 8px;
      color: #333;
    }

    p {
      margin-bottom: 6px;
    }

    .firma {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 60%;
      margin: 56px auto 0;
      font-size: 9pt;
      color: #444;
      break-inside: avoid;
    }

    .linea-firma {
      width: 100%;
      margin-bottom: 4px;
      border-top: 1px solid #000;
    }
  }
</style>
