/**
 * app.js — página principal.
 *
 * Los datos vienen de assets/js/datos.js, que genera scripts/build.mjs.
 * No hay fetch a propósito: así la web funciona con doble clic (file://)
 * y también publicada en GitHub Pages.
 */
(function () {
  'use strict';

  var datos = window.PF_DATOS;
  var rejilla = document.getElementById('rejilla');
  var avisos = document.getElementById('avisos');
  var buscador = document.getElementById('buscador');
  var contador = document.getElementById('contador');

  /* ------------------------------ perfil ------------------------------ */

  function ponerPerfil() {
    var perfil = (datos && datos.perfil) || {};

    document.querySelectorAll('[data-perfil]').forEach(function (nodo) {
      var valor = perfil[nodo.getAttribute('data-perfil')];
      if (valor) nodo.textContent = valor;
    });
  }

  /* ------------------------------- datos ------------------------------ */

  function ponerContador() {
    if (!datos) return;
    document.getElementById('dato-proyectos').textContent = datos.proyectos.length;
  }

  /* ------------------------------ tarjetas ---------------------------- */

  function tarjeta(p) {
    var li = document.createElement('li');
    li.className = 'tarjeta';

    var h2 = document.createElement('h2');
    h2.className = 'tarjeta__titulo';
    var a = document.createElement('a');
    a.href = 'proyecto.html?id=' + encodeURIComponent(p.slug);
    a.textContent = p.titulo;
    h2.appendChild(a);

    var texto = document.createElement('p');
    texto.className = 'tarjeta__extracto';
    texto.textContent = p.extracto;

    var pie = document.createElement('p');
    pie.className = 'tarjeta__pie';

    var cta = document.createElement('span');
    cta.className = 'tarjeta__cta';
    cta.textContent = 'Ver proyecto →';

    pie.appendChild(cta);

    li.appendChild(h2);
    li.appendChild(texto);
    li.appendChild(pie);
    return li;
  }

  /* ------------------------------- filtro ----------------------------- */

  function normalizar(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function filtrar() {
    if (!datos) return;
    var texto = normalizar(buscador.value.trim());
    var visibles = 0;

    Array.prototype.forEach.call(rejilla.children, function (nodo) {
      var coincide = !texto || normalizar(nodo.getAttribute('data-buscar')).indexOf(texto) !== -1;
      nodo.hidden = !coincide;
      if (coincide) visibles += 1;
    });

    contador.textContent = texto
      ? visibles + ' de ' + datos.proyectos.length + ' proyectos'
      : datos.proyectos.length + ' proyectos';

    mostrarAvisoVacio(visibles === 0);
  }

  var avisoVacio = null;

  function mostrarAvisoVacio(mostrar) {
    if (!mostrar) {
      if (avisoVacio) { avisoVacio.remove(); avisoVacio = null; }
      return;
    }
    if (avisoVacio) return;
    avisoVacio = document.createElement('div');
    avisoVacio.className = 'pista pista--vacia';
    avisoVacio.innerHTML =
      '<h3>Ningún proyecto coincide con «' + escapar(buscador.value.trim()) + '»</h3>' +
      '<p>Prueba con <code>git</code>, <code>docker</code>, <code>ramas</code> o borra el filtro.</p>';
    avisos.appendChild(avisoVacio);
  }

  function escapar(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* -------------------------------- error ----------------------------- */

  function mostrarError() {
    rejilla.innerHTML = '';
    rejilla.removeAttribute('aria-busy');
    contador.textContent = '';
    var div = document.createElement('div');
    div.className = 'pista pista--error';
    div.innerHTML =
      '<h3>No se ha generado el contenido</h3>' +
      '<p>Falta <code>assets/js/datos.js</code>. Se genera con:</p>' +
      '<p><code>node scripts/build.mjs</code></p>' +
      '<p>Los proyectos viven en <code>content/*.md</code>; el script los lee, extrae las imágenes ' +
      'y escribe los datos que usa esta página.</p>';
    avisos.appendChild(div);
  }

  /* ------------------------------ arranque ---------------------------- */

  document.getElementById('anio').textContent = String(new Date().getFullYear());
  ponerPerfil();

  if (!datos || !datos.proyectos || !datos.proyectos.length) {
    mostrarError();
  } else {
    ponerContador();

    var fragmento = document.createDocumentFragment();
    datos.proyectos.forEach(function (p) {
      var nodo = tarjeta(p);
      nodo.setAttribute('data-buscar', normalizar([p.titulo, p.extracto].join(' ')));
      fragmento.appendChild(nodo);
    });

    rejilla.innerHTML = '';
    rejilla.appendChild(fragmento);
    rejilla.setAttribute('aria-busy', 'false');
    contador.textContent = datos.proyectos.length + ' proyectos';
    filtrar();

    buscador.addEventListener('input', filtrar);
  }
})();