# Portfolio · Jon Nieto

Prácticas de despliegue seguro de aplicaciones web, contadas como portfolio
estático: HTML, CSS y JavaScript sin dependencias ni framework.

## Cómo abrirlo

**Doble clic en `index.html`.** No hace falta servidor ni instalar nada.

## Después de editar contenido

El navegador no puede leer los `.md` de `content/` cuando la página se abre
como fichero local (`file://`), así que hay un paso de generación:

```bash
node scripts/build.mjs          # una vez
node scripts/build.mjs --watch  # mientras escribes, regenera al guardar
```

El script hace tres cosas y es idempotente:

1. **Extrae las imágenes.** Los `.md` traían cada captura incrustada como
   base64 (2,5 MB en total). Las escribe como PNG en `assets/img/<slug>/`.
2. **Limpia los `.md`.** Sustituye cada `data:image/png;base64,…` por
   `[imageN]: ../assets/img/<slug>/imageN.png`. Los `.md` siguen siendo
   markdown válido y se ven bien en el editor.
3. **Escribe `assets/js/datos.js`** con el texto de los proyectos y sus
   metadatos, que es lo que leen las páginas.

Los `.md` son la única fuente de verdad. Para añadir un proyecto: copia un
fichero en `content/`, escribe el markdown, y ejecuta el script.

## Estructura

```
index.html              portada: perfil y grid de proyectos
proyecto.html           detalle, enruta por ?id=<slug>
perfil.json            tu nombre, alias, rol y resumen
scripts/build.mjs       extracción de imágenes + generación de datos
content/*.md            el contenido (única fuente de verdad)
assets/css/styles.css   sistema de diseño "mono"
assets/js/
  datos.js              GENERADO por build.mjs
  markdown.js           parser de Markdown propio
  app.js                portada: tarjetas y filtro
  detalle.js            detalle: índice, copiado, lightbox, navegación
assets/img/<slug>/      capturas extraídas de los .md
```

## Metadatos de cada proyecto

Se derivan del propio archivo, sin tocar el markdown:

| Dato | De dónde sale |
|---|---|
| slug | nombre del fichero: `Ariketa_5.1.1-JonNieto.md` → `ariketa-5-1-1-jon-nieto` |
| título | el `#` de nivel 1; si no hay, las negritas del principio; si no, el nombre del fichero |
| extracto | los primeros ~175 caracteres del cuerpo, sin markdown |

Si algún día quieres controlarlos a mano, añade un bloque al principio del
`.md`. Si está, el build lo respeta:

```markdown
---
title: Mi proyecto
description: Una frase para la tarjeta y para el enlace al compartirlo.
tags: git, docker
order: 1
---
```

## Decisiones técnicas

**Sin `fetch()` a propósito.** En GitHub Pages funcionaría, pero entonces la
web dejaría de abrirse con doble clic. Con `datos.js` funciona en los dos
entornos y offline.

**Scripts clásicos, no módulos ES.** Los módulos están bloqueados por CORS en
`file://`. Todos van con `defer`, que conserva el orden de ejecución.

**Rutas siempre relativas.** `assets/…`, nunca `/assets/…`. En Pages un
proyecto se sirve en `usuario.github.io/repo/`, y una ruta absoluta apuntaría
a la raíz del dominio y daría 404.

**Parser de Markdown propio** (`markdown.js`) en lugar de una librería:
no hay `npm` en la máquina y el subconjunto usado por estos archivos está
muy acotado. Cubre títulos, listas anidadas, tablas, citas, bloques de código,
imágenes y enlaces por referencia. El HTML crudo se escapa siempre: el
proyecto de la web vulnerable incluye un `<script>` que no debe ejecutarse.

**`.nojekyll`** para que GitHub Pages no pase los ficheros por Jekyll.

**Solo se cargan los pesos 400 y 700** de Space Mono y JetBrains Mono, aunque
`DESIGN.md` liste nueve. Ninguna regla usa los otros siete y cargar peso
suficiente para todo ellos duplicaría la descarga de las fuentes.

## Qué se ha verificado

Con Firefox headless sobre las páginas reales, no a ojo:

- 93 de 93 imágenes cargan; ninguna ruta rota en el HTML ni en los `.md`.
- El filtro de la portada encuentra 1 de 5 con `docker` y avisa cuando no
  coincide con nada.
- El índice lateral apunta a secciones que existen, hace scroll y marca la
  sección activa; el lightbox abre, cierra y devuelve el foco.
