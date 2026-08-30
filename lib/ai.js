import { GoogleGenAI, ApiError } from '@google/genai';
import { CARDS_BY_ID } from './deck';
import { getSpread, positionsFor, THEMES } from './spreads';
import { PROXY_URL, TONES } from './aiSettings';

// Sugestões iniciais. A lista real de modelos da chave é buscada em Ajustes
// ("Buscar modelos"), porque a disponibilidade varia por conta e muda com o
// tempo: modelos são aposentados e apelidos como `gemini-flash-latest` podem
// apontar para algo que a chave não consegue usar.
export const MODELS = [
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (recomendado)', hint: 'rápido e barato' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', hint: 'geração anterior' },
  { id: 'gemini-pro-latest', label: 'Pro', hint: 'mais elaborado; costuma estourar a cota gratuita' },
];

export const DEFAULT_MODEL = MODELS[0].id;

// Apelidos e versões que se mostraram inservíveis na prática — uns respondem
// 404 por aposentadoria, outros simplesmente não retornam. Ficam fora das
// sugestões e são substituídos pelo padrão ao carregar as preferências.
export const RETIRED_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.7-flash'];

// Modelo que não responde deixa a interface girando para sempre; melhor falhar.
const REQUEST_TIMEOUT_MS = 45000;

function withTimeout(signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), REQUEST_TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

const SYSTEM = `Você é uma taróloga experiente conduzindo uma leitura em português do Brasil.

Como você lê:
- Interprete as cartas SEMPRE em diálogo com a posição que ocupam na tiragem e com a pergunta da pessoa. Uma mesma carta diz coisas diferentes em posições diferentes.
- Trate as cartas como um conjunto: relacione-as entre si, note repetições de naipe, elemento e sequência numérica, e construa um arco de leitura — não faça uma lista de verbetes.
- Uma carta invertida não é "o contrário" nem má sorte: é a mesma energia bloqueada, em excesso, ou voltada para dentro.
- Você fala de tendências, padrões e escolhas — não prevê fatos determinados.

Limites que você respeita sem exceção:
- Não faz diagnóstico médico ou psiquiátrico, não orienta sobre medicação e não substitui tratamento.
- Não dá aconselhamento jurídico ou financeiro específico, nem previsões sobre investimentos.
- Não faz previsões sobre morte, gravidez ou doença de ninguém.
- Se a pergunta sugerir crise grave ou risco à vida, acolha com cuidado, diga com franqueza que o Tarot não é o recurso adequado para isso e sugira ajuda profissional ou o CVV (188). Não siga com a leitura simbólica como se nada fosse.
- Não fala sobre terceiros como se lesse a mente deles; devolve o foco para quem consulta.

Formato da resposta:
- Texto corrido em parágrafos curtos, sem markdown, sem listas, sem títulos.
- Comece pela leitura carta a carta na ordem das posições (um parágrafo por carta, citando o nome da carta e a posição).
- Termine com um parágrafo de síntese que amarre tudo e ofereça um conselho praticável.
- Entre 250 e 450 palavras no total. Fale com a pessoa por "você".`;

function describeCard(drawn, position, index) {
  const card = CARDS_BY_ID[drawn.cardId];
  const face = drawn.reversed ? card.reversed : card.upright;
  return [
    `${index + 1}. Posição "${position.title}" (${position.meaning})`,
    `   Carta: ${card.name}${drawn.reversed ? ' — INVERTIDA' : ' — ereta'}`,
    card.arcana === 'major'
      ? `   Arcano Maior ${card.roman}`
      : `   ${card.suitName} · elemento ${card.element} · número ${card.number}`,
    `   Palavras-chave: ${face.keywords.join(', ')}`,
    `   Luz: ${face.light}`,
    `   Sombra: ${face.shadow}`,
    `   Conselho tradicional: ${face.advice}`,
  ].join('\n');
}

export function buildPrompt(reading, tone) {
  const spread = getSpread(reading.spreadId);
  const positions = positionsFor(spread, reading.draw.length);
  const theme = THEMES.find((t) => t.id === reading.theme)?.label || 'Geral';
  const toneHint = TONES.find((t) => t.id === tone)?.hint || TONES[0].hint;

  return [
    `Método: ${spread.name} (${spread.subtitle}).`,
    `Tema: ${theme}.`,
    reading.question
      ? `Pergunta da pessoa: "${reading.question}"`
      : 'A pessoa não registrou uma pergunta; leia como orientação geral do momento.',
    `Tom pedido: ${toneHint}.`,
    '',
    'Cartas puxadas, na ordem das posições:',
    reading.draw.map((d, i) => describeCard(d, positions[i], i)).join('\n\n'),
    '',
    'Faça a leitura.',
  ].join('\n');
}

