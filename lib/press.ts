/**
 * Press digest (SERVER ONLY) — what the media say about a match.
 *
 * A cheap search pass with Claude Haiku 4.5 and the web search server tool,
 * capped at 3 searches, run only inside the last 48 hours before kick-off
 * (before that, line-ups and fitness news don't exist yet). Cached 24h per
 * match by the caller. The model returns a small JSON digest with sources;
 * the URLs are cross-checked against the search results the API actually
 * returned, so a hallucinated link can never reach the page.
 */
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { Match } from "./types";
import type { PressDigest, PressItem } from "./analysis-schema";
import { logAiUsage } from "./ai-cost";
import { parseJson } from "./claude-json";

const MODEL = "claude-haiku-4-5";
const MAX_SEARCHES = 3;
/**
 * Betting sites never make it into the digest — their previews exist to sell
 * odds, and the product has no betting vocabulary. Kept short: the model is
 * told to skip them too; this is the hard stop.
 */
const BLOCKED_DOMAINS = [
  "pensebet.com",
  "sportytrader.com",
  "winamax.fr",
  "betclic.fr",
  "unibet.fr",
  "parionssport.fdj.fr",
  "bet365.com",
  "zebet.fr",
  "pmu.fr",
  "bwin.fr",
  "netbet.fr",
  "vbet.fr",
  "pronosoft.com",
  "rueduprono.com",
  "mondial-pronos.com",
  "oddschecker.com",
  "bettingexpert.com",
  "pronostics-foot.com",
];
/** Press is searched only this close to kick-off. */
export const PRESS_WINDOW_MS = 48 * 3600_000;

const SYSTEM = `Tu es un journaliste sportif qui prépare une revue de presse factuelle avant un match de football. Tu fais au maximum ${MAX_SEARCHES} recherches web, ciblées : (1) compositions probables et absents, (2) contexte, enjeu et déclarations des entraîneurs, (3) actualité des joueurs clés (forme, transferts, polémiques). Tu ne cites que ce que tu as réellement lu dans les résultats, et uniquement des médias sportifs ou généralistes : jamais un site de paris ou de pronostics. Pas de mention de paris, de cotes ni de bookmakers.

Tu réponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{
  "summary": "2-3 phrases : l'histoire du match telle que la presse la raconte",
  "items": [{"title": "titre de l'article", "source": "média (ex. L'Équipe)", "url": "URL exacte d'un résultat de recherche", "date": "date si connue", "takeaway": "1 phrase : ce que ça change pour le match"}],
  "lineups": {"home": "compo probable de l'équipe à domicile en une ligne, ou omis", "away": "idem extérieur, ou omis"}
}
RÈGLES : 3 à 6 items maximum, chacun avec une URL copiée telle quelle depuis les résultats. Si tu ne trouves rien de fiable, renvoie items: [] et un summary honnête.`;

interface RawDigest {
  summary?: string;
  items?: Partial<PressItem>[];
  lineups?: { home?: string; away?: string };
}

export async function fetchPressDigest(match: Match, userId?: string | null): Promise<PressDigest | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const client = new Anthropic({ apiKey });

  const comp = match.competition?.name ?? "Coupe du Monde 2026";
  const user = `Match : ${match.homeTeam.name} vs ${match.awayTeam.name} — ${comp}, ${match.round}, le ${match.date} à ${match.time}${match.stadium ? ` (${match.stadium})` : ""}.
Cherche en français d'abord ; en anglais ou dans la langue locale si la presse française ne couvre pas assez. Aujourd'hui : ${new Date().toISOString().slice(0, 10)}.`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: MAX_SEARCHES,
        blocked_domains: BLOCKED_DOMAINS,
        user_location: { type: "approximate", country: "FR" },
      },
    ],
    messages: [{ role: "user", content: user }],
  });
  await logAiUsage({ kind: "press", model: MODEL, usage: msg.usage, userId });

  // Every URL the search actually returned — the only ones an item may cite.
  const seen = new Map<string, { title: string; age: string | null }>();
  for (const block of msg.content) {
    if (block.type !== "web_search_tool_result" || !Array.isArray(block.content)) continue;
    for (const r of block.content) {
      if (r.type === "web_search_result") seen.set(r.url, { title: r.title, age: r.page_age });
    }
  }

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  let raw: RawDigest;
  try {
    raw = parseJson<RawDigest>(text);
  } catch {
    return null;
  }

  const used = new Set<string>();
  const items: PressItem[] = (raw.items ?? [])
    .filter((it): it is PressItem => Boolean(it.url && seen.has(it.url) && it.title && it.takeaway))
    // One item per article: the model likes to mine a rich preview three times.
    .filter((it) => !used.has(it.url) && used.add(it.url))
    .slice(0, 6)
    .map((it) => ({
      title: clean(it.title),
      source: clean(it.source || hostOf(it.url)),
      url: it.url,
      date: it.date ? clean(it.date) : seen.get(it.url)?.age || undefined,
      takeaway: clean(it.takeaway),
    }));

  const summary = clean(raw.summary ?? "");
  if (!summary && !items.length) return null;
  const lineups =
    raw.lineups && (raw.lineups.home || raw.lineups.away)
      ? { home: raw.lineups.home ? clean(raw.lineups.home) : undefined, away: raw.lineups.away ? clean(raw.lineups.away) : undefined }
      : undefined;
  return { summary, items, lineups, searchedAt: new Date().toISOString() };
}

/**
 * The web search tool wraps quoted passages in `<cite index="…">…</cite>`
 * markers inside the model's text. Useful for provenance, noise for readers.
 */
function clean(text: string): string {
  return text.replace(/<\/?cite[^>]*>/g, "").replace(/\s{2,}/g, " ").trim();
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
