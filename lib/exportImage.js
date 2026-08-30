import { CARDS_BY_ID } from './deck';

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

/** Desenha um resumo da tiragem em canvas e devolve um data URL PNG. */
export function readingToPng(reading, positions, synthesis) {
  const width = 1080;
  const lineH = 30;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Primeira passada: medir a altura necessária.
  ctx.font = '20px Georgia, serif';
  const blocks = reading.draw.map((d, i) => {
    const card = CARDS_BY_ID[d.cardId];
    const face = d.reversed ? card.reversed : card.upright;
    const body = `${face.light} Conselho: ${face.advice}`;
    return {
      title: `${i + 1}. ${positions[i]?.title || `Carta ${i + 1}`} — ${card.name}${d.reversed ? ' (invertida)' : ''}`,
      lines: wrap(ctx, body, width - 120),
    };
  });
  const synthLines = synthesis
    .split(/\n{2,}/)
    .flatMap((paragraph, i) => (i ? ['', ...wrap(ctx, paragraph, width - 120)] : wrap(ctx, paragraph, width - 120)));
  const height =
    260 + blocks.reduce((acc, b) => acc + 44 + b.lines.length * lineH, 0) + 90 + synthLines.length * lineH;

  canvas.width = width;
  canvas.height = height;

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#150e26');
  bg.addColorStop(1, '#0b0713');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#d9b168';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText('Tiragem de Tarot', 60, 90);

  ctx.fillStyle = '#c9c2df';
  ctx.font = '22px Georgia, serif';
  ctx.fillText(new Date(reading.date).toLocaleString('pt-BR'), 60, 130);
  if (reading.question) {
    ctx.fillStyle = '#ece7f7';
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText(`“${reading.question.slice(0, 80)}”`, 60, 175);
  }

  let y = 235;
  blocks.forEach((b) => {
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(b.title, 60, y);
    y += 36;
    ctx.fillStyle = '#ece7f7';
    ctx.font = '20px Georgia, serif';
    b.lines.forEach((l) => {
      ctx.fillText(l, 60, y);
      y += lineH;
    });
    y += 14;
  });

  y += 20;
  ctx.fillStyle = '#d9b168';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Síntese', 60, y);
  y += 38;
  ctx.fillStyle = '#ece7f7';
  ctx.font = '20px Georgia, serif';
  synthLines.forEach((l) => {
    ctx.fillText(l, 60, y);
    y += lineH;
  });

  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
