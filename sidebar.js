/* =============================================
   SIDEBAR — Navigation active state
   ============================================= */

export function initSidebar() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

export function setActiveSidebarItem(viewId) {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === viewId);
  });
}
