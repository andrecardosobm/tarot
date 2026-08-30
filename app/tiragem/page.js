import { Suspense } from 'react';
import SiteHeader from '../../components/SiteHeader';
import SharedReading from '../../components/SharedReading';

export const metadata = { title: 'Tiragem compartilhada' };

export default function SharedPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SiteHeader />
      <Suspense fallback={<p className="text-white/50">Carregando tiragem…</p>}>
        <SharedReading />
      </Suspense>
    </main>
  );
}
