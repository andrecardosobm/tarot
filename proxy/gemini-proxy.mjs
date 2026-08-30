/**
 * Proxy mínimo para a API Gemini (Cloudflare Workers).
 *
 * Serve para publicar a leitura por IA sem que a chave chegue ao navegador:
 * o site chama este endpoint, ele injeta a credencial e repassa a resposta
 * (inclusive o streaming).
 *
 * Publicar:
 *   npx wrangler deploy proxy/gemini-proxy.mjs --name tarot-proxy
 *   npx wrangler secret put GEMINI_API_KEY
 *   npx wrangler secret put ALLOWED_ORIGIN   # ex.: https://andrecardosobm.github.io
 *
 * Depois, no build do site: NEXT_PUBLIC_AI_PROXY_URL=https://tarot-proxy.<seu>.workers.dev
 * (o SDK acrescenta /v1beta/... ao caminho por conta própria).
 *
 * Sem autenticação própria, qualquer pessoa que descubra a URL gasta a sua
 * cota — considere rate limiting (Cloudflare Rate Limiting Rules) ou um token
 * de acesso, e acompanhe o consumo no Google AI Studio.
 */

const UPSTREAM = 'https://generativelanguage.googleapis.com';

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'content-type, x-goog-api-key, x-goog-api-client',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return new Response('Método não permitido', { status: 405, headers: cors });

    const url = new URL(request.url);
    // Só geração de conteúdo; nada de gerenciamento de arquivos ou de modelos.
    if (!/^\/v1(beta)?\/models\/[^/]+:(streamGenerateContent|generateContent)$/.test(url.pathname)) {
      return new Response('Rota não permitida', { status: 404, headers: cors });
    }

    const upstream = await fetch(`${UPSTREAM}${url.pathname}${url.search}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
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
