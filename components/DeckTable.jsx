'use client';

import { CardBack } from './CardArt';

/** Mesa virtual: as 78 cartas viradas para baixo, em grade rolável. */
export default function DeckTable({ deck, selectedIds, onPick, remaining, shuffling }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
      <div
        className={`grid grid-cols-6 gap-1.5 sm:grid-cols-10 sm:gap-2 lg:grid-cols-13 ${shuffling ? 'shuffling' : ''}`}
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))' }}
      >
        {deck.map((card, index) => {
          const picked = selectedIds.includes(card.id);
          const disabled = picked || remaining === 0;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onPick(card)}
              disabled={disabled}
              aria-label={picked ? `Carta ${index + 1}, já escolhida` : `Puxar carta ${index + 1}`}
              className={`aspect-[2/3] rounded-xl transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                picked
                  ? 'opacity-25 scale-95'
                  : remaining === 0
                    ? 'opacity-50'
                    : 'hover:-translate-y-2 hover:shadow-card'
              }`}
            >
              <CardBack compact />
            </button>
          );
        })}
      </div>
    </div>
  );
}
