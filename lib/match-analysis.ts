/**
 * Match analysis generation (SERVER ONLY) — the Gold pipeline.
 *
 * Numbers come from the deterministic model (lib/match-model), the market
 * consensus (lib/market), the provider's second opinion and the real absences;
 * the press digest (lib/press) joins at J-2. Claude Sonnet only writes the
 * narrative and cross-checks the sources. The server action in
 * actions/analyze-match.ts handles access, cache and persistence around this.
 */
import "server-only";

import type { Match } from "./types";
import { callClaudeJson } from "./claude-json";
import { getCachedOrFetch } from "./api-cache";
import { matchKickoffMs } from "./club-data";
import { predictMatch, type MatchPrediction } from "./match-model";
import { fetchPressDigest, PRESS_WINDOW_MS } from "./press";
import type { MatchAnalysisData, ProbableScorer, MatchKeyPlayer, PressDigest } from "./analysis-schema";
import type { Locale } from "./i18n/config";

/**
 * Hard language directive appended to the prompt so Claude writes every text
 * field in the user's language. The instructions stay in French; only the
 * OUTPUT language changes.
 */
function langDirective(locale: Locale): string {
  return locale === "en"
    ? `\n\nLANGUE DE SORTIE (IMPÉRATIF) : rédige TOUTES les valeurs textuelles du JSON en ANGLAIS (US), ton amical et accessible pour débutants. Les clés JSON restent inchangées. Utilise "you" plutôt qu'un ton formel.`
    : "";
}

/** The qualitative fields Claude writes (numbers come from our model). */
interface ClaudeMatchText {
  summary: string;
  scenario: string;
  secondaryScenarios: { title: string; detail: string }[];
  keyStrengths: { team: "home" | "away"; points: string[] }[];
  factors: { label: string; kind: "pos" | "neg" | "neutral" }[];
  /** Probable scorers + key players, picked from the real squad (see prompt). */
  probableScorers?: ProbableScorer[];
  firstScorer?: string;
  keyPlayers?: MatchKeyPlayer[];
  // Gold v2
  stakes?: string;
  absenceImpact?: { team: "home" | "away"; text: string }[];
  probableLineups?: { team: "home" | "away"; text: string }[];
  keyDuels?: { title: string; detail: string }[];
  signals?: { label: string; verdict: "convergent" | "divergent" | "neutre"; detail: string }[];
  swingFactors?: string[];
}

