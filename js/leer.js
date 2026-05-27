const params   = new URLSearchParams(location.search);
const bookId   = params.get('id');

let meta      = null;
let capActual = 0;

const sidebar      = document.getElementById('sidebar');
const sidebarOpen  = document.getElementById('sidebar-open');
const sidebarClose = document.getElementById('sidebar-close');
const bookInfoEl   = document.getElementById('book-info');
const chapterNav   = document.getElementById('chapter-nav');
const contentEl    = document.getElementById('reader-content');
const paginationEl = document.getElementById('reader-pagination');
const breadcrumb   = document.getElementById('reader-breadcrumb');
const progressEl   = document.getElementById('reader-progress');

/* ── Paywall ─────────────────────────────────────────────── */
function isLastFree(index) {
  return !!meta.precio && index === meta.capitulos.length - 1;
}

function paywallHTML() {
  return `
    <div class="paywall">
      <p class="paywall-hook">${esc(meta.titulo)}</p>
      <h2 class="paywall-title">¿Querés saber cómo sigue?</h2>
      <p class="paywall-desc">Leíste los capítulos gratuitos. Desbloqueá el libro completo en PDF.</p>
      ${meta.precio ? `<p class="paywall-price">${esc(meta.precio)}</p>` : ''}
      <a href="${esc(meta.pago_url ?? '#')}" class="btn-unlock" target="_blank" rel="noopener">
        Desbloquear libro completo
      </a>
    </div>
  `;
}

/* ── Init ────────────────────────────────────────────────── */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function init() {
  if (!bookId) { contentEl.innerHTML = '<p>No se especificó ningún libro.</p>'; return; }

  try {
    await loadScript(`data/${bookId}.js`);
    meta = (window.LIBROS || {})[bookId];
    if (!meta) throw new Error();
  } catch {
    contentEl.innerHTML = '<p>No se encontró el archivo de este libro.</p>';
    return;
  }

  if (!Array.isArray(meta.capitulos) || meta.capitulos.length === 0) {
    contentEl.innerHTML = '<p>Este libro no tiene contenido cargado todavía.</p>';
    return;
  }

  document.title = `${meta.titulo} — Biblioteca`;

  const estadoGuardado = (() => { try { return localStorage.getItem(`lb-estado-${bookId}`); } catch { return null; } })();
  if (!estadoGuardado || estadoGuardado === 'pendiente') {
    try { localStorage.setItem(`lb-estado-${bookId}`, 'leyendo'); } catch {}
  }

  renderSidebar();
  renderChapter(getSavedChapter());
}

/* ── Sidebar ─────────────────────────────────────────────── */
function renderSidebar() {
  bookInfoEl.innerHTML = `
    <p class="book-info-title">${esc(meta.titulo)}</p>
    <p class="book-info-author">${esc(meta.autor ?? '')}</p>
  `;

  chapterNav.innerHTML = '';
  meta.capitulos.forEach((cap, i) => {
    const a = document.createElement('a');
    a.className = 'chapter-link';
    a.textContent = cap.titulo || `Capítulo ${cap.numero}`;
    a.addEventListener('click', () => { renderChapter(i); if (window.innerWidth <= 640) closeSidebar(); });
    chapterNav.appendChild(a);
  });
}

function updateNavActive() {
  document.querySelectorAll('.chapter-link').forEach((el, i) => {
    el.classList.toggle('active', i === capActual);
  });
}

/* ── Chapter render ──────────────────────────────────────── */
function renderChapter(index) {
  capActual = Math.max(0, Math.min(index, meta.capitulos.length - 1));
  saveChapter(capActual);

  const cap   = meta.capitulos[capActual];
  const total = meta.capitulos.length;

  breadcrumb.textContent = `${meta.titulo} — ${cap.titulo || `Capítulo ${cap.numero}`}`;
  progressEl.textContent = `${capActual + 1} / ${total}`;

  const bloquesHTML = cap.bloques.map(bloque => {
    switch (bloque.tipo) {
      case 'parrafo':   return `<p>${esc(bloque.texto)}</p>`;
      case 'dialogo':   return `<p class="block-dialogo">${esc(bloque.texto)}</p>`;
      case 'cita':      return `<blockquote class="block-cita">${esc(bloque.texto)}</blockquote>`;
      case 'titulo':    return `<h2 class="block-subtitulo">${esc(bloque.texto)}</h2>`;
      case 'separador': return `<div class="block-separador" aria-hidden="true">* * *</div>`;
      default:          return '';
    }
  }).join('');

  const fin = isLastFree(capActual) ? paywallHTML() : '';

  contentEl.innerHTML = `<h1 class="chapter-title">${esc(cap.titulo || `Capítulo ${cap.numero}`)}</h1>` + bloquesHTML + fin;
  contentEl.scrollTop = 0;

  renderPagination();
  updateNavActive();
}

/* ── Pagination ──────────────────────────────────────────── */
function renderPagination() {
  const prev = meta.capitulos[capActual - 1];
  const next = meta.capitulos[capActual + 1];

  const nextBtn = isLastFree(capActual)
    ? `<a href="${esc(meta.pago_url ?? '#')}" class="btn-chapter btn-chapter--unlock" target="_blank" rel="noopener">Desbloquear &rarr;</a>`
    : `<button class="btn-chapter" id="btn-next" ${!next ? 'disabled' : ''}>${next ? esc(next.titulo || `Cap. ${next.numero}`) : ''} &rarr;</button>`;

  paginationEl.innerHTML = `
    <button class="btn-chapter" id="btn-prev" ${capActual === 0 ? 'disabled' : ''}>
      &larr; ${prev ? esc(prev.titulo || `Cap. ${prev.numero}`) : ''}
    </button>
    ${nextBtn}
  `;

  document.getElementById('btn-prev')?.addEventListener('click', () => renderChapter(capActual - 1));
  document.getElementById('btn-next')?.addEventListener('click', () => renderChapter(capActual + 1));
}

/* ── Sidebar toggle ──────────────────────────────────────── */
function openSidebar() {
  sidebar.classList.add('open');
  sidebar.classList.remove('collapsed');
}

function closeSidebar() {
  if (window.innerWidth <= 640) sidebar.classList.remove('open');
  else sidebar.classList.add('collapsed');
}

sidebarOpen.addEventListener('click', () => {
  if (sidebar.classList.contains('collapsed') || !sidebar.classList.contains('open')) openSidebar();
  else closeSidebar();
});

sidebarClose.addEventListener('click', closeSidebar);

/* ── Progress persistence ────────────────────────────────── */
function saveChapter(i) {
  try { localStorage.setItem(`lb-progress-${bookId}`, i); } catch {}
}

function getSavedChapter() {
  try { return parseInt(localStorage.getItem(`lb-progress-${bookId}`)) || 0; } catch { return 0; }
}

/* ── Helpers ─────────────────────────────────────────────── */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Keyboard navigation ─────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') renderChapter(capActual + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   renderChapter(capActual - 1);
});

init();
