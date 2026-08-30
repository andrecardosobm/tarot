const SUIT_STYLE = {
  wands: { glyph: '🔥', ring: 'from-amber-400/40 to-rose-600/30', accent: 'text-amber-200' },
  cups: { glyph: '💧', ring: 'from-sky-300/40 to-indigo-600/30', accent: 'text-sky-200' },
  swords: { glyph: '⚔️', ring: 'from-slate-200/30 to-cyan-600/30', accent: 'text-cyan-100' },
  pentacles: { glyph: '🪙', ring: 'from-emerald-300/40 to-yellow-600/30', accent: 'text-emerald-200' },
};

const MAJOR_GLYPH = ['🌀','✨','🌙','🌺','🏛️','🕯️','💞','🐎','🦁','🏮','☸️','⚖️','🙃','🦋','🏺','⛓️','🗼','⭐','🌕','☀️','📯','🌍'];

/** Ilustração vetorial/tipográfica da lâmina (substituível por WebP autoral). */
export function CardArt({ card, size = 'md' }) {
  const style = card.suit ? SUIT_STYLE[card.suit] : null;
  const glyph = card.suit ? style.glyph : MAJOR_GLYPH[card.number] || '✦';
  const ring = card.suit ? style.ring : 'from-violet-400/40 to-fuchsia-700/30';
  const compact = size === 'sm';

  return (
    <div className={`card-art h-full w-full bg-gradient-to-br ${ring} bg-veil flex flex-col items-center justify-between p-2 text-center`}>
      <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-[0.2em] text-gold/80`}>
        {card.arcana === 'major' ? card.roman : card.rankLabel}
      </span>
      <span className={compact ? 'text-2xl' : 'text-4xl'} aria-hidden="true">{glyph}</span>
      <span className={`${compact ? 'text-[9px]' : 'text-xs'} font-display leading-tight text-white/90`}>
        {card.name}
      </span>
    </div>
  );
}

export function CardBack({ compact = false }) {
  return (
    <div className="h-full w-full rounded-xl bg-gradient-to-br from-mist to-ink border border-gold/30 flex items-center justify-center">
      <div className="h-[78%] w-[78%] rounded-lg border border-gold/25 flex items-center justify-center">
        <span className={compact ? 'text-lg' : 'text-2xl'} aria-hidden="true">
          ✦
        </span>
      </div>
    </div>
  );
}
