'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { loadAiSettings, canUseAi, PROXY_URL } from '../lib/aiSettings';
import { streamReading, streamFollowUp, describeAiError } from '../lib/ai';

/**
 * Leitura interpretativa gerada por IA, em streaming.
 * A síntese determinística continua sendo o padrão; isto é um complemento.
 */
const SUGESTOES = [
  'O que essa carta do meio quer dizer na prática?',
  'Por que a carta invertida importa aqui?',
  'Qual o primeiro passo concreto?',
];

export default function AiReading({ reading, onText }) {
  const [settings, setSettings] = useState(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | streaming | done | error
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]); // {role: 'user'|'model', text}
  const [question, setQuestion] = useState('');
  const [chatStatus, setChatStatus] = useState('idle'); // idle | streaming | error
  const [chatError, setChatError] = useState('');
  const abortRef = useRef(null);
  const chatAbortRef = useRef(null);

  useEffect(() => {
    setSettings(loadAiSettings());
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      chatAbortRef.current?.abort();
    },
    []
  );

  if (!settings) return null;

  const available = canUseAi(settings);

  const run = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('streaming');
    setError('');
    setText('');
    // Uma leitura nova invalida a conversa sobre a anterior.
    setMessages([]);
    setChatError('');
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

  const ask = async (raw) => {
    const pergunta = (raw || '').trim();
    if (!pergunta || chatStatus === 'streaming') return;

    const historico = messages;
    setQuestion('');
    setChatError('');
    setChatStatus('streaming');
    setMessages([...historico, { role: 'user', text: pergunta }, { role: 'model', text: '' }]);

    const controller = new AbortController();
    chatAbortRef.current = controller;
    let acc = '';
    try {
      await streamFollowUp(reading, {
        apiKey: settings.apiKey,
        model: settings.model,
        tone: settings.tone,
        readingText: text,
        history: historico,
        question: pergunta,
        signal: controller.signal,
        onText: (chunk) => {
          acc += chunk;
          setMessages([...historico, { role: 'user', text: pergunta }, { role: 'model', text: acc }]);
        },
      });
      setChatStatus('idle');
    } catch (err) {
      // Sem a resposta pela metade na tela; o erro explica o que houve.
      setMessages([...historico, { role: 'user', text: pergunta }]);
      setChatError(describeAiError(err));
      setChatStatus('error');
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

      {status === 'done' && (
        <div className="no-print space-y-3 border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-widest text-white/50">Pedir esclarecimentos</p>

          {messages.length > 0 && (
            <ul className="space-y-3">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={
                    m.role === 'user'
                      ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-white/10 px-4 py-2 text-sm'
                      : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-glow/15 px-4 py-2 text-sm leading-relaxed'
                  }
                >
                  {m.text || (chatStatus === 'streaming' && <span className="animate-pulse text-glow">▍</span>)}
                </li>
              ))}
            </ul>
          )}

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60 hover:bg-white/5"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Pergunte sobre a leitura…"
              aria-label="Pergunta sobre a leitura"
              maxLength={300}
              className="flex-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm outline-none focus:border-gold/60"
            />
            <button
              type="submit"
              disabled={chatStatus === 'streaming' || !question.trim()}
              className="rounded-full border border-glow/50 px-4 py-2 text-sm hover:bg-glow/20 disabled:opacity-40"
            >
              {chatStatus === 'streaming' ? 'Respondendo…' : 'Perguntar'}
            </button>
          </form>
          {chatStatus === 'error' && <p className="text-sm text-rose-300">{chatError}</p>}
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