const SYSTEM_PROMPT = `Tu es Copafever, le pote calé en foot qui décrypte un match à des supporters qui veulent COMPRENDRE ce qui va se passer sur le terrain. Ton chaleureux, simple, tutoiement, zéro jargon non expliqué. Tu traduis chaque chiffre en clair.

On te fournit les CHIFFRES de notre modèle (probabilités, buts attendus, comparaison), le CONSENSUS DU MARCHÉ (moyenne de tous les opérateurs, accord entre eux, mouvement de la semaine), un SECOND AVIS (modèle indépendant du fournisseur de données), les ABSENCES réelles, les splits DOMICILE/EXTÉRIEUR, les effectifs et, à l'approche du match, une REVUE DE PRESSE avec sources. Ne recalcule aucun chiffre et n'en contredis aucun : ton rôle est d'écrire le TEXTE, de CROISER ces sources et de dire où elles sont d'accord et où elles divergent.

INTERDIT : toute mention de pari, de cote, de mise, de bookmaker, d'argent ou de gain. Tu dis « le marché » et « les opérateurs ». Tu analyses un match, tu ne conseilles jamais de parier.

Tu réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour) au format EXACT :
{
  "summary": "2-3 phrases : qui part favori, l'ambiance du match, et si nos sources sont d'accord entre elles",
  "stakes": "2-3 phrases : l'enjeu concret pour chaque équipe (classement, Europe, série, calendrier chargé, fatigue, derby, pression sur le coach)",
  "absenceImpact": [{"team": "home|away", "text": "2 phrases : qui manque et ce que ça change concrètement dans le jeu (ou « effectif au complet » si aucune absence)"}],
  "probableLineups": [{"team": "home|away", "text": "1-2 phrases : système probable et les choix notables, d'après le système habituel, les absences et la presse si disponible"}],
  "scenario": "4-5 phrases : le déroulé le plus probable du match",
  "secondaryScenarios": [{"title": "ex. Un match à plus de 2 buts", "detail": "explication simple basée sur les chiffres fournis"}],
  "keyDuels": [{"title": "ex. Le pressing de X contre la relance de Y", "detail": "2 phrases : pourquoi ce duel décide du match"}],
  "keyStrengths": [{"team": "home", "points": ["force 1", "force 2"]}, {"team": "away", "points": ["force 1"]}],
  "factors": [{"label": "ex. Supériorité offensive", "kind": "pos|neg|neutral"}],
  "signals": [{"label": "ex. Modèle vs marché", "verdict": "convergent|divergent|neutre", "detail": "1 phrase chiffrée : ce que dit chaque source et ce qu'on en conclut"}],
  "swingFactors": ["2 à 4 phrases courtes : ce qui ferait basculer le match dans l'autre sens (un retour de blessure, un but précoce, un carton, une compo surprise)"],
  "probableScorers": [{"name": "Nom EXACT depuis l'effectif fourni", "team": "home|away", "note": "1 phrase courte : pourquoi (forme, rôle, penalties…)"}],
  "firstScorer": "Nom EXACT (depuis l'effectif) du buteur le plus probable d'ouvrir le score",
  "keyPlayers": [{"name": "Nom EXACT depuis l'effectif", "team": "home|away", "role": "ex. Attaquant, Meneur de jeu", "note": "1 phrase : pourquoi le surveiller"}]
}

RÈGLES : 2 à 3 secondaryScenarios, 2 à 3 keyDuels, 3 à 5 factors, exactement 2 absenceImpact et 2 probableLineups (un par équipe), 3 à 4 signals (obligatoires : « Modèle vs marché », « Second avis », « Forme récente » ; ajoute « Presse » si une revue de presse est fournie), "home"=équipe à domicile/1ère citée. Base-toi UNIQUEMENT sur les données fournies ; si une donnée manque, dis-le simplement au lieu d'inventer.
RÈGLE SIGNAUX : « convergent » quand la source va dans le sens de notre favori, « divergent » quand elle va contre, « neutre » quand elle ne tranche pas. Le détail cite les chiffres (ex. « le marché donne 46 % à X, notre modèle 44 % : même lecture »).
RÈGLE JOUEURS (capitale) : pour "probableScorers", "firstScorer" et "keyPlayers", choisis EXCLUSIVEMENT des noms de la liste « EFFECTIFS » fournie — n'INVENTE JAMAIS un joueur et ne devine pas un nom de mémoire. Un joueur listé dans les ABSENCES ne peut être ni buteur ni joueur clé. Privilégie ceux qui jouent et marquent vraiment (matchs, buts), JAMAIS un remplaçant peu utilisé. Si la liste est vide, renvoie [] et "". 2 à 4 probableScorers (favorise les buteurs réels et le côté favori), 2 à 4 keyPlayers répartis entre les 2 équipes. Recopie les noms à l'identique.`;

