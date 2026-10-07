<script lang="ts">
  import { ArrowLeft, ChevronRight, ClipboardList, Glasses, NotebookPen, Pencil, Stethoscope } from '@lucide/svelte'
  import { onMount, untrack } from 'svelte'
  import EncabezadoPaciente from '../componentes/EncabezadoPaciente.svelte'
  import ResumenRx from '../componentes/ResumenRx.svelte'
  import Vacio from '../componentes/Vacio.svelte'
  import { claveBorrador, leerBorrador } from '../lib/borradores'
  import { expedientes } from '../lib/expedientes.svelte'
  import { formatoHora, formatoMedio, haceCuanto, hojaCalendario } from '../lib/fechas'
  import { conSignoMenos, formatoRx, tieneDatos, type TipoRx } from '../lib/optometria'
  import { href, rutas } from '../lib/rutas'
  import { nombreCompleto } from '../lib/texto'
  import type { Consulta, DatosConsulta } from '../lib/tipos'
  import NoEncontrado from './NoEncontrado.svelte'

  let { id }: { id: string } = $props()

  const paciente = $derived(expedientes.porId(id))
  let consultas = $state.raw<Consulta[] | null>(null)
  let errorCarga = $state('')

  onMount(() => {
    expedientes
      .consultasDe(id)
      .then((c) => (consultas = c))
      .catch((e) => (errorCarga = e instanceof Error ? e.message : String(e)))
  })

  const borrador = untrack(() => leerBorrador<DatosConsulta>(claveBorrador(id)))

  const conRefraccion = (c: Consulta) => tieneDatos(c.refraccion.od) || tieneDatos(c.refraccion.oi)
  const ultimaRx = $derived(consultas?.find(conRefraccion))

  const COLUMNAS: TipoRx[] = ['esfera', 'cilindro', 'eje', 'add', 'prisma', 'base', 'av']

  const primeraLinea = (texto: string) => texto.trim().split('\n')[0] ?? ''

  function resumenRx(c: Consulta): string {
    const { od, oi } = c.refraccion
    const partes = [
      formatoRx(od) && `OD ${formatoRx(od)}`,
      formatoRx(oi) && `OI ${formatoRx(oi)}`,
      od.add && `ADD ${conSignoMenos(od.add)}${oi.add && oi.add !== od.add ? ` / ${conSignoMenos(oi.add)}` : ''}`,
    ]
    return partes.filter(Boolean).join('  ·  ')
  }
</script>

<svelte:head>
  <title>{paciente ? `${nombreCompleto(paciente)} · Exp. ${paciente.id}` : 'Expediente'} · Oculorum</title>
</svelte:head>

