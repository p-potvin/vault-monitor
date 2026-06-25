import { useState } from 'react';
import { useChangesData } from '../useData';
import { I18N, useLangState, type Lang } from '../i18n';
import { parseKinds, isKnownKind } from '../types';
import { IconClock, IconFolder } from '../icons';

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function EventCard({
  event,
  lang,
}: {
  event: {
    createdAt?: string;
    createdAtLocal?: string;
    project?: string;
    kind?: string;
    summary?: string;
    actor?: string;
    agentHeader?: string;
    commands?: string[];
    files?: string[];
    planPath?: string;
    git?: { repo?: string; branch?: string; head?: string };
    telemetry?: {
      flags?: Record<string, unknown>;
      metrics?: Record<string, unknown>;
    };
  };
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const dict = I18N[lang];
  const created = event.createdAtLocal || event.createdAt || '';
  const project = event.project || dict.generalTasks;
  const kinds = parseKinds(event.kind);
  const summary = event.summary || '';
  const preview =
    summary.length > 180 ? summary.slice(0, 177) + '...' : summary;

  return (
    <details
      className="border border-[var(--border)] rounded-lg my-2.5 bg-[var(--card)] open:bg-[var(--v-surface2)]"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer px-3.5 py-3 leading-relaxed select-none list-none [&::-webkit-details-marker]:hidden hover:bg-[rgba(255,255,255,0.04)]">
        <strong>
          <IconClock className="inline w-3.5 h-3.5 mr-1 opacity-60 align-[-2px]" />{created} -{' '}
          <IconFolder className="inline w-3.5 h-3.5 mr-1 opacity-60 align-[-2px]" />{project}
        </strong>{' '}
        {kinds.map((k) => (
          <span
            key={k}
            className={`font-mono text-[11px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
              isKnownKind(k)
                ? 'bg-[var(--chip)] border border-[var(--v-gold-dim)] text-[var(--accent)]'
                : 'bg-transparent border border-dashed border-[var(--v-gold-dim)] text-[var(--muted)]'
            }`}
          >
            {k}
          </span>
        ))}
        {preview && (
          <span className="text-[var(--muted)] text-sm"> - {preview}</span>
        )}
      </summary>
      <div className="px-3.5 pb-3.5 pl-8">
        <p>
          <strong>{dict.changesLabels.kind}:</strong> {kinds.join(', ')}
        </p>
        {event.actor && (
          <p>
            <strong>{dict.changesLabels.actor}:</strong> {event.actor}
          </p>
        )}
        {event.agentHeader && (
          <>
            <p>
              <strong>{dict.changesLabels.agentHeader}:</strong>
            </p>
            <pre className="text-xs bg-[var(--v-surface2)] border border-[var(--border)] rounded p-2 overflow-auto">
              <code>{event.agentHeader}</code>
            </pre>
          </>
        )}
        {event.telemetry && (
          <>
            <p>
              <strong>{dict.changesLabels.telemetry}:</strong>
            </p>
            <ul className="text-xs">
              {event.telemetry.flags && (
                <li>
                  <strong>{dict.changesLabels.flags}:</strong>{' '}
                  {Object.entries(event.telemetry.flags)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(', ')}
                </li>
              )}
              {event.telemetry.metrics && (
                <li>
                  <strong>{dict.changesLabels.metrics}:</strong>{' '}
                  <code>
                    {JSON.stringify(event.telemetry.metrics).slice(0, 220)}
                  </code>
                </li>
              )}
            </ul>
          </>
        )}
        {summary && (
          <p className="my-2.5">
            <strong>{dict.changesLabels.summary}:</strong> {summary}
          </p>
        )}
        {event.commands && event.commands.length > 0 && (
          <>
            <p>
              <strong>{dict.changesLabels.commands}:</strong>
            </p>
            <ul className="text-xs">
              {event.commands.map((c, i) => (
                <li key={i} className="my-1">
                  <code>{c}</code>
                </li>
              ))}
            </ul>
          </>
        )}
        {event.files && event.files.length > 0 && (
          <>
            <p>
              <strong>{dict.changesLabels.files}:</strong>
            </p>
            <ul className="text-xs">
              {event.files.map((f, i) => (
                <li key={i} className="my-1">
                  <code>{f}</code>
                </li>
              ))}
            </ul>
          </>
        )}
        {event.planPath && (
          <p>
            <strong>{dict.changesLabels.plan}:</strong> <code>{event.planPath}</code>
          </p>
        )}
        {event.git && (
          <p>
            <strong>{dict.changesLabels.git}:</strong>{' '}
            {[
              event.git.repo && `repo=${event.git.repo}`,
              event.git.branch && `branch=${event.git.branch}`,
              event.git.head && `head=${event.git.head}`,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
      </div>
    </details>
  );
}

export function LedgerPage() {
  const { events, loading, error } = useChangesData();
  const [lang] = useLangState();
  const dict = I18N[lang];

  if (loading) {
    return (
      <div className="text-center py-20 text-[var(--muted)]">{dict.errors.loading}</div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-20 text-[var(--v-burgundy)]">
        {dict.errors.failedToLoad}: {error}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[var(--border)] mb-1">
        <div>
          <h1 className="text-[28px] font-extrabold m-0 mb-2 tracking-tight">
            {dict.changesTitle}
          </h1>
          <p className="m-0 text-[var(--muted)] text-[13px]">
            {dict.changesSubtitle}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-[var(--muted)]">{dict.noEvents}</p>
      ) : (
        events.map((ev, i) => <EventCard key={i} event={ev} lang={lang} />)
      )}
    </>
  );
}
