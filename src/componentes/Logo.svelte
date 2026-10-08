<script lang="ts">
  let { tamano = 32 }: { tamano?: number } = $props()
</script>

<svg width={tamano} height={tamano} viewBox="0 0 32 32" aria-hidden="true">
  <rect width="32" height="32" rx="9" fill="var(--primario)" />
  <path d="M4.5 16c3.1-5.2 6.9-7.8 11.5-7.8S24.4 10.8 27.5 16c-3.1 5.2-6.9 7.8-11.5 7.8S7.6 21.2 4.5 16Z" fill="var(--sobre-primario)" />
  <circle cx="16" cy="16" r="4.8" fill="var(--primario)" />
  <circle cx="17.7" cy="14.3" r="1.5" fill="var(--sobre-primario)" />
</svg>
