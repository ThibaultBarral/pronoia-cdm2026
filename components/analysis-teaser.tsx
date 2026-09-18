"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, Sparkles, Goal, Users, TrendingUp, MessageCircle, Star, Target, Flag, UserX, Swords, GitCompare, Shuffle, Newspaper } from "lucide-react";
import type { MatchPreview } from "@/actions/match-preview";
import type { Team } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

/** Neutral placeholder numbers when the visitor has no right to the real read. */
const PLACEHOLDER: MatchPreview = {
  favorite: "home",
  probability: 42,
  likelyScore: { home: 2, away: 1 },
};

/**
 * Which wall the visitor hits:
 *  - "auth"    : not signed in → create an account (Google or e-mail).
 *  - "free"    : signed in, free read already spent on another match → plans.
 *  - "paywall" : signed in, read seen, full analysis is paid → plans.
 */
export type TeaserMode = "auth" | "free" | "paywall";

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
  preview: real,
  mode,
  home: h,
  away: a,
}: {
  matchId: string;
  preview: MatchPreview | null;
  mode: TeaserMode;
  home: Team;
  away: Team;
}) {
  const preview = real ?? PLACEHOLDER;
  const next = `/match/${matchId}`;
  const href = mode === "auth" ? `/login?next=${encodeURIComponent(next)}` : `/dashboard/pricing?next=${next}`;
  const [googleLoading, setGoogleLoading] = useState(false);

  async function google(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setGoogleLoading(true);
    trackEvent("signup_google_click", { match_id: matchId });
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setGoogleLoading(false);
  }
  const fav = preview.favorite === "away" ? a : h;
  const other = preview.favorite === "away" ? h : a;
  const favPct = preview.probability;
  // Placeholder figures behind the blur, consistent with the public favourite
  // (the real ones are paid): a 1X2 split built around the favourite's
  // probability, and comparison bars leaning the same way.
  const rest = 100 - favPct;
  const draw = Math.round(rest * 0.45);
  const probabilities =
    preview.favorite === "home"
      ? { home: favPct, draw, away: rest - draw }
      : preview.favorite === "away"
        ? { home: rest - draw, draw, away: favPct }
        : { home: Math.round(rest / 2), draw: favPct, away: rest - Math.round(rest / 2) };
  const expectedGoals = {
    home: Math.max(0.6, preview.likelyScore.home - 0.4),
    away: Math.max(0.6, preview.likelyScore.away - 0.3),
  };
  const edge = Math.max(40, Math.min(66, 50 + Math.round((probabilities.home - probabilities.away) / 2)));
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
  const over = Math.max(38, Math.min(68, Math.round((preview.likelyScore.home + preview.likelyScore.away) * 12 + 22)));
  const btts = Math.max(30, Math.min(75, Math.round((over + 50) / 2)));

  function go() {
    trackEvent(mode === "auth" ? "signup_gate_click" : "unlock_ticket_click", { plan: "pricing", match_id: matchId });
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
          {mode === "auth" ? (
            <>
              <p className="text-[var(--text)] font-black text-base leading-tight">Ta lecture est prête</p>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Crée ton compte pour la voir. Ton premier match est offert.
              </p>
              <button
                type="button"
                onClick={google}
                disabled={googleLoading}
                className="mt-4 w-full flex items-center justify-center gap-2.5 rounded-xl bg-white text-gray-800 font-bold px-5 py-2.5 text-sm hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                {googleLoading ? (
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GoogleMark />
                )}
                Continuer avec Google
              </button>
              <p className="text-[11px] text-[var(--text-muted)] mt-2.5 underline underline-offset-2">ou avec un e-mail</p>
            </>
          ) : mode === "free" ? (
            <>
              <p className="text-[var(--text)] font-black text-base leading-tight">Ton match offert est passé</p>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Pour celui-ci et tous les autres, choisis une durée.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] text-white font-bold px-5 py-2.5 text-sm glow-neon">
                <Sparkles size={15} /> Voir les plans
              </span>
              <p className="text-[11px] text-[var(--text-muted)] mt-2.5">Dès 9,99 € la semaine · sans engagement</p>
            </>
          ) : (
            <>
              <p className="text-[var(--text)] font-black text-base leading-tight">L&apos;analyse complète est prête</p>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Enjeu, absents, compos, duels, sources croisées, presse, joueurs, chat IA.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] text-white font-bold px-5 py-2.5 text-sm glow-neon">
                <Sparkles size={15} /> Débloquer l&apos;analyse complète
              </span>
              <p className="text-[11px] text-[var(--text-muted)] mt-2.5">Dès 9,99 € la semaine · sans engagement</p>
            </>
          )}
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
          {mode !== "paywall" && (
            <Section title="La lecture courte" icon={<Target size={13} />}>
              <Blur>
                <div className="rounded-xl glass p-4">
                  <p className="text-base text-[#c3cbe3] leading-relaxed">
                    <span className="font-black text-[var(--text)]">{fav.name}</span> favori à{" "}
                    <span className="font-black text-[var(--accent-soft)] tabular-nums">{favPct} %</span>.
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-1.5">
                    Score probable : <span className="font-black text-[var(--text)] tabular-nums">{preview.likelyScore.home} - {preview.likelyScore.away}</span>
                  </p>
                </div>
              </Blur>
            </Section>
          )}

          <Section title="Résumé" icon={<Sparkles size={13} />}>
            <Blur>
              <p className="text-sm text-[#d0d0d0] leading-relaxed">
                {fav.name} arrive avec l&apos;avantage du classement et une dynamique plus stable que {other.name}.
                Le modèle attend un match ouvert, décidé sur les transitions et l&apos;efficacité devant le but,
                avec un léger avantage pour {fav.name} ({favPct} %).
              </p>
            </Blur>
          </Section>

          <Section title="L'enjeu" icon={<Flag size={13} />}>
            <Blur>
              <p className="text-sm text-[#d0d0d0] leading-relaxed">
                Pour {fav.name}, une victoire consolide sa place dans le haut du tableau avant une semaine chargée.
                {other.name} joue sa série en cours et la pression monte sur le staff après les derniers résultats.
              </p>
            </Blur>
          </Section>

          <Section title="Absents et impact" icon={<UserX size={13} />}>
            <Blur>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[h, a].map((t) => (
                  <div key={t.name} className="rounded-xl glass p-3.5">
                    <div className="text-xs font-black text-[var(--accent)] mb-1.5">{t.name}</div>
                    <ul className="space-y-1 text-[13px] text-[#c3cbe3]">
                      <li>Milieu titulaire · blessé</li>
                      <li>Latéral droit · incertain</li>
                    </ul>
                    <p className="text-xs text-[#999] mt-2">Moins de projection sur le côté droit, relance plus centrale.</p>
                  </div>
                ))}
              </div>
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

          <Section title="Les duels qui décident" icon={<Swords size={13} />}>
            <Blur>
              <div className="space-y-2">
                {["Le pressing haut contre la relance courte", "Les ailiers face aux latéraux fatigués"].map((t) => (
                  <div key={t} className="rounded-xl glass p-3.5">
                    <div className="text-sm font-bold text-[#f0f0f0]">{t}</div>
                    <p className="text-xs text-[#999] mt-1">Le camp qui gagne ce duel dicte le tempo de la première période.</p>
                  </div>
                ))}
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

          <Section title="Sources croisées" icon={<GitCompare size={13} />}>
            <Blur>
              <div className="space-y-2">
                {[
                  ["Modèle vs marché", "converge"],
                  ["Second avis", "converge"],
                  ["Presse", "diverge"],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start gap-3 rounded-xl glass p-3.5">
                    <span className="mt-0.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)]">{v}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#f0f0f0]">{l}</div>
                      <p className="text-xs text-[#999] mt-0.5">Le marché donne {favPct} % à {fav.name}, notre modèle est sur la même lecture.</p>
                    </div>
                  </div>
                ))}
              </div>
            </Blur>
          </Section>

          <Section title="Ce qui ferait basculer le match" icon={<Shuffle size={13} />}>
            <Blur>
              <ul className="space-y-1.5 text-sm text-[#d0d0d0]">
                <li>→ Un but de {other.name} dans le premier quart d&apos;heure</li>
                <li>→ Le retour du milieu titulaire dans le onze</li>
                <li>→ Un carton rouge précoce sur un duel aérien</li>
              </ul>
            </Blur>
          </Section>

          <Section title="Ce que dit la presse" icon={<Newspaper size={13} />}>
            <Blur>
              <div className="space-y-2">
                {["Compo probable : deux changements attendus", "Le coach relativise la pression avant le choc"].map((t) => (
                  <div key={t} className="rounded-xl glass p-3.5">
                    <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Média · hier</div>
                    <div className="text-sm font-bold text-[#f0f0f0] mt-0.5">{t}</div>
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
                  { v: expectedGoals.home.toFixed(2), l: `Buts ${h.shortName}` },
                  { v: expectedGoals.away.toFixed(2), l: `Buts ${a.shortName}` },
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
        <Lock size={14} /> {mode === "auth" ? "Créer mon compte · premier match offert" : "Débloquer tout ça · dès 9,99 €"}
      </Link>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
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
