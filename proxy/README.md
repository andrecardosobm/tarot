# Proxy opcional para a leitura por IA

O site é estático (GitHub Pages), então não existe servidor onde esconder a chave da
Anthropic. Há dois modos de operação:

## 1. Chave do próprio usuário (padrão, funciona no Pages)

Cada pessoa informa a própria chave em **Ajustes**. Ela é guardada no `localStorage`
daquele navegador e as requisições vão direto do dispositivo para `api.anthropic.com`.
Bom para uso pessoal; a chave fica exposta a quem tiver acesso ao navegador, então use
uma chave dedicada e com limite de gasto.

## 2. Proxy próprio (recomendado para uso público)

Publique `anthropic-proxy.mjs` como um Cloudflare Worker, guarde a chave como secret e
faça o build do site com:

```bash
NEXT_PUBLIC_AI_PROXY_URL=https://tarot-proxy.<seu>.workers.dev/v1 npm run build
```

Com essa variável definida, o campo de chave some da tela de Ajustes e o navegador nunca
vê credencial nenhuma. Como o proxy não tem autenticação própria, proteja-o com limite de
gasto na conta Anthropic e, idealmente, rate limiting ou um token de acesso.
