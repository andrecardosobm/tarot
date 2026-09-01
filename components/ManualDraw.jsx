'use client';

import { useMemo, useState } from 'react';
import { DECK } from '../lib/deck';
import { CardArt } from './CardArt';

/** Remove acentos e caixa, para a busca aceitar "eremita" e "espadas". */
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Registro das cartas que a pessoa tirou no baralho físico: uma carta por
 * posição, com a opção de marcar invertida.
 */
export default function ManualDraw({ positions, picked, onChange }) {
  const [openIndex, setOpenIndex] = useState(0);
  const [query, setQuery] = useState('');

  const escolhidos = picked.map((p) => p?.cardId).filter(Boolean);

  const opcoes = useMemo(() => {
    const q = normalize(query.trim());
    return DECK.filter((card) => {
      if (!q) return true;
      return normalize(card.name).includes(q) || normalize(card.suitName).includes(q);
    });
  }, [query]);

  const escolher = (index, card) => {
    const next = [...picked];
    next[index] = { cardId: card.id, reversed: next[index]?.reversed || false };
    onChange(next);
    setQuery('');
    // Vai direto para a próxima posição ainda vazia.
    const proxima = next.findIndex((p, i) => i > index && !p?.cardId);
    setOpenIndex(proxima === -1 ? -1 : proxima);
  };

  const inverter = (index) => {
    const next = [...picked];
    if (!next[index]?.cardId) return;
    next[index] = { ...next[index], reversed: !next[index].reversed };
    onChange(next);
  };

  const limpar = (index) => {
    const next = [...picked];
    next[index] = null;
    onChange(next);
    setOpenIndex(index);
  };

  return (
    <ol className="space-y-3">
      {positions.map((position, index) => {
        const escolha = picked[index];
        const card = escolha?.cardId ? DECK.find((c) => c.id === escolha.cardId) : null;
        const aberto = openIndex === index;

        return (
          <li key={position.title + index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 shrink-0 overflow-hidden rounded-lg">
                {card ? (
                  <div className={escolha.reversed ? 'card-reversed aspect-[2/3]' : 'aspect-[2/3]'}>
                    <CardArt card={card} size="sm" />
                  </div>
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center rounded-lg border border-dashed border-white/20 text-white/30">
                    ?
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-widest text-glow">
                  {index + 1}. {position.title}
                </p>
                <p className="mt-1 text-xs text-white/50">{position.meaning}</p>

                {card ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="font-display text-lg">
                      {card.name}
                      {escolha.reversed && <span className="text-sm text-gold"> (invertida)</span>}
                    </span>
                    <label className="flex items-center gap-2 text-xs text-white/60">
                      <input
                        type="checkbox"
                        checked={escolha.reversed}
                        onChange={() => inverter(index)}
                        className="h-3.5 w-3.5 accent-amber-300"
                      />
                      saiu invertida
                    </label>
                    <button
                      type="button"
                      onClick={() => limpar(index)}
                      className="text-xs text-white/50 underline hover:text-white"
                    >
                      trocar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenIndex(aberto ? -1 : index);
                      setQuery('');
                    }}
                    className="mt-2 rounded-full border border-white/20 px-4 py-1.5 text-xs hover:bg-white/10"
                  >
                    {aberto ? 'Fechar' : 'Escolher carta'}
                  </button>
                )}
              </div>
            </div>

            {aberto && (
              <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                <input
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar carta pelo nome…"
                  aria-label={`Buscar carta para a posição ${position.title}`}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-2.5 text-sm outline-none focus:border-gold/60"
                />
                <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {opcoes.map((opcao) => {
                    const usada = escolhidos.includes(opcao.id);
                    return (
                      <li key={opcao.id}>
                        <button
                          type="button"
                          onClick={() => escolher(index, opcao)}
                          disabled={usada}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm ${
                            usada ? 'cursor-not-allowed text-white/25' : 'hover:bg-white/10'
                          }`}
                        >
                          <span>{opcao.name}</span>
                          <span className="text-xs text-white/40">
                            {usada
                              ? 'já usada'
                              : opcao.arcana === 'major'
                                ? `Maior ${opcao.roman}`
                                : opcao.suitName}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {opcoes.length === 0 && (
                    <li className="px-3 py-2 text-sm text-white/40">Nenhuma carta com esse nome.</li>
                  )}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
