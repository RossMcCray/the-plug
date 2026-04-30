'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Pipeline' },
  { href: '/extractor', label: 'Extract' },
  { href: '/library', label: 'Library' },
  { href: '/slides', label: 'Slides' },
  { href: '/schedule', label: 'Schedule' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-lg font-bold text-transparent">
          The Plug
        </span>
        <div className="flex gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                pathname === l.href
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
