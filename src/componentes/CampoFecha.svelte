<script lang="ts">
  import { formatoNumerico, interpretarFecha } from '../lib/fechas'

  interface Props {
    id: string
    /** Fecha AAAA-MM-DD, o '' si está vacía o incompleta. */
    valor: string
    /** true cuando hay texto escrito que no forma una fecha válida. */
    malFormada?: boolean
    invalido?: boolean
    describedby?: string
    requerido?: boolean
    onblur?: () => void
  }

  let {
    id,
    valor = $bindable(''),
    malFormada = $bindable(false),
    invalido = false,
    describedby,
    requerido = false,
    onblur,
  }: Props = $props()

  let texto = $state(formatoNumerico(valor))
  let emitido = valor

  // Si la fecha cambia desde fuera (p. ej. al recuperar un borrador), mostrarla.
  $effect(() => {
    if (valor !== emitido) {
      emitido = valor
      texto = formatoNumerico(valor)
      malFormada = false
    }
  })

  function alEscribir(e: Event & { currentTarget: HTMLInputElement }) {
    const campo = e.currentTarget
    const tecleado = e instanceof InputEvent ? e.data : null
    // Al escribir de corrido se agregan las diagonales: 15 → 15/ → 15/03/
    if (
      tecleado &&
      /^\d$/.test(tecleado) &&
      campo.selectionStart === campo.value.length &&
      /^(\d{2}|\d{1,2}\/\d{2})$/.test(campo.value)
    ) {
      campo.value += '/'
    }
    texto = campo.value
    const iso = interpretarFecha(texto)
    emitido = iso ?? ''
    valor = emitido
    malFormada = texto.trim() !== '' && iso === null
  }

  function alSalir() {
    const iso = interpretarFecha(texto)
    if (iso) texto = formatoNumerico(iso)
    onblur?.()
  }
</script>

<input
  {id}
  class="control tabular campo-fecha"
  type="text"
  inputmode="numeric"
  autocomplete="off"
  placeholder="dd/mm/aaaa"
  maxlength="10"
  value={texto}
  oninput={alEscribir}
  onblur={alSalir}
  required={requerido}
  aria-invalid={invalido}
  aria-describedby={describedby}
/>

<style>
  .campo-fecha {
    max-width: 10.5rem;
    letter-spacing: 0.02em;
  }
</style>
