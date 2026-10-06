import { expect, test } from '@playwright/test';

const mockIbge = (page) =>
  page.route('**/servicodados.ibge.gov.br/**', (route) => {
    const code = Number(route.request().url().match(/municipios\/(\d+)/)[1]);
    const x = -46.8 + (code % 10) * 0.08;
    const ring = [[x, -24], [x, -23.93], [x + 0.07, -23.93], [x + 0.07, -24], [x, -24]];
    route.fulfill({ json: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }] } });
  });

test('mostra totais e não estoura a largura da tela', async ({ page }) => {
  await mockIbge(page);
  await page.goto('/');
  await expect(page.getByTestId('kpi-votos')).toHaveText('12.347');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('filtra por cargo', async ({ page }) => {
  await mockIbge(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Senado', exact: true }).click();
  await expect(page.getByTestId('kpi-votos')).toHaveText('5.934');
  await page.getByRole('combobox', { name: /Candidatura/ }).selectOption('Maíra de Souza');
  await expect(page.getByTestId('kpi-votos')).toHaveText('4.243');
});

test('mapa seleciona município e limpa a seleção', async ({ page }) => {
  await mockIbge(page);
  await page.goto('/');
  await expect(page.locator('[data-municipio]')).toHaveCount(9);
  await page.locator('[data-municipio="Santos"]').dispatchEvent('click');
  await expect(page.getByTestId('kpi-votos')).toHaveText('3.686');
  await page.getByRole('button', { name: /Limpar Santos/ }).click();
  await expect(page.getByTestId('kpi-votos')).toHaveText('12.347');
});

test('mantém o painel funcionando se o IBGE falhar', async ({ page }) => {
  await page.route('**/servicodados.ibge.gov.br/**', (r) => r.abort());
  await page.goto('/');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('kpi-votos')).toHaveText('12.347');
});
