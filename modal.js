/* =============================================
   MODAL — Upload modal lifecycle
   ============================================= */

import { initDropzone } from '../data/importer.js';
import { addDataset, generateId } from '../data/store.js';
import { showSuccess, showError } from './toast.js';

let pendingFile = null;

export function initModal(onImported) {
  const modal    = document.getElementById('upload-modal');
  const backdrop = document.getElementById('modal-backdrop');
  const closeBtn = document.getElementById('modal-close');
  const cancelBtn= document.getElementById('modal-cancel');
  const confirmBtn=document.getElementById('modal-confirm');
  const dropzone = document.getElementById('dropzone');
  const fileInput= document.getElementById('file-input');
  const filePreview= document.getElementById('file-preview');
  const fileNameLabel= document.getElementById('file-name-label');
  const modelBadge   = document.getElementById('model-badge');
  const previewInfo  = document.getElementById('preview-rows-info');
  const openBtn      = document.getElementById('sidebar-upload-btn');

  function open()  { modal.classList.add('open'); pendingFile = null; reset(); }
  function close() { modal.classList.remove('open'); pendingFile = null; }
  function reset() {
    filePreview.classList.add('hidden');
    dropzone.classList.remove('hidden');
    confirmBtn.disabled = true;
    pendingFile = null;
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  // Also open when empty-state buttons are clicked (already handled by inline onclick)

  initDropzone(dropzone, fileInput, (result, error) => {
    if (error) {
      showError(error);
      reset();
      return;
    }
    pendingFile = result;
    fileNameLabel.textContent = result.filename;
    modelBadge.className = `badge ${result.model === 'enem' ? 'badge-info' : 'badge-success'}`;
    modelBadge.textContent = result.modelLabel;
    previewInfo.textContent = `${result.rows.length} alunos encontrados`;
    filePreview.classList.remove('hidden');
    confirmBtn.disabled = false;
  });

  confirmBtn.addEventListener('click', () => {
    if (!pendingFile) return;
    const dataset = {
      id:         generateId(),
      filename:   pendingFile.filename,
      model:      pendingFile.model,
      importedAt: new Date().toISOString(),
      rows:       pendingFile.rows,
    };
    addDataset(dataset);
    showSuccess(`✓ "${pendingFile.filename}" importado com sucesso — ${pendingFile.rows.length} alunos.`);
    close();
    if (onImported) onImported(dataset);
  });
}
