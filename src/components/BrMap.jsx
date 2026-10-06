import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { MousePointer2, Navigation } from 'lucide-react';
import { fmt, fmtPct } from '../lib/data';

const W = 640, H = 460;
const fill = (v, max) => `color-mix(in srgb, #bb4258 ${Math.round(12 + 88 * Math.sqrt(v / max))}%, #fff)`;

export default function BrMap({ geo, values, selected, onSelect }) {
  const [hover, setHover] = useState('');
  const shapes = useMemo(() => {
    const path = geoPath(geoMercator().fitExtent([[8, 8], [W - 8, H - 8]], geo));
    return geo.features.map((f) => ({ name: f.properties.name, d: path(f), c: path.centroid(f) }));
  }, [geo]);
  const max = Math.max(1, ...Object.values(values).map((v) => v.votos));
  const info = values[hover || selected];

  return (
    <div className="map-content">
      <div className="map-stage">
        <span className="map-tag"><i />Baixada Santista · 9 municípios</span>
        <span className="map-state-label" aria-hidden>ESTADO DE SÃO PAULO</span>
        <span className="map-ocean-label" aria-hidden>OCEANO ATLÂNTICO</span>
        <span className="map-compass" aria-hidden>N<Navigation /></span>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Mapa dos municípios da Baixada Santista">
        {shapes.map((s) => {
          const v = values[s.name]?.votos ?? 0;
          return (
            <path key={s.name} d={s.d} data-municipio={s.name} className="region" style={{ fill: fill(v, max) }}
              role="button" tabIndex={0} aria-pressed={selected === s.name}
              aria-label={`${s.name}: ${fmt(v)} votos`}
              onClick={() => onSelect(s.name)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(s.name))}
              onMouseEnter={() => setHover(s.name)} onMouseLeave={() => setHover('')} onFocus={() => setHover(s.name)} onBlur={() => setHover('')} />
          );
        })}
        {shapes.map((s) => <text key={s.name} x={s.c[0]} y={s.c[1]} textAnchor="middle" className="map-label">{s.name}</text>)}
      </svg>
      </div>
      <div className="map-info" aria-live="polite"><MousePointer2 size={12} aria-hidden /><span>{info ? <><strong>{info.municipio}</strong>: {fmt(info.votos)} votos ({fmtPct(info.pct)})</> : 'Selecione um município para explorar sua votação.'}</span></div>
      <div className="map-legend">
        <span>Votos absolutos<span className="legend-scale">0<i />{fmt(max)}</span></span>
        <span>Mapa vetorial<br />Limites municipais · IBGE</span>
      </div>
    </div>
  );
}
