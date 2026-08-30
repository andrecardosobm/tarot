'use client';

import { CardArt, CardBack } from './CardArt';

/** Carta com virada 3D: verso -> frente. */
export default function TarotCard({ card, revealed, reversed, onClick, label, size = 'md' }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={label}
      className={`flip-scene block w-full aspect-[2/3] ${onClick ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-xl' : ''}`}
    >
      <div className={`flip-inner shadow-card rounded-xl ${revealed ? 'is-flipped' : ''}`}>
        <div className="flip-face front">
          <CardBack compact={size === 'sm'} />
        </div>
        <div className={`flip-face back ${reversed ? 'card-reversed' : ''}`}>
          <CardArt card={card} size={size} />
        </div>
      </div>
    </Wrapper>
  );
}
