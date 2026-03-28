/* =============================================
   SELECTOR — Dropdown builders
   ============================================= */

export function buildSelect(containerId, options, onChange, placeholder = 'Selecionar...') {
  const container = document.getElementById(containerId);
  if (!container) return null;

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'select-wrapper';

  const sel = document.createElement('select');
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = placeholder;
  sel.appendChild(defaultOpt);

  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = typeof opt === 'object' ? opt.value : opt;
    o.textContent = typeof opt === 'object' ? opt.label : opt;
    sel.appendChild(o);
  });

  sel.addEventListener('change', () => onChange(sel.value || null));
  wrapper.appendChild(sel);
  container.appendChild(wrapper);

  return {
    setValue: (val) => { sel.value = val || ''; },
    getValue: () => sel.value || null,
    el: sel,
  };
}

export function buildStudentSelector(containerId, students, onChange) {
  return buildSelect(containerId, students, onChange, 'Selecionar aluno...');
}

export function buildClassSelector(containerId, classes, onChange) {
  return buildSelect(containerId, classes, onChange, 'Selecionar turma...');
}

export function buildGenericSelector(containerId, options, onChange, placeholder) {
  return buildSelect(containerId, options, onChange, placeholder);
}
