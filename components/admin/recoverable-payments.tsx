import { AlertTriangle } from "lucide-react";
import type { RecoverablePayment } from "@/lib/admin";
import RecoverButton from "@/components/admin/recover-button";

const REASON_STYLE: Record<string, string> = {
  "3D Secure (vérif. bancaire)": "text-[#ffd700] bg-[#ffd700]/10",
  "Carte refusée": "text-[#ef4444] bg-[#ef4444]/10",
  "Fonds insuffisants": "text-[#ef4444] bg-[#ef4444]/10",
  "Abandon en cours de paiement": "text-[#9aa3b2] bg-white/[0.05]",
};

function frDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/**
 * Clients qui ont tenté de payer sans aboutir (3DS, carte refusée…). C'est de
 * l'argent quasi acquis : un DM avec un lien de paiement alternatif (SEPA,
 * Apple Pay) en récupère une bonne partie.
 */
export default function RecoverablePayments({ rows }: { rows: RecoverablePayment[] }) {
  if (rows.length === 0) return null;

  const potential = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="rounded-2xl glass px-5 py-4 mb-6 border border-[#ffd700]/20">
      <div className="flex items-center justify-between mb-1">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#ffd700]">
          <AlertTriangle size={14} /> Paiements échoués à récupérer
        </h3>
        <span className="text-[11px] text-[#5a6472]">
          {rows.length} client{rows.length > 1 ? "s" : ""} ·{" "}
          <span className="font-bold text-[#f0f0f0]">~{Math.round(potential)} €</span> en jeu
        </span>
      </div>
      <p className="text-[11px] text-[#9aa3b2] mb-4">
        Ils ont sorti leur carte mais le paiement a échoué. Relance-les avec un lien alternatif
        (SEPA / Apple Pay marche souvent quand le 3DS bloque).
      </p>

      <div className="space-y-2">
        {rows.map((r) => {
          const style = REASON_STYLE[r.reason] ?? "text-[#9aa3b2] bg-white/[0.05]";
          return (
            <div
              key={r.userId}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#f0f0f0] truncate">
                    {r.email ?? r.name ?? "Client inconnu"}
                  </span>
                  {r.attempts > 1 && (
                    <span className="shrink-0 text-[10px] font-bold text-[#ffd700] bg-[#ffd700]/10 rounded-full px-1.5 py-0.5">
                      {r.attempts}× essayé
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5a6472]">
                  <span>{r.offer}</span>
                  <span>·</span>
                  <span>{frDate(r.lastAt)}</span>
                </div>
              </div>

              <span className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 ${style}`}>
                {r.reason}
              </span>

              <span className="shrink-0 tabular-nums text-sm font-black text-[var(--accent)]">
                {r.amount.toFixed(2)} €
              </span>

              {r.email && (
                <RecoverButton
                  userId={r.userId}
                  email={r.email}
                  name={r.name}
                  offer={r.offer}
                  amount={r.amount}
                  sentAt={r.sentAt}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
