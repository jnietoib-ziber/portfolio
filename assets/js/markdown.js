/**
 * markdown.js — Parser de Markdown en el navegador, sin librerías.
 *
 *   PF.markdown.toHTML(md, opciones) → { html, indice }
 *
 * Cubre el subconjunto que usan los .md de content/:
 *   títulos, párrafos, salto forzado, listas anidadas, blockquote, regla,
 *   tablas GFM, bloques de código, imágenes y enlaces por referencia.
 *
 * Decisiones deliberadas:
 *   · El HTML crudo se escapa siempre. Un .md puede contener <script>
 *     (el de la web vulnerable) y no debe ejecutarse nunca.
 *   · Las rutas de imagen empiezan por "../" porque son relativas al .md;
 *     aquí se quitan para que resuelvan contra la raíz del sitio, donde
 *     viven los HTML. Así funciona con doble clic y en GitHub Pages.
 *   · shiftHeadings baja los títulos un nivel porque la página ya pone su h1.
 */
(function (global) {
  'use strict';

  var PF = (global.PF = global.PF || {});

  // Marcadores internos para apartar fragmentos antes de transformar el texto.
  var COD = String.fromCharCode(0);
  var ESC = String.fromCharCode(1);

  /* ───────────────────────────── utilidades ───────────────────────────── */

  function escaparHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sinEspaciosExtremos(s) {
    return String(s).replace(/^[ \t]+|[ \t]+$/g, '');
  }

  function sangria(linea) {
    return (/^[ \t]*/.exec(String(linea))[0]).length;
  }

  function sinAcentos(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function ancla(texto) {
    return (
      sinAcentos(texto)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'sec'
    );
  }

  function textoPlano(md) {
    return sinAcentos(
      String(md)
        .replace(/`+([^`]*)`+/g, '$1')
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/!?\[([^\]]*)\]\[[^\]]*\]/g, '$1')
        .replace(/\\([\\`*_{}[\]()#+\-.!|~<>])/g, '$1')
        .replace(/[*_~#>]/g, '')
    )
      .replace(/\s+/g, ' ')
      .trim();
  }

  function recortar(s, n) {
    if (s.length <= n) return s;
    var corte = s.slice(0, n);
    var cortePalabra = corte.lastIndexOf(' ');
    return (cortePalabra > n * 0.5 ? corte.slice(0, cortePalabra) : corte).trim() + '…';
  }

  /* ───────────────────── referencias e imágenes ───────────────────── */

  var RE_DEF = /^\[([^\]\s]+)\]:\s*(?:<([^>]*)>|(\S+?))(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?\s*$/;

  /** Saca las definiciones [imageN]: ... del texto, respetando los bloques de código. */
  function extraerReferencias(lineas, ctx) {
    var salida = [];
    var dentro = false;

    for (var i = 0; i < lineas.length; i += 1) {
      var linea = lineas[i];
      if (RE_CERCA.test(linea)) dentro = !dentro;

      var m = dentro ? null : RE_DEF.exec(linea);
      if (!m) {
        salida.push(linea);
        continue;
      }
      ctx.refs[m[1].toLowerCase()] = {
        url: m[2] !== undefined ? m[2] : m[3],
        titulo: m[4] || m[5] || m[6] || '',
      };
    }
    return salida;
  }

  /** "../assets/img/x.png" → "assets/img/x.png". Las URLs externas no se tocan. */
  function rutaSitio(url) {
    var limpio = String(url == null ? '' : url).trim();
    if (/^(https?:|data:|mailto:|#|\/)/i.test(limpio)) return limpio;
    return limpio.replace(/^(\.\.\/)+/, '');
  }

  function tagImagen(ctx, alt, destino, titulo) {
    var definicion = destino ? ctx.refs[String(destino).toLowerCase()] : null;
    var url = definicion ? definicion.url : destino;
    if (!url) return '';
    var pie = titulo || (definicion && definicion.titulo) || '';
    var etiqueta = sinEspaciosExtremos(alt || '') || ctx.altPorDefecto || '';

    var img =
      '<img class="md-img" src="' + escaparHtml(rutaSitio(url)) + '"' +
      ' alt="' + escaparHtml(etiqueta) + '" loading="lazy" decoding="async">';

    if (pie) {
      return (
        '<figure class="md-figure">' + img +
        '<figcaption class="md-figcaption">' + inline(pie, ctx) + '</figcaption></figure>'
      );
    }
    return img;
  }

  function tagEnlace(ctx, texto, destino, titulo) {
    var url = sinEspaciosExtremos(destino || '');
    var dentro = url.charAt(0) === '#';
    var atributos = ' href="' + escaparHtml(url) + '"';
    if (titulo) atributos += ' title="' + escaparHtml(titulo) + '"';
    if (!dentro && !/^(https?:|mailto:)/i.test(url)) atributos += ' rel="noopener"';
    return '<a class="md-a"' + atributos + '>' + inline(texto, ctx) + '</a>';
  }

  /* ─────────────────────── markdown en línea ─────────────────────── */

  /**
   * El orden importa: escapes → código inline → escapar HTML → enlaces e
   * imágenes → énfasis → restaurar marcadores.
   */
  function inline(texto, ctx) {
    var codigo = [];
    var escapes = [];
    var s = String(texto == null ? '' : texto);

    // 1. Escapes con backslash: se apartan antes de que nada los toque.
    s = s.replace(/\\([\\`*_{}[\]()#+\-.!|~<>])/g, function (m, c) {
      escapes.push(c);
      return ESC + escapes.length + ESC;
    });

    // 2. Código inline. Puede contener < > &, así que se aísla antes de escapar.
    s = s.replace(/(`+)([\s\S]*?)\1/g, function (m, ticks, code) {
      codigo.push(codigo.length ? code : sinEspaciosExtremos(code));
      return COD + codigo.length + COD;
    });

    // 3. A partir de aquí, el HTML del .md es texto, nunca marcado.
    s = escaparHtml(s);

    // 4. Imágenes y enlaces: por referencia y en línea.
    s = s.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, function (m, alt, ref) {
      return tagImagen(ctx, alt, ref || alt);
    });
    s = s.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g, function (m, alt, url, titulo) {
      return tagImagen(ctx, alt, url, titulo);
    });
    s = s.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, function (m, txt, ref) {
      var definicion = ctx.refs[sinEspaciosExtremos(ref).toLowerCase()];
      return definicion ? tagEnlace(ctx, txt, definicion.url, definicion.titulo) : m;
    });
    s = s.replace(/\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g, function (m, txt, url, titulo) {
      return tagEnlace(ctx, txt, url, titulo);
    });

    // 5. Autolinks <https://...>
    s = s.replace(/&lt;((?:https?:\/\/|mailto:)[^\s&]+)&gt;/g, function (m, url) {
      return tagEnlace(ctx, url, url);
    });

    // 6. Énfasis. Lo que no envuelve texto se deja como está.
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^\w*])\*([^*\n]+?)\*(?![\w*])/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^\w_])_([^_\n]+?)_(?![\w_])/g, '$1<em>$2</em>');
    s = s.replace(/~~([\s\S]+?)~~/g, '<del>$1</del>');

    // 7. Se restauran los marcadores.
    s = s.replace(new RegExp(ESC + '(\\d+)' + ESC, 'g'), function (m, i) {
      return escaparHtml(escapes[Number(i) - 1]);
    });
    s = s.replace(new RegExp(COD + '(\\d+)' + COD, 'g'), function (m, i) {
      return '<code class="md-codigo-inline">' + escaparHtml(codigo[Number(i) - 1]) + '</code>';
    });

    return s;
  }

  /* ───────────────────────────── bloques ───────────────────────────── */

  var RE_CERCA = /^ {0,3}(`{3,}|~{3,})\s*(\S*)\s*$/;
  var RE_HR = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
  var RE_H = /^ {0,3}(#{1,6})[ \t]+(.*)$/;
  var RE_ITEM = /^([ \t]*)([*\-+•◦▪]|\d+[.)])[ \t]+(.*)$/;
  var RE_SEP_TABLA = /^\s*\|?[ \t:|-]*-[ \t:|-]*\|?\s*$/;

  function esItem(linea) {
    return RE_ITEM.test(linea);
  }

  /** Nivel de anidamiento por sangría, con un suelo según el marcador (• / ◦). */
  function nivelDe(linea) {
    var sangriaItem = sangria(linea);
    var nivel = Math.floor(sangriaItem / 2);
    var marcador = sinEspaciosExtremos(linea).charAt(0);
    if (marcador === '◦' || marcador === '▪') nivel = Math.max(nivel, 1);
    if (marcador === '•') nivel = Math.max(nivel, 0);
    return Math.min(nivel, 5);
  }

  function desangrar(linea, n) {
    var m = /^[ \t]*/.exec(String(linea))[0];
    return linea.slice(Math.min(m.length, n));
  }

  function celdas(linea) {
    return String(linea)
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split(/(?<!\\)\|/)
      .map(function (c) {
        return c.trim();
      });
  }

  function esTabla(lineas, i) {
    return Boolean(
      lineas[i] &&
        String(lineas[i]).trim().charAt(0) === '|' &&
        lineas[i + 1] &&
        RE_SEP_TABLA.test(lineas[i + 1]) &&
        String(lineas[i + 1]).indexOf('-') !== -1
    );
  }

  function bloqueCodigo(lineas, i, ctx) {
    var apertura = RE_CERCA.exec(lineas[i]);
    var marca = apertura[1];
    var idioma = apertura[2] || '';
    var cuerpo = [];
    var j = i + 1;
    var cierre = new RegExp('^ {0,3}' + marca.charAt(0) + '{' + marca.length + ',}[ \\t]*$');

    while (j < lineas.length && !cierre.test(lineas[j])) {
      cuerpo.push(lineas[j]);
      j += 1;
    }

    ctx.codigos += 1;

    var barra =
      '<div class="md-codigo__barra">' +
      '<span class="md-codigo__lenguaje">' + escaparHtml(idioma || 'texto') + '</span>' +
      '<button type="button" class="md-codigo__copiar" aria-label="Copiar el bloque de código">' +
      '<span class="md-codigo__copiar-texto">copiar</span></button>' +
      '</div>';

    var clase = idioma ? ' class="language-' + escaparHtml(idioma.toLowerCase()) + '"' : '';

    return {
      html:
        '<div class="md-codigo" data-codigo="' + ctx.codigos + '">' + barra +
        '<pre class="md-codigo__pre"><code' + clase + '>' + escaparHtml(cuerpo.join('\n')) + '</code></pre></div>',
      siguiente: Math.min(j + 1, lineas.length),
    };
  }

  function bloqueTabla(lineas, i, ctx) {
    var cabecera = celdas(lineas[i]);
    var j = i + 2; // cabecera + separador
    var filas = [];

    while (j < lineas.length && String(lineas[j]).trim().charAt(0) === '|') {
      filas.push(celdas(lineas[j]));
      j += 1;
    }

    // Con una sola columna no es una tabla: en estos .md es una frase enmarcada.
    if (cabecera.length < 2) {
      return { html: '<div class="md-llamada">' + inline(cabecera[0] || '', ctx) + '</div>', siguiente: j };
    }

    var html = '<div class="md-tabla-wrap"><table class="md-tabla"><thead><tr>';
    cabecera.forEach(function (c) {
      html += '<th scope="col">' + inline(c, ctx) + '</th>';
    });
    html += '</tr></thead><tbody>';

    filas.forEach(function (fila) {
      html += '<tr>';
      for (var k = 0; k < cabecera.length; k += 1) html += '<td>' + inline(fila[k] || '', ctx) + '</td>';
      html += '</tr>';
    });

    return { html: html + '</tbody></table></div>', siguiente: j };
  }

  function bloqueLista(lineas, i, ctx) {
    var sangriaBase = sangria(RE_ITEM.exec(lineas[i])[1]);
    var umbral = sangriaBase + 2;
    var run = [];
    var j = i;

    // 1. Líneas que pertenecen a la lista: ítems, sus continuaciones y los
    //    huecos que hay entre medias.
    while (j < lineas.length) {
      var linea = lineas[j];

      if (!sinEspaciosExtremos(linea)) {
        var k = j;
        while (k < lineas.length && !sinEspaciosExtremos(lineas[k])) k += 1;
        if (k >= lineas.length) break;
        if (!(esItem(lineas[k]) || sangria(lineas[k]) >= umbral)) break;
        for (var s = j; s < k; s += 1) run.push('');
        j = k;
        continue;
      }

      if (esItem(linea) || sangria(linea) >= umbral) {
        run.push(linea);
        j += 1;
        continue;
      }
      break;
    }

    // 2. Se separan los ítems de primer nivel. Los sub-ítems se quedan como
    //    líneas de continuación: al desangrarlos, parseBloques los detecta
    //    como lista y el anidamiento sale solo.
    var nivelBase = 5;
    run.forEach(function (linea) {
      if (esItem(linea)) nivelBase = Math.min(nivelBase, nivelDe(linea));
    });
    if (nivelBase > 4) nivelBase = 0;

    var items = [];
    var actual = null;

    run.forEach(function (linea) {
      var m = esItem(linea) ? RE_ITEM.exec(linea) : null;

      if (m && nivelDe(linea) <= nivelBase) {
        var numero = /^\d/.test(m[2]) ? parseInt(m[2], 10) : null;
        actual = {
          ordenado: numero !== null,
          inicio: numero,
          sangria: sangria(m[1]),
          columna: sangria(m[1]) + m[2].length + 1,
          lineas: [m[3]],
        };
        items.push(actual);
        return;
      }

      if (actual) actual.lineas.push(linea);
    });

    // Una lista ordanada y otra con viñetas no se mezclan en el mismo <ol>/<ul>.
    var grupos = [];
    items.forEach(function (item) {
      var ultimo = grupos[grupos.length - 1];
      if (!ultimo || ultimo[0].ordenado !== item.ordenado) grupos.push([item]);
      else ultimo.push(item);
    });

    return {
      html: grupos.map(function (grupo) { return renderItems(grupo, ctx); }).join('\n'),
      siguiente: j,
    };
  }

  function renderItems(items, ctx) {
    if (!items.length) return '';
    var tipo = items[0].ordenado ? 'ol' : 'ul';
    var arranque =
      items[0].ordenado && items[0].inicio && items[0].inicio !== 1 ? ' start="' + items[0].inicio + '"' : '';
    var html = '<' + tipo + ' class="md-lista"' + arranque + '>';

    items.forEach(function (item) {
      var cuerpo = item.lineas.map(function (linea, indice) {
        return indice === 0 ? linea : desangrar(linea, item.columna);
      });
      html += '<li>' + parseBloques(cuerpo, ctx) + '</li>';
    });

    return html + '</' + tipo + '>';
  }

  function bloqueCita(lineas, i, ctx) {
    var cuerpo = [];
    var j = i;

    while (j < lineas.length) {
      var linea = lineas[j];

      if (/^ {0,3}>/.test(linea)) {
        cuerpo.push(linea.replace(/^ {0,3}>[ \t]?/, ''));
        j += 1;
        continue;
      }
      // Continuación perezosa: texto normal que sigue dentro de la cita.
      if (
        sinEspaciosExtremos(linea) &&
        !RE_CERCA.test(linea) &&
        !RE_HR.test(linea) &&
        !RE_H.test(linea) &&
        !esItem(linea)
      ) {
        cuerpo.push(linea);
        j += 1;
        continue;
      }
      break;
    }

    return {
      html: '<blockquote class="md-cit">' + parseBloques(cuerpo, ctx) + '</blockquote>',
      siguiente: j,
    };
  }

  function bloqueTitulo(linea, i, ctx) {
    var m = RE_H.exec(linea);
    var siguiente = i + 1;
    if (!sinEspaciosExtremos(m[2])) return { html: '', siguiente: siguiente };

    var nivel = Math.min(6, m[1].length + ctx.shift);
    var id = ctx.unico(ancla(textoPlano(m[2])));

    ctx.indice.push({ nivel: nivel, id: id, texto: sinEspaciosExtremos(textoPlano(m[2])) });

    return {
      html: '<h' + nivel + ' id="' + id + '" class="md-h md-h' + nivel + '">' + inline(m[2], ctx) + '</h' + nivel + '>',
      siguiente: siguiente,
    };
  }

  var RE_SOLO_IMAGEN = /^\s*!\[([^\]]*)\]\[([^\]]*)\]\s*$/;

  function bloqueParrafo(lineas, i, ctx) {
    var trozos = [];
    var j = i;

    while (j < lineas.length) {
      var linea = lineas[j];
      if (!sinEspaciosExtremos(linea)) break;
      if (j > i) {
        var corta =
          RE_CERCA.test(linea) ||
          RE_HR.test(linea) ||
          RE_H.test(linea) ||
          esItem(linea) ||
          /^ {0,3}>/.test(linea) ||
          esTabla(lineas, j);
        if (corta) break;
      }
      // Dos o más espacios al final = salto de línea forzado.
      var duro = /[ \t]{2,}$/.test(linea);
      trozos.push(String(linea).replace(/[ \t]+$/, ''));
      j += 1;
      if (duro && j < lineas.length && sinEspaciosExtremos(lineas[j])) trozos[trozos.length - 1] += '  \n';
    }

    var texto = trozos.join('\n');
    var soloImagen = RE_SOLO_IMAGEN.exec(texto);

    if (soloImagen) {
      return {
        html: '<figure class="md-figura">' + tagImagen(ctx, soloImagen[1], soloImagen[2]) + '</figure>',
        siguiente: j,
      };
    }

    return { html: '<p>' + inline(texto, ctx) + '</p>', siguiente: j };
  }

  /* ─────────────────────────── orquestación ─────────────────────────── */

  function parseBloques(lineas, ctx) {
    var html = [];
    var i = 0;

    while (i < lineas.length) {
      var linea = lineas[i];
      if (!sinEspaciosExtremos(linea)) {
        i += 1;
        continue;
      }

      var r;
      if (RE_CERCA.test(linea)) r = bloqueCodigo(lineas, i, ctx);
      else if (RE_HR.test(linea)) r = { html: '<hr class="md-hr">', siguiente: i + 1 };
      else if (RE_H.test(linea)) r = bloqueTitulo(linea, i, ctx);
      else if (/^ {0,3}>/.test(linea)) r = bloqueCita(lineas, i, ctx);
      else if (esTabla(lineas, i)) r = bloqueTabla(lineas, i, ctx);
      else if (esItem(linea)) r = bloqueLista(lineas, i, ctx);
      else r = bloqueParrafo(lineas, i, ctx);

      if (r.html) html.push(r.html);
      i = Math.max(r.siguiente, i + 1);
    }

    return html.join('\n');
  }

  function toHTML(md, opciones) {
    var opts = opciones || {};
    var usados = Object.create(null);
    var ctx = {
      refs: Object.create(null),
      indice: [],
      codigos: 0,
      shift: opts.shiftHeadings || 0,
      altPorDefecto: opts.altPorDefecto || '',
      unico: function (base) {
        var n = usados[base] || 0;
        usados[base] = n + 1;
        return n === 0 ? base : base + '-' + (n + 1);
      },
    };

    var lineas = String(md == null ? '' : md)
      .replace(/\r\n?/g, '\n')
      .replace(/\t/g, '    ')
      .split('\n');

    return { html: parseBloques(extraerReferencias(lineas, ctx), ctx), indice: ctx.indice };
  }

  PF.markdown = { toHTML: toHTML, textoPlano: textoPlano, ancla: ancla, recortar: recortar };
})(typeof window !== 'undefined' ? window : globalThis);