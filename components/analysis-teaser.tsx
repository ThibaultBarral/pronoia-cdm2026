"use client";

import Link from "next/link";
import { Lock, Sparkles, Goal, Users, TrendingUp, MessageCircle, Star } from "lucide-react";
import type { MatchPreview } from "@/actions/match-preview";
import type { Team } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

/**
 * What a non-member sees under the free short read: the FULL analysis layout
 * (scenario, strengths & weaknesses, players to watch, comparison, xG, AI
 * chat), rendered with placeholder text and blurred, with one CTA floating on
 * top. Section titles stay sharp so the visitor sees exactly what is behind the
 * blur; the numbers that are already public (probabilities, xG, over 2.5) are
 * the real ones so the preview is coherent with the read above it.
 *
 * The placeholder sentences are deliberately generic and never shown legibly:
 * the whole block is aria-hidden, non-selectable, and a single click anywhere
 * leads to the plans page.
 */
export default function AnalysisTeaser({
  matchId,
  preview,
  home: h,
  away: a,
}: {
  matchId: string;
  preview: MatchPreview;
  home: Team;
  away: Team;
}) {
  const href = `/dashboard/pricing?next=/match/${matchId}`;
  const fav = preview.favorite === "away" ? a : h;
  const other = preview.favorite === "away" ? h : a;
  const favPct = preview.favorite === "away" ? preview.probabilities.away : preview.probabilities.home;
  // Comparison bars derived from the public probabilities — believable, not
  // invented from thin air, and consistent with the favourite shown above.
  const edge = Math.max(40, Math.min(66, 50 + Math.round((preview.probabilities.home - preview.probabilities.away) / 2)));
  const comparison = [
    { label: "Attaque", home: edge, away: 100 - edge },
    { label: "Défense", home: 100 - edge + 4, away: edge - 4 },
    { label: "Forme", home: edge + 3, away: 97 - edge },
    { label: "Possession", home: edge - 5, away: 105 - edge },
  ];
  const playersOf = (t: Team, n: number) =>
    (t.lineup?.players ?? [])
      .filter((p) => p.position !== "Goalkeeper" && p.position !== "G")
      .slice(-n)
      .map((p) => p.name);
  const watch = [
    ...playersOf(h, 2).map((name) => ({ name, team: h })),
    ...playersOf(a, 1).map((name) => ({ name, team: a })),
  ];
  const over = preview.over25;
  const btts = Math.max(30, Math.min(75, Math.round((over + 50) / 2)));

  function go() {
    trackEvent("unlock_ticket_click", { plan: "pricing", match_id: matchId });
  }

  return (
    <div className="relative">
      {/* CTA — the only readable, interactive thing in this block. It sits on
          top of the blurred body (which starts right under it), and is
          repeated as a slim button at the very end for whoever scrolls it all. */}
      <div className="relative z-10 flex justify-center px-2">
        <Link
          href={href}
          onClick={go}
          className="w-full max-w-sm rounded-2xl border border-[var(--accent)]/30 bg-[#0B1330]/95 backdrop-blur-md shadow-[0_20px_60px_-10px_rgba(37,99,235,0.45)] p-5 text-center"
        >
          <div className="mx-auto w-11 h-11 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-3">
            <Lock size={20} className="text-[var(--accent-soft)]" />
          </div>
          <p className="text-[var(--text)] font-black text-base leading-tight">L&apos;analyse complète est prête</p>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
            Scénario, forces &amp; faiblesses, joueurs à suivre, chat IA. Tout est là, juste en dessous.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] text-white font-bold px-5 py-2.5 text-sm glow-neon">
            <Sparkles size={15} /> Débloquer l&apos;analyse complète
          </span>
          <p className="text-[11px] text-[var(--text-muted)] mt-2.5">Dès 9,99 € la semaine · sans engagement</p>
        </Link>
      </div>

      {/* Blurred body — pulled up under the CTA, one click anywhere → plans. */}
      <Link
        href={href}
        onClick={go}
        aria-hidden
        tabIndex={-1}
        className="block -mt-16 pt-20 select-none cursor-pointer"
      >
        <div className="space-y-5">
          <Section title="Résumé" icon={<Sparkles size={13} />}>
            <Blur>
              <p className="text-sm text-[#d0d0d0] leading-relaxed">
                {fav.name} arrive avec l&apos;avantage du classement et une dynamique plus stable que {other.name}.
                Le modèle attend un match ouvert, décidé sur les transitions et l&apos;efficacité devant le but,
                avec un léger avantage pour {fav.name} ({favPct} %).
              </p>
            </Blur>
          </Section>

          <Section title="Scénario probable" icon={<TrendingUp size={13} />}>
            <Blur>
              <p className="text-sm text-[#d0d0d0] leading-relaxed">
                Première période fermée, {other.name} compact dans son camp et {fav.name} qui cherche la
                largeur. L&apos;ouverture du score arrive plutôt après la pause, sur coup de pied arrêté ou
                contre rapide. Score le plus probable : {preview.likelyScore.home} - {preview.likelyScore.away}.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <div className="rounded-xl glass p-3.5">
                  <div className="text-sm font-bold text-[#f0f0f0]">Plus de 2,5 buts · {over} %</div>
                  <p className="text-xs text-[#999] mt-1 leading-relaxed">Deux attaques en rythme, des défenses qui concèdent des occasions à chaque match.</p>
                </div>
                <div className="rounded-xl glass p-3.5">
                  <div className="text-sm font-bold text-[#f0f0f0]">Les deux équipes marquent · {btts} %</div>
                  <p className="text-xs text-[#999] mt-1 leading-relaxed">{other.name} a trouvé le chemin des filets dans la majorité de ses derniers matchs.</p>
                </div>
              </div>
            </Blur>
          </Section>

          <Section title="Forces & faiblesses" icon={<Star size={13} />}>
            <Blur>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[h, a].map((t) => (
                  <div key={t.name} className="rounded-xl glass p-3.5">
                    <div className="text-xs font-black text-[var(--accent)] mb-1.5">{t.name}</div>
                    <ul className="space-y-1 text-[13px] text-[#c3cbe3]">
                      <li>Pressing haut efficace dans les 30 premières minutes</li>
                      <li>Ailiers très sollicités, beaucoup de centres</li>
                      <li>Fragilité sur les phases arrêtées défensives</li>
                    </ul>
                  </div>
                ))}
              </div>
            </Blur>
          </Section>

          <Section title="Joueurs à suivre" icon={<Users size={13} />}>
            <Blur>
              <div className="space-y-2">
                {(watch.length ? watch : [{ name: "Joueur clé", team: h }, { name: "Joueur clé", team: a }, { name: "Joueur clé", team: h }]).map((p, i) => (
                  <div key={`${p.name}-${i}`} className="flex items-center gap-3 rounded-xl glass p-3">
                    <span className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                      <Goal size={14} className="text-[var(--accent)]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#f0f0f0] truncate">{p.name}</div>
                      <div className="text-xs text-[#999] truncate">{p.team.shortName} · en forme, décisif sur les derniers matchs</div>
                    </div>
                  </div>
                ))}
              </div>
            </Blur>
          </Section>

          <Section title="Comparaison" icon={<TrendingUp size={13} />}>
            <Blur>
              <div className="space-y-2.5">
                {comparison.map((c) => (
                  <div key={c.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[var(--accent)] font-bold tabular-nums">{c.home}%</span>
                      <span className="text-[var(--text-muted)] uppercase tracking-wide font-bold">{c.label}</span>
                      <span className="text-[#ef4444] font-bold tabular-nums">{c.away}%</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.06]">
                      <div className="h-full bg-[var(--accent)]" style={{ width: `${c.home}%` }} />
                      <div className="h-full bg-[#ef4444]" style={{ width: `${c.away}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                {[
                  { v: preview.expectedGoals.home.toFixed(2), l: `Buts ${h.shortName}` },
                  { v: preview.expectedGoals.away.toFixed(2), l: `Buts ${a.shortName}` },
                  { v: `${over}%`, l: "+2.5 buts" },
                  { v: `${btts}%`, l: "Les 2 marquent" },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl glass p-4 text-center">
                    <div className="text-3xl font-black text-[var(--text)] tabular-nums leading-none">{k.v}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-2 truncate">{k.l}</div>
                  </div>
                ))}
              </div>
            </Blur>
          </Section>

          <Section title="Tes questions à l'IA" icon={<MessageCircle size={13} />}>
            <Blur>
              <div className="space-y-2">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--accent)]/15 px-3.5 py-2.5 text-[13px] text-[#e6ebfa]">
                  Est-ce que {other.name} peut tenir le nul à l&apos;extérieur ?
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-bl-sm glass px-3.5 py-2.5 text-[13px] text-[#c3cbe3]">
                  Possible mais pas le scénario central : sur ses cinq derniers déplacements, la défense a
                  concédé en moyenne plus d&apos;un but par match, et {fav.name} crée beaucoup dans les 20 dernières minutes.
                </div>
              </div>
            </Blur>
          </Section>
        </div>
      </Link>

      <Link
        href={href}
        onClick={go}
        className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent-soft)] font-bold px-5 py-3 text-sm transition-colors"
      >
        <Lock size={14} /> Débloquer tout ça · dès 9,99 €
      </Link>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">
        <span className="text-[var(--accent-soft)]">{icon}</span> {title}
        <Lock size={10} className="ml-auto text-[var(--text-muted)]/60" />
      </h3>
      {children}
    </div>
  );
}

/** The blur itself — strong enough that nothing is legible, light enough that the layout reads. */
function Blur({ children }: { children: React.ReactNode }) {
  return <div className="blur-[6px] opacity-80 pointer-events-none">{children}</div>;
}
