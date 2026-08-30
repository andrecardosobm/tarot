'use client';

import { useMemo, useState } from 'react';
import TarotCard from './TarotCard';
import { CARDS_BY_ID } from '../lib/deck';
import { getSpread, positionsFor, THEMES } from '../lib/spreads';
import { synthesize } from '../lib/synthesis';
import { encodeReading } from '../lib/share';
import { readingToPng, downloadDataUrl } from '../lib/exportImage';
import { saveReading } from '../lib/storage';

/** Painel de revelação, interpretação e síntese de uma tiragem. */
export default function ReadingView({ reading, onRestart, readOnly = false }) {
  const spread = getSpread(reading.spreadId);
  const positions = positionsFor(spread, reading.draw.length);
  const [revealed, setRevealed] = useState(() => (readOnly ? reading.draw.map(() => true) : reading.draw.map(() => false)));
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(null);

  const allRevealed = revealed.every(Boolean);
  const synthesis = useMemo(
    () => synthesize(reading.draw, { question: reading.question, theme: reading.theme }),
    [reading]
  );

  const reveal = (i) =>
    setRevealed((prev) => prev.map((v, idx) => (idx === i ? true : v)));

  const handleSave = () => {
    saveReading({ ...reading, synthesis });
    setSaved(true);
  };

  const handlePng = () => {
    downloadDataUrl(readingToPng(reading, positions, synthesis), `tiragem-${reading.date.slice(0, 10)}.png`);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/tiragem?t=${encodeReading(reading)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Minha tiragem de Tarot', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied('Link copiado para a área de transferência.');
    } catch {
      setCopied(url);
    }
  };

  const themeLabel = THEMES.find((t) => t.id === reading.theme)?.label;

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-gold/80">
          {spread.name} · {reading.draw.length} {reading.draw.length === 1 ? 'carta' : 'cartas'}
          {themeLabel ? ` · ${themeLabel}` : ''}
        </p>
        {reading.question ? (
          <h2 className="font-display text-2xl sm:text-3xl">“{reading.question}”</h2>
        ) : (
          <h2 className="font-display text-2xl sm:text-3xl">Sua leitura</h2>
        )}
        <p className="text-sm text-white/50">{new Date(reading.date).toLocaleString('pt-BR')}</p>
      </header>

      {!allRevealed && !readOnly && (
        <button
          type="button"
          onClick={() => setRevealed(reading.draw.map(() => true))}
          className="no-print rounded-full border border-gold/50 px-5 py-2 text-sm text-gold hover:bg-gold/10"
        >
          Revelar todas
        </button>
      )}

      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reading.draw.map((drawn, i) => {
          const card = CARDS_BY_ID[drawn.cardId];
          const face = drawn.reversed ? card.reversed : card.upright;
          const isOpen = revealed[i];
          return (
            <li
              key={`${drawn.cardId}-${i}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4"
            >
              <div className="flex gap-4">
                <div className="w-24 shrink-0">
                  <TarotCard
                    card={card}
                    revealed={isOpen}
                    reversed={drawn.reversed}
                    onClick={isOpen ? undefined : () => reveal(i)}
                    label={isOpen ? card.name : `Revelar ${positions[i].title}`}
                    size="sm"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-glow">{positions[i].title}</p>
                  <p className="text-xs text-white/50 mt-1">{positions[i].meaning}</p>
                  {isOpen && (
                    <p className="mt-3 font-display text-lg leading-tight">
                      {card.name}
                      {drawn.reversed && <span className="text-gold text-sm"> (invertida)</span>}
                    </p>
                  )}
                  {isOpen && (
                    <p className="text-xs text-white/50">
                      {card.arcana === 'major'
                        ? `Arcano Maior ${card.roman}`
                        : `${card.suitName} · ${card.element} · nº ${card.number}`}
                    </p>
                  )}
                </div>
              </div>

              {isOpen ? (
                <div className="space-y-3 text-sm">
                  <ul className="flex flex-wrap gap-1.5">
                    {face.keywords.map((k) => (
                      <li key={k} className="rounded-full bg-glow/15 px-2.5 py-0.5 text-xs text-glow">
                        {k}
                      </li>
                    ))}
                  </ul>
                  <p><span className="text-gold">Luz:</span> {face.light}</p>
                  <p><span className="text-gold">Sombra:</span> {face.shadow}</p>
                  <p><span className="text-gold">Conselho:</span> {face.advice}</p>
                </div>
              ) : (
                <p className="text-sm text-white/40">Toque na carta para revelar.</p>
              )}
            </li>
          );
        })}
      </ol>

      {allRevealed && (
        <div className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-5 space-y-3">
          <h3 className="font-display text-xl text-gold">Síntese da tiragem</h3>
          <p className="text-sm leading-relaxed text-white/85">{synthesis}</p>
        </div>
      )}

      <div className="no-print flex flex-wrap gap-3 pt-2">
        {!readOnly && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className="rounded-full bg-glow/20 border border-glow/40 px-5 py-2 text-sm hover:bg-glow/30 disabled:opacity-50"
          >
            {saved ? 'Salvo no diário ✓' : 'Salvar no diário'}
          </button>
        )}
        <button type="button" onClick={handlePng} className="rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10">
          Baixar imagem (PNG)
        </button>
        <button type="button" onClick={() => window.print()} className="rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10">
          Exportar PDF
        </button>
        <button type="button" onClick={handleShare} className="rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10">
          Compartilhar link
        </button>
        {onRestart && (
          <button type="button" onClick={onRestart} className="rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10">
            Nova tiragem
          </button>
        )}
      </div>
      {copied && <p className="no-print break-all text-xs text-white/60">{copied}</p>}
    </section>
  );
}
