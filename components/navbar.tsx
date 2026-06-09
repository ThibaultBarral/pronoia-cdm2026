import Link from "next/link";
import { Zap } from "lucide-react";

export default function Navbar() {
  return (
    <header className="safe-header sticky top-0 z-50 border-b border-white/5 bg-[#080b12]/90 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/copafever-primary.svg?v=2" alt="Copafever" className="h-7 w-auto" />
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#555]">
          <a href="#how-it-works" className="hover:text-[#888] transition-colors">Comment ça marche</a>
          <a href="#matches" className="hover:text-[#888] transition-colors">Matchs</a>
        </nav>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[#080b12] text-sm font-bold hover:bg-[var(--accent-soft)] transition-all hover:scale-105 glow-neon"
        >
          <Zap size={13} />
          Se connecter
        </Link>
      </div>
    </header>
  );
}