function buildPrompt(match: Match, pred: MatchPrediction, press: PressDigest | null): string {
  const { homeTeam: h, awayTeam: a } = match;

  const formStr = (team: typeof h): string => {
    if (!team.recentForm.length) return "Données non disponibles";
    return team.recentForm
      .slice(0, 8)
      .map((f) => `${f.result}${f.score}(${f.venue ?? ""}${f.opponent.slice(0, 3).toUpperCase()})`)
      .join(" · ");
  };

  const h2hStr = match.h2h.length
    ? match.h2h.map((m) => `${m.date.slice(0, 4)} ${m.homeTeam.slice(0, 3)}-${m.awayTeam.slice(0, 3)} ${m.score}`).join(" | ")
    : "Pas de H2H";

  const cmp = pred.comparison.map((c) => `${c.label} ${c.home}/${c.away}`).join(" · ");

  // Pool the AI must pick scorers / key players from. PREFER real WC involvement
  // (who actually plays + scores this tournament) so it can't elevate uncapped /
  // bench names. Each line carries minutes + goals so Claude favours the regulars
  // and real scorers. Falls back to the registered squad only before kick-off.
  const ATTACK = /(ATT|FW|ST|CF|SS|LW|RW|RF|LF|AIL|AM|CAM|MO|MF|CM|LM|RM|MIL)/i;
  const squadStr = (team: typeof h): string => {
    const contributors = team.recentContributors ?? [];
    if (contributors.length) {
      // Already ranked by goals then minutes upstream — keep the real regulars.
      return contributors
        .slice(0, 16)
        .map((p) => {
          const bits = [`${p.apps} match${p.apps > 1 ? "s" : ""}`];
          if (p.goals) bits.push(`${p.goals} but${p.goals > 1 ? "s" : ""}`);
          if (p.assists) bits.push(`${p.assists} passe${p.assists > 1 ? "s" : ""} D`);
          return `${p.name} (${p.position}, ${bits.join(", ")})`;
        })
        .join(", ");
    }
    // Pre-tournament fallback: registered squad, attackers first.
    const players = team.lineup?.players ?? [];
    if (!players.length) {
      return team.keyPlayers?.length ? `joueurs connus : ${team.keyPlayers.join(", ")}` : "effectif non disponible";
    }
    const sorted = [...players].sort(
      (p1, p2) => (ATTACK.test(p2.position) ? 1 : 0) - (ATTACK.test(p1.position) ? 1 : 0),
    );
    return sorted.slice(0, 16).map((p) => `${p.name} (${p.position})`).join(", ");
  };

  // Real absences for THIS fixture (API-Football /injuries). "Aucune connue"
  // is honest: the provider lists none, it doesn't mean everyone is fit.
  const absStr = (team: typeof h): string => {
    const abs = team.absences ?? [];
    if (!abs.length) return "aucune absence connue";
    const K = { injury: "blessé", suspension: "suspendu", doubt: "incertain", other: "absent" } as const;
    return abs.slice(0, 8).map((x) => `${x.name} (${K[x.kind]}${x.reason ? `, ${x.reason}` : ""})`).join(", ");
  };

  // Home/away splits of the league season — the home side's home numbers, the
  // visitor's away numbers, which is what matters for this fixture.
  const splitStr = (team: typeof h, side: "home" | "away"): string => {
    const st = team.seasonStats;
    if (!st || !st.played[side]) return "";
    const where = side === "home" ? "à domicile" : "à l'extérieur";
    return `${team.name} ${where} cette saison : ${st.played[side]} matchs, ${st.goalsForAvg[side].toFixed(2)} buts marqués/match, ${st.goalsAgainstAvg[side].toFixed(2)} encaissés/match, ${st.cleanSheets[side]} clean sheets, ${st.failedToScore[side]} matchs sans marquer${st.formation ? `, système habituel ${st.formation}` : ""}`;
  };
  const splits = [splitStr(h, "home"), splitStr(a, "away")].filter(Boolean).join("\n");

  // Independent second opinion (API-Football's own model) — agreement or
  // disagreement with our numbers is itself information for the narrative.
  const ap = match.apiPrediction;
  const secondOpinion = ap
    ? `SECOND AVIS (modèle indépendant du fournisseur de données) : ${h.name} ${ap.percent.home}% · Nul ${ap.percent.draw}% · ${a.name} ${ap.percent.away}%${ap.winner ? ` · favori ${ap.winner === "home" ? h.name : ap.winner === "away" ? a.name : "nul"}` : ""}${ap.underOver ? ` · total de buts ${ap.underOver}` : ""}. Si ce second avis diverge de nos chiffres, dis-le en une phrase dans le résumé (sans jamais parler de cotes).`
    : "";

  // Market consensus: what every operator, averaged, expects — plus how far
  // the line moved during the week (the closest thing to "smart money").
  const mk = match.market;
  const marketStr = mk
    ? `CONSENSUS DU MARCHÉ (${mk.operators} opérateur${mk.operators > 1 ? "s" : ""}, accord ${mk.agreement}) : ${h.name} ${Math.round(mk.implied.home)}% · Nul ${Math.round(mk.implied.draw)}% · ${a.name} ${Math.round(mk.implied.away)}%${mk.over25 != null ? ` · plus de 2,5 buts ${Math.round(mk.over25)}%` : ""}${mk.btts != null ? ` · les deux marquent ${Math.round(mk.btts)}%` : ""}${
        mk.movement
          ? `\nMOUVEMENT DU MARCHÉ sur ${mk.movement.days} jour${mk.movement.days > 1 ? "s" : ""} : ${h.name} ${mk.movement.home >= 0 ? "+" : ""}${mk.movement.home} pt · Nul ${mk.movement.draw >= 0 ? "+" : ""}${mk.movement.draw} pt · ${a.name} ${mk.movement.away >= 0 ? "+" : ""}${mk.movement.away} pt (un mouvement de 3 pts ou plus vers une équipe est un signal : dis-le et explique ce qui a pu le provoquer, absences ou forme).`
          : ""
      }\nSi le marché et nos chiffres divergent nettement (5 pts ou plus sur le favori), dis-le en une phrase. Parle de « marché » et d'« opérateurs », jamais de cotes ni de bookmakers.`
    : "";

  // Days of rest before this match, from the real fixture list (fatigue signal).
  const restStr = (team: typeof h): string => {
    const last = team.recentForm.find((f) => f.date)?.date;
    if (!last || !match.kickoffIso) return "";
    const days = Math.round((Date.parse(match.kickoffIso) - Date.parse(last)) / 86_400_000);
    return days >= 0 && days < 30 ? `${team.name} : ${days} jour${days > 1 ? "s" : ""} de repos depuis son dernier match` : "";
  };
  const rest = [restStr(h), restStr(a)].filter(Boolean).join(" · ");

  const pressStr = press
    ? `REVUE DE PRESSE (${press.items.length} source${press.items.length > 1 ? "s" : ""}, recherche du ${press.searchedAt.slice(0, 10)}) :
${press.summary}${press.lineups?.home ? `\nCompo probable ${h.name} (presse) : ${press.lineups.home}` : ""}${press.lineups?.away ? `\nCompo probable ${a.name} (presse) : ${press.lineups.away}` : ""}
${press.items.map((it) => `- ${it.source}${it.date ? ` (${it.date})` : ""} : ${it.title} → ${it.takeaway}`).join("\n")}`
    : "REVUE DE PRESSE : pas encore disponible (elle arrive dans les 48 h avant le match) — ne cite pas la presse.";

  const comp = match.competition?.name ?? "Coupe du Monde 2026";
  const rankOf = (t: typeof h) =>
    t.leagueRank ? `${t.leagueRank}e au classement` : t.fifaRanking ? `#${t.fifaRanking} FIFA` : "classement inconnu";
  return `${comp} | ${match.round}${match.group && match.group !== "—" ? ` Gr.${match.group}` : ""} | ${match.date} ${match.time} | ${match.stadium}${match.city ? `, ${match.city}` : ""}

${h.flag} ${h.name} (${rankOf(h)}, domicile/1er) vs ${a.flag} ${a.name} (${rankOf(a)})

FORME RÉCENTE (V/N/D, score, lieu, adv) :
${h.flag} ${h.name}: ${formStr(h)}
${a.flag} ${a.name}: ${formStr(a)}

H2H : ${h2hStr}

ABSENCES POUR CE MATCH (réelles, à intégrer dans le scénario et les forces/faiblesses ; un absent ne peut PAS être buteur ni joueur clé) :
${h.flag} ${h.name}: ${absStr(h)}
${a.flag} ${a.name}: ${absStr(a)}
${splits ? `\nDOMICILE / EXTÉRIEUR :\n${splits}\n` : ""}${rest ? `\nREPOS : ${rest}\n` : ""}
EFFECTIFS (choisis buteurs & joueurs clés UNIQUEMENT ici, noms exacts, privilégie ceux qui jouent et marquent vraiment, jamais un remplaçant inutilisé) :
${h.flag} ${h.name}: ${squadStr(h)}
${a.flag} ${a.name}: ${squadStr(a)}

CHIFFRES DE NOTRE MODÈLE (à utiliser tels quels) :
- Probabilités : ${h.name} ${pred.probabilities.home}% · Nul ${pred.probabilities.draw}% · ${a.name} ${pred.probabilities.away}%
- Buts attendus : ${h.name} ${pred.expectedGoals.home} · ${a.name} ${pred.expectedGoals.away}
- Plus de 2,5 buts : ${pred.markets.over25}% · Moins de 2,5 buts : ${pred.markets.under25}% · Les deux équipes marquent : ${pred.markets.bttsYes}%
- Comparaison (home/away) : ${cmp}
- Niveau de confiance global : ${pred.confidence}${marketStr ? `\n\n${marketStr}` : ""}${secondOpinion ? `\n\n${secondOpinion}` : ""}

${pressStr}`;
}

