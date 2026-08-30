export const SPREADS = [
  {
    id: 'daily',
    name: 'Carta do Dia',
    subtitle: 'Conselho rápido',
    count: 1,
    description: 'Uma única lâmina para orientar o dia ou responder de forma direta.',
    positions: [
      { title: 'Conselho do dia', meaning: 'A energia central que rege este momento e o que ela pede de você.' },
    ],
  },
  {
    id: 'three-time',
    name: 'Três Cartas — Tempo',
    subtitle: 'Passado / Presente / Futuro',
    count: 3,
    description: 'A linha do tempo da questão: de onde vem, onde está e para onde tende.',
    positions: [
      { title: 'Passado', meaning: 'A raiz da questão: o que já foi vivido e ainda influencia.' },
      { title: 'Presente', meaning: 'O estado atual da situação e a energia disponível agora.' },
      { title: 'Futuro', meaning: 'A tendência caso o curso atual se mantenha.' },
    ],
  },
  {
    id: 'three-advice',
    name: 'Três Cartas — Conselho',
    subtitle: 'Situação / Obstáculo / Conselho',
    count: 3,
    description: 'Diagnóstico prático: o cenário, o que trava e o caminho sugerido.',
    positions: [
      { title: 'Situação', meaning: 'O retrato honesto do que está acontecendo.' },
      { title: 'Obstáculo', meaning: 'O que dificulta, interna ou externamente.' },
      { title: 'Conselho', meaning: 'A atitude mais sábia diante desse cenário.' },
    ],
  },
  {
    id: 'celtic-cross',
    name: 'Cruz Céltica',
    subtitle: '10 cartas — leitura profunda',
    count: 10,
    description: 'A tiragem clássica para questões complexas, com contexto, influências e desfecho.',
    positions: [
      { title: 'A situação', meaning: 'O coração da questão, o tema central.' },
      { title: 'O desafio', meaning: 'O que cruza o caminho: obstáculo ou apoio inesperado.' },
      { title: 'A base', meaning: 'Raiz inconsciente, fundamento do que acontece.' },
      { title: 'O passado recente', meaning: 'O que está saindo de cena e ainda ecoa.' },
      { title: 'A meta consciente', meaning: 'O que você acredita querer ou busca alcançar.' },
      { title: 'O futuro próximo', meaning: 'O que se aproxima nas próximas semanas.' },
      { title: 'Você', meaning: 'Sua postura e o papel que assume nessa história.' },
      { title: 'O ambiente', meaning: 'Pessoas e circunstâncias externas que influenciam.' },
      { title: 'Esperanças e medos', meaning: 'O que você deseja e teme — muitas vezes a mesma coisa.' },
      { title: 'O desfecho', meaning: 'A síntese do caminho, a direção provável do ciclo.' },
    ],
  },
  {
    id: 'free',
    name: 'Tiragem Livre',
    subtitle: 'Você define de 1 a 10 cartas',
    count: 5,
    variable: true,
    description: 'Escolha quantas cartas quiser; cada uma responde livremente à sua intenção.',
    positions: null,
  },
];

export function getSpread(id) {
  return SPREADS.find((s) => s.id === id) || SPREADS[0];
}

export function positionsFor(spread, count) {
  if (spread.positions) return spread.positions;
  return Array.from({ length: count }, (_, i) => ({
    title: `Carta ${i + 1}`,
    meaning: 'Uma faceta livre da sua questão, lida em diálogo com as demais.',
  }));
}

export const THEMES = [
  { id: 'general', label: 'Geral' },
  { id: 'love', label: 'Amor' },
  { id: 'work', label: 'Trabalho' },
  { id: 'spirit', label: 'Espiritualidade' },
];
