let allBooks = [];
let filtered  = [];

const grid        = document.getElementById('book-grid');
const countEl     = document.getElementById('book-count');
const emptyEl     = document.getElementById('empty-state');
const searchEl    = document.getElementById('search');
const generoEl    = document.getElementById('filter-genero');
const estadoEl    = document.getElementById('filter-estado');
const idiomaEl    = document.getElementById('filter-idioma');
const clearBtn    = document.getElementById('clear-filters');
const modal       = document.getElementById('modal');
const modalClose  = document.getElementById('modal-close');
const modalBd     = document.getElementById('modal-backdrop');
const modalContent= document.getElementById('modal-content');

/* ── Estado en localStorage ──────────────────────────────── */
function getEstado(book) {
  try { return localStorage.getItem(`lb-estado-${book.slug}`) || 'pendiente'; } catch { return 'pendiente'; }
}

function setEstado(slug, valor) {
  try { localStorage.setItem(`lb-estado-${slug}`, valor); } catch {}
}

/* ── Load ───────────────────────────────────────────────── */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function init() {
  const slugs = window.INDEX;
  if (!Array.isArray(slugs) || slugs.length === 0) {
    grid.innerHTML = '<p style="color:#999;padding:2rem 0">No se pudo cargar index.js</p>';
    return;
  }
  await Promise.all(slugs.map(slug => loadScript(`data/${slug}.js`)));
  allBooks = slugs.map(slug => (window.LIBROS || {})[slug]).filter(Boolean);
  populateFilters();
  applyFilters();
}

/* ── Filters ─────────────────────────────────────────────── */
function populateFilters() {
  const generos = [...new Set(allBooks.map(b => b.genero).filter(Boolean))].sort();
  const idiomas = [...new Set(allBooks.map(b => b.idioma).filter(Boolean))].sort();

  generos.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g; opt.textContent = g;
    generoEl.appendChild(opt);
  });
  idiomas.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l; opt.textContent = l;
    idiomaEl.appendChild(opt);
  });
}

function applyFilters() {
  const q      = searchEl.value.trim().toLowerCase();
  const genero = generoEl.value;
  const estado = estadoEl.value;
  const idioma = idiomaEl.value;
  const hasFilters = q || genero || estado || idioma;

  clearBtn.style.display = hasFilters ? 'inline' : 'none';

  filtered = allBooks.filter(b => {
    const matchQ = !q || [b.titulo, b.autor, b.editorial]
      .filter(Boolean).some(f => f.toLowerCase().includes(q));
    const matchG = !genero || b.genero === genero;
    const matchE = !estado || getEstado(b) === estado;
    const matchL = !idioma || b.idioma === idioma;
    return matchQ && matchG && matchE && matchL;
  });

  renderGrid();
}

/* ── Render ──────────────────────────────────────────────── */
function renderGrid() {
  const n = filtered.length;
  countEl.textContent = n === 1 ? '1 libro' : `${n} libros`;
  emptyEl.style.display = n === 0 ? 'block' : 'none';
  grid.innerHTML = '';

  filtered.forEach(book => {
    const card = buildCard(book);
    card.addEventListener('click', () => openModal(book));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(book); });
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${book.titulo} — ${book.autor ?? ''}`);
    grid.appendChild(card);
  });
}

function buildCard(book) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.dataset.slug = book.slug;

  const estado = getEstado(book);

  card.innerHTML = `
    <div class="card-spine"></div>
    <div class="card-body">
      <h2 class="card-title">${esc(book.titulo)}</h2>
      <p class="card-author">${esc(book.autor ?? '')}</p>
      <div class="card-meta">
        <div class="card-tags">
          ${book.genero ? `<span class="tag">${esc(book.genero)}</span>` : ''}
          ${book.año    ? `<span class="tag">${esc(String(book.año))}</span>` : ''}
        </div>
        ${estado ? `<span class="status ${statusToClass(estado)}">${statusToLabel(estado)}</span>` : ''}
      </div>
    </div>
  `;
  return card;
}

/* ── Modal ───────────────────────────────────────────────── */
function openModal(book) {
  const estado = getEstado(book);

  const cover = book.portada
    ? `<img src="${esc(book.portada)}" alt="Portada de ${esc(book.titulo)}" class="modal-cover" loading="lazy">`
    : `<div class="modal-cover-placeholder">Sin portada</div>`;

  const metaRows = [
    ['Autor',       book.autor],
    ['Editorial',   book.editorial],
    ['Año',         book.año],
    ['ISBN',        book.isbn],
    ['Páginas',     book.paginas],
    ['Idioma',      book.idioma],
    ['Género',      book.genero],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '');

  const metaHTML = metaRows.map(([label, val]) => `
    <span class="meta-label">${label}</span>
    <span class="meta-value">${esc(String(val))}</span>
  `).join('');

  modalContent.innerHTML = `
    ${cover}
    <h2 class="modal-title" id="modal-title">${esc(book.titulo)}</h2>
    <p class="modal-author">${esc(book.autor ?? '')}</p>
    <div class="modal-status-row">
      <select class="estado-select" data-slug="${esc(book.slug)}" aria-label="Estado de lectura">
        <option value="pendiente" ${estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
        <option value="leyendo"   ${estado === 'leyendo'   ? 'selected' : ''}>Leyendo</option>
        <option value="leido"     ${estado === 'leido'     ? 'selected' : ''}>Leído</option>
      </select>
      <a href="leer.html?id=${esc(book.slug)}" class="btn-leer">Leer</a>
    </div>
    <hr class="modal-divider">
    <div class="meta-grid">${metaHTML}</div>
    ${book.sinopsis ? `
      <hr class="modal-divider">
      <p class="modal-section-title">Sinopsis</p>
      <p class="modal-sinopsis">${esc(book.sinopsis)}</p>
    ` : ''}
  `;

  modalContent.querySelector('.estado-select').addEventListener('change', e => {
    const nuevoEstado = e.target.value;
    setEstado(book.slug, nuevoEstado);
    const card = grid.querySelector(`[data-slug="${book.slug}"] .status`);
    if (card) {
      card.className = `status ${statusToClass(nuevoEstado)}`;
      card.textContent = statusToLabel(nuevoEstado);
    }
  });

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ── Helpers ─────────────────────────────────────────────── */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusToClass(estado) {
  const map = { leido: 'status--leido', leyendo: 'status--leyendo', pendiente: 'status--pendiente' };
  return map[estado] ?? '';
}

function statusToLabel(estado) {
  const map = { leido: 'Leído', leyendo: 'Leyendo', pendiente: 'Pendiente' };
  return map[estado] ?? estado ?? '';
}

/* ── Events ──────────────────────────────────────────────── */
searchEl.addEventListener('input', applyFilters);
generoEl.addEventListener('change', applyFilters);
estadoEl.addEventListener('change', applyFilters);
idiomaEl.addEventListener('change', applyFilters);

clearBtn.addEventListener('click', () => {
  searchEl.value = '';
  generoEl.value = '';
  estadoEl.value = '';
  idiomaEl.value = '';
  applyFilters();
});

modalClose.addEventListener('click', closeModal);
modalBd.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

init();
