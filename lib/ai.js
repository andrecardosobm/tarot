import { GoogleGenAI, ApiError } from '@google/genai';
import { CARDS_BY_ID } from './deck.js';
import { getSpread, positionsFor, THEMES } from './spreads.js';
import { PROXY_URL, TONES } from './aiSettings.js';

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
// O limite é de INATIVIDADE, não de duração total: uma resposta longa que segue
// chegando aos poucos é legítima (o streaming do Gemini leva bem mais tempo que
// a chamada equivalente sem streaming), o que não pode é o silêncio.
const IDLE_TIMEOUT_MS = 60000;

export const TIMEOUT_MESSAGE =
  'O modelo não respondeu a tempo. Pode ser sobrecarga momentânea da API ou um modelo indisponível — tente de novo ou escolha outro modelo em Ajustes.';

function withTimeout(signal) {
  const controller = new AbortController();
  const state = { fired: false };
  let timer;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.fired = true;
      controller.abort();
    }, IDLE_TIMEOUT_MS);
  };
  arm();
  signal?.addEventListener('abort', () => controller.abort(), { once: true });
  return {
    signal: controller.signal,
    // Cada trecho recebido reinicia a contagem.
    keepAlive: arm,
    done: () => clearTimeout(timer),
    // Sem isso o abort por tempo esgotado chega como AbortError e seria
    // relatado como "cancelado pelo usuário".
    translate: (error) => (state.fired ? new Error(TIMEOUT_MESSAGE) : error),
  };
}

const SYSTEM_BASE = `Você é uma taróloga experiente conduzindo uma leitura em português do Brasil.

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
- Não presume o gênero de quem consulta: escreva de forma neutra ("cansado ou cansada" vira "com cansaço", "gentil consigo mesma" vira "gentil com você"), a menos que a pessoa deixe claro como quer ser tratada.`;

const SYSTEM = `${SYSTEM_BASE}

Formato da resposta:
- Texto corrido em parágrafos curtos, sem markdown, sem listas, sem títulos.
- Comece pela leitura carta a carta na ordem das posições (um parágrafo por carta, citando o nome da carta e a posição).
- Termine com um parágrafo de síntese que amarre tudo e ofereça um conselho praticável.
- Entre 250 e 450 palavras no total. Fale com a pessoa por "você".`;

const SYSTEM_CHAT = `${SYSTEM_BASE}

Agora a leitura já foi entregue e a pessoa está conversando com você sobre ela. Aqui você troca a voz de leitura pela de uma conversa direta.

Como responder:
- RESPONDA A PERGUNTA NA PRIMEIRA FRASE, de forma objetiva. Se perguntarem qual carta, diga o nome. Se perguntarem o que fazer, diga a ação. Se perguntarem sim ou não e as cartas sustentarem uma direção, comece por "sim" ou "não" e só depois explique; se não sustentarem, diga na primeira frase que a tiragem não responde isso — nunca escolha "sim" ou "não" só para obedecer ao formato.
- Entregue apenas a resposta final, nunca rascunhos, notas de trabalho, alternativas ou comentários sobre como você redigiu.
- Sem preâmbulo, sem repetir a pergunta, sem recapitular a tiragem, sem abertura do tipo "que pergunta interessante" ou "as cartas nos mostram que".
- Uma explicação curta depois da resposta, só se acrescentar algo. Linguagem simples e concreta, sem imagens poéticas e sem enfeite.
- No máximo 80 palavras. Um parágrafo. Só use dois se a pergunta tiver mesmo duas partes.
- Ancore o que disser nas cartas que já saíram nesta tiragem e no que você escreveu. Não invente cartas novas nem refaça a tiragem: se a pessoa quiser outra pergunta ou outras cartas, diga em uma frase que isso pede uma nova tiragem.
- Se a pergunta não tem resposta nas cartas, diga isso direto em vez de improvisar.
- Texto corrido, sem markdown, sem listas, sem títulos.`;

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

function generationConfig(signal, { systemInstruction = SYSTEM, maxOutputTokens = 4000, temperature = 1 } = {}) {
  return {
    systemInstruction,
    // Respostas deliberadamente curtas; o teto é folga, não meta.
    maxOutputTokens,
    // Padrão alto para a leitura: escrita interpretativa pede variação.
    temperature,
    abortSignal: signal,
  };
}

/** Consome o streaming acumulando o texto e repassando cada trecho. */
async function drain(stream, onText, timeout) {
  let full = '';
  for await (const chunk of stream) {
    timeout?.keepAlive();
    const piece = chunk.text;
    if (!piece) continue;
    full += piece;
    onText?.(piece);
  }
  return full;
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
    full = await drain(stream, onText, timeout);
  } catch (error) {
    throw timeout.translate(error);
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

/**
 * Pergunta de esclarecimento sobre a leitura já entregue. O modelo recebe a
 * tiragem original, o texto que ele escreveu e a conversa até aqui, para
 * responder sem reabrir o baralho.
 */
export async function streamFollowUp(reading, { apiKey, model, tone, readingText, history = [], question, onText, signal } = {}) {
  const ai = createClient(apiKey);
  const timeout = withTimeout(signal);

  const contents = [
    { role: 'user', parts: [{ text: buildPrompt(reading, tone) }] },
    { role: 'model', parts: [{ text: readingText }] },
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user', parts: [{ text: question }] },
  ];

  let full = '';
  try {
    const stream = await ai.models.generateContentStream({
      model: model || DEFAULT_MODEL,
      contents,
      config: generationConfig(timeout.signal, {
        systemInstruction: SYSTEM_CHAT,
        // Folgado de propósito: o teto é dividido com os tokens de raciocínio do
        // modelo, e apertá-lo trunca a resposta no meio da frase.
        maxOutputTokens: 3000,
        // Resposta objetiva pede pouca variação; a criatividade fica na leitura.
        temperature: 0.3,
      }),
    });
    full = await drain(stream, onText, timeout);
  } catch (error) {
    throw timeout.translate(error);
  } finally {
    timeout.done();
  }

  const text = full.trim();
  if (!text) {
    throw new Error('O modelo não devolveu resposta. Reformule a pergunta e tente de novo.');
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
  } catch (error) {
    throw timeout.translate(error);
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
  if (error?.message === TIMEOUT_MESSAGE) return TIMEOUT_MESSAGE;
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
    if (error.status === 503) {
      return 'O modelo está sobrecarregado neste momento. Tente de novo em instantes ou escolha outro modelo em Ajustes.';
    }
    return `Erro da API (${error.status}): ${error.message}`;
  }
  return error?.message || 'Não foi possível gerar a leitura com IA.';
}
