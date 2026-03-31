import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            columns: results.meta.fields || [],
            rows: results.data,
          });
        },
        error: (error) => reject(error),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
          resolve({ columns, rows: jsonData });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Formato não suportado. Use .csv ou .xlsx'));
    }
  });
}
