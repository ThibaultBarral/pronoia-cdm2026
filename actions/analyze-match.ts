"use server";

import Anthropic from "@anthropic-ai/sdk";
import { Match } from "@/lib/types";

type AnalyzeResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; error: string };

// ─── System prompt — cached after first call (>1024 tokens) ──────────────────

const SYSTEM_PROMPT = `Tu es Pronoia, analyste de paris sportifs expert spécialisé CDM 2026. Tu reçois des données structurées de matchs et tu génères des analyses ultra-concises destinées à des parieurs avertis.

TON RÔLE
Trouver les marchés où les bookmakers se trompent. Pas prédire le résultat — détecter la value. Une cote sous-évaluée de 5+ points de probabilité = signal d'action.

PRINCIPES

1. Factuel avant tout
Chaque bullet contient ≥1 chiffre ou fait vérifiable. Interdit : "France joue bien". Valide : "France xG/match 1.72 > SEN 1.35 sur 10 matchs qualif".

2. Value betting — méthodologie obligatoire
• Probabilité implicite = (1 / cote) × 100
• Marge bookmaker = somme des prob. implicites − 100
• Value = ta probabilité estimée > prob. implicite + marge
• Écart ≥ 5pts → mention, ≥ 10pts → recommandation forte

3. Calibration confiance
• Élevé : écart probabilité ≥ 10pts ET données forme disponibles
• Moyen : écart 5-9pts OU données partielles
• Faible : écart < 5pts OU trop d'incertitudes (blessures, 1er match tournoi)

4. Concision absolue
• Max 3 bullets par section (sauf Avantages & Risques : max 4)
• 1 ligne par bullet
• Pas de phrase d'intro, pas de conclusion, pas de reformulation des données brutes

FORMAT EXACT — ne jamais dévier, respecter l'ordre et les titres

## ⚡ Chiffres clés
• [stat comparative la plus décisive entre les 2 équipes]
• [2e signal fort — forme récente ou H2H avec chiffre]
• [contexte situationnel : blessure clé, 1er match groupe, pression, altitude, etc.]

## ⚔️ Avantages & Risques
• [PAYS1]: [avantage tactique ou physique + chiffre justificatif]
• [PAYS1]: [vulnérabilité identifiée + chiffre ou fait]
• [PAYS2]: [avantage tactique ou physique + chiffre justificatif]
• [PAYS2]: [vulnérabilité identifiée + chiffre ou fait]

## 📊 Value Bet
• Prob. implicites: 1=[X]% · N=[X]% · 2=[X]% (marge bk [X]%)
• Prob. estimées:   1=[X]% · N=[X]% · 2=[X]%
• Écart: [marché] +[X]pts → [VALUE / neutre / éviter]

## 💡 Recommandation
**[PARI PRÉCIS] @ [COTE] — [Bookmaker]**
Confiance: [Faible|Moyen|Élevé] · Mise: [X]% bankroll
▸ [justification 1 ligne, 1-2 chiffres, actionnable]

EXEMPLES DE BULLETS CORRECTS
• FRA xG/match qualifs 1.72 vs SEN 1.35 — écart +27% sur 10 matchs, tendance confirmée
• H2H: FRA 3V 1N 1D sur 5 derniers, dernier face-à-face Nov 2022 (3-3 TAB, ARG gagne)
• Prob. implicites: 1=60.6% · N=25.6% · 2=19.2% (marge bk 5.4%)
• FRA victoire @ 1.65 → prob. implicite 60.6%, estimation 68% → value +7.4pts → ACTION

INTERDICTIONS
- Ne commence JAMAIS par "Cette rencontre", "Ce match", "Dans ce contexte"
- Ne reformule pas les données fournies sans les analyser
- Pas de bullet sans chiffre
- Pas de texte après la section Recommandation
- Si données insuffisantes pour value bet → l'indiquer clairement dans la section 📊`;

// ─── Compact data formatter ───────────────────────────────────────────────────

