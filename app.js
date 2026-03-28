/* =============================================
   APP.JS — Entry point
   ============================================= */

import { loadFromStorage, subscribe } from './data/store.js';
import { initModal }   from './ui/modal.js';
import { initSidebar } from './ui/sidebar.js';
import { initTopbar }  from './ui/topbar.js';
import { initRouter, registerView, navigateTo } from './router.js';
import { initAluno }   from './dashboards/aluno.js';
import { initTurma }   from './dashboards/turma.js';
import { initGestor }  from './dashboards/gestor.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load persisted state
  loadFromStorage();

  // 2. Init UI shell
  initSidebar();
  initTopbar();

  // 3. Register dashboard views
  registerView('aluno',  initAluno);
  registerView('turma',  initTurma);
  registerView('gestor', initGestor);

  // 4. Init upload modal — re-render active view on import
  initModal((dataset) => {
    const hash = location.hash.replace('#', '') || 'aluno';
    navigateTo(hash);
  });

  // 5. Subscribe to store changes to update any persistent UI (topbar badge)
  subscribe(() => {});

  // 6. Start router (resolves initial hash)
  initRouter();
});
