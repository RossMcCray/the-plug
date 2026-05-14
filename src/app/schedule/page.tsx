'use client';
import { useState } from 'react';

interface PostEntry {
  id: string;
  caption: string;
  filePath: string;
  scheduledAt: string;
}

function toIso(local: string): string {
  if (!local) return '';
  return new Date(local).toISOString();
}

// POSIX single-quote shell quoting: wrap in '', escaping any embedded ' as '"'"'
function shellQuote(value: string): string {
  return `'${value.split("'").join(`'"'"'`)}'`;
}

const isReady = (e: PostEntry) => Boolean(e.caption && e.filePath && e.scheduledAt);

function buildCommand(entry: PostEntry): string {
  return `postiz posts:create -c ${shellQuote(entry.caption)} -m ${shellQuote(entry.filePath)} -s ${shellQuote(toIso(entry.scheduledAt))}`;
}

function buildBatchScript(entries: PostEntry[]): string {
  return entries.filter(isReady).map(buildCommand).join('\n');
}

export default function SchedulePage() {
  const [entries, setEntries] = useState<PostEntry[]>([
    { id: crypto.randomUUID(), caption: '', filePath: './makeugc_output/slide_01.png', scheduledAt: '' },
  ]);
  const [copied, setCopied] = useState(false);

  const update = (id: string, field: keyof Omit<PostEntry, 'id'>, value: string) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  const addRow = () =>
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        caption: prev[prev.length - 1]?.caption ?? '',
        filePath: `./makeugc_output/slide_0${prev.length + 1}.png`,
        scheduledAt: '',
      },
    ]);

  const removeRow = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const copyAll = () => {
    navigator.clipboard.writeText(buildBatchScript(entries));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readyCount = entries.filter(isReady).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Schedule Generator</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Generate Postiz CLI commands to queue your slides as TikTok drafts.
          <span className="ml-1 text-zinc-600">Tap Post manually from TikTok at peak time.</span>
        </p>
      </div>

      {/* Golden Rule reminder */}
      <div className="flex gap-3 rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <span className="text-xl">🔑</span>
        <div>
          <p className="text-sm font-medium text-amber-300">The Golden Rule</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
            Never publish directly via API. Postiz queues your content as a <strong className="text-zinc-200">draft</strong>.
            When notified, open TikTok on your phone and tap Post — TikTok sees a human device, preserving
            full organic reach.
          </p>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-3 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          <div className="col-span-4">Caption</div>
          <div className="col-span-4">File path</div>
          <div className="col-span-3">Schedule (local time)</div>
          <div className="col-span-1" />
        </div>

        {entries.map((entry, i) => (
          <div key={entry.id} className="grid grid-cols-12 items-center gap-3">
            <input
              value={entry.caption}
              onChange={(e) => update(entry.id, 'caption', e.target.value)}
              placeholder={`Caption ${i + 1} + hashtags`}
              className="col-span-4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-600"
            />
            <input
              value={entry.filePath}
              onChange={(e) => update(entry.id, 'filePath', e.target.value)}
              placeholder="./slide_01.png"
              className="col-span-4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-violet-600"
            />
            <input
              type="datetime-local"
              value={entry.scheduledAt}
              onChange={(e) => update(entry.id, 'scheduledAt', e.target.value)}
              className="col-span-3 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-600 [color-scheme:dark]"
            />
            <button
              onClick={() => removeRow(entry.id)}
              disabled={entries.length === 1}
              className="col-span-1 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-600 hover:border-red-900 hover:text-red-500 disabled:opacity-30"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
      >
        + Add post
      </button>

      {/* Generated commands */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Generated Commands
            {readyCount > 0 && (
              <span className="ml-2 rounded-full bg-violet-950 px-2 py-0.5 text-violet-300">
                {readyCount} ready
              </span>
            )}
          </h2>
          <button
            onClick={copyAll}
            disabled={readyCount === 0}
            className="rounded-lg border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 disabled:opacity-40"
          >
            {copied ? '✓ Copied!' : 'Copy All'}
          </button>
        </div>

        <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 font-mono text-xs leading-relaxed text-zinc-300">
          {entries.some(isReady)
            ? entries.filter(isReady).map(buildCommand).join('\n')
            : '# Fill in caption, file path, and schedule time to generate commands'}
        </pre>
      </div>

      {/* Installation note */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Postiz Setup
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Install Postiz', cmd: 'npm install -g @postiz/cli' },
            { label: 'Authenticate', cmd: 'postiz auth:login' },
            { label: 'Run batch', cmd: '# paste the commands above and run them' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-zinc-600">{s.label}</span>
              <code className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-300">
                {s.cmd}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(s.cmd)}
                className="text-xs text-zinc-600 hover:text-zinc-400"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
