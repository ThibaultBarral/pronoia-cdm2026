/** Shared legal mention required on product pages (server-safe). */
export default function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] leading-relaxed text-[var(--text-muted)] ${className}`}
    >
      Analyses fournies à titre informatif · Copafever n&apos;est pas un service de paris et ne
      promet aucun gain.
    </p>
  );
}
