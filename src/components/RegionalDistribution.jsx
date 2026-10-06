import { fmtPct, share } from '../lib/data';

export default function RegionalDistribution({ municipios, total }) {
  const top = municipios.slice(0, 4);
  const pct = share(top.reduce((sum, m) => sum + m.votos, 0), total);
  return (
    <div className="regional-distribution">
      <div className="distribution-ring" role="img" aria-label={`${fmtPct(pct)} dos votos nos quatro maiores municípios`} style={{ '--distribution-angle': `${pct * 3.6}deg` }}><div><strong>{fmtPct(pct)}</strong><span>nos 4 maiores</span></div></div>
      <p>{total ? <>Os votos se concentram em <strong>{top.map((m) => m.municipio).join(', ')}</strong>.</> : 'Este recorte não possui votos.'}</p>
      <div className="distribution-legend"><span><i />4 maiores municípios<strong>{fmtPct(pct)}</strong></span><span><i />Demais municípios<strong>{fmtPct(total ? 100 - pct : 0)}</strong></span></div>
    </div>
  );
}
