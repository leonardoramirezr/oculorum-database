<script lang="ts">
  import { numeroDeId } from '../lib/ids'
  import { iniciales } from '../lib/texto'
  import type { Paciente } from '../lib/tipos'

  interface Props {
    paciente: Paciente
    tamano?: 'chico' | 'normal' | 'grande'
  }

  let { paciente, tamano = 'normal' }: Props = $props()

  // Un tono estable por expediente ayuda a distinguir pacientes en las listas.
  const TONOS = [186, 212, 258, 28, 338, 152]
  const tono = $derived(TONOS[numeroDeId(paciente.id) % TONOS.length])
</script>

<span class="avatar {tamano}" style:--tono={tono} aria-hidden="true">{iniciales(paciente)}</span>

<style>
  .avatar {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: hsl(var(--tono) 52% var(--avatar-fondo));
    color: hsl(var(--tono) 55% var(--avatar-texto));
    font-size: 0.875rem;
    font-weight: 650;
    letter-spacing: 0.02em;
  }

  .chico {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }

  .grande {
    width: 60px;
    height: 60px;
    font-size: 1.25rem;
  }
</style>
