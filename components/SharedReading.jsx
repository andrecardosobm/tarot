'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReadingView from './ReadingView';
import { decodeReading } from '../lib/share';
import { CARDS_BY_ID } from '../lib/deck';

export default function SharedReading() {
  const params = useSearchParams();
  const token = params.get('t');
  const reading = token ? decodeReading(token) : null;
  const valid = reading && reading.draw.length > 0 && reading.draw.every((d) => CARDS_BY_ID[d.cardId]);

  if (!valid) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-white/70">Link de tiragem inválido ou expirado.</p>
        <Link href="/" className="mt-4 inline-block rounded-full border border-gold/50 px-5 py-2 text-sm text-gold hover:bg-gold/10">
          Fazer uma tiragem
        </Link>
      </div>
    );
  }

  return <ReadingView reading={reading} readOnly />;
}
