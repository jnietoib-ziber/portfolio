/**
 * detalle.js — página de un proyecto (proyecto.html?id=<slug>).
 *
 * Renderiza el markdown con el parser de assets/js/markdown.js y añade la
 * mejora progresiva: índice con scroll-spy, copiar código, lightbox y
 * navegación entre proyectos con teclado.
 *
 * Sin fetch: los datos están en assets/js/datos.js (ver scripts/build.mjs).
 */
(function () {
  'use strict';

  var datos = window.PF_DATOS;
  var markdown = window.PF && window.PF.markdown;

  var elTitulo = document.getElementById('titulo');
  var elArticulo = document.getElementById('articulo');
  var elIndice = document.getElementById('indice');
  var elIndiceLista = document.getElementById('indice-lista');
  var elCuerpo = document.getElementById('cuerpo');
  var elNav = document.getElementById('nav-proyectos');
  var losAvisos = document.getElementById('avisos');

  document.getElementById('anio').textContent = String(new Date().getFullYear());
  document.querySelectorAll('[data-perfil]').forEach(function (nodo) {
    var valor = datos && datos.perfil && datos.perfil[nodo.getAttribute('data-perfil')];
    if (valor) nodo.textContent = valor;
  });

  /* -------------------------------- error ----------------------------- */

  function error(titulo, cuerpo) {
    elTitulo.textContent = titulo;
    elNav.innerHTML = '';
    elIndice.hidden = true;
    var div = document.createElement('div');
    div.className = 'pista pista--error';
    div.innerHTML = cuerpo;
    losAvisos.appendChild(div);
  }

  if (!datos || !datos.proyectos || !datos.proyectos.length) {
    error('Contenido no generado',
      '<h3>Falta <code>assets/js/datos.js</code></h3>' +
      '<p>Se genera con <code>node scripts/build.mjs</code>, que lee los ' +
      '<code>.md</code> de <code>content/</code> y extrae sus imágenes.</p>' +
      '<p><a href="index.html">← Volver al inicio</a></p>');
    return;
  }

  /* ------------------------------ el proyecto ------------------------- */

  var slug = new URLSearchParams(location.search).get('id');
  var indice = datos.proyectos.findIndex(function (p) { return p.slug === slug; });

  if (indice === -1) {
    error('Proyecto no encontrado',
      '<h3>No hay ningún proyecto con el identificador «' + escapar(slug || '') + '»</h3>' +
      '<p>Puede que el archivo se haya renombrado. Vuelve al listado y elige otro.</p>' +
      '<p><a href="index.html#proyectos">← Ver todos los proyectos</a></p>');
    return;
  }

  var proyecto = datos.proyectos[indice];
  var markdownFuente = datos.contenido[indice];

  function escapar(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ------------------------------- cabecera --------------------------- */

  document.title = proyecto.titulo + ' · Portfolio';
  elTitulo.textContent = proyecto.titulo;

  var descripcion = proyecto.descripcion || proyecto.extracto;
  var metaDescripcion = document.querySelector('meta[name="description"]');
  if (metaDescripcion) metaDescripcion.setAttribute('content', descripcion);
  var ogTitulo = document.querySelector('meta[property="og:title"]');
  if (ogTitulo) ogTitulo.setAttribute('content', proyecto.titulo + ' · Portfolio');
  var ogDescripcion = document.querySelector('meta[property="og:description"]');
  if (ogDescripcion) ogDescripcion.setAttribute('content', descripcion);

  /* ------------------------------- artículo --------------------------- */

  var render = markdown.toHTML(markdownFuente, {
    shiftHeadings: 1, // la página ya aporta el h1
    altPorDefecto: 'Captura de pantalla de ' + proyecto.titulo,
  });

  elArticulo.innerHTML = render.html;

  /* -------------------------------- índice ---------------------------- */

  var entradas = render.indice.filter(function (h) { return h.nivel === 2 || h.nivel === 3; });

  if (entradas.length >= 2) {
    entradas.forEach(function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.texto;
      a.dataset.ancla = h.id;
      if (h.nivel === 3) a.style.paddingLeft = 'var(--e4)';
      li.appendChild(a);
      elIndiceLista.appendChild(li);
    });
    elIndice.hidden = false;
    elCuerpo.classList.add('proyecto__cuerpo--con-indice');
    observarSecciones(entradas);
  }

  /* ------------------------------ copiado ----------------------------- */

  /**
   * Portapapeles con dos vías: la API moderna y, si falla (permisos, contexto
   * no seguro), el método antiguo con un textarea fuera de pantalla.
   */
  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto);
    }
    return new Promise(function (resolver, rechazar) {
      var area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {
        ok = false;
      }
      area.remove();
      if (ok) resolver();
      else rechazar(new Error('sin permiso para copiar'));
    });
  }

  function activarCopiado() {
    document.querySelectorAll('.md-codigo__copiar').forEach(function (boton) {
      boton.addEventListener('click', function () {
        var bloque = boton.closest('.md-codigo');
        var texto = bloque ? bloque.querySelector('code').textContent : '';
        var etiqueta = boton.querySelector('.md-codigo__copiar-texto');

        copiar(texto).then(
          function () {
            boton.dataset.estado = 'ok';
            etiqueta.textContent = 'copiado';
          },
          function () {
            boton.dataset.estado = 'error';
            etiqueta.textContent = 'no se pudo copiar';
            boton.title = 'Selecciona el código y pulsa Ctrl+C';
            // Se selecciona el bloque para que Ctrl+C funcione sin más pasos.
            if (bloque) {
              var seleccion = window.getSelection();
              var rango = document.createRange();
              rango.selectNodeContents(bloque.querySelector('code'));
              seleccion.removeAllRanges();
              seleccion.addRange(rango);
            }
          }
        );

        window.setTimeout(function () {
          boton.dataset.estado = '';
          etiqueta.textContent = 'copiar';
        }, 1800);
      });
    });
  }

  /* ------------------------------ lightbox ---------------------------- */

  var lightbox = document.getElementById('lightbox');
  var imgLightbox = document.getElementById('lightbox-img');
  var pieLightbox = document.getElementById('lightbox-pie');
  var botonCerrar = document.getElementById('lightbox-cerrar');

  var imagenOrigen = null;

  function abrirLightbox(img) {
    imgLightbox.src = img.currentSrc || img.src;
    imgLightbox.alt = img.alt;
    pieLightbox.textContent = img.alt;

    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
      botonCerrar.focus();
    } else {
      lightbox.setAttribute('open', '');
    }
    imagenOrigen = img;
  }

  function cerrarLightbox() {
    if (typeof lightbox.close === 'function') lightbox.close();
    else lightbox.removeAttribute('open');
    if (imagenOrigen) {
      imagenOrigen.focus();
      imagenOrigen = null;
    }
  }

  if (lightbox) {
    document.querySelectorAll('.md-img').forEach(function (img, i) {
      img.id = 'img-' + (i + 1);
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.addEventListener('click', function () { abrirLightbox(img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirLightbox(img); }
      });
    });

    botonCerrar.addEventListener('click', cerrarLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) cerrarLightbox();
    });
  }

  /* ----------------------------- scroll-spy --------------------------- */

  function observarSecciones(entradas) {
    if (!('IntersectionObserver' in window)) return;

    var enlaces = {};
    elIndiceLista.querySelectorAll('a').forEach(function (a) { enlaces[a.dataset.ancla] = a; });

    var visibles = new Set();

    var observador = new IntersectionObserver(
      function (entradasObs) {
        entradasObs.forEach(function (o) {
          if (o.isIntersecting) visibles.add(o.target.id);
          else visibles.delete(o.target.id);
        });

        var primero = entradas.map(function (h) { return h.id; }).find(function (id) { return visibles.has(id); });
        if (!primero) return;

        Object.keys(enlaces).forEach(function (id) {
          enlaces[id].removeAttribute('aria-current');
        });
        if (enlaces[primero]) enlaces[primero].setAttribute('aria-current', 'true');
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    entradas.forEach(function (h) {
      var seccion = document.getElementById(h.id);
      if (seccion) observador.observe(seccion);
    });
  }

  /* ---------------------- navegación entre proyectos ------------------- */

  function enlaceProyecto(p, clase, etiqueta) {
    var a = document.createElement('a');
    a.className = 'proyecto__enlace ' + clase;
    a.href = 'proyecto.html?id=' + encodeURIComponent(p.slug);

    var tag = document.createElement('span');
    tag.className = 'etiqueta';
    tag.textContent = etiqueta;

    var titulo = document.createElement('strong');
    titulo.textContent = p.titulo;

    a.appendChild(tag);
    a.appendChild(titulo);
    return a;
  }

  var anterior = indice > 0 ? datos.proyectos[indice - 1] : null;
  var siguiente = indice < datos.proyectos.length - 1 ? datos.proyectos[indice + 1] : null;

  if (anterior) elNav.appendChild(enlaceProyecto(anterior, 'proyecto__enlace--anterior', '← Anterior'));
  if (siguiente) elNav.appendChild(enlaceProyecto(siguiente, 'proyecto__enlace--siguiente', 'Siguiente →'));

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var etiqueta = document.activeElement && document.activeElement.tagName;
    if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft' && anterior) location.href = 'proyecto.html?id=' + encodeURIComponent(anterior.slug);
    if (e.key === 'ArrowRight' && siguiente) location.href = 'proyecto.html?id=' + encodeURIComponent(siguiente.slug);
  });

  activarCopiado();
})();