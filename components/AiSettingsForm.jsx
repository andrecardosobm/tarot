'use client';

import { useEffect, useState } from 'react';
import { loadAiSettings, saveAiSettings, TONES, PROXY_URL, DEFAULTS } from '../lib/aiSettings';
import { MODELS, testConnection, describeAiError } from '../lib/ai';

export default function AiSettingsForm() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState(null); // {status, message}

  useEffect(() => {
    setSettings(loadAiSettings());
  }, []);

  if (!settings) return <p className="text-white/50">Carregando…</p>;

  const update = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaved(false);
    setTest(null);
  };

  const persist = () => {
    saveAiSettings(settings);
    setSaved(true);
  };

  const forget = () => {
    saveAiSettings(DEFAULTS);
    setSettings(DEFAULTS);
    setSaved(true);
    setTest(null);
  };

  const runTest = async () => {
    setTest({ status: 'running', message: 'Chamando a API…' });
    try {
      const reply = await testConnection({ apiKey: settings.apiKey, model: settings.model });
      setTest({ status: 'ok', message: `Conexão funcionando. O modelo respondeu: “${reply}”.` });
    } catch (err) {
      setTest({ status: 'error', message: describeAiError(err) });
    }
  };

  const canTest = Boolean(PROXY_URL || settings.apiKey);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Leitura por IA</h1>
        <p className="text-sm text-white/60">
          Além da síntese automática, a tiragem pode ser interpretada pelo Gemini, que lê as cartas
          em conjunto com a sua pergunta e as posições da tiragem.
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
          className="h-4 w-4 accent-amber-300"
        />
        <span>Ativar leitura interpretada por IA</span>
      </label>

      {PROXY_URL ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
          Este site usa um servidor intermediário próprio, então nenhuma chave é necessária aqui.
        </p>
      ) : (
        <div className="space-y-2">
          <label htmlFor="apiKey" className="text-sm text-white/70">Sua chave da API Gemini</label>
          <input
            id="apiKey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={settings.apiKey}
            onChange={(e) => update({ apiKey: e.target.value.trim() })}
            placeholder="AIza…"
            className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 font-mono text-sm outline-none focus:border-gold/60"
          />
          <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-4 text-xs leading-relaxed text-white/70">
            <p className="text-gold">Antes de colar sua chave, entenda o modelo de segurança:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                Este site é estático (GitHub Pages), sem servidor onde guardar segredos. A chave fica no
                <code> localStorage</code> deste navegador e vai direto do seu dispositivo para a API do Google —
                não passa por nenhum servidor nosso.
              </li>
              <li>
                Quem tiver acesso a este navegador (ou a uma extensão com permissão de leitura) consegue lê-la.
                Use uma chave dedicada e restrinja-a no Google AI Studio; revogue-a se sumir.
              </li>
              <li>Não use aqui uma chave compartilhada com a equipe ou de produção.</li>
              <li>
                Para uso público, prefira hospedar o proxy descrito em <code>proxy/README.md</code> e definir
                <code> NEXT_PUBLIC_AI_PROXY_URL</code> — aí a chave fica no servidor e este campo desaparece.
              </li>
            </ul>
            <p className="mt-2">
              A API tem um nível gratuito com limites de uso:{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer noopener"
                className="text-glow underline"
              >
                criar uma chave no Google AI Studio
              </a>
              .
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="model" className="text-sm text-white/70">Modelo</label>
        <select
          id="model"
          value={settings.model}
          onChange={(e) => update({ model: e.target.value })}
          className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm outline-none focus:border-gold/60"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-veil">
              {m.label} — {m.hint}
            </option>
          ))}
        </select>
        <p className="text-xs text-white/40">
          Nem toda chave tem acesso a todos os modelos. Use o teste abaixo para confirmar.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-white/70">Tom da leitura</p>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ tone: t.id })}
              className={`rounded-full px-3 py-1 text-xs border ${
                settings.tone === t.id ? 'border-gold text-gold bg-gold/10' : 'border-white/15 text-white/60 hover:bg-white/5'
              }`}
              title={t.hint}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={persist}
          className="rounded-full bg-gold/90 px-6 py-2 font-medium text-ink hover:bg-gold"
        >
          {saved ? 'Salvo ✓' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={runTest}
          disabled={!canTest || test?.status === 'running'}
          className="rounded-full border border-glow/50 px-6 py-2 text-sm hover:bg-glow/20 disabled:opacity-40"
        >
          Testar conexão
        </button>
        <button
          type="button"
          onClick={forget}
          className="rounded-full border border-white/20 px-6 py-2 text-sm hover:bg-white/10"
        >
          Apagar chave deste navegador
        </button>
      </div>

      {test && (
        <p
          className={`text-sm ${
            test.status === 'error' ? 'text-rose-300' : test.status === 'ok' ? 'text-emerald-300' : 'text-white/60'
          }`}
        >
          {test.message}
        </p>
      )}
    </div>
  );
}
