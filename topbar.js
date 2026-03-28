/* =============================================
   TOPBAR — Breadcrumb + Theme toggle + Data badge
   ============================================= */

import { getState, setTheme, hasData, subscribe } from '../data/store.js';

const VIEW_LABELS = { aluno: 'Aluno', turma: 'Turma', gestor: 'Gestor' };

export function initTopbar() {
  const toggle  = document.getElementById('theme-toggle');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon= document.getElementById('icon-moon');

  toggle.addEventListener('click', () => {
    const current = getState().theme;
    const next    = current === 'light' ? 'dark' : 'light';
    setTheme(next);
    iconSun.style.display  = next === 'light' ? '' : 'none';
    iconMoon.style.display = next === 'dark'  ? '' : 'none';
    // Notify chart factory to update colors
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: next } }));
  });

  // Init icon state
  const theme = getState().theme;
  iconSun.style.display  = theme === 'light' ? '' : 'none';
  iconMoon.style.display = theme === 'dark'  ? '' : 'none';

  // React to store changes
  subscribe(() => updateDataBadge());
  updateDataBadge();
}

export function updateBreadcrumb(viewId) {
  const el = document.getElementById('breadcrumb-view');
  if (el) el.textContent = VIEW_LABELS[viewId] || viewId;
}

function updateDataBadge() {
  const badge = document.getElementById('data-status-badge');
  if (!badge) return;
  const { datasets } = getState();
  if (!datasets.length) {
    badge.className = 'badge badge-neutral';
    badge.textContent = 'Sem dados';
  } else {
    const totalAlunos = new Set(datasets.flatMap(d => d.rows.map(r => r.aluno))).size;
    badge.className = 'badge badge-success';
    badge.textContent = `${totalAlunos} alunos · ${datasets.length} arquivo${datasets.length > 1 ? 's' : ''}`;
  }
}
