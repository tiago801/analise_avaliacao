/* =============================================
   TOAST — Notification system
   ============================================= */

const container = () => document.getElementById('toast-container');

export function showToast(message, type = 'info', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container().appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

export const showSuccess = (msg) => showToast(msg, 'success');
export const showError   = (msg) => showToast(msg, 'error');
export const showInfo    = (msg) => showToast(msg, 'info');
export const showWarning = (msg) => showToast(msg, 'warning');
