<script lang="ts">
  import { ArrowLeft, Check, CircleAlert, Copy, History, Lightbulb, Save } from '@lucide/svelte'
  import { onMount, untrack } from 'svelte'
  import AreaTexto from '../componentes/AreaTexto.svelte'
  import Avatar from '../componentes/Avatar.svelte'
  import CampoFecha from '../componentes/CampoFecha.svelte'
  import CampoRx from '../componentes/CampoRx.svelte'
  import IndiceSecciones from '../componentes/IndiceSecciones.svelte'
  import Seccion from '../componentes/Seccion.svelte'
  import TablaRx from '../componentes/TablaRx.svelte'
  import { borrarBorrador, claveBorrador, guardarBorrador, leerBorrador } from '../lib/borradores'
  import { expedientes } from '../lib/expedientes.svelte'
  import { formatoHora, formatoMedio, haceCuanto, hoyISO, textoEdad } from '../lib/fechas'
  import { nuevoUUID } from '../lib/ids'
  import { completar } from '../lib/objetos'
  import { conSignoMenos, formatoRx, SUGERENCIAS_AV, SUGERENCIAS_BASE, tieneDatos, type TipoRx } from '../lib/optometria'
  import { router } from '../lib/router.svelte'
  import { href, rutas } from '../lib/rutas'
  import { ANTECEDENTES, DIAGNOSTICOS, EXPLORACION, TRATAMIENTOS } from '../lib/sugerencias'
  import { nombreCompleto } from '../lib/texto'
  import { consultaVacia, rxOjoVacio, type Consulta, type DatosConsulta } from '../lib/tipos'
  import { ui } from '../lib/ui.svelte'
  import NoEncontrado from './NoEncontrado.svelte'

  interface Props {
    id: string
    /** Con consultaId se edita una consulta existente. */
    consultaId?: string
  }

  let { id, consultaId }: Props = $props()

  // La vista se vuelve a crear en cada navegación, así que basta leer las props una vez.
  const editando = untrack(() => consultaId !== undefined)
  const clave = untrack(() => claveBorrador(id, consultaId))

  const paciente = $derived(expedientes.porId(id))

  let estado = $state<'cargando' | 'lista' | 'no-encontrada'>('cargando')
  let form = $state<DatosConsulta>(consultaVacia(hoyISO()))
  let original: Consulta | undefined
  /** Consultas anteriores a esta, de la más reciente a la más antigua. */
  let previas = $state.raw<Consulta[]>([])
  /** El formulario tal como se abrió, para saber si hay cambios. */
  let inicial = ''
  let borradorRecuperado = $state<string | null>(null)
  let borradorGuardado = $state<string | null>(null)
  let temporizador: ReturnType<typeof setTimeout> | undefined
  let fechaMalFormada = $state(false)
  let fechaTocada = $state(false)
  let intentoGuardar = $state(false)
  let guardando = $state(false)
  let formulario = $state<HTMLFormElement>()

  /** «Exp. 0001 · 36 años», con la edad a la fecha de la consulta. */
  const detallePaciente = $derived(
    paciente
      ? [`Exp. ${paciente.id}`, paciente.fechaNacimiento && textoEdad(paciente.fechaNacimiento, form.fecha || hoyISO())]
          .filter(Boolean)
          .join(' · ')
      : '',
  )

  const datosDe = (c: Consulta): DatosConsulta => completar(consultaVacia(c.fecha), c)

  onMount(async () => {
    try {
      const consultas = await expedientes.consultasDe(id)
      if (consultaId) {
        original = consultas.find((c) => c.id === consultaId)
        if (!original) {
          estado = 'no-encontrada'
          return
        }
        form = datosDe(original)
        previas = consultas.slice(consultas.indexOf(original) + 1)
      } else {
        previas = consultas
      }
      inicial = JSON.stringify(form)

      const borrador = leerBorrador<unknown>(clave)
      if (borrador) {
        const datos = completar(consultaVacia(form.fecha), borrador.datos)
        if (JSON.stringify(datos) !== inicial) {
          form = datos
          borradorRecuperado = borrador.guardado
        } else {
          borrarBorrador(clave)
        }
      }
      estado = 'lista'
    } catch (e) {
      ui.avisar(`No se pudo abrir la consulta: ${e instanceof Error ? e.message : e}`, 'error')
    }
  })

  // Borrador automático: si se cierra la pestaña o se sale sin guardar, se recupera al volver.
  $effect(() => {
    if (estado !== 'lista') return
    const json = JSON.stringify(form)
    if (json === inicial) {
      borrarBorrador(clave)
      borradorGuardado = null
      return
    }
    temporizador = setTimeout(() => (borradorGuardado = guardarBorrador(clave, JSON.parse(json))), 500)
    return () => clearTimeout(temporizador)
  })

  const completas = $derived({
    motivo: form.motivo.trim() !== '' || form.antecedentes.trim() !== '',
    agudeza: tieneDatos(form.agudezaVisual),
    lensometria:
      form.lensometria.sinLentes || tieneDatos(form.lensometria.od) || tieneDatos(form.lensometria.oi),
    refraccion: tieneDatos(form.refraccion.od) || tieneDatos(form.refraccion.oi),
    exploracion: form.exploracion.trim() !== '',
    diagnostico: form.diagnostico.trim() !== '' || form.tratamiento.trim() !== '',
  })

  const secciones = $derived([
    { id: 'motivo', titulo: 'Motivo y antecedentes', completa: completas.motivo },
    { id: 'agudeza', titulo: 'Agudeza visual', completa: completas.agudeza },
    { id: 'lensometria', titulo: 'Lensometría', completa: completas.lensometria },
    { id: 'refraccion', titulo: 'Refracción subjetiva', completa: completas.refraccion },
    { id: 'exploracion', titulo: 'Exploración física', completa: completas.exploracion },
    { id: 'diagnostico', titulo: 'Diagnóstico y tratamiento', completa: completas.diagnostico },
  ])

  const errorFecha = $derived(
    fechaMalFormada
      ? 'Escribe la fecha como dd/mm/aaaa.'
      : !form.fecha
        ? 'Escribe la fecha de la consulta.'
        : form.fecha > hoyISO()
          ? 'La fecha no puede ser futura.'
          : '',
  )
  const errorFechaVisible = $derived(intentoGuardar || fechaTocada ? errorFecha : '')

  // ── Atajos para copiar información ──

  const rxAnterior = $derived(previas.find((c) => tieneDatos(c.refraccion.od) || tieneDatos(c.refraccion.oi)))
  const antecedentesPrevios = $derived(previas.find((c) => c.antecedentes.trim()))
  const lensometriaVacia = $derived(!tieneDatos(form.lensometria.od) && !tieneDatos(form.lensometria.oi))
  const puedeCopiarLensometria = $derived(
    !form.lensometria.sinLentes &&
      !lensometriaVacia &&
      [form.refraccion.od, form.refraccion.oi].every((o) => !o.esfera && !o.cilindro && !o.eje),
  )

  function traerAntecedentes() {
    if (antecedentesPrevios) form.antecedentes = antecedentesPrevios.antecedentes
  }

  function copiarRxAnterior() {
    if (!rxAnterior) return
    for (const ojo of ['od', 'oi'] as const) {
      const { esfera, cilindro, eje } = rxAnterior.refraccion[ojo]
      form.lensometria[ojo] = { esfera, cilindro, eje }
    }
  }

  function copiarLensometria() {
    for (const ojo of ['od', 'oi'] as const) Object.assign(form.refraccion[ojo], form.lensometria[ojo])
  }

  const COLUMNAS_LENSOMETRIA: TipoRx[] = ['esfera', 'cilindro', 'eje']
  const COLUMNAS_REFRACCION: TipoRx[] = ['esfera', 'cilindro', 'eje', 'add', 'prisma', 'base', 'av']
  const OJOS_AV = [
    { clave: 'od', sigla: 'OD', nombre: 'Ojo derecho' },
    { clave: 'oi', sigla: 'OI', nombre: 'Ojo izquierdo' },
    { clave: 'ou', sigla: 'OU', nombre: 'Ambos ojos' },
  ] as const

  // ── Guardar / cancelar ──

  async function guardar() {
    if (guardando || estado !== 'lista') return
    intentoGuardar = true
    if (errorFecha) {
      document.getElementById('consulta-fecha')?.focus()
      return
    }
    if (!Object.values(completas).some(Boolean)) {
      ui.avisar('La consulta está vacía: captura al menos una sección.', 'error')
      return
    }
    guardando = true
    clearTimeout(temporizador)

    const datos = $state.snapshot(form)
    for (const campo of ['motivo', 'antecedentes', 'exploracion', 'diagnostico', 'tratamiento'] as const) {
      datos[campo] = datos[campo].trim()
    }
    datos.agudezaVisual.notas = datos.agudezaVisual.notas.trim()
    if (datos.lensometria.sinLentes) {
      datos.lensometria.od = rxOjoVacio()
      datos.lensometria.oi = rxOjoVacio()
    }
    const ahora = new Date().toISOString()
    const consulta: Consulta = {
      ...datos,
      id: original?.id ?? nuevoUUID(),
      pacienteId: id,
      creado: original?.creado ?? ahora,
      actualizado: ahora,
    }
    try {
      await expedientes.guardarConsulta(consulta)
      borrarBorrador(clave)
      ui.avisar(editando ? 'Cambios guardados' : 'Consulta guardada')
      router.ir(rutas.consulta(id, consulta.id), { reemplazar: true })
    } catch (e) {
      ui.avisar(`No se pudo guardar: ${e instanceof Error ? e.message : e}`, 'error')
      guardando = false
    }
  }

  async function cancelar() {
    const cambios = estado === 'lista' && JSON.stringify(form) !== inicial
    if (
      cambios &&
      !(await ui.confirmar({
        titulo: 'Descartar la captura',
        mensaje: editando
          ? 'Los cambios a esta consulta no se guardarán.'
          : 'Lo que capturaste en esta consulta se perderá.',
        confirmar: 'Descartar',
        cancelar: 'Seguir capturando',
        peligro: true,
      }))
    ) {
      return
    }
    clearTimeout(temporizador)
    borrarBorrador(clave)
    router.ir(original ? rutas.consulta(id, original.id) : rutas.paciente(id))
  }

  function descartarBorrador() {
    form = JSON.parse(inicial)
    borrarBorrador(clave)
    borradorRecuperado = null
  }

  /** Enter avanza al siguiente campo en lugar de enviar el formulario. */
  function alTeclear(e: KeyboardEvent) {
    const campo = e.target
    if (e.key !== 'Enter' || e.isComposing || !(campo instanceof HTMLInputElement) || campo.type === 'checkbox') return
    e.preventDefault()
    const campos = [...(formulario?.querySelectorAll<HTMLElement>('input:not([type=checkbox]), textarea') ?? [])]
    const siguiente = campos[campos.indexOf(campo) + 1]
    siguiente?.focus()
    // Igual que con Tab: al llegar a un campo con valor, escribir lo reemplaza.
    if (siguiente instanceof HTMLInputElement) siguiente.select()
  }

  function atajosGlobales(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !ui.confirmacion) {
      e.preventDefault()
      void guardar()
    }
  }
