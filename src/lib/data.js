const NUMERIC = ['numero', 'votos', 'participacao_regional_percentual', 'ano', 'turno'];

/** Lê o CSV (separador ";", decimal com vírgula, BOM opcional). */
export function parseCsv(text) {
  const [head, ...lines] = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const cols = head.split(';');
  return lines.filter(Boolean).map((line) => {
    const cells = line.split(';');
    return Object.fromEntries(
      cols.map((c, i) => [c, NUMERIC.includes(c) ? Number(cells[i].replace(',', '.')) : cells[i]]),
    );
  });
}

export const sum = (rows) => rows.reduce((s, r) => s + r.votos, 0);
export const share = (part, total) => (total ? (part / total) * 100 : 0);
export const fmt = (n) => new Intl.NumberFormat('pt-BR').format(n);
export const fmtPct = (n) => `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)}%`;

export function filterRows(rows, { cargo = '', candidatura = '' } = {}) {
  return rows.filter((r) => (!cargo || r.cargo === cargo) && (!candidatura || r.candidatura === candidatura));
}

function group(rows, key, extra = () => ({})) {
  const map = new Map();
  for (const r of rows) {
    const cur = map.get(r[key]) ?? { [key]: r[key], votos: 0, ...extra(r) };
    cur.votos += r.votos;
    map.set(r[key], cur);
  }
  const total = sum(rows);
  return [...map.values()].map((g) => ({ ...g, pct: share(g.votos, total) })).sort((a, b) => b.votos - a.votos);
}

export const byMunicipio = (rows) => group(rows, 'municipio');
export const byCandidatura = (rows) => group(rows, 'candidatura', (r) => ({ cargo: r.cargo, numero: r.numero }));
