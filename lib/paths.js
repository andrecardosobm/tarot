// Prefixo do site quando publicado em subdiretório (GitHub Pages de projeto).
// Injetado no build por NEXT_PUBLIC_BASE_PATH; vazio em desenvolvimento.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function absoluteUrl(path) {
  return `${window.location.origin}${BASE_PATH}${path}`;
}
