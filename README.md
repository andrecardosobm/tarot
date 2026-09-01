# Oráculo — Plataforma de Tiragens de Tarot

Aplicação web de consultas de Tarot com o baralho tradicional completo de **78 arcanos**
(22 Maiores + 56 Menores). O usuário registra sua intenção, escolhe o método de tiragem,
embaralha a mesa e puxa manualmente as cartas.

## Stack

- **Next.js 16** (App Router, Server + Client Components)
- **React 19**
- **Tailwind CSS 3**
- Animações de virada em CSS 3D puro (sem dependência extra), com respeito a
  `prefers-reduced-motion`
- Persistência local via `localStorage` (sem backend)

## Funcionalidades

**Configuração da consulta**
- Campo de pergunta/intenção (opcional) e tema: Geral, Amor, Trabalho, Espiritualidade
- Métodos: Carta do Dia (1), Três Cartas — Tempo, Três Cartas — Conselho,
  Cruz Céltica (10) e Tiragem Livre (1 a 10 cartas)
- Toggle de cartas invertidas (a inversão é sorteada no momento em que a carta é puxada)

**Duas formas de tirar**
- **Mesa virtual**: o site embaralha as 78 cartas e você puxa na tela
- **Já tirei minhas cartas**: você tirou no seu baralho físico e só registra quais saíram,
  posição a posição, marcando as invertidas — a leitura, a síntese, a IA e o diário
  funcionam igual

**Mesa virtual**
- As 78 cartas em grade rolável, viradas para baixo
- Embaralhamento Fisher-Yates com `crypto.getRandomValues` (com rejeição de módulo para
  evitar viés) e corte do baralho, com animação
- Seleção manual carta a carta até completar as posições da tiragem

**Revelação e interpretação**
- Virada 3D do verso para a frente, individual ou "Revelar todas"
- Por carta: nome, naipe/elemento/número, posição na tiragem e seu significado,
  palavras-chave, Luz, Sombra e Conselho — em versão ereta e invertida
- Síntese da tiragem gerada a partir da composição real das cartas (proporção de Arcanos
  Maiores, naipe dominante, cartas invertidas, arco da primeira à última carta e tema)

**Leitura por IA (opcional)**
- Interpretação da tiragem pelo Gemini (SDK oficial `@google/genai`), em streaming, lendo as
  cartas em conjunto com a pergunta e as posições; modelo selecionável em Ajustes
  (`gemini-flash-latest` por padrão)
- O prompt entrega ao modelo os dados canônicos de cada carta (posição, orientação, luz,
  sombra, conselho), para a leitura ficar ancorada no baralho e não em invenção livre
- Três tons de leitura e limites explícitos no system prompt (sem diagnóstico médico,
  jurídico ou financeiro; encaminhamento ao CVV em caso de risco)
- A síntese determinística continua sendo o padrão; a IA é um complemento e, se falhar
  ou não estiver configurada, nada na aplicação para de funcionar
- Dois modos de credencial — ver `proxy/README.md`:
  1. **chave do próprio usuário** (padrão no Pages), guardada só no `localStorage` do
     navegador e enviada direto para `generativelanguage.googleapis.com`
  2. **proxy próprio** (recomendado para uso público): defina `NEXT_PUBLIC_AI_PROXY_URL`
     e a chave nunca chega ao navegador

**Gestão e compartilhamento**
- Diário de tiragens em `localStorage` (`/diario`)
- Exportação em PNG (desenhado em `<canvas>`) e em PDF (via impressão, com estilo de print)
- Link único de compartilhamento: a tiragem inteira é codificada em base64url na URL
  (`/tiragem?t=...`), sem servidor
- Dicionário pesquisável dos 78 arcanos (`/arcanos`)

## Estrutura

```
app/            rotas (home, /diario, /arcanos, /tiragem)
components/     mesa, carta com flip, painel de leitura, diário, dicionário
lib/majors.js   os 22 Arcanos Maiores (textos autorais)
lib/minors.js   naipes, valores e a essência das 56 cartas menores
lib/deck.js     montagem e indexação do baralho de 78 cartas
lib/spreads.js  métodos de tiragem e o significado de cada posição
lib/random.js   Fisher-Yates + corte com aleatoriedade criptográfica
lib/synthesis.js  gerador da síntese da leitura
lib/share.js    codificação/decodificação da tiragem na URL
lib/storage.js  diário em localStorage
lib/ai.js       prompt, streaming, teste de conexão e erros da leitura por IA (Gemini)
lib/aiSettings.js  preferências de IA (chave, modelo, tom) em localStorage
proxy/          worker opcional que guarda a chave no servidor
lib/exportImage.js  render da tiragem em PNG
```

## Rodando

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Publicação no GitHub Pages

O site é exportado como estático (`output: 'export'`) e publicado pelo workflow
`.github/workflows/deploy.yml` a cada push em `main`.

Para ativar, uma única vez: **Settings → Pages → Source: GitHub Actions**. O endereço
final é `https://<owner>.github.io/<repo>/`.

Detalhes que fazem funcionar em subdiretório:

- `NEXT_PUBLIC_BASE_PATH` é definido no CI como `/<repo>` (ou vazio, se o repositório for
  `<owner>.github.io`) e alimenta `basePath`/`assetPrefix`
- `trailingSlash: true`, para que cada rota vire `pasta/index.html`
- `out/.nojekyll`, sem o qual o Jekyll do Pages descartaria o diretório `_next`
- URLs montadas à mão (o link de compartilhamento) passam por `lib/paths.js`, que
  aplica o mesmo prefixo — os `<Link>` do Next já o aplicam sozinhos

Para reproduzir o build de produção localmente:

```bash
NEXT_PUBLIC_BASE_PATH=/tarot npm run build   # gera ./out
```

Como não há backend, tudo (diário, exportações e link compartilhável) continua
funcionando no Pages.

## Assets visuais

Por padrão as lâminas são renderizadas de forma tipográfica/vetorial em
`components/CardArt.jsx`, sem depender de imagens externas.

Para usar ilustrações de verdade, coloque os arquivos em uma pasta e rode:

```bash
node scripts/import-cards.mjs <pasta-com-as-imagens>
```

O script identifica a carta pelo nome do arquivo (reconhece os esquemas mais comuns dos
baralhos Rider-Waite-Smith em domínio público — `ar00`, `waac`, `cups-05`,
`ace_of_swords`, `rei-de-ouros` …), converte para WebP de 500px e regenera o manifesto
`lib/cardImages.js`. Arquivos não reconhecidos são listados no fim, em vez de adivinhados.

Cada carta é independente: quem tem imagem usa a imagem, quem não tem continua com a arte
tipográfica — dá para importar o baralho aos poucos.

**Sobre direitos:** o baralho Rider-Waite-Smith de 1909, ilustrado por Pamela Colman Smith,
está em domínio público nos EUA (publicação anterior a 1929) e nos países de "vida + 70
anos" desde 2022 (Smith morreu em 1951). Ao importar digitalizações de terceiros, confira os
termos de uso do site de origem e credite a fonte.

## Escopo por fase

- **Fase 1 (MVP)** — completa: 78 cartas, tiragens de 1 e 3 cartas, conteúdo dos arcanos, flip.
- **Fase 2** — completa: Cruz Céltica, tiragem livre, cartas invertidas, diário em
  `localStorage`, exportação PNG/PDF e link compartilhável.
- **Fase 3** — pendente: autenticação, histórico na nuvem (PostgreSQL/Supabase) e síntese
  assistida por IA. A síntese atual é determinística, gerada da própria composição da tiragem.