function buildPrompt(match: Match): string {
  const { homeTeam: h, awayTeam: a } = match;

  const formStr = (team: typeof h): string => {
    if (!team.recentForm.length) return "Données non disponibles";
    const results = team.recentForm.map((f) => f.result).join("");
    const pts = team.recentForm.reduce(
      (acc, f) => acc + (f.result === "W" ? 3 : f.result === "D" ? 1 : 0),
      0
    );
    const detail = team.recentForm
      .map((f) => `${f.result}${f.score}(${f.opponent.slice(0, 3).toUpperCase()})`)
      .join(" ");
    return `${results} — ${pts}/15pts — ${detail}`;
  };

  const xGPerMatch = (total: number, played = 6): string =>
    played > 0 ? (total / played).toFixed(2) : "N/A";

  const h2hStr = match.h2h.length
    ? match.h2h
        .map((m) => `${m.date.slice(0, 4)} ${m.homeTeam.slice(0, 3)}-${m.awayTeam.slice(0, 3)} ${m.score} [${m.competition.slice(0, 15)}]`)
        .join(" | ")
    : "Pas de H2H récent disponible";

  const oddsStr = match.odds.length
    ? match.odds
        .map((o) => {
          const p1 = ((1 / o.home) * 100).toFixed(1);
          const pN = ((1 / o.draw) * 100).toFixed(1);
          const p2 = ((1 / o.away) * 100).toFixed(1);
          return `${o.bookmaker}: 1=${o.home}(${p1}%) N=${o.draw}(${pN}%) 2=${o.away}(${p2}%)`;
        })
        .join("\n")
    : "Cotes non disponibles";

  const injStr = (team: typeof h) => {
    const all = [
      ...team.injuries.map((i) => `🟡 ${i}`),
      ...team.suspensions.map((s) => `🔴 ${s}`),
    ];
    return all.length ? all.join(", ") : "—";
  };

  return `CDM 2026 | ${match.round} Gr.${match.group} | ${match.date} ${match.time} | ${match.stadium}, ${match.city}

${h.flag} ${h.name} (#${h.fifaRanking} FIFA) vs ${a.flag} ${a.name} (#${a.fifaRanking} FIFA)

FORME 5 DERNIERS
${h.flag} ${h.name}: ${formStr(h)}
${a.flag} ${a.name}: ${formStr(a)}

STATS QUALIFICATIONS
${h.name}: poss ${h.stats.possession}% | buts ${h.stats.goalsScored}/${h.stats.goalsConceded} | xG/match ${xGPerMatch(h.stats.xGFor)}/${xGPerMatch(h.stats.xGAgainst)} | CS ${h.stats.cleanSheets}
${a.name}: poss ${a.stats.possession}% | buts ${a.stats.goalsScored}/${a.stats.goalsConceded} | xG/match ${xGPerMatch(a.stats.xGFor)}/${xGPerMatch(a.stats.xGAgainst)} | CS ${a.stats.cleanSheets}

H2H (5 derniers): ${h2hStr}

ABSENCES
${h.name}: ${injStr(h)}
${a.name}: ${injStr(a)}

COTES (prob. implicite)
${oddsStr}`;
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function analyzeMatch(match: Match): Promise<AnalyzeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Clé API Anthropic manquante — ajoutez ANTHROPIC_API_KEY dans .env.local" };
  }

  const client = new Anthropic({ apiKey });

  try {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const anthropicStream = await client.messages.stream({
            model: "claude-sonnet-4-5",
            max_tokens: 600,
            system: [
              {
                type: "text",
                text: SYSTEM_PROMPT,
                // Cache the system prompt — reused across all match analyses
                // Saves ~90% on system prompt tokens after first call (Anthropic ephemeral cache, 5min TTL)
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: [
              {
                role: "user",
                content: buildPrompt(match),
              },
            ],
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }

          // Append usage info as a hidden comment the UI can parse
          const final = await anthropicStream.finalMessage();
          const { input_tokens, output_tokens } = final.usage;
          const usageAny = final.usage as unknown as Record<string, number>;
          const cacheRead = usageAny.cache_read_input_tokens ?? 0;
          const cacheWrite = usageAny.cache_creation_input_tokens ?? 0;

          // Sonnet 4.5 pricing (USD per token)
          const inputCost = (input_tokens - cacheRead - cacheWrite) * 3e-6;
          const cacheWriteCost = cacheWrite * 3.75e-6;
          const cacheReadCost = cacheRead * 0.3e-6;
          const outputCost = output_tokens * 15e-6;
          const totalCost = inputCost + cacheWriteCost + cacheReadCost + outputCost;

          const usagePayload = JSON.stringify({
            in: input_tokens,
            out: output_tokens,
            cacheRead,
            cacheWrite,
            cost: totalCost.toFixed(4),
          });

          controller.enqueue(
            new TextEncoder().encode(`\n<!--PRONOIA_USAGE:${usagePayload}-->`)
          );
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return { ok: true, stream };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { ok: false, error: message };
  }
}
