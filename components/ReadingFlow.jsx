'use client';

import { useMemo, useState } from 'react';
import DeckTable from './DeckTable';
import ManualDraw from './ManualDraw';
import ReadingView from './ReadingView';
import { DECK } from '../lib/deck';
import { SPREADS, getSpread, positionsFor, THEMES } from '../lib/spreads';
import { shuffle, cut, coinFlip } from '../lib/random';

const STEP = { SETUP: 'setup', TABLE: 'table', MANUAL: 'manual', READING: 'reading' };

// mesa: o site embaralha e a pessoa puxa as cartas na tela.
// manual: a pessoa tirou as cartas no baralho físico e só registra quais foram.
const MODOS = [
  { id: 'mesa', label: 'Puxar na mesa virtual', hint: 'o site embaralha as 78 cartas e você escolhe' },
  { id: 'manual', label: 'Já tirei minhas cartas', hint: 'registre as cartas do seu baralho físico' },
];

export default function ReadingFlow() {
  const [step, setStep] = useState(STEP.SETUP);
  const [mode, setMode] = useState('mesa');
  const [spreadId, setSpreadId] = useState('three-time');
  const [freeCount, setFreeCount] = useState(5);
  const [question, setQuestion] = useState('');
  const [theme, setTheme] = useState('general');
  const [allowReversed, setAllowReversed] = useState(true);
  const [deck, setDeck] = useState(() => DECK);
  const [picked, setPicked] = useState([]);
  const [shuffling, setShuffling] = useState(false);
  const [reading, setReading] = useState(null);

  const spread = getSpread(spreadId);
  const count = spread.variable ? freeCount : spread.count;
  const positions = useMemo(() => positionsFor(spread, count), [spread, count]);
  const remaining = count - picked.length;

  const doShuffle = () => {
    setShuffling(true);
    setDeck(cut(shuffle(DECK)));
    setPicked([]);
    window.setTimeout(() => setShuffling(false), 620);
  };

  const start = () => {
    if (mode === 'manual') {
      // Uma vaga por posição, preenchida na ordem que a pessoa quiser.
      setPicked(Array.from({ length: count }, () => null));
      setStep(STEP.MANUAL);
      return;
    }
    setDeck(cut(shuffle(DECK)));
    setPicked([]);
    setStep(STEP.TABLE);
  };

  const pick = (card) => {
    if (picked.length >= count || picked.some((p) => p.cardId === card.id)) return;
    setPicked((prev) => [...prev, { cardId: card.id, reversed: allowReversed ? coinFlip() : false }]);
  };

  const openReading = () => {
    setReading({
      id: `r-${Date.now()}`,
      date: new Date().toISOString(),
      spreadId,
      question: question.trim(),
      theme,
      source: mode,
      draw: picked.filter(Boolean),
    });
    setStep(STEP.READING);
  };

  const restart = () => {
    setReading(null);
    setPicked([]);
    setStep(STEP.SETUP);
  };

  if (step === STEP.READING && reading) {
    return <ReadingView reading={reading} onRestart={restart} />;
  }

  if (step === STEP.MANUAL) {
    const faltam = picked.filter((p) => !p?.cardId).length;
    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">{spread.name}</p>
            <h2 className="font-display text-2xl">Registre as cartas que você tirou</h2>
            <p className="mt-1 text-sm text-white/60">
              Informe a carta de cada posição, na ordem em que saíram, e marque as que vieram invertidas.
            </p>
            {question && <p className="mt-1 text-sm text-white/60">“{question}”</p>}
          </div>
          <button type="button" onClick={restart} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
            Voltar
          </button>
        </div>

        <ManualDraw positions={positions} picked={picked} onChange={setPicked} />

        <button
          type="button"
          onClick={openReading}
          disabled={faltam > 0}
          className="w-full rounded-full bg-gold/90 px-6 py-3 font-medium text-ink hover:bg-gold disabled:opacity-40"
        >
          {faltam > 0
            ? `Faltam ${faltam} ${faltam === 1 ? 'carta' : 'cartas'}`
            : 'Abrir a leitura'}
        </button>
      </section>
    );
  }

  if (step === STEP.TABLE) {
    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">{spread.name}</p>
            <h2 className="font-display text-2xl">
              {remaining > 0
                ? `Escolha ${remaining} ${remaining === 1 ? 'carta' : 'cartas'}`
                : 'Cartas escolhidas — abra a leitura'}
            </h2>
            {question && <p className="text-sm text-white/60 mt-1">“{question}”</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={doShuffle} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
              Embaralhar e cortar
            </button>
            <button type="button" onClick={restart} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
              Voltar
            </button>
          </div>
        </div>

        <ol className="flex flex-wrap gap-3">
          {positions.map((p, i) => (
            <li
              key={p.title + i}
              className={`min-w-[9rem] flex-1 rounded-xl border p-3 text-xs ${
                picked[i] ? 'border-glow/50 bg-glow/10' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <span className="block text-[10px] uppercase tracking-widest text-white/50">Posição {i + 1}</span>
              <span className="block text-white/90">{p.title}</span>
              <span className="block text-white/40">{picked[i] ? 'carta puxada ✦' : 'aguardando'}</span>
            </li>
          ))}
        </ol>

        <DeckTable
          deck={deck}
          selectedIds={picked.map((p) => p.cardId)}
          onPick={pick}
          remaining={remaining}
          shuffling={shuffling}
        />

        <button
          type="button"
          onClick={openReading}
          disabled={remaining > 0}
          className="w-full rounded-full bg-gold/90 px-6 py-3 font-medium text-ink hover:bg-gold disabled:opacity-40"
        >
          {remaining > 0 ? `Faltam ${remaining}` : 'Abrir a leitura'}
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl">Faça sua pergunta ao baralho</h1>
        <p className="max-w-2xl text-white/60">
          Setenta e oito arcanos, embaralhados a cada consulta com Fisher-Yates e aleatoriedade
          criptográfica. Registre sua intenção, escolha o método e puxe você mesmo as cartas.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="question" className="text-sm text-white/70">Sua pergunta ou intenção (opcional)</label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          maxLength={240}
          placeholder="O que preciso enxergar sobre..."
          className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm outline-none focus:border-gold/60"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`rounded-full px-3 py-1 text-xs border ${
                theme === t.id ? 'border-gold text-gold bg-gold/10' : 'border-white/15 text-white/60 hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-white/70">Como você vai tirar as cartas</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                mode === m.id ? 'border-gold/70 bg-gold/[0.08]' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <span className="block font-display text-lg">{m.label}</span>
              <span className="mt-1 block text-sm text-white/60">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-white/70">Método de tiragem</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SPREADS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSpreadId(s.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                spreadId === s.id ? 'border-gold/70 bg-gold/[0.08]' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <span className="block font-display text-lg">{s.name}</span>
              <span className="block text-xs uppercase tracking-widest text-glow">{s.subtitle}</span>
              <span className="mt-2 block text-sm text-white/60">{s.description}</span>
            </button>
          ))}
        </div>
        {spread.variable && (
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <label htmlFor="freeCount" className="text-sm text-white/70">Quantidade de cartas</label>
            <input
              id="freeCount"
              type="range"
              min={1}
              max={10}
              value={freeCount}
              onChange={(e) => setFreeCount(Number(e.target.value))}
              className="flex-1 accent-amber-300"
            />
            <span className="w-8 text-center font-display text-lg text-gold">{freeCount}</span>
          </div>
        )}
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
        <input
          type="checkbox"
          checked={allowReversed}
          onChange={(e) => setAllowReversed(e.target.checked)}
          className="h-4 w-4 accent-amber-300"
        />
        <span>
          Permitir cartas invertidas
          <span className="block text-xs text-white/50">A inversão é sorteada no momento em que você puxa cada carta.</span>
        </span>
      </label>

      <button
        type="button"
        onClick={start}
        className="w-full rounded-full bg-gold/90 px-6 py-3 font-medium text-ink hover:bg-gold"
      >
        {mode === 'manual' ? 'Registrar minhas cartas' : 'Embaralhar e ir para a mesa'}
      </button>
    </section>
  );
}
