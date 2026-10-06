# Mapa eleitoral da UP · Baixada Santista

Dashboard em React e Vite para explorar votos por cargo, candidatura e município, com navegação por seções, mapa IBGE, ranking interativo e concentração regional.

## Executar localmente

Instale o Node.js 24 LTS e execute na pasta do projeto:

```sh
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`. No PowerShell, use `npm.cmd` se a execução de `npm.ps1` estiver bloqueada.

## Explorar os dados

- Selecione um município no mapa, no ranking ou no seletor. As três seleções ficam sincronizadas.
- Combine os filtros de cargo, candidatura e município. “Resultados detalhados” aparece apenas com algum filtro ativo e desaparece ao limpar todos.
- Amplie o mapa e ordene as candidaturas por votação ou nome. No celular, deslize o mapa ampliado horizontalmente para explorar os municípios. Clicar em uma barra filtra a candidatura.
- “Exportar dados” baixa somente os registros do recorte atual, em CSV UTF-8 com BOM, separador `;` e decimal com vírgula.
- “Copiar link” compartilha o recorte atual. Cargo, candidatura e município são preservados nos parâmetros da URL.

Dados: `src/data/up-baixada-2026-all.csv`. Substitua o arquivo mantendo as colunas. Os limites dos nove municípios são carregados da API de Malhas do IBGE no navegador, com conexão à internet. Os votos acumulados somam candidaturas de cargos diferentes; os percentuais descrevem sua distribuição regional.

## Verificar e gerar a versão estática

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

O build gera a pasta `dist/`. A configuração `base: './'` permite servir seus arquivos tanto na raiz de um domínio quanto no caminho de um repositório, como `/up-baixada/`.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie o projeto para a branch `main`, incluindo `package-lock.json` e `.github/workflows/pages.yml`. A `.gitignore` exclui dependências, builds, resultados de testes e arquivos de ambiente.
2. No repositório, abra **Settings → Pages → Build and deployment** e escolha **GitHub Actions** em **Source**.
3. Envie um novo commit para `main`, ou execute **Publicar no GitHub Pages** pela aba **Actions**.
4. O workflow instala as dependências, executa os testes de cálculos, gera o build e publica `dist/`. O endereço aparece em **Settings → Pages** e no ambiente `github-pages`.

Para usar outra branch, ajuste `on.push.branches` no workflow. O dashboard é estático e não depende de backend nem de autenticação do Sites.
