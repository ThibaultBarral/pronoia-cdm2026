import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Shared shell for the legal pages (CGU, Confidentialité). */
export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-8"
        >
          <ArrowLeft size={15} /> Retour
        </Link>

        <h1 className="text-2xl md:text-3xl font-black text-[#f0f0f0]">{title}</h1>
        <p className="text-xs text-[#555] mt-2 mb-8">Dernière mise à jour : {updated}</p>

        <div className="legal-prose space-y-3 text-sm leading-relaxed text-[#c0c0c0]">
          {children}
        </div>
      </div>
    </main>
  );
}
