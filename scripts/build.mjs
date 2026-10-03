#!/usr/bin/env node
/**
 * build.mjs — Genera los datos del portfolio. Sin dependencias, sin npm.
 *
 *   node scripts/build.mjs            genera una vez
 *   node scripts/build.mjs --watch    regenera al guardar un .md
 *
 * Tres fases:
 *   1. IMÁGENES  extrae los data URI base64 a assets/img/<slug>/*.png
 *   2. LIMPIEZA  reescribe los .md con la ruta relativa a la imagen
 *   3. PAQUETE   escribe assets/js/datos.js con el texto de los .md
 *
 * La fase 3 existe porque el navegador no puede leer content/*.md desde
 * file:// (doble clic en index.html). En GitHub Pages no haría falta,
 * pero así el portfolio funciona en los dos entornos.
 *
 * Es idempotente: las fases 1 y 2 solo tocan los .md que tengan data URI.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR_CONTENT = path.join(RAIZ, 'content');
const DIR_IMG = path.join(RAIZ, 'assets', 'img');
const DIR_JS = path.join(RAIZ, 'assets', 'js');
const SALIDA_DATOS = path.join(DIR_JS, 'datos.js');

const WATCH = process.argv.includes('--watch');

/* ───────────────────────── utilidades ───────────────────────── */

const sinAcentos = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const EXTENSIONES = /\.(md|markdown|docx|doc|txt)$/i;

/** Ariketa_5.1.3.docx.md → Ariketa_5.1.3 (puede tener varias porpostas). */
function quitarExtensiones(s) {
  let out = s;
  for (let i = 0; i < 4; i += 1) {
    const siguiente = out.replace(EXTENSIONES, '');
    if (siguiente === out) break;
    out = siguiente;
  }
  return out;
}

const slugify = (s) =>
  sinAcentos(quitarExtensiones(s))
    .replace(/([a-z])([A-Z])/g, '$1-$2') // JonNieto → Jon-Nieto
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const RECORTAR_PALABRAS = { de: 1, del: 1, la: 1, el: 1, los: 1, y: 1, en: 1, con: 1, para: 1, a: 1 };

function tituloDesdeNombre(nombreArchivo) {
  const base = quitarExtensiones(nombreArchivo);
  return base
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((palabra, i) => {
      if (i > 0 && RECORTAR_PALABRAS[palabra.toLowerCase()]) return palabra.toLowerCase();
      return capitalizar(palabra);
    })
    .join(' ');
}

function log(...args) {
  console.log(...args);
}

/* ───────────────────── 1 y 2: imágenes + limpieza ───────────────────── */

