# Oculorum · Expedientes clínicos

Aplicación web para llevar los expedientes clínicos de un consultorio de optometría: se abre el
expediente del paciente con un número consecutivo, se le busca en sus siguientes visitas y se
registra la historia clínica de cada consulta. Está hecha con [Svelte](https://svelte.dev) y se
publica como sitio estático en GitHub Pages.

Dirección, una vez publicada: <https://leonardoramirezr.github.io/oculorum-database/>

## Qué hace

- **Apertura de expediente.** Nombre(s), apellido paterno, apellido materno, fecha de nacimiento
  (calcula la edad), teléfono y domicilio. Al guardar se asigna un número consecutivo: 0001, 0002…
  Si ya existe alguien con el mismo nombre, lo avisa para no duplicar expedientes.
- **Búsqueda.** Por nombre (sin importar acentos ni mayúsculas), por número de expediente
  («12», «0012», «exp 12») o por teléfono. Si no hay resultados, ofrece abrir un expediente nuevo
  con el nombre buscado.
- **Historia clínica por consulta**, en seis secciones:
  1. Motivo de consulta y antecedentes (anamnesis)
  2. Agudeza visual: OD, OI, OU y observaciones
  3. Lensometría: OD y OI en notación esfera = cilindro × eje, o «no usa lentes»
  4. Refracción subjetiva: esfera = cilindro × eje, ADD, prisma, base y AV por ojo
  5. Exploración física
  6. Diagnóstico y tratamiento
- **Expediente del paciente** con su última graduación a la vista y el historial de consultas.
- **Impresión** de cada consulta en hoja carta, con membrete y línea de firma.
- **Respaldo**: descarga y restauración de todos los datos en un archivo.

## Captura rápida

- Los valores se escriben como en la receta y se acomodan solos: `-125` → −1.25, `1.5` → +1.50,
  eje `0` → 180. Con <kbd>↑</kbd> <kbd>↓</kbd> se ajustan de 0.25 en 0.25 (el eje de 5° en 5°).
- En agudeza visual basta el denominador: `40` → 20/40. También acepta CD, MM, PL y NPL.
- <kbd>Enter</kbd> pasa al siguiente campo y <kbd>Ctrl</kbd>+<kbd>S</kbd> guarda la consulta.
- La ADD de OD se copia a OI. En celulares y tabletas hay un botón ± para el signo.
- Botones para traer los antecedentes de la consulta anterior, copiar la refracción anterior a la
  lensometría y partir de la lensometría al refraccionar.
- Sugerencias de un toque para la anamnesis, la exploración, el diagnóstico y el tratamiento.
- Advertencias que no bloquean: cilindro sin eje, valores fuera de pasos de 0.25 o fuera de rango.
- Mientras se captura se guarda un borrador; si se cierra la pestaña, la consulta se recupera.

## Dónde se guardan los datos

Los expedientes se guardan **solo en el navegador donde se capturan** (IndexedDB). No se envían a
ningún servidor ni al repositorio, así que nadie más los ve aunque el sitio sea público. A cambio:

- Cada navegador y cada dispositivo tiene sus propios datos; no se sincronizan entre sí.
- Si se borran los «datos de sitios» del navegador, se borran los expedientes.
- Por eso la sección **Respaldo** descarga un archivo con todo, y la pantalla de inicio recuerda
  hacerlo si pasó más de una semana. El archivo contiene datos personales y de salud: hay que
  guardarlo en un lugar seguro.

Todo el acceso a datos está en `src/lib/db.ts`; si más adelante se necesita usar la aplicación en
varios equipos a la vez, ese es el módulo que se reemplazaría por un servidor o base de datos en
línea.

## Desarrollo

Requiere Node.js 22.

```sh
npm install
npm run dev      # servidor local con recarga en vivo
npm run check    # revisión de tipos (svelte-check)
npm test         # pruebas de la lógica (Vitest)
npm run build    # versión de producción en dist/
```

## Publicar en GitHub Pages

1. En el repositorio, ve a **Settings → Pages → Build and deployment** y en **Source** elige
   **GitHub Actions**.
2. Cada cambio que llegue a `main` se revisa, se prueba y se publica con el flujo
   `.github/workflows/pages.yml`. También se puede lanzar a mano desde la pestaña **Actions**.

La aplicación usa rutas con `#` (`#/expediente/0001`), así que funciona en GitHub Pages sin
configuración adicional.

## Estructura

```
src/
  vistas/        pantallas: inicio, expediente, formulario de paciente, consulta, respaldo
  componentes/   piezas reutilizables: tabla de graduación, campos, índice de secciones…
  lib/           datos (IndexedDB), búsqueda, fechas, notación optométrica, rutas
  app.css        colores, tipografía y estilos base (tema claro, oscuro e impresión)
```
