/** Shared legal mention required on product pages (server-safe). */
export default function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] leading-relaxed text-[var(--text-muted)] ${className}`}
    >
      Analyses fournies à titre informatif · des probabilités, jamais des certitudes.
    </p>
  );
}
