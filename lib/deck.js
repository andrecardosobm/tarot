import { MAJORS } from './majors';
import { SUITS, RANKS, MINOR_MEANINGS } from './minors';

function majorToCard(m) {
  return {
    id: `major-${m.n}`,
    arcana: 'major',
    name: m.name,
    number: m.n,
    roman: m.roman,
    suit: null,
    suitName: 'Arcanos Maiores',
    element: null,
    upright: {
      keywords: m.keywords,
      light: m.light,
      shadow: m.shadow,
      advice: m.advice,
    },
    reversed: {
      keywords: m.revKeywords,
      light: m.revLight,
      shadow: m.revShadow,
      advice: m.revAdvice,
    },
  };
}

function minorToCard(suit, rank) {
  const [light, shadow, advice] = MINOR_MEANINGS[suit.id][rank.id];
  const name = `${rank.label} de ${suit.name}`;
  return {
    id: `${suit.id}-${rank.id}`,
    arcana: 'minor',
    name,
    number: rank.num,
    roman: String(rank.num),
    suit: suit.id,
    suitName: suit.name,
    suitGlyph: suit.glyph,
    suitColor: suit.color,
    rank: rank.id,
    rankLabel: rank.label,
    element: suit.element,
    upright: {
      keywords: [rank.arch.split(',')[0].trim(), suit.theme.split(',')[0].trim(), suit.element.toLowerCase()],
      light,
      shadow,
      advice,
    },
    reversed: {
      keywords: ['bloqueio', 'excesso', 'lição interna'],
      light: `Invertida, a carta pede que a energia de ${suit.theme.split(',')[0].trim()} seja trabalhada por dentro antes de se manifestar fora.`,
      shadow,
      advice: `Reveja o exagero ou a ausência desta energia: ${advice.toLowerCase()}`,
    },
  };
}

export const DECK = [
  ...MAJORS.map(majorToCard),
  ...SUITS.flatMap((suit) => RANKS.map((rank) => minorToCard(suit, rank))),
];

export const CARDS_BY_ID = Object.fromEntries(DECK.map((c) => [c.id, c]));

export { SUITS, RANKS };
