<script lang="ts">
  import { DatabaseBackup, Monitor, Moon, Sun, UserRoundPlus, UsersRound } from '@lucide/svelte'
  import { router } from '../lib/router.svelte'
  import { href, rutas } from '../lib/rutas'
  import { tema } from '../lib/tema.svelte'
  import Logo from './Logo.svelte'

  const seccion = $derived(
    router.ruta.nombre === 'respaldo' ? 'respaldo' : router.ruta.nombre === 'nuevo' ? 'nuevo' : 'pacientes',
  )

  const textoTema = $derived(
    { auto: 'Tema automático', claro: 'Tema claro', oscuro: 'Tema oscuro' }[tema.valor],
  )
</script>

<header class="encabezado no-imprimir">
  <div class="interior">
    <a class="marca" href={href(rutas.inicio())} aria-label="Oculorum, inicio">
      <Logo />
      <span class="nombre">Oculorum</span>
      <span class="producto">Expedientes</span>
    </a>

    <nav aria-label="Principal">
      <a href={href(rutas.inicio())} class:actual={seccion === 'pacientes'} aria-current={seccion === 'pacientes' ? 'page' : undefined}>
        <UsersRound size={17} />
        <span>Pacientes</span>
      </a>
      <a href={href(rutas.respaldo())} class:actual={seccion === 'respaldo'} aria-current={seccion === 'respaldo' ? 'page' : undefined}>
        <DatabaseBackup size={17} />
        <span>Respaldo</span>
      </a>
    </nav>

    <div class="derecha">
      <button type="button" class="btn btn-fantasma btn-icono" onclick={() => tema.alternar()} title={textoTema} aria-label="{textoTema}. Cambiar tema">
        {#if tema.valor === 'claro'}<Sun size={18} />{:else if tema.valor === 'oscuro'}<Moon size={18} />{:else}<Monitor size={18} />{/if}
      </button>
      <a class="btn btn-primario nuevo" href={href(rutas.nuevo())} aria-current={seccion === 'nuevo' ? 'page' : undefined}>
        <UserRoundPlus size={18} />
        <span>Nuevo expediente</span>
      </a>
    </div>
  </div>
</header>

<style>
  .encabezado {
    position: sticky;
    top: 0;
    z-index: 20;
    height: var(--alto-encabezado);
    border-bottom: 1px solid var(--borde);
    background: color-mix(in srgb, var(--superficie) 92%, transparent);
    backdrop-filter: saturate(1.4) blur(12px);
  }

  .interior {
    display: flex;
    align-items: center;
    gap: 28px;
    max-width: 1080px;
    height: 100%;
    margin: 0 auto;
    padding: 0 24px;
  }

  .marca {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--texto);
    text-decoration: none;
  }

  .marca:hover {
    text-decoration: none;
  }

  .nombre {
    font-size: 1.0625rem;
    font-weight: 700;
    letter-spacing: -0.015em;
  }

  .producto {
    padding-left: 10px;
    border-left: 1px solid var(--borde-fuerte);
    font-size: 0.875rem;
    color: var(--texto-3);
  }

  nav {
    display: flex;
    gap: 4px;
  }

  nav a {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 36px;
    padding: 0 12px;
    border-radius: var(--r);
    color: var(--texto-2);
    font-size: 0.9rem;
    font-weight: 550;
    text-decoration: none;
  }

  nav a:hover {
    background: var(--superficie-3);
    color: var(--texto);
  }

  nav a.actual {
    background: var(--primario-suave);
    color: var(--primario-tinta);
  }

  .derecha {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  @media (max-width: 900px) {
    .producto {
      display: none;
    }
  }

  @media (max-width: 760px) {
    .interior {
      gap: 8px;
      padding: 0 12px 0 16px;
    }

    /* Solo íconos, pero el texto sigue disponible para lectores de pantalla. */
    nav a span,
    .nuevo span {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    nav a {
      width: 40px;
      justify-content: center;
      padding: 0;
    }

    .nuevo {
      width: 40px;
      padding: 0;
    }
  }

  @media (max-width: 380px) {
    .nombre {
      display: none;
    }
  }
</style>
