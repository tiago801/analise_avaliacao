/**
 * =====================================================
 *  EduAnalise — Google Apps Script Backend
 *  Cole este código em: Extensões → Apps Script
 *  Depois publique como Web App (veja instruções abaixo)
 * =====================================================
 *
 *  ESTRUTURA DAS ABAS NO GOOGLE SHEETS:
 *  ┌─────────────────┬──────────────────────────────────┐
 *  │ Aba             │ Conteúdo                         │
 *  ├─────────────────┼──────────────────────────────────┤
 *  │ datasets        │ metadados de cada importação     │
 *  │ rows_nacional   │ registros de Avaliação Nacional  │
 *  │ rows_enem       │ registros de Simulado ENEM       │
 *  └─────────────────┴──────────────────────────────────┘
 */

// ── CONFIGURAÇÃO ──────────────────────────────────────
// ID da planilha (retirado da URL do Sheets)
// Ex: https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
// Deixe vazio para usar a planilha onde este script está instalado
var SPREADSHEET_ID = '';

// ── CABEÇALHOS ────────────────────────────────────────
var HEADERS = {
  datasets: ['id', 'filename', 'model', 'importedAt', 'rowCount'],

  rows_nacional: [
    'datasetId', 'aluno', 'unidade', 'serie', 'turma',
    'atividade', 'dataInicio', 'dataEntrega',
    'ingles', 'arte', 'biologia', 'filosofia', 'fisica',
    'geografia', 'historia', 'literatura', 'matematica',
    'portugues', 'quimica', 'sociologia', 'total'
  ],

  rows_enem: [
    'datasetId', 'aluno', 'simulado', 'escola', 'serie', 'turma',
    'rankingEscola', 'rankingRede', 'mediaTri',
    'tri_lgg', 'tri_chs', 'tri_cnt', 'tri_mat', 'tri_redacao',
    'acerto_lgg', 'acerto_chs', 'acerto_cnt', 'acerto_mat',
    'red_c1', 'red_c2', 'red_c3', 'red_c4', 'red_c5'
  ]
};

// ── UTILITÁRIOS ───────────────────────────────────────
function getSpreadsheet() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Escreve cabeçalhos
    var headers = HEADERS[name];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#0071E3')
        .setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function cors(output) {
  return output
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function jsonResponse(data) {
  return cors(
    ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON)
  );
}

// ── ROTEAMENTO ────────────────────────────────────────
function doGet(e) {
  var action = e.parameter.action || '';

  if (action === 'getAll')    return actionGetAll();
  if (action === 'getStatus') return actionGetStatus();

  return jsonResponse({ error: 'Ação GET não reconhecida: ' + action });
}

function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action || '';

    if (action === 'saveDataset')   return actionSaveDataset(body);
    if (action === 'deleteDataset') return actionDeleteDataset(body);
    if (action === 'clearAll')      return actionClearAll();

    return jsonResponse({ error: 'Ação POST não reconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── AÇÕES ─────────────────────────────────────────────

/** Retorna todos os datasets + linhas */
function actionGetAll() {
  var ss = getSpreadsheet();
  var dsSheet  = getOrCreateSheet(ss, 'datasets');
  var natSheet = getOrCreateSheet(ss, 'rows_nacional');
  var enemSheet= getOrCreateSheet(ss, 'rows_enem');

  var datasets = sheetToObjects(dsSheet);
  var nacional = sheetToObjects(natSheet);
  var enem     = sheetToObjects(enemSheet);

  // Reagrupa linhas por dataset
  var result = datasets.map(function(ds) {
    if (ds.model === 'nacional') {
      ds.rows = nacional
        .filter(function(r) { return r.datasetId === ds.id; })
        .map(function(r) { return nacionalRowToRecord(r); });
    } else {
      ds.rows = enem
        .filter(function(r) { return r.datasetId === ds.id; })
        .map(function(r) { return enemRowToRecord(r); });
    }
    ds.rowCount = parseInt(ds.rowCount) || ds.rows.length;
    return ds;
  });

  return jsonResponse({ ok: true, datasets: result });
}

/** Status rápido (ping) */
function actionGetStatus() {
  var ss = getSpreadsheet();
  var dsSheet = getOrCreateSheet(ss, 'datasets');
  var count   = Math.max(0, dsSheet.getLastRow() - 1);
  return jsonResponse({ ok: true, datasetsCount: count, spreadsheetName: ss.getName() });
}

/** Salva um dataset e suas linhas */
function actionSaveDataset(body) {
  var dataset = body.dataset;
  if (!dataset || !dataset.id) return jsonResponse({ error: 'Dataset inválido.' });

  var ss       = getSpreadsheet();
  var dsSheet  = getOrCreateSheet(ss, 'datasets');

  // Remove dataset existente com mesmo id
  deleteRowsById(dsSheet, 'id', dataset.id);

  // Salva metadados
  dsSheet.appendRow([
    dataset.id,
    dataset.filename,
    dataset.model,
    dataset.importedAt,
    dataset.rows ? dataset.rows.length : 0
  ]);

  // Salva linhas
  if (dataset.model === 'nacional') {
    var natSheet = getOrCreateSheet(ss, 'rows_nacional');
    deleteRowsById(natSheet, 'datasetId', dataset.id);
    dataset.rows.forEach(function(row) {
      natSheet.appendRow(recordToNacionalRow(dataset.id, row));
    });
  } else if (dataset.model === 'enem') {
    var enemSheet = getOrCreateSheet(ss, 'rows_enem');
    deleteRowsById(enemSheet, 'datasetId', dataset.id);
    dataset.rows.forEach(function(row) {
      enemSheet.appendRow(recordToEnemRow(dataset.id, row));
    });
  }

  return jsonResponse({ ok: true, saved: dataset.id });
}

/** Remove um dataset pelo id */
function actionDeleteDataset(body) {
  var id = body.id;
  if (!id) return jsonResponse({ error: 'ID não informado.' });

  var ss = getSpreadsheet();
  deleteRowsById(getOrCreateSheet(ss, 'datasets'),    'id',        id);
  deleteRowsById(getOrCreateSheet(ss, 'rows_nacional'),'datasetId', id);
  deleteRowsById(getOrCreateSheet(ss, 'rows_enem'),   'datasetId', id);

  return jsonResponse({ ok: true, deleted: id });
}

/** Limpa todos os dados (cuidado!) */
function actionClearAll() {
  var ss = getSpreadsheet();
  ['datasets', 'rows_nacional', 'rows_enem'].forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  });
  return jsonResponse({ ok: true, message: 'Todos os dados foram removidos.' });
}

