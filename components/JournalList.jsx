'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadReadings, deleteReading } from '../lib/storage';
import { getSpread } from '../lib/spreads';
import { CARDS_BY_ID } from '../lib/deck';
import { encodeReading } from '../lib/share';

export default function JournalList() {
  const [readings, setReadings] = useState(null);

  useEffect(() => {
    setReadings(loadReadings());
  }, []);

  if (readings === null) return <p className="text-white/50">Carregando…</p>;

  if (!readings.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-white/70">Seu diário está vazio.</p>
        <Link href="/" className="mt-4 inline-block rounded-full border border-gold/50 px-5 py-2 text-sm text-gold hover:bg-gold/10">
          Fazer uma tiragem
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Diário de tiragens</h1>
      <p className="text-sm text-white/50">
        Salvo apenas neste navegador ({readings.length} {readings.length === 1 ? 'registro' : 'registros'}).
      </p>
      <ul className="space-y-3">
        {readings.map((r) => (
          <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-gold/80">{getSpread(r.spreadId).name}</p>
                <p className="font-display text-lg">{r.question || 'Sem pergunta registrada'}</p>
                <p className="text-xs text-white/50">{new Date(r.date).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/tiragem?t=${encodeReading(r)}`}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs hover:bg-white/10"
                >
                  Abrir
                </Link>
                <button
                  type="button"
                  onClick={() => setReadings(deleteReading(r.id))}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs text-white/60 hover:bg-white/10"
                >
                  Excluir
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/60">
              {r.draw
                .map((d) => `${CARDS_BY_ID[d.cardId]?.name ?? '—'}${d.reversed ? ' (inv.)' : ''}`)
                .join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
