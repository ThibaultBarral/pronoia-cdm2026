import Link from "next/link";
import { Trophy, Zap } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080b12]/90 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center group-hover:glow-neon transition-all">
            <Trophy size={14} className="text-[#00ff88]" />
          </div>
          <span className="font-black text-[#f0f0f0] tracking-tight">
            Pronoia<span className="text-[#00ff88]">.</span>
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#555]">
          <a href="#how-it-works" className="hover:text-[#888] transition-colors">Comment ça marche</a>
          <a href="#matches" className="hover:text-[#888] transition-colors">Matchs</a>
        </nav>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00ff88] text-[#080b12] text-sm font-bold hover:bg-[#00e87a] transition-all hover:scale-105 glow-neon"
        >
          <Zap size={13} />
          Se connecter
        </Link>
      </div>
    </header>
  );
}
