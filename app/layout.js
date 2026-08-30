import './globals.css';

export const metadata = {
  title: 'Oráculo — Tiragens de Tarot',
  description:
    'Mesa virtual de Tarot com os 78 arcanos: escolha o método, embaralhe, puxe suas cartas e leia a interpretação completa.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="starfield antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
