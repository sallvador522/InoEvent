/**
 * CSV — exportação de tabelas do admin (padrão do Dashboard de evento).
 */
export function toCSV(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const esc = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map(esc).join(';');
  const body = rows.map((r) => columns.map((c) => esc(r[c])).join(';')).join('\n');
  return `\uFEFF${head}\n${body}`;
}

export function downloadCSV(filename: string, rows: Array<Record<string, unknown>>, columns: string[]): void {
  const blob = new Blob([toCSV(rows, columns)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
