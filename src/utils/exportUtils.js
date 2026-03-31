import * as XLSX from 'xlsx';

export function exportToXLSX(data, filename = 'produtos_clusterizados') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  autoFitColumns(worksheet, data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(data, filename = 'produtos_clusterizados') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function autoFitColumns(worksheet, data) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  worksheet['!cols'] = keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.slice(0, 200).map((row) => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLen + 2, 60) };
  });
}
