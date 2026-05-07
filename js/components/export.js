// columns: [{ key, label, value? }]
// value(row) es opcional; si no está, se usa row[key]

function escXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getCell(row, col) {
  return col.value ? col.value(row) : (row[col.key] ?? '');
}

export function downloadCsv(filename, rows, columns) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const lines = rows.map(row =>
    columns.map(c => {
      const val = String(getCell(row, c));
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',')
  );
  const blob = new Blob(['﻿' + [header, ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function downloadXlsx(filename, rows, columns) {
  const headerRow = `<Row>${columns.map(c => `<Cell><Data ss:Type="String">${escXml(c.label)}</Data></Cell>`).join('')}</Row>`;
  const dataRows = rows.map(row => {
    const cells = columns.map(c => {
      const raw = getCell(row, c);
      const type = typeof raw === 'number' ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${type}">${escXml(String(raw ?? ''))}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    '<Worksheet ss:Name="Datos"><Table>',
    headerRow,
    dataRows,
    '</Table></Worksheet></Workbook>',
  ].join('');

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  triggerDownload(blob, filename);
}
