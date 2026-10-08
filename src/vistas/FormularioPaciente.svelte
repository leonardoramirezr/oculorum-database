<script lang="ts">
  import { ArrowLeft, CircleAlert, Save, Stethoscope, Trash, TriangleAlert } from '@lucide/svelte'
  import { untrack } from 'svelte'
  import CampoFecha from '../componentes/CampoFecha.svelte'
  import { borrarBorradoresDe } from '../lib/borradores'
  import { posiblesDuplicados } from '../lib/buscar'
  import { expedientes } from '../lib/expedientes.svelte'
  import { edad, formatoNumerico, hoyISO, textoEdad } from '../lib/fechas'
  import { router } from '../lib/router.svelte'
  import { href, rutas } from '../lib/rutas'
  import { formatoTelefono, limpiarEspacios, nombreCompleto, separarNombre } from '../lib/texto'
  import { datosPacienteVacios, type DatosPaciente, type Paciente } from '../lib/tipos'
  import { ui } from '../lib/ui.svelte'
  import NoEncontrado from './NoEncontrado.svelte'

  interface Props {
    /** Con id se editan los datos de un expediente existente. */
    id?: string
    nombreSugerido?: string
  }

  let { id, nombreSugerido = '' }: Props = $props()

  // La vista se vuelve a crear en cada navegación, así que basta leer las props una vez.
  const existente = untrack(() => (id ? expedientes.porId(id) : undefined))

  function datosIniciales(p: Paciente | undefined): DatosPaciente {
    if (!p) return { ...datosPacienteVacios(), ...separarNombre(untrack(() => nombreSugerido)) }
    const { nombre, apellidoPaterno, apellidoMaterno, fechaNacimiento, domicilio, telefono } = p
    return { nombre, apellidoPaterno, apellidoMaterno, fechaNacimiento, domicilio, telefono }
  }

  let datos = $state(datosIniciales(existente))
  const original = JSON.stringify(datos)

  type Requerido = 'nombre' | 'apellidoPaterno' | 'fechaNacimiento'
  const REQUERIDOS: Requerido[] = ['nombre', 'apellidoPaterno', 'fechaNacimiento']

  let fechaMalFormada = $state(false)
  let intentoGuardar = $state(false)
  let tocados = $state<Partial<Record<Requerido, boolean>>>({})
  let guardando = $state(false)

  const errores = $derived.by(() => {
    const e: Partial<Record<Requerido, string>> = {}
    if (!datos.nombre.trim()) e.nombre = 'Escribe el nombre del paciente.'
    if (!datos.apellidoPaterno.trim()) e.apellidoPaterno = 'Escribe el apellido paterno.'
    if (fechaMalFormada) e.fechaNacimiento = 'Escribe la fecha como dd/mm/aaaa, p. ej. 15/03/1990.'
    else if (!datos.fechaNacimiento) e.fechaNacimiento = 'Escribe la fecha de nacimiento.'
    else if (datos.fechaNacimiento > hoyISO()) e.fechaNacimiento = 'La fecha de nacimiento no puede ser futura.'
    else if ((edad(datos.fechaNacimiento)?.anios ?? 0) > 120) e.fechaNacimiento = 'Revisa el año de nacimiento.'
    return e
  })

  const errorVisible = (campo: Requerido) => (intentoGuardar || tocados[campo] ? errores[campo] : undefined)

  const edadTexto = $derived(
    datos.fechaNacimiento && !errores.fechaNacimiento ? textoEdad(datos.fechaNacimiento) : '',
  )
  const duplicados = $derived(posiblesDuplicados(expedientes.pacientes, datos, existente?.id))

  async function guardar(despues: 'consulta' | 'expediente') {
    intentoGuardar = true
    const primero = REQUERIDOS.find((c) => errores[c])
    if (primero) {
      document.getElementById(`paciente-${primero}`)?.focus()
      return
    }
    guardando = true
    const limpios: DatosPaciente = {
      nombre: limpiarEspacios(datos.nombre),
      apellidoPaterno: limpiarEspacios(datos.apellidoPaterno),
      apellidoMaterno: limpiarEspacios(datos.apellidoMaterno),
      fechaNacimiento: datos.fechaNacimiento,
      domicilio: datos.domicilio.trim(),
      telefono: formatoTelefono(datos.telefono),
    }
    try {
      if (existente) {
        await expedientes.actualizar(existente.id, limpios)
        ui.avisar('Datos del paciente actualizados')
        router.ir(rutas.paciente(existente.id), { reemplazar: true })
      } else {
        const paciente = await expedientes.crear(limpios)
        ui.avisar(`Expediente ${paciente.id} abierto`)
        router.ir(despues === 'consulta' ? rutas.nuevaConsulta(paciente.id) : rutas.paciente(paciente.id), {
          reemplazar: true,
        })
      }
    } catch (e) {
      ui.avisar(`No se pudo guardar: ${e instanceof Error ? e.message : e}`, 'error')
      guardando = false
    }
  }

  async function cancelar() {
    const cambios = JSON.stringify(datos) !== original
    if (
      cambios &&
      !(await ui.confirmar({
        titulo: 'Descartar lo capturado',
        mensaje: 'Los datos que escribiste no se guardarán.',
        confirmar: 'Descartar',
        cancelar: 'Seguir editando',
        peligro: true,
      }))
    ) {
      return
    }
    router.ir(existente ? rutas.paciente(existente.id) : rutas.inicio())
  }

  async function eliminar() {
    if (!existente) return
    const n = (await expedientes.consultasDe(existente.id)).length
    const ok = await ui.confirmar({
      titulo: `¿Eliminar el expediente ${existente.id}?`,
      mensaje: `Se borrarán los datos de ${nombreCompleto(existente)}${
        n ? ` y ${n === 1 ? 'su consulta' : `sus ${n} consultas`}` : ''
      }. Esta acción no se puede deshacer.`,
      confirmar: 'Eliminar expediente',
      peligro: true,
    })
    if (!ok) return
    try {
      await expedientes.eliminar(existente.id)
      borrarBorradoresDe(existente.id)
      ui.avisar(`Expediente ${existente.id} eliminado`)
      router.ir(rutas.inicio(), { reemplazar: true })
    } catch (e) {
      ui.avisar(`No se pudo eliminar: ${e instanceof Error ? e.message : e}`, 'error')
    }
  }
