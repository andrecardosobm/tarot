// Em produção o site é publicado no GitHub Pages como projeto (…/<repo>/),
// então tudo precisa ser exportado estaticamente e prefixado pelo basePath.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