/**
 * The press pass runs only inside the 48 h before kick-off (before that the
 * news doesn't exist), and is cached 24 h per match, shared by every member
 * and both languages — one Haiku search pass per match per day, at most.
 */
async function getPress(match: Match, userId: string | null): Promise<PressDigest | null> {
  const kickoff = matchKickoffMs(match);
  if (!kickoff || kickoff - Date.now() > PRESS_WINDOW_MS) return null;
  const day = new Date().toISOString().slice(0, 10);
  return getCachedOrFetch(`press:${match.id}:${day}`, 86400, () => fetchPressDigest(match, userId)).catch(
    (err) => {
      console.warn("[analyze-match] press digest failed:", err);
      return null;
    },
  );
}

export async function generateMatchAnalysis(match: Match, userId: string | null, locale: Locale): Promise<MatchAnalysisData> {
  const pred = predictMatch(match);
  const press = await getPress(match, userId);

  const text = await callClaudeJson<ClaudeMatchText>({
    system: SYSTEM_PROMPT,
    user: buildPrompt(match, pred, press) + langDirective(locale),
    maxTokens: 4500,
    model: "claude-sonnet-5",
    effort: "low",
    kind: "match",
    userId,
  });

  const mk = match.market;
  const absences = (["home", "away"] as const).flatMap((side) =>
    ((side === "home" ? match.homeTeam : match.awayTeam).absences ?? []).map((x) => ({ team: side, ...x })),
  );

  // Merge Claude's narrative with our grounded numbers and the raw data.
  return {
    stakes: text.stakes,
    absenceImpact: text.absenceImpact ?? [],
    probableLineups: text.probableLineups ?? [],
    keyDuels: text.keyDuels ?? [],
    signals: text.signals ?? [],
    swingFactors: text.swingFactors ?? [],
    market: mk
      ? {
          operators: mk.operators,
          implied: mk.implied,
          agreement: mk.agreement,
          movement: mk.movement
            ? { days: mk.movement.days, home: mk.movement.home, draw: mk.movement.draw, away: mk.movement.away }
            : undefined,
        }
      : undefined,
    absences,
    press: press ?? undefined,
    summary: text.summary,
    scenario: text.scenario,
    confidence: pred.confidence,
    probabilities: pred.probabilities,
    secondaryScenarios: text.secondaryScenarios ?? [],
    keyStrengths: text.keyStrengths ?? [],
    factors: text.factors ?? [],
    comparison: pred.comparison,
    expectedGoals: pred.expectedGoals,
    markets: pred.markets,
    probableScorers: text.probableScorers ?? [],
    firstScorer: text.firstScorer || undefined,
    keyPlayers: text.keyPlayers ?? [],
  };
}

