import { GoogleGenAI, ApiError } from '@google/genai';
import { CARDS_BY_ID } from './deck';
import { getSpread, positionsFor, THEMES } from './spreads';
import { PROXY_URL, TONES } from './aiSettings';

// IDs aceitos pelo SDK do Google Gen AI. `gemini-flash-latest` acompanha a
// geração corrente sem exigir mudança de código.
export const MODELS = [
  { id: 'gemini-flash-latest', label: 'Flash (recomendado)', hint: 'rápido e barato, acompanha a geração atual' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', hint: 'versão fixa da geração 3.7' },
  { id: 'gemini-pro-latest', label: 'Pro', hint: 'mais elaborado, mais caro e mais lento' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', hint: 'geração anterior, ampla disponibilidade' },
];

export const DEFAULT_MODEL = MODELS[0].id;

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

  const stream = await ai.models.generateContentStream({
    model: model || DEFAULT_MODEL,
    contents: buildPrompt(reading, tone),
    config: generationConfig(signal),
  });

  let full = '';
  for await (const chunk of stream) {
    const piece = chunk.text;
    if (!piece) continue;
    full += piece;
    onText?.(piece);
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
  const response = await ai.models.generateContent({
    model: model || DEFAULT_MODEL,
    contents: 'Responda apenas com a palavra: pronto',
    config: { maxOutputTokens: 200 },
  });
  return (response.text || '').trim();
}

/** Mensagens de erro compreensíveis para quem está consultando. */
export function describeAiError(error) {
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
