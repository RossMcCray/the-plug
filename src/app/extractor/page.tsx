'use client';
import { useState, useRef } from 'react';
import type { HookAnalysis, UploadedImage } from '@/lib/types';

export default function ExtractorPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Omit<HookAnalysis, 'id' | 'niche' | 'createdAt'> | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        setImages((prev) => [
          ...prev,
          { data: base64, mediaType: file.type as UploadedImage['mediaType'], name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleExtract = async () => {
    setError('');
    setResult(null);
    setSaved(false);
    if (!images.length) { setError('Upload at least one slideshow image.'); return; }
    if (!niche.trim()) { setError('Enter your niche first.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/extract-hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, niche }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const saveToLibrary = () => {
    if (!result) return;
    const entry: HookAnalysis = {
      id: crypto.randomUUID(),
      niche,
      ...result,
      createdAt: new Date().toISOString(),
    };
    const existing: HookAnalysis[] = JSON.parse(localStorage.getItem('plug_hooks') || '[]');
    localStorage.setItem('plug_hooks', JSON.stringify([entry, ...existing]));
    setSaved(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Hook Extractor</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload TikTok slideshow images → Claude Opus 4.7 reverse-engineers the hook and generates 7 variations.
        </p>
      </div>

      {/* Upload area */}
      <div className="space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 px-6 py-12 transition-colors hover:border-violet-600 hover:bg-violet-950/10"
        >
          <div className="mb-2 text-3xl">📂</div>
          <p className="text-sm text-zinc-300">Drop slideshow images here or click to browse</p>
          <p className="mt-1 text-xs text-zinc-600">JPG, PNG, WebP · Max 10 images</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative h-20 w-12 overflow-hidden rounded-lg border border-zinc-700">
                <img
                  src={`data:${img.mediaType};base64,${img.data}`}
                  alt={img.name}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/70 px-1 text-xs text-zinc-300 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Niche input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Your Niche</label>
        <input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g. skincare for women over 30, home gym on a budget, budget travel"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/50"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        onClick={handleExtract}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Analyzing with Claude…
          </>
        ) : (
          '🧠 Extract Hook'
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <hr className="border-zinc-800" />

          {/* Main hook */}
          <div className="rounded-xl border border-violet-800/50 bg-violet-950/20 p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
              Main Hook Identified
            </h2>
            <p className="text-lg font-semibold text-white">"{result.mainHook}"</p>
          </div>

          {/* Why it works */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Why It Works
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">{result.whyItWorks}</p>
          </div>

          {/* 7 variations */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              7 Hook Variations for "{niche}"
            </h2>
            <ol className="space-y-2">
              {result.variations.map((v, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-mono text-zinc-500">
                    {i + 1}
                  </span>
                  <span className="text-sm text-zinc-200">{v}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(v)}
                    className="ml-auto shrink-0 text-xs text-zinc-600 hover:text-zinc-400"
                    title="Copy"
                  >
                    Copy
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* Pinterest queries */}
          <div className="rounded-xl border border-pink-900/40 bg-pink-950/10 p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-pink-400">
              5 Pinterest Search Queries
            </h2>
            <div className="flex flex-wrap gap-2">
              {result.pinterestQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => navigator.clipboard.writeText(q)}
                  className="rounded-full border border-pink-900 bg-pink-950/40 px-3 py-1 text-xs text-pink-300 hover:bg-pink-900/40"
                  title="Click to copy"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-600">Click a query to copy it</p>
          </div>

          {/* Save */}
          <button
            onClick={saveToLibrary}
            disabled={saved}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saved ? '✓ Saved to Library' : 'Save to Hook Library'}
          </button>
        </div>
      )}
    </div>
  );
}
