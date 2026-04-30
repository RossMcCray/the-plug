'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { HookAnalysis } from '@/lib/types';

export default function LibraryPage() {
  const [hooks, setHooks] = useState<HookAnalysis[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('plug_hooks');
    if (stored) setHooks(JSON.parse(stored));
  }, []);

  const deleteHook = (id: string) => {
    const updated = hooks.filter((h) => h.id !== id);
    setHooks(updated);
    localStorage.setItem('plug_hooks', JSON.stringify(updated));
  };

  const sendToSlides = (hook: string) => {
    sessionStorage.setItem('plug_slide_hook', hook);
    router.push('/slides');
  };

  const filtered = hooks.filter(
    (h) =>
      !search ||
      h.niche.toLowerCase().includes(search.toLowerCase()) ||
      h.mainHook.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hook Library</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {hooks.length} saved {hooks.length === 1 ? 'analysis' : 'analyses'}
          </p>
        </div>
        <button
          onClick={() => router.push('/extractor')}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          + New Extract
        </button>
      </div>

      {hooks.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by niche or hook…"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-600"
        />
      )}

      {hooks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-2xl">📚</p>
          <p className="mt-2 text-sm text-zinc-400">Your hook library is empty.</p>
          <p className="text-xs text-zinc-600">
            Run the extractor and save your first analysis.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">No results for "{search}"</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((hook) => (
            <div
              key={hook.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-violet-800 bg-violet-950/50 px-2 py-0.5 text-xs text-violet-300">
                      {hook.niche}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {new Date(hook.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-white">"{hook.mainHook}"</p>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{hook.whyItWorks}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => sendToSlides(hook.mainHook)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-700 hover:text-violet-300"
                  >
                    → Slides
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === hook.id ? null : hook.id)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    {expanded === hook.id ? 'Collapse' : 'Expand'}
                  </button>
                  <button
                    onClick={() => deleteHook(hook.id)}
                    className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-500 hover:border-red-700 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {expanded === hook.id && (
                <div className="mt-5 space-y-4 border-t border-zinc-800 pt-4">
                  {/* Variations */}
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      7 Hook Variations
                    </h3>
                    <ol className="space-y-1.5">
                      {hook.variations.map((v, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-mono text-zinc-600">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-sm text-zinc-300">{v}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(v)}
                              className="text-xs text-zinc-600 hover:text-zinc-400"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => sendToSlides(v)}
                              className="text-xs text-violet-600 hover:text-violet-400"
                            >
                              → Slides
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Pinterest */}
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-pink-500">
                      Pinterest Queries
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hook.pinterestQueries.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => navigator.clipboard.writeText(q)}
                          className="rounded-full border border-pink-900/40 bg-pink-950/20 px-3 py-1 text-xs text-pink-300 hover:bg-pink-900/30"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
