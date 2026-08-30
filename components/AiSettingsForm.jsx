'use client';

import { useEffect, useState } from 'react';
import { loadAiSettings, saveAiSettings, TONES, PROXY_URL, DEFAULTS } from '../lib/aiSettings';
import { MODEL } from '../lib/ai';

export default function AiSettingsForm() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadAiSettings());
  }, []);

  if (!settings) return <p className="text-white/50">Carregando…</p>;

  const update = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const persist = () => {
    saveAiSettings(settings);
    setSaved(true);
  };

  const forget = () => {
    saveAiSettings(DEFAULTS);
    setSettings(DEFAULTS);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Leitura por IA</h1>
        <p className="text-sm text-white/60">
          Além da síntese automática, a tiragem pode ser interpretada por um modelo Claude
          (<code className="text-glow">{MODEL}</code>), que lê as cartas em conjunto com a sua pergunta.
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
          <label htmlFor="apiKey" className="text-sm text-white/70">Sua chave da API da Anthropic</label>
          <input
            id="apiKey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={settings.apiKey}
            onChange={(e) => update({ apiKey: e.target.value.trim() })}
            placeholder="sk-ant-…"
            className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 font-mono text-sm outline-none focus:border-gold/60"
          />
          <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-4 text-xs leading-relaxed text-white/70">
            <p className="text-gold">Antes de colar sua chave, entenda o modelo de segurança:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                Este site é estático (GitHub Pages), sem servidor onde guardar segredos. A chave fica no
                <code> localStorage</code> deste navegador e vai direto do seu dispositivo para a API da Anthropic —
                não passa por nenhum servidor nosso.
              </li>
              <li>
                Quem tiver acesso a este navegador (ou a uma extensão com permissão de leitura) consegue lê-la.
                Use uma chave dedicada, com limite de gasto definido no console da Anthropic, e revogue-a se sumir.
              </li>
              <li>
                Não use aqui uma chave compartilhada com a equipe ou de produção.
              </li>
              <li>
                Para uso público, prefira hospedar o proxy descrito em <code>proxy/README.md</code> e definir
                <code> NEXT_PUBLIC_AI_PROXY_URL</code> — aí a chave fica no servidor e este campo desaparece.
              </li>
            </ul>
            <p className="mt-2">
              Cada leitura custa centavos, cobrados na sua conta:{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer noopener"
                className="text-glow underline"
              >
                criar uma chave
              </a>
              .
            </p>
          </div>
        </div>
      )}

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
          onClick={forget}
          className="rounded-full border border-white/20 px-6 py-2 text-sm hover:bg-white/10"
        >
          Apagar chave deste navegador
        </button>
      </div>
    </div>
  );
}
