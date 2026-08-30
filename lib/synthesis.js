import { CARDS_BY_ID } from './deck';
import { SUITS } from './minors';

const SUIT_LABEL = Object.fromEntries(SUITS.map((s) => [s.id, s]));

// Gera uma síntese determinística a partir da composição real da tiragem.
export function synthesize(draw, { question, theme } = {}) {
  const cards = draw.map((d) => ({ ...d, card: CARDS_BY_ID[d.cardId] }));
  const total = cards.length;
  const majors = cards.filter((c) => c.card.arcana === 'major');
  const reversed = cards.filter((c) => c.reversed);
  const suitCount = {};
  cards.forEach((c) => {
    if (c.card.suit) suitCount[c.card.suit] = (suitCount[c.card.suit] || 0) + 1;
  });
  const dominant = Object.entries(suitCount).sort((a, b) => b[1] - a[1])[0];

  const parts = [];

  if (question) {
    parts.push(`Sobre "${question}", a mesa respondeu com ${total} ${total === 1 ? 'carta' : 'cartas'}.`);
  } else {
    parts.push(`A mesa respondeu com ${total} ${total === 1 ? 'carta' : 'cartas'}.`);
  }

  const majorRatio = majors.length / total;
  if (majorRatio >= 0.5) {
    parts.push(
      `A presença forte de Arcanos Maiores (${majors.length} de ${total}) indica que a questão pertence a um ciclo maior: são forças de destino e aprendizado, menos sujeitas à sua manobra cotidiana e mais ao seu posicionamento diante delas.`
    );
  } else if (majors.length === 0) {
    parts.push(
      'Sem Arcanos Maiores, a leitura fala do dia a dia: são situações ao seu alcance, ajustáveis por escolhas práticas nas próximas semanas.'
    );
  } else {
    parts.push(
      `Com ${majors.length} Arcano${majors.length > 1 ? 's' : ''} Maior${majors.length > 1 ? 'es' : ''} entre cartas do cotidiano, há um tema de fundo importante se expressando em decisões concretas.`
    );
  }

  if (dominant && dominant[1] >= 2) {
    const s = SUIT_LABEL[dominant[0]];
    parts.push(
      `O naipe de ${s.name} predomina (${dominant[1]}x): o eixo da resposta está em ${s.theme}, sob o elemento ${s.element}.`
    );
  }

  if (reversed.length) {
    parts.push(
      reversed.length === total
        ? 'Todas as cartas saíram invertidas: a energia da leitura está voltada para dentro, pedindo revisão antes de qualquer movimento externo.'
        : reversed.length === 1
          ? 'Uma carta invertida aponta um ponto de bloqueio ou excesso que pede ajuste interno.'
          : `${reversed.length} cartas invertidas apontam pontos de bloqueio ou excesso que pedem ajuste interno.`
    );
  }

  const first = cards[0];
  const last = cards[cards.length - 1];
  if (total > 1) {
    parts.push(
      `A leitura começa em ${first.card.name} — ${keyOf(first)} — e desemboca em ${last.card.name} — ${keyOf(last)}. Esse é o movimento essencial do seu ciclo.`
    );
  }

  parts.push(`Conselho central: ${face(last).advice}`);

  if (theme && theme !== 'general') {
    const lens = {
      love: 'No campo afetivo, observe como essas energias aparecem no vínculo antes de cobrar mudanças do outro.',
      work: 'No campo profissional, traduza cada conselho em uma ação verificável na próxima semana.',
      spirit: 'No campo espiritual, deixe as imagens repousarem: releia esta tiragem em alguns dias e note o que mudou.',
    }[theme];
    if (lens) parts.push(lens);
  }

  return parts.join(' ');
}

function face(c) {
  return c.reversed ? c.card.reversed : c.card.upright;
}

function keyOf(c) {
  return face(c).keywords.slice(0, 2).join(' e ');
}
