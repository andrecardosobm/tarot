const KEY = 'tarot:ia:v1';

// Endpoint opcional de um proxy próprio (ver proxy/README.md). Quando definido,
// a chave fica no servidor e o navegador não guarda credencial nenhuma.
export const PROXY_URL = process.env.NEXT_PUBLIC_AI_PROXY_URL || '';

export const DEFAULTS = { enabled: false, apiKey: '', tone: 'acolhedor' };

export const TONES = [
  { id: 'acolhedor', label: 'Acolhedor', hint: 'caloroso, gentil, encorajador' },
  { id: 'direto', label: 'Direto', hint: 'objetivo, sem rodeios, prático' },
  { id: 'poetico', label: 'Poético', hint: 'imagético, simbólico, contemplativo' },
];

export function loadAiSettings() {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
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
