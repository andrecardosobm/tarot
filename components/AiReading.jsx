'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { loadAiSettings, canUseAi, PROXY_URL } from '../lib/aiSettings';
import { streamReading, describeAiError } from '../lib/ai';

/**
 * Leitura interpretativa gerada por IA, em streaming.
 * A síntese determinística continua sendo o padrão; isto é um complemento.
 */
export default function AiReading({ reading, onText }) {
  const [settings, setSettings] = useState(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | streaming | done | error
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    setSettings(loadAiSettings());
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!settings) return null;

  const available = canUseAi(settings);

  const run = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('streaming');
    setError('');
    setText('');
    let acc = '';
    try {
      const final = await streamReading(reading, {
        apiKey: settings.apiKey,
        model: settings.model,
        tone: settings.tone,
        signal: controller.signal,
        onText: (chunk) => {
          acc += chunk;
          setText(acc);
        },
      });
      setText(final);
      setStatus('done');
      onText?.(final);
    } catch (err) {
      setError(describeAiError(err));
      setStatus('error');
    }
  };

  return (
    <div className="rounded-2xl border border-glow/30 bg-glow/[0.06] p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-glow">Leitura interpretada por IA</h3>
        {available ? (
          <button
            type="button"
            onClick={run}
            disabled={status === 'streaming'}
            className="no-print rounded-full border border-glow/50 px-5 py-2 text-sm hover:bg-glow/20 disabled:opacity-50"
          >
            {status === 'streaming' ? 'Lendo as cartas…' : status === 'done' ? 'Ler novamente' : 'Gerar leitura'}
          </button>
        ) : (
          <Link
            href="/ajustes/"
            className="no-print rounded-full border border-glow/50 px-5 py-2 text-sm hover:bg-glow/20"
          >
            Configurar IA
          </Link>
        )}
      </div>

      {!available && (
        <p className="text-sm text-white/60">
          {PROXY_URL
            ? 'Ative a leitura por IA em Ajustes.'
            : 'Esta é uma aplicação sem servidor: para usar a IA, informe sua própria chave da API Gemini em Ajustes. Ela fica guardada só no seu navegador.'}
        </p>
      )}

      {text && (
        <div className="space-y-3 text-sm leading-relaxed text-white/85">
          {text.split(/\n{2,}/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          {status === 'streaming' && <span className="inline-block animate-pulse text-glow">▍</span>}
        </div>
      )}

      {status === 'streaming' && !text && <p className="text-sm text-white/50">Consultando as cartas…</p>}
      {status === 'error' && <p className="text-sm text-rose-300">{error}</p>}
      {status === 'done' && (
        <p className="text-xs text-white/40">
          Gerado por IA a partir das cartas desta tiragem. Leitura simbólica, para reflexão — não substitui
          orientação profissional.
        </p>
      )}
    </div>
  );
}
