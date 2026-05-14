'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SlideSet } from '@/lib/types';

const SLIDE_W = 1080;
const SLIDE_H = 1920;
const PREVIEW_H = 320;
const PREVIEW_W = Math.round((PREVIEW_H * SLIDE_W) / SLIDE_H);

const SLIDE_LABELS = ['Hook', 'Problem', 'Value 1', 'Value 2', 'Value 3', 'CTA'];
const SLIDE_PLACEHOLDERS = [
  'The scroll-stopping hook (e.g. "I tried this for 30 days and…")',
  'Agitate the pain point (e.g. "Most people waste hours on this…")',
  'Tip 1 or insight (e.g. "Step 1: Start with…")',
  'Tip 2 or insight (e.g. "Step 2: Then add…")',
  'Tip 3 or insight (e.g. "Step 3: Finally…")',
  'Call to action (e.g. "Comment GUIDE and I\'ll send you the full routine")',
];

const DEFAULT_SLIDES: SlideSet = {
  hook: '',
  problem: '',
  value1: '',
  value2: '',
  value3: '',
  cta: '',
};

function slideText(slides: SlideSet, index: number): string {
  return [slides.hook, slides.problem, slides.value1, slides.value2, slides.value3, slides.cta][index];
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function renderSlide(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  text: string,
  label: string,
  index: number,
  bgImg: HTMLImageElement | null
) {
  ctx.clearRect(0, 0, w, h);

  if (bgImg && bgImg.width > 0) {
    const scale = Math.max(w / bgImg.width, h / bgImg.height);
    const dx = (w - bgImg.width * scale) / 2;
    const dy = (h - bgImg.height * scale) / 2;
    ctx.drawImage(bgImg, dx, dy, bgImg.width * scale, bgImg.height * scale);
    const overlay = ctx.createLinearGradient(0, 0, 0, h);
    overlay.addColorStop(0, 'rgba(0,0,0,0.25)');
    overlay.addColorStop(0.45, 'rgba(0,0,0,0.10)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    const palettes = [
      ['#4c1d95', '#1e1b4b'],
      ['#7f1d1d', '#1c1917'],
      ['#064e3b', '#0f172a'],
      ['#1e3a5f', '#0f172a'],
      ['#713f12', '#1c1917'],
      ['#1a1a2e', '#16213e'],
    ];
    const [c1, c2] = palettes[index % palettes.length];
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  const scale = w / SLIDE_W;
  const baseFontSize = 90;
  const fontSize = Math.round(baseFontSize * scale);
  const lineHeight = Math.round(fontSize * 1.3);
  const margin = Math.round(80 * scale);

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = `${Math.round(34 * scale)}px -apple-system, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(label.toUpperCase(), margin, margin + Math.round(20 * scale));

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `bold ${Math.round(30 * scale)}px -apple-system, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`${index + 1}/6`, w - margin, margin + Math.round(20 * scale));

  if (!text.trim()) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = `${Math.round(44 * scale)}px -apple-system, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Enter text below', w / 2, h / 2);
    return;
  }

  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px -apple-system, Arial, sans-serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, text, w / 2, h / 2, w - margin * 2, lineHeight);
}

export default function SlidesPage() {
  // Lazy init: read sessionStorage hook on first render, no setState-in-effect
  const [slides, setSlides] = useState<SlideSet>(() => {
    if (typeof window === 'undefined') return DEFAULT_SLIDES;
    const hook = window.sessionStorage.getItem('plug_slide_hook');
    return hook ? { ...DEFAULT_SLIDES, hook } : DEFAULT_SLIDES;
  });

  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null, null, null]);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([null, null, null, null, null, null]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only clear the sessionStorage key — no setState here
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('plug_slide_hook');
    }
  }, []);

  const redrawAll = useCallback(() => {
    canvasRefs.current.forEach((canvas, i) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderSlide(ctx, PREVIEW_W, PREVIEW_H, slideText(slides, i), SLIDE_LABELS[i], i, bgImg);
    });
  }, [slides, bgImg]);

  useEffect(() => { redrawAll(); }, [redrawAll]);

  const setSlideField = (field: keyof SlideSet, value: string) =>
    setSlides((s) => ({ ...s, [field]: value }));

  const fields = Object.keys(DEFAULT_SLIDES) as (keyof SlideSet)[];

  const downloadSlide = (index: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = SLIDE_W;
    canvas.height = SLIDE_H;
    const ctx = canvas.getContext('2d')!;
    renderSlide(ctx, SLIDE_W, SLIDE_H, slideText(slides, index), SLIDE_LABELS[index], index, bgImg);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slide_0${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const downloadAll = () => {
    [0, 1, 2, 3, 4, 5].forEach((i) => setTimeout(() => downloadSlide(i), i * 300));
  };

  const handleBgUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setBgDataUrl(dataUrl);
      const img = new Image();
      img.onload = () => setBgImg(img);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const removeBg = () => {
    setBgDataUrl(null);
    setBgImg(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Slide Builder</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Generate 6 TikTok-ready slides (1080×1920 PNG) with your hook text and background image.
          </p>
        </div>
        <button
          onClick={downloadAll}
          className="shrink-0 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Download All
        </button>
      </div>

      {/* Background upload */}
      <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-700 hover:border-violet-600"
        >
          {bgDataUrl ? (
            <img src={bgDataUrl} alt="bg" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl">🖼️</span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-200">Background Image</p>
          <p className="text-xs text-zinc-500">9:16 portrait from Pinterest. Used on all 6 slides.</p>
        </div>
        {bgDataUrl ? (
          <button onClick={removeBg} className="text-xs text-zinc-500 hover:text-zinc-300">
            Remove
          </button>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
          >
            Upload
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleBgUpload(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: inputs */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Slide Content
          </h2>
          {fields.map((field, i) => (
            <div key={field} className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-zinc-800 font-mono text-zinc-500">
                  {i + 1}
                </span>
                {SLIDE_LABELS[i]}
              </label>
              <textarea
                ref={(el) => { textareaRefs.current[i] = el; }}
                value={slides[field]}
                onChange={(e) => setSlideField(field, e.target.value)}
                onFocus={() => setActiveSlide(i)}
                placeholder={SLIDE_PLACEHOLDERS[i]}
                rows={2}
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/50"
              />
            </div>
          ))}
        </div>

        {/* Right: previews */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Preview
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1">
                <div
                  className={`relative cursor-pointer overflow-hidden rounded-lg border transition-colors ${
                    activeSlide === i ? 'border-violet-500' : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                  onClick={() => {
                    setActiveSlide(i);
                    textareaRefs.current[i]?.focus();
                  }}
                  style={{ width: PREVIEW_W, height: PREVIEW_H }}
                >
                  <canvas
                    ref={(el) => { canvasRefs.current[i] = el; }}
                    width={PREVIEW_W}
                    height={PREVIEW_H}
                    className="block"
                  />
                </div>
                <button
                  onClick={() => downloadSlide(i)}
                  className="w-full rounded border border-zinc-800 py-0.5 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                >
                  DL
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Click a slide to focus its text field. Downloads are 1080×1920 PNG.
          </p>
        </div>
      </div>
    </div>
  );
}
