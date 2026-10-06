import { fmt, fmtPct } from '../lib/data';

export default function MunicipioRanking({ municipios, selected, onSelect }) {
  const max = Math.max(1, ...municipios.map((m) => m.votos));
  return (
    <div className="ranking-list" data-testid="chart-municipios">
      {municipios.map((m, i) => (
        <button key={m.municipio} className="ranking-row" aria-label={`Filtrar ${m.municipio}`} aria-pressed={selected === m.municipio} onClick={() => onSelect(m.municipio)}>
          <span className="ranking-position">{String(i + 1).padStart(2, '0')}</span>
          <span className="ranking-city"><span>{m.municipio}</span><span className="ranking-track"><i style={{ width: `${m.votos / max * 100}%` }} /></span></span>
          <span className="ranking-values"><strong>{fmt(m.votos)}</strong><small>{fmtPct(m.pct)}</small></span>
        </button>
      ))}
    </div>
  );
}
