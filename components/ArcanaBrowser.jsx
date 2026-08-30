'use client';

import { useMemo, useState } from 'react';
import { DECK } from '../lib/deck';
import { CardArt } from './CardArt';

const FILTERS = [
  { id: 'all', label: 'Todos (78)' },
  { id: 'major', label: 'Maiores (22)' },
  { id: 'wands', label: 'Paus' },
  { id: 'cups', label: 'Copas' },
  { id: 'swords', label: 'Espadas' },
  { id: 'pentacles', label: 'Ouros' },
];

export default function ArcanaBrowser() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DECK.filter((c) => {
      if (filter === 'major' && c.arcana !== 'major') return false;
      if (filter !== 'all' && filter !== 'major' && c.suit !== filter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.upright.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query, filter]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Dicionário dos arcanos</h1>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nome ou palavra-chave…"
        className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm outline-none focus:border-gold/60"
      />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1 text-xs border ${
              filter === f.id ? 'border-gold text-gold bg-gold/10' : 'border-white/15 text-white/60 hover:bg-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-white/50">{cards.length} cartas</p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const open = openId === card.id;
          return (
            <li key={card.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : card.id)}
                aria-expanded={open}
                className="flex w-full gap-4 text-left"
              >
                <span className="block w-16 shrink-0 aspect-[2/3] overflow-hidden rounded-lg">
                  <CardArt card={card} size="sm" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg">{card.name}</span>
                  <span className="block text-xs text-white/50">
                    {card.arcana === 'major' ? `Arcano Maior ${card.roman}` : `${card.suitName} · ${card.element}`}
                  </span>
                  <span className="mt-2 block text-xs text-glow">{card.upright.keywords.join(', ')}</span>
                </span>
              </button>
              {open && (
                <div className="mt-4 space-y-3 border-t border-white/10 pt-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gold">Ereta</p>
                    <p className="text-white/80">{card.upright.light}</p>
                    <p className="text-white/60">Sombra: {card.upright.shadow}</p>
                    <p className="text-white/60">Conselho: {card.upright.advice}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gold">Invertida</p>
                    <p className="text-white/80">{card.reversed.light}</p>
                    <p className="text-white/60">Sombra: {card.reversed.shadow}</p>
                    <p className="text-white/60">Conselho: {card.reversed.advice}</p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