</script>

{#snippet error(campo: Requerido)}
  {#if errorVisible(campo)}
    <p class="error-campo" id="error-{campo}"><CircleAlert size={14} />{errorVisible(campo)}</p>
  {/if}
{/snippet}

<svelte:head>
  <title>{existente ? `Editar · ${nombreCompleto(existente)}` : 'Nuevo expediente'} · Oculorum</title>
</svelte:head>

{#if id && !existente}
  <NoEncontrado titulo="No encontramos el expediente {id}" />
{:else}
  <div class="pagina angosta">
    <a class="volver" href={href(existente ? rutas.paciente(existente.id) : rutas.inicio())}>
      <ArrowLeft size={16} />
      {existente ? 'Volver al expediente' : 'Pacientes'}
    </a>

    <div class="cabecera-pagina">
      <div>
        <h1>{existente ? 'Editar datos del paciente' : 'Nuevo expediente'}</h1>
        <p class="subtitulo">
          {#if existente}
            {nombreCompleto(existente)} · Expediente <span class="tabular">{existente.id}</span>
          {:else}
            Al guardar se le asignará el número de expediente
            <span class="insignia expediente">{expedientes.siguienteId}</span>
          {/if}
        </p>
      </div>
    </div>

    <form
      novalidate
      onsubmit={(e) => {
        e.preventDefault()
        guardar('consulta')
      }}
    >
      <fieldset class="tarjeta grupo">
        <legend>Datos del paciente</legend>
        <div class="rejilla">
          <div class="campo">
            <label class="etiqueta" for="paciente-nombre">Nombre(s)</label>
            <input
              id="paciente-nombre"
              class="control"
              bind:value={datos.nombre}
              autocomplete="off"
              autocapitalize="words"
              spellcheck="false"
              required
              aria-invalid={!!errorVisible('nombre')}
              aria-describedby={errorVisible('nombre') ? 'error-nombre' : undefined}
              onblur={() => (tocados.nombre = true)}
            />
            {@render error('nombre')}
          </div>

          <div class="rejilla dos">
            <div class="campo">
              <label class="etiqueta" for="paciente-apellidoPaterno">Apellido paterno</label>
              <input
                id="paciente-apellidoPaterno"
                class="control"
                bind:value={datos.apellidoPaterno}
                autocomplete="off"
                autocapitalize="words"
                spellcheck="false"
                required
                aria-invalid={!!errorVisible('apellidoPaterno')}
                aria-describedby={errorVisible('apellidoPaterno') ? 'error-apellidoPaterno' : undefined}
                onblur={() => (tocados.apellidoPaterno = true)}
              />
              {@render error('apellidoPaterno')}
            </div>
            <div class="campo">
              <label class="etiqueta" for="paciente-apellidoMaterno">
                Apellido materno <span class="opcional">Opcional</span>
              </label>
              <input
                id="paciente-apellidoMaterno"
                class="control"
                bind:value={datos.apellidoMaterno}
                autocomplete="off"
                autocapitalize="words"
                spellcheck="false"
              />
            </div>
          </div>

          {#if duplicados.length}
            <div class="alerta aviso" role="status">
              <TriangleAlert size={18} />
              <div class="cuerpo">
                <strong>¿Es la misma persona?</strong>
                <span>
                  Ya {duplicados.length === 1 ? 'existe un expediente' : 'existen expedientes'} con este nombre:
                </span>
                <ul class="duplicados">
                  {#each duplicados as d (d.id)}
                    <li>
                      <a href={href(rutas.paciente(d.id))}>
                        <span class="insignia expediente">Exp. {d.id}</span>
                        {nombreCompleto(d)}
                      </a>
                      {#if d.fechaNacimiento}
                        <span class="tenue">· nació el {formatoNumerico(d.fechaNacimiento)}</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
                <span class="tenue">Si se trata de otra persona, puedes continuar.</span>
              </div>
            </div>
          {/if}

          <div class="campo">
            <label class="etiqueta" for="paciente-fechaNacimiento">Fecha de nacimiento</label>
            <div class="fecha-y-edad">
              <CampoFecha
                id="paciente-fechaNacimiento"
                bind:valor={datos.fechaNacimiento}
                bind:malFormada={fechaMalFormada}
                requerido
                invalido={!!errorVisible('fechaNacimiento')}
                describedby={errorVisible('fechaNacimiento') ? 'error-fechaNacimiento' : 'ayuda-fecha'}
                onblur={() => (tocados.fechaNacimiento = true)}
              />
              {#if edadTexto}<span class="edad" aria-live="polite">{edadTexto}</span>{/if}
            </div>
            {#if errorVisible('fechaNacimiento')}
              {@render error('fechaNacimiento')}
            {:else}
              <p class="ayuda" id="ayuda-fecha">Día, mes y año. Puedes escribir solo los números: 15031990.</p>
            {/if}
          </div>
        </div>
      </fieldset>

      <fieldset class="tarjeta grupo">
        <legend>Contacto</legend>
        <div class="rejilla">
          <div class="campo telefono">
            <label class="etiqueta" for="paciente-telefono">Teléfono <span class="opcional">Opcional</span></label>
            <input
              id="paciente-telefono"
              class="control tabular"
              type="tel"
              inputmode="tel"
              autocomplete="off"
              placeholder="10 dígitos"
              bind:value={datos.telefono}
              onblur={() => (datos.telefono = formatoTelefono(datos.telefono))}
            />
          </div>
          <div class="campo">
            <label class="etiqueta" for="paciente-domicilio">Domicilio <span class="opcional">Opcional</span></label>
            <textarea
              id="paciente-domicilio"
              class="control"
              rows="2"
              placeholder="Calle y número, colonia, municipio, código postal"
              bind:value={datos.domicilio}
            ></textarea>
          </div>
        </div>
      </fieldset>

      <div class="acciones-formulario">
        <button type="button" class="btn btn-fantasma" onclick={cancelar}>Cancelar</button>
        <div class="principales">
          {#if existente}
            <button type="submit" class="btn btn-primario" disabled={guardando}>
              <Save size={18} /> Guardar cambios
            </button>
          {:else}
            <button type="button" class="btn btn-secundario" disabled={guardando} onclick={() => guardar('expediente')}>
              Solo guardar
            </button>
            <button type="submit" class="btn btn-primario" disabled={guardando}>
              <Stethoscope size={18} /> Guardar y comenzar consulta
            </button>
          {/if}
        </div>
      </div>
    </form>

    {#if existente}
      <section class="zona-peligro" aria-labelledby="titulo-eliminar">
        <div>
          <h2 id="titulo-eliminar">Eliminar expediente</h2>
          <p class="tenue">Borra al paciente y todas sus consultas de este dispositivo.</p>
        </div>
        <button type="button" class="btn btn-peligro-suave" onclick={eliminar}>
          <Trash size={16} /> Eliminar
        </button>
      </section>
    {/if}
  </div>
{/if}

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .grupo {
    margin: 0;
    padding: 20px 24px 24px;
    min-width: 0;
  }

  legend {
    float: left;
    width: 100%;
    margin-bottom: 18px;
    padding: 0;
    font-size: 1rem;
    font-weight: 620;
  }

  legend + :global(*) {
    clear: both;
  }

  .fecha-y-edad {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .edad {
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--primario-suave);
    color: var(--primario-tinta);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .telefono {
    max-width: 16rem;
  }

  .duplicados {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 4px 0;
    padding: 0;
    list-style: none;
  }

  .duplicados a {
    font-weight: 600;
  }

  .acciones-formulario {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
  }

  .principales {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .zona-peligro {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 24px;
    margin-top: 48px;
    padding: 18px 20px;
    border: 1px solid color-mix(in srgb, var(--peligro) 25%, var(--borde));
    border-radius: var(--r-lg);
  }

  .zona-peligro h2 {
    font-size: 0.9375rem;
  }

  .zona-peligro p {
    margin-top: 2px;
    font-size: 0.875rem;
  }

  @media (max-width: 640px) {
    .grupo {
      padding: 16px 16px 20px;
    }

    .acciones-formulario {
      flex-direction: column-reverse;
      align-items: stretch;
    }

    .principales {
      flex-direction: column-reverse;
    }

    .principales .btn {
      width: 100%;
    }
  }
</style>
