import Anthropic from '@anthropic-ai/sdk';
import { CARDS_BY_ID } from './deck';
import { getSpread, positionsFor, THEMES } from './spreads';
import { PROXY_URL, TONES } from './aiSettings';

export const MODEL = 'claude-opus-5';

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
    reading.question ? `Pergunta da pessoa: "${reading.question}"` : 'A pessoa não registrou uma pergunta; leia como orientação geral do momento.',
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
    return new Anthropic({ baseURL: PROXY_URL, apiKey: 'proxy', dangerouslyAllowBrowser: true });
  }
  // Chave do próprio usuário, guardada apenas no navegador dele.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

/**
 * Gera a leitura com streaming. `onText` recebe cada trecho conforme chega.
 * Devolve o texto final.
 */
export async function streamReading(reading, { apiKey, tone, onText, signal } = {}) {
  const client = createClient(apiKey);

  const stream = client.messages.stream(
    {
      model: MODEL,
      // Leitura deliberadamente curta (250-450 palavras); não precisa de teto alto.
      max_tokens: 4000,
      system: SYSTEM,
      thinking: { type: 'adaptive' },
      // Escrita interpretativa, não raciocínio pesado: esforço médio já entrega
      // qualidade e mantém a resposta rápida e barata para o dono da chave.
      output_config: { effort: 'medium' },
      messages: [{ role: 'user', content: buildPrompt(reading, tone) }],
    },
    { signal }
  );

  if (onText) stream.on('text', onText);

  const message = await stream.finalMessage();

  if (message.stop_reason === 'refusal') {
    throw new Error(
      'A leitura foi interrompida pelos filtros de segurança do modelo. Reformule a pergunta e tente de novo.'
    );
  }

  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

/** Mensagens de erro compreensíveis para quem está consultando. */
export function describeAiError(error) {
  if (error?.name === 'AbortError') return 'Leitura cancelada.';
  if (error instanceof Anthropic.AuthenticationError) {
    return 'A chave da API foi recusada. Confira em Ajustes se ela está correta e ativa.';
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return 'Essa chave não tem permissão para usar o modelo. Verifique o plano da sua conta Anthropic.';
  }
  if (error instanceof Anthropic.RateLimitError) {
    return 'Limite de requisições atingido. Espere alguns instantes e tente novamente.';
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return 'Não foi possível falar com a API. Verifique sua conexão.';
  }
  if (error instanceof Anthropic.APIError) {
    return `Erro da API (${error.status}): ${error.message}`;
  }
  return error?.message || 'Não foi possível gerar a leitura com IA.';
}
