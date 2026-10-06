import { useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpRight, BarChart3, BookOpen, Check, ChevronRight, Copy, Download, LayoutDashboard, Map as MapIcon, Maximize2, Minimize2, PieChart, RotateCcw, SlidersHorizontal, Table2, Trophy, Users, Vote, X } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import csv from './data/up-baixada-2026-all.csv?raw';
import { byCandidatura, byMunicipio, filterRows, fmt, fmtPct, parseCsv, share, sum } from './lib/data';
import { downloadCsv } from './lib/download';
import { loadGeo, MUNICIPIOS } from './lib/ibge';
import BrMap from './components/BrMap';
import MunicipioRanking from './components/MunicipioRanking';
import RegionalDistribution from './components/RegionalDistribution';

const ALL = parseCsv(csv);
const CARGOS = [...new Set(ALL.map((r) => r.cargo))];
const CIDADES = Object.values(MUNICIPIOS).sort((a, b) => a.localeCompare(b, 'pt-BR'));
const COLORS = { Senado: '#bb4258', 'Governo SP': '#6b9e98', Presidência: '#bc985b', 'Dep. estadual': '#9582b0', 'Dep. federal': '#7498b5' };
const params = new URLSearchParams(window.location.search);
const INITIAL_CARGO = CARGOS.includes(params.get('cargo')) ? params.get('cargo') : '';
const INITIAL_CAND = ALL.some((r) => r.candidatura === params.get('candidatura') && (!INITIAL_CARGO || r.cargo === INITIAL_CARGO)) ? params.get('candidatura') : '';
const INITIAL_CITY = CIDADES.includes(params.get('municipio')) ? params.get('municipio') : '';

function PanelHeading({ icon: Icon, title, subtitle, children }) {
  return <div className="panel-heading"><div><h2><Icon size={18} aria-hidden />{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}</div>;
}

