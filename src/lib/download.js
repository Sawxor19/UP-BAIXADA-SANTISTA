export function downloadCsv(rows, columns) {
  const cell = (value) => {
    const text = typeof value === 'number' ? String(value).replace('.', ',') : String(value ?? '');
    return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const content = '\uFEFF' + [columns.join(';'), ...rows.map((row) => columns.map((column) => cell(row[column])).join(';'))].join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'up-baixada-2026-selecao.csv' });
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
