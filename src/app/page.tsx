import Link from 'next/link';

const steps = [
  {
    num: '01',
    label: 'Discover',
    sublabel: 'TikTok Scroll',
    desc: 'Search your niche, filter by Most Liked, find slideshows with 100k+ views posted in the last 30 days.',
    badge: 'Manual',
    badgeColor: 'bg-zinc-800 text-zinc-400',
    link: null,
    icon: '🔍',
  },
  {
    num: '02',
    label: 'Download',
    sublabel: 'SnapTik',
    desc: 'Save the winning slideshow images without watermark for Claude to analyze.',
    badge: 'Manual',
    badgeColor: 'bg-zinc-800 text-zinc-400',
    link: null,
    icon: '⬇️',
  },
  {
    num: '03',
    label: 'Extract Hook',
    sublabel: 'Claude Opus 4.7',
    desc: 'Upload slideshow images to get the main hook, psychology breakdown, 7 variations, and Pinterest queries.',
    badge: 'Automated',
    badgeColor: 'bg-violet-950 text-violet-300',
    link: '/extractor',
    icon: '🧠',
  },
  {
    num: '04',
    label: 'Source Images',
    sublabel: 'Pinterest',
    desc: 'Use the 5 Pinterest queries Claude generated to find high-contrast 9:16 background images.',
    badge: 'Manual',
    badgeColor: 'bg-zinc-800 text-zinc-400',
    link: '/library',
    icon: '🖼️',
  },
  {
    num: '05',
    label: 'Build Slides',
    sublabel: 'Slide Builder',
    desc: 'Generate all 6 PNG slides with your hook text and Pinterest background — no Canva required.',
    badge: 'Automated',
    badgeColor: 'bg-violet-950 text-violet-300',
    link: '/slides',
    icon: '📐',
  },
  {
    num: '06',
    label: 'Schedule',
    sublabel: 'Postiz CLI',
    desc: 'Generate the Postiz CLI command to queue your slides as a draft for peak posting time.',
    badge: 'Automated',
    badgeColor: 'bg-violet-950 text-violet-300',
    link: '/schedule',
    icon: '📅',
  },
  {
    num: '07',
    label: 'Post',
    sublabel: 'TikTok App',
    desc: 'Open TikTok when notified, find the draft, tap Post. Human device = full organic reach.',
    badge: 'Manual',
    badgeColor: 'bg-zinc-800 text-zinc-400',
    link: null,
    icon: '🚀',
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-800 bg-violet-950/40 px-3 py-1 text-xs text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          TikTok Slideshow Pipeline
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          From scroll to scheduled
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            in {steps.length} steps.
          </span>
        </h1>
        <p className="max-w-xl text-zinc-400">
          Find what&apos;s viral, reverse-engineer the hook with Claude, build polished slides, and post
          at peak time — almost entirely automated and nearly free.
        </p>
      </div>

      {/* Pipeline */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-[27px] top-10 hidden h-[calc(100%-40px)] w-px bg-gradient-to-b from-violet-700 via-zinc-700 to-transparent sm:block" />

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="group relative flex gap-5">
              {/* Number bubble */}
              <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-lg">
                {step.icon}
              </div>

              {/* Card */}
              <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700">
                <div className="mb-1 flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-600">{step.num}</span>
                  <h3 className="font-semibold text-white">{step.label}</h3>
                  <span className="text-xs text-zinc-500">{step.sublabel}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${step.badgeColor}`}>
                    {step.badge}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">{step.desc}</p>
                {step.link && (
                  <Link
                    href={step.link}
                    className="mt-3 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                  >
                    Open tool →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        {[
          { label: 'Cost', value: '~$0', sub: 'mostly free-tier' },
          { label: 'Steps automated', value: '3 / 7', sub: 'Extract · Build · Schedule' },
          { label: 'Time to post', value: '<30 min', sub: 'idea to scheduled draft' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs font-medium text-zinc-400">{s.label}</div>
            <div className="text-xs text-zinc-600">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
