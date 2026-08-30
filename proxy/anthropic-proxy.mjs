/**
 * Proxy mínimo para a API da Anthropic (Cloudflare Workers).
 *
 * Serve para publicar a leitura por IA sem que a chave chegue ao navegador:
 * o site chama este endpoint, ele injeta a credencial e repassa a resposta
 * (inclusive o streaming SSE).
 *
 * Publicar:
 *   npx wrangler deploy proxy/anthropic-proxy.mjs --name tarot-proxy
 *   npx wrangler secret put ANTHROPIC_API_KEY
 *   npx wrangler secret put ALLOWED_ORIGIN   # ex.: https://andrecardosobm.github.io
 *
 * Depois, no build do site: NEXT_PUBLIC_AI_PROXY_URL=https://tarot-proxy.<seu>.workers.dev/v1
 *
 * Sem autenticação própria, qualquer pessoa que descubra a URL gasta a sua
 * cota — mantenha um limite de gasto na conta Anthropic e considere adicionar
 * rate limiting (Cloudflare Rate Limiting Rules) ou um token de acesso.
 */

const ALLOWED_PATHS = new Set(['/v1/messages']);

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'content-type, anthropic-version, anthropic-beta',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return new Response('Método não permitido', { status: 405, headers: cors });

    const url = new URL(request.url);
    if (!ALLOWED_PATHS.has(url.pathname)) {
      return new Response('Rota não permitida', { status: 404, headers: cors });
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': request.headers.get('anthropic-version') || '2023-06-01',
        'x-api-key': env.ANTHROPIC_API_KEY,
      },
      body: request.body,
      // necessário para repassar o corpo em streaming no Workers
      duplex: 'half',
    });

    const headers = new Headers(cors);
    headers.set('content-type', upstream.headers.get('content-type') || 'application/json');
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