export default function App() {
  const [cargo, setCargo] = useState(INITIAL_CARGO);
  const [cand, setCand] = useState(INITIAL_CAND);
  const [sel, setSel] = useState(INITIAL_CITY);
  const [geo, setGeo] = useState(null);
  const [err, setErr] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [sort, setSort] = useState('votos');
  const [feedback, setFeedback] = useState('');
  const [activeSection, setActiveSection] = useState(window.location.hash.slice(1) || 'visao-geral');

  useEffect(() => {
    const ctl = new AbortController();
    loadGeo(ctl.signal).then(setGeo).catch((e) => e.name !== 'AbortError' && setErr(e.message || 'Falha ao carregar limites do IBGE.'));
    return () => ctl.abort();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    for (const [key, value] of [['cargo', cargo], ['candidatura', cand], ['municipio', sel]]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(null, '', url);
  }, [cargo, cand, sel]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const candidatos = useMemo(() => [...new Set(ALL.filter((r) => !cargo || r.cargo === cargo).map((r) => r.candidatura))], [cargo]);
  const rows = useMemo(() => filterRows(ALL, { cargo, candidatura: cand }), [cargo, cand]);
  const muni = useMemo(() => byMunicipio(rows), [rows]);
  const values = useMemo(() => Object.fromEntries(muni.map((m) => [m.municipio, m])), [muni]);
  const shown = useMemo(() => sel ? rows.filter((r) => r.municipio === sel) : rows, [rows, sel]);
  const hasFilter = Boolean(cargo || cand || sel);
  const cands = useMemo(() => {
    const grouped = byCandidatura(shown);
    return sort === 'nome' ? grouped.sort((a, b) => a.candidatura.localeCompare(b.candidatura, 'pt-BR')) : grouped;
  }, [shown, sort]);
  const total = sum(shown);
  const regionalTotal = sum(rows);
  const topFourPct = share(muni.slice(0, 4).reduce((s, m) => s + m.votos, 0), regionalTotal);
  const toggle = (m) => setSel((s) => s === m ? '' : m);
  const pickCargo = (c) => { setCargo(c); setCand(''); };
  const clearFilters = () => { setCargo(''); setCand(''); setSel(''); };

  const navigation = [
    { id: 'visao-geral', icon: LayoutDashboard, label: 'Visão geral' },
    { id: 'mapa-territorial', icon: MapIcon, label: 'Mapa territorial' },
    { id: 'candidaturas', icon: BarChart3, label: 'Candidaturas' },
    { id: 'distribuicao', icon: PieChart, label: 'Distribuição' },
    ...(hasFilter ? [{ id: 'resultados', icon: Table2, label: 'Resultados detalhados' }] : []),
  ];

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { rootMargin: '-10% 0px -65% 0px' });
    document.querySelectorAll('[data-nav-section]').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [hasFilter]);

  const exportData = () => {
    downloadCsv(shown, Object.keys(ALL[0]));
    setFeedback(`${fmt(shown.length)} registros exportados em CSV.`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setFeedback('Link da seleção copiado.');
    } catch {
      setFeedback('Copie o endereço do navegador para compartilhar esta seleção.');
    }
  };

  const kpis = [
    { id: 'votos', icon: Vote, label: 'Votos acumulados', value: fmt(total), note: 'Das candidaturas selecionadas', detail: `${cands.length} candidaturas · ${sel ? 1 : muni.length} municípios`, tone: 'rose' },
    { id: 'lider', icon: Trophy, label: 'Município líder', value: muni[0]?.municipio || '–', note: `${fmt(muni[0]?.votos || 0)} votos no recorte regional`, detail: '1º no ranking municipal', tone: 'gold' },
    { id: 'cands', icon: Users, label: 'Candidaturas', value: fmt(cands.length), note: cargo || 'Todos os cargos', detail: sel || 'Toda a Baixada Santista', tone: 'teal' },
    { id: 'peso', icon: PieChart, label: sel ? `Peso de ${sel}` : 'Concentração nos 4 maiores', value: fmtPct(sel ? share(total, regionalTotal) : topFourPct), note: 'Do total regional selecionado', detail: sel ? 'Participação do município' : 'Distribuição territorial', tone: 'violet' },
  ];

  return (
    <div className="dashboard">
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <aside className="sidebar" aria-label="Navegação do dashboard">
        <a className="brand" href="#visao-geral" onClick={() => setActiveSection('visao-geral')}><span className="brand-mark">UP<span>80</span></span><span><strong>Observatório UP</strong><small>BAIXADA SANTISTA</small></span></a>
        <div className="sidebar-context"><MapIcon size={14} aria-hidden /><span>Análise eleitoral</span><span className="year-tag">2026</span></div>
        <p className="nav-label">EXPLORAR</p>
        <nav aria-label="Seções">{navigation.map(({ id, icon: Icon, label }) => <a key={id} href={`#${id}`} className={activeSection === id ? 'nav-link active' : 'nav-link'} aria-current={activeSection === id ? 'location' : undefined} onClick={() => setActiveSection(id)}><Icon size={17} aria-hidden /><span>{label}</span><i aria-hidden /></a>)}</nav>
        <div className="sidebar-bottom"><div className="sidebar-note"><span>Um olhar para a região</span><p>Nove municípios.<br />11 candidaturas.<br />Uma leitura territorial.</p><a href="#sobre-dados">Conheça os dados <ArrowUpRight size={13} aria-hidden /></a></div><a className="nav-link methodology-link" href="#sobre-dados"><BookOpen size={17} aria-hidden /><span>Sobre os dados</span></a><div className="sidebar-signature"><strong>UP</strong><span>Unidade Popular<small>Pelo poder popular</small></span></div></div>
      </aside>
      <div className="page-shell">
        <div className="topbar"><span>Observatório eleitoral <ChevronRight size={12} aria-hidden /><strong>Baixada Santista</strong></span><span className="data-status"><i aria-hidden />Dados fornecidos · 1º turno</span></div>
        <main id="conteudo" className="dashboard-main">
          <header id="visao-geral" className="page-header" data-nav-section><div className="page-title"><div className="eyebrow"><span>Eleições 2026</span><span>São Paulo · 1º turno</span></div><h1>Mapa eleitoral da UP<br /><span>na Baixada Santista</span></h1><p>Explore a distribuição dos votos por município, cargo e candidatura nos nove municípios da região.</p></div><div className="header-actions"><button className="action-button" onClick={copyLink}><Copy size={15} aria-hidden />Copiar link</button><button className="action-button primary" onClick={exportData}><Download size={15} aria-hidden />Exportar dados</button></div></header>

          <section className="panel filter-panel" aria-label="Filtros">
            <div className="filter-heading"><span><SlidersHorizontal size={16} aria-hidden />Explore a votação</span>{hasFilter && <button className="text-button" onClick={clearFilters}><RotateCcw size={13} aria-hidden />Limpar filtros</button>}</div>
            <div className="cargo-filter" role="group" aria-label="Cargo">{['', ...CARGOS].map((c) => <button key={c} className="chip" aria-pressed={cargo === c} onClick={() => pickCargo(c)}>{c || 'Todos os cargos'}</button>)}</div>
            <div className="filter-fields"><div className="field"><label htmlFor="candidatura">Candidatura</label><select id="candidatura" value={cand} onChange={(e) => setCand(e.target.value)}><option value="">Todas as candidaturas</option>{candidatos.map((c) => <option key={c}>{c}</option>)}</select></div><div className="field"><label htmlFor="municipio">Município</label><select id="municipio" value={sel} onChange={(e) => setSel(e.target.value)}><option value="">Toda a Baixada Santista</option>{CIDADES.map((m) => <option key={m}>{m}</option>)}</select></div><div className="filter-hint"><span className="status-dot" /><p>Visualizando<br /><strong>{sel || 'a região completa'}</strong></p></div></div>
            {hasFilter && <div className="active-filters" aria-label="Filtros ativos">{cargo && <button onClick={() => pickCargo('')}>{cargo}<X size={12} aria-hidden /><span className="sr-only">Remover filtro de cargo</span></button>}{cand && <button onClick={() => setCand('')}>{cand}<X size={12} aria-hidden /><span className="sr-only">Remover filtro de candidatura</span></button>}{sel && <button aria-label={`Limpar ${sel}`} onClick={() => setSel('')}>{sel}<X size={12} aria-hidden /></button>}</div>}
          </section>

          <div className="section-kicker"><span>{sel ? 'VISÃO MUNICIPAL' : 'VISÃO REGIONAL'}</span><span>{cand || cargo || 'Todas as candidaturas'}</span></div>
          <section className="kpi-grid" aria-label="Indicadores">{kpis.map(({ id, icon: Icon, label, value, note, detail, tone }) => <article key={id} className={`panel kpi-card ${tone}`}><div className="kpi-heading"><span>{label}</span><span className="kpi-icon"><Icon size={15} aria-hidden /></span></div><p className="kpi-value" data-testid={`kpi-${id}`}>{value}</p><p className="kpi-note">{note}</p><p className="kpi-detail">{detail}</p></article>)}</section>

          <div id="mapa-territorial" className={`territory-grid${expanded ? ' is-expanded' : ''}`} data-nav-section>
            <section className="panel map-panel" aria-label="Mapa"><PanelHeading icon={MapIcon} title="Distribuição territorial" subtitle={cand ? `Votos de ${cand}` : 'Votos acumulados das candidaturas selecionadas'}><button className="subtle-button" aria-pressed={expanded} onClick={() => setExpanded((v) => !v)}>{expanded ? <Minimize2 size={13} aria-hidden /> : <Maximize2 size={13} aria-hidden />}{expanded ? 'Reduzir mapa' : 'Ampliar mapa'}</button></PanelHeading>{geo ? <BrMap geo={geo} values={values} selected={sel} onSelect={toggle} /> : err ? <div className="map-message" role="alert"><MapIcon size={28} aria-hidden /><p>{err}</p><span>Os filtros e gráficos continuam disponíveis. Recarregue a página para tentar novamente.</span></div> : <div className="map-message" aria-busy="true"><span className="loading-ring" /><p>Carregando limites do IBGE…</p><span>Preparando os nove municípios da região.</span></div>}</section>
            <section className="panel ranking-panel" aria-label="Votos por município"><PanelHeading icon={ArrowDownWideNarrow} title="Ranking municipal" subtitle="Participação no recorte regional"><span className="count-badge">{muni.length}</span></PanelHeading><MunicipioRanking municipios={muni} selected={sel} onSelect={toggle} /><p className="panel-footnote">Clique em um município para explorar sua votação.</p></section>
          </div>

          <div className="comparison-grid">
            <section id="candidaturas" className="panel candidates-panel" aria-label="Votos por candidatura" data-nav-section><PanelHeading icon={BarChart3} title="Votos por candidatura" subtitle={`${sel ? `Em ${sel}` : 'Em toda a região'} · ${cands.length} candidaturas`}><div className="segmented-control" role="group" aria-label="Ordenar candidaturas"><button aria-pressed={sort === 'votos'} onClick={() => setSort('votos')}>Por votação</button><button aria-pressed={sort === 'nome'} onClick={() => setSort('nome')}>Por nome</button></div></PanelHeading><div className="chart-legend">{[...new Set(cands.map((c) => c.cargo))].map((c) => <span key={c}><i style={{ background: COLORS[c] }} />{c}</span>)}</div><div className="candidate-chart" style={{ height: 40 + cands.length * 37 }}><ResponsiveContainer><BarChart data={cands} layout="vertical" margin={{ top: 4, right: 22, bottom: 4 }}><XAxis type="number" hide /><YAxis type="category" dataKey="candidatura" width={142} tick={{ fontSize: 11, fill: '#697180' }} axisLine={false} tickLine={false} /><Tooltip formatter={(v, _n, p) => [`${fmt(v)} votos`, p.payload.cargo]} contentStyle={{ border: '1px solid #e8e9ee', borderRadius: 9, fontSize: 12 }} cursor={{ fill: '#f6f7f9' }} /><Bar dataKey="votos" radius={[0, 4, 4, 0]} maxBarSize={20} cursor="pointer" onClick={(d) => setCand((c) => c === d.candidatura ? '' : d.candidatura)}>{cands.map((c) => <Cell key={c.candidatura} fill={COLORS[c.cargo] || '#bb4258'} />)}</Bar></BarChart></ResponsiveContainer></div><p className="panel-footnote">Selecione uma barra para filtrar por candidatura.</p></section>
            <section id="distribuicao" className="panel distribution-panel" aria-label="Concentração regional" data-nav-section><PanelHeading icon={PieChart} title="Concentração regional" subtitle="Distribuição dos votos na região" /><RegionalDistribution municipios={muni} total={regionalTotal} /><button className="text-button distribution-action" onClick={() => { if (muni[0]) setSel(muni[0].municipio); }}>{sel === muni[0]?.municipio ? 'Município líder selecionado' : 'Explorar município líder'}<ArrowUpRight size={13} aria-hidden /></button></section>
          </div>

          {hasFilter && <section id="resultados" className="panel results-panel" aria-label="Tabela" data-nav-section><PanelHeading icon={Table2} title="Resultados detalhados" subtitle={`${fmt(shown.length)} registros · ${sel || 'Toda a região'}`}><button className="subtle-button" onClick={exportData}><Download size={13} aria-hidden />Exportar CSV</button></PanelHeading><div className="table-scroll"><table><caption className="sr-only">Resultados detalhados</caption><thead><tr>{['Município', 'Candidatura', 'Cargo', 'Nº', 'Votos', '% da candidatura na região'].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{[...shown].sort((a, b) => b.votos - a.votos).map((r) => <tr key={r.municipio + r.candidatura}><td>{r.municipio}</td><td className="candidate-cell">{r.candidatura}</td><td><span className="office-badge" style={{ '--office-color': COLORS[r.cargo] }}>{r.cargo}</span></td><td>{r.numero}</td><td className="numeric-cell">{fmt(r.votos)}</td><td className="numeric-cell">{fmtPct(r.participacao_regional_percentual)}</td></tr>)}</tbody></table></div><p className="panel-footnote">Os percentuais representam a participação do município nos votos regionais de cada candidatura.</p></section>}

          <section id="sobre-dados" className="panel methodology-panel" aria-label="Sobre os dados" data-nav-section><PanelHeading icon={BookOpen} title="Sobre os dados" subtitle="Escopo e interpretação dos indicadores" /><div className="methodology-content"><div><h3>Uma leitura da região</h3><p>Dados fornecidos pelo usuário para o 1º turno de 2026: {ALL.length} registros, {CIDADES.length} municípios e {new Set(ALL.map((r) => r.candidatura)).size} candidaturas. Os limites municipais são carregados da API de Malhas do IBGE.</p></div><div><h3>Como interpretar</h3><p>Votos acumulados somam candidaturas de cargos diferentes. Os percentuais mostram a distribuição regional desses votos, e não a porcentagem dos votos válidos de cada município.</p></div></div></section>
          <footer className="page-footer"><span>Observatório UP · Baixada Santista</span><span>Dados fornecidos · Eleições 2026</span><a href="#visao-geral">Voltar ao topo ↑</a></footer>
        </main>
      </div>
      {feedback && <div className="feedback-toast" role="status"><Check size={16} aria-hidden />{feedback}</div>}
    </div>
  );
}