// ── HELPERS ───────────────────────────────────────────

function sheetToObjects(sheet) {
  if (sheet.getLastRow() < 2) return [];
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function deleteRowsById(sheet, keyCol, id) {
  if (sheet.getLastRow() < 2) return;
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var colIdx  = headers.indexOf(keyCol);
  if (colIdx < 0) return;

  // Iterate backwards to avoid index shifting
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
    }
  }
}

function recordToNacionalRow(datasetId, r) {
  return [
    datasetId, r.aluno || '', r.unidade || '', r.serie || '', r.turma || '',
    r.atividade || '', r.dataInicio || '', r.dataEntrega || '',
    s(r.scores, 'ingles'), s(r.scores, 'arte'), s(r.scores, 'biologia'),
    s(r.scores, 'filosofia'), s(r.scores, 'fisica'), s(r.scores, 'geografia'),
    s(r.scores, 'historia'), s(r.scores, 'literatura'), s(r.scores, 'matematica'),
    s(r.scores, 'portugues'), s(r.scores, 'quimica'), s(r.scores, 'sociologia'),
    r.total != null ? r.total : ''
  ];
}

function recordToEnemRow(datasetId, r) {
  return [
    datasetId, r.aluno || '', r.simulado || '', r.escola || '',
    r.serie || '', r.turma || '',
    n(r.rankingEscola), n(r.rankingRede), n(r.mediaTri),
    n(r.tri, 'lgg'), n(r.tri, 'chs'), n(r.tri, 'cnt'),
    n(r.tri, 'mat'), n(r.tri, 'redacao'),
    n(r.acerto, 'lgg'), n(r.acerto, 'chs'), n(r.acerto, 'cnt'), n(r.acerto, 'mat'),
    n(r.redacao, 'c1'), n(r.redacao, 'c2'), n(r.redacao, 'c3'),
    n(r.redacao, 'c4'), n(r.redacao, 'c5')
  ];
}

function s(obj, key) { return (obj && obj[key] != null) ? obj[key] : ''; }
function n(obj, key) {
  if (key === undefined) return obj != null ? obj : '';
  return (obj && obj[key] != null) ? obj[key] : '';
}

function nacionalRowToRecord(r) {
  return {
    aluno: r.aluno, unidade: r.unidade, serie: r.serie, turma: r.turma,
    atividade: r.atividade, dataInicio: r.dataInicio, dataEntrega: r.dataEntrega,
    scores: {
      ingles: toNum(r.ingles), arte: toNum(r.arte), biologia: toNum(r.biologia),
      filosofia: toNum(r.filosofia), fisica: toNum(r.fisica), geografia: toNum(r.geografia),
      historia: toNum(r.historia), literatura: toNum(r.literatura),
      matematica: toNum(r.matematica), portugues: toNum(r.portugues),
      quimica: toNum(r.quimica), sociologia: toNum(r.sociologia)
    },
    total: toNum(r.total),
    _type: 'nacional'
  };
}

function enemRowToRecord(r) {
  return {
    aluno: r.aluno, simulado: r.simulado, escola: r.escola,
    serie: r.serie, turma: r.turma,
    rankingEscola: toNum(r.rankingEscola), rankingRede: toNum(r.rankingRede),
    mediaTri: toNum(r.mediaTri),
    tri: {
      lgg: toNum(r.tri_lgg), chs: toNum(r.tri_chs),
      cnt: toNum(r.tri_cnt), mat: toNum(r.tri_mat),
      redacao: toNum(r.tri_redacao)
    },
    acerto: {
      lgg: toNum(r.acerto_lgg), chs: toNum(r.acerto_chs),
      cnt: toNum(r.acerto_cnt), mat: toNum(r.acerto_mat)
    },
    redacao: {
      c1: toNum(r.red_c1), c2: toNum(r.red_c2), c3: toNum(r.red_c3),
      c4: toNum(r.red_c4), c5: toNum(r.red_c5)
    },
    _type: 'enem'
  };
}

function toNum(v) {
  var n = parseFloat(v);
  return isNaN(n) ? null : n;
}
