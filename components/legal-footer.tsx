/** Shared legal mention required on product pages (server-safe). */
export default function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] leading-relaxed text-[var(--text-muted)] ${className}`}
    >
      Les analyses sont fournies à titre informatif uniquement. Les paris sportifs
      comportent des risques · Réservé aux 18 ans et plus · Jouez responsable.
    </p>
  );
}
