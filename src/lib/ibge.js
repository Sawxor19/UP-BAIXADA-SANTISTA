export const MUNICIPIOS = {
  3506359: 'Bertioga', 3513504: 'Cubatão', 3518701: 'Guarujá', 3522109: 'Itanhaém', 3531100: 'Mongaguá',
  3537602: 'Peruíbe', 3541000: 'Praia Grande', 3548500: 'Santos', 3551009: 'São Vicente',
};

const area = (ring) => ring.reduce((s, [x, y], i) => { const [a, b] = ring[(i + 1) % ring.length]; return s + (x * b - a * y); }, 0) / 2;

/** d3-geo exige anel externo horário e furos anti-horários. */
export function rewind(geometry) {
  const fix = (poly) => poly.map((ring, i) => ((i === 0) === (area(ring) < 0) ? ring : [...ring].reverse()));
  if (geometry.type === 'Polygon') return { ...geometry, coordinates: fix(geometry.coordinates) };
  if (geometry.type === 'MultiPolygon') return { ...geometry, coordinates: geometry.coordinates.map(fix) };
  return geometry;
}

/** Baixa os limites oficiais (API de Malhas do IBGE) dos 9 municípios. */
export async function loadGeo(signal) {
  const features = await Promise.all(
    Object.entries(MUNICIPIOS).map(async ([code, name]) => {
      const url = `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${code}?formato=application/vnd.geo+json&qualidade=intermediaria`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Falha ao carregar limites do IBGE (${res.status}).`);
      const json = await res.json();
      return { type: 'Feature', properties: { codarea: code, name }, geometry: rewind(json.features[0].geometry) };
    }),
  );
  return { type: 'FeatureCollection', features };
}
