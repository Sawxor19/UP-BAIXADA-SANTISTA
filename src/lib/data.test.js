import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { byCandidatura, byMunicipio, filterRows, parseCsv, share, sum } from './data';
import { rewind } from './ibge';

const rows = parseCsv(readFileSync('src/data/up-baixada-2026-all.csv', 'utf8'));

describe('dados', () => {
  it('lê 99 linhas com BOM e decimais em vírgula', () => {
    expect(rows).toHaveLength(99);
    expect(rows[0].municipio).toBe('Peruíbe');
    expect(rows[0].participacao_regional_percentual).toBeCloseTo(3.0403, 4);
  });
  it('soma os votos da região', () => expect(sum(rows)).toBe(12347));
  it('Santos lidera e os percentuais fecham 100%', () => {
    const m = byMunicipio(rows);
    expect(m[0]).toMatchObject({ municipio: 'Santos', votos: 3686 });
    expect(m.reduce((s, x) => s + x.pct, 0)).toBeCloseTo(100, 6);
  });
  it('filtra por cargo e candidatura', () => {
    expect(sum(filterRows(rows, { cargo: 'Senado' }))).toBe(5934);
    expect(sum(filterRows(rows, { candidatura: 'Vivian Mendes' }))).toBe(3574);
    expect(byCandidatura(filterRows(rows, { cargo: 'Dep. federal' }))).toHaveLength(5);
  });
  it('participacao_regional_percentual confere com o cálculo', () => {
    const totals = {};
    rows.forEach((r) => (totals[r.candidatura] = (totals[r.candidatura] ?? 0) + r.votos));
    rows.forEach((r) => expect(share(r.votos, totals[r.candidatura])).toBeCloseTo(r.participacao_regional_percentual, 2));
  });
  it('share lida com total zero', () => expect(share(5, 0)).toBe(0));
});

describe('geometria', () => {
  it('inverte anel anti-horário para horário', () => {
    const ccw = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    const out = rewind({ type: 'Polygon', coordinates: [ccw] }).coordinates[0];
    expect(out[1]).toEqual([0, 1]);
  });
});
