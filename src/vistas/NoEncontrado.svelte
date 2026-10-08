<script lang="ts">
  import { ArrowLeft, SearchX } from '@lucide/svelte'
  import Vacio from '../componentes/Vacio.svelte'
  import { href, rutas } from '../lib/rutas'

  interface Props {
    titulo?: string
    texto?: string
  }

  let {
    titulo = 'No encontramos esta página',
    texto = 'Puede que el enlace esté incompleto o que el registro se haya eliminado.',
  }: Props = $props()
</script>

<div class="pagina angosta">
  <div class="tarjeta">
    <Vacio {titulo} {texto}>
      {#snippet icono()}<SearchX size={26} />{/snippet}
      <a class="btn btn-secundario" href={href(rutas.inicio())}><ArrowLeft size={18} /> Ir a pacientes</a>
    </Vacio>
  </div>
</div>