// Una definición de referencia: [image1]: <data:image/png;base64,....>
const RE_DEFICION_BASE64 = /^\[([^\]\s]+)\]:\s*<data:image\/([a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)>\s*$/i;

function extraerYLimpiar(archivo, slug) {
  const lineas = fs.readFileSync(archivo, 'utf8').replace(/\r\n/g, '\n').split('\n');

  let destino = null;
  let extraidas = 0;
  const salida = [];
  let dentroDeCerco = false;

  for (const linea of lineas) {
    if (/^ {0,3}(`{3,}|~{3,})/.test(linea)) dentroDeCerco = !dentroDeCerco;

    const m = !dentroDeCerco && RE_DEFICION_BASE64.exec(linea);
    if (!m) {
      salida.push(linea);
      continue;
    }

    const [, etiqueta, ext, base64] = m;
    const nombre = `${slugify(etiqueta) || 'imagen'}.${ext === 'jpeg' ? 'jpg' : ext}`;
    if (!destino) {
      destino = path.join(DIR_IMG, slug);
      fs.mkdirSync(destino, { recursive: true });
    }
    fs.writeFileSync(path.join(destino, nombre), Buffer.from(base64, 'base64'));
    // Relativa al propio .md, para que siga siendo markdown válido en el editor.
    salida.push(`[${etiqueta}]: ../assets/img/${slug}/${nombre}`);
    extraidas += 1;
  }

  if (extraidas === 0) return { extraidas: 0 };
  fs.writeFileSync(archivo, salida.join('\n'), 'utf8');
  return { extraidas };
}

/* ───────────────────────── 3: metadatos y paquete ───────────────────────── */

/** Lee un frontmatter opcional (--- title: ... ---). Si no existe, devuelve {}. */
function leerFrontmatter(lineas) {
  if (lineas[0]?.trim() !== '---') return { datos: {}, cuerpo: lineas };
  const cierre = lineas.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (cierre === -1) return { datos: {}, cuerpo: lineas };
  const datos = {};
  for (const linea of lineas.slice(1, cierre)) {
    const m = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(linea);
    if (!m) continue;
    const clave = m[1].toLowerCase();
    let valor = m[2].trim().replace(/^["']|["']$/g, '');
    if (clave === 'tags') valor = valor ? valor.split(',').map((t) => t.trim()).filter(Boolean) : [];
    datos[clave] = valor;
  }
  return { datos, cuerpo: lineas.slice(cierre + 1) };
}

/** Título: frontmatter → h1 → negritas iniciales → nombre del archivo. */
function derivarTitulo(lineas, frontmatter, nombreArchivo) {
  if (frontmatter.title) return { titulo: frontmatter.title, quitaCabecera: 0 };

  // Solo un h1 de nivel 1 da título: un "## Instalación Docker" es una sección, no el nombre.
  const iHeading = lineas.findIndex((l) => /^ {0,3}#\s+\S/.test(l));
  if (iHeading !== -1) {
    return {
      titulo: lineas[iHeading].replace(/^ {0,3}#\s+/, '').replace(/[*_`]/g, '').trim(),
      quitaCabecera: iHeading + 1, // el h1 del .md lo sustituye el h1 de la página
    };
  }

  // Negritas al principio del documento: "**GIT Ariketa 5.1.4**" + "**RETO COLABORATIVO**".
  // Los huecos entre ellas se ignoran; para en el primer texto normal.
  const negritas = [];
  let fin = 0;
  for (let i = 0; i < lineas.length; i += 1) {
    const linea = lineas[i];
    if (!linea.trim()) continue;
    const m = /^\s*\*\*(.+?)\*\*\s*$/.exec(linea);
    if (!m) break;
    negritas.push(m[1].trim());
    fin = i + 1;
  }
  if (negritas.length) return { titulo: negritas.join(' — '), quitaCabecera: fin };

  return { titulo: tituloDesdeNombre(nombreArchivo), quitaCabecera: 0 };
}

