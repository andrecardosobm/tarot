const KEY = 'tarot:ia:v1';

// Endpoint opcional de um proxy próprio (ver proxy/README.md). Quando definido,
// a chave da API Gemini fica no servidor e o navegador não guarda credencial nenhuma.
export const PROXY_URL = process.env.NEXT_PUBLIC_AI_PROXY_URL || '';

export const DEFAULTS = { enabled: false, apiKey: '', tone: 'acolhedor', model: 'gemini-3.6-flash' };

// Modelos aposentados ou que não respondem; ver RETIRED_MODELS em lib/ai.js.
const RETIRED_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.7-flash'];

export const TONES = [
  { id: 'acolhedor', label: 'Acolhedor', hint: 'caloroso, gentil, encorajador' },
  { id: 'direto', label: 'Direto', hint: 'objetivo, sem rodeios, prático' },
  { id: 'poetico', label: 'Poético', hint: 'imagético, simbólico, contemplativo' },
];

export function loadAiSettings() {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    const saved = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    // Quem salvou um modelo que saiu do ar volta ao padrão em vez de bater numa
    // tela que nunca responde.
    return RETIRED_MODELS.includes(saved.model) ? { ...saved, model: DEFAULTS.model } : saved;
  } catch {
    return DEFAULTS;
  }
}

export function saveAiSettings(settings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...DEFAULTS, ...settings }));
  } catch {
    /* storage indisponível: a configuração vale só para esta sessão */
  }
}

/** A leitura por IA só é possível com proxy configurado ou chave própria. */
export function canUseAi(settings) {
  return Boolean(settings.enabled && (PROXY_URL || settings.apiKey));
}