- `←` y `→` navegan entre proyectos.
- Ningún control interactivo sin nombre accesible; ninguno por debajo de 24px.
- El `<script>` del proyecto de la web vulnerable sale escapado y no se ejecuta.
- Una sola etiqueta `h1` por página.

Lo que **no** se ha podido comprobar en headless: el aspectoreal (no hay forma
de mirar la captura) y el copiado con un clic de verdad — los clics sintéticos
no activan el portapapeles, así que solo se ha verificado el camino de error,
que selecciona el código y avisa de que se pulse `Ctrl+C`.

## Accesibilidad

- WCAG 2.2 AA. Los ocho tokens de color de `DESIGN.md` superan 4,5:1 sobre el
  fondo `#0C0A09`; la tabla está al final de `styles.css`.
- **Excepción documentada:** el token `text` (`#78716B`) da 4,11:1 sobre
  `#0C0A09` y 3,82:1 sobre `#E7E5E4`, así que no se usa como color de texto;
  en su lugar, `#E7E5E4` (15,73:1) y `#A8A29E` (7,83:1). `SKILL.md` pide
  priorizar la accesibilidad cuando choca con la estética.
- Tema oscuro único. `prefers-reduced-motion` respetado.
- Navegación completa por teclado. Las imágenes se abren con `Enter` o
  `Espacio` y el lightbox devuelve el foco al cerrarse.
- `←` y `→` saltan al proyecto anterior y siguiente.
- Un solo `h1` por página: el título que el `.md` repetía como `#` se elimina
  del cuerpo, y los títulos internos bajan un nivel.

### Áreas táctiles

Medido en el navegador, no estimado:

| Control | Alto |
|---|---|
| Navegación, botones, buscador, marca, "volver", enlaces anterior/siguiente | 44px |
| Enlaces del índice lateral | 36px |
| Botón "copiar" de cada bloque de código | 36px |

El mínimo de WCAG 2.2 AA (2.5.8) es 24×24: nada baja de ahí. Los 44px son la
guía táctil de Apple y se aplican a los controles principales. El botón
"copiar" se queda en 36px porque se repite hasta 23 veces en un artículo y
44px engordaría cada barra de código sin ganar accesibilidad real.

### Estados implementados

`SKILL.md` pide estados explícitos. Cada uno tiene su sitio:

| Estado | Dónde |
|---|---|
| por defecto / hover / focus-visible / active | todos los botones, enlaces y tarjetas |
| deshabilitado | `.boton:disabled` y `[aria-disabled]` |
| cargando | `.esqueleto` + `aria-busy` en la rejilla |
| vacío | `.pista--vacia` cuando el filtro no coincide con nada |
| error | `.pista--error` si falta `datos.js` o el proyecto no existe |

### Contraste sobre `#0C0A09`

| Color | Ratio |
|---|---|
| `#E7E5E4` texto | 15,73:1 |
| `#A8A29E` texto apagado | 7,83:1 |
| `#FF3B30` primary | 5,57:1 |
| `#00A6F4` secondary | 7,30:1 |
| `#00A63D` success | 6,14:1 |
| `#FE9900` warning | 9,19:1 |
| `#BE123C` danger (bordes) | 3,14:1 |
| `#FF4D6D` danger (texto) | 6,15:1 |

## Publicar en GitHub Pages

1. Sube el repositorio (el contenido ya está limpio: los `.md` pasaron de
   2,5 MB a 36 KB y las 93 capturas están sueltas en `assets/img/`).
2. **Settings → Pages → Source: Deploy from a branch**, rama `main`, carpeta
   `/ (root)`.
3. La URL quedará en `https://<usuario>.github.io/<repo>/`.

Nada más que configurar: no hay paso de compilación en el despliegue.

### Pendiente opcional

Las etiquetas Open Graph no llevan `og:image`. Si quieres que el enlace se
comparta con una imagen, añade un PNG de 1200×630 y dos líneas en la cabecera
de `index.html` y `proyecto.html`.

## Detalles de los ejercicios

Los `.md` vienen de una conversión de Word, así que hay listas con marcadores
mixtos (`•`, `◦`) e imágenes con sangría irregular. El parser los acepta y
agrupa el anidamiento por sangría, con un salto de nivel máximo de uno por
nivel. Lo que no se puede adivinar es la intención: si un sub-apartado queda
anidado donde no tocaba, seCorrige en el `.md` original.