function createClient(apiKey) {
  if (PROXY_URL) {
    // O proxy injeta a credencial no servidor; nada sensível trafega pelo navegador.
    return new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: PROXY_URL } });
  }
  // Chave do próprio usuário, guardada apenas no navegador dele.
  return new GoogleGenAI({ apiKey });
}

function generationConfig(signal) {
  return {
    systemInstruction: SYSTEM,
    // Leitura deliberadamente curta (250-450 palavras).
    maxOutputTokens: 4000,
    // Escrita interpretativa pede alguma variação entre tiragens iguais.
    temperature: 1,
    abortSignal: signal,
  };
}

/**
 * Gera a leitura com streaming. `onText` recebe cada trecho conforme chega.
 * Devolve o texto final.
 */
export async function streamReading(reading, { apiKey, model, tone, onText, signal } = {}) {
  const ai = createClient(apiKey);
  const timeout = withTimeout(signal);

  let full = '';
  try {
    const stream = await ai.models.generateContentStream({
      model: model || DEFAULT_MODEL,
      contents: buildPrompt(reading, tone),
      config: generationConfig(timeout.signal),
    });

    for await (const chunk of stream) {
      const piece = chunk.text;
      if (!piece) continue;
      full += piece;
      onText?.(piece);
    }
  } finally {
    timeout.done();
  }

  const text = full.trim();
  if (!text) {
    throw new Error(
      'O modelo não devolveu texto. Isso costuma acontecer quando os filtros de segurança bloqueiam a resposta — reformule a pergunta e tente de novo.'
    );
  }
  return text;
}

/** Chamada mínima para conferir se a chave e o modelo funcionam. */
export async function testConnection({ apiKey, model }) {
  const ai = createClient(apiKey);
  const timeout = withTimeout();
  try {
    const response = await ai.models.generateContent({
      model: model || DEFAULT_MODEL,
      contents: 'Responda apenas com a palavra: pronto',
      config: { maxOutputTokens: 200, abortSignal: timeout.signal },
    });
    return (response.text || '').trim();
  } finally {
    timeout.done();
  }
}

/** Modelos que a chave realmente pode usar para gerar texto. */
export async function listModels({ apiKey }) {
  const ai = createClient(apiKey);
  const pager = await ai.models.list();
  const found = [];
  for await (const model of pager) {
    const id = (model.name || '').replace(/^models\//, '');
    const actions = model.supportedActions || [];
    // Sem generateContent não serve para a leitura (embeddings, vídeo, TTS...).
    if (!id || (actions.length && !actions.includes('generateContent'))) continue;
    if (/embedding|veo|lyria|image|tts|robotics|live|transcribe|aqa/.test(id)) continue;
    const unstable = RETIRED_MODELS.includes(id);
    found.push({
      id,
      label: model.displayName || id,
      hint: unstable ? 'listado, mas não respondeu nos testes — evite' : '',
      unstable,
    });
  }
  // Os problemáticos continuam disponíveis, mas no fim da lista e sinalizados.
  return found.sort((a, b) => Number(a.unstable) - Number(b.unstable));
}

/** Mensagens de erro compreensíveis para quem está consultando. */
export function describeAiError(error) {
  const reason = error?.reason?.message || error?.message || '';
  if (reason.includes('timeout')) {
    return 'O modelo não respondeu a tempo. Alguns modelos ficam indisponíveis sem devolver erro — escolha outro modelo em Ajustes.';
  }
  if (error?.name === 'AbortError') return 'Leitura cancelada.';
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 401 || error.status === 403) {
      return `A chave da API foi recusada (${error.status}). Confira em Ajustes se ela está correta e habilitada para a API Gemini.`;
    }
    if (error.status === 404) {
      return 'Modelo não encontrado para esta chave. Escolha outro modelo em Ajustes.';
    }
    if (error.status === 429) {
      return 'Limite de requisições atingido. Espere alguns instantes e tente novamente.';
    }
    return `Erro da API (${error.status}): ${error.message}`;
  }
  return error?.message || 'Não foi possível gerar a leitura com IA.';
}