</script>

<svelte:window onkeydown={atajosGlobales} />

<svelte:head>
  <title>{editando ? 'Editar consulta' : 'Nueva consulta'}{paciente ? ` · ${nombreCompleto(paciente)}` : ''} · Oculorum</title>
</svelte:head>

{#if !paciente}
  <NoEncontrado titulo="No encontramos el expediente {id}" />
{:else if estado === 'no-encontrada'}
  <NoEncontrado titulo="No encontramos esta consulta" texto="Es posible que se haya eliminado." />
{:else}
  <div class="pagina">
    <a class="volver" href={href(rutas.paciente(paciente.id))}>
      <ArrowLeft size={16} /> Expediente de {nombreCompleto(paciente)}
    </a>

    <div class="cabecera-consulta">
      <div>
        <h1>{editando ? 'Editar consulta' : 'Nueva consulta'}</h1>
        <div class="paciente-mini">
          <Avatar {paciente} tamano="chico" />
          <span>
            <strong>{nombreCompleto(paciente)}</strong>
            <span class="tenue">· {detallePaciente}</span>
          </span>
        </div>
      </div>
      <div class="campo fecha-consulta">
        <label class="etiqueta" for="consulta-fecha">Fecha de la consulta</label>
        <CampoFecha
          id="consulta-fecha"
          bind:valor={form.fecha}
          bind:malFormada={fechaMalFormada}
          requerido
          invalido={!!errorFechaVisible}
          describedby={errorFechaVisible ? 'error-fecha' : undefined}
          onblur={() => (fechaTocada = true)}
        />
        {#if errorFechaVisible}
          <p class="error-campo" id="error-fecha"><CircleAlert size={14} />{errorFechaVisible}</p>
        {/if}
      </div>
    </div>

    {#if borradorRecuperado}
      <div class="alerta info recuperado">
        <History size={18} />
        <div class="cuerpo">
          <strong>Recuperamos lo que estabas capturando</strong>
          <span class="tenue">
            Borrador guardado {haceCuanto(borradorRecuperado)}, a las {formatoHora(borradorRecuperado)}
          </span>
        </div>
        <button type="button" class="btn btn-fantasma btn-sm" onclick={descartarBorrador}>Descartar borrador</button>
      </div>
    {/if}

    {#if estado === 'cargando'}
      <div class="tarjeta cargando" aria-busy="true">Cargando…</div>
    {:else}
      <datalist id="lista-av">
        {#each SUGERENCIAS_AV as s (s.valor)}<option value={s.valor}>{s.texto ?? ''}</option>{/each}
      </datalist>
      <datalist id="lista-base">
        {#each SUGERENCIAS_BASE as b (b)}<option value={b}></option>{/each}
      </datalist>

      <div class="disposicion">
        <aside class="lateral">
          <IndiceSecciones {secciones} />
        </aside>

        <!-- El manejador de teclas solo delega el Enter de los campos internos. -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <form
          bind:this={formulario}
          class="secciones"
          novalidate
          onsubmit={(e) => {
            e.preventDefault()
            void guardar()
          }}
          onkeydown={alTeclear}
        >
          <Seccion id="motivo" numero={1} titulo="Motivo de consulta y antecedentes">
            <AreaTexto
              id="consulta-motivo"
              etiqueta="Motivo de consulta"
              bind:valor={form.motivo}
              filas={2}
              placeholder="¿Por qué acude? Ej. Visión borrosa de lejos desde hace 6 meses, dolor de cabeza al leer…"
            />
            <AreaTexto
              id="consulta-antecedentes"
              etiqueta="Antecedentes y anamnesis"
              bind:valor={form.antecedentes}
              filas={4}
              placeholder="Antecedentes personales y familiares, uso de lentes, enfermedades, medicamentos…"
              sugerencias={ANTECEDENTES}
            >
              {#snippet accion()}
                {#if antecedentesPrevios && !form.antecedentes.trim()}
                  <button type="button" class="btn btn-fantasma btn-sm" onclick={traerAntecedentes}>
                    <Copy size={14} /> Traer de la consulta del {formatoMedio(antecedentesPrevios.fecha)}
                  </button>
                {/if}
              {/snippet}
            </AreaTexto>
          </Seccion>

          <Seccion
            id="agudeza"
            numero={2}
            titulo="Agudeza visual"
            descripcion="Basta con escribir el denominador: 40 se convierte en 20/40."
          >
            <div class="agudeza">
              {#each OJOS_AV as ojo (ojo.clave)}
                <div class="campo">
                  <label class="etiqueta-ojo" for="av-{ojo.clave}">
                    <span class="sigla">{ojo.sigla}</span>
                    <span>{ojo.nombre}</span>
                  </label>
                  <CampoRx id="av-{ojo.clave}" tipo="av" bind:valor={form.agudezaVisual[ojo.clave]} />
                </div>
              {/each}
            </div>
            <AreaTexto
              id="consulta-av-notas"
              etiqueta="Resultados y observaciones"
              bind:valor={form.agudezaVisual.notas}
              filas={2}
              placeholder="Ej. Sin corrección, de lejos. Con agujero estenopeico mejora a 20/25."
            />
          </Seccion>

          <Seccion
            id="lensometria"
            numero={3}
            titulo="Lensometría"
            descripcion="Graduación de los lentes que usa actualmente."
          >
            {#snippet acciones()}
              {#if rxAnterior && lensometriaVacia && !form.lensometria.sinLentes}
                <button type="button" class="btn btn-fantasma btn-sm" onclick={copiarRxAnterior}>
                  <Copy size={14} /> Copiar refracción del {formatoMedio(rxAnterior.fecha)}
                </button>
              {/if}
            {/snippet}
            <label class="interruptor">
              <input type="checkbox" bind:checked={form.lensometria.sinLentes} />
              <span>El paciente no usa lentes</span>
            </label>
            {#if !form.lensometria.sinLentes}
              <TablaRx
                idBase="lensometria"
                bind:od={form.lensometria.od}
                bind:oi={form.lensometria.oi}
                columnas={COLUMNAS_LENSOMETRIA}
              />
            {/if}
          </Seccion>

          <Seccion
            id="refraccion"
            numero={4}
            titulo="Refracción subjetiva"
            descripcion="Graduación final y la agudeza visual que se alcanza con ella."
          >
            {#snippet acciones()}
              {#if puedeCopiarLensometria}
                <button type="button" class="btn btn-fantasma btn-sm" onclick={copiarLensometria}>
                  <Copy size={14} /> Partir de la lensometría
                </button>
              {/if}
            {/snippet}
            <TablaRx
              idBase="refraccion"
              bind:od={form.refraccion.od}
              bind:oi={form.refraccion.oi}
              columnas={COLUMNAS_REFRACCION}
            />
            {#if rxAnterior}
              <p class="referencia tabular">
                <span class="mas-tenue">Refracción anterior ({formatoMedio(rxAnterior.fecha)}):</span>
                OD {formatoRx(rxAnterior.refraccion.od) || '—'} · OI {formatoRx(rxAnterior.refraccion.oi) || '—'}
                {#if rxAnterior.refraccion.od.add}· ADD {conSignoMenos(rxAnterior.refraccion.od.add)}{/if}
              </p>
            {/if}
            <p class="ayuda atajos">
              <Lightbulb size={14} />
              <span>
                Escribe <kbd>-125</kbd> para −1.25 y usa <kbd>↑</kbd> <kbd>↓</kbd> para ajustar de 0.25 en 0.25.
                La ADD de OD se copia a OI.
              </span>
            </p>
          </Seccion>

          <Seccion id="exploracion" numero={5} titulo="Exploración física">
            <AreaTexto
              id="consulta-exploracion"
              etiqueta="Hallazgos de la exploración física"
              ocultarEtiqueta
              bind:valor={form.exploracion}
              filas={4}
              placeholder="Párpados, conjuntiva, córnea, pupilas, fondo de ojo…"
              sugerencias={EXPLORACION}
            />
          </Seccion>

          <Seccion id="diagnostico" numero={6} titulo="Diagnóstico y tratamiento">
            <AreaTexto
              id="consulta-diagnostico"
              etiqueta="Diagnóstico"
              bind:valor={form.diagnostico}
              filas={2}
              placeholder="Ej. Miopía con astigmatismo en ambos ojos."
              sugerencias={DIAGNOSTICOS}
            />
            <AreaTexto
              id="consulta-tratamiento"
              etiqueta="Tratamiento e indicaciones"
              bind:valor={form.tratamiento}
              filas={3}
              placeholder="Ej. Lentes monofocales con antirreflejante. Revisión en un año."
              sugerencias={TRATAMIENTOS}
            />
          </Seccion>
        </form>
      </div>
    {/if}
  </div>

  <div class="barra-acciones no-imprimir">
    <div class="interior">
      <span class="estado" aria-live="polite">
        {#if borradorGuardado}
          <Check size={15} strokeWidth={2.5} /> Borrador guardado a las {formatoHora(borradorGuardado)}
        {:else}
          <span class="mas-tenue">Mientras escribes se guarda un borrador</span>
        {/if}
      </span>
      <button type="button" class="btn btn-fantasma" onclick={cancelar}>Cancelar</button>
      <button
        type="button"
        class="btn btn-primario"
        onclick={guardar}
        disabled={guardando || estado !== 'lista'}
        title="Guardar (Ctrl + S)"
      >
        <Save size={18} />
        {editando ? 'Guardar cambios' : 'Guardar consulta'}
      </button>
    </div>
  </div>
{/if}

<style>
  .cabecera-consulta {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px 24px;
  }

  .paciente-mini {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    font-size: 0.9375rem;
  }

  .fecha-consulta {
    min-width: 10.5rem;
  }

  .recuperado {
    align-items: center;
    margin-top: 20px;
  }

  .cargando {
    margin-top: 20px;
    padding: 24px;
    color: var(--texto-3);
  }

  .disposicion {
    display: grid;
    /* minmax(0, …): el índice horizontal se desplaza en lugar de ensanchar la página. */
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    margin-top: 24px;
  }

  @media (min-width: 1024px) {
    .disposicion {
      grid-template-columns: 220px minmax(0, 1fr);
      gap: 32px;
    }
  }

  /* En pantallas angostas el índice queda fijo arriba de todo el formulario. */
  @media (max-width: 1023.98px) {
    .lateral {
      display: contents;
    }
  }

  .secciones {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .agudeza {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 11rem));
    gap: 12px;
  }

  @media (max-width: 520px) {
    .agudeza {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
  }

  .etiqueta-ojo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8125rem;
    color: var(--texto-2);
  }

  .sigla {
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
  }

  @media (max-width: 520px) {
    .etiqueta-ojo span:not(.sigla) {
      display: none;
    }
  }

  /* Interruptor «no usa lentes». */
  .interruptor {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    width: fit-content;
    font-size: 0.9375rem;
    cursor: pointer;
  }

  .interruptor input {
    position: relative;
    flex: none;
    width: 38px;
    height: 22px;
    margin: 0;
    border-radius: 999px;
    background: var(--borde-fuerte);
    appearance: none;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .interruptor input::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
    transition: transform 0.15s;
  }

  .interruptor input:checked {
    background: var(--primario);
  }

  .interruptor input:checked::after {
    transform: translateX(16px);
  }

  .interruptor input:focus-visible {
    outline: none;
    box-shadow: var(--anillo);
  }

  .referencia {
    padding: 8px 12px;
    border-radius: var(--r);
    background: var(--superficie-2);
    font-size: 0.8125rem;
    color: var(--texto-2);
  }

  .atajos {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  .atajos :global(svg) {
    flex: none;
    margin-top: 2px;
  }

  kbd {
    padding: 0 5px;
    border: 1px solid var(--borde-fuerte);
    border-bottom-width: 2px;
    border-radius: 4px;
    background: var(--superficie);
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--texto-2);
  }

  @media (pointer: coarse) {
    .atajos {
      display: none;
    }
  }

  .barra-acciones {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 15;
    border-top: 1px solid var(--borde);
    background: color-mix(in srgb, var(--superficie) 94%, transparent);
    backdrop-filter: saturate(1.4) blur(12px);
  }

  .barra-acciones .interior {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 1080px;
    margin: 0 auto;
    padding: 12px 24px calc(12px + env(safe-area-inset-bottom));
  }

  .estado {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-right: auto;
    min-width: 0;
    font-size: 0.8125rem;
    color: var(--exito);
  }

  @media (max-width: 640px) {
    .barra-acciones .interior {
      padding-inline: 16px;
    }

    .estado {
      display: none;
    }

    .barra-acciones .btn {
      flex: 1;
    }

    .recuperado {
      flex-wrap: wrap;
    }

    .recuperado .btn {
      margin-left: 30px;
    }
  }
</style>
