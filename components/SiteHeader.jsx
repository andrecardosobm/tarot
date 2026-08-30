import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="no-print flex flex-wrap items-center justify-between gap-3 pb-8">
      <Link href="/" className="font-display text-xl tracking-wide">
        <span className="text-gold">✦</span> Oráculo
      </Link>
      <nav className="flex gap-4 text-sm text-white/70">
        <Link href="/" className="hover:text-white">Nova tiragem</Link>
        <Link href="/diario" className="hover:text-white">Diário</Link>
        <Link href="/arcanos" className="hover:text-white">Arcanos</Link>
        <Link href="/ajustes" className="hover:text-white">Ajustes</Link>
      </nav>
    </header>
  );
}
