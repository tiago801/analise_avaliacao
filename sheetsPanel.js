/* =============================================
   SHEETS PANEL — Google Sheets config & sync UI
   ============================================= */

import {
  getWebAppUrl, saveWebAppUrl, isConfigured,
  testConnection, syncAll, setSyncStatus,
} from '../data/sheetsSync.js';
import { showSuccess, showError, showInfo } from './toast.js';

// The full Code.gs content for copy button
const GS_CODE_URL = './gs/Code.gs';

export function initSheetsPanel(onSyncComplete) {
  const configModal  = document.getElementById('sheets-config-modal');
  const configBtn    = document.getElementById('sheets-config-btn');
  const closeBtn     = document.getElementById('sheets-config-close');
  const cancelBtn    = document.getElementById('sheets-config-cancel');
  const backdrop     = document.getElementById('sheets-backdrop');
  const saveBtn      = document.getElementById('sheets-config-save');
  const testBtn      = document.getElementById('sheets-test-btn');
  const urlInput     = document.getElementById('sheets-url-input');
  const syncBtn      = document.getElementById('sync-btn');
  const copyCodeBtn  = document.getElementById('copy-gs-code-btn');
  const testResult   = document.getElementById('connection-test-result');

  if (!configModal) return;

  // ── Open / close ──
  function openConfig() {
    urlInput.value = getWebAppUrl();
    testResult.className = 'connection-result hidden';
    configModal.classList.add('open');
  }
  function closeConfig() { configModal.classList.remove('open'); }

  configBtn?.addEventListener('click', openConfig);
  closeBtn?.addEventListener('click', closeConfig);
  cancelBtn?.addEventListener('click', closeConfig);
  backdrop?.addEventListener('click', closeConfig);

  // ── Copy Code.gs to clipboard ──
  copyCodeBtn?.addEventListener('click', async () => {
    try {
      const res  = await fetch(GS_CODE_URL);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      copyCodeBtn.textContent = '✓ Copiado!';
      setTimeout(() => { copyCodeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar código`; }, 2000);
    } catch(e) {
      showError('Não foi possível copiar. Abra o arquivo gs/Code.gs manualmente.');
    }
  });

  // ── Test connection ──
  testBtn?.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) { showError('Digite a URL do Web App primeiro.'); return; }

    saveWebAppUrl(url);
    testBtn.disabled = true;
    testBtn.textContent = 'Testando…';
    testResult.className = 'connection-result hidden';

    try {
      const data = await testConnection();
      testResult.className = 'connection-result success';
      testResult.textContent = `✓ Conectado! Planilha: "${data.spreadsheetName}" · ${data.datasetsCount} dataset(s) no Sheets.`;
    } catch(err) {
      testResult.className = 'connection-result error';
      testResult.textContent = `✗ Erro: ${err.message}`;
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Testar Conexão';
      testResult.classList.remove('hidden');
    }
  });

  // ── Save ──
  saveBtn?.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url || !url.startsWith('https://')) {
      showError('URL inválida. Deve começar com https://');
      return;
    }
    saveWebAppUrl(url);
    showSuccess('URL salva! Clique em "Sincronizar" para enviar os dados.');
    updateSyncBadge();
    closeConfig();
  });

  // ── Sync button ──
  syncBtn?.addEventListener('click', async () => {
    if (!isConfigured()) {
      openConfig();
      showInfo('Configure a URL do Google Sheets antes de sincronizar.');
      return;
    }

    syncBtn.classList.add('syncing');
    syncBtn.disabled = true;
    setSyncStatus('syncing');

    try {
      const result = await syncAll();
      setSyncStatus('ok');
      updateSyncBadge();
      if (onSyncComplete) onSyncComplete(result);
    } catch(_) {
      setSyncStatus('error');
    } finally {
      syncBtn.classList.remove('syncing');
      syncBtn.disabled = false;
    }
  });

  // Init badge
  updateSyncBadge();
}

function updateSyncBadge() {
  const badge = document.getElementById('sync-topbar-badge');
  if (!badge) return;
  if (isConfigured()) {
    badge.style.display = '';
    badge.className = 'badge badge-success';
    badge.textContent = 'Sheets ✓';
  } else {
    badge.style.display = 'none';
  }
}
