import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { useLangState, I18N } from '../i18n';
import { IconExternalLink, IconRefresh, IconZap } from '../icons';

export function UptimePage({ setLoading }: { setLoading: (loading: boolean) => void }) {
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);
  const [lang] = useLangState();
  const [key, setKey] = useState(0);
  const dict = I18N[lang];
  const uptimeUrl = "https://uptime.vaultwares.ca";

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[var(--border)] mb-4">
        <div>
          <h1 className="text-xl font-bold m-0 flex items-center gap-2">
            <IconZap width={18} height={18} className="text-[var(--accent)]" />
            {lang === 'qc' ? 'Disponibilité des Services' : 'Uptime Status'}
          </h1>
          <p className="m-0 mt-1 text-[var(--muted)] text-[13px]">
            {lang === 'qc'
              ? 'Surveillance de disponibilité en temps réel via Uptime Kuma (uptime.vaultwares.ca)'
              : 'Real-time service uptime monitoring via Uptime Kuma (uptime.vaultwares.ca)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setKey((k) => k + 1)}
            className="min-h-8 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--fg)] transition-colors flex items-center gap-1.5"
            title="Refresh dashboard"
          >
            <IconRefresh width={13} height={13} />
            <span>{lang === 'qc' ? 'Rafraîchir' : 'Refresh'}</span>
          </button>
          <a
            href={uptimeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-8 rounded-full bg-[var(--accent)] text-[var(--vault-console-bg)] px-3 text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 text-decoration-none"
            title="Open uptime.vaultwares.ca in a new tab"
          >
            <span>{lang === 'qc' ? 'Ouvrir Uptime Kuma' : 'Open Uptime Kuma'}</span>
            <IconExternalLink width={13} height={13} />
          </a>
        </div>
      </div>

      {/* Embedded Uptime Kuma Frame */}
      <Card
        className="col-span-12 p-0 overflow-hidden flex flex-col border-[var(--border)]"
        style={{ minHeight: "calc((100vh / 0.8) - 170px)" }}
      >
        <iframe
          key={key}
          src={uptimeUrl}
          title="Uptime Kuma Dashboard"
          className="w-full flex-1 border-0 bg-[var(--vault-console-bg)]"
          style={{ minHeight: "calc((100vh / 0.8) - 180px)" }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        />
      </Card>
    </>
  );
}
