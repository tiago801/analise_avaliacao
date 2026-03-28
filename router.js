/* =============================================
   ROUTER — Hash-based SPA routing
   ============================================= */

import { setActiveSidebarItem } from './ui/sidebar.js';
import { updateBreadcrumb }     from './ui/topbar.js';

const VIEWS = ['aluno', 'turma', 'gestor'];
const DEFAULT_VIEW = 'aluno';

const handlers = {};

export function registerView(viewId, handler) {
  handlers[viewId] = handler;
}

export function navigateTo(viewId) {
  if (!VIEWS.includes(viewId)) viewId = DEFAULT_VIEW;

  // Show/hide views
  VIEWS.forEach(id => {
    const el = document.getElementById(`view-${id}`);
    if (el) el.classList.toggle('active', id === viewId);
  });

  setActiveSidebarItem(viewId);
  updateBreadcrumb(viewId);

  // Call registered view handler
  if (handlers[viewId]) handlers[viewId]();

  // Update hash without triggering hashchange
  if (location.hash !== `#${viewId}`) {
    history.replaceState(null, '', `#${viewId}`);
  }
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    const view = location.hash.replace('#', '') || DEFAULT_VIEW;
    navigateTo(view);
  });

  // Initial route
  const initial = location.hash.replace('#', '') || DEFAULT_VIEW;
  navigateTo(initial);
}