{#if !paciente}
  <NoEncontrado titulo="No encontramos el expediente {id}" texto="Revisa el número o búscalo por nombre." />
{:else}
  <div class="pagina">
    <a class="volver" href={href(rutas.inicio())}><ArrowLeft size={16} /> Pacientes</a>

    <EncabezadoPaciente {paciente}>
      {#snippet acciones()}
        <a class="btn btn-secundario" href={href(rutas.editarPaciente(paciente.id))}><Pencil size={16} /> Editar datos</a>
        <a class="btn btn-primario" href={href(rutas.nuevaConsulta(paciente.id))}><Stethoscope size={18} /> Nueva consulta</a>
      {/snippet}
    </EncabezadoPaciente>

    {#if borrador}
      <div class="alerta info borrador">
        <NotebookPen size={18} />
        <div class="cuerpo">
          <strong>Hay una consulta sin terminar</strong>
          <span class="tenue">
            Se guardó como borrador {haceCuanto(borrador.guardado)}, a las {formatoHora(borrador.guardado)}
          </span>
        </div>
        <a class="btn btn-secundario btn-sm" href={href(rutas.nuevaConsulta(paciente.id))}>Continuar captura</a>
      </div>
    {/if}

    {#if ultimaRx}
      <section class="tarjeta ultima-rx" aria-labelledby="titulo-ultima-rx">
        <div class="cabecera-tarjeta">
          <h2 id="titulo-ultima-rx"><Glasses size={18} /> Última graduación</h2>
          <a class="fecha-rx" href={href(rutas.consulta(paciente.id, ultimaRx.id))}>
            Refracción del {formatoMedio(ultimaRx.fecha)}
          </a>
        </div>
        <ResumenRx
          od={ultimaRx.refraccion.od}
          oi={ultimaRx.refraccion.oi}
          columnas={COLUMNAS}
          etiqueta="Última graduación"
        />
      </section>
    {/if}

    <div class="titulo-seccion">
      <h2>Historia clínica</h2>
      {#if consultas?.length}
        <span class="conteo">{consultas.length === 1 ? '1 consulta' : `${consultas.length} consultas`}</span>
      {/if}
    </div>

    {#if errorCarga}
      <div class="alerta peligro">No se pudieron leer las consultas: {errorCarga}</div>
    {:else if consultas === null}
      <div class="tarjeta cargando" aria-busy="true">Cargando consultas…</div>
    {:else if consultas.length === 0}
      <div class="tarjeta">
        <Vacio
          titulo="Sin consultas registradas"
          texto="Registra la primera consulta: motivo, agudeza visual, lensometría, refracción, exploración y diagnóstico."
        >
          {#snippet icono()}<ClipboardList size={26} />{/snippet}
          <a class="btn btn-primario" href={href(rutas.nuevaConsulta(paciente.id))}>
            <Stethoscope size={18} /> Comenzar consulta
          </a>
        </Vacio>
      </div>
    {:else}
      <ol class="consultas">
        {#each consultas as c (c.id)}
          {@const hoja = hojaCalendario(c.fecha)}
          {@const rx = resumenRx(c)}
          <li>
            <a class="consulta tarjeta" href={href(rutas.consulta(paciente.id, c.id))}>
              <span class="hoja" aria-hidden="true">
                <span class="dia">{hoja?.dia}</span>
                <span class="mes">{hoja?.mes}</span>
                <span class="anio">{hoja?.anio}</span>
              </span>
              <span class="resumen">
                <span class="sr-only">Consulta del {formatoMedio(c.fecha)}.</span>
                <span class="motivo" class:vacio={!c.motivo.trim()}>
                  {primeraLinea(c.motivo) || 'Sin motivo de consulta registrado'}
                </span>
                {#if c.diagnostico.trim()}
                  <span class="linea"><span class="clave">Dx</span>{primeraLinea(c.diagnostico)}</span>
                {/if}
                {#if rx}
                  <span class="linea tabular"><span class="clave">Rx</span>{rx}</span>
                {:else if c.lensometria.sinLentes}
                  <span class="linea"><span class="clave">Rx</span><span class="tenue">Sin refracción registrada</span></span>
                {/if}
              </span>
              <ChevronRight size={18} class="flecha" />
            </a>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
{/if}

<style>
  .borrador {
    align-items: center;
    margin-top: 16px;
  }

  .ultima-rx {
    margin-top: 16px;
    padding: 18px 24px 10px;
  }

  .cabecera-tarjeta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 16px;
    margin-bottom: 14px;
  }

  .cabecera-tarjeta h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
  }

  .cabecera-tarjeta h2 :global(svg) {
    color: var(--primario);
  }

  .fecha-rx {
    font-size: 0.8125rem;
    color: var(--texto-2);
  }

  .cargando {
    padding: 24px;
    color: var(--texto-3);
  }

  .consultas {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .consulta {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 14px 18px 14px 14px;
    color: inherit;
    text-decoration: none;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }

  .consulta:hover {
    border-color: var(--borde-fuerte);
    box-shadow: var(--sombra);
    text-decoration: none;
  }

  .consulta:focus-visible {
    outline: none;
    box-shadow: var(--anillo);
  }

  .hoja {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 58px;
    padding: 6px 0;
    border-radius: var(--r);
    background: var(--superficie-2);
    border: 1px solid var(--borde);
    line-height: 1.1;
  }

  .dia {
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .mes {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--primario-tinta);
  }

  .anio {
    font-size: 0.6875rem;
    color: var(--texto-3);
  }

  .resumen {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .motivo {
    display: -webkit-box;
    overflow: hidden;
    font-weight: 600;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .motivo.vacio {
    font-weight: 500;
    color: var(--texto-3);
  }

  .linea {
    display: flex;
    align-items: baseline;
    gap: 8px;
    overflow: hidden;
    font-size: 0.875rem;
    color: var(--texto-2);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .clave {
    flex: none;
    padding: 0 6px;
    border-radius: 4px;
    background: var(--superficie-3);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.6;
    color: var(--texto-2);
  }

  .consulta :global(.flecha) {
    flex: none;
    color: var(--texto-3);
  }

  @media (max-width: 640px) {
    .ultima-rx {
      padding: 16px 16px 6px;
    }

    .consulta {
      gap: 12px;
      padding: 12px;
    }

    .linea {
      white-space: normal;
    }

    .borrador {
      flex-wrap: wrap;
    }

    .borrador .btn {
      margin-left: 30px;
    }
  }
</style>