/** Extracto: texto plano del cuerpo, sin imágenes ni código, cortado en un límite de palabra. */
function derivarExtracto(lineas, max = 175) {
  const plano = [];
  let dentro = false;
  for (const linea of lineas) {
    if (/^ {0,3}(`{3,}|~{3,})/.test(linea)) {
      dentro = !dentro;
      continue;
    }
    if (dentro) continue;
    let l = linea
      .replace(/^\s{0,3}(#{1,6})\s+/, '')
      .replace(/^\s*>\s?/, '')
      .replace(/^\s*([-*+•◦]|\d+[.)])\s+/, '')
      .replace(/!\[[^\]]*\]\[[^\]]*\]/g, ' ') // imágenes
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[\[([^\]]*)\]\]/g, '$1')
      .replace(/[`*_~|]/g, '')
      .replace(/\\([\\`*_{}\[\]()#+\-.!|~<>])/g, '$1')
      .trim();
    if (l) plano.push(l);
  }
  const texto = plano.join(' ');
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  return `${corte.slice(0, Math.max(corte.lastIndexOf(' '), Math.floor(max * 0.6))).trimEnd()}…`;
}

/* ───────────────────────── orquestación ───────────────────────── */

function construir() {
  const inicio = Date.now();
  fs.mkdirSync(DIR_IMG, { recursive: true });
  fs.mkdirSync(DIR_JS, { recursive: true });

  const archivos = fs
    .readdirSync(DIR_CONTENT)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'es'));

  if (archivos.length === 0) {
    console.error('✗ No hay ningún .md en content/. Nada que generar.');
    process.exitCode = 1;
    return;
  }

  let imagenesTotales = 0;
  const proyectos = [];

  for (const archivo of archivos) {
    const ruta = path.join(DIR_CONTENT, archivo);
    const slug = slugify(archivo);

    const { extraidas } = extraerYLimpiar(ruta, slug);
    if (extraidas > 0) {
      log(`  · ${archivo}: ${extraidas} imágenes extraídas a assets/img/${slug}/ y .md limpiado`);
      imagenesTotales += extraidas;
    }

    const bruto = fs.readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n');
    const { datos: fm, cuerpo } = leerFrontmatter(bruto.split('\n'));
    const { titulo, quitaCabecera } = derivarTitulo(cuerpo, fm, archivo);

    // El título ya lo pinta la página como h1: se quita del cuerpo del artículo.
    let lineas = cuerpo.slice(quitaCabecera);
    while (lineas.length && (!lineas[0].trim() || /^ {0,3}#{1,6}\s*$/.test(lineas[0]))) {
      lineas = lineas.slice(1); // huecos y encabezados vacíos que deja la conversión
    }

    const cuerpoTexto = lineas.join('\n').replace(/\s+$/, '');
    const extracto = derivarExtracto(lineas);
    const descripcion = fm.description || extracto;

    proyectos.push({
      slug,
      titulo,
      extracto,
      descripcion,
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      orden: fm.order !== undefined ? Number(fm.order) : null,
      md: cuerpoTexto,
    });
  }

  proyectos.sort((a, b) => {
    if (a.orden !== null && b.orden !== null) return a.orden - b.orden;
    if (a.orden !== null) return -1;
    if (b.orden !== null) return 1;
    return a.titulo.localeCompare(b.titulo, 'es');
  });

  let perfil = {};
  const rutaPerfil = path.join(RAIZ, 'perfil.json');
  if (fs.existsSync(rutaPerfil)) {
    try {
      perfil = JSON.parse(fs.readFileSync(rutaPerfil, 'utf8'));
    } catch (err) {
      console.error(`✗ perfil.json no es un JSON válido: ${err.message}`);
      process.exitCode = 1;
    }
  }

  const datos = {
    generado: new Date().toISOString(),
    perfil,
    proyectos: proyectos.map(({ md, ...resto }) => resto),
    contenido: proyectos.map((p) => p.md),
  };

  const cabecera = `/* datos.js — GENERADO POR scripts/build.mjs. No editar a mano.
 * Regenerar:  node scripts/build.mjs        (o con --watch mientras escribes)
 * Contiene el texto de los .md de content/ porque el navegador no puede
 * leerlos desde file://. En GitHub Pages no haría falta, pero así el
 * portfolio funciona con doble clic y también desplegado.
 */
`;

  fs.writeFileSync(
    SALIDA_DATOS,
    `${cabecera}window.PF_DATOS = ${JSON.stringify(datos, null, 0)};\n`,
    'utf8'
  );

  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  log('');
  log(`✓ ${proyectos.length} proyectos · ${imagenesTotales} imágenes nuevas · datos.js ${kb(fs.statSync(SALIDA_DATOS).size)}`);
  for (const p of proyectos) {
    log(`    ${p.slug.padEnd(30)} ${p.titulo}`);
  }
  log(`  ${Date.now() - inicio} ms\n`);
}

construir();

if (WATCH) {
  log('👀 Vigilando content/ y perfil.json. Ctrl+C para parar.\n');
  let pendiente = null;
  for (const dir of [DIR_CONTENT, RAIZ]) {
    fs.watch(dir, { persistent: true }, (_event, nombre) => {
      if (!nombre) return;
      if (dir === RAIZ && !String(nombre).endsWith('perfil.json')) return;
      clearTimeout(pendiente);
      pendiente = setTimeout(() => {
        try {
          construir();
        } catch (err) {
          console.error(`✗ ${err.message}`);
        }
      }, 120);
    });
  }
